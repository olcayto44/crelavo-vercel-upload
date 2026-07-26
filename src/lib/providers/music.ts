import { optionalProviderEnv, requireProviderEnv } from "./env";

export async function getStableAudioAccount() {
  const apiKey = optionalProviderEnv("stableAudio") || requireProviderEnv("stability");
  const endpoint = optionalProviderEnv("stableAudio") ? "https://api.stability.ai/v2beta/user/account" : "https://api.stability.ai/v2beta/user/account";
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Stable Audio account check failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function getMubertAccount() {
  const apiKey = requireProviderEnv("mubert");
  const endpoint = "https://api-b2b.mubert.com/v2/GetServiceAccess";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ method: "GetServiceAccess", params: { token: apiKey } })
  });
  if (!response.ok) throw new Error(`Mubert account check failed: ${response.status} ${await response.text()}`);
  return response.json();
}
