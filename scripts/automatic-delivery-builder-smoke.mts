import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { automaticDeliveryLinks, buildDeliveryEntries, buildDeliveryManifest, buildDeliveryReadme, buildDeliveryZip, buildPreviewHtml, buildSourceGuide } from "../src/lib/automatic-delivery-builder.ts";

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
assert(preview.includes("<!doctype html>"), "preview html missing doctype");const revisedWebsite = {
  ...production,
  package_id: "website_builder",
  output_json: {
    websiteContent: {
      siteTitle: "Revised Site",
      tagline: "A sharper promise",
      heroTitle: "Move faster",
      heroBody: "A clearer explanation.",
      primaryCta: "Start now",
      aboutTitle: "Built for focus",
      aboutBody: "A revised approach.",
      features: ["One", "Two", "Three"]
    },
    websiteFiles: [
      { path: "index.html", content: '<html><head><title>Old Site</title></head><body><section id="hero"><p class="eyebrow">Old tagline</p><h1>Old hero</h1><p class="hero-intro">Old body</p><a class="cta primary-cta">Old CTA</a></section><section id="about"><h2>Old about</h2><p>Old about body</p></section><article class="feature-card"><h3>Old feature</h3></article><article class="feature-card"><h3>Old feature 2</h3></article><article class="feature-card"><h3>Old feature 3</h3></article></body></html>' },
      { path: "styles.css", content: "" },
      { path: "script.js", content: "" }
    ]
  }
};
const revisedPreview = buildPreviewHtml(revisedWebsite);
for (const term of ["Revised Site", "A sharper promise", "Move faster", "A clearer explanation.", "Start now", "Built for focus", "A revised approach.", ">One<", ">Two<", ">Three<"]) {
  assert(revisedPreview.includes(term), `revised content missing ${term}`);
}

const extendedWebsite = {
  ...revisedWebsite,
  output_json: {
    ...revisedWebsite.output_json,
    websiteContent: {
      ...revisedWebsite.output_json.websiteContent,
      contactTitle: 'Talk <safely>', contactBody: 'New contact copy', contactEmail: 'hello@example.com',
      faqQuestions: ['New question?', '', 'Third question?'], faqAnswers: ['Safe <answer>', '', 'Third answer']
    },
    websiteFiles: revisedWebsite.output_json.websiteFiles.map((file) => file.path === 'index.html' ? { ...file, content: file.content.replace('</body>', '<section id="faq"><button class="faq-trigger" aria-expanded="true" aria-controls="panel-0">Old question<span aria-hidden="true">+</span></button><div id="panel-0" class="faq-panel"><p>Old answer</p></div><button class="faq-trigger">Keep question</button><div class="faq-panel"><p>Keep answer</p></div><button class="faq-trigger">Third old</button><div class="faq-panel"><p>Third old answer</p></div></section><section id="contact"><p class="eyebrow">Start here</p><h2>Old contact</h2><p>Old contact copy</p><form class="contact-form"><input type="email" required><button>Send</button></form></section></body>') } : file)
  }
};
const extendedPreview = buildPreviewHtml(extendedWebsite);
for (const text of ['New question?', 'Safe &lt;answer&gt;', 'Keep question', 'Keep answer', 'Third question?', 'Third answer', 'Talk &lt;safely&gt;', 'New contact copy', 'mailto:hello@example.com', 'aria-controls="panel-0"', '<span aria-hidden="true">+</span>', '<form class="contact-form">']) {
  assert(extendedPreview.includes(text), `extended CMS preview missing ${text}`);
}
const extendedEntries = buildDeliveryEntries(extendedWebsite);
const sourceIndex = extendedEntries.find((entry) => entry.name === 'source/index.html');
assert(Boolean(sourceIndex?.content.includes('Safe &lt;answer&gt;') && sourceIndex.content.includes('mailto:hello@example.com')), 'ZIP source must contain FAQ/contact revisions');
assert(!extendedWebsite.output_json.websiteFiles[0].content.includes('New question?'), 'CMS delivery must not mutate original source');
const extendedZip = new TextDecoder().decode(buildDeliveryZip(extendedEntries));
assert(extendedZip.includes('New question?') && extendedZip.includes('mailto:hello@example.com'), 'ZIP bytes missing revised content');
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

const cmsRoute = readFileSync('src/app/api/website-content/[id]/route.ts', 'utf8');
const revisionFunction = cmsRoute.slice(cmsRoute.indexOf('function applyNaturalRevision('), cmsRoute.indexOf('async function getOwnedWebsite('));
const revise = new Function(stripTypeScriptTypes(revisionFunction) + '; return applyNaturalRevision;')() as (current: Record<string, unknown>, instruction: string) => Record<string, unknown>;
assert(revise({ heroTitle: 'Keep hero' }, 'İletişim başlığını Bize ulaşın olarak değiştir.').contactTitle === 'Bize ulaşın', 'contact title command must not change hero title');
assert(revise({}, 'Hakkımızda başlığını Ekibimiz olarak değiştir.').aboutTitle === 'Ekibimiz', 'about command must precede generic title command');
const faqRevision = revise({}, 'SSS 3 soru: Üçüncü soru?');
assert(JSON.stringify(faqRevision.faqQuestions) === JSON.stringify(['', '', 'Üçüncü soru?']), 'numbered FAQ revision must retain positions');
assert(revise({}, 'İletişim e-postası: destek@example.com').contactEmail === 'destek@example.com', 'contact email revision failed');
assert(revise({}, 'Change the hero title to Start faster.').heroTitle === 'Start faster', 'English revision connector must not become content');
console.log("automatic-delivery-builder-smoke ok");
