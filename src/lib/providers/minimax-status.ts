import type { NormalizedProviderStatus } from "./types.ts";

type MiniMaxDiagnostics = {
  responseKeys: string[];
  responseCategory: string;
  statusPath?: string;
  outputPath?: string;
};

function normalizeStatus(value: string): NormalizedProviderStatus["status"] {
  const status = value.trim().toLowerCase().replace(/[ -]+/g, "_");
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(status)) return "succeeded";
  if (["failed", "failure", "error", "canceled", "cancelled", "expired", "not_found", "404", "410"].includes(status)) return "failed";
  if (["starting", "processing", "running", "rendering", "generating", "in_progress"].includes(status)) return "running";
  if (["queued", "pending", "submitted"].includes(status)) return "queued";
  return "unknown";
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function responseKeys(data: unknown): string[] {
  const record = objectRecord(data);
  const dataRecord = objectRecord(record.data);
  const taskRecord = objectRecord(dataRecord.task);
  return [...new Set([
    ...Object.keys(record).map((key) => key),
    ...Object.keys(dataRecord).map((key) => `data.${key}`),
    ...Object.keys(taskRecord).map((key) => `data.task.${key}`)
  ])].sort();
}

function statusCandidate(data: unknown, record: Record<string, unknown>, envelope: Record<string, unknown>, task: Record<string, unknown>) {
  const candidates: Array<{ value: unknown; path: string }> = [
    { value: task.status, path: "data.task.status" },
    { value: task.task_status, path: "data.task.task_status" },
    { value: task.state, path: "data.task.state" },
    { value: envelope.status, path: "data.status" },
    { value: envelope.task_status, path: "data.task_status" },
    { value: envelope.status_code, path: "data.status_code" },
    { value: envelope.state, path: "data.state" },
    { value: record.status, path: "status" }
  ];
  for (const candidate of candidates) {
    if ((typeof candidate.value === "string" || typeof candidate.value === "number") && normalizeStatus(String(candidate.value)) !== "unknown") return candidate;
    const nested = objectRecord(candidate.value);
    for (const key of ["status", "task_status", "status_code", "state", "value"]) {
      if ((typeof nested[key] === "string" || typeof nested[key] === "number") && normalizeStatus(String(nested[key])) !== "unknown") return { value: nested[key], path: `${candidate.path}.${key}` };
    }
  }
  return candidates.find((candidate) => typeof candidate.value === "string") ?? { value: "unknown", path: "unknown" };
}

function isVideoUrl(value: string) {
  return /^https?:\/\//i.test(value)
    && !/\.(srt|vtt|ass|html?)(?:\?|$)/i.test(value)
    && (/\.(mp4|mov|webm)(?:\?|$)/i.test(value) || /(?:minimax|cloudfront|storage\.googleapis|r2\.dev|supabase)/i.test(value));
}

function firstVideoUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const url = value.trim();
    return isVideoUrl(url) ? url : undefined;
  }
  if (Array.isArray(value)) return value.map(firstVideoUrl).find(Boolean);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "video_url", "videoUrl", "output_url", "outputUrl", "download_url", "downloadUrl", "media_url", "mediaUrl", "file_url", "fileUrl", "video", "output", "result", "content"]) {
      const result = firstVideoUrl(record[key]);
      if (result) return result;
    }
  }
  return undefined;
}

function currentTaskOutputUrl(task: Record<string, unknown>, envelope: Record<string, unknown>, taskId: string) {
  const taskIdentity = String(task.task_id ?? task.taskId ?? task.id ?? envelope.task_id ?? envelope.taskId ?? envelope.id ?? "").trim();
  const outputCandidates: Array<[string, unknown]> = [
    ["data.task.content", task.content],
    ["data.task.video_url", task.video_url],
    ["data.task.videoUrl", task.videoUrl],
    ["data.task.result", task.result],
    ["data.task.video", task.video],
    ["data.task.videos", task.videos],
    ["data.task.output", task.output],
    ["data.task.task_result", task.task_result],
    ["data.task.taskResult", task.taskResult],
    ["data.task_result", envelope.task_result],
    ["data.taskResult", envelope.taskResult],
    ["data.video_url", envelope.video_url],
    ["data.videoUrl", envelope.videoUrl],
    ["data.output_url", envelope.output_url],
    ["data.outputUrl", envelope.outputUrl]
  ];
  for (const [path, value] of outputCandidates) {
    const url = firstVideoUrl(value);
    if (url) return { url, path };
  }
  const rawUrls = Array.isArray(task.rawUrls) ? task.rawUrls : Array.isArray(task.raw_urls) ? task.raw_urls : [];
  if (taskIdentity === taskId && rawUrls.length === 1) {
    const url = firstVideoUrl(rawUrls[0]);
    if (url) return { url, path: "data.task.rawUrls[0]" };
  }
  return { url: undefined, path: undefined };
}

function mediaMetadata(value: unknown): Pick<NormalizedProviderStatus, "width" | "height" | "durationSeconds" | "resolutionLabel"> {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const width = Number(record.width ?? record.video_width);
  const height = Number(record.height ?? record.video_height);
  const durationSeconds = Number(record.duration_seconds ?? record.duration);
  return {
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    height: Number.isFinite(height) && height > 0 ? height : undefined,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : undefined,
    resolutionLabel: typeof record.resolution === "string" ? record.resolution : undefined
  };
}

export function miniMaxStatusFromError(error: unknown, taskId: string): NormalizedProviderStatus {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const payload = objectRecord(record.payload);
  const httpStatus = typeof record.httpStatus === "number" ? Number(record.httpStatus) : undefined;
  const providerMessage = typeof record.providerMessage === "string" ? record.providerMessage.trim() : typeof record.message === "string" ? record.message.trim() : "";
  const payloadStatus = String(payload.status ?? payload.task_status ?? payload.status_code ?? payload.error?.toString() ?? "").trim();
  const diagnostics = { responseKeys: responseKeys(record.payload), responseCategory: httpStatus === 404 ? "not_found" : httpStatus === 410 ? "expired" : httpStatus ? "http_error" : "unknown" };
  if (httpStatus === 404 || httpStatus === 410) {
    const errorCategory = httpStatus === 404 ? "not_found" : "expired";
    const errorMessage = providerMessage || (httpStatus === 404 ? "MiniMax task was not found." : "MiniMax task expired.");
    return { provider: "minimax", id: taskId, status: "failed", error: errorMessage, httpStatus, errorCategory, errorMessage, providerResponseStatus: payloadStatus || undefined, providerResponseClassification: normalizeStatus(payloadStatus), raw: { httpStatus, diagnostics } };
  }
  const errorMessage = providerMessage || (httpStatus ? `MiniMax status request failed with HTTP ${httpStatus}.` : "MiniMax status request could not be completed.");
  return { provider: "minimax", id: taskId, status: "unknown", error: errorMessage, httpStatus, errorCategory: httpStatus ? "http_error" : "unknown", errorMessage, providerResponseStatus: payloadStatus || undefined, providerResponseClassification: normalizeStatus(payloadStatus), raw: { ...(httpStatus ? { httpStatus } : {}), diagnostics } };
}

export function miniMaxStatusFromResponse(data: unknown, taskId: string): NormalizedProviderStatus {
  const record = objectRecord(data);
  const envelope = objectRecord(record.data);
  const effectiveEnvelope = Object.keys(envelope).length ? envelope : record;
  const task = objectRecord(effectiveEnvelope.task);
  const effectiveTask = Object.keys(task).length ? task : effectiveEnvelope;
  const candidate = statusCandidate(data, record, effectiveEnvelope, effectiveTask);
  const rawStatus = String(candidate.value ?? "unknown").trim() || "unknown";
  const normalized = normalizeStatus(rawStatus);
  const output = currentTaskOutputUrl(effectiveTask, effectiveEnvelope, taskId);
  const outputUrl = output.url;
  const errorValue = effectiveTask.error ?? effectiveTask.failure ?? effectiveEnvelope.error ?? effectiveEnvelope.failure ?? record.error;
  const responseClassification = normalizeStatus(rawStatus);
  const diagnostics: MiniMaxDiagnostics = {
    responseKeys: responseKeys(data),
    responseCategory: normalized === "unknown" ? "unknown_response" : candidate.path.includes("status_code") ? "status_code" : candidate.path.includes("task_status") ? "task_status" : "status",
    statusPath: candidate.path,
    outputPath: output.path
  };
  const error = typeof errorValue === "object" && errorValue
    ? String((errorValue as Record<string, unknown>).message ?? (errorValue as Record<string, unknown>).code ?? "MiniMax task failed.")
    : typeof errorValue === "string" ? errorValue
      : normalized === "succeeded" && !outputUrl ? "MiniMax task succeeded, but no real video URL was found." : undefined;
  const finalStatus = normalized === "succeeded" && !outputUrl ? "failed" : normalized;
  return {
    provider: "minimax",
    id: taskId,
    status: finalStatus,
    outputUrl,
    ...mediaMetadata(effectiveTask),
    error,
    errorMessage: error,
    errorCategory: error ? finalStatus === "failed" && normalized !== "succeeded" ? "provider_error" : "unknown" : undefined,
    providerResponseStatus: rawStatus,
    providerResponseClassification: responseClassification,
    raw: { response: data, diagnostics }
  };
}
