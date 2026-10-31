import { createWebsitePlan } from "@/lib/website-domain";
import { requireVerifiedRequestUser } from "@/lib/supabase";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { validateProductionSafety } from "@/lib/content-safety";

const MAX_TEXT = 6000;

export async function POST(request: Request) {
  const limit = rateLimit({ key: `website-plan:${clientIpFromRequest(request)}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  const userId = String(body.user_id ?? "").trim();
  if (!userId) return Response.json({ error: "Authenticated user is required." }, { status: 401 });
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;

  const projectId = String(body.project_id ?? "").trim().slice(0, 120);
  if (!projectId) return Response.json({ error: "project_id is required." }, { status: 400 });
  const brief = body.brief && typeof body.brief === "object" ? body.brief as Record<string, unknown> : {};
  const text = Object.values(brief).flatMap((value) => Array.isArray(value) ? value.map(String) : [String(value ?? "")]).join(" ").slice(0, MAX_TEXT);
  const suspicious = rejectSuspiciousText([text]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
  const safety = validateProductionSafety([text]);
  if (!safety.ok) return Response.json({ error: safety.message }, { status: 400 });

  const plan = createWebsitePlan(brief, projectId);
  return Response.json({ plan });
}
