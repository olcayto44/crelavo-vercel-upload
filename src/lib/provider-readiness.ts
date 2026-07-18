export type ProviderReadinessStatus = "ready" | "missing" | "optional";

export type ProviderRequirement = {
  key: string;
  label: string;
  status: ProviderReadinessStatus;
  requiredEnv: string[];
  affects: string[];
  note: string;
};

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => hasEnv(name));
}

function requirement(key: string, label: string, requiredEnv: string[], affects: string[], note: string, optional = false): ProviderRequirement {
  return {
    key,
    label,
    requiredEnv,
    affects,
    note,
    status: requiredEnv.every((name) => hasEnv(name)) || (key === "video_provider" && hasAnyEnv(["REPLICATE_API_TOKEN", "FAL_KEY", "FAL_API_KEY", "RUNWAY_API_KEY", "KLING_API_KEY"])) ? "ready" : optional ? "optional" : "missing"
  };
}

export function providerRequirementsForProduction(productionType: string, packageId = "") {
  const type = productionType || "general";
  const requirements: ProviderRequirement[] = [
    requirement("openai", "OpenAI planning/brain", ["OPENAI_API_KEY"], ["assistant brief", "script", "production plan"], "Needed for live assistant planning, scripts, briefs and code/content generation.")
  ];

  if (["video", "campaign", "music_video", "stickman_animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "cinematic_video", "video_tools", "video_clipping", "avatar", "lip_sync", "localization", "talking_video"].includes(type) || packageId.includes("video")) {
    requirements.push(requirement("video_provider", "Video/generation provider", ["REPLICATE_API_TOKEN"], ["final MP4", "visual job", "motion generation"], "At least one real video provider key is required for non-demo video output."));
  }

  if (["talking_video", "avatar", "lip_sync", "voice_clone", "dubbing"].includes(type) || packageId.includes("voice")) {
    requirements.push(requirement("voice_provider", "Voice/speech provider", ["ELEVENLABS_API_KEY"], ["voice-over", "voice clone", "dubbing", "lip-sync audio"], "Required when the selected production includes voice cloning or generated speech.", true));
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
