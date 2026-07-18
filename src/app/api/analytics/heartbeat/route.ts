import { clientIpFromRequest, noStoreJson, rateLimit, rateLimitResponse } from "@/lib/security";
import { recordLiveVisitor } from "@/lib/live-visitors";

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit({ key: `analytics-heartbeat:${ip}`, limit: 180, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited.resetAt);

  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.sessionId ?? "").trim();
  const path = String(body.path ?? "/").trim() || "/";

  if (!sessionId) {
    return noStoreJson({ error: "Session id is required." }, { status: 400 });
  }

  const country = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || String(body.country ?? "");
  const snapshot = recordLiveVisitor({
    sessionId,
    ip,
    country,
    path,
    url: String(body.url ?? path),
    title: String(body.title ?? ""),
    referrer: String(body.referrer ?? ""),
    userAgent: request.headers.get("user-agent") ?? "",
    utmSource: String(body.utmSource ?? ""),
    utmMedium: String(body.utmMedium ?? ""),
    utmCampaign: String(body.utmCampaign ?? ""),
    utmTerm: String(body.utmTerm ?? ""),
    utmContent: String(body.utmContent ?? ""),
    ref: String(body.ref ?? ""),
    firstTouchAt: String(body.firstTouchAt ?? ""),
    firstTouchPath: String(body.firstTouchPath ?? "")
  });

  return noStoreJson({ ok: true, activeVisitors: snapshot.activeVisitors });
}
