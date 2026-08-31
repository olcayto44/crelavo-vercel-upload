export type GenericVideoShot = {
  index: number;
  prompt: string;
  requestedDurationSeconds: 5;
};

export type MiniMaxShotQueueState = {
  provider: "minimax";
  status: "queued" | "submitting_shot" | "queued_complete" | "failed";
  nextShotIndex: number;
  claimedShotIndex: number | null;
  expectedShotCount: number;
  durable: true;
};

export async function advanceShotQueue(input: {
  queue: MiniMaxShotQueueState;
  jobs: Array<Record<string, unknown>>;
  shotPlan: GenericVideoShot[];
  submit: (shot: GenericVideoShot, idempotencyKey: string) => Promise<Record<string, unknown>>;
}) {
  const { queue, jobs, shotPlan } = input;
  if (queue.status === "failed" || queue.status === "queued_complete") return { queue, jobs, advanced: false };
  if (queue.claimedShotIndex !== null) return { queue, jobs, advanced: false };
  if (jobs.length >= queue.expectedShotCount) return { queue: { ...queue, status: "queued_complete", nextShotIndex: queue.expectedShotCount + 1 }, jobs, advanced: false };
  const shotIndex = queue.nextShotIndex;
  const shot = shotPlan[shotIndex - 1];
  if (!shot || shotIndex !== jobs.length + 1) return { queue: { ...queue, status: "failed", claimedShotIndex: null }, jobs, advanced: false };
  const claimedQueue = { ...queue, status: "submitting_shot" as const, claimedShotIndex: shotIndex };
  const job = await input.submit(shot, `${shotIndex}`);
  const nextJobs = [...jobs, { ...job, shotIndex, requestedDurationSeconds: 5 }];
  return {
    queue: { ...claimedQueue, status: nextJobs.length >= queue.expectedShotCount ? "queued_complete" as const : "queued" as const, claimedShotIndex: null, nextShotIndex: nextJobs.length + 1 },
    jobs: nextJobs,
    advanced: true
  };
}

export function genericVideoShotCount(targetDurationSeconds: number) {
  const duration = Number(targetDurationSeconds) || 0;
  return duration > 5 ? Math.ceil(duration / 5) : 1;
}

export function buildGenericVideoShotPlan(scenes: string[], targetDurationSeconds: number): GenericVideoShot[] {
  const count = genericVideoShotCount(targetDurationSeconds);
  const sourceScenes = scenes.map((scene) => String(scene ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
  const fallback = sourceScenes[0] || "Continue the planned visual story with a distinct product-focused beat.";
  return Array.from({ length: count }, (_, index) => {
    const scene = sourceScenes[index] || `${fallback} Continue with distinct segment ${index + 1}, advancing the visual story without repeating the previous shot.`;
    return { index: index + 1, prompt: scene, requestedDurationSeconds: 5 };
  });
}

export function orderedReadyShotUrls(statuses: Array<{ status?: string | null; outputUrl?: string | null }>) {
  return statuses.filter((status) => status.status === "succeeded" && status.outputUrl).map((status) => String(status.outputUrl));
}

export function multiShotFinalGate(input: {
  targetDurationSeconds: number;
  visualStatuses: Array<{ status?: string | null; outputUrl?: string | null }>;
  expectedJobCount?: number;
  renderStatus?: { status?: string | null; outputUrl?: string | null } | null;
}) {
  const shotCount = genericVideoShotCount(input.targetDurationSeconds);
  if (shotCount === 1) return { required: false, passed: Boolean(input.renderStatus?.outputUrl || input.visualStatuses[0]?.outputUrl), reason: "single_shot" } as const;
  const actualJobCount = input.expectedJobCount ?? input.visualStatuses.length;
  if (actualJobCount !== shotCount) return { required: true, passed: false, reason: "provider_start_failed_partial" } as const;
  const allVisualsReady = input.visualStatuses.length === shotCount
    && input.visualStatuses.every((status) => status.status === "succeeded" && Boolean(status.outputUrl));
  const renderReady = input.renderStatus?.status === "succeeded" && Boolean(input.renderStatus.outputUrl);
  return {
    required: true,
    passed: allVisualsReady && renderReady,
    reason: !allVisualsReady ? "waiting_for_all_shots" : !renderReady ? "waiting_for_merged_render" : "ready"
  } as const;
}
