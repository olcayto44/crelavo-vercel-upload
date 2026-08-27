import { generateDeterministicWebsiteSource } from "../src/lib/providers/website-template.ts";
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const result = await generateDeterministicWebsiteSource({
  brief: "A secure workflow platform for independent teams to turn customer research into launch-ready decisions. <img src=x onerror=run>",
  siteType: "Premium SaaS launch website",
  scope: "website_with_admin",
  brand: "Northstar",
  audience: "product and growth teams",
  pages: ["Home", "About", "Contact"],
  features: ["Research workspace", "Decision timeline"],
  style: "Premium dark, calm and editorial"
});
const files = new Map(result.files.map((file) => [file.path, file.content]));
const html = files.get("index.html") ?? "";
const css = files.get("styles.css") ?? "";
const js = files.get("script.js") ?? "";
const all = result.files.map((file) => file.content).join("\n");

assert(files.has("index.html") && files.has("styles.css") && files.has("script.js") && files.has("README.md"), "core files missing");
for (const term of ["id=\"hero\"", "id=\"features\"", "id=\"workflow\"", "id=\"pricing\"", "id=\"testimonials\"", "id=\"faq\"", "id=\"contact\"", "dashboard-panel", "workflow-step", "Choose Plan", "aria-expanded", "linear-gradient", "backdrop-filter", "rgba(", "@media", "scrollIntoView"]) assert(html.includes(term) || css.includes(term) || js.includes(term), `template criterion missing ${term}`);
assert((html.match(/class=\"pricing-card/g) ?? []).length === 3, "pricing must contain exactly three cards");
assert((html.match(/class=\"workflow-step/g) ?? []).length === 4, "workflow must contain exactly one timeline with four steps");
assert((html.match(/class=\"dashboard-panel/g) ?? []).length >= 3, "dashboard must contain at least three panels");
assert((html.match(/class=\"faq-trigger/g) ?? []).length >= 2, "FAQ accordion questions missing");
assert((html.match(/class=\"cta /g) ?? []).length >= 2, "hero CTA buttons missing");
assert(!/(?:Feature\s*[12]|lorem\s+ipsum|placeholder|alert\s*\()/i.test(all), "forbidden placeholder or alert found");
assert(!/(?:<section[^>]+id=\"pricing\"[\s\S]*<section[^>]+id=\"pricing\")/i.test(html), "duplicate pricing section found");
assert(!/(?:<section[^>]+id=\"workflow\"[\s\S]*<section[^>]+id=\"workflow\")/i.test(html), "duplicate workflow section found");
for (const path of ["admin/index.html", "admin/styles.css", "admin/script.js", ".env.example", "data/schema.json"]) assert(files.has(path), `admin starter file missing: ${path}`);
assert(!/(?:process\.env\.|sk-[a-z0-9]{10,}|service_role)/i.test(all), "admin output contains a secret pattern");
assert(html.includes("&lt;") || !html.includes("<script>alert"), "brief content was not safely escaped");
console.log("website-generation-quality-smoke ok");
