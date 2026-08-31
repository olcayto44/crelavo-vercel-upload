import { hasProviderEnv } from "./providers/env.ts";
import { hasMiniMaxVideoConfig } from "./providers/minimax.ts";

export type AutomationPreflightInput = {
  productionType: string;
  packageId?: string;
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
    const raw = String(value ?? "");
    const parsed = Number(value);
    const fromText = Number(raw.match(/\d+/)?.[0] ?? 0);
    const candidate = Number.isFinite(parsed) && parsed > 0 ? parsed : fromText;
    if (Number.isFinite(candidate) && candidate > 0) return candidate;
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
    inputJson.targetPlatform,
    JSON.stringify(requestMetadata.selectedOptions ?? ""),
    JSON.stringify(inputJson.selectedOptions ?? ""),
    JSON.stringify(requestMetadata.productionSetup ?? ""),
    JSON.stringify(inputJson.productionSetup ?? "")
  );
  const selectedOptions = [requestMetadata.selectedOptions, inputJson.selectedOptions].filter((value) => value && typeof value === "object") as Record<string, unknown>[];
  const explicitBoolean = (key: string) => selectedOptions.find((value) => typeof value[key] === "boolean")?.[key];
  const noVoice = explicitBoolean("voiceOver") === false || /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|voice-?over\s*(off|none)|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(haystack);
  const noMusic = explicitBoolean("music") === false || /no\s*music|without\s*music|music\s*(off|none)|müzik\s*olmasın|muzik\s*olmasın|müzik\s*yok|muzik\s*yok|sessiz/.test(haystack);
  const noSubtitles = explicitBoolean("subtitles") === false || /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|subtitles?\s*(off|none)|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(haystack);
  const voiceOver = !noVoice && explicitBoolean("voiceOver") !== false && /voice|voice-over|voiceover|seslendirme|seslendirme\s*olsun|own voice|ai voice|narration|anlatıcı|anlatici|çocuk sesi|cocuk sesi|yetişkin nötr ses|yetiskin notr ses|erkek sesi|kadın sesi|kadin sesi/.test(haystack);
  const music = !noMusic && explicitBoolean("music") !== false && /music|background music|müzik|muzik|soundtrack|audio reference/.test(haystack);
  const subtitles = !noSubtitles && explicitBoolean("subtitles") !== false && /subtitle|subtitles|altyaz|otomatik altyaz|yanmış altyaz|yanmis altyaz/.test(haystack);
  return {
    voiceOver,
    music,
    subtitles,
    finalRender: /render|burned subtitles|lip-sync|lip sync|final\s*mp4|final[_\s-]*video|dashboard\s*delivery|download\s*delivery/.test(haystack) || voiceOver || music || subtitles,
    characterConsistency: /charactercontinuity|character|karakter|identity|avatar|same character|consistent|continuity|tutarlı|tutarli/.test(haystack),
    voiceConsistency: !noVoice && /voicecontinuity|speaker|multi-speaker|lip-sync|language/.test(haystack)
  };
}

export function detectCharacterDialogueAnimationNeed(text: string) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const negativeOnlyCharacterSignals = /no\s+(?:cartoon|characters?|talking\s+characters?|lip-?sync|people|presenters?|children)|without\s+(?:cartoon|characters?|lip-?sync|people)|insansız|insansiz|karakter\s+yok|çizgi\s*film\s*yok|cizgi\s*film\s*yok/.test(normalized);
  const saasUiPromo = /crelavo|saas|website\s+link|dashboard|ui\s+dashboard|product\s+ui|website\/saas|premium\s+saas\s+promo|software\s+promo/.test(normalized) && /promo|ad\s*video|video|final\s*mp4|tiktok|reels|shorts|export/.test(normalized);
  if (saasUiPromo || negativeOnlyCharacterSignals) {
    return {
      required: false,
      requiredPipeline: null,
      reason: null,
      signals: {
        sceneCount: 0,
        quotedDialogueCount: 0,
        characterCountSignal: 0,
        explicitDedicatedPipeline: false,
        wantsSpeech: false,
        wantsAnimation: false,
        suppressedBySaasUiOrNegativeGuard: true
      }
    };
  }
  const sceneCount = (normalized.match(/(?:sahne|scene)\s*\d+\s*(?:[,\-–—]\s*\d+\s*[-–—]\s*\d+\s*(?:seconds?|saniye|sec|sn)?)?\s*:/g) ?? []).length;
  const quotedDialogueCount = (text.match(/[“\"][^”\"]{2,140}[”\"]/g) ?? []).length;
  const characterHits = new Set(Array.from(normalized.matchAll(/\b(dede|babaanne|anne|baba|torun\s*\d*|children|child|çocuklar|cocuklar|çocuk|cocuk|family|aile|lamb|kuzu|chicken|tavuk|karakter|character)\b/g)).map((match) => match[1]));
  const explicitDedicatedPipeline = /character-?consistent|multi-?character\s+dialogue|do\s+not\s+use\s+generic\s+prompt-?to-?video|same\s+characters\s+across\s+all\s+scenes|keep\s+the\s+same\s+characters|maintain\s+character\s+consistency|karakter\s+tutarl[ıi]l[ıi]ğ[ıi]|ayn[ıi]\s+kal|ayn[ıi]\s+karakter|karakterler\s+değişmesin|karakterler\s+degismesin/.test(normalized);
  const wantsSpeech = /seslendirme|diyalog|dialogue|konuşma|konusma|konuşsun|konussun|konuşuyor|konusuyor|replik|birbirleriyle|voice-?over|turkish\s+voices?|different\s+voices?|different\s+voice\s+for\s+each|speaker|farkl[ıi]\s+ses|türkçe\s+konuş|turkce\s+konus/.test(normalized);
  const wantsAnimation = /animasyon|çizgi film|cizgi film|cartoon|animation|anime|2d|hikaye|story/.test(normalized);
  const multiCharacterDialogue = characterHits.size >= 2 && wantsSpeech;
  const required = wantsAnimation && (explicitDedicatedPipeline || multiCharacterDialogue || (sceneCount >= 2 && wantsSpeech)) && (sceneCount >= 2 || quotedDialogueCount >= 2 || characterHits.size >= 3);
  return {
    required,
    requiredPipeline: required ? "character_consistent_dialogue_animation" : null,
    reason: required
      ? "Multi-scene character dialogue animation needs locked character sheets, per-character voices, lip-sync and scene continuity; generic prompt-to-video is not reliable enough."
      : null,
    signals: {
      sceneCount,
      quotedDialogueCount,
      characterCountSignal: characterHits.size,
      explicitDedicatedPipeline,
      wantsSpeech,
      wantsAnimation
    }
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
  if (/^\d+\s*:\s*\d+$/.test(explicit)) return explicit.replace(/\s+/g, "");

  const haystack = textFrom(requestMetadata.quality, inputJson.quality, requestMetadata.targetPlatform, inputJson.targetPlatform);
  if (/9:16|vertical|story|reels|shorts|tiktok|instagram/.test(haystack)) return "9:16";
  if (/1:1|square/.test(haystack)) return "1:1";
  if (/16:9|horizontal|youtube|landscape/.test(haystack)) return "16:9";
  return "9:16";
}

export function buildProviderPreflight(input: AutomationPreflightInput) {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const providerTestMode = Boolean(requestMetadata.providerTestMode ?? inputJson.providerTestMode);
  const isProjectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(input.productionType);
  const explicitDuration = firstNumber(
    requestMetadata.outputDurationSeconds,
    inputJson.outputDurationSeconds,
    requestMetadata.output_duration_seconds,
    inputJson.output_duration_seconds,
    metadataObject(requestMetadata.outputPlan).durationSeconds,
    metadataObject(inputJson.outputPlan).durationSeconds,
    requestMetadata.selectedDuration,
    inputJson.selectedDuration,
    requestMetadata.selected_duration,
    inputJson.selected_duration,
    metadataObject(requestMetadata.productionSetup).duration,
    metadataObject(inputJson.productionSetup).duration,
    metadataObject(requestMetadata.ecommerceContext).targetDurationSeconds,
    metadataObject(inputJson.ecommerceContext).targetDurationSeconds
  );
  const requestedDuration = Math.min(15, Math.max(5, explicitDuration || 5));
  const selectedProviderText = textFrom(requestMetadata.selectedProviderService, inputJson.selectedProviderService, requestMetadata.provider_service, inputJson.provider_service).toLowerCase();
  const selectedVideoProvider = selectedProviderText.includes("minimax") ? "minimax" : selectedProviderText.includes("kling") ? "kling" : selectedProviderText.includes("runway") ? "runway" : selectedProviderText.includes("fal") ? "fal" : selectedProviderText.includes("replicate") ? "replicate" : "";
  const productionNeedsRealVideo = ["animation", "anime_short_film", "stickman_animation", "drone_video", "cinematic_video", "music_video", "video_clipping", "video"].includes(input.productionType);
  const talkingVideoIntent = ["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(input.productionType) || /talking video|talking head|avatar|lip sync|lip-sync|ugc|live sales/i.test(`${requestMetadata.productionType ?? ""} ${inputJson.productionType ?? ""} ${requestMetadata.provider_service ?? ""} ${inputJson.provider_service ?? ""}`);
  const envVideoProvider = String(input.videoProvider || "").trim().toLowerCase();
  const configuredVideoProvider = hasProviderEnv("minimax") ? "minimax" : hasProviderEnv("replicate") ? "replicate" : hasProviderEnv("fal") ? "fal" : hasProviderEnv("runway") ? "runway" : "";
  const typePreferredProvider = productionNeedsRealVideo ? envVideoProvider || configuredVideoProvider : talkingVideoIntent ? (selectedVideoProvider || (hasProviderEnv("minimax") ? "minimax" : "")) : "";
  const noPresenterVideo = !/presenter|avatar|talking|sunucu|konuşan|konusan|ugc|lip[-\s]?sync/i.test(textFrom(requestMetadata, inputJson));
  const standardSocialVideoTest = input.productionType === "video" && input.packageId === "video_premium" && requestedDuration === 5 && noPresenterVideo;
  const explicitReplicateSelection = selectedVideoProvider === "replicate";
  const minimaxTestGuard = standardSocialVideoTest && !explicitReplicateSelection;
  const videoProvider = selectedVideoProvider || typePreferredProvider || envVideoProvider || (talkingVideoIntent ? "minimax" : "replicate");
  const guardedVideoProvider = minimaxTestGuard ? "minimax" : videoProvider;
  const aspectRatio = selectedAspectRatio(requestMetadata, inputJson);
  const featureFlags = selectedFeatureFlags(requestMetadata, inputJson);
  const characterDialogueAnimation = detectCharacterDialogueAnimationNeed(textFrom(input.productionType, JSON.stringify(requestMetadata), JSON.stringify(inputJson)));
  const outputIntent = metadataObject(requestMetadata.outputIntent) && Object.keys(metadataObject(requestMetadata.outputIntent)).length ? metadataObject(requestMetadata.outputIntent) : metadataObject(inputJson.outputIntent);
  const sourceHandling = metadataObject(requestMetadata.sourceHandling) && Object.keys(metadataObject(requestMetadata.sourceHandling)).length ? metadataObject(requestMetadata.sourceHandling) : metadataObject(inputJson.sourceHandling);

  if (isProjectProduction) {
    return {
      provider: "project_package_builder",
      model: String(metadataObject(requestMetadata.projectWorkflow).technicalStack ?? "managed_source_delivery"),
      durationSeconds: 0,
      aspectRatio: "responsive",
      testMode: providerTestMode,
      selectedOptions: { ...featureFlags, outputIntent, sourceHandling },
      outputIntent,
      sourceHandling,
      characterDialogueAnimation
    };
  }

  return {
    provider: guardedVideoProvider,
    model: guardedVideoProvider === "replicate" ? input.replicateModel || "wan-video/wan-2.2-t2v-fast" : guardedVideoProvider === "minimax" ? "MiniMax-H3" : guardedVideoProvider,
    durationSeconds: requestedDuration,
    preflightError: minimaxTestGuard && !hasMiniMaxVideoConfig() ? "MiniMax is required for the 5-second standard/social video test, but its API key and group ID are not configured. Replicate fallback is disabled." : undefined,
    supportedDurationMaxSeconds: 15,
    aspectRatio,
    testMode: providerTestMode,
    selectedOptions: { ...featureFlags, outputIntent, sourceHandling },
    outputIntent,
    sourceHandling
  };
}
