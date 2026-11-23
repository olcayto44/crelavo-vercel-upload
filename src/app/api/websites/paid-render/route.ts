import { executePaidWebsiteProduction } from "@/lib/assistant-work/website-paid-production";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Additive, fail-closed endpoint: does not change the existing Website Builder route.
export async function POST(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return Response.json({ ok: false, code: "sign_in" }, { status: 401 });
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return Response.json({ ok: false, code: "sign_in" }, { status: 401 });
  const limit = rateLimit({
    key: "website-paid-render:" + data.user.id + ":" + clientIpFromRequest(request),
    limit: 10, windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ ok: false, code: "request_too_large" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); }
  catch { return Response.json({ ok: false, code: "invalid_json" }, { status: 400 }); }
  const outcome = await executePaidWebsiteProduction(body, { id: data.user.id });
  return Response.json(outcome.payload, { status: outcome.status, headers: { "Cache-Control": "no-store" } });
}
