import { readFileSync } from "node:fs";
import { automaticDeliveryLinks, buildDeliveryManifest, buildDeliveryReadme, buildDeliveryZip, buildPreviewHtml, buildSourceGuide } from "../src/lib/automatic-delivery-builder.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const production = {
  id: "prod_123",
  title: "Shopify Store Pack",
  prompt: "Create e-commerce assets",
  production_type: "website",
  package_id: "website_ecommerce_admin",
  request_metadata: {
    commerceWorkflow: { storePlatform: "Shopify", storeAssetGoal: "Product page and store banner" },
    projectWorkflow: { technicalStack: "Next.js / React", sourceDelivery: "source_zip" },
    referenceLinkSafety: "References are analysis-only."
  },
  input_json: {},
  materials_json: []
};

const links = automaticDeliveryLinks(production.id);
assert(links.deliveryZipUrl.includes("/api/productions/prod_123/delivery?file=zip"), "zip delivery link missing");
assert(links.readmeUrl.includes("file=readme"), "readme link missing");

const manifest = buildDeliveryManifest(production);
assert(manifest.delivery_standard === "commerce_export", "commerce export manifest expected");
assert(manifest.required_items.includes("Store asset ZIP"), "store asset zip expected");
assert(manifest.links.deliveryZipUrl === links.deliveryZipUrl, "manifest should include automatic delivery links");

const readme = buildDeliveryReadme(production);
assert(readme.includes("## Delivery Standard"), "readme should include delivery standard");
assert(readme.includes("Reference Link Safety"), "readme should include reference safety");

const source = buildSourceGuide(production);
assert(source.includes("Source / Export Guide"), "source guide missing");

const preview = buildPreviewHtml(production);
assert(preview.includes("<!doctype html>"), "preview html missing doctype");

const zip = buildDeliveryZip([{ name: "README.md", content: readme }, { name: "manifest.json", content: JSON.stringify(manifest) }]);
assert(zip.length > 100, "zip should contain bytes");
assert(zip[0] === 0x50 && zip[1] === 0x4b, "zip should start with PK signature");

const route = readFileSync("src/app/api/productions/[id]/delivery/route.ts", "utf8");
for (const term of ["buildDeliveryManifest", "buildDeliveryZip", "file === \"zip\"", "application/zip", "file === \"readme\""]) {
  assert(route.includes(term), `delivery route missing ${term}`);
}

const automationStart = readFileSync("src/app/api/automation/start/route.ts", "utf8");
for (const term of ["automaticDeliveryLinks", "deliveryLinks.deliveryZipUrl", "source_files_url", "automaticDeliveryLinks: deliveryLinks"]) {
  assert(automationStart.includes(term), `automation start missing ${term}`);
}

console.log("automatic-delivery-builder-smoke ok");
