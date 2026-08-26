import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const provider = readFileSync("src/lib/providers/openai.ts", "utf8");
const route = readFileSync("src/app/api/websites/generate/route.ts", "utf8");
for (const term of ["WEBSITE_SYSTEM_PROMPT", "rgba alpha", "backdrop-filter", "dashboard or product mockup", "visual workflow timeline", "Choose Plan", "aria-expanded", "smooth-scroll", "alert( call is forbidden", "validateWebsiteQuality", "website_quality_failed", "exactMissingRequirements", "currentFiles"]) {
  assert(provider.includes(term) || route.includes(term), `website generation quality contract missing ${term}`);
}
for (const term of ["hero", "about", "features", "workflow", "pricing", "testimonials", "faq", "contact", "@media", "linear|radial|conic", "rgba", "border", "box-shadow", "data-plan", "pricing-card", "workflow-step", "dashboard-panel", "testimonial-item", "placeholder/template", "alert\\s*\\(", "scrollIntoView"]) {
  assert(provider.includes(term), `deterministic website quality check missing ${term}`);
}
assert(provider.includes("pass <= 2"), "repair loop must be capped at two passes");
assert(route.includes("provider_required"), "missing provider must remain an explicit error");
assert(route.includes('error: error.code'), "quality failures must expose website_quality_failed");
console.log("website-generation-quality-smoke ok");
