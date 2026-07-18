import { deliveryPackageForProduction } from "./delivery-package.ts";

export type ProductionProfitInput = {
  packageId: string;
  productionType: string;
  reservedCredits: number;
  outputCount?: number;
  durationSeconds?: number;
  quality?: string;
  features?: string | string[];
  materialCount?: number;
  materialBytes?: number;
  providerTestMode?: boolean;
  creditValueUsd?: number;
};

export type ProductionCostLine = {
  label: string;
  provider: string;
  estimatedCostUsd: number;
  basis: string;
};

export type ProductionProfitEstimate = {
  creditValueUsd: number;
  chargedCredits: number;
  estimatedRevenueUsd: number;
  estimatedProviderCostUsd: number;
  estimatedGrossProfitUsd: number;
  estimatedMarginPercent: number;
  providerCostLines: ProductionCostLine[];
};

const VIDEO_TYPES = new Set([
  "video",
  "campaign",
  "animation",
  "anime_short_film",
  "animal_video",
  "nature_video",
  "planet_space_video",
  "studio",
  "cinematic_video",
  "video_clipping",
  "avatar",
  "lip_sync",
  "voice_clone",
  "visual_clone",
  "video_tools",
  "music_video",
  "stickman_animation",
  "localization"
]);

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function includesText(value: string | string[] | undefined, words: string[]) {
  const text = Array.isArray(value) ? value.join(" ") : value ?? "";
  const normalized = text.toLocaleLowerCase("tr-TR");
  return words.some((word) => normalized.includes(word));
}

function addLine(lines: ProductionCostLine[], label: string, provider: string, estimatedCostUsd: number, basis: string) {
  if (estimatedCostUsd <= 0) return;
  lines.push({ label, provider, estimatedCostUsd: money(estimatedCostUsd), basis });
}

export function estimateProductionProfit(input: ProductionProfitInput): ProductionProfitEstimate {
  const creditValueUsd = Number(input.creditValueUsd ?? process.env.CREDIT_VALUE_USD ?? 0.1) || 0.1;
  const chargedCredits = Math.max(0, Number(input.reservedCredits ?? 0) || 0);
  const outputCount = Math.max(1, Number(input.outputCount ?? 1) || 1);
  const durationSeconds = Math.max(0, Number(input.durationSeconds ?? 0) || 0);
  const materialCount = Math.max(0, Number(input.materialCount ?? 0) || 0);
  const materialBytes = Math.max(0, Number(input.materialBytes ?? 0) || 0);
  const isVideoLike = VIDEO_TYPES.has(String(input.productionType));
  const quality = input.quality ?? "";
  const features = input.features;
  const lines: ProductionCostLine[] = [];

  if (String(input.productionType) !== "live_sales_agent") {
    const operationsBase = input.providerTestMode ? 0.15 : 0.35;
    addLine(lines, "Workflow orchestration", "Crelavo automation", operationsBase, input.providerTestMode ? "quick provider test job" : "production queue, metadata, admin monitoring");
  }

  if (isVideoLike) {
    const durationBlocks = Math.max(1, Math.ceil((durationSeconds || 15) / 15));
    const qualityMultiplier = includesText(quality, ["4k", "2k", "cinematic", "sinematik"]) ? 1.75 : includesText(quality, ["1080p", "premium"]) ? 1.35 : 1;
    const videoBase = input.providerTestMode ? 0.45 : 1.4;
    const videoCost = videoBase * durationBlocks * outputCount * qualityMultiplier;
    addLine(lines, "Video generation", "Video provider", videoCost, `${outputCount} output(s), ${durationSeconds || 15}s target, ${quality || "standard quality"}`);
    addLine(lines, "Final video render and delivery", "Render/storage/CDN", 0.25 * outputCount, "final file preparation, dashboard delivery, download/share buffer");
  }

  if (includesText(features, ["image", "thumbnail", "kapak", "görsel", "gorsel"])) {
    addLine(lines, "Image generation", "Image provider", 0.35 * outputCount, "cover/reference/visual support requested");
  }

  if (includesText(features, ["voice", "voice-over", "own voice-over", "seslendirme", "dublaj", "child voices", "kendi ses"])) {
    addLine(lines, "Voice processing", "Voice/TTS provider", 0.45 * outputCount, "voice-over, voice clone or dubbing feature selected");
  }

  if (includesText(features, ["music", "müzik", "background music", "emotion-matched music", "user music reference", "soundtrack", "arka fon"])) {
    addLine(lines, "Music and sound", "Music/audio provider", 0.3 * outputCount, "music, soundtrack or sound design feature selected");
  }

  if (includesText(features, ["subtitle", "altyazı"])) {
    addLine(lines, "Subtitle processing", "Speech/transcription provider", 0.12 * outputCount, "subtitle or transcription processing");
  }

  if (materialCount > 0) {
    addLine(lines, "Material ingestion", "Storage/CDN", materialCount * 0.08, `${materialCount} selected or uploaded material(s)`);
  }

  if (materialBytes > 0) {
    const materialMegabytes = materialBytes / (1024 * 1024);
    const storageBlocks = Math.ceil(materialMegabytes / 25);
    addLine(lines, "Uploaded material transfer", "Storage/CDN", storageBlocks * 0.12, `${Math.ceil(materialMegabytes)} MB uploaded material transfer buffer`);
  }

  const deliveryPackage = deliveryPackageForProduction({ productionType: String(input.productionType), packageId: input.packageId, features });
  if (deliveryPackage.costCredits > 0) {
    addLine(lines, "Final delivery package", "Storage/render/export", deliveryPackage.costCredits * 0.0012, deliveryPackage.userPromise);
  }

  if (includesText(features, ["working source package", "working source", "çalışan kaynak", "calisan kaynak", "deployable source"])) {
    addLine(lines, "Working source build/test", "Code generation/build runner", ["website", "saas", "mobile_app", "admin_project"].includes(String(input.productionType)) ? 3.5 : 1.2, "deployable source package generation, build check and retry buffer");
  }

  const estimatedProviderCostUsd = money(lines.reduce((total, line) => total + line.estimatedCostUsd, 0));
  const estimatedRevenueUsd = money(chargedCredits * creditValueUsd);
  const estimatedGrossProfitUsd = money(estimatedRevenueUsd - estimatedProviderCostUsd);
  const estimatedMarginPercent = estimatedRevenueUsd > 0 ? Math.round((estimatedGrossProfitUsd / estimatedRevenueUsd) * 100) : 0;

  return {
    creditValueUsd,
    chargedCredits,
    estimatedRevenueUsd,
    estimatedProviderCostUsd,
    estimatedGrossProfitUsd,
    estimatedMarginPercent,
    providerCostLines: lines
  };
}
