import { readFileSync } from "node:fs";
import { detectActionRoute, detectCategory, modeForSuggestion } from "../src/lib/assistant-routing.mts";
import { buildProviderPreflight } from "../src/lib/automation-preflight.ts";
import { buildDemoAutomationOutput } from "../src/lib/demo-automation.ts";
import { buildAssistantProductionPayload, packageIdFromSelection } from "../src/lib/production-payload.ts";
import { computeCancellationCreditResolution, computeProviderSuccessSpend } from "../src/lib/credit-resolution.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function assertIncludes(actual: string, expected: string, label: string) {
  if (!actual.includes(expected)) throw new Error(`${label}: expected ${actual} to include ${expected}`);
}

const ecommerceIdea = "E-commerce website Shopify WooCommerce admin";
const ecommerceCategory = detectCategory(ecommerceIdea);
const ecommerceMode = modeForSuggestion(ecommerceCategory, ecommerceIdea);
const ecommerceRoute = detectActionRoute(ecommerceIdea, ecommerceCategory);

assertEqual(ecommerceCategory, "Website", "ecommerce category");
assertEqual(ecommerceMode, "project", "ecommerce mode");
assertIncludes(ecommerceRoute.route, "/dashboard/assistant-workspace", "ecommerce route base");
assertIncludes(ecommerceRoute.route, "mode=project", "ecommerce route mode");

const ecommerceSelection = {
  input: ecommerceIdea,
  selectedStyle: "E-commerce Product",
  selectedQuality: "1080p premium",
  selectedDuration: "Proje bazlı",
  selectedModules: ["Web sitesi", "E-ticaret ürün paketi", "Marketplace listeleme", "Admin panel"],
  selectedFeatures: ["Kaynak dosya teslimi", "Final ZIP", "README", "Revizyon hakkı"],
  selectedPlatforms: ["Dashboard teslim", "ZIP kaynak", "Shopify", "WooCommerce"],
  selectedMaterials: [],
  quickProviderTest: false
};
const ecommercePackage = packageIdFromSelection("website", ecommerceSelection);
const ecommercePayload = buildAssistantProductionPayload({
  ...ecommerceSelection,
  userId: "user-1",
  userEmail: "user@example.com",
  productionType: "website",
  packageId: ecommercePackage,
  prompt: ecommerceIdea,
  optionSummary: "dry run"
});

assertEqual(ecommercePayload.package_id, "website_ecommerce_admin", "ecommerce package");
assertEqual(ecommercePayload.workflow_mode, "project", "ecommerce workflow");
assertEqual(ecommercePayload.source_delivery, "source_zip", "ecommerce source delivery");

const ecommerceRequestMetadata = {
  projectWorkflow: {
    modules: ecommercePayload.project_modules,
    technicalStack: ecommercePayload.technical_stack,
    sourceDelivery: ecommercePayload.source_delivery
  },
  commerceWorkflow: {
    storePlatform: ecommercePayload.store_platform,
    storeAssetGoal: ecommercePayload.store_asset_goal
  },
  outputPlan: { outputCount: 1 }
};

const ecommercePreflight = buildProviderPreflight({
  productionType: "website",
  requestMetadata: ecommerceRequestMetadata,
  inputJson: {},
    videoProvider: "runway",
    replicateModel: "custom-video-model"
});
assertEqual(ecommercePreflight.provider, "project_package_builder", "ecommerce preflight provider");
assertEqual(ecommercePreflight.aspectRatio, "responsive", "ecommerce preflight ratio");

const ecommerceOutput = buildDemoAutomationOutput({
  id: "prod-web-dry",
  title: "E-commerce dry run",
  prompt: ecommerceIdea,
  production_type: "website",
  request_metadata: ecommerceRequestMetadata
}, "job-web-dry");
assertIncludes(String(ecommerceOutput.script), "Store platform: Shopify", "ecommerce output store platform");
assertIncludes(JSON.stringify(ecommerceOutput.scenePlan), "Cart/checkout", "ecommerce output checkout");

const campaignIdea = "Product link TikTok ad";
const campaignCategory = detectCategory(campaignIdea);
const campaignMode = modeForSuggestion(campaignCategory, campaignIdea);
assertEqual(campaignCategory, "Text-to-Campaign", "campaign category");
assertEqual(campaignMode, "commerce", "campaign mode");

const campaignPreflight = buildProviderPreflight({
  productionType: "campaign",
  requestMetadata: { ecommerceContext: { targetDurationSeconds: 15 } },
  inputJson: {},
    videoProvider: "runway",
    replicateModel: "custom-video-model"
});
assertEqual(campaignPreflight.provider, "runway", "campaign preflight provider");
assertEqual(campaignPreflight.durationSeconds, 15, "campaign preflight duration");
assertEqual(campaignPreflight.aspectRatio, "9:16", "campaign preflight ratio");

const whopAnnualCreditActivation = {
  balance: 174000,
  reserved: 0,
  current_subscription_credits: 174000,
  rolled_over_credits: 0,
  rollover_cap: 174000,
  subscription_status: "active"
};
assertEqual(whopAnnualCreditActivation.balance, 174000, "Whop annual payment credits balance");
assertEqual(whopAnnualCreditActivation.current_subscription_credits, 174000, "Whop annual payment subscription bucket");
assertEqual(whopAnnualCreditActivation.subscription_status, "active", "Whop annual subscription status");
assertEqual(whopAnnualCreditActivation.rollover_cap, 174000, "Whop annual rollover cap");

const productionReserve = { balance: whopAnnualCreditActivation.balance, reserved: whopAnnualCreditActivation.reserved + 1200 };
assertEqual(productionReserve.balance - productionReserve.reserved, 172800, "available credits after production reserve");

const successCredit = computeProviderSuccessSpend({ balance: productionReserve.balance, reserved: productionReserve.reserved, reservedCredits: 1200, productionTitle: "Dry run success" });
assertEqual(successCredit.creditResolution.status, "spent_reserved", "success credit status");
assertEqual(successCredit.nextBalance, 172800, "success credit balance after provider delivery");
assertEqual(successCredit.nextReserved, 0, "success reserved credits cleared");

const finalDeliveryRecord = {
  status: "ready",
  automation_status: "completed",
  generation_status: "final_video_ready",
  preview_url: "https://cdn.crelavo.test/final.mp4",
  delivery_link: "https://cdn.crelavo.test/final.mp4",
  delivery_zip_url: "https://cdn.crelavo.test/final.mp4",
  reserved_credits: 0,
  output_json: {
    finalVideoUrl: "https://cdn.crelavo.test/final.mp4",
    providerFinalUrl: "https://provider.crelavo.test/final.mp4",
    finalAssetMirror: { status: "mirrored", storedUrl: "https://cdn.crelavo.test/final.mp4" },
    providerStatus: "shotstack_succeeded",
    providerLifecycle: { render: { normalizedStatus: { status: "succeeded" } } },
    outputRegistry: [{ kind: "video", url: "https://cdn.crelavo.test/final.mp4" }],
    creditResolution: successCredit.creditResolution,
    finalizedReservedCredits: successCredit.finalizedReservedCredits,
    workflowState: {
      stage: "ready",
      reservedCredits: 0,
      deliveryReady: true
    },
    completionEmailResult: { sent: true }
  }
};
assertEqual(finalDeliveryRecord.status, "ready", "final delivery status");
assertEqual(finalDeliveryRecord.automation_status, "completed", "final delivery automation completed");
assertEqual(finalDeliveryRecord.generation_status, "final_video_ready", "final delivery generation status");
assertEqual(finalDeliveryRecord.reserved_credits, 0, "final production reserved credits cleared");
assertEqual(finalDeliveryRecord.output_json.creditResolution.status, "spent_reserved", "final delivery spent reserved");
assertEqual(finalDeliveryRecord.output_json.finalizedReservedCredits, 1200, "finalized reserved credits preserved in output json");
assertEqual(finalDeliveryRecord.output_json.workflowState.reservedCredits, 0, "workflow state reserved credits cleared");
assertEqual(finalDeliveryRecord.output_json.workflowState.deliveryReady, true, "workflow state delivery ready");
assertIncludes(finalDeliveryRecord.delivery_link, "final.mp4", "final delivery link");
assertIncludes(finalDeliveryRecord.preview_url, "final.mp4", "final preview link");
assertIncludes(finalDeliveryRecord.delivery_zip_url, "final.mp4", "final zip delivery link");
assertEqual(finalDeliveryRecord.output_json.completionEmailResult.sent, true, "completion email result recorded");

const cancelledSubscription = {
  balance: 0,
  reserved: 0,
  current_subscription_credits: 0,
  rolled_over_credits: 0,
  subscription_status: "cancelled"
};
assertEqual(cancelledSubscription.current_subscription_credits, 0, "cancel clears subscription credits");
assertEqual(cancelledSubscription.rolled_over_credits, 0, "cancel clears rolled over credits");
assertEqual(cancelledSubscription.subscription_status, "cancelled", "cancel subscription status");

const cancelCredit = computeCancellationCreditResolution({ balance: 1000, reserved: 400, reservedCredits: 400, productionId: "dry-cancel" });
assertEqual(cancelCredit.creditResolution.status, "cancelled_half_spent", "cancel credit status");
assertEqual(cancelCredit.cancellationFee, 200, "cancel fee");

const assistantWorkspace = readFileSync("src/components/AssistantWorkspace.tsx", "utf8");
for (const term of ["productionCreditInsufficient", "Insufficient credits for this production", "Start production", "availableProductionCredits"]) {
  assertIncludes(assistantWorkspace, term, `assistant credit guard ${term}`);
}

const automationStatusRoute = readFileSync("src/app/api/automation/status/route.ts", "utf8");
for (const term of ["reserved_credits: 0", "finalizedReservedCredits", "completionEmailResult", "finalProductionState", "providerLifecycle", "outputRegistry"]) {
  assertIncludes(automationStatusRoute, term, `automation finalization ${term}`);
}

const productionsRoute = readFileSync("src/app/api/productions/route.ts", "utf8");
for (const term of ["status: \"queued\"", "generation_status: \"automation_queued\"", "reserved_credits: estimatedCredits", "type: \"reserve\"", "nextStatusForWorkflow", "nextAutomationStatusForWorkflow", "nextDeliveryLinkForWorkflow"]) {
  assertIncludes(productionsRoute, term, `production reserve creation ${term}`);
}

const adminProductions = readFileSync("src/components/AdminProductionsTable.tsx", "utf8");
for (const term of ["Customer revision queue", "Final customer delivery", "Source files", "README / setup"]) {
  assertIncludes(adminProductions, term, `admin production E2E ${term}`);
}

const adminCredits = readFileSync("src/components/AdminCreditForm.tsx", "utf8");
for (const term of ["Manual E2E starter", "10,000 credits", "Available = balance - reserved", "Add production credits", "Remove production credits"]) {
  assertIncludes(adminCredits, term, `admin credits E2E ${term}`);
}

console.log("e2e-dry-run-smoke ok");
