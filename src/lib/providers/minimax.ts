import { optionalEnv, optionalProviderEnv, requireProviderEnv } from "./env";

export type MiniMaxReadiness = {
  provider: "minimax";
  ready: boolean;
  hasApiKey: boolean;
  hasGroupId: boolean;
  baseUrl: string;
  groupIdMasked: string;
  models: {
    video: string;
    speech: string;
    music: string;
    image: string;
  };
};

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function minimaxBaseUrl() {
  return cleanBaseUrl(optionalEnv("MINIMAX_BASE_URL") || "https://api.minimax.io");
}

export function minimaxGroupId() {
  return optionalProviderEnv("minimaxGroupId");
}

export function hasMiniMaxConfig() {
  return Boolean(optionalProviderEnv("minimax"));
}

export function maskGroupId(value: string) {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export function minimaxReadiness(): MiniMaxReadiness {
  const groupId = minimaxGroupId();
  const hasApiKey = Boolean(optionalProviderEnv("minimax"));
  const hasGroupId = Boolean(groupId);
  return {
    provider: "minimax",
    ready: hasApiKey,
    hasApiKey,
    hasGroupId,
    baseUrl: minimaxBaseUrl(),
    groupIdMasked: maskGroupId(groupId),
    models: {
      video: "MiniMax-H3",
      speech: "speech-2.8-hd",
      music: "music-3.0",
      image: "image-01"
    }
  };
}

export type MiniMaxVideoContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role?: "first_frame" | "last_frame" | "reference_image" }
  | { type: "video_url"; video_url: { url: string }; role?: "reference_video" }
  | { type: "audio_url"; audio_url: { url: string }; role?: "reference_audio" };

export type MiniMaxH3CreateInput = {
  model?: "MiniMax-H3";
  content: MiniMaxVideoContentItem[];
  resolution?: "768P" | "2K";
  duration?: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  ratio?: "adaptive" | "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  callback_url?: string;
};

export type MiniMaxH3CreateResponse = {
  task_id?: string;
  error?: unknown;
  request_id?: string;
};

export type MiniMaxH3TaskResponse = {
  task?: {
    id?: string;
    model?: string;
    status?: "queued" | "running" | "succeeded" | "failed" | "cancelled" | string;
    error?: { code?: string; message?: string };
    created_at?: number;
    updated_at?: number;
    content?: { url?: string; prompt?: string };
    resolution?: string;
    duration?: number;
    usage?: Record<string, unknown>;
    ratio?: string;
    task_type?: string;
    modality?: string;
  };
};

export async function minimaxJson<T>(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${minimaxBaseUrl()}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        Authorization: `Bearer ${requireProviderEnv("minimax")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(minimaxGroupId() ? { "Group-Id": minimaxGroupId() } : {}),
        ...(init?.headers || {})
      }
    });

    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw_text: text };
      }
    }
    if (!response.ok) throw new Error(`MiniMax request failed: ${response.status} ${text}`);
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("MiniMax request timed out after 60 seconds.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createMiniMaxH3VideoTask(input: MiniMaxH3CreateInput) {
  return minimaxJson<MiniMaxH3CreateResponse>("/v2/video_generation", {
    method: "POST",
    body: JSON.stringify({
      model: "MiniMax-H3",
      resolution: "768P",
      duration: 6,
      ratio: "9:16",
      ...input
    })
  });
}

export async function queryMiniMaxH3VideoTask(taskId: string) {
  return minimaxJson<MiniMaxH3TaskResponse>(`/v2/query/video_generation/${encodeURIComponent(taskId)}`);
}

export async function listMiniMaxH3VideoTasks(input?: { pageNum?: number; pageSize?: number; status?: string }) {
  const params = new URLSearchParams();
  params.set("page_num", String(input?.pageNum ?? 1));
  params.set("page_size", String(input?.pageSize ?? 10));
  if (input?.status) params.set("filter.status", input.status);
  params.set("filter.model", "MiniMax-H3");
  return minimaxJson<{ items?: MiniMaxH3TaskResponse["task"][]; total?: number }>(`/v2/query/video_generation?${params.toString()}`);
}
