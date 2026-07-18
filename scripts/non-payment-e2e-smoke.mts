import { detectActionRoute, detectCategory, modeForSuggestion } from "../src/lib/assistant-routing.mts";
import { buildProviderPreflight } from "../src/lib/automation-preflight.ts";
import { buildDemoAutomationOutput } from "../src/lib/demo-automation.ts";
import { buildAssistantProductionPayload, packageIdFromSelection } from "../src/lib/production-payload.ts";
import { computeAdminReservedRefund, computeCancellationCreditResolution, computeProviderSuccessSpend } from "../src/lib/credit-resolution.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function assertIncludes(actual: string, expected: string, label: string) {
  if (!actual.includes(expected)) throw new Error(`${label}: expected ${actual} to include ${expected}`);
}

function assertTruthy(value: unknown, label: string) {
  if (!value) throw new Error(`${label}: expected truthy value`);
}

const websiteIdea = "E-commerce website Shopify WooCommerce admin source package";
const websiteCategory = detectCategory(websiteIdea);
const websiteMode = modeForSuggestion(websiteCategory, websiteIdea);
const websiteRoute = detectActionRoute(websiteIdea, websiteCategory);

assertEqual(websiteCategory, "Website", "website category");
assertEqual(websiteMode, "project", "website mode");
assertIncludes(websiteRoute.route, "/dashboard/assistant-workspace", "website assistant route");
assertIncludes(websiteRoute.route, "mode=project", "website route mode");

const websiteSelection = {
  input: websiteIdea,
  selectedStyle: "E-commerce Product",
  selectedQuality: "1080p premium",
  selectedDuration: "Project based",
  selectedModules: ["Website", "E-commerce product pack", "Marketplace listing", "Admin panel"],
  selectedFeatures: ["Source file delivery", "Final ZIP", "README", "Revision right"],
  selectedPlatforms: ["Dashboard delivery", "ZIP source", "Shopify", "WooCommerce"],
  selectedMaterials: [],
  quickProviderTest: false
};

const websitePackage = packageIdFromSelection("website", websiteSelection);
const websitePayload = buildAssistantProductionPayload({
  ...websiteSelection,
  userId: "test-user",
  userEmail: "test@example.com",
  productionType: "website",
  packageId: websitePackage,
  prompt: websiteIdea,
  optionSummary: "non-payment dry run"
});

assertEqual(websitePayload.package_id, "website_ecommerce_admin", "website package id");
assertEqual(websitePayload.workflow_mode, "project", "website workflow mode");
assertEqual(websitePayload.source_delivery, "source_zip", "website source delivery");
assertEqual(websitePayload.legal_acceptance, true, "legal acceptance is present");
assertIncludes(websitePayload.connected_store_targets, "Shopify", "website connected store target");

const websiteMetadata = {
  projectWorkflow: {
    modules: websitePayload.project_modules,
    technicalStack: websitePayload.technical_stack,
    sourceDelivery: websitePayload.source_delivery
  },
  commerceWorkflow: {
    storePlatform: websitePayload.store_platform,
    storeAssetGoal: websitePayload.store_asset_goal
  },
  deliveryTargets: {
    publishTargets: websitePayload.publish_targets,
    connectedStoreTargets: websitePayload.connected_store_targets
  },
  outputPlan: { outputCount: websitePayload.output_count }
};

const websitePreflight = buildProviderPreflight({
  productionType: "website",
  requestMetadata: websiteMetadata,
  inputJson: {},
    videoProvider: "runway",
    replicateModel: "replicate-video-model"
});

assertEqual(websitePreflight.provider, "project_package_builder", "website preflight provider");
assertEqual(websitePreflight.aspectRatio, "responsive", "website preflight ratio");
assertEqual(websitePreflight.durationSeconds, 0, "website preflight duration");

const websiteOutput = buildDemoAutomationOutput({
  id: "nonpay-web-1",
  title: "Non-payment website dry run",
  prompt: websiteIdea,
  production_type: "website",
  package_id: String(websitePayload.package_id),
  request_metadata: websiteMetadata
}, "job-nonpay-web");

assertIncludes(String(websiteOutput.script), "Source delivery: source_zip", "website output source delivery");
assertIncludes(JSON.stringify(websiteOutput.scenePlan), "Cart/checkout", "website output checkout flow");
assertTruthy(websiteOutput.deliveryZipUrl, "website demo delivery zip URL");
assertTruthy(websiteOutput.readmeUrl, "website demo README URL");

const mobileIdea = "Mobile app Expo source package with admin dashboard";
const mobileCategory = detectCategory(mobileIdea);
const mobileMode = modeForSuggestion(mobileCategory, mobileIdea);
assertEqual(mobileCategory, "Mobile App", "mobile category");
assertEqual(mobileMode, "project", "mobile mode");

const mobileSelection = {
  input: mobileIdea,
  selectedStyle: "Mobile App Modern",
  selectedQuality: "1080p premium",
  selectedDuration: "Project based",
  selectedModules: ["Mobile app", "Admin panel"],
  selectedFeatures: ["Source file delivery", "Final ZIP", "README"],
  selectedPlatforms: ["Dashboard delivery", "ZIP source"],
  selectedMaterials: [],
  quickProviderTest: false
};
const mobilePackage = packageIdFromSelection("mobile_app", mobileSelection);
assertEqual(mobilePackage, "mobile_admin", "mobile package id");

const campaignIdea = "Product link TikTok ad";
const campaignCategory = detectCategory(campaignIdea);
const campaignMode = modeForSuggestion(campaignCategory, campaignIdea);
const campaignRoute = detectActionRoute(campaignIdea, campaignCategory);
assertEqual(campaignCategory, "Text-to-Campaign", "campaign category");
assertEqual(campaignMode, "commerce", "campaign mode");
assertIncludes(campaignRoute.route, "mode=commerce", "campaign route mode");

const cancellation = computeCancellationCreditResolution({ balance: 1000, reserved: 400, reservedCredits: 400, productionId: "nonpay-cancel" });
assertEqual(cancellation.creditResolution.status, "cancelled_half_spent", "cancellation status");
assertEqual(cancellation.cancellationFee, 200, "cancellation half fee");
assertEqual(cancellation.refundAmount, 200, "cancellation release amount");

const success = computeProviderSuccessSpend({ balance: 1000, reserved: 400, reservedCredits: 400, productionTitle: "Non-payment success simulation" });
assertEqual(success.creditResolution.status, "spent_reserved", "provider success simulation status");
assertEqual(success.nextBalance, 600, "provider success simulation balance");

const failureReview = { status: "admin_review_required", providerJobId: "job-failed" };
assertEqual(failureReview.status, "admin_review_required", "provider failure review status");

const refund = computeAdminReservedRefund({ balance: 1000, reserved: 400, reservedCredits: 400, productionTitle: "Non-payment refund simulation", existingResolution: failureReview });
assertEqual(refund.creditResolution.status, "refunded_reserved", "provider failure refund status");
assertEqual(refund.nextBalance, 1000, "refund keeps balance");
assertEqual(refund.nextReserved, 0, "refund releases reserved credits");

console.log("non-payment-e2e-smoke ok");
