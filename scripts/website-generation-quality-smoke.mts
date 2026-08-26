import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const provider = readFileSync("src/lib/providers/openai.ts", "utf8");
const route = readFileSync("src/app/api/websites/generate/route.ts", "utf8");
for (const term of ["WEBSITE_SYSTEM_PROMPT", "backdrop-filter", "dashboard or product mockup", "visual workflow timeline", "Choose Plan", "aria-expanded", "validateWebsiteQuality", "generation_failed", "currentGeneration", "missingRequirements"]) {
  assert(provider.includes(term) || route.includes(term), `website generation quality contract missing ${term}`);
}
for (const term of ["hero", "about", "features", "workflow", "pricing", "testimonials", "faq", "contact", "@media", "linear|radial|conic", "data-plan"]) {
  assert(provider.includes(term), `deterministic website quality check missing ${term}`);
}
assert(route.includes("provider_required"), "missing provider must remain an explicit error");
console.log("website-generation-quality-smoke ok");
