import { MINI_MAX_RESPONSE_DIAGNOSTICS, type MiniMaxResponseDiagnostics } from "./minimax.ts";
import type { NormalizedProviderStatus } from "./types.ts";

type MiniMaxDiagnostics = {
  httpStatus?: number;
  responseContentType?: string;
  redactedShape?: unknown;
  responseKeys: string[];
  responseCategory: string;
  statusPath?: string;
  outputPath?: string;
  rawUrlCount: number;
  rawVideoUrlCount: number;
  contentType?: string;
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
  const envelope = objectRecord(record.data);
  const task = objectRecord(envelope.task);
  const topLevelTask = objectRecord(record.task);
  return [...new Set([
    ...Object.keys(record),
    ...Object.keys(envelope).map((key) => `data.${key}`),
    ...Object.keys(task).map((key) => `data.task.${key}`),
    ...Object.keys(topLevelTask).map((key) => `task.${key}`)
  ])].sort();
}

function statusCandidate(data: unknown, record: Record<string, unknown>, envelope: Record<string, unknown>, task: Record<string, unknown>) {
  const taskPath = Object.keys(task).length ? (Object.keys(record.data ?? {}).length ? "data.task" : "task") : Object.keys(envelope).length ? "data" : "";
  const candidates: Array<{ value: unknown; path: string }> = [
    { value: task.status, path: `${taskPath}.status` },
    { value: task.task_status, path: `${taskPath}.task_status` },
    { value: task.state, path: `${taskPath}.state` },
    { value: envelope.status, path: "data.status" },
    { value: envelope.task_status, path: "data.task_status" },
    { value: envelope.status_code, path: "data.status_code" },
    { value: envelope.state, path: "data.state" },
    { value: record.status_code, path: "status_code" },
    { value: record.task_status, path: "task_status" },
    { value: record.state, path: "state" },
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
  if (!/^https:\/\//i.test(value) || /\.(srt|vtt|ass|html?)(?:\?|$)/i.test(value)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const allowedHost = host === "minimax.io" || host.endsWith(".minimax.io") || host.endsWith(".cloudfront.net") || host === "storage.googleapis.com" || host.endsWith(".r2.dev") || host.endsWith(".supabase.co");
    return allowedHost && /\.(mp4|mov|webm)(?:\?|$)/i.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

function firstVideoUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const url = value.trim();
    return isVideoUrl(url) ? url : undefined;
  }
  if (Array.isArray(value)) return value.map(firstVideoUrl).find(Boolean);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "video_url", "videoUrl", "video_urls", "videoUrls", "output_url", "outputUrl", "result_url", "resultUrl", "download_url", "downloadUrl", "media_url", "mediaUrl", "file_url", "fileUrl", "video", "videos", "output", "result", "task_result", "taskResult", "content", "file", "files"]) {
      const result = firstVideoUrl(record[key]);
      if (result) return result;
    }
  }
  return undefined;
}

function currentTaskOutputUrl(task: Record<string, unknown>, envelope: Record<string, unknown>, taskId: string) {
  const taskIdentity = String(task.task_id ?? task.taskId ?? task.id ?? envelope.task_id ?? envelope.taskId ?? envelope.id ?? "").trim();
  if (taskIdentity && taskIdentity !== taskId) return { url: undefined, path: undefined };
  const outputCandidates: Array<[string, unknown]> = [
    ["data.task.content", task.content],
    ["data.task.video_url", task.video_url],
    ["data.task.videoUrl", task.videoUrl],
    ["data.task.result", task.result],
    ["data.task.video", task.video],
    ["data.task.videos", task.videos],
    ["data.task.output", task.output],
    ["data.task.video_urls", task.video_urls],
    ["data.task.videoUrls", task.videoUrls],
    ["data.task.file_url", task.file_url],
    ["data.task.fileUrl", task.fileUrl],
    ["data.task.download_url", task.download_url],
    ["data.task.downloadUrl", task.downloadUrl],
    ["data.task.task_result", task.task_result],
    ["data.task.taskResult", task.taskResult],
    ["data.task_result", envelope.task_result],
    ["data.taskResult", envelope.taskResult],
    ["data.video_url", envelope.video_url],
    ["data.videoUrl", envelope.videoUrl],
    ["data.output_url", envelope.output_url],
    ["data.outputUrl", envelope.outputUrl],
    ["data.video_urls", envelope.video_urls],
    ["data.videoUrls", envelope.videoUrls],
    ["data.file_url", envelope.file_url],
    ["data.fileUrl", envelope.fileUrl],
    ["data.download_url", envelope.download_url],
    ["data.downloadUrl", envelope.downloadUrl]
  ];
  for (const [path, value] of outputCandidates) {
    const url = firstVideoUrl(value);
    if (url) return { url, path };
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
  const contentType = typeof record.contentType === "string" ? record.contentType : "";
  const payloadStatus = String(payload.status ?? payload.task_status ?? payload.status_code ?? payload.error?.toString() ?? "").trim();
  const payloadRecord = objectRecord(record.payload);
  const errorRawUrls = Array.isArray(payloadRecord.rawUrls) ? payloadRecord.rawUrls : Array.isArray(payloadRecord.raw_urls) ? payloadRecord.raw_urls : [];
  const diagnostics: MiniMaxDiagnostics = { responseKeys: responseKeys(record.payload), responseCategory: httpStatus === 404 ? "not_found" : httpStatus === 410 ? "expired" : httpStatus ? "http_error" : "unknown", rawUrlCount: errorRawUrls.length, rawVideoUrlCount: errorRawUrls.filter((value) => Boolean(firstVideoUrl(value))).length, contentType: contentType || undefined };
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
  const rawUrls = Array.isArray(effectiveTask.rawUrls) ? effectiveTask.rawUrls : Array.isArray(effectiveTask.raw_urls) ? effectiveTask.raw_urls : [];
  const rawVideoUrlCount = rawUrls.filter((value) => Boolean(firstVideoUrl(value))).length;
  const errorValue = effectiveTask.error ?? effectiveTask.failure ?? effectiveEnvelope.error ?? effectiveEnvelope.failure ?? record.error;
  const responseClassification = normalizeStatus(rawStatus);
  const responseDiagnostics = record[MINI_MAX_RESPONSE_DIAGNOSTICS] as MiniMaxResponseDiagnostics | undefined;
  const diagnostics: MiniMaxDiagnostics = {
    httpStatus: responseDiagnostics?.httpStatus,
    responseContentType: responseDiagnostics?.contentType,
    redactedShape: responseDiagnostics?.redactedShape,
    responseKeys: responseKeys(data),
    responseCategory: normalized === "unknown" ? "unknown_response" : candidate.path.includes("status_code") ? "status_code" : candidate.path.includes("task_status") ? "task_status" : "status",
    statusPath: candidate.path,
    outputPath: output.path,
    rawUrlCount: rawUrls.length,
    rawVideoUrlCount
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
