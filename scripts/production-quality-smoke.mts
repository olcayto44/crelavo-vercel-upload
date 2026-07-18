import { buildDeliveryManifest, buildDeliveryReadme } from "../src/lib/automatic-delivery-builder.ts";
import { productionTypes } from "../src/lib/production.ts";
import { buildAssistantProductionPayload } from "../src/lib/production-payload.ts";
import { productionQualityCoverage, qualityProfileForProduction } from "../src/lib/production-quality.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const coverage = new Set(productionQualityCoverage());
for (const type of productionTypes) {
  assert(coverage.has(type.id), `Missing production quality profile for ${type.id}`);
  const quality = qualityProfileForProduction(type.id, `${type.id}_package`);
  assert(quality.label.length > 0, `${type.id} quality label missing`);
  assert(quality.minimumStandard.length > 20, `${type.id} minimum standard too short`);
  assert(quality.customerReadyDefinition.length > 20, `${type.id} customer-ready definition too short`);
  assert(quality.checklist.length >= 5, `${type.id} checklist too short`);
  assert(quality.acceptanceCriteria.length >= 3, `${type.id} acceptance criteria too short`);
  assert(quality.adminReviewFocus.length >= 3, `${type.id} admin review focus too short`);
}

const dramaPayload = buildAssistantProductionPayload({
  input: "Viral kısa drama üret",
  selectedStyle: "Short drama",
  selectedQuality: "1080p cinematic",
  selectedDuration: "60 sec",
  selectedModules: ["Drama / short series", "Script + scene plan"],
  selectedFeatures: ["Script", "Scene plan", "Voice-over", "Subtitles"],
  selectedPlatforms: ["Dashboard delivery", "TikTok"],
  selectedMaterials: [],
  productionType: "drama",
  packageId: "drama_viral_short",
  prompt: "Viral kısa drama üret",
  optionSummary: "Drama format: Viral short film\nDrama hook type: betrayal reveal",
  userId: "user-1",
  userEmail: "user@example.com"
});

assert(dramaPayload.production_quality?.label === "Drama / short series quality", "drama payload quality label missing");
assert(Array.isArray(dramaPayload.production_quality_checklist), "payload quality checklist missing");
assert(Array.isArray(dramaPayload.acceptance_criteria), "payload acceptance criteria missing");

const manifest = buildDeliveryManifest({
  id: "prod_1",
  title: "Drama test",
  prompt: "Viral kısa drama üret",
  production_type: "drama",
  package_id: "drama_viral_short",
  request_metadata: {
    productionQuality: dramaPayload.production_quality,
    deliveryRequirements: dramaPayload.delivery_requirements,
    deliveryPackage: { standard: "media_final", userPromise: "Final media", requiredItems: ["Preview", "Final delivery link"], optionalItems: [], dashboardFields: [], adminChecklist: [], fileFormats: ["MP4"], costCredits: 0, costNote: "" }
  },
  input_json: dramaPayload
});

assert(manifest.production_quality.label === "Drama / short series quality", "manifest quality label missing");
assert(manifest.production_quality.checklist.some((item: string) => item.includes("Opening hook")), "manifest drama checklist missing hook item");

const readme = buildDeliveryReadme({
  id: "prod_1",
  title: "Drama test",
  prompt: "Viral kısa drama üret",
  production_type: "drama",
  package_id: "drama_viral_short",
  request_metadata: { productionQuality: dramaPayload.production_quality },
  input_json: dramaPayload
});
assert(readme.includes("Production Quality Standard"), "README quality section missing");
assert(readme.includes("Acceptance Criteria"), "README acceptance criteria missing");

console.log("production-quality-smoke ok");
