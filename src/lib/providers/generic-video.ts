import { createVoiceover } from "./elevenlabs";
import { optionalEnv } from "./env";
import { createShotstackRender } from "./shotstack";
import { createSubtitleFile } from "./subtitles";
import type { ProviderJob } from "./types";
import { createVisualVideo } from "./visuals";

export type GenericVideoPlan = {
  title: string;
  script: string;
  visualScenes: string[];
  subtitleLines: string[];
  voiceDirection: string;
  durationSeconds: number;
  aspectRatio: string;
  provider: string;
};

export type GenericVideoRunResult = {
  plan: GenericVideoPlan;
  visualJob: ProviderJob | null;
  voiceAudioUrl: string | null;
  subtitleUrl: string | null;
  renderJob: ProviderJob | null;
  chainStatus: "provider_chain_started" | "visual_job_created" | "waiting_provider_config";
  missingProviders: string[];
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function sentenceParts(text: string) {
  return text
    .split(/[.!?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function buildGenericVideoPlan(input: {
  title?: unknown;
  prompt?: unknown;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  providerPreflight?: Record<string, unknown>;
}): GenericVideoPlan {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const providerPreflight = input.providerPreflight ?? {};
  const title = clean(input.title) || clean(requestMetadata.title) || "Crelavo video";
  const prompt = clean(input.prompt) || clean(inputJson.prompt) || title;
  const durationSeconds = Number(providerPreflight.durationSeconds ?? requestMetadata.outputDurationSeconds ?? inputJson.outputDurationSeconds ?? 15) || 15;
  const aspectRatio = clean(providerPreflight.aspectRatio) || clean(requestMetadata.aspectRatio) || "9:16";
  const provider = clean(providerPreflight.provider) || clean(optionalEnv("VIDEO_PROVIDER")) || "replicate";
  const selectedVoiceProfile = clean(requestMetadata.voiceProfile) || clean(inputJson.voiceProfile) || "premium clear narrator";
  const selectedVoiceLanguage = clean(requestMetadata.voiceLanguage) || clean(inputJson.voiceLanguage) || "English";
  const parts = sentenceParts(prompt);
  const visualScenes = parts.length >= 3
    ? parts
    : [
      `Opening hook for ${title}`,
      `Show the main product, character or story promise from: ${prompt}`,
      "Show benefit, proof and emotional reason to keep watching",
      "End with a clear call to action or final reveal"
    ];
  const script = parts.length > 0
    ? `${parts.join(". ")}.`
    : `Introducing ${title}. See the story, benefit and final call to action in a clear Crelavo AI video.`;
  const subtitleLines = visualScenes.map((scene, index) => index === visualScenes.length - 1 ? "Ready to create your next campaign with Crelavo." : scene.slice(0, 90));
  return {
    title,
    script,
    visualScenes,
    subtitleLines,
    voiceDirection: `${selectedVoiceProfile}; ${selectedVoiceLanguage}; natural conversion-focused delivery`,
    durationSeconds,
    aspectRatio,
    provider
  };
}

export function genericVideoProviderChain(input: { selectedOptions?: Record<string, unknown>; provider?: string; visualJob?: ProviderJob | null; voiceAudioUrl?: string | null; subtitleUrl?: string | null; renderJob?: ProviderJob | null }) {
  const selectedOptions = input.selectedOptions ?? {};
  const wantsVoice = Boolean(selectedOptions.voiceOver ?? selectedOptions.voiceConsistency);
  const wantsSubtitles = Boolean(selectedOptions.subtitles);
  const wantsFinalRender = Boolean(selectedOptions.finalRender ?? wantsVoice ?? wantsSubtitles);
  return [
    { step: "script_plan", provider: "crelavo_planner", status: "done", required: true },
    { step: "visual_generation", provider: input.provider || "video_provider", status: input.visualJob ? "job_created" : "waiting_provider_config", required: true },
    { step: "voice_over", provider: "elevenlabs", status: wantsVoice ? input.voiceAudioUrl ? "asset_created" : "waiting_provider_config" : "not_selected", required: wantsVoice },
    { step: "subtitles", provider: "subtitle_renderer", status: wantsSubtitles ? input.subtitleUrl ? "asset_created" : "waiting_provider_config" : "not_selected", required: wantsSubtitles },
    { step: "final_render", provider: "shotstack", status: wantsFinalRender ? input.renderJob ? "job_created" : "waiting_for_visual_or_provider_config" : "optional", required: wantsFinalRender }
  ];
}

export async function runGenericVideoPipeline(input: {
  productionId: string;
  title?: unknown;
  prompt?: unknown;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  providerPreflight?: Record<string, unknown>;
  selectedOptions?: Record<string, unknown>;
}): Promise<GenericVideoRunResult> {
  const plan = buildGenericVideoPlan(input);
  const selectedOptions = input.selectedOptions ?? {};
  const missingProviders: string[] = [];
  let visualJob: ProviderJob | null = null;
  let voiceAudioUrl: string | null = null;
  let subtitleUrl: string | null = null;
  let renderJob: ProviderJob | null = null;

  try {
    visualJob = await createVisualVideo({
      scenes: plan.visualScenes,
      productImageUrls: [],
      durationSeconds: plan.durationSeconds,
      style: clean(input.requestMetadata?.style) || plan.title,
      provider: plan.provider,
      aspectRatio: plan.aspectRatio
    });
  } catch {
    missingProviders.push("visual_generation");
  }

  if (Boolean(selectedOptions.voiceOver ?? selectedOptions.voiceConsistency)) {
    try {
      voiceAudioUrl = await createVoiceover({ productionId: input.productionId, script: plan.script, voiceDirection: plan.voiceDirection });
    } catch {
      missingProviders.push("voice_over");
    }
  }

  if (Boolean(selectedOptions.subtitles)) {
    try {
      subtitleUrl = await createSubtitleFile({ productionId: input.productionId, lines: plan.subtitleLines, durationSeconds: plan.durationSeconds });
    } catch {
      missingProviders.push("subtitles");
    }
  }

  if (visualJob?.url && voiceAudioUrl && subtitleUrl && Boolean(selectedOptions.finalRender ?? selectedOptions.voiceOver ?? selectedOptions.subtitles)) {
    try {
      renderJob = await createShotstackRender({ title: plan.title, videoUrl: visualJob.url, audioUrl: voiceAudioUrl, subtitleUrl, durationSeconds: plan.durationSeconds });
    } catch {
      missingProviders.push("final_render");
    }
  }

  return {
    plan,
    visualJob,
    voiceAudioUrl,
    subtitleUrl,
    renderJob,
    chainStatus: renderJob || voiceAudioUrl || subtitleUrl ? "provider_chain_started" : visualJob ? "visual_job_created" : "waiting_provider_config",
    missingProviders
  };
}
