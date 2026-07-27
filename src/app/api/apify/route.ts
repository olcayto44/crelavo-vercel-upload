import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getApifyDatasetItems, getApifyRun, startApifyRun } from "@/lib/providers/apify";

function assertSeoProviderAccess(request: Request, body?: Record<string, unknown>) {
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  return null;
}

export async function GET(request: Request) {
  const accessError = assertSeoProviderAccess(request);
  if (accessError) return accessError;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";
  const runId = url.searchParams.get("run_id") || "";
  const datasetId = url.searchParams.get("dataset_id") || "";

  try {
    if (action === "items") {
      if (!datasetId) return Response.json({ error: "dataset_id is required." }, { status: 400 });
      const items = await getApifyDatasetItems(datasetId);
      return Response.json({ action, datasetId, items });
    }

    if (!runId) return Response.json({ error: "run_id is required." }, { status: 400 });
    const run = await getApifyRun(runId);
    return Response.json({ action: "status", run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apify request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessError = assertSeoProviderAccess(request, body);
    if (accessError) return accessError;
    const actorId = String(body.actor_id ?? body.actorId ?? "").trim();
    const input = body.input && typeof body.input === "object" ? body.input as Record<string, unknown> : {};

    if (!actorId) return Response.json({ error: "actor_id is required." }, { status: 400 });

    const run = await startApifyRun(actorId, input);
    return Response.json({ action: "start", run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apify run could not be started.";
    return Response.json({ error: message }, { status: 500 });
  }
}
