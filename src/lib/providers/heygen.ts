import { optionalEnv, requireProviderEnv } from "./env";

function baseUrl() {
  return optionalEnv("HEYGEN_BASE_URL") || "https://api.heygen.com";
}

function apiKey() {
  return requireProviderEnv("heygen");
}

async function heygenJson<T>(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "X-Api-Key": apiKey(),
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    });

    if (!response.ok) throw new Error(`HeyGen request failed: ${response.status} ${await response.text()}`);
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("HeyGen request timed out after 60 seconds.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHeyGenAvatars() {
  return heygenJson("/v2/avatars");
}

export async function getHeyGenVoices() {
  return heygenJson("/v2/voices");
}

export async function getHeyGenVideoStatus(videoId: string) {
  return heygenJson(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`);
}

export async function createHeyGenTalkingVideo(input: Record<string, unknown>) {
  return heygenJson("/v2/video/generate", { method: "POST", body: JSON.stringify(input) });
}

export type HeyGenVideoAgentAsset =
  | { type: "url"; url: string }
  | { type: "asset_id"; asset_id: string };

export type CreateHeyGenVideoAgentInput = {
  prompt: string;
  mode?: "generate" | "chat";
  avatar_id?: string | null;
  voice_id?: string | null;
  style_id?: string | null;
  brand_kit_id?: string | null;
  orientation?: "portrait" | "landscape" | null;
  files?: HeyGenVideoAgentAsset[] | null;
  callback_url?: string | null;
  callback_id?: string | null;
  incognito_mode?: boolean;
};

export async function createHeyGenVideoAgentSession(input: CreateHeyGenVideoAgentInput) {
  return heygenJson("/v3/video-agents", {
    method: "POST",
    body: JSON.stringify({ mode: "generate", incognito_mode: true, ...input })
  });
}

export async function getHeyGenVideoAgentSession(sessionId: string) {
  return heygenJson(`/v3/video-agents/${encodeURIComponent(sessionId)}`);
}

export async function getHeyGenV3Video(videoId: string) {
  return heygenJson(`/v3/videos/${encodeURIComponent(videoId)}`);
}

export async function listHeyGenVideoAgentStyles(input?: { tag?: string; limit?: number; token?: string }) {
  const params = new URLSearchParams();
  if (input?.tag) params.set("tag", input.tag);
  if (input?.limit) params.set("limit", String(input.limit));
  if (input?.token) params.set("token", input.token);
  const query = params.toString();
  return heygenJson(`/v3/video-agents/styles${query ? `?${query}` : ""}`);
}

export async function listHeyGenAvatarLooks(input?: { group_id?: string; avatar_type?: "studio_avatar" | "digital_twin" | "photo_avatar"; ownership?: "public" | "private"; limit?: number; token?: string }) {
  const params = new URLSearchParams();
  if (input?.group_id) params.set("group_id", input.group_id);
  if (input?.avatar_type) params.set("avatar_type", input.avatar_type);
  if (input?.ownership) params.set("ownership", input.ownership);
  if (input?.limit) params.set("limit", String(input.limit));
  if (input?.token) params.set("token", input.token);
  const query = params.toString();
  return heygenJson(`/v3/avatars/looks${query ? `?${query}` : ""}`);
}
