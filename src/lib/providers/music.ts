import { optionalEnv, requireEnv } from "./env";

export async function getStableAudioAccount() {
  const apiKey = optionalEnv("STABLE_AUDIO_API_KEY") || requireEnv("STABILITY_API_KEY");
  const endpoint = optionalEnv("STABLE_AUDIO_ACCOUNT_URL") || "https://api.stability.ai/v2beta/user/account";
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Stable Audio account check failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function getMubertAccount() {
  const apiKey = optionalEnv("MUBERT_API_KEY") || requireEnv("MUBERT_ACCESS_TOKEN");
  const endpoint = optionalEnv("MUBERT_ACCOUNT_URL") || "https://api-b2b.mubert.com/v2/GetServiceAccess";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ method: "GetServiceAccess", params: { token: apiKey } })
  });
  if (!response.ok) throw new Error(`Mubert account check failed: ${response.status} ${await response.text()}`);
  return response.json();
}
