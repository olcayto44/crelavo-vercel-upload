import { requireProviderEnv } from "./env";

export type ReplicateCancellationResult = {
  provider: "replicate";
  id: string;
  cancelled: boolean;
  status: number;
};

export async function cancelReplicatePrediction(predictionId: string): Promise<ReplicateCancellationResult> {
  const id = String(predictionId ?? "").trim();
  if (!id) throw new Error("Replicate cancellation requires a real prediction id.");
  const apiKey = requireProviderEnv("replicate");
  const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Replicate cancellation failed: ${response.status} ${text}`);
  let payload: Record<string, unknown> = {};
  if (text) {
    try { payload = JSON.parse(text) as Record<string, unknown>; } catch { payload = {}; }
  }
  const status = String(payload.status ?? "canceled").toLowerCase();
  if (!payload.id || !["canceled", "cancelled"].includes(status)) {
    throw new Error(`Replicate cancellation was not confirmed for prediction ${id}.`);
  }
  return { provider: "replicate", id, cancelled: true, status: response.status };
}

export function replicateProviderJobFromOutput(output: Record<string, unknown>) {
  const candidates = [
    output.visualJob,
    output.providerJob,
    output.providerProof,
    output.providerStatus && typeof output.providerStatus === "object" ? output.providerStatus : null
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    if (String(record.provider ?? "").toLowerCase() !== "replicate") continue;
    const id = String(record.id ?? record.providerJobId ?? record.jobId ?? "").trim();
    if (id) return id;
  }
  const provider = String(output.provider ?? output.provider_name ?? "").toLowerCase();
  if (provider === "replicate") return String(output.providerJobId ?? output.provider_job_id ?? "").trim();
  return "";
}
