import { optionalEnv, requireProviderEnv } from "./env";

function graphVersion() {
  return optionalEnv("META_GRAPH_API_VERSION") || "v20.0";
}

function graphBaseUrl() {
  return optionalEnv("META_GRAPH_BASE_URL") || `https://graph.facebook.com/${graphVersion()}`;
}

function systemToken() {
  return requireProviderEnv("metaAccessToken");
}

async function metaJson<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${graphBaseUrl()}${path}`);
  url.searchParams.set("access_token", systemToken());
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Meta Graph request failed: ${response.status} ${await response.text()}`);
  const data = await response.json() as T & { error?: { message?: string } };
  if (data.error?.message) throw new Error(data.error.message);
  return data;
}

export async function getMetaAdAccount(fields = "id,name,account_status,currency,timezone_name") {
  const adAccountId = requireProviderEnv("metaAdAccount");
  const cleanId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  return metaJson(`/${cleanId}`, { fields });
}

export async function getMetaInsights(fields = "spend,impressions,clicks,cpc,ctr,actions", datePreset = "last_7d") {
  const adAccountId = requireProviderEnv("metaAdAccount");
  const cleanId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  return metaJson(`/${cleanId}/insights`, { fields, date_preset: datePreset });
}

export async function getMetaPages(fields = "id,name,access_token") {
  return metaJson("/me/accounts", { fields });
}
