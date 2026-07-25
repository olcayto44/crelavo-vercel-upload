import { optionalEnv, requireEnv } from "./env";

function baseUrl() {
  return optionalEnv("HEYGEN_BASE_URL") || "https://api.heygen.com";
}

function apiKey() {
  return requireEnv("HEYGEN_API_KEY");
}

async function heygenJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": apiKey(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) throw new Error(`HeyGen request failed: ${response.status} ${await response.text()}`);
  return response.json() as Promise<T>;
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
