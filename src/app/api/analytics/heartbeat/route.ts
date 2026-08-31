import { clientIpFromRequest, noStoreJson, rateLimit, rateLimitResponse } from "@/lib/security";
import { recordLiveVisitor } from "@/lib/live-visitors";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";

function safe(value: unknown, max: number, fallback = "") {
  return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function safePath(value: unknown) {
  const path = safe(value, 500, "/").split("?")[0].split("#")[0];
  return path.startsWith("/") ? path : `/${path}`;
}

function maskEmail(email: string) {
  const [local, domain] = email.toLowerCase().split("@");
  return local && domain ? `${local.slice(0, 1)}***@${domain.slice(0, 120)}` : "";
}

async function authenticatedUser(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return null;
  const result = await supabaseAdmin().auth.getUser(token).catch(() => ({ data: { user: null } }));
  return result.data.user;
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit({ key: `analytics-heartbeat:${ip}`, limit: 180, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited.resetAt);

  const body = await request.json().catch(() => ({}));
  const sessionId = safe(body.sessionId, 160);
  if (!sessionId) return noStoreJson({ error: "Session id is required." }, { status: 400 });

  const path = safePath(body.path);
  const title = safe(body.title, 200);
  const referrer = safe(body.referrer, 500);
  const country = safe(request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || body.country, 80, "Unknown");
  const attribution = {
    utmSource: safe(body.utmSource, 120),
    utmMedium: safe(body.utmMedium, 120),
    utmCampaign: safe(body.utmCampaign, 180),
    utmTerm: safe(body.utmTerm, 180),
    utmContent: safe(body.utmContent, 180),
    ref: safe(body.ref, 120),
    firstTouchPath: safePath(body.firstTouchPath || path),
    landingPath: safePath(body.landingUrl || body.firstTouchPath || path)
  };
  let persistence = "available";
  let user: { id: string; email?: string | null } | null = null;

  try {
    user = await authenticatedUser(request);
    const now = new Date().toISOString();
    const supabase = supabaseAdmin();
    const { data: existing } = await supabase.from("visitor_sessions").select("first_seen_at").eq("anonymous_id", sessionId).maybeSingle();
    await supabase.from("visitor_sessions").upsert({
      anonymous_id: sessionId,
      user_id: user?.id ?? null,
      first_seen_at: existing?.first_seen_at ?? now,
      last_seen_at: now,
      current_path: path,
      current_title: title,
      first_touch_path: attribution.firstTouchPath,
      landing_path: attribution.landingPath,
      referrer,
      utm_source: attribution.utmSource,
      utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign,
      utm_term: attribution.utmTerm,
      utm_content: attribution.utmContent,
      source: attribution.utmSource || attribution.ref || "direct",
      country,
      updated_at: now
    }, { onConflict: "anonymous_id" });
    await supabase.from("analytics_events").insert({ anonymous_id: sessionId, session_id: sessionId, user_id: user?.id ?? null, event_name: "heartbeat", path, occurred_at: now, metadata: { title, source: attribution.utmSource || attribution.ref || "direct" } });
  } catch {
    persistence = "unavailable";
  }

  const snapshot = recordLiveVisitor({ sessionId, ip, country, path, url: path, title, referrer, userAgent: request.headers.get("user-agent") ?? "", maskedEmail: user?.email ? maskEmail(user.email) : "", ...attribution, firstTouchAt: safe(body.firstTouchAt, 80) });
  return noStoreJson({ ok: true, activeVisitors: snapshot.activeVisitors, persistence });
}
