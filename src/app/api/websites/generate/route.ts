import { executeWebsiteRequest } from "@/lib/assistant-work/website-request";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
// Website Builder is an adapter to the same project/approval/billing state machine.
export async function POST(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return Response.json({ error: "sign_in" }, { status: 401 });
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "sign_in" }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 50000) return Response.json({ error: "website_request_too_large" }, { status: 413 });
  let body; try { body = JSON.parse(raw); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "invalid_request" }, { status: 400 });
  const limit = rateLimit({ key: "website-assistant:" + data.user.id + ":" + clientIpFromRequest(request), limit: 30, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);
  const safe = rejectSuspiciousText([String(body.prompt ?? body.brief ?? ""), JSON.stringify(body.websiteBrief ?? {})]);
  if (!safe.ok) return Response.json({ error: safe.message }, { status: 400 });
  const action = String(body.action || "revise");
  if (!["revise", "website_open", "website_approve", "render", "website_retry"].includes(action)) return Response.json({ error: "unsupported_action" }, { status: 400 });
  // No separate/free generation or implicit approval is permitted here.
  const result = await executeWebsiteRequest(request, { ...body, category: "website", type: "Website", action, render: action === "render", prompt: String(body.prompt ?? body.brief ?? ""), ...(action === "revise" ? { uiAction: true, websiteBrief: body.websiteBrief ?? { brand: body.brand, brief: body.brief, audience: body.audience, siteType: body.site_type, style: body.style, pages: body.pages, features: body.features, locale: body.locale } } : {}) }, { id: data.user.id, email: data.user.email });
  return Response.json(result.payload, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
