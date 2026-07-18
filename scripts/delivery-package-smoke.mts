import { deliveryPackageForProduction } from "../src/lib/delivery-package.ts";
import { estimateProductionCost } from "../src/lib/production.ts";
import { estimateProductionProfit } from "../src/lib/production-profit.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const websiteDelivery = deliveryPackageForProduction({ productionType: "website", packageId: "website_ecommerce_admin", storePlatform: "Shopify" });
assert(websiteDelivery.standard === "commerce_export", "e-commerce website should use commerce export delivery");
assert(websiteDelivery.requiredItems.includes("Store asset ZIP"), "commerce delivery should require store asset ZIP");

const saasDelivery = deliveryPackageForProduction({ productionType: "saas", packageId: "saas_admin_billing" });
assert(saasDelivery.standard === "project_source", "SaaS should use project source delivery");
assert(saasDelivery.requiredItems.includes("Source ZIP"), "project delivery should require source ZIP");

const brandDelivery = deliveryPackageForProduction({ productionType: "brand_kit", packageId: "brand_full" });
assert(brandDelivery.standard === "brand_asset", "brand kit should use brand asset delivery");
assert(brandDelivery.optionalItems.includes("Logo SVG"), "brand kit should mention SVG logo");

const websiteCost = estimateProductionCost("website_ecommerce_admin", { productionType: "website", features: ["Source file delivery", "Final ZIP", "README", "Revision right"] });
assert(websiteCost.costNotes.some((note) => note.includes("Commerce export package allowance") || note.includes("Project source delivery package allowance")), "website delivery allowance missing");

const workingSourceCost = estimateProductionCost("saas_admin_billing", { productionType: "saas", features: ["Working source package", "Source file delivery", "Final ZIP", "README"] });
assert(workingSourceCost.costNotes.some((note) => note.includes("Working source package build/test allowance")), "working source allowance missing");

const saasProfit = estimateProductionProfit({ packageId: "saas_admin_billing", productionType: "saas", reservedCredits: websiteCost.minimumSafeCredits, features: ["Working source package", "Source file delivery", "Final ZIP", "README"] });
assert(saasProfit.providerCostLines.some((line) => line.label === "Final delivery package"), "profit estimate should include final delivery package cost line");
assert(saasProfit.providerCostLines.some((line) => line.label === "Working source build/test"), "profit estimate should include working source cost line");

const productionRoute = await import("node:fs").then((fs) => fs.readFileSync("src/app/api/productions/route.ts", "utf8"));
for (const term of ["deliveryPackage", "referenceLinkSafety", "deliveryPackageForProduction", "Shared links, competitor websites"]) {
  assert(productionRoute.includes(term), `production route missing ${term}`);
}

const workspace = await import("node:fs").then((fs) => fs.readFileSync("src/components/ProductionWorkspace.tsx", "utf8"));
for (const term of ["Final delivery package", "deliveryRequiredItems", "Formats:"]) {
  assert(workspace.includes(term), `workspace missing ${term}`);
}

const adminTable = await import("node:fs").then((fs) => fs.readFileSync("src/components/AdminProductionsTable.tsx", "utf8"));
for (const term of ["Delivery checklist", "deliveryPackage", "Delivery package"]) {
  assert(adminTable.includes(term), `admin table missing ${term}`);
}

console.log("delivery-package-smoke ok");
