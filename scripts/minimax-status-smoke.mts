import assert from "node:assert/strict";
import { miniMaxStatusFromError, miniMaxStatusFromResponse } from "../src/lib/providers/minimax-status.ts";

const taskId = "436887923384578";

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
assert.equal(running.outputUrl, undefined);

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
  assert.match(status.errorMessage ?? "", /MiniMax/);
  assert.doesNotMatch(status.errorMessage ?? "", /provider failure/);
}

console.log("MiniMax status smoke tests passed.");
