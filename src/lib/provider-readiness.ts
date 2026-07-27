import { hasAnyConfiguredEnv, hasConfiguredEnv, hasProviderEnv } from "./providers/env.ts";

export type ProviderReadinessStatus = "ready" | "missing" | "optional";

export type ProviderRequirement = {
  key: string;
  label: string;
  status: ProviderReadinessStatus;
  requiredEnv: string[];
  affects: string[];
  note: string;
};

function requirement(key: string, label: string, requiredEnv: string[], affects: string[], note: string, optional = false): ProviderRequirement {
  return {
    key,
    label,
    requiredEnv,
    affects,
    note,
    status: requiredEnv.every((name) => hasConfiguredEnv(name)) || (key === "video_provider" && hasAnyConfiguredEnv(["REPLICATE_API_TOKEN", "REPLICATE_API_KEY", "FAL_KEY", "FAL_API_KEY", "RUNWAY_API_KEY", "DEV_RUNWAY_API_KEY", "DEV_RUWAY_API_KEY", "KLING_API_KEY", "KLING_AI_API_KEY"])) || (key === "voice_provider" && hasProviderEnv("elevenlabs")) || (key === "render_provider" && hasProviderEnv("shotstack")) ? "ready" : optional ? "optional" : "missing"
  };
}

export function providerRequirementsForProduction(productionType: string, packageId = "") {
  const type = productionType || "general";
  const requirements: ProviderRequirement[] = [
    requirement("openai", "OpenAI planning/brain", ["OPENAI_API_KEY"], ["assistant brief", "script", "production plan"], "Needed for live assistant planning, scripts, briefs and code/content generation.")
  ];

  const needsVideoProvider = ["video", "campaign", "music_video", "stickman_animation", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "studio", "drama", "cinematic_video", "video_tools", "video_clipping", "avatar", "lip_sync", "localization", "cultural_localization", "talking_video"].includes(type) || packageId.includes("video");
  const needsEcommerceAdPipeline = type === "campaign" || packageId === "campaign_product_ad_video";

  if (needsVideoProvider) {
    requirements.push(requirement("video_provider", "Video/generation provider", ["REPLICATE_API_TOKEN"], ["final MP4", "visual job", "motion generation"], "At least one real video provider key is required for non-demo video output."));
  }

  if (needsEcommerceAdPipeline) {
    requirements.push(requirement("voice_provider", "ElevenLabs voice-over provider", ["ELEVENLABS_API_KEY"], ["ad voice-over", "voice audio asset"], "Required for the real e-commerce ad pipeline voice-over."));
    requirements.push(requirement("render_provider", "Shotstack render provider", ["SHOTSTACK_API_KEY"], ["final rendered MP4", "video + voice + subtitle assembly"], "Required to render the final customer-ready ad video after visual output is ready."));
  } else if (["video", "talking_video", "avatar", "lip_sync", "voice_clone", "dubbing", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drama", "cinematic_video", "music_video", "localization"].includes(type) || packageId.includes("voice")) {
    requirements.push(requirement("voice_provider", "Voice/speech provider", ["ELEVENLABS_API_KEY"], ["voice-over", "voice clone", "dubbing", "lip-sync audio"], type === "voice_clone" ? "Voice clone work requires ElevenLabs plus explicit reference-audio rights confirmation before any cloned voice can be used." : "Required when the selected production includes voice cloning or generated speech.", type !== "voice_clone"));
    requirements.push({
      key: "music_provider",
      label: "Music/background provider",
      requiredEnv: ["STABLE_AUDIO_API_KEY", "MUBERT_API_KEY"],
      affects: ["background music", "music bed", "soundtrack"],
      note: "Required when the selected production includes generated background music; Stable Audio or Mubert can satisfy this route.",
      status: hasProviderEnv("stableAudio") || hasProviderEnv("mubert") ? "ready" : "optional"
    });
    requirements.push(requirement("render_provider", "Shotstack render provider", ["SHOTSTACK_API_KEY"], ["final rendered MP4", "video + voice + subtitle assembly"], "Required when voice, music or subtitles must be assembled into the final customer-ready video.", true));
  }

  if (["website", "saas", "mobile_app", "admin_project"].includes(type)) {
    requirements.push(requirement("source_packager", "Source/package builder", ["OPENAI_API_KEY"], ["source code", "admin panel", "README", "deployment guide"], "Needed for live generated source/project package content."));
  }

  requirements.push(requirement("storage", "Supabase storage", ["SUPABASE_SERVICE_ROLE_KEY"], ["materials", "provider assets", "delivery files"], "Server storage access is needed for uploads and final delivery links."));
  requirements.push(requirement("email", "Resend email", ["RESEND_API_KEY"], ["completion email", "receipt/follow-up", "support"], "Optional before launch, required for automatic completion emails.", true));

  return requirements;
}

export function providerReadinessSummary(productionType: string, packageId = "") {
  const requirements = providerRequirementsForProduction(productionType, packageId);
  const blocking = requirements.filter((item) => item.status === "missing");
  const optionalMissing = requirements.filter((item) => item.status === "optional");
  return {
    status: blocking.length > 0 ? "waiting_provider_config" : "provider_ready",
    canStartRealProvider: blocking.length === 0,
    blocking,
    optionalMissing,
    requirements,
    userMessage: blocking.length > 0
      ? "Production scope is ready, but one or more provider/API keys are missing. Demo delivery can be prepared until providers are connected."
      : "Provider requirements are ready for real production start."
  };
}
