import { readFileSync } from "node:fs";
import {
  hasCinematicActionIntent,
  hasHeyGenPresenterIntent,
  isAllowedHeyGenPresenterProvider,
  sanitizeProviderRouteSignal,
  shouldForceHeyGenPresenterProvider
} from "../src/lib/heygen-routing.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

const ugcWithNegativeGuardrails = `
production_type talking_video package video_premium
Create a natural UGC-style product ad with one AI presenter speaking directly to camera in Turkish.
Selected setup: AI presenter · Video Agent auto edit · Young energetic creator · UGC-style product script · Vertical 9:16 · With presenter · Adult neutral voice
Thumbnail / cover prompt: Vertical 9:16 UGC ad cover. No text, no fake logo.
Avoid / exclusions: Avoid cartoon, anime, stickman, motion graphics-only video, cinematic action, battle scenes, no-presenter b-roll, silent video, Replicate-style generic visual clip, horizontal 16:9 output.
`;

assertEqual(hasHeyGenPresenterIntent(ugcWithNegativeGuardrails), true, "UGC presenter intent survives negative guardrails");
assertEqual(hasCinematicActionIntent(ugcWithNegativeGuardrails), false, "Avoid cinematic action is not positive cinematic action intent");
assertEqual(shouldForceHeyGenPresenterProvider({ productionType: "talking_video", routeSignal: ugcWithNegativeGuardrails }), true, "talking_video forces HeyGen provider");
assertEqual(isAllowedHeyGenPresenterProvider("replicate"), false, "replicate is not allowed for presenter delivery");
assertEqual(isAllowedHeyGenPresenterProvider("heygen_video_agent"), true, "HeyGen Video Agent is allowed for presenter delivery");

const sanitized = sanitizeProviderRouteSignal(ugcWithNegativeGuardrails);
for (const forbidden of ["avoid / exclusions", "replicate-style generic", "cinematic action", "no-presenter b-roll", "horizontal 16:9"]) {
  if (sanitized.includes(forbidden)) throw new Error(`sanitized route signal still contains negative guardrail phrase: ${forbidden}`);
}

const realCinematicAction = "Create a cinematic action battle scene with sci-fi melee fighters and no presenter";
assertEqual(hasCinematicActionIntent(realCinematicAction), true, "real cinematic action still routes as cinematic action");
assertEqual(hasHeyGenPresenterIntent(realCinematicAction), false, "real no-presenter action is not HeyGen presenter");

const startRoute = readFileSync("src/app/api/automation/start/route.ts", "utf8");
const statusRoute = readFileSync("src/app/api/automation/status/route.ts", "utf8");
for (const [label, source] of [["automation/start", startRoute], ["automation/status", statusRoute]] as const) {
  if (!source.includes("@/lib/heygen-routing")) throw new Error(`${label} must import shared HeyGen routing helper`);
}
if (startRoute.includes("talkingProviderType && providerReadiness.canStartRealProvider")) {
  throw new Error("talking_video must not wait for providerReadiness before attempting HeyGen start");
}
if (!statusRoute.includes("quality_gate_blocked_wrong_presenter_provider")) {
  throw new Error("status route must block generic providers for presenter videos");
}

console.log("HeyGen routing smoke passed");
