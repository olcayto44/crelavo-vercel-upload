import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const files = {
  terms: join(root, "src", "app", "terms", "page.tsx"),
  privacy: join(root, "src", "app", "privacy", "page.tsx"),
  refund: join(root, "src", "app", "refund-policy", "page.tsx"),
  footer: join(root, "src", "components", "SiteFooter.tsx"),
  siteContent: join(root, "src", "lib", "site-content.ts"),
  sitemap: join(root, "src", "app", "sitemap.ts"),
  pricing: join(root, "src", "app", "pricing", "page.tsx"),
  paymentProvider: join(root, "src", "lib", "payment-provider.ts"),
  paymentCheckout: join(root, "src", "app", "api", "payments", "checkout", "route.ts"),
  lemonWebhook: join(root, "src", "app", "api", "lemon-squeezy", "webhook", "route.ts"),
  envExample: join(root, ".env.example"),
  checklist: join(root, "docs", "lemon-squeezy-application-checklist.md")
};

for (const [label, path] of Object.entries(files)) {
  assert(existsSync(path), `Missing Lemon application file: ${label} (${path})`);
}

const terms = readFileSync(files.terms, "utf8");
const privacy = readFileSync(files.privacy, "utf8");
const refund = readFileSync(files.refund, "utf8");
const footer = readFileSync(files.footer, "utf8");
const siteContent = readFileSync(files.siteContent, "utf8");
const sitemap = readFileSync(files.sitemap, "utf8");
const pricing = readFileSync(files.pricing, "utf8");
const paymentProvider = readFileSync(files.paymentProvider, "utf8");
const paymentCheckout = readFileSync(files.paymentCheckout, "utf8");
const lemonWebhook = readFileSync(files.lemonWebhook, "utf8");
const envExample = readFileSync(files.envExample, "utf8");
const checklist = readFileSync(files.checklist, "utf8");

for (const term of ["Terms of Service", "support@crelavo.com", "Refund / Cancellation Policy", "Lemon Squeezy"]) {
  assert(terms.includes(term), `Terms page missing term: ${term}`);
}
for (const term of ["Privacy Policy", "Payments are processed by Lemon Squeezy", "support@crelavo.com"]) {
  assert(privacy.includes(term), `Privacy page missing term: ${term}`);
}
for (const term of ["Refund / Cancellation Policy", "14 days", "paid 24-hour preview", "non-refundable", "support@crelavo.com"]) {
  assert(refund.includes(term), `Refund page missing term: ${term}`);
}
for (const term of ["/terms", "/privacy", "/refund-policy", "Terms of Service", "Privacy Policy", "Refund / Cancellation Policy"]) {
  assert(footer.includes(term) || siteContent.includes(term), `Footer/legal link missing term: ${term}`);
}
for (const term of ["/terms", "/privacy", "/refund-policy"]) {
  assert(sitemap.includes(term), `Sitemap missing legal route: ${term}`);
}
for (const term of ["$", "credits", "subscription", "top-up"]) {
  assert(pricing.toLowerCase().includes(term.toLowerCase()), `Pricing page missing application clarity term: ${term}`);
}
for (const term of ["PAYMENT_PROVIDER=lemon_squeezy", "LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET"]) {
  assert(envExample.includes(term), `.env.example missing Lemon env: ${term}`);
}
for (const term of ["createLemonSqueezyCheckout", "manualActivation", "lemonVariantEnvForProduct"]) {
  assert(paymentCheckout.includes(term) || paymentProvider.includes(term), `Lemon checkout path missing term: ${term}`);
}
for (const term of ["verifySignature", "order_created", "subscription_payment_success", "subscription_payment_failed", "subscription_cancelled"]) {
  assert(lemonWebhook.includes(term), `Lemon webhook missing term: ${term}`);
}
for (const forbidden of ["Lorem ipsum", "lorem ipsum", "Under Construction", "under construction"]) {
  assert(![terms, privacy, refund, footer, siteContent, pricing, checklist].some((source) => source.includes(forbidden)), `Application surface contains forbidden placeholder term: ${forbidden}`);
}
for (const term of ["Lemon Squeezy Application Checklist", "https://crelavo.com", "Terms of Service", "Privacy Policy", "Refund / Cancellation Policy", "PAYMENT_PROVIDER=lemon_squeezy", "support@crelavo.com"]) {
  assert(checklist.includes(term), `Lemon application checklist missing term: ${term}`);
}

console.log("lemon-application-smoke ok");
