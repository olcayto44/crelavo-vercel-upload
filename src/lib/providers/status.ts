import { optionalEnv, requireEnv } from "./env";
import type { NormalizedProviderStatus, ProviderJob } from "./types";

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
    return firstUrl(record.url) || firstUrl(record.output) || firstUrl(record.video) || firstUrl(record.result) || firstUrl(record.src);
  }
  return undefined;
}

function falApiKey() {
  return optionalEnv("FAL_KEY") || optionalEnv("FAL_API_KEY") || requireEnv("FAL_KEY");
}

function falModel(job: ProviderJob) {
  const raw = job.raw && typeof job.raw === "object" ? job.raw as Record<string, unknown> : {};
  return String(raw.model ?? (optionalEnv("FAL_VIDEO_MODEL") || "fal-ai/wan/v2.2-a14b/text-to-video/turbo"));
}

export async function getReplicateStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireEnv("REPLICATE_API_TOKEN");
  if (!job.id) return { provider: "replicate", status: "unknown", error: "Missing Replicate job id" };
  const response = await fetch(`https://api.replicate.com/v1/predictions/${job.id}`, {
    headers: { Authorization: `Token ${apiKey}` }
  });
  if (!response.ok) throw new Error(`Replicate status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    provider: "replicate",
    id: job.id,
    status: normalizeStatus(String(data.status ?? "unknown")),
    outputUrl: firstUrl(data.output),
    error: typeof data.error === "string" ? data.error : undefined,
    raw: data
  };
}

export async function getRunwayStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireEnv("RUNWAY_API_KEY");
  if (!job.id) return { provider: "runway", status: "unknown", error: "Missing Runway job id" };
  const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${job.id}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": process.env.RUNWAY_API_VERSION || "2024-11-06"
    }
  });
  if (!response.ok) throw new Error(`Runway status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    provider: "runway",
    id: job.id,
    status: normalizeStatus(String(data.status ?? "unknown")),
    outputUrl: firstUrl(data.output) || firstUrl(data.artifacts),
    error: typeof data.failure === "string" ? data.failure : undefined,
    raw: data
  };
}

export async function getKlingStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireEnv("KLING_API_KEY");
  if (!job.id) return { provider: "kling", status: "unknown", error: "Missing Kling job id" };
  const baseUrl = optionalEnv("KLING_STATUS_API_URL") || optionalEnv("KLING_API_URL") || "https://api.klingai.com/v1/videos/text2video";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${job.id}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!response.ok) throw new Error(`Kling status failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return {
    provider: "kling",
    id: job.id,
    status: normalizeStatus(String(data.status ?? data.task_status ?? "unknown")),
    outputUrl: firstUrl(data.output) || firstUrl(data.video_url) || firstUrl(data.result),
    error: typeof data.error === "string" ? data.error : undefined,
    raw: data
  };
}

export async function getFalStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = falApiKey();
  if (!job.id) return { provider: "fal", status: "unknown", error: "Missing FAL request id" };
  const model = falModel(job);
  const statusResponse = await fetch(`https://queue.fal.run/${model}/requests/${job.id}/status`, {
    headers: { Authorization: `Key ${apiKey}` }
  });
  if (!statusResponse.ok) throw new Error(`FAL status failed: ${statusResponse.status} ${await statusResponse.text()}`);
  const statusData = await statusResponse.json();
  const normalized = normalizeStatus(String(statusData.status ?? statusData.state ?? "unknown"));
  let resultData: unknown = statusData;
  let outputUrl = firstUrl(statusData);

  if (normalized === "succeeded") {
    const resultResponse = await fetch(`https://queue.fal.run/${model}/requests/${job.id}`, {
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
    error: typeof (statusData as Record<string, unknown>).error === "string" ? String((statusData as Record<string, unknown>).error) : undefined,
    raw: resultData
  };
}

export async function getShotstackStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  const apiKey = requireEnv("SHOTSTACK_API_KEY");
  if (!job.id) return { provider: "shotstack", status: "unknown", error: "Missing Shotstack render id" };
  const endpoint = (process.env.SHOTSTACK_API_URL || "https://api.shotstack.io/stage/render").replace(/\/render$/, "");
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
    error: typeof render.error === "string" ? render.error : undefined,
    raw: data
  };
}

export async function getProviderStatus(job: ProviderJob): Promise<NormalizedProviderStatus> {
  if (job.provider === "replicate") return getReplicateStatus(job);
  if (job.provider === "runway") return getRunwayStatus(job);
  if (job.provider === "kling") return getKlingStatus(job);
  if (job.provider === "fal") return getFalStatus(job);
  if (job.provider === "shotstack") return getShotstackStatus(job);
  return { provider: job.provider, id: job.id, status: "unknown", outputUrl: job.url, raw: job.raw };
}
