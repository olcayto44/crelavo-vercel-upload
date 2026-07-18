import { estimateProductionProfit } from "../src/lib/production-profit.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const estimate = estimateProductionProfit({
  packageId: "animal_cinematic_pack",
  productionType: "animal_video",
  reservedCredits: 3200,
  outputCount: 3,
  durationSeconds: 45,
  quality: "1080p premium",
  features: ["Own voice-over", "Background music", "Subtitles"],
  materialCount: 2,
  materialBytes: 60 * 1024 * 1024,
  creditValueUsd: 0.1
});

assert(estimate.estimatedRevenueUsd === 320, "credit revenue value should convert reserved credits");
assert(estimate.estimatedProviderCostUsd > 0, "provider cost should be estimated");
assert(estimate.estimatedGrossProfitUsd === Number((estimate.estimatedRevenueUsd - estimate.estimatedProviderCostUsd).toFixed(2)), "gross profit should be revenue minus provider cost");
assert(estimate.providerCostLines.some((line) => line.label === "Video generation"), "video generation cost line missing");
assert(estimate.providerCostLines.some((line) => line.label === "Voice processing"), "voice cost line missing");
assert(estimate.providerCostLines.some((line) => line.label === "Music and sound"), "music cost line missing");
assert(estimate.providerCostLines.some((line) => line.label === "Uploaded material transfer"), "uploaded material cost line missing");
assert(estimate.estimatedMarginPercent > 0 && estimate.estimatedMarginPercent <= 100, "margin should be a valid percentage");

console.log("production-profit-smoke ok");
