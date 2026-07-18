import { readFileSync } from "node:fs";
import { join } from "node:path";

const trackingLib = readFileSync(join(process.cwd(), "src", "lib", "analytics-tracking.ts"), "utf8");
const liveTracker = readFileSync(join(process.cwd(), "src", "components", "LiveVisitorTracker.tsx"), "utf8");
const liveVisitors = readFileSync(join(process.cwd(), "src", "lib", "live-visitors.ts"), "utf8");
const heartbeatRoute = readFileSync(join(process.cwd(), "src", "app", "api", "analytics", "heartbeat", "route.ts"), "utf8");
const adminLiveCard = readFileSync(join(process.cwd(), "src", "components", "AdminLiveVisitorsCard.tsx"), "utf8");
const adminGrowth = readFileSync(join(process.cwd(), "src", "app", "admin", "growth", "page.tsx"), "utf8");
const adsRoas = readFileSync(join(process.cwd(), "src", "app", "admin", "ads-roas", "page.tsx"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");

for (const term of [
  "trackingEventDefinitions",
  "paidTrafficChannelPlan",
  "analyticsReadinessChecklist",
  "analyticsEnvVariables",
  "page_view_attributed",
  "checkout_started",
  "paid_conversion_verified",
  "Whop",
  "Lemon remains postponed",
  "buildTrackedUrl"
]) {
  if (!trackingLib.includes(term)) throw new Error(`Analytics tracking lib missing term: ${term}`);
}

for (const term of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "firstTouch", "clipora_attribution"]) {
  if (!liveTracker.includes(term)) throw new Error(`LiveVisitorTracker missing attribution term: ${term}`);
}

for (const term of ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "firstTouchAt", "firstTouch"]){
  if (!liveVisitors.includes(term) && !heartbeatRoute.includes(term)) throw new Error(`Heartbeat/live visitor attribution missing term: ${term}`);
}

for (const term of ["Campaign", "utm", "ref", "First touch", "Source / medium"]){
  if (!adminLiveCard.includes(term)) throw new Error(`Admin live visitor card missing campaign display: ${term}`);
}

for (const term of ["Analytics tracking readiness", "trackingEventDefinitions", "paidTrafficChannelPlan", "analyticsEnvVariables"]){
  if (!adminGrowth.includes(term) && !adsRoas.includes(term)) throw new Error(`Admin analytics readiness UI missing term: ${term}`);
}

if (!packageJson.includes("smoke:analytics-tracking")) throw new Error("package.json missing smoke:analytics-tracking script");

console.log("analytics-tracking-smoke ok");
