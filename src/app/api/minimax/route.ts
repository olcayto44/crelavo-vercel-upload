import { minimaxReadiness } from "@/lib/providers/minimax";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = String(searchParams.get("action") ?? "readiness").trim().toLowerCase();

  if (action === "readiness") {
    return Response.json({
      minimax: minimaxReadiness(),
      note: "Secrets are not returned. This endpoint only confirms whether MINIMAX_API_KEY and MINIMAX_GROUP_ID are visible to the backend."
    });
  }

  return Response.json({ error: `Unsupported MiniMax action: ${action}` }, { status: 400 });
}
