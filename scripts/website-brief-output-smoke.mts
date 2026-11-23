import { generateWebsiteArtifact } from "../src/lib/website-engine.ts";
import { buildDeliveryEntries, buildDeliveryZip, buildPreviewHtml } from "../src/lib/automatic-delivery-builder.ts";
import { strict as assert } from "node:assert";
delete process.env.OPENAI_API_KEY;
const generated = await generateWebsiteArtifact({
  brand: "Lale Bahçe",
  brief: "Yerel çiçekçi için buket, özel gün çiçekleri ve teslimat hizmeti sunan kurumsal bir web sitesi.",
  audience: "Çiçek siparişi veren yerel müşteriler",
  siteType: "Çiçekçi tanıtım sitesi",
  style: "Minimal, doğal",
  pages: ["Home", "About", "Services", "Contact"],
  features: ["Buket tasarımları", "Özel gün çiçekleri", "Sipariş iletişimi"],
  scope: "marketing_website",
  locale: "tr"
}, "11111111-1111-4111-8111-111111111111");
const index = generated.files.find(file => file.path === "index.html")?.content || "";
assert(index.includes("Lale Bahçe"), "brand missing from generated website");
assert(index.includes("Çiçekçi tanıtım sitesi"), "site type missing from generated headline");
assert(index.includes("Buket tasarımları"), "customer features missing");
assert(index.includes("Yerel çiçekçi"), "customer brief missing");
assert(!index.includes("Customer voice"), "fabricated testimonial placeholder");
assert(generated.pageManifest.length === 4, "requested pages must be generated");
for (const page of generated.pageManifest) {
  assert(generated.files.some(file => file.path === page.path), "missing page: " + page.path);
}
const production = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Lale Bahçe website",
  production_type: "website",
  package_id: "website_builder",
  prompt: "Flower shop",
  input_json: {},
  request_metadata: {},
  output_json: { websiteFiles: generated.files, pageManifest: generated.pageManifest, websiteContent: generated.websiteContent, plan: generated.plan }
};
const preview = buildPreviewHtml(production, "index.html");
assert(preview.includes("Lale Bahçe"), "preview lost user brief");
const entries = buildDeliveryEntries(production);
const zip = buildDeliveryZip(entries);
assert(zip.length > 0, "ZIP must not be empty");
assert(entries.some(item => item.name === "source/contact.html"), "ZIP missing requested contact page");
console.log("website-brief-output-smoke ok: brief, pages, preview and ZIP remain consistent; no credit mutation");
