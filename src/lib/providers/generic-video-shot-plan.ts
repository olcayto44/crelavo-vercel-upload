export type GenericVideoShot = {
  index: number;
  prompt: string;
};

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
    return { index: index + 1, prompt: scene };
  });
}

export function orderedReadyShotUrls(statuses: Array<{ status?: string | null; outputUrl?: string | null }>) {
  return statuses.filter((status) => status.status === "succeeded" && status.outputUrl).map((status) => String(status.outputUrl));
}

export function multiShotFinalGate(input: {
  targetDurationSeconds: number;
  visualStatuses: Array<{ status?: string | null; outputUrl?: string | null }>;
  renderStatus?: { status?: string | null; outputUrl?: string | null } | null;
}) {
  const shotCount = genericVideoShotCount(input.targetDurationSeconds);
  if (shotCount === 1) return { required: false, passed: Boolean(input.renderStatus?.outputUrl || input.visualStatuses[0]?.outputUrl), reason: "single_shot" };
  const allVisualsReady = input.visualStatuses.length === shotCount
    && input.visualStatuses.every((status) => status.status === "succeeded" && Boolean(status.outputUrl));
  const renderReady = input.renderStatus?.status === "succeeded" && Boolean(input.renderStatus.outputUrl);
  return {
    required: true,
    passed: allVisualsReady && renderReady,
    reason: !allVisualsReady ? "waiting_for_all_shots" : !renderReady ? "waiting_for_merged_render" : "ready"
  };
}
