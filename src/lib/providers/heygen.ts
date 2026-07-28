import { optionalEnv, requireProviderEnv } from "./env";

function baseUrl() {
  return optionalEnv("HEYGEN_BASE_URL") || "https://api.heygen.com";
}

function apiKey() {
  return requireProviderEnv("heygen");
}

async function heygenJson<T>(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
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
    if (error instanceof Error && error.name === "AbortError") throw new Error("HeyGen request timed out after 15 seconds.");
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
