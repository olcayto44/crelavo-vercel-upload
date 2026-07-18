export type RenderQueueTier = "standard" | "priority" | "fastest" | "dedicated";

export type RenderQueuePolicy = {
  tier: RenderQueueTier;
  label: string;
  description: string;
  userMessage: string;
  activeJobWeight: number;
};

const policies: Record<RenderQueueTier, RenderQueuePolicy> = {
  standard: {
    tier: "standard",
    label: "Standard render queue",
    description: "Starter and one-time top-up users enter the standard production queue after credits are reserved.",
    userMessage: "Your production is queued in the standard render queue. You can leave the page; we will notify you when it is ready.",
    activeJobWeight: 1
  },
  priority: {
    tier: "priority",
    label: "Priority render queue",
    description: "Pro users receive priority over standard queued jobs while keeping provider costs controlled.",
    userMessage: "Your production is queued with Pro priority. We will start it as soon as a render slot is available.",
    activeJobWeight: 1
  },
  fastest: {
    tier: "fastest",
    label: "Fastest render queue",
    description: "Business and Ultra users receive the fastest shared queue before dedicated team lanes.",
    userMessage: "Your production is queued in the fastest shared render lane. We will email you when it is ready.",
    activeJobWeight: 1
  },
  dedicated: {
    tier: "dedicated",
    label: "Dedicated production priority",
    description: "Team workspaces receive the highest priority lane for client and agency production workflows.",
    userMessage: "Your team production has dedicated priority. It will start ahead of standard shared-queue jobs.",
    activeJobWeight: 1
  }
};

export function renderQueuePolicyForPackage(packageId: string): RenderQueuePolicy {
  const normalized = packageId.trim().toLowerCase();
  if (normalized === "team") return policies.dedicated;
  if (normalized === "business" || normalized === "ultra") return policies.fastest;
  if (normalized === "pro") return policies.priority;
  return policies.standard;
}

export function safeActiveVideoJobLimit() {
  const value = Number(process.env.VIDEO_PROVIDER_ACTIVE_JOB_LIMIT ?? 5);
  if (!Number.isFinite(value) || value < 1) return 5;
  return Math.min(Math.floor(value), 50);
}

export function launchCapacityPolicy() {
  return {
    publicTraffic: "Open after domain, SSL, smoke and build checks pass.",
    assistantBriefs: "Keep open with OpenAI usage monitoring during the first launch week.",
    activeVideoJobs: `Safe launch target is 1-5 active video provider jobs. Current configured cap: ${safeActiveVideoJobLimit()}.`,
    scalePath: "Scale gradually from 5 to 10, then 20, then 50 only after provider cost, queue delay and failure-rate data are known.",
    queueExperience: "More users can submit productions than the active provider job cap; overflow jobs stay queued with status tracking and email completion notification."
  };
}

export function isVideoLikeProductionType(productionType: string) {
  return [
    "video",
    "campaign",
    "music_video",
    "stickman_animation",
    "anime_short_film",
    "animal_video",
    "nature_video",
    "planet_space_video",
    "cinematic_video",
    "video_tools",
    "video_clipping",
    "avatar",
    "lip_sync",
    "localization"
  ].includes(productionType.trim().toLowerCase());
}
