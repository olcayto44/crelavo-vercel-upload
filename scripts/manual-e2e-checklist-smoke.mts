import { readFileSync } from "node:fs";
import { join } from "node:path";

const checklistPath = join(process.cwd(), "docs", "manual-e2e-checklist.md");
const content = readFileSync(checklistPath, "utf8");

const requiredSections = [
  "## Preflight",
  "## Non-payment Manual E2E",
  "## Assistant Routing",
  "## Public Entry Points",
  "## Production Creation",
  "## Automation Start",
  "## Workspace Visibility",
  "## Admin Visibility",
  "## Payment and Email Delivery",
  "## Credit Flow",
  "## Legacy Guard",
  "## Acceptance"
];

const requiredTerms = [
  "[PASS]",
  "[FAIL]",
  "screenshot/log reference",
  "npm run smoke",
  "npm run build",
  "npm run smoke:env-readiness",
  "RESEND_API_KEY",
  "SUPPORT_EMAIL",
  "SUPPORT_FROM_EMAIL",
  "Supabase Auth email confirmation",
  "Supabase SMTP settings",
  "LEMON_SQUEEZY_API_KEY",
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL=https://crelavo.com",
  "FAL_KEY",
  "FAL_API_KEY",
  "Non-payment Manual E2E",
  "Stop before Lemon Squeezy checkout",
  "real provider spend",
  "duplicate keys or malformed assignment values",
  "PAYMENT_NOTIFICATION_EMAIL",
  "Crelavo payment receipt email",
  "owner/admin receives the Crelavo payment received notification",
  "subscription payment success, payment failed and cancellation notifications",
  "production-ready email",
  "without blocking the admin update",
  "npm run dev",
  "/dashboard/assistant-workspace",
  "project_package_builder",
  "responsive",
  "First-phase API priority list",
  "OpenAI, Runway/video provider, image generation, Voice/TTS, video editing/render, Lemon Squeezy, Supabase, Resend and Storage/CDN",
  "insufficient-credit warning",
  "Start production is disabled",
  "customer revision queue",
  "Final customer delivery, Source files and README/setup",
  "Drama / Short Series",
  "dramaDetails.format",
  "Drone / Satellite Video",
  "marked map/satellite area",
  "shot type",
  "map/satellite style",
  "camera movement",
  "droneDetails.shotType",
  "droneDetails.mapStyle",
  "droneDetails.cameraMovement",
  "droneDetails.narrationLanguage",
  "droneDetails.subtitleOption",
  "AI Live Sales Agent",
  "avatar source",
  "self avatar upload",
  "own voice upload",
  "background/set",
  "subtitle/caption option",
  "liveSalesAgentDetails.productLinkDetails",
  "liveSalesAgentDetails.brandName",
  "liveSalesAgentDetails.avatarSource",
  "liveSalesAgentDetails.voiceSource",
  "liveSalesAgentDetails.voiceTone",
  "liveSalesAgentDetails.subtitleOption",
  "liveSalesAgentDetails.providerReadiness",
  "human fallback",
  "pay-as-you-go API cost estimate",
  "10/40/120 fair-use live hours",
  "add an AI Live Sales Agent package",
  "remove selected production packages",
  "Music Video / MV upload dropdown",
  "musicVideoMaterialGroups.song_audio",
  "performance_video_reference",
  "50% cancellation fee",
  "/dashboard/create"
];

for (const section of requiredSections) {
  if (!content.includes(section)) throw new Error(`Manual E2E checklist missing section: ${section}`);
}

for (const term of requiredTerms) {
  if (!content.includes(term)) throw new Error(`Manual E2E checklist missing term: ${term}`);
}

console.log("manual-e2e-checklist-smoke ok");
