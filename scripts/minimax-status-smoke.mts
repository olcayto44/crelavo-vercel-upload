import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { miniMaxStatusFromError, miniMaxStatusFromResponse } from "../src/lib/providers/minimax-status.ts";

const taskId = "436887923384578";
const productionWorkspaceSource = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");
const automationStatusSource = readFileSync(new URL("../src/app/api/automation/status/route.ts", import.meta.url), "utf8");
const providerStatusSource = readFileSync(new URL("../src/lib/providers/status.ts", import.meta.url), "utf8");
const workAssistantSource = readFileSync(new URL("../src/components/WorkAssistant.tsx", import.meta.url), "utf8");
assert.match(productionWorkspaceSource, /provider_status_unavailable/);
assert.match(productionWorkspaceSource, /Provider status unavailable \/ Action required/);
assert.match(productionWorkspaceSource, /hasProviderJobEvidence/);
assert.match(productionWorkspaceSource, /providerStatusUnavailable \? "Provider status unavailable"/);
assert.doesNotMatch(productionWorkspaceSource, /providerStatusUnavailable \? nextLiveStep/);
assert.match(workAssistantSource, /provider_status_unavailable/);
assert.match(workAssistantSource, /Provider status unavailable \/ Action required/);
assert.match(providerStatusSource, /queryMiniMaxH3VideoTask\(job\.id\)/);
assert.match(automationStatusSource, /provider_job_id: effectiveProviderJobId/);

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

const currentTaskRawUrl = "https://video-product.cdn.minimax.io/current/output.mp4";
const currentTask = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", rawUrls: [currentTaskRawUrl] } }, taskId);
assert.equal(currentTask.status, "failed");
assert.equal(currentTask.outputUrl, undefined);

const ambiguousRawUrls = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", rawUrls: [currentTaskRawUrl, "https://video-product.cdn.minimax.io/other/output.mp4"] } }, taskId);
assert.equal(ambiguousRawUrls.status, "failed");
assert.match(ambiguousRawUrls.error ?? "", /no real video URL/i);

const crossTaskRawUrl = miniMaxStatusFromResponse({ task: { task_id: "different-task", status: "succeeded", rawUrls: [currentTaskRawUrl] } }, taskId);
assert.equal(crossTaskRawUrl.status, "failed");
assert.equal(crossTaskRawUrl.outputUrl, undefined);

const subtitleOnly = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", content: { subtitle_url: "https://video-product.cdn.minimax.io/subtitles.srt" }, rawUrls: [currentTaskRawUrl] } }, taskId);
assert.equal(subtitleOnly.status, "failed");
assert.equal(subtitleOnly.outputUrl, undefined);

const malformed = miniMaxStatusFromResponse({ task: { task_id: taskId, status: "succeeded", content: {} } }, taskId);
assert.equal(malformed.status, "failed");
assert.match(malformed.error ?? "", /no real video URL/i);

const existingProviderJob = { provider: "minimax", id: taskId, status: "running" };
assert.equal(existingProviderJob.id, taskId);
assert.equal(existingProviderJob.provider, "minimax");
assert.equal(existingProviderJob.status, "running");
assert.equal(miniMaxStatusFromResponse({ task: { task_id: taskId, status: "unknown" } }, taskId).status, "unknown");

for (const [httpStatus, category] of [[404, "not_found"], [410, "expired"], [500, "http_error"]] as const) {
  const status = miniMaxStatusFromError({ httpStatus, message: "provider failure" }, taskId);
  assert.equal(status.status, httpStatus === 500 ? "unknown" : "failed");
  assert.equal(status.httpStatus, httpStatus);
  assert.equal(status.errorCategory, category);
   assert.match(status.errorMessage ?? "", /MiniMax|provider failure/i);
}

console.log("MiniMax status smoke tests passed.");
