import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { miniMaxStatusFromError, miniMaxStatusFromResponse } from "../src/lib/providers/minimax-status.ts";
import { miniMaxTaskRecord, queryMiniMaxH3VideoTask } from "../src/lib/providers/minimax.ts";
import { buildOutputRegistry } from "../src/lib/output-registry.ts";

const taskId = "437126020350238";
const routeSource = readFileSync(new URL("../src/app/api/automation/status/route.ts", import.meta.url), "utf8");
const providerStatusSource = readFileSync(new URL("../src/lib/providers/status.ts", import.meta.url), "utf8");
assert.match(providerStatusSource, /queryMiniMaxH3VideoTask\(job\.id\)/);
assert.match(routeSource, /finalUrl = storedUrl/);
assert.match(routeSource, /storage_persistence_failed/);
assert.match(routeSource, /delivery_failed/);

const savedApiKey = process.env.MINIMAX_API_KEY;
const savedBaseUrl = process.env.MINIMAX_BASE_URL;
const originalFetch = globalThis.fetch;
let queriedUrl = "";
let queriedHeaders: Headers | undefined;
process.env.MINIMAX_API_KEY = "smoke-test-key";
process.env.MINIMAX_BASE_URL = "https://minimax.test";
globalThis.fetch = (async (input, init) => {
  queriedUrl = String(input);
  queriedHeaders = new Headers(init?.headers);
  return new Response(JSON.stringify({ task: { id: taskId, status: "queued" } }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;
await queryMiniMaxH3VideoTask(taskId);
assert.equal(queriedUrl, `https://minimax.test/v2/query/video_generation/${encodeURIComponent(taskId)}`);
assert.equal(queriedHeaders?.get("authorization"), "Bearer smoke-test-key");
assert.equal(queriedHeaders?.has("group-id"), false);
globalThis.fetch = originalFetch;
for (const [key, value] of Object.entries({ MINIMAX_API_KEY: savedApiKey, MINIMAX_BASE_URL: savedBaseUrl })) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

const fixture = (status: string, extra: Record<string, unknown> = {}) => ({ task: { id: taskId, status, ...extra } });
assert.equal(miniMaxStatusFromResponse(fixture("queued"), taskId).status, "queued");
assert.equal(miniMaxStatusFromResponse(fixture("running"), taskId).status, "running");
const succeeded = miniMaxStatusFromResponse(fixture("succeeded", { content: { url: "https://cdn.minimax.test/video.mp4" } }), taskId);
assert.equal(succeeded.status, "succeeded");
assert.equal(succeeded.outputUrl, "https://cdn.minimax.test/video.mp4");
const failed = miniMaxStatusFromResponse(fixture("failed", { error: { code: "CONTENT_REJECTED", message: "provider rejected task" } }), taskId);
assert.equal(failed.status, "failed");
assert.match(failed.error ?? "", /provider rejected task/);
const cancelled = miniMaxStatusFromResponse(fixture("cancelled"), taskId);
assert.equal(cancelled.status, "cancelled");
const mismatched = miniMaxStatusFromResponse({ task: { id: "different-task", status: "succeeded", content: { url: "https://cdn.minimax.test/video.mp4" } } }, taskId);
assert.equal(mismatched.status, "failed");
assert.equal(mismatched.outputUrl, undefined);
const legacy = miniMaxStatusFromResponse({ task: { id: taskId, status: "succeeded", rawUrls: ["https://cdn.minimax.test/historical.mp4"] } }, taskId);
assert.equal(legacy.status, "failed");
assert.equal(legacy.outputUrl, undefined);
assert.match(legacy.error ?? "", /task\.content\.url/i);
const subtitleOnly = miniMaxStatusFromResponse(fixture("succeeded", { content: { url: "https://cdn.minimax.test/subtitles.srt" } }), taskId);
assert.equal(subtitleOnly.status, "failed");
assert.equal(subtitleOnly.outputUrl, undefined);
assert.equal(miniMaxTaskRecord({ task: { id: taskId, status: "running" } }).taskId, taskId);

for (const httpStatus of [400, 401, 404, 429]) {
  const status = miniMaxStatusFromError({ httpStatus, payload: { error: { message: `HTTP ${httpStatus}` } }, message: `HTTP ${httpStatus}` }, taskId);
  assert.equal(status.status, "failed");
  assert.equal(status.httpStatus, httpStatus);
  assert.equal(status.errorCategory, httpStatus === 404 ? "not_found" : "http_error");
}

const registry = buildOutputRegistry({
  id: "production-test",
  production_type: "video",
  generation_status: "final_video_ready",
  preview_url: "https://cdn.crelavo.test/final.mp4",
  delivery_link: "https://cdn.crelavo.test/final.mp4",
  request_metadata: { deliveryRequirements: { formats: ["final_mp4"], wantsFinalVideo: true } },
  output_json: { finalVideoUrl: "https://cdn.crelavo.test/final.mp4", providerStatus: "minimax_succeeded" }
});
const finalVideo = registry.find((item) => item.id === "final_video");
assert.equal(finalVideo?.status, "ready");
assert.equal(finalVideo?.filename, "final-video.mp4");
console.log("MiniMax official status contract smoke tests passed.");
