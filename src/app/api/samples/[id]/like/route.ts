import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/security";
import { loadSampleEngagement, saveSampleEngagement } from "@/lib/sample-engagement-store";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `sample-like:${ip}`, limit: 60, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const { id } = await context.params;
    const payload = await loadSampleEngagement();
    payload.likes[id] = Number(payload.likes[id] ?? 0) + 1;
    await saveSampleEngagement(payload);
    return Response.json({ likeCount: payload.likes[id] });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not like sample") }, { status: 500 });
  }
}
