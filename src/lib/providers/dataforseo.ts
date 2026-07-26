import { requireProviderEnv } from "./env";

function baseUrl() {
  return process.env.DATAFORSEO_BASE_URL || "https://api.dataforseo.com/v3";
}

function authHeader() {
  const login = requireProviderEnv("dataForSeoLogin");
  const password = requireProviderEnv("dataForSeoPassword");
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function dataForSeoJson<T>(path: string, body: unknown) {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`DataForSEO request failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function getSerpLive(input: { keyword: string; locationName?: string; languageCode?: string }) {
  const task = {
    keyword: input.keyword,
    location_name: input.locationName || process.env.DATAFORSEO_LOCATION_NAME || "United States",
    language_code: input.languageCode || process.env.DATAFORSEO_LANGUAGE_CODE || "en"
  };
  return dataForSeoJson("/serp/google/organic/live/advanced", [task]);
}

export async function getKeywordVolume(input: { keywords: string[]; locationName?: string; languageCode?: string }) {
  const task = {
    keywords: input.keywords.slice(0, 700),
    location_name: input.locationName || process.env.DATAFORSEO_LOCATION_NAME || "United States",
    language_code: input.languageCode || process.env.DATAFORSEO_LANGUAGE_CODE || "en"
  };
  return dataForSeoJson("/keywords_data/google_ads/search_volume/live", [task]);
}
