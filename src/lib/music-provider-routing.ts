import { hasProviderEnv, providerEnvNames } from "@/lib/providers/env";

export type MusicProviderRoute = {
  primary: "stable-audio" | "mubert" | "manual";
  fallback: "mubert" | "manual";
  ready: boolean;
  costGuard: {
    estimatedCredits: number;
    maxCreditsBeforeReview: number;
    policy: string;
  };
  requiredEnv: Record<string, string[]>;
  nextSteps: string[];
};

function numericEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function buildMusicProviderRoute(): MusicProviderRoute {
  const stableReady = hasProviderEnv("stableAudio") || hasProviderEnv("stability");
  const mubertReady = hasProviderEnv("mubert");
  const estimatedCredits = numericEnv("MUSIC_GENERATION_ESTIMATED_CREDITS", 350);
  const maxCreditsBeforeReview = numericEnv("MUSIC_GENERATION_REVIEW_CREDIT_LIMIT", 1200);
  return {
    primary: stableReady ? "stable-audio" : mubertReady ? "mubert" : "manual",
    fallback: mubertReady ? "mubert" : "manual",
    ready: stableReady || mubertReady,
    costGuard: {
      estimatedCredits,
      maxCreditsBeforeReview,
      policy: "Stable Audio is primary, Mubert is secondary. If estimated music cost is above review limit or no API key is configured, use manual licensed music fallback."
    },
    requiredEnv: {
      stableAudio: ["STABLE_AUDIO_API_KEY or STABILITY_API_KEY", ...providerEnvNames("stableAudio")],
      mubert: providerEnvNames("mubert")
    },
    nextSteps: stableReady
      ? ["Use Stable Audio for generated BGM/song beds", "Measure duration/cost after generation", "Store provider response in production output_json"]
      : mubertReady
        ? ["Use Mubert as fallback music provider", "Keep Stable Audio marked as primary target", "Store provider response in production output_json"]
        : ["Keep music as manual licensed fallback", "Do not promise generated music until one API provider is ready"]
  };
}
