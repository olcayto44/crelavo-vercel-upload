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
  look_id?: string | null;
  voice_id?: string | null;
  style_id?: string | null;
  brand_kit_id?: string | null;
  orientation?: "portrait" | "landscape" | null;
  files?: HeyGenVideoAgentAsset[] | null;
  callback_url?: string | null;
  callback_id?: string | null;
  incognito_mode?: boolean;
};

export type HeyGenAgentArtifact = {
  id: string;
  provider: "heygen";
  providerResourceId: string;
  type: "blueprint" | "image" | "video" | "audio" | "file" | "message";
  title: string;
  status: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt?: string;
  raw?: unknown;
};

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function firstHttpsUrl(value: unknown): string {
  if (typeof value === "string") {
    const direct = value.trim();
    if (/^https?:\/\//i.test(direct)) return direct;
    return direct.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHttpsUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["captioned_video_url", "captionedVideoUrl", "video_url", "videoUrl", "download_url", "downloadUrl", "preview_url", "previewUrl", "url", "src", "file", "files", "output", "result", "data", "thumbnail_url", "thumbnailUrl"]) {
      const found = firstHttpsUrl(record[key]);
      if (found) return found;
    }
  }
  return "";
}

function inferArtifactType(record: Record<string, unknown>, id: string, url: string): HeyGenAgentArtifact["type"] {
  const signal = `${id} ${firstString(record, ["type", "resource_type", "resourceType", "kind", "mime_type", "mimeType"])} ${url}`.toLowerCase();
  if (/video|\.mp4|\.mov|\.webm/.test(signal)) return "video";
  if (/image|avatar|poster|thumbnail|\.png|\.jpe?g|\.webp|\.gif/.test(signal)) return "image";
  if (/audio|voice|\.mp3|\.wav|\.m4a|\.aac/.test(signal)) return "audio";
  if (/draft|blueprint|storyboard|plan|script/.test(signal)) return "blueprint";
  if (/message|assistant|chat/.test(signal)) return "message";
  return url ? "file" : "message";
}

function artifactStatus(record: Record<string, unknown>) {
  return firstString(record, ["status", "state", "resource_status", "resourceStatus", "video_status", "videoStatus"]) || "available";
}

function walkObjects(value: unknown, visit: (record: Record<string, unknown>) => void, seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) walkObjects(item, visit, seen);
    return;
  }
  const record = value as Record<string, unknown>;
  visit(record);
  for (const nested of Object.values(record)) walkObjects(nested, visit, seen);
}

export function normalizeHeyGenVideoAgentArtifacts(sessionPayload: unknown): HeyGenAgentArtifact[] {
  const byId = new Map<string, HeyGenAgentArtifact>();
  walkObjects(sessionPayload, (record) => {
    const providerResourceId = firstString(record, ["resource_id", "resourceId", "asset_id", "assetId", "video_id", "videoId", "id"]);
    const url = firstHttpsUrl(record);
    const hasResourceSignal = Boolean(providerResourceId && (/^(video|image|audio|draft|resource|asset|file|message)_/i.test(providerResourceId) || url || record.resource_id || record.resourceId || record.video_id || record.videoId));
    if (!hasResourceSignal) return;
    const type = inferArtifactType(record, providerResourceId, url);
    const title = firstString(record, ["title", "name", "label"]) || (type === "video" ? "HeyGen video" : type === "image" ? "HeyGen visual" : type === "blueprint" ? "HeyGen blueprint" : "HeyGen artifact");
    const thumbnailUrl = firstHttpsUrl(record.thumbnail_url ?? record.thumbnailUrl ?? record.cover_url ?? record.coverUrl);
    const artifact: HeyGenAgentArtifact = {
      id: providerResourceId,
      provider: "heygen",
      providerResourceId,
      type,
      title,
      status: artifactStatus(record),
      previewUrl: type === "video" || type === "image" || type === "audio" || type === "file" ? url || undefined : undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      description: firstString(record, ["description", "text", "content", "message"]),
      createdAt: firstString(record, ["created_at", "createdAt", "updated_at", "updatedAt"]),
      raw: record
    };
    const previous = byId.get(providerResourceId);
    if (!previous || (!previous.previewUrl && artifact.previewUrl) || (previous.type !== "video" && artifact.type === "video")) byId.set(providerResourceId, artifact);
  });
  return Array.from(byId.values()).sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")) || a.id.localeCompare(b.id));
}

export function latestHeyGenVideoArtifact(artifacts: HeyGenAgentArtifact[]) {
  const videos = artifacts.filter((artifact) => artifact.type === "video");
  return videos[videos.length - 1] ?? null;
}

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
