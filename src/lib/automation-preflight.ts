export type AutomationPreflightInput = {
  productionType: string;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  videoProvider?: string;
  replicateModel?: string;
};

function metadataObject(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function textFrom(...values: unknown[]) {
  return values.map((value) => String(value ?? "")).join(" ").toLowerCase();
}

function selectedFeatureFlags(requestMetadata: Record<string, unknown>, inputJson: Record<string, unknown>) {
  const haystack = textFrom(
    requestMetadata.features,
    inputJson.features,
    requestMetadata.voiceProfile,
    inputJson.voiceProfile,
    requestMetadata.voiceLanguage,
    inputJson.voiceLanguage,
    requestMetadata.musicProfile,
    inputJson.musicProfile,
    requestMetadata.environmentProfile,
    inputJson.environmentProfile,
    JSON.stringify(requestMetadata.characterVoiceConsistencyPlan ?? ""),
    JSON.stringify(inputJson.characterVoiceConsistencyPlan ?? ""),
    requestMetadata.selectedProviderService,
    inputJson.selectedProviderService,
    metadataObject(requestMetadata.deliveryRequirements).formats,
    metadataObject(inputJson.deliveryRequirements).formats,
    requestMetadata.targetPlatform,
    inputJson.targetPlatform
  );
  return {
    voiceOver: /voice|voice-over|voiceover|seslendirme|own voice|ai voice|narration/.test(haystack),
    music: /music|background music|müzik|muzik|soundtrack|audio reference/.test(haystack),
    subtitles: /subtitle|subtitles|altyaz/.test(haystack),
    finalRender: /mp4|mov|webm|download|dashboard|render|subtitle|voice|music/.test(haystack),
    characterConsistency: /charactercontinuity|character|karakter|identity|avatar|same character|consistent|continuity|tutarlı|tutarli/.test(haystack),
    voiceConsistency: /voicecontinuity|voice|ses|speaker|multi-speaker|lip-sync|language/.test(haystack)
  };
}

function selectedAspectRatio(requestMetadata: Record<string, unknown>, inputJson: Record<string, unknown>) {
  const explicit = String(
    requestMetadata.aspectRatio ??
    requestMetadata.aspect_ratio ??
    inputJson.aspectRatio ??
    inputJson.aspect_ratio ??
    ""
  ).trim();
  if (explicit) return explicit;

  const haystack = textFrom(requestMetadata.quality, inputJson.quality, requestMetadata.targetPlatform, inputJson.targetPlatform);
  if (/16:9|horizontal|youtube|1080p|landscape/.test(haystack)) return "16:9";
  if (/1:1|square/.test(haystack)) return "1:1";
  if (/9:16|vertical|story|reels|shorts|tiktok|instagram/.test(haystack)) return "9:16";
  return "9:16";
}

export function buildProviderPreflight(input: AutomationPreflightInput) {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const providerTestMode = Boolean(requestMetadata.providerTestMode ?? inputJson.providerTestMode);
  const isProjectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(input.productionType);
  const requestedDuration = providerTestMode
    ? 5
    : firstNumber(
      requestMetadata.outputDurationSeconds,
      inputJson.outputDurationSeconds,
      requestMetadata.output_duration_seconds,
      inputJson.output_duration_seconds,
      metadataObject(requestMetadata.outputPlan).durationSeconds,
      metadataObject(inputJson.outputPlan).durationSeconds,
      metadataObject(requestMetadata.ecommerceContext).targetDurationSeconds,
      metadataObject(inputJson.ecommerceContext).targetDurationSeconds,
      8
    );
  const selectedProviderText = textFrom(requestMetadata.selectedProviderService, inputJson.selectedProviderService, requestMetadata.provider_service, inputJson.provider_service);
  const selectedVideoProvider = selectedProviderText.includes("kling") ? "kling" : selectedProviderText.includes("runway") ? "runway" : selectedProviderText.includes("fal") ? "fal" : selectedProviderText.includes("replicate") ? "replicate" : "";
  const videoProvider = selectedVideoProvider || input.videoProvider || "runway";
  const aspectRatio = selectedAspectRatio(requestMetadata, inputJson);
  const featureFlags = selectedFeatureFlags(requestMetadata, inputJson);

  if (isProjectProduction) {
    return {
      provider: "project_package_builder",
      model: String(metadataObject(requestMetadata.projectWorkflow).technicalStack ?? "managed_source_delivery"),
      durationSeconds: 0,
      aspectRatio: "responsive",
      testMode: providerTestMode,
      selectedOptions: featureFlags
    };
  }

  return {
    provider: videoProvider,
    model: videoProvider === "replicate" ? input.replicateModel || "wan-video/wan-2.2-t2v-fast" : videoProvider,
    durationSeconds: requestedDuration,
    aspectRatio,
    testMode: providerTestMode,
    selectedOptions: featureFlags
  };
}
