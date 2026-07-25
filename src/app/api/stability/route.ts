import { getStabilityBalance, getStabilityEngines } from "@/lib/providers/stability";

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get("action") || "balance";
  try {
    if (action === "engines") return Response.json({ action, result: await getStabilityEngines() });
    return Response.json({ action: "balance", result: await getStabilityBalance() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stability request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
