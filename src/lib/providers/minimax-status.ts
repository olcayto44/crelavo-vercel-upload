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
};

const OFFICIAL_STATUSES = ["queued", "running", "succeeded", "failed", "cancelled"] as const;
type OfficialStatus = typeof OFFICIAL_STATUSES[number];

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function responseKeys(value: unknown): string[] {
  const record = objectRecord(value);
  const task = objectRecord(record.task);
  return [...new Set([...Object.keys(record), ...Object.keys(task).map((key) => `task.${key}`)])].sort();
}

function normalizeStatus(value: unknown): NormalizedProviderStatus["status"] {
  const status = String(value ?? "").trim().toLowerCase();
  return OFFICIAL_STATUSES.includes(status as OfficialStatus) ? status as NormalizedProviderStatus["status"] : "unknown";
}

function diagnosticsFor(data: unknown, responseDiagnostics?: MiniMaxResponseDiagnostics, statusPath?: string, outputPath?: string): MiniMaxDiagnostics {
  return {
    httpStatus: responseDiagnostics?.httpStatus,
    responseContentType: responseDiagnostics?.contentType,
    redactedShape: responseDiagnostics?.redactedShape,
    responseKeys: responseKeys(data),
    responseCategory: statusPath ? "official_task" : "invalid_response",
    statusPath,
    outputPath
  };
}

function errorText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = objectRecord(value);
  return String(record.message ?? record.code ?? fallback);
}

function contentVideoUrl(task: Record<string, unknown>, normalized: NormalizedProviderStatus["status"]) {
  if (normalized !== "succeeded") return undefined;
  const content = objectRecord(task.content);
  const url = typeof content.url === "string" ? content.url.trim() : "";
  if (!/^https?:\/\//i.test(url) || /\.(srt|vtt|ass|html?)(?:\?|$)/i.test(url)) return undefined;
  return url;
}

function mediaMetadata(task: Record<string, unknown>): Pick<NormalizedProviderStatus, "width" | "height" | "durationSeconds" | "resolutionLabel"> {
  const width = Number(task.width ?? task.video_width);
  const height = Number(task.height ?? task.video_height);
  const durationSeconds = Number(task.duration_seconds ?? task.duration);
  return {
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    height: Number.isFinite(height) && height > 0 ? height : undefined,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : undefined,
    resolutionLabel: typeof task.resolution === "string" ? task.resolution : undefined
  };
}

export function miniMaxStatusFromError(error: unknown, taskId: string): NormalizedProviderStatus {
  const record = objectRecord(error);
  const payload = objectRecord(record.payload);
  const httpStatus = typeof record.httpStatus === "number" ? record.httpStatus : undefined;
  const message = errorText(record.providerMessage ?? record.message ?? payload.error, httpStatus ? `MiniMax status request failed with HTTP ${httpStatus}.` : "MiniMax status request could not be completed.");
  const responseStatus = typeof payload.status === "string" ? payload.status : undefined;
  return {
    provider: "minimax",
    id: taskId,
    status: "failed",
    error: message,
    errorMessage: message,
    httpStatus,
    errorCategory: httpStatus === 404 ? "not_found" : httpStatus === 410 ? "expired" : httpStatus ? "http_error" : "unknown",
    providerResponseStatus: responseStatus,
    providerResponseClassification: normalizeStatus(responseStatus),
    raw: { httpStatus, diagnostics: diagnosticsFor(record.payload) }
  };
}

export function miniMaxStatusFromResponse(data: unknown, taskId: string): NormalizedProviderStatus {
  const record = objectRecord(data);
  const task = objectRecord(record.task);
  const responseDiagnostics = record[MINI_MAX_RESPONSE_DIAGNOSTICS] as MiniMaxResponseDiagnostics | undefined;
  const requestedTaskId = String(taskId ?? "").trim();
  const returnedTaskId = typeof task.id === "string" ? task.id.trim() : "";
  const rawStatus = typeof task.status === "string" ? task.status.trim() : "";
  const normalized = normalizeStatus(rawStatus);
  const identityValid = Boolean(returnedTaskId && requestedTaskId && returnedTaskId === requestedTaskId);
  const outputUrl = identityValid ? contentVideoUrl(task, normalized) : undefined;
  const outputPath = outputUrl ? "task.content.url" : undefined;
  const diagnostics = diagnosticsFor(data, responseDiagnostics, rawStatus ? "task.status" : undefined, outputPath);
  if (!identityValid) {
    const message = returnedTaskId ? "MiniMax status response task id does not match the requested task id." : "MiniMax status response did not contain task.id.";
    return { provider: "minimax", id: requestedTaskId, status: "failed", error: message, errorMessage: message, errorCategory: "unknown", raw: { response: data, diagnostics } };
  }
  if (normalized === "unknown") {
    const message = rawStatus ? `MiniMax returned unsupported task status: ${rawStatus}.` : "MiniMax status response did not contain task.status.";
    return { provider: "minimax", id: requestedTaskId, status: "failed", error: message, errorMessage: message, errorCategory: "unknown", raw: { response: data, diagnostics } };
  }
  const taskError = task.error;
  const missingOutput = normalized === "succeeded" && !outputUrl;
  const message = normalized === "failed" || normalized === "cancelled"
    ? errorText(taskError, `MiniMax task ${normalized}.`)
    : missingOutput ? "MiniMax task succeeded, but task.content.url was missing or not a video URL." : undefined;
  return {
    provider: "minimax",
    id: requestedTaskId,
    status: missingOutput ? "failed" : normalized,
    outputUrl,
    ...mediaMetadata(task),
    error: message,
    errorMessage: message,
    errorCategory: message ? normalized === "failed" || normalized === "cancelled" ? "provider_error" : "unknown" : undefined,
    providerResponseStatus: rawStatus,
    providerResponseClassification: normalized,
    raw: { response: data, diagnostics }
  };
}
