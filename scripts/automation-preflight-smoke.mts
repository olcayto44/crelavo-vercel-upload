import { readFileSync } from "node:fs";
import { buildProviderPreflight } from "../src/lib/automation-preflight.ts";
import { providerRequirementsForProduction } from "../src/lib/provider-readiness.ts";
import { isVideoLikeProductionType, renderQueuePolicyForPackage, safeActiveVideoJobLimit } from "../src/lib/queue-policy.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const projectPreflight = buildProviderPreflight({
  productionType: "website",
  requestMetadata: {
    projectWorkflow: { technicalStack: "Next.js / React responsive website" },
    providerTestMode: false
  },
  inputJson: {},
  videoProvider: "replicate",
  replicateModel: "custom-video-model"
});

assertEqual(projectPreflight.provider, "project_package_builder", "project provider");
assertEqual(projectPreflight.model, "Next.js / React responsive website", "project model");
assertEqual(projectPreflight.durationSeconds, 0, "project duration");
assertEqual(projectPreflight.aspectRatio, "responsive", "project aspectRatio");
assertEqual(projectPreflight.testMode, false, "project testMode");

const videoPreflight = buildProviderPreflight({
  productionType: "video",
  requestMetadata: { ecommerceContext: { targetDurationSeconds: 15 } },
  inputJson: {},
  videoProvider: "replicate",
  replicateModel: "custom-video-model"
});

assertEqual(videoPreflight.provider, "replicate", "video provider");
assertEqual(videoPreflight.model, "custom-video-model", "video model");
assertEqual(videoPreflight.durationSeconds, 15, "video duration");
assertEqual(videoPreflight.aspectRatio, "9:16", "video aspectRatio");

const runwayPreflight = buildProviderPreflight({
  productionType: "campaign",
  requestMetadata: { providerTestMode: true },
  inputJson: {},
  videoProvider: "runway"
});

assertEqual(runwayPreflight.provider, "runway", "runway provider");
assertEqual(runwayPreflight.durationSeconds, 5, "runway test duration");
assertEqual(runwayPreflight.aspectRatio, "720:1280", "runway aspectRatio");
assertEqual(runwayPreflight.testMode, true, "runway testMode");
assertEqual(renderQueuePolicyForPackage("pro").label, "Priority render queue", "pro queue");
assertEqual(renderQueuePolicyForPackage("business").label, "Fastest render queue", "business queue");
const falPreflight = buildProviderPreflight({
  productionType: "campaign",
  requestMetadata: { providerTestMode: true },
  inputJson: {},
  videoProvider: "fal"
});

assertEqual(falPreflight.provider, "fal", "fal provider");
assertEqual(falPreflight.durationSeconds, 5, "fal test duration");
assertEqual(falPreflight.aspectRatio, "9:16", "fal aspectRatio");
assertEqual(renderQueuePolicyForPackage("team").label, "Dedicated production priority", "team queue");
assertEqual(isVideoLikeProductionType("music_video"), true, "video-like production type");
assertEqual(safeActiveVideoJobLimit(), 5, "default active video job limit");
const ecommerceRequirements = providerRequirementsForProduction("campaign", "campaign_product_ad_video");
for (const key of ["openai", "video_provider", "voice_provider", "render_provider", "storage"]) {
  if (!ecommerceRequirements.some((item) => item.key === key)) throw new Error(`e-commerce provider readiness missing ${key}`);
}

const visuals = readFileSync("src/lib/providers/visuals.ts", "utf8");
const status = readFileSync("src/lib/providers/status.ts", "utf8");
const automationStart = readFileSync("src/app/api/automation/start/route.ts", "utf8");
const automationStatus = readFileSync("src/app/api/automation/status/route.ts", "utf8");
const ecommercePipeline = readFileSync("src/lib/providers/ecommerce-ad.ts", "utf8");
const providerStorage = readFileSync("src/lib/providers/storage.ts", "utf8");
const providerAliases = readFileSync("src/lib/providers/aliases.ts", "utf8");
const providerEnv = readFileSync("src/lib/providers/env.ts", "utf8");
const adminProviderTests = readFileSync("src/app/api/admin/provider-tests/route.ts", "utf8");
const providerReadinessRoute = readFileSync("src/app/api/providers/readiness/route.ts", "utf8");
const projectDelivery = readFileSync("src/lib/project-delivery.ts", "utf8");
const automaticDeliveryBuilder = readFileSync("src/lib/automatic-delivery-builder.ts", "utf8");
const productionsRoute = readFileSync("src/app/api/productions/route.ts", "utf8");
const productionPayload = readFileSync("src/lib/production-payload.ts", "utf8");
const adsPhase2 = readFileSync("src/lib/phase2/ads.ts", "utf8");
const leadExitIntentRoute = readFileSync("src/app/api/leads/exit-intent/route.ts", "utf8");
const retentionGrowth = readFileSync("src/lib/retention-growth.ts", "utf8");
const dashboardGrowth = readFileSync("src/app/dashboard/growth/page.tsx", "utf8");
const dashboardShareToEarn = readFileSync("src/app/dashboard/share-to-earn/page.tsx", "utf8");
const adminGrowth = readFileSync("src/app/admin/growth/page.tsx", "utf8");
for (const term of ["provider === \"fal\"", "queue.fal.run", "FAL_VIDEO_MODEL", "falApiKey"]) {
  if (!visuals.includes(term) && !status.includes(term)) throw new Error(`FAL provider integration missing term: ${term}`);
}
for (const term of ["getFalStatus", "job.provider === \"fal\"", "/requests/${job.id}/status"]) {
  if (!status.includes(term)) throw new Error(`FAL provider status missing term: ${term}`);
}
for (const term of ["renderJob: null", "Visual/video provider job created", "waiting_for_visual_output"]) {
  if (!automationStart.includes(term) && !ecommercePipeline.includes(term)) throw new Error(`async visual-before-render flow missing term: ${term}`);
}
for (const term of ["maybeCreateRenderAfterVisualReady", "createShotstackRender", "render_start_failed", "mirrorProviderAsset", "finalAssetMirror", "providerFinalUrl"]) {
  if (!automationStatus.includes(term)) throw new Error(`automation status bridge/storage missing term: ${term}`);
}
for (const term of ["mirrorProviderAsset", "fetch(input.sourceUrl", "uploadProviderAsset(`${input.productionId}/${input.filenameBase}.${extension}`"]) {
  if (!providerStorage.includes(term)) throw new Error(`provider storage mirror missing term: ${term}`);
}
for (const term of ["DEV_RUNWAY_API_KEY", "DEV_RUWAY_API_KEY", "APIFY_API", "DATAFORSEO_API_KEY", "META_ACCESS_TOKEN", "WHOP_WEBHOOK_KEY", "SHOPIFY_CLIENT_ID", "KLING_AI_API_KEY"]) {
  if (!providerAliases.includes(term)) throw new Error(`provider env alias missing term: ${term}`);
}
for (const term of ["requireProviderEnv", "optionalProviderEnv", "hasProviderEnv", "providerEnvNames"]) {
  if (!providerEnv.includes(term)) throw new Error(`provider env helper missing term: ${term}`);
}
for (const term of ["getShopifyReadiness", "requireProviderEnv(\"openai\")", "requireProviderEnv(\"elevenlabs\")", "requireProviderEnv(\"apify\")", "hasProviderEnv(\"whopWebhookSecret\")"]) {
  if (!adminProviderTests.includes(term)) throw new Error(`admin provider test alias wiring missing term: ${term}`);
}
for (const term of ["hasProviderEnv(\"runway\")", "hasProviderEnv(\"kling\")", "hasProviderEnv(\"fal\")", "hasProviderEnv(\"metaAccessToken\")", "providerEnvNames(\"shotstack\")"]) {
  if (!providerReadinessRoute.includes(term)) throw new Error(`provider readiness alias wiring missing term: ${term}`);
}
for (const term of ["automatic_project_source_package", "isAutomaticProjectDelivery", "buildProjectDeliveryOutput", "project_delivery_ready", "Source package delivery generated"]) {
  if (!projectDelivery.includes(term) && !automationStart.includes(term)) throw new Error(`automatic project delivery missing term: ${term}`);
}
for (const term of ["source/package.json", "source/app/page.tsx", "source/app/layout.tsx", "source/app/globals.css", "source/lib/config.ts"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`source package ZIP entry missing term: ${term}`);
}
for (const term of ["product_url", "product_link", "directProductUrl", "firstUrlFromText(body.material_links)", "firstUrlFromText(body.prompt)"]) {
  if (!productionsRoute.includes(term) && !productionPayload.includes(term)) throw new Error(`campaign product URL wiring missing term: ${term}`);
}
for (const term of ["campaign/copy-pack.md", "campaign/social-export-plan.md", "campaign/marketplace-export.json", "buildCampaignCopyPack", "buildSocialExportPlan"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`campaign export pack missing term: ${term}`);
}
for (const term of ["tiktokAccessToken", "tiktokAdvertiserId", "youtubeAccessToken", "optionalProviderEnv(\"youtubeAccessToken\")"]) {
  if (!providerAliases.includes(term) && !adsPhase2.includes(term)) throw new Error(`social ad launch alias missing term: ${term}`);
}
for (const term of ["social/caption-pack.md", "social/posting-calendar.md", "social/platform-format-plan.json", "buildSocialCaptionPack", "isSocialContentDelivery"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`social delivery pack missing term: ${term}`);
}
for (const term of ["growth/conversion-funnel-plan.md", "growth/monetization-plan.json", "growth/lifecycle-nudges.md", "buildConversionFunnelPlan", "isGrowthDelivery"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`growth delivery pack missing term: ${term}`);
}
for (const term of ["optionalProviderEnv(\"resend\")", "optionalEnv(\"LEAD_NOTIFICATION_EMAIL\")", "optionalEnv(\"SUPPORT_FROM_EMAIL\")"]) {
  if (!leadExitIntentRoute.includes(term)) throw new Error(`lead capture provider env alias missing term: ${term}`);
}
for (const term of ["final live E2E validation", "Social, growth and provider-aware delivery flows are code-connected", "connected launch prep", "connected-but-review-gated"]) {
  if (!retentionGrowth.includes(term) && !dashboardGrowth.includes(term) && !dashboardShareToEarn.includes(term) && !adminGrowth.includes(term)) throw new Error(`growth connected-copy guard missing term: ${term}`);
}
for (const staleTerm of ["API later", "API-dışı 2. Grup", "API-free launch version", "until API tracking and fraud checks are connected"]) {
  if (retentionGrowth.includes(staleTerm) || dashboardGrowth.includes(staleTerm) || dashboardShareToEarn.includes(staleTerm) || adminGrowth.includes(staleTerm)) throw new Error(`stale growth copy still present: ${staleTerm}`);
}

console.log("automation-preflight-smoke ok");
