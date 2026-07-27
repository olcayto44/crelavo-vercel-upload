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
  requestMetadata: { providerTestMode: true, quality: "YouTube 16:9" },
  inputJson: {},
  videoProvider: "runway"
});

assertEqual(runwayPreflight.provider, "runway", "runway provider");
assertEqual(runwayPreflight.durationSeconds, 5, "runway test duration");
assertEqual(runwayPreflight.aspectRatio, "16:9", "runway aspectRatio");
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
const genericVideoProvider = readFileSync("src/lib/providers/generic-video.ts", "utf8");
const providerAliases = readFileSync("src/lib/providers/aliases.ts", "utf8");
const providerEnv = readFileSync("src/lib/providers/env.ts", "utf8");
const elevenlabsProvider = readFileSync("src/lib/providers/elevenlabs.ts", "utf8");
const productionRevisionRoute = readFileSync("src/app/api/productions/revision/route.ts", "utf8");
const adminProviderTests = readFileSync("src/app/api/admin/provider-tests/route.ts", "utf8");
const providerReadinessRoute = readFileSync("src/app/api/providers/readiness/route.ts", "utf8");
const assistantPlanRoute = readFileSync("src/app/api/assistant/plan/route.ts", "utf8");
const assistantOrchestrateRoute = readFileSync("src/app/api/assistant/orchestrate/route.ts", "utf8");
const providerPlan = readFileSync("src/lib/provider-plan.ts", "utf8");
const projectDelivery = readFileSync("src/lib/project-delivery.ts", "utf8");
const automaticDeliveryBuilder = readFileSync("src/lib/automatic-delivery-builder.ts", "utf8");
const productionsRoute = readFileSync("src/app/api/productions/route.ts", "utf8");
const productionPayload = readFileSync("src/lib/production-payload.ts", "utf8");
const providerReadiness = readFileSync("src/lib/provider-readiness.ts", "utf8");
const adsPhase2 = readFileSync("src/lib/phase2/ads.ts", "utf8");
const leadExitIntentRoute = readFileSync("src/app/api/leads/exit-intent/route.ts", "utf8");
const retentionGrowth = readFileSync("src/lib/retention-growth.ts", "utf8");
const dashboardGrowth = readFileSync("src/app/dashboard/growth/page.tsx", "utf8");
const dashboardShareToEarn = readFileSync("src/app/dashboard/share-to-earn/page.tsx", "utf8");
const adminGrowth = readFileSync("src/app/admin/growth/page.tsx", "utf8");
const dataForSeoProvider = readFileSync("src/lib/providers/dataforseo.ts", "utf8");
const apifyProvider = readFileSync("src/lib/providers/apify.ts", "utf8");
const googleMapsProvider = readFileSync("src/lib/providers/google-maps.ts", "utf8");
const growthIntelligencePage = readFileSync("src/app/dashboard/growth-intelligence/page.tsx", "utf8");
const growthIntelligencePanel = readFileSync("src/components/GrowthIntelligenceControlPanel.tsx", "utf8");
const packageData = readFileSync("src/lib/data.ts", "utf8");
const adConfig = readFileSync("src/lib/ad-config.ts", "utf8");
const splashAdClient = readFileSync("src/components/SplashAdClient.tsx", "utf8");
const paymentEmail = readFileSync("src/lib/payment-email.ts", "utf8");
const checkoutRoute = readFileSync("src/app/api/payments/checkout/route.ts", "utf8");
const lifecycleEmailRoute = readFileSync("src/app/api/payments/lifecycle-email/route.ts", "utf8");
const checkoutButton = readFileSync("src/components/PaymentCheckoutButton.tsx", "utf8");
const liveActivityRoute = readFileSync("src/app/api/conversion/live-activity/route.ts", "utf8");
const streakRoute = readFileSync("src/app/api/conversion/streak/route.ts", "utf8");
const truthfulLiveActivity = readFileSync("src/components/TruthfulLiveActivity.tsx", "utf8");
const dailyStreakCapture = readFileSync("src/components/DailyStreakCapture.tsx", "utf8");
const homePage = readFileSync("src/app/page.tsx", "utf8");
const geoOffers = readFileSync("src/lib/geo-offers.ts", "utf8");
const splashAd = readFileSync("src/components/SplashAd.tsx", "utf8");
const campaignPromoSlot = readFileSync("src/components/CampaignPromoSlot.tsx", "utf8");
const campaignPromoClient = readFileSync("src/components/CampaignPromoClient.tsx", "utf8");
const lipSyncStartRoute = readFileSync("src/app/api/lip-sync/start/route.ts", "utf8");
const musicProvidersRoute = readFileSync("src/app/api/music-providers/route.ts", "utf8");
const seoLaunchKit = readFileSync("src/lib/seo-launch-kit.ts", "utf8");
const organicDirectory = readFileSync("src/lib/organic-directory.ts", "utf8");
const voiceProductionGuard = readFileSync("src/lib/voice-production-guard.ts", "utf8");
const productionProgress = readFileSync("src/lib/production-progress.ts", "utf8");
const productionWorkspace = readFileSync("src/components/ProductionWorkspace.tsx", "utf8");
const campaignDeadline = readFileSync("src/lib/campaign-deadline.ts", "utf8");
const whopCurrencyGuard = readFileSync("src/lib/whop-currency-guard.ts", "utf8");
const llmManifesto = readFileSync("src/lib/llm-manifesto.ts", "utf8");
const launchDistributionPage = readFileSync("src/app/ai-tool-launch-distribution-plan/page.tsx", "utf8");
const whopBillingPage = readFileSync("src/app/whop-billing/page.tsx", "utf8");
const adSniperV2 = readFileSync("src/lib/ad-sniper-v2.ts", "utf8");
const premiumExpansionPage = readFileSync("src/app/dashboard/premium-expansion/page.tsx", "utf8");
const edgeProviderFinalChecks = readFileSync("src/lib/edge-provider-final-checks.ts", "utf8");
const adminProviderTestsRoute = readFileSync("src/app/api/admin/provider-tests/route.ts", "utf8");
const launchCompletionControls = readFileSync("src/lib/launch-completion-controls.ts", "utf8");
const finalApiChecklist = readFileSync("src/lib/final-api-checklist.ts", "utf8");
const adminGrowthPage = readFileSync("src/app/admin/growth/page.tsx", "utf8");
const shareToEarnPage = readFileSync("src/app/dashboard/share-to-earn/page.tsx", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const publicPlaceholderH1Audit = readFileSync("scripts/public-placeholder-h1-audit.mts", "utf8");
const legalFinalPage = readFileSync("src/app/admin/legal-final/page.tsx", "utf8");
const socialProof = readFileSync("src/lib/social-proof.ts", "utf8");
const externalLaunchOperations = readFileSync("src/lib/external-launch-operations.ts", "utf8");
const adminProvidersPage = readFileSync("src/app/admin/providers/page.tsx", "utf8");
const launchOpsReadiness = readFileSync("src/lib/launch-ops-readiness.ts", "utf8");
const adminMonitoringPage = readFileSync("src/app/admin/monitoring/page.tsx", "utf8");
const adminFinancePage = readFileSync("src/app/admin/finance/page.tsx", "utf8");
const adminFinalApiChecklistPage = readFileSync("src/app/admin/final-api-checklist/page.tsx", "utf8");
const adminSeoPage = readFileSync("src/app/admin/seo/page.tsx", "utf8");
const adminProductionQaPage = readFileSync("src/app/admin/production-qa/page.tsx", "utf8");
const productionQaLib = readFileSync("src/lib/production-qa.ts", "utf8");
const socialDistribution = readFileSync("src/lib/social-distribution.ts", "utf8");
const apiCostGuard = readFileSync("src/lib/api-cost-guard.ts", "utf8");
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
for (const term of ["buildGenericVideoPlan", "runGenericVideoPipeline", "genericVideoProviderChain", "createVoiceover", "createSubtitleFile", "createShotstackRender", "genericVideoPlan"]) {
  if (!genericVideoProvider.includes(term) && !automationStart.includes(term) && !automationStatus.includes(term)) throw new Error(`generic video provider chain missing term: ${term}`);
}
const legacyGenerationStatus = readFileSync("src/app/api/generation/[id]/status/route.ts", "utf8");
const imagePreviewRoute = readFileSync("src/app/api/preview/route.ts", "utf8");
for (const term of ["spendCreditBuckets", "current_subscription_credits", "rolled_over_credits", "Completed provider job cannot be finalized"]) {
  if (!legacyGenerationStatus.includes(term)) throw new Error(`legacy video generation spend guard missing term: ${term}`);
}
for (const term of ["image-preview:ip", "rateLimit", "rejectSuspiciousText", "validateProductionSafety", "OPENAI_IMAGE_MODEL"]) {
  if (!imagePreviewRoute.includes(term)) throw new Error(`image preview generation guard missing term: ${term}`);
}
for (const term of ["mirrorProviderAsset", "fetch(input.sourceUrl", "uploadProviderAsset(`${input.productionId}/${input.filenameBase}.${extension}`"]) {
  if (!providerStorage.includes(term)) throw new Error(`provider storage mirror missing term: ${term}`);
}
for (const term of ["DEV_RUNWAY_API_KEY", "DEV_RUWAY_API_KEY", "APIFY_API", "DATAFORSEO_API_KEY", "META_ACCESS_TOKEN", "WHOP_WEBHOOK_KEY", "SHOPIFY_CLIENT_ID", "KLING_AI_API_KEY", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID", "TURNSTILE_SECRET_KEY"]) {
  if (!providerAliases.includes(term)) throw new Error(`provider env alias missing term: ${term}`);
}
for (const term of ["requireProviderEnv", "optionalProviderEnv", "hasProviderEnv", "providerEnvNames"]) {
  if (!providerEnv.includes(term)) throw new Error(`provider env helper missing term: ${term}`);
}
for (const term of ["MAX_TTS_CHARS", "cleanVoiceScript", "Voice-over script is empty after cleanup", "providerVoiceId", "scriptCharacters", "truncated", "voiceDirectionGuard"] ) {
  if (!elevenlabsProvider.includes(term)) throw new Error(`ElevenLabs TTS guard missing term: ${term}`);
}
for (const term of ["voiceProductionGuard", "maxTtsCharacters", "cleanProviderText", "voiceCloneConsentRule", "avatarSpeechRule", "fallbackPolicy"]) {
  if (!voiceProductionGuard.includes(term)) throw new Error(`voice production guard missing term: ${term}`);
}
for (const term of ["providerVoiceId", "scriptCharacters", "truncated"]) {
  if (!productionRevisionRoute.includes(term)) throw new Error(`production voice revision metadata missing term: ${term}`);
}
for (const term of ["voiceover_plan", "sanitizedVoiceDirection", "ttsSafetyRule", "maxScriptCharacters"]) {
  if (!productionPayload.includes(term)) throw new Error(`voiceover payload guard missing term: ${term}`);
}
for (const term of ["voiceCloneReferences", "voiceCloneConsent", "voice_clone_plan", "waiting_reference_audio", "waiting_rights_confirmation", "ready_for_provider_setup", "consentRule", "fallbackPolicy"]) {
  if (!productionPayload.includes(term)) throw new Error(`voice clone compliance payload missing term: ${term}`);
}
for (const term of ["avatarReferences", "avatarVoiceReferences", "avatar_plan", "waiting_avatar_reference_or_persona", "waiting_voice_direction", "voiceProvider", "avatarSpeechRule"]) {
  if (!productionPayload.includes(term)) throw new Error(`avatar/talking-head payload guard missing term: ${term}`);
}
for (const term of ["isVoiceCloneIntent", "isLipSyncIntent", "isAvatarIntent", "avatar_or_speaker_reference", "face_video_and_audio_source", "reference_audio_and_voice_consent"]) {
  if (!assistantPlanRoute.includes(term)) throw new Error(`assistant plan media intent guard missing term: ${term}`);
}
for (const term of ["isVoiceCloneIntent", "isLipSyncIntent", "isAvatarIntent", "Voice clone", "Reference audio with explicit voice rights confirmation", "run_lip_sync"]) {
  if (!assistantOrchestrateRoute.includes(term)) throw new Error(`assistant orchestrator media intent guard missing term: ${term}`);
}
for (const term of ["providerRouteMap", "run_lip_sync", "kling_talking_video_fallback", "reference_audio_consent"]) {
  if (!providerPlan.includes(term) || !providerReadinessRoute.includes("routeMap")) throw new Error(`provider router map missing term: ${term}`);
}
for (const term of ["Voice clone work requires ElevenLabs", "type !== \"voice_clone\"", "avatar_provider", "HeyGen avatar/talking-head provider"]) {
  if (!providerReadiness.includes(term)) throw new Error(`voice clone provider readiness guard missing term: ${term}`);
}
for (const term of ["requireVerifiedRequestUser", "enforceRouteBudget", "source_audio_url", "source_video_url must be a secure https URL", "verified_user_https_source_rate_limited"]) {
  if (!lipSyncStartRoute.includes(term)) throw new Error(`lip-sync start guard missing term: ${term}`);
}
for (const term of ["adminRequiredResponse", "summary", "stableAudioReady", "mubertReady", "admin_only_music_provider_readiness"]) {
  if (!musicProvidersRoute.includes(term)) throw new Error(`music provider readiness guard missing term: ${term}`);
}
for (const term of ["musicReferences", "music_plan", "providerPrimary: \"stable-audio\"", "providerSecondary: \"mubert\"", "licenseGuard", "mixGuard"]) {
  if (!productionPayload.includes(term)) throw new Error(`music/sound payload guard missing term: ${term}`);
}
for (const term of ["seoLaunchKit", "directoryOneLiner", "proofGuardrails", "submissionCopyFields", "launchSequence"]) {
  if (!seoLaunchKit.includes(term) || !organicDirectory.includes("launchKit: seoLaunchKit")) throw new Error(`SEO launch kit guard missing term: ${term}`);
}
for (const term of ["productionProgressSteps", "productionProgressPercent", "GPT script / brief", "Voice generated", "Final MP4 / delivery"]) {
  if (!productionProgress.includes(term) || !productionWorkspace.includes("realtimeProgressSteps")) throw new Error(`realtime production progress UI guard missing term: ${term}`);
}
for (const term of ["bannerSegmentLabel", "safeOfferNote", "geo=${segment.toLowerCase()}", "Geo personalization changes message relevance only"]) {
  if (!geoOffers.includes(term)) throw new Error(`geo banner guard missing term: ${term}`);
}
for (const term of ["campaignDeadlineGuardrail", "sessionDeadlineStorageKey", "campaignModeForRemaining", "Preview available", "Still open"]) {
  if (!campaignDeadline.includes(term) || !campaignPromoClient.includes("data-campaign-mode")) throw new Error(`session countdown guard missing term: ${term}`);
}
for (const term of ["whopCurrencyVerification", "publicCopyCurrencyRule", "countriesToCheck", "No local currency claim", "Whop checkout is the billing source of record"]) {
  if (!whopCurrencyGuard.includes(term) || !whopBillingPage.includes("Currency display")) throw new Error(`Whop multi-currency guard missing term: ${term}`);
}
for (const term of ["publicLlmManifesto", "AI-readable Crelavo facts", "aiCitationBlock", "Do not claim official partner status"]) {
  if (!llmManifesto.includes(term) || !launchDistributionPage.includes("AI-readable manifesto")) throw new Error(`public LLM manifesto guard missing term: ${term}`);
}
for (const term of ["organicDirectoryBacklinkOperations", "submission URL", "listing URL", "Product Hunt / Hacker News"]) {
  if (!organicDirectory.includes(term) || !launchDistributionPage.includes("Directory backlink operations")) throw new Error(`directory backlink operation guard missing term: ${term}`);
}
for (const term of ["adSniperV2Plan", "extractedStructureOnly", "prohibitedReuse", "consentCheckbox", "avoid risky language"]) {
  if (!adSniperV2.includes(term) || !premiumExpansionPage.includes("Reference ad analysis without competitor copying")) throw new Error(`ad sniper V2 guard missing term: ${term}`);
}
for (const term of ["cloudflareWafFinalChecks", "protectedRoutes", "blocked invalid webhook", "Cloudflare readiness is not complete"]) {
  if (!edgeProviderFinalChecks.includes(term) || !providerReadinessRoute.includes("finalGuardrail") || !adminProviderTestsRoute.includes("manualValidation")) throw new Error(`Cloudflare WAF final guard missing term: ${term}`);
}
for (const term of ["providerLiveVerificationChecks", "connected_pending_real_production_e2e", "real provider output", "payment -> credit reserve/spend -> provider output -> delivery -> notification"]) {
  if (!edgeProviderFinalChecks.includes(term) || !providerReadinessRoute.includes("providerLiveVerification") || !adminProviderTestsRoute.includes("providerLiveVerification")) throw new Error(`provider live verification guard missing term: ${term}`);
}
for (const term of ["liveTestFixIntake", "waiting_for_user_live_test_results", "requiredReportFields", "triageOrder", "Do not claim a live issue is fixed"]) {
  if (!launchCompletionControls.includes(term) || !finalApiChecklist.includes("liveTestFixIntake") || !adminGrowthPage.includes("Fix intake")) throw new Error(`live test fix intake guard missing term: ${term}`);
}
for (const term of ["mvpApiSeparation", "AI Ad Performance Score Checker API", "Community Showcase API", "MVP feature APIs are a separate next integration track"]) {
  if (!launchCompletionControls.includes(term) || !finalApiChecklist.includes("mvpApiSeparation") || !adminGrowthPage.includes("MVP API work is separated")) throw new Error(`MVP API separation guard missing term: ${term}`);
}
for (const term of ["realProductionE2EChecklist", "payment → credit → production → delivery E2E", "Whop webhook signature", "provider job id", "dashboard delivery", "email notification"]) {
  if (!launchCompletionControls.includes(term) || !finalApiChecklist.includes("launchCompletionControls") || !adminGrowthPage.includes("Final 19–22 launch gates")) throw new Error(`real production E2E completion guard missing term: ${term}`);
}
for (const term of ["publicPlaceholderH1Audit", "publicPageScope", "allowedInternalScope", "scanWorkflow", "awaiting", "placeholder", "lorem", "exactly one primary H1", "approved customer logo"]) {
  if (!launchCompletionControls.includes(term) || !adminGrowthPage.includes("Public placeholder + H1 audit")) throw new Error(`public placeholder H1 audit guard missing term: ${term}`);
}
for (const term of ["referralRewardAutomationGuard", "self-referral", "duplicate account", "suspicious IP", "Whop payment idempotency", "review-gated"]) {
  if (!launchCompletionControls.includes(term) || !shareToEarnPage.includes("referralRewardAutomationGuard")) throw new Error(`referral reward automation guard missing term: ${term}`);
}
for (const term of ["couponHuntCampaignGuard", "real Whop promo code", "redemption limit", "Hide public coupon hunt prompts", "No fake hidden discount"]) {
  if (!launchCompletionControls.includes(term) || !adminGrowthPage.includes("Coupon hunt campaign")) throw new Error(`coupon hunt campaign guard missing term: ${term}`);
}
for (const term of ["smoke:public-placeholder-h1", "public-placeholder-h1-audit.mts"]) {
  if (!packageJson.includes(term) && !finalApiChecklist.includes("smoke:public-placeholder-h1")) throw new Error(`public placeholder H1 executable audit missing term: ${term}`);
}
for (const term of ["publicRouteBlocklist", "riskyTerms", "multiple literal <h1>", "allowedPlaceholderContexts"]) {
  if (!publicPlaceholderH1Audit.includes(term)) throw new Error(`public placeholder H1 audit script missing term: ${term}`);
}
for (const term of ["proofPermissionChecklist", "Written permission for every customer logo", "Verified source for every ROAS"]) {
  if (!socialProof.includes(term) || !legalFinalPage.includes("Proof / logo permission") || !legalFinalPage.includes("Real proof can go public only after written approval")) throw new Error(`proof permission guard missing term: ${term}`);
}
for (const term of ["externalSubmissionTracker", "manual_submission_required", "Product Hunt", "Reddit / Quora / Indie Hackers / Hacker News", "submission_url", "listing_url"]) {
  if (!externalLaunchOperations.includes(term) || !launchDistributionPage.includes("Manual submission tracker") || !finalApiChecklist.includes("externalSubmissionTracker")) throw new Error(`external submission tracker guard missing term: ${term}`);
}
for (const term of ["externalApiAccountReadiness", "external_account_or_permission_required", "Shopify Admin API", "Amazon Selling Partner API", "TikTok Content Posting API", "n8n workflow", "Shotstack"]) {
  if (!externalLaunchOperations.includes(term) || !adminProvidersPage.includes("External API account readiness") || !finalApiChecklist.includes("externalApiAccountReadiness")) throw new Error(`external API account readiness guard missing term: ${term}`);
}
for (const term of ["mvpApiLaterTrack", "separate_after_core_launch_e2e", "Admin/debug monitoring", "Provider queue guard", "Production readiness score"]) {
  if (!launchOpsReadiness.includes(term) && !finalApiChecklist.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`launch ops readiness checklist missing term: ${term}`);
}
for (const term of ["adminDebugMonitoringPlan", "live_test_result_driven", "Any live test failure must record provider/payment route"]) {
  if (!launchOpsReadiness.includes(term) && !adminMonitoringPage.includes(term)) throw new Error(`admin debug monitoring plan missing term: ${term}`);
}
for (const term of ["Admin/debug monitoring plan", "adminDebugMonitoringPlan.panels", "adminDebugMonitoringPlan.status"]) {
  if (!adminMonitoringPage.includes(term)) throw new Error(`admin debug monitoring page missing term: ${term}`);
}
for (const term of ["providerQueueConcurrencyGuard", "conservative_launch_limits", "maxConcurrentProviderJobs", "maxProviderRetries", "providerBackoffSeconds", "PROVIDER_BACKOFF_BASE_SECONDS", "PROVIDER_BACKOFF_MAX_SECONDS"]) {
  if (!launchOpsReadiness.includes(term) && !adminProvidersPage.includes(term) && !apiCostGuard.includes(term) && !finalApiChecklist.includes(term)) throw new Error(`provider queue/backoff guard missing term: ${term}`);
}
for (const term of ["productionReadinessScorePlan", "scorecard_ready_for_live_inputs", "forced-failure path"]) {
  if (!launchOpsReadiness.includes(term) && !adminFinancePage.includes(term) && !finalApiChecklist.includes(term)) throw new Error(`production readiness/credit burn guard missing term: ${term}`);
}
for (const term of ["Production Readiness Score and Credit Burn Forecast", "Credit Burn Forecast rules", "providerQueueConcurrencyGuard.defaults", "productionReadinessScorePlan.scoreInputs"]) {
  if (!adminFinancePage.includes(term)) throw new Error(`production readiness finance page missing term: ${term}`);
}
for (const term of ["providerCostLedgerPlan", "ledger_ready_pending_real_provider_costs", "Provider Cost Ledger", "actual_provider_cost", "margin_status"]) {
  if (!launchOpsReadiness.includes(term) && !adminFinancePage.includes(term) && !adminFinalApiChecklistPage.includes(term) && !productionQaLib.includes(term)) throw new Error(`provider cost ledger guard missing term: ${term}`);
}
for (const term of ["productionFlowExpansionPlan", "flows_mapped_review_gated", "Social/UGC and project production flows", "No Fake Proof Guard", "sourceDelivery"]) {
  if (!launchOpsReadiness.includes(term) && !adminProductionQaPage.includes(term) && !productionQaLib.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`production flow expansion guard missing term: ${term}`);
}
for (const term of ["finalQaLaunchHardeningPlan", "final_qa_hardening_ready", "Final QA / launch hardening", "Stop launch if", "provider_cost_ledger_missing"]) {
  if (!launchOpsReadiness.includes(term) && !adminProductionQaPage.includes(term) && !productionQaLib.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`final QA launch hardening guard missing term: ${term}`);
}
for (const term of ["globalSeoExpansionPlan", "tier1GlobalSeoPlan", "Tier-1 global SEO plan", "No thin pages", "ownerGate"]) {
  if (!launchOpsReadiness.includes(term) && !seoLaunchKit.includes(term) && !adminSeoPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`global SEO expansion guard missing term: ${term}`);
}
for (const term of ["technicalSeoIntegrityPlan", "technicalSeoIntegrity", "Hreflang / canonical / schema", "hreflang", "canonical", "sitemap", "schema", "internal links"]) {
  if (!launchOpsReadiness.includes(term) && !seoLaunchKit.includes(term) && !adminSeoPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`technical SEO integrity guard missing term: ${term}`);
}
for (const term of ["programmaticSeoQualityGuardPlan", "programmaticSeoQualityGuard", "templates_ready_with_thin_content_guard", "thinContentRule", "no fake local proof"]) {
  if (!launchOpsReadiness.includes(term) && !seoLaunchKit.includes(term) && !adminSeoPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`programmatic SEO quality guard missing term: ${term}`);
}
for (const term of ["directoryBacklinkTrackingPlan", "aiDirectoryBacklinkCopyPack", "copy_pack_and_tracking_ready", "submission_url", "listing_url", "approval_status"]) {
  if (!launchOpsReadiness.includes(term) && !organicDirectory.includes(term) && !adminGrowthPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`directory backlink tracking guard missing term: ${term}`);
}
for (const term of ["globalSocialContentKitPlan", "globalSocialContentKit", "global_social_kit_ready_manual_publish", "No fake user counts", "winner-ad claims"]) {
  if (!launchOpsReadiness.includes(term) && !socialDistribution.includes(term) && !adminGrowthPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`global social no fake proof guard missing term: ${term}`);
}
for (const term of ["ugcDemoFunnelPlan", "ugcDemoFunnel", "ugc_demo_funnel_ready_review_gated", "review_gated_demo_funnel_ready", "rights and consent check"]) {
  if (!launchOpsReadiness.includes(term) && !socialDistribution.includes(term) && !adminGrowthPage.includes(term) && !adminFinalApiChecklistPage.includes(term)) throw new Error(`UGC demo funnel guard missing term: ${term}`);
}
for (const term of ["getShopifyReadiness", "requireProviderEnv(\"openai\")", "requireProviderEnv(\"elevenlabs\")", "requireProviderEnv(\"apify\")", "hasProviderEnv(\"whopWebhookSecret\")", "testCloudflare", "hasProviderEnv(\"cloudflareApiToken\")"]) {
  if (!adminProviderTests.includes(term)) throw new Error(`admin provider test alias wiring missing term: ${term}`);
}
for (const term of ["hasProviderEnv(\"runway\")", "hasProviderEnv(\"kling\")", "hasProviderEnv(\"fal\")", "hasProviderEnv(\"metaAccessToken\")", "providerEnvNames(\"shotstack\")", "cloudflareReady", "turnstileReady", "providerEnvNames(\"cloudflareApiToken\")"]) {
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
for (const term of ["seo/keyword-opportunity-plan.md", "seo/competitor-analysis-brief.md", "seo/provider-research-map.json", "buildKeywordOpportunityPlan", "isSeoResearchDelivery"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`SEO research delivery pack missing term: ${term}`);
}
for (const term of ["optionalEnv(\"DATAFORSEO_BASE_URL\")", "optionalEnv(\"DATAFORSEO_LOCATION_NAME\")", "optionalEnv(\"DATAFORSEO_LANGUAGE_CODE\")"]) {
  if (!dataForSeoProvider.includes(term)) throw new Error(`DataForSEO provider env alias missing term: ${term}`);
}
const dataForSeoRoute = readFileSync("src/app/api/dataforseo/route.ts", "utf8");
const apifyRoute = readFileSync("src/app/api/apify/route.ts", "utf8");
const googleMapsRoute = readFileSync("src/app/api/google-maps/route.ts", "utf8");
for (const term of ["adminRequiredResponse", "isAdminRequest", "assertSeoProviderAccess"]) {
  if (!dataForSeoRoute.includes(term) || !apifyRoute.includes(term) || !googleMapsRoute.includes(term)) throw new Error(`SEO provider public route guard missing term: ${term}`);
}
for (const term of ["optionalEnv(\"APIFY_BASE_URL\")", "requireProviderEnv(\"apify\")"]) {
  if (!apifyProvider.includes(term)) throw new Error(`Apify provider env alias missing term: ${term}`);
}
for (const term of ["optionalEnv(\"GOOGLE_MAPS_BASE_URL\")", "requireProviderEnv(\"googleMaps\")"]) {
  if (!googleMapsProvider.includes(term)) throw new Error(`Google Maps provider env alias missing term: ${term}`);
}
for (const term of ["Provider-ready service workflow", "DataForSEO, Apify, Google Maps", "provider-ready dashboard"]) {
  if (!growthIntelligencePage.includes(term) && !growthIntelligencePanel.includes(term)) throw new Error(`Growth Intelligence provider-ready copy missing term: ${term}`);
}
for (const term of ["174,000 total annual credits", "300+ AI ad drafts", "Normally $1,560/yr, now $1,300/yr", "START 24-HOUR TEAM PREVIEW FOR $20", "$20 secure Whop preview"]) {
  if (!packageData.includes(term) && !adConfig.includes(term) && !splashAdClient.includes(term)) throw new Error(`Team Annual conversion copy missing term: ${term}`);
}
if (!splashAdClient.includes("window.setTimeout(showSplash, 15000)")) throw new Error("Team Annual splash delay should be 15 seconds");
for (const term of ["sendPreviewReminderEmail", "sendAbandonedCheckoutEmail", "Your Crelavo preview is almost over", "Continue your Crelavo preview checkout"]) {
  if (!paymentEmail.includes(term)) throw new Error(`Payment lifecycle email missing term: ${term}`);
}
for (const term of ["recordCheckoutIntent", "source: \"checkout_intent\"", "consentRecovery", "checkoutIntentResult", "recoveryPolicy", "previewReminderPolicy"]) {
  if (!checkoutRoute.includes(term) && !checkoutButton.includes(term)) throw new Error(`Checkout intent logging missing term: ${term}`);
}
for (const term of ["preview_reminder", "abandoned_checkout", "sendPreviewReminderEmail", "sendAbandonedCheckoutEmail", "isAdminRequest"]) {
  if (!lifecycleEmailRoute.includes(term)) throw new Error(`Lifecycle email admin route missing term: ${term}`);
}
for (const term of ["connected_pending_live_e2e", "checkout_intent", "23rd-hour preview reminder", "after about 1 hour"]) {
  if (!retentionGrowth.includes(term) && !adminGrowth.includes(term)) throw new Error(`Lifecycle recovery admin/readiness copy missing term: ${term}`);
}
for (const term of ["real_database_events_only", "lead_captures", "production_requests", "No fake activity", "anonymized"]) {
  if (!liveActivityRoute.includes(term)) throw new Error(`truthful live activity route missing term: ${term}`);
}
for (const term of ["/api/conversion/live-activity", "Real activity only", "Live proof without fake counters"]) {
  if (!truthfulLiveActivity.includes(term)) throw new Error(`truthful live activity component missing term: ${term}`);
}
for (const term of ["source: \"daily_streak\"", "pending_reward_review", "manual_review_required", "currentStreak", "500"]) {
  if (!streakRoute.includes(term)) throw new Error(`daily streak route missing term: ${term}`);
}
for (const term of ["/api/conversion/streak", "Daily comeback loop", "no automatic credits"]) {
  if (!dailyStreakCapture.includes(term)) throw new Error(`daily streak component missing term: ${term}`);
}
for (const term of ["TruthfulLiveActivity", "DailyStreakCapture"]) {
  if (!homePage.includes(term)) throw new Error(`homepage conversion component missing term: ${term}`);
}
for (const term of ["GeoOfferSegment", "US", "UK", "EU", "CA_AU", "TR", "GLOBAL", "CA", "AU", "x-vercel-ip-country", "cf-ipcountry", "geoOfferGuardrail", "fake local scarcity"]) {
  if (!geoOffers.includes(term)) throw new Error(`geo offer routing missing term: ${term}`);
}
for (const term of ["geoOfferFromHeaders", "geoOffer={geoOffer}"]) {
  if (!splashAd.includes(term)) throw new Error(`splash geo offer wiring missing term: ${term}`);
}
for (const term of ["expiredLabel", "expiredBody", "return <CampaignPromoClient {...payload} />"]) {
  if (!campaignPromoSlot.includes(term)) throw new Error(`campaign promo payload preservation missing term: ${term}`);
}
for (const forbiddenTerm of ["geoOfferFromHeaders", "crelavo-geo-team", "priceBadge=\"$1,300/yr\""]) {
  if (campaignPromoSlot.includes(forbiddenTerm)) throw new Error(`campaign promo slot must not globally override admin payload with Team geo offer: ${forbiddenTerm}`);
}
for (const term of ["countdownExpired", "Preview available", "Still open", "Secure Whop preview is still open while this campaign is active."]) {
  if (!campaignPromoClient.includes(term)) throw new Error(`campaign countdown fallback missing term: ${term}`);
}
for (const term of ["geoOfferFromHeaders", "localizedPaidGrowthFunnelCards", "homepageBadge", "homepageDescription"]) {
  if (!homePage.includes(term)) throw new Error(`homepage geo Team card missing term: ${term}`);
}
for (const term of ["Truthful live activity proof", "Streak and reward loop", "connected_pending_live_e2e"]) {
  if (!adminGrowth.includes(term)) throw new Error(`admin conversion roadmap missing term: ${term}`);
}
for (const staleTerm of ["Pre-API service workflow", "pre-API dashboard", "Final n8n/API automation can later"]) {
  if (growthIntelligencePage.includes(staleTerm) || growthIntelligencePanel.includes(staleTerm)) throw new Error(`stale Growth Intelligence copy still present: ${staleTerm}`);
}

console.log("automation-preflight-smoke ok");
