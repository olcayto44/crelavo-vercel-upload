import { optionalEnv, requireProviderEnv } from "./env.ts";
import { getHeyGenV3Video, getHeyGenVideoAgentSession, getHeyGenVideoStatus, latestHeyGenVideoArtifact, normalizeHeyGenVideoAgentArtifacts } from "./heygen.ts";
import { MiniMaxStatusError, queryMiniMaxH3VideoTask } from "./minimax.ts";
import { miniMaxStatusFromError, miniMaxStatusFromResponse } from "./minimax-status.ts";
import type { NormalizedProviderStatus, ProviderJob } from "./types.ts";

function asciiHeaderValue(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/[^\x20-\x7E]/g, "").trim() || fallback;
}

function normalizeStatus(value: string): NormalizedProviderStatus["status"] {
  const status = value.toLowerCase();
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(status)) return "succeeded";
  if (["failed", "failure", "error", "canceled", "cancelled"].includes(status)) return "failed";
  if (["starting", "processing", "running", "rendering", "generating", "in_progress"].includes(status)) return "running";
  if (["queued", "submitted", "pending"].includes(status)) return "queued";
  return "unknown";
}

function firstUrl(value: unknown): string | undefined {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (Array.isArray(value)) return value.map(firstUrl).find(Boolean);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return firstUrl(record.url)
      || firstUrl(record.output)
      || firstUrl(record.outputs)
      || firstUrl(record.output_url)
      || firstUrl(record.outputUrl)
      || firstUrl(record.download_url)
      || firstUrl(record.downloadUrl)
      || firstUrl(record.media_url)
      || firstUrl(record.mediaUrl)
      || firstUrl(record.play_url)
      || firstUrl(record.playUrl)
      || firstUrl(record.video)
      || firstUrl(record.videos)
      || firstUrl(record.video_url)
      || firstUrl(record.videoUrl)
      || firstUrl(record.file_url)
      || firstUrl(record.fileUrl)
      || firstUrl(record.file)
      || firstUrl(record.files)
      || firstUrl(record.result)
      || firstUrl(record.results)
      || firstUrl(record.task_result)
      || firstUrl(record.taskResult)
      || firstUrl(record.src)
      || firstUrl(record.uri)
      || firstUrl(record.link)
      || firstUrl(record.data);
  }
  return undefined;
}

function isRealMediaUrl(url: string | undefined) {
  if (!url) return false;
  if (/api\.replicate\.com\/v1\/predictions|preview\.html|manifest|readme|placeholder|generated_on_download|\/api\/productions\/.*\/delivery\?file=/i.test(url)) return false;
  return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|heygen\.ai|minimax|api\.minimax|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
}

function firstRealMediaUrl(value: unknown): string | undefined {
  const url = firstUrl(value);
  return isRealMediaUrl(url) ? url : undefined;
}

function numberFrom(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function deepFind(record: unknown, keys: string[]): unknown {
  if (!record || typeof record !== "object") return undefined;
  if (Array.isArray(record)) {
    for (const item of record) {
      const found = deepFind(item, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const obj = record as Record<string, unknown>;
  for (const key of keys) if (obj[key] !== undefined) return obj[key];
  for (const value of Object.values(obj)) {
    const found = deepFind(value, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function mediaMetadata(value: unknown): Pick<NormalizedProviderStatus, "width" | "height" | "durationSeconds" | "hasAudio" | "resolutionLabel"> {
  const width = numberFrom(deepFind(value, ["width", "w"]));
  const height = numberFrom(deepFind(value, ["height", "h"]));
  const durationSeconds = numberFrom(deepFind(value, ["durationSeconds", "duration_seconds", "duration", "length"]));
  const audioValue = deepFind(value, ["hasAudio", "has_audio", "audio", "audioUrl", "audio_url"]);
  const hasAudio = typeof audioValue === "boolean" ? audioValue : typeof audioValue === "string" ? audioValue.trim().length > 0 : undefined;
  const resolutionLabel = typeof deepFind(value, ["resolution", "resolutionLabel", "quality"]) === "string" ? String(deepFind(value, ["resolution", "resolutionLabel", "quality"])) : undefined;
  return { width, height, durationSeconds, hasAudio, resolutionLabel };
}

function falApiKey() {
  return requireProviderEnv("fal");
}

function falModel(job: ProviderJob) {
  const raw = job.raw && typeof job.raw === "object" ? job.raw as Record<string, unknown> : {};
  return String(raw.model ?? (optionalEnv("FAL_VIDEO_MODEL") || "fal-ai/wan/v2.2-a14b/text-to-video/turbo"));
}

export async function getReplicateStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireProviderEnv("replicate");
  if (!job.id) return { provider: "replicate", status: "unknown", error: "Missing Replicate job id" };
  const response = await fetch(`https://api.replicate.com/v1/predictions/${job.id}`, {
    headers: { Authorization: `Token ${apiKey}` }
  });
  if (!response.ok) throw new Error(`Replicate status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const normalized = normalizeStatus(String(data.status ?? "unknown"));
  const outputUrl = firstRealMediaUrl(data.output);
  return {
    provider: "replicate",
    id: job.id,
    status: normalized === "succeeded" && !outputUrl ? "failed" : normalized,
    outputUrl,
    ...mediaMetadata(data),
    error: typeof data.error === "string" ? data.error : normalized === "succeeded" && !outputUrl ? "Provider succeeded, but no real video file URL was found in Replicate data.output." : undefined,
    raw: data
  };
}

export async function getRunwayStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireProviderEnv("runway");
  if (!job.id) return { provider: "runway", status: "unknown", error: "Missing Runway job id" };
  const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${job.id}`, {
    headers: {
      Authorization: asciiHeaderValue(`Bearer ${apiKey}`),
      "X-Runway-Version": "2024-11-06"
    }
  });
  if (!response.ok) throw new Error(`Runway status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    provider: "runway",
    id: job.id,
    status: normalizeStatus(String(data.status ?? "unknown")),
    outputUrl: firstUrl(data.output) || firstUrl(data.artifacts),
    ...mediaMetadata(data),
    error: typeof data.failure === "string" ? data.failure : undefined,
    raw: data
  };
}

export async function getKlingStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireProviderEnv("kling");
  if (!job.id) return { provider: "kling", status: "unknown", error: "Missing Kling job id" };
  const baseUrl = optionalEnv("KLING_STATUS_API_URL") || optionalEnv("KLING_API_URL") || optionalEnv("KLING_I2V_API_URL") || "https://api.klingai.com/v1/videos/image2video";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${job.id}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!response.ok) throw new Error(`Kling status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nestedData = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const taskResult = nestedData.task_result ?? payload.task_result ?? nestedData.result ?? payload.result;
  const rawStatus = payload.status ?? payload.task_status ?? nestedData.status ?? nestedData.task_status ?? job.status ?? "unknown";
  const normalized = normalizeStatus(String(rawStatus));
  const outputUrl = firstRealMediaUrl(taskResult) || firstRealMediaUrl(nestedData) || firstRealMediaUrl(payload);
  const errorValue = payload.error ?? nestedData.error ?? payload.message ?? nestedData.message;
  return {
    provider: "kling",
    id: job.id,
    status: normalized === "succeeded" && !outputUrl ? "failed" : normalized,
    outputUrl,
    ...mediaMetadata(data),
    error: typeof errorValue === "string" && normalizeStatus(String(rawStatus)) === "failed" ? errorValue : normalized === "succeeded" && !outputUrl ? "Kling succeeded, but no real video file URL was found in task_result." : undefined,
    raw: data
  };
}

export async function getFalStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = falApiKey();
  if (!job.id) return { provider: "fal", status: "unknown", error: "Missing FAL request id" };
  const raw = job.raw && typeof job.raw === "object" ? job.raw as Record<string, unknown> : {};
  const model = falModel(job);
  const statusUrl = String(raw.status_url ?? raw.statusUrl ?? "").trim() || `https://queue.fal.run/${model}/requests/${job.id}/status`;
  const responseUrl = String(raw.response_url ?? raw.responseUrl ?? "").trim() || `https://queue.fal.run/${model}/requests/${job.id}`;
  const statusResponse = await fetch(statusUrl, {
    method: "GET",
    headers: { Authorization: `Key ${apiKey}` }
  });
  if (!statusResponse.ok) throw new Error(`FAL status failed: ${statusResponse.status} ${await statusResponse.text()}`);
  const statusData = await statusResponse.json();
  const normalized = normalizeStatus(String(statusData.status ?? statusData.state ?? "unknown"));
  let resultData: unknown = statusData;
  let outputUrl = firstUrl(statusData);

  if (normalized === "succeeded") {
    const resultResponse = await fetch(responseUrl, {
      method: "GET",
      headers: { Authorization: `Key ${apiKey}` }
    });
    if (resultResponse.ok) {
      resultData = await resultResponse.json();
      outputUrl = firstUrl(resultData) || outputUrl;
    }
  }

  return {
    provider: "fal",
    id: job.id,
    status: normalized,
    outputUrl,
    ...mediaMetadata(resultData),
    error: typeof (statusData as Record<string, unknown>).error === "string" ? String((statusData as Record<string, unknown>).error) : undefined,
    raw: resultData
  };
}

export async function getMiniMaxStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (!job.id) return { provider: "minimax", status: "unknown", error: "Missing MiniMax task id" };
  try {
    const data = await queryMiniMaxH3VideoTask(job.id);
    return miniMaxStatusFromResponse(data, job.id);
  } catch (error) {
    return miniMaxStatusFromError(error instanceof MiniMaxStatusError ? { httpStatus: error.httpStatus, payload: error.payload, contentType: error.contentType, message: error.message } : { message: error instanceof Error ? error.message : "" }, job.id);
  }
}

function shotstackStatusBaseUrl() {
  const configured = optionalEnv("SHOTSTACK_API_URL") || optionalEnv("SHOTSTACK_RENDER_URL");
  if (configured) return configured.replace(/\/render$/, "");
  const stage = (optionalEnv("SHOTSTACK_STAGE") || "v1").toLowerCase();
  return `https://api.shotstack.io/${stage === "stage" || stage === "sandbox" ? "stage" : "v1"}`;
}

export async function getHeyGenStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (!job.id) return { provider: "heygen", status: "unknown", error: "Missing HeyGen video id" };
  const data = await getHeyGenVideoStatus(job.id);
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nested = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const rawStatus = String(nested.status ?? nested.video_status ?? record.status ?? "unknown");
  const normalized = normalizeStatus(rawStatus);
  const outputUrl = firstRealMediaUrl(nested.video_url) || firstRealMediaUrl(nested.videoUrl) || firstRealMediaUrl(nested.url) || firstRealMediaUrl(nested);
  const error = typeof nested.error === "string" ? nested.error : typeof record.error === "string" ? record.error : normalized === "succeeded" && !outputUrl ? "HeyGen succeeded, but no real video URL was found." : undefined;
  return {
    provider: "heygen",
    id: job.id,
    status: normalized === "succeeded" && !outputUrl ? "failed" : normalized,
    outputUrl,
    ...mediaMetadata(nested),
    error,
    raw: data
  };
}

export async function getHeyGenV3VideoStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (!job.id) return { provider: job.provider, status: "unknown", error: "Missing HeyGen v3 video id" };
  const data = await getHeyGenV3Video(job.id);
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const nested = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const rawStatus = String(nested.status ?? record.status ?? "unknown");
  const normalized = normalizeStatus(rawStatus);
  const outputUrl = firstRealMediaUrl(nested.captioned_video_url)
    || firstRealMediaUrl(nested.captionedVideoUrl)
    || firstRealMediaUrl(nested.video_url)
    || firstRealMediaUrl(nested.videoUrl)
    || firstRealMediaUrl(nested.videoUrl?.toString?.())
    || firstRealMediaUrl(nested.url)
    || firstRealMediaUrl(record.data)
    || firstRealMediaUrl(record)
    || firstRealMediaUrl(nested);
  const error = typeof nested.failure_message === "string" ? nested.failure_message : typeof nested.error === "string" ? nested.error : typeof record.error === "string" ? record.error : normalized === "succeeded" && !outputUrl ? "HeyGen v3 succeeded, but no real video URL was found." : undefined;
  return {
    provider: job.provider,
    id: job.id,
    status: normalized === "succeeded" && !outputUrl ? "failed" : normalized,
    outputUrl,
    ...mediaMetadata(nested),
    error,
    raw: data
  };
}

export async function getHeyGenVideoAgentStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (!job.id) return { provider: "heygen_video_agent", status: "unknown", error: "Missing HeyGen Video Agent session id" };
  const sessionData = await getHeyGenVideoAgentSession(job.id);
  const sessionRecord = sessionData && typeof sessionData === "object" ? sessionData as Record<string, unknown> : {};
  const session = sessionRecord.data && typeof sessionRecord.data === "object" ? sessionRecord.data as Record<string, unknown> : sessionRecord;
  const artifacts = normalizeHeyGenVideoAgentArtifacts(sessionData);
  const latestVideoArtifact = latestHeyGenVideoArtifact(artifacts);
  const latestArtifactVideoUrl = latestVideoArtifact?.previewUrl && isRealMediaUrl(latestVideoArtifact.previewUrl) ? latestVideoArtifact.previewUrl : undefined;
  const videoId = String(latestVideoArtifact?.providerResourceId ?? session.video_id ?? session.videoId ?? "").trim();
  const sessionStatus = normalizeStatus(String(session.status ?? "unknown"));
  let v3VideoStatus: NormalizedProviderStatus | null = null;
  if (videoId && !latestArtifactVideoUrl) {
    try {
      v3VideoStatus = await getHeyGenV3VideoStatus({ provider: "heygen_video_agent", id: videoId, status: String(session.status ?? "processing"), raw: { session: sessionData } });
      return {
        ...v3VideoStatus,
        id: job.id,
        raw: { session: sessionData, video: v3VideoStatus.raw, heygenAgentArtifacts: artifacts, latestVideoArtifact }
      };
    } catch (error) {
      v3VideoStatus = { provider: "heygen_video_agent", id: videoId, status: "unknown", error: error instanceof Error ? error.message : "HeyGen v3 video lookup failed", raw: { session: sessionData } };
    }
  }
  const outputUrl = latestArtifactVideoUrl || firstRealMediaUrl(session);
  const normalizedStatus = outputUrl ? "succeeded" : sessionStatus === "succeeded" ? "running" : sessionStatus;
  return {
    provider: "heygen_video_agent",
    id: job.id,
    status: normalizedStatus,
    outputUrl,
    ...mediaMetadata(sessionData),
    error: normalizedStatus === "failed" ? String(session.messages ?? session.error ?? "HeyGen Video Agent session failed.") : undefined,
    raw: { session: sessionData, video: v3VideoStatus?.raw, videoLookupError: v3VideoStatus?.error, heygenAgentArtifacts: artifacts, latestVideoArtifact }
  };
}

async function getShotstackStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireProviderEnv("shotstack");
  if (!job.id) return { provider: "shotstack", status: "unknown", error: "Missing Shotstack render id" };
  const endpoint = shotstackStatusBaseUrl();
  const response = await fetch(`${endpoint}/render/${job.id}`, {
    headers: { "x-api-key": apiKey }
  });
  if (!response.ok) throw new Error(`Shotstack status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const render = data.response ?? data;
  return {
    provider: "shotstack",
    id: job.id,
    status: normalizeStatus(String(render.status ?? "unknown")),
    outputUrl: firstUrl(render.url) || firstUrl(render.output),
    ...mediaMetadata(render),
    error: typeof render.error === "string" ? render.error : undefined,
    raw: data
  };
}

export async function getProviderStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (job.provider === "replicate") return getReplicateStatus(job);
  if (job.provider === "runway") return getRunwayStatus(job);
  if (job.provider === "kling") return getKlingStatus(job);
  if (job.provider === "fal") return getFalStatus(job);
  if (job.provider === "heygen") return getHeyGenStatus(job);
  if (job.provider === "heygen_v3_video") return getHeyGenV3VideoStatus(job);
  if (job.provider === "heygen_video_agent") return getHeyGenVideoAgentStatus(job);
  if (job.provider === "minimax") return getMiniMaxStatus(job);
  if (job.provider === "shotstack") return getShotstackStatus(job);
  if (job.provider === "local_final") {
    return {
      provider: job.provider,
      id: job.id,
      status: "succeeded",
      outputUrl: job.url,
      raw: job.raw,
      hasAudio: Boolean(job.url)
    };
  }
  if (job.provider === "website_screenshot_reference") {
    return {
      provider: job.provider,
      id: job.id,
      status: job.url ? "succeeded" : "failed",
      outputUrl: job.url,
      error: job.url ? undefined : "Website screenshot reference job is missing its image URL.",
      raw: job.raw
    };
  }
  return { provider: job.provider, id: job.id, status: "unknown", outputUrl: job.url, raw: job.raw };
}
