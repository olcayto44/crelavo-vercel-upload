import { optionalEnv, optionalProviderEnv, requireProviderEnv } from "./env.ts";
import { ProviderConfigError } from "./types.ts";

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

export function hasMiniMaxVideoConfig() {
  return Boolean(optionalProviderEnv("minimax") && optionalProviderEnv("minimaxGroupId"));
}

export function miniMaxTaskRecord(result: unknown) {
  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  return {
    data,
    taskId: String(data.task_id ?? data.request_id ?? data.taskId ?? data.id ?? "").trim(),
    status: String(data.status ?? "submitted")
  };
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
    ready: hasApiKey && hasGroupId,
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

export class MiniMaxStatusError extends Error {
  readonly httpStatus: number;
  readonly payload: unknown;

  constructor(message: string, httpStatus: number, payload?: unknown) {
    super(message);
    this.name = "MiniMaxStatusError";
    this.httpStatus = httpStatus;
    this.payload = payload;
  }
}

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
    if (!response.ok) throw new MiniMaxStatusError(`MiniMax request failed: ${response.status} ${text}`, response.status, payload);
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("MiniMax request timed out after 60 seconds.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createMiniMaxH3VideoTask(input: MiniMaxH3CreateInput) {
  if (input.duration !== undefined && (input.duration < 5 || input.duration > 15)) {
    throw new Error("MiniMax video duration must be between 5 and 15 seconds.");
  }
  if (!hasMiniMaxVideoConfig()) {
    throw new ProviderConfigError("MiniMax video provider requires MINIMAX_API_KEY (or MINIMAX_KEY) and MINIMAX_GROUP_ID (or MINIMAX_GID/MINIMAX_GROUPID).");
  }
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

export async function createMiniMaxH3VideoShotTasks(
  input: Omit<MiniMaxH3CreateInput, "duration"> & { targetDurationSeconds: number },
  createTask: (shot: MiniMaxH3CreateInput) => Promise<MiniMaxH3CreateResponse> = createMiniMaxH3VideoTask
) {
  const targetDurationSeconds = Math.max(5, Math.round(Number(input.targetDurationSeconds) || 5));
  const { targetDurationSeconds: _ignored, ...shotInput } = input;
  const shotCount = targetDurationSeconds > 5 ? Math.ceil(targetDurationSeconds / 5) : 1;
  const jobs: MiniMaxH3CreateResponse[] = [];
  for (let index = 0; index < shotCount; index += 1) {
    const content = shotInput.content.map((item) => item.type === "text" ? { ...item, text: `${item.text}\nShot ${index + 1}/${shotCount}: continue this segment as a distinct 5-second beat.` } : item);
    jobs.push(await createTask({ ...shotInput, content, duration: 5 }));
  }
  return jobs;
}

export async function queryMiniMaxH3VideoTask(taskId: string) {
  const params = new URLSearchParams({ task_id: taskId });
  return minimaxJson<MiniMaxH3TaskResponse>(`/v2/query/video_generation?${params.toString()}`);
}

export async function listMiniMaxH3VideoTasks(input?: { pageNum?: number; pageSize?: number; status?: string }) {
  const params = new URLSearchParams();
  params.set("page_num", String(input?.pageNum ?? 1));
  params.set("page_size", String(input?.pageSize ?? 10));
  if (input?.status) params.set("filter.status", input.status);
  params.set("filter.model", "MiniMax-H3");
  return minimaxJson<{ items?: MiniMaxH3TaskResponse["task"][]; total?: number }>(`/v2/query/video_generation?${params.toString()}`);
}
