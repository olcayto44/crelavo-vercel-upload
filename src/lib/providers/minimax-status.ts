import type { NormalizedProviderStatus } from "./types.ts";

function normalizeStatus(value: string): NormalizedProviderStatus["status"] {
  const status = value.toLowerCase();
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(status)) return "succeeded";
  if (["failed", "failure", "error", "canceled", "cancelled", "expired", "not_found", "not found"].includes(status)) return "failed";
  if (["starting", "processing", "running", "rendering", "generating", "in_progress", "submitted"].includes(status)) return status === "submitted" ? "queued" : "running";
  if (["queued", "pending"].includes(status)) return "queued";
  return "unknown";
}

function firstUrl(value: unknown): string | undefined {
  if (typeof value === "string") return /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
  if (Array.isArray(value)) return value.map(firstUrl).find(Boolean);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "video_url", "videoUrl", "output_url", "outputUrl", "download_url", "downloadUrl", "media_url", "mediaUrl", "file_url", "fileUrl", "video", "output", "result", "content", "data"]) {
      const result = firstUrl(record[key]);
      if (result) return result;
    }
  }
  return undefined;
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

export function miniMaxStatusFromResponse(data: unknown, taskId: string): NormalizedProviderStatus {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const envelope = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const task = envelope.task && typeof envelope.task === "object" ? envelope.task as Record<string, unknown> : envelope;
  const rawStatus = String(task.status ?? envelope.status ?? record.status ?? "unknown");
  const normalized = normalizeStatus(rawStatus);
  const outputUrl = firstUrl(task.content) || firstUrl(task.result) || firstUrl(task.video) || firstUrl(task.videos) || firstUrl(task.output) || firstUrl(task);
  const errorValue = task.error ?? envelope.error ?? record.error;
  const error = typeof errorValue === "object" && errorValue
    ? String((errorValue as Record<string, unknown>).message ?? (errorValue as Record<string, unknown>).code ?? "MiniMax task failed.")
    : typeof errorValue === "string" ? errorValue
      : normalized === "succeeded" && !outputUrl ? "MiniMax task succeeded, but no real video URL was found." : undefined;
  return { provider: "minimax", id: taskId, status: normalized === "succeeded" && !outputUrl ? "failed" : normalized, outputUrl, ...mediaMetadata(task), error, raw: data };
}
