import { hasAnyConfiguredEnv, hasConfiguredEnv, hasProviderEnv } from "./providers/env.ts";
import { isProductAdProduction } from "./queue-policy";

export type ProviderReadinessStatus = "ready" | "missing" | "optional";

function hasHeyGenEnv() {
  return hasProviderEnv("heygen") || hasAnyConfiguredEnv(["HEYGEN_API_KEY", "HEYGEN_KEY"]);
}

function hasStorageEnv() {
  return hasAnyConfiguredEnv(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "NEXT_PUBLIC_SUPABASE_URL"]);
}

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
    status: requiredEnv.every((name) => hasConfiguredEnv(name)) || (key === "video_provider" && (hasAnyConfiguredEnv(["REPLICATE_API_TOKEN", "REPLICATE_API_KEY", "FAL_KEY", "FAL_API_KEY", "RUNWAY_API_KEY", "DEV_RUNWAY_API_KEY", "DEV_RUWAY_API_KEY", "KLING_API_KEY", "KLING_AI_API_KEY"]) || hasAnyConfiguredEnv(["MINIMAX_API_KEY", "MINIMAX_KEY"]))) || (key === "voice_provider" && hasProviderEnv("elevenlabs")) || (key === "render_provider" && hasProviderEnv("shotstack")) ? "ready" : optional ? "optional" : "missing"
  };
}

export function providerRequirementsForProduction(productionType: string, packageId = "") {
  const type = productionType || "general";
  const hasPlanningBrain = hasAnyConfiguredEnv(["OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"]);
  const requirements: ProviderRequirement[] = [
    {
      key: "planning_brain",
      label: "AI planning/brain",
      requiredEnv: ["OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY"],
      affects: ["assistant brief", "script", "production plan"],
      note: "Needed for live assistant planning, scripts, briefs and content generation. OpenAI or Gemini is sufficient.",
      status: hasPlanningBrain ? "ready" : "optional"
    }
  ];

  const minimaxBackedTalkingTypes = ["avatar", "talking_video", "lip_sync", "live_sales_agent"];
  const needsVideoProvider = (["video", "campaign", "music_video", "stickman_animation", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "studio", "drama", "cinematic_video", "video_tools", "video_clipping", "localization", "cultural_localization", ...minimaxBackedTalkingTypes].includes(type) || packageId.includes("video"));
  const needsImageProvider = ["image", "brand_kit", "visual_clone", "virtual_model_studio"].includes(type) || packageId.includes("visual_clone");
  const isDirectPromoPackage = isProductAdProduction(packageId, type);
  const needsEcommerceAdPipeline = isDirectPromoPackage;

  if (needsVideoProvider) {
    requirements.push(requirement("video_provider", "Video/generation provider", ["REPLICATE_API_TOKEN", "MINIMAX_API_KEY", "MINIMAX_GROUP_ID"], ["final MP4", "visual job", "motion generation"], "At least one real video provider key is required for non-demo video output. Minimax, Replicate, FAL, Runway or Kling can satisfy the route depending on provider selection."));
  }

  if (needsImageProvider) {
    const imageProviderConfigured = hasAnyConfiguredEnv(["STABILITY_API_KEY", "FAL_KEY", "FAL_API_KEY", "REPLICATE_API_TOKEN", "REPLICATE_API_KEY"]);
    requirements.push({
      key: "image_provider",
      label: "Image generation provider",
      requiredEnv: ["STABILITY_API_KEY or FAL_API_KEY or REPLICATE_API_TOKEN"],
      affects: ["final image", "visual clone output"],
      note: "A real image provider is required for downloadable visual output. Reference-based clone requests use a provider that accepts image references.",
      status: imageProviderConfigured ? "ready" : "missing"
    });
  }

  // Talking/avatar/lip-sync/live-sales categories now use the selected video provider route.
  // In the current Minimax setup this means MiniMax-H3 creates the visual job instead of blocking on HeyGen.

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
      note: "Required when the selected production includes generated background music; Stable Audio is primary and Mubert is the secondary fallback. Use manual licensed music if both are missing.",
      status: hasProviderEnv("stableAudio") || hasProviderEnv("stability") || hasProviderEnv("mubert") ? "ready" : "optional"
    });
    requirements.push(requirement("render_provider", "Shotstack render provider", ["SHOTSTACK_API_KEY"], ["final rendered MP4", "video + voice + subtitle assembly"], "Required when voice, music or subtitles must be assembled into the final customer-ready video.", true));
  }

  if (["website", "saas", "mobile_app", "admin_project"].includes(type)) {
    requirements.push(requirement("source_packager", "Source/package builder", ["OPENAI_API_KEY"], ["source code", "admin panel", "README", "deployment guide"], "Needed for live generated source/project package content."));
  }

  requirements.push({
    key: "storage",
    label: "Supabase storage",
    requiredEnv: ["SUPABASE_SERVICE_ROLE_KEY"],
    affects: ["materials", "provider assets", "delivery files"],
    note: "Server storage access is needed for uploads and final delivery links.",
    status: hasStorageEnv() ? "ready" : "optional"
  });
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
