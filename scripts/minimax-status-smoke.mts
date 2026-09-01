import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { miniMaxStatusFromError, miniMaxStatusFromResponse } from "../src/lib/providers/minimax-status.ts";
import { miniMaxTaskRecord, queryMiniMaxH3VideoTask } from "../src/lib/providers/minimax.ts";
import { buildOutputRegistry } from "../src/lib/output-registry.ts";

const taskId = "437126020350238";
const productionWorkspaceSource = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");
const automationStatusSource = readFileSync(new URL("../src/app/api/automation/status/route.ts", import.meta.url), "utf8");
const providerStatusSource = readFileSync(new URL("../src/lib/providers/status.ts", import.meta.url), "utf8");
const workAssistantSource = readFileSync(new URL("../src/components/WorkAssistant.tsx", import.meta.url), "utf8");
assert.match(productionWorkspaceSource, /const providerProofStatus/);
assert.match(productionWorkspaceSource, /const mediaOutputReleased/);
assert.match(productionWorkspaceSource, /customer-preview-theater/);
assert.match(workAssistantSource, /productionProviderProof/);
assert.match(providerStatusSource, /queryMiniMaxH3VideoTask\(job\.id\)/);
assert.match(automationStatusSource, /provider_job_id: effectiveProviderJobId/);
assert.match(automationStatusSource, /finalVideoUrl: finalUrl/);
assert.match(automationStatusSource, /preview_url: finalUrl/);
assert.match(automationStatusSource, /startsWith\("refunded_reserved"\)/);
assert.match(automationStatusSource, /credit_events/);

const savedApiKey = process.env.MINIMAX_API_KEY;
const savedGroupId = process.env.MINIMAX_GROUP_ID;
const savedBaseUrl = process.env.MINIMAX_BASE_URL;
const originalFetch = globalThis.fetch;
let queriedUrl = "";
process.env.MINIMAX_API_KEY = "smoke-test-key";
process.env.MINIMAX_GROUP_ID = "smoke-test-group";
process.env.MINIMAX_BASE_URL = "https://minimax.test";
globalThis.fetch = (async (input) => {
  queriedUrl = String(input);
  return new Response(JSON.stringify({ task: { task_id: taskId, status: "submitted" } }), { status: 200 });
}) as typeof fetch;
await queryMiniMaxH3VideoTask(taskId);
assert.equal(queriedUrl, `https://minimax.test/v2/query/video_generation?task_id=${taskId}`);
globalThis.fetch = originalFetch;
for (const [key, value] of Object.entries({ MINIMAX_API_KEY: savedApiKey, MINIMAX_GROUP_ID: savedGroupId, MINIMAX_BASE_URL: savedBaseUrl })) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

const submitted = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "submitted" } }, taskId);
assert.equal(submitted.provider, "minimax");
assert.equal(submitted.id, taskId);
assert.equal(submitted.status, "queued");

const succeeded = miniMaxStatusFromResponse({ data: { task: { task_id: taskId, status: "succeeded", content: { url: "https://api.minimax.io/v2/files/video.mp4" } } } }, taskId);
assert.equal(succeeded.status, "succeeded");
assert.equal(succeeded.outputUrl, "https://api.minimax.io/v2/files/video.mp4");

const failed = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "failed", error: { code: "CONTENT_REJECTED", message: "provider rejected task" } } }, taskId);
assert.equal(failed.status, "failed");
assert.match(failed.error ?? "", /provider rejected task/);

const running = miniMaxStatusFromResponse({ task_id: taskId, status: "processing" }, taskId);
assert.equal(running.status, "running");
assert.equal(running.providerResponseStatus, "processing");
assert.equal(running.outputUrl, undefined);

for (const status of ["queued", "submitted", "processing", "running", "rendering", "generating", "in_progress"]) {
  const normalized = miniMaxStatusFromResponse({ data: { status } }, taskId);
  assert.equal(normalized.status, ["queued", "submitted"].includes(status) ? "queued" : "running", `data.status ${status}`);
  assert.equal(normalized.providerResponseStatus, status);
}

assert.equal(miniMaxStatusFromResponse({ data: { task_status: "running" } }, taskId).status, "running");
assert.equal(miniMaxStatusFromResponse({ data: { task_status: { status_code: "processing" } } }, taskId).status, "running");
assert.equal(miniMaxStatusFromResponse({ data: { task_status: "completed", task_result: { video_url: "https://cdn.minimax.io/result.mp4" } } }, taskId).outputUrl, "https://cdn.minimax.io/result.mp4");
assert.equal(miniMaxStatusFromResponse({ data: { status_code: "success", output_url: "https://cdn.minimax.io/result.mp4" } }, taskId).status, "succeeded");
assert.equal(miniMaxStatusFromResponse({ data: { status_code: "success", output_url: "https://cdn.minimax.io/result.mp4" } }, taskId).outputUrl, "https://cdn.minimax.io/result.mp4");
assert.equal(miniMaxStatusFromResponse({ data: { task_id: taskId, status: "success", video_urls: ["https://cdn.minimax.io/result.mp4"] } }, taskId).outputUrl, "https://cdn.minimax.io/result.mp4");
assert.equal(miniMaxStatusFromResponse({ data: { task: { task_id: taskId, status: "completed", task_result: { file_url: "https://cdn.minimax.io/result.mp4" } } } }, taskId).status, "succeeded");
assert.equal(miniMaxTaskRecord({ data: { task: { task_id: taskId, status: "processing" } } }).taskId, taskId);

const currentTaskRawUrl = "https://video-product.cdn.minimax.io/current/output.mp4";
const historicalRawUrls = Array.from({ length: 20 }, (_, index) => `https://video-product.cdn.minimax.io/history/${index + 1}.mp4`);
const suppliedUnknown = miniMaxStatusFromResponse({ data: { status: "unknown", task_id: taskId, rawUrls: historicalRawUrls } }, taskId);
assert.equal(suppliedUnknown.status, "unknown");
assert.equal(suppliedUnknown.outputUrl, undefined);
assert.equal((suppliedUnknown.raw as { diagnostics: { rawUrlCount: number; rawVideoUrlCount: number } }).diagnostics.rawUrlCount, 20);
assert.equal((suppliedUnknown.raw as { diagnostics: { rawUrlCount: number; rawVideoUrlCount: number } }).diagnostics.rawVideoUrlCount, 20);

const currentTask = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", video_urls: [currentTaskRawUrl] } }, taskId);
assert.equal(currentTask.status, "succeeded");
assert.equal(currentTask.outputUrl, currentTaskRawUrl);

const confirmedTaskOutput = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", content: { task_id: taskId, url: currentTaskRawUrl } } }, taskId);
assert.equal(confirmedTaskOutput.status, "succeeded");
assert.equal(confirmedTaskOutput.outputUrl, currentTaskRawUrl);

const ambiguousRawUrls = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", rawUrls: [currentTaskRawUrl, "https://video-product.cdn.minimax.io/other/output.mp4"] } }, taskId);
assert.equal(ambiguousRawUrls.status, "failed");
assert.match(ambiguousRawUrls.error ?? "", /no real video URL/i);

const crossTaskRawUrl = miniMaxStatusFromResponse({ task: { task_id: "different-task", status: "succeeded", rawUrls: [currentTaskRawUrl] } }, taskId);
assert.equal(crossTaskRawUrl.status, "failed");
assert.equal(crossTaskRawUrl.outputUrl, undefined);

const subtitleOnly = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", content: { subtitle_url: "https://video-product.cdn.minimax.io/subtitles.srt" } } }, taskId);
assert.equal(subtitleOnly.status, "failed");
assert.equal(subtitleOnly.outputUrl, undefined);

const malformed = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", content: {} } }, taskId);
assert.equal(malformed.status, "failed");
assert.match(malformed.error ?? "", /no real video URL/i);

const existingProviderJob = { provider: "minimax", id: taskId, status: "running" };
assert.equal(existingProviderJob.id, taskId);
assert.equal(existingProviderJob.provider, "minimax");
assert.equal(existingProviderJob.status, "running");
const unknownWithRawUrls = miniMaxStatusFromResponse({ data: { status: "mystery", rawUrls: [currentTaskRawUrl] } }, taskId);
assert.equal(unknownWithRawUrls.status, "unknown");
assert.equal(unknownWithRawUrls.outputUrl, undefined);
assert.equal(unknownWithRawUrls.providerResponseClassification, "unknown");
assert.equal((unknownWithRawUrls.raw as { diagnostics: { responseCategory: string; responseKeys: string[] } }).diagnostics.responseCategory, "unknown_response");
assert.ok((unknownWithRawUrls.raw as { diagnostics: { responseKeys: string[] } }).diagnostics.responseKeys.includes("data.rawUrls"));

for (const [httpStatus, category] of [[404, "not_found"], [410, "expired"], [500, "http_error"]] as const) {
  const status = miniMaxStatusFromError({ httpStatus, message: "provider failure" }, taskId);
  assert.equal(status.status, httpStatus === 500 ? "unknown" : "failed");
  assert.equal(status.httpStatus, httpStatus);
  assert.equal(status.errorCategory, category);
  assert.match(status.errorMessage ?? "", /MiniMax|provider failure/i);
}

const httpPayloadError = miniMaxStatusFromError({ httpStatus: 404, message: "provider failure", payload: { error: "missing", task_id: taskId } }, taskId);
assert.deepEqual((httpPayloadError.raw as { diagnostics: { responseKeys: string[] } }).diagnostics.responseKeys, ["error", "task_id"]);
assert.equal(httpPayloadError.providerResponseStatus, "missing");

const registry = buildOutputRegistry({
  id: "production-437126020350238",
  production_type: "video",
  generation_status: "minimax_succeeded",
  preview_url: "/api/productions/production-437126020350238/delivery?file=preview",
  delivery_link: "/api/productions/production-437126020350238/delivery?file=manifest",
  request_metadata: { deliveryRequirements: { formats: ["final_mp4"], wantsFinalVideo: true } },
  output_json: {
    finalVideoUrl: currentTaskRawUrl,
    providerStatus: "minimax_succeeded"
  }
});
const finalVideo = registry.find((item) => item.id === "final_video");
assert.equal(finalVideo?.status, "ready");
assert.equal(finalVideo?.url, "/api/productions/production-437126020350238/delivery?file=video");

assert.match(automationStatusSource, /providerStatusDiagnostics/);
assert.match(automationStatusSource, /No output URL was promoted/);
assert.match(automationStatusSource, /buildOutputRegistry/);
const adminProductionsSource = readFileSync(new URL("../src/components/AdminProductionsTable.tsx", import.meta.url), "utf8");
assert.match(adminProductionsSource, /Active — output not confirmed/);
assert.match(adminProductionsSource, /Provider job state/);
assert.match(adminProductionsSource, /data\.visualStatus\?\.status === "succeeded" && data\.visualStatus\?\.outputUrl/);
const automationStartSource = readFileSync(new URL("../src/app/api/automation/start/route.ts", import.meta.url), "utf8");
assert.match(automationStartSource, /Legal acceptance table missing; continuing without repair row/);
assert.match(automationStartSource, /provider_job_id: providerJob.id/);

console.log("MiniMax status smoke tests passed.");
