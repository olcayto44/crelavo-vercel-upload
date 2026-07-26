import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const finalChecklist = readFileSync(join(process.cwd(), "docs", "final-api-env-checklist.md"), "utf8");
const launchBlockers = readFileSync(join(process.cwd(), "docs", "launch-blockers.md"), "utf8");
const manualChecklist = readFileSync(join(process.cwd(), "docs", "manual-e2e-checklist.md"), "utf8");

for (const term of [
  "API/env key setup is deferred until final testing",
  "Do not paste real secrets into chat or documentation",
  "PAYMENT_PROVIDER=whop",
  "WHOP_API_KEY",
  "WHOP_WEBHOOK_SECRET",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "TURNSTILE_SECRET_KEY",
  "LEMON_VARIANT_PRO_MONTHLY",
  "LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME",
  "RESEND_API_KEY",
  "SUPPORT_EMAIL",
  "SUPPORT_FROM_EMAIL",
  "OPENAI_API_KEY",
  "REPLICATE_API_TOKEN",
  "npm run smoke:env-readiness",
  "npm run smoke",
  "npm run build",
  "/admin/packages",
  "Check payment env",
  "Cloudflare edge security",
  "Whop checkout",
  "payment.succeeded",
  "production-ready email"
]) {
  assert(finalChecklist.includes(term), `final API/env checklist missing term: ${term}`);
}

for (const term of [
  "pre-API / non-payment launch readiness",
  "Finish all launch-before-API work first",
  "Add final API/env keys only after",
  "docs/final-api-env-checklist.md",
  "Phase 2 backlog after core launch validation",
  "Affiliate / referral MVP",
  "Team workspace MVP",
  "Social Export Pack",
  "Full ads/ROAS/social automation"
]) {
  assert(launchBlockers.includes(term), `launch blockers missing term: ${term}`);
}

for (const term of [
  "## Current testing rule",
  "### Pre-API pass",
  "### Final API/env pass",
  "API/env key setup is deferred until final testing",
  "docs/final-api-env-checklist.md",
  "Check payment env",
  "Cloudflare",
  "Whop"
]) {
  assert(manualChecklist.includes(term), `manual E2E checklist missing term: ${term}`);
}

console.log("final-api-env-checklist-smoke ok");
