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
  return Boolean(optionalProviderEnv("minimax") && minimaxGroupId());
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
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(`MiniMax request failed: ${response.status} ${text}`);
    return payload as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("MiniMax request timed out after 60 seconds.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
