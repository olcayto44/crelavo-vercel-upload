import { compileRuntimeBlueprint } from "@/lib/website-runtime/compile";
import { websiteEngineInput } from "@/lib/assistant-work/website-brief";
import { proposeRuntimeBlueprint } from "@/lib/website-runtime/blueprint";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/security";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (process.env.WEBSITE_RUNTIME_DEVELOPMENT !== "1" || process.env.VERCEL_ENV === "production") return Response.json({ error: "runtime_development_only" }, { status: 403 });
  const raw = await request.text(); if (raw.length > 20000) return Response.json({ error: "request_too_large" }, { status: 413 });
  let body; try { body = JSON.parse(raw); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object" || typeof body.user_id !== "string" || typeof body.productionId !== "string") return Response.json({ error: "project_and_user_required" }, { status: 400 });
  const user = await requireVerifiedRequestUser(request, body.user_id); if (!user.ok) return user.response;
  const limit = rateLimit({ key: "website-blueprint:" + body.user_id + ":" + clientIpFromRequest(request), limit: 10, windowMs: 900000 }); if (!limit.allowed) return rateLimitResponse(limit.resetAt);
  const db = supabaseAdmin(); const { data, error } = await db.from("production_requests").select("id,output_json,updated_at").eq("id", body.productionId).eq("user_id", body.user_id).eq("production_type", "website").maybeSingle();
  if (error) return Response.json({ error: "project_read_failed" }, { status: 503 });
  if (!data) return Response.json({ error: "project_not_found" }, { status: 404 });
  const state = data.output_json?.websiteAssistant;
  if (!state?.brief) return Response.json({ error: "shared_website_brief_required" }, { status: 409 });
  if (["generating", "awaiting_payment"].includes(state.phase)) return Response.json({ error: "production_in_progress" }, { status: 409 });
  if (body.action === "compile") {
    const stored = data.output_json?.runtimeBlueprint;
    if (!stored || stored.sourcePlanHash !== state.planHash) return Response.json({ error: "runtime_plan_changed_review_again" }, { status: 409 });
    if (body.approve !== true || body.blueprintHash !== stored.hash) return Response.json({ error: "runtime_blueprint_approval_required" }, { status: 409 });
    let artifact;
    try { artifact = compileRuntimeBlueprint(websiteEngineInput(state.brief), stored, body.blueprintHash); }
    catch { return Response.json({ error: "runtime_blueprint_validation_failed" }, { status: 422 }); }
    const history = [...(Array.isArray(data.output_json.runtimeArtifactHistory) ? data.output_json.runtimeArtifactHistory : []), ...(data.output_json.runtimeArtifact ? [data.output_json.runtimeArtifact] : [])].slice(-5);
    const result = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeBlueprint: { ...stored, review: "approved_for_development", approvedAt: new Date().toISOString() }, runtimeArtifact: { ...artifact, createdAt: new Date().toISOString() }, runtimeArtifactHistory: history, acceptancePending: true } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (result.error) return Response.json({ error: "runtime_artifact_save_failed" }, { status: 503 });
    if (!result.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ productionId: data.id, artifactVersion: artifact.artifactVersion, status: artifact.status, blockers: artifact.blockers, charged: 0, preview: "not_provisioned" }, { status: 202 });
  }
  if (body.action && body.action !== "propose") return Response.json({ error: "unsupported_action" }, { status: 400 });
  try {
    const blueprint = await proposeRuntimeBlueprint(state.brief, String(body.instruction || "Mevcut brief'e uygun uygulama planı hazırla."));
    const result = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeBlueprint: { ...blueprint, review: "pending_user_approval", acceptance: "not_run", sourcePlanHash: state.planHash }, websiteAssistant: { ...state, approvedHash: null, phase: "draft" } } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (result.error) return Response.json({ error: "blueprint_save_failed" }, { status: 503 });
    if (!result.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ productionId: data.id, blueprint, status: "plan_review", productionStarted: false, charged: 0 });
  } catch { return Response.json({ error: "blueprint_generation_failed", productionStarted: false, charged: 0 }, { status: 503 }); }
}
