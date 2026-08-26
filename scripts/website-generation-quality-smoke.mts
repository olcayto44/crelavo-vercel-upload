import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const provider = readFileSync("src/lib/providers/openai.ts", "utf8");
const route = readFileSync("src/app/api/websites/generate/route.ts", "utf8");
for (const term of ["WEBSITE_SYSTEM_PROMPT", "rgba alpha", "backdrop-filter", "dashboard or product mockup", "visual workflow timeline", "Choose Plan", "aria-expanded", "smooth-scroll", "alert( call is forbidden", "validateWebsiteQuality", "website_quality_failed", "exactMissingRequirements", "currentFiles"]) {
  assert(provider.includes(term) || route.includes(term), `website generation quality contract missing ${term}`);
}
for (const term of ["hero", "about", "features", "workflow", "pricing", "testimonials", "faq", "contact", "@media", "linear|radial|conic", "rgba", "border", "box-shadow", "data-plan", "pricing-card", "workflow-step", "dashboard-panel", "testimonial-item", "placeholder/template", "alert\\s*\\(", "scrollIntoView", "picture", "inline SVG", "details", "aria-expanded"]) {
  assert(provider.includes(term), `deterministic website quality check missing ${term}`);
}

const highQualityVariant = {
  html: `<main><section class="masthead"><div class="hero-visual"></div><a class="primary-action" href="#plans">Explore plans</a><button data-cta="contact">Contact sales</button></section><section id="company"><h2>Our story</h2></section><section class="benefits"><h2>Capabilities</h2></section><section id="process"><div class="process-step">One</div><div class="timeline-step">Two</div><div data-step="three">Three</div><div class="dashboard-panel">A</div><div class="mockup-card">B</div><div class="interface-widget">C</div></section><section class="plans"><article class="tier-card"><h3>Starter</h3><a data-plan="starter">Choose plan</a></article><article class="pricing__card"><h3>Growth</h3><button data-plan="growth">Choose plan</button></article><article class="package-card"><h3>Scale</h3><a data-plan="scale"><span>Choose plan</span></a></article></section><section class="reviews"><article class="review-card">A</article><article class="testimonial-item">B</article></section><section id="questions"><details><summary>Question one</summary>Answer</details><details><summary>Question two</summary>Answer</details></section><section class="get-in-touch"><h2>Contact</h2></section><link href="./styles.css"><script src="script.js"></script></main>`,
  css: `.hero-visual { min-height: 20rem; background: linear-gradient(red, blue); border-radius: 1rem; } body { color: black; } h1 { font-size: 4rem; } h2 { font-size: 2rem; } .surface { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(1rem); border: 1px solid white; box-shadow: 0 1rem 2rem black; } @media (max-width: 60rem) {}`,
  js: `document.querySelectorAll('[aria-expanded]').forEach((button) => button.addEventListener('click', () => button.setAttribute('aria-expanded', 'true'))); document.querySelectorAll('[data-plan]').forEach((button) => button.addEventListener('click', () => document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' })));`
};
const weakFixture = `${highQualityVariant.html.replace(/<div class="hero-visual"><\/div>/, "").replace(/<article class="package-card">[\s\S]*?<\/article>/, "")} placeholder alert(`;
assert(/class="masthead"/.test(highQualityVariant.html) && /class="plans"/.test(highQualityVariant.html), "quality fixture must use semantic variations");
assert(/class="hero-visual"/.test(highQualityVariant.html) && /\.hero-visual[^{]*\{[^}]*background/.test(highQualityVariant.css), "CSS visual fixture must have a concrete visual block");
assert((highQualityVariant.html.match(/(?:process-step|timeline-step|data-step)/g) ?? []).length >= 3, "quality fixture must contain three workflow variants");
assert((highQualityVariant.html.match(/(?:tier-card|pricing__card|package-card)/g) ?? []).length >= 3, "quality fixture must contain three pricing variants");
assert(!/(?:lorem\s+ipsum|placeholder|alert\s*\()/i.test(highQualityVariant.html + highQualityVariant.css + highQualityVariant.js), "quality fixture must be clean");
assert(/placeholder|alert\s*\(/i.test(weakFixture) && !/<article class="package-card">/.test(weakFixture), "weak fixture must remain distinguishable");
assert(provider.includes("pass <= 2"), "repair loop must be capped at two passes");
assert(provider.includes("minimumConcretePatterns"), "repair prompt must include concrete pattern guidance");
assert(route.includes("provider_required"), "missing provider must remain an explicit error");
assert(route.includes('error: error.code'), "quality failures must expose website_quality_failed");
console.log("website-generation-quality-smoke ok");
