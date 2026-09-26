import { clientIpFromRequest, noStoreJson, rateLimit, rateLimitResponse } from "@/lib/security";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/crelavo/sessionCookie";
import { resolveCountry } from "@/lib/ip-geolocation";

function clean(value: unknown, max: number, fallback = "") { return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max); }
function safePath(value: unknown) { const path = clean(value, 500, "/").split("?")[0].split("#")[0]; return path.startsWith("/") ? path : `/${path}`; }
async function currentUser(request: Request) { const token = bearerTokenFromRequest(request); if (token) { const { data } = await supabaseAdmin().auth.getUser(token).catch(() => ({ data: { user: null } })); if (data.user) return data.user; } return getSessionUser(); }

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit({ key: `presence:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) return rateLimitResponse(limited.resetAt);
  const body = await request.json().catch(() => ({}));
  const user = await currentUser(request);
  const country = await resolveCountry(ip, request.headers.get("x-vercel-ip-country") || request.headers.get("x-vercel-ip-country-code") || request.headers.get("cf-ipcountry"));
  const { error } = await supabaseAdmin().from("presence").insert({
    user_id: user?.id ?? null,
    guest_id: user ? null : clean(body.guestId, 160) || null,
    path: safePath(body.path),
    ip,
    country,
    device: clean(body.device, 40) || (/(android|iphone|ipad|mobile)/i.test(request.headers.get("user-agent") || "") ? "mobile" : "desktop"),
    seen_at: new Date().toISOString(),
  });
  if (!error && user?.id) { await supabaseAdmin().from("user_ips").insert({ user_id: user.id, ip, user_agent: clean(request.headers.get("user-agent"), 500), seen_at: new Date().toISOString() }); }
  if (error) return noStoreJson({ error: "presence_unavailable" }, { status: 503 });
  return noStoreJson({ ok: true });
}
