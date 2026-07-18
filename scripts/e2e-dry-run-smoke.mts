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
assertEqual(campaignPreflight.aspectRatio, "720:1280", "campaign preflight ratio");

const successCredit = computeProviderSuccessSpend({ balance: 1000, reserved: 400, reservedCredits: 400, productionTitle: "Dry run success" });
assertEqual(successCredit.creditResolution.status, "spent_reserved", "success credit status");
assertEqual(successCredit.nextBalance, 600, "success credit balance");

const cancelCredit = computeCancellationCreditResolution({ balance: 1000, reserved: 400, reservedCredits: 400, productionId: "dry-cancel" });
assertEqual(cancelCredit.creditResolution.status, "cancelled_half_spent", "cancel credit status");
assertEqual(cancelCredit.cancellationFee, 200, "cancel fee");

const assistantWorkspace = readFileSync("src/components/AssistantWorkspace.tsx", "utf8");
for (const term of ["productionCreditInsufficient", "Insufficient credits for this production", "Start production", "availableProductionCredits"]) {
  assertIncludes(assistantWorkspace, term, `assistant credit guard ${term}`);
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
