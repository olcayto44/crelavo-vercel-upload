import { readFileSync } from "node:fs";
import { buildProviderPreflight } from "../src/lib/automation-preflight.ts";
import { isVideoLikeProductionType, renderQueuePolicyForPackage, safeActiveVideoJobLimit } from "../src/lib/queue-policy.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const projectPreflight = buildProviderPreflight({
  productionType: "website",
  requestMetadata: {
    projectWorkflow: { technicalStack: "Next.js / React responsive website" },
    providerTestMode: false
  },
  inputJson: {},
  videoProvider: "replicate",
  replicateModel: "custom-video-model"
});

assertEqual(projectPreflight.provider, "project_package_builder", "project provider");
assertEqual(projectPreflight.model, "Next.js / React responsive website", "project model");
assertEqual(projectPreflight.durationSeconds, 0, "project duration");
assertEqual(projectPreflight.aspectRatio, "responsive", "project aspectRatio");
assertEqual(projectPreflight.testMode, false, "project testMode");

const videoPreflight = buildProviderPreflight({
  productionType: "video",
  requestMetadata: { ecommerceContext: { targetDurationSeconds: 15 } },
  inputJson: {},
  videoProvider: "replicate",
  replicateModel: "custom-video-model"
});

assertEqual(videoPreflight.provider, "replicate", "video provider");
assertEqual(videoPreflight.model, "custom-video-model", "video model");
assertEqual(videoPreflight.durationSeconds, 15, "video duration");
assertEqual(videoPreflight.aspectRatio, "9:16", "video aspectRatio");

const runwayPreflight = buildProviderPreflight({
  productionType: "campaign",
  requestMetadata: { providerTestMode: true },
  inputJson: {},
  videoProvider: "runway"
});

assertEqual(runwayPreflight.provider, "runway", "runway provider");
assertEqual(runwayPreflight.durationSeconds, 5, "runway test duration");
assertEqual(runwayPreflight.aspectRatio, "720:1280", "runway aspectRatio");
assertEqual(runwayPreflight.testMode, true, "runway testMode");
assertEqual(renderQueuePolicyForPackage("pro").label, "Priority render queue", "pro queue");
assertEqual(renderQueuePolicyForPackage("business").label, "Fastest render queue", "business queue");
const falPreflight = buildProviderPreflight({
  productionType: "campaign",
  requestMetadata: { providerTestMode: true },
  inputJson: {},
  videoProvider: "fal"
});

assertEqual(falPreflight.provider, "fal", "fal provider");
assertEqual(falPreflight.durationSeconds, 5, "fal test duration");
assertEqual(falPreflight.aspectRatio, "9:16", "fal aspectRatio");
assertEqual(renderQueuePolicyForPackage("team").label, "Dedicated production priority", "team queue");
assertEqual(isVideoLikeProductionType("music_video"), true, "video-like production type");
assertEqual(safeActiveVideoJobLimit(), 5, "default active video job limit");

const visuals = readFileSync("src/lib/providers/visuals.ts", "utf8");
const status = readFileSync("src/lib/providers/status.ts", "utf8");
for (const term of ["provider === \"fal\"", "queue.fal.run", "FAL_VIDEO_MODEL", "falApiKey"]) {
  if (!visuals.includes(term) && !status.includes(term)) throw new Error(`FAL provider integration missing term: ${term}`);
}
for (const term of ["getFalStatus", "job.provider === \"fal\"", "/requests/${job.id}/status"]) {
  if (!status.includes(term)) throw new Error(`FAL provider status missing term: ${term}`);
}

console.log("automation-preflight-smoke ok");
