import { createVoiceover } from "./elevenlabs";
import { createAdBrain } from "./openai";
import { scrapeProduct } from "./scraper";
import { createShotstackRender } from "./shotstack";
import { createSubtitleFile } from "./subtitles";
import type { EcommerceAdRunInput, EcommerceAdRunResult } from "./types";
import { createVisualVideo } from "./visuals";

export async function runEcommerceAdPipeline(input: EcommerceAdRunInput): Promise<EcommerceAdRunResult> {
  const product = await scrapeProduct(input.productUrl);
  const brain = await createAdBrain({
    product,
    campaignGoal: input.campaignGoal,
    channels: input.channels,
    targetDurationSeconds: input.targetDurationSeconds,
    voiceDirection: input.voiceDirection,
    subtitleStyle: input.subtitleStyle,
    style: input.style,
    targetCountry: input.targetCountry,
    targetCity: input.targetCity,
    culture: input.culture
  });

  const visualJob = await createVisualVideo({
    scenes: brain.visualScenes,
    productImageUrls: product.imageUrls,
    durationSeconds: input.targetDurationSeconds,
    style: input.style
  });

  const voiceAudioUrl = await createVoiceover({
    productionId: input.productionId,
    script: brain.voiceoverScript,
    voiceDirection: input.voiceDirection
  });

  const subtitleUrl = await createSubtitleFile({
    productionId: input.productionId,
    lines: brain.subtitleLines,
    durationSeconds: input.targetDurationSeconds
  });

  const renderJob = await createShotstackRender({
    title: brain.productName,
    videoUrl: visualJob.url,
    audioUrl: voiceAudioUrl,
    subtitleUrl,
    durationSeconds: input.targetDurationSeconds
  });

  return { product, brain, visualJob, voiceAudioUrl, subtitleUrl, renderJob };
}
