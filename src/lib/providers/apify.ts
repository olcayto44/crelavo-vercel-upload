import { optionalEnv, requireProviderEnv } from "./env";

function baseUrl() {
  return optionalEnv("APIFY_BASE_URL") || "https://api.apify.com/v2";
}

async function apifyJson<T>(path: string, init?: RequestInit) {
  const token = requireProviderEnv("apify");
  const url = new URL(`${baseUrl()}${path}`);
  url.searchParams.set("token", token);

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Apify request failed: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function startApifyRun(actorId: string, input: Record<string, unknown> = {}) {
  return apifyJson<{ data: { id: string; actId?: string; status?: string; defaultDatasetId?: string; startedAt?: string } }>(`/acts/${encodeURIComponent(actorId)}/runs`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getApifyRun(runId: string) {
  return apifyJson<{ data: { id: string; actId?: string; status?: string; defaultDatasetId?: string; startedAt?: string; finishedAt?: string } }>(`/actor-runs/${encodeURIComponent(runId)}`);
}

export async function getApifyDatasetItems(datasetId: string) {
  return apifyJson<unknown[]>(`/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json`);
}
