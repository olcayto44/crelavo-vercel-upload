import { optionalEnv, requireEnv } from "./env";

function baseUrl() {
  return optionalEnv("STABILITY_BASE_URL") || "https://api.stability.ai";
}

export async function getStabilityBalance() {
  const apiKey = requireEnv("STABILITY_API_KEY");
  const response = await fetch(`${baseUrl()}/v1/user/balance`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Stability balance check failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function getStabilityEngines() {
  const apiKey = requireEnv("STABILITY_API_KEY");
  const response = await fetch(`${baseUrl()}/v1/engines/list`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Stability engines check failed: ${response.status} ${await response.text()}`);
  return response.json();
}
