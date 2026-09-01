import type { NormalizedProviderStatus } from "./types.ts";

function normalizeStatus(value: string): NormalizedProviderStatus["status"] {
  const status = value.trim().toLowerCase().replace(/[ -]+/g, "_");
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(status)) return "succeeded";
  if (["failed", "failure", "error", "canceled", "cancelled", "expired", "not_found"].includes(status)) return "failed";
  if (["starting", "processing", "running", "rendering", "generating", "in_progress"].includes(status)) return "running";
  if (["queued", "pending", "submitted"].includes(status)) return "queued";
  return "unknown";
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

function currentTaskOutputUrl(task: Record<string, unknown>) {
  return firstVideoUrl(task.content) || firstVideoUrl(task.video_url) || firstVideoUrl(task.videoUrl) || firstVideoUrl(task.result) || firstVideoUrl(task.video) || firstVideoUrl(task.videos) || firstVideoUrl(task.output);
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
  const httpStatus = typeof record.httpStatus === "number" ? Number(record.httpStatus) : undefined;
  const providerMessage = typeof record.providerMessage === "string" ? record.providerMessage.trim() : typeof record.message === "string" ? record.message.trim() : "";
  if (httpStatus === 404 || httpStatus === 410) {
    const errorCategory = httpStatus === 404 ? "not_found" : "expired";
    const errorMessage = providerMessage || (httpStatus === 404 ? "MiniMax task was not found." : "MiniMax task expired.");
    return { provider: "minimax", id: taskId, status: "failed", error: errorMessage, httpStatus, errorCategory, errorMessage, raw: { httpStatus, providerMessage } };
  }
  const errorMessage = providerMessage || (httpStatus ? `MiniMax status request failed with HTTP ${httpStatus}.` : "MiniMax status request could not be completed.");
  return { provider: "minimax", id: taskId, status: "unknown", error: errorMessage, httpStatus, errorCategory: httpStatus ? "http_error" : "unknown", errorMessage, raw: { ...(httpStatus ? { httpStatus } : {}), providerMessage } };
}

export function miniMaxStatusFromResponse(data: unknown, taskId: string): NormalizedProviderStatus {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const envelope = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const task = envelope.task && typeof envelope.task === "object" ? envelope.task as Record<string, unknown> : envelope;
  const rawStatus = String(task.status ?? task.task_status ?? task.state ?? envelope.status ?? envelope.task_status ?? envelope.state ?? record.status ?? "unknown").trim();
  const normalized = normalizeStatus(rawStatus);
  const outputUrl = currentTaskOutputUrl(task);
  const errorValue = task.error ?? task.failure ?? envelope.error ?? envelope.failure ?? record.error;
  const responseClassification = normalizeStatus(rawStatus);
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
    ...mediaMetadata(task),
    error,
    errorMessage: error,
    errorCategory: error ? finalStatus === "failed" && normalized !== "succeeded" ? "provider_error" : "unknown" : undefined,
    providerResponseStatus: rawStatus,
    providerResponseClassification: responseClassification,
    raw: data
  };
}
