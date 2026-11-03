import { createRuntimeWorkerJob, dispatchRuntimeWorker, pollRuntimeWorker } from "@/lib/website-runtime/worker";
import { reviewRuntimeRevision, checkedRuntimeSnapshot } from "@/lib/website-runtime/revision";
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
  if (data.output_json.runtimeJob && ["queued", "running"].includes(data.output_json.runtimeJob.status) && Date.parse(data.output_json.runtimeJob.expiresAt) > Date.now() && !["status", "test", "poll"].includes(body.action)) return Response.json({ error: "runtime_worker_in_progress" }, { status: 409 });
  if (body.action === "test") {
    if (body.approve !== true || body.artifactVersion !== data.output_json.runtimeArtifact?.artifactVersion) return Response.json({ error: "runtime_test_approval_required" }, { status: 409 });
    if (!process.env.WEBSITE_RUNTIME_WORKER_URL || !process.env.WEBSITE_RUNTIME_WORKER_TOKEN || !process.env.WEBSITE_RUNTIME_WORKER_REPORT_SECRET) return Response.json({ error: "runtime_worker_not_configured" }, { status: 503 });
    let job;
    try { job = createRuntimeWorkerJob(data.id, body.user_id, data.output_json); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "runtime_worker_artifact_invalid" }, { status: 422 }); }
    const old = data.output_json.runtimeJob;
    if (old && old.artifactVersion === job.artifactVersion && ["queued", "running"].includes(old.status) && Date.parse(old.expiresAt) > Date.now()) {
      if (old.status === "queued") { try { await dispatchRuntimeWorker(old, data.output_json); } catch { return Response.json({ error: "runtime_worker_dispatch_failed", job: old }, { status: 503 }); } }
      return Response.json({ job: old, charged: 0 }, { status: 202 });
    }
    const queuedAt = new Date().toISOString();
    const queued = await db.from("production_requests").update({ updated_at: queuedAt, output_json: { ...data.output_json, runtimeJob: job, runtimeAcceptance: null, acceptancePending: true } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (queued.error) return Response.json({ error: "runtime_worker_job_save_failed" }, { status: 503 });
    if (!queued.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    try {
      const running = await dispatchRuntimeWorker(job, data.output_json);
      const saved = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeJob: running, runtimeAcceptance: null, acceptancePending: true } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", queuedAt).select("id").maybeSingle();
      if (!saved.data || saved.error) return Response.json({ error: "runtime_worker_job_status_pending", job }, { status: 202 });
      return Response.json({ job: running, charged: 0 }, { status: 202 });
    } catch { return Response.json({ error: "runtime_worker_dispatch_failed_retry_same_job", job, charged: 0 }, { status: 503 }); }
  }
  if (body.action === "poll") {
    const job = data.output_json.runtimeJob;
    if (!job) return Response.json({ error: "runtime_worker_job_missing" }, { status: 409 });
    if (["passed", "failed"].includes(job.status)) return Response.json({ job, artifact: { artifactVersion: data.output_json.runtimeArtifact?.artifactVersion, blockers: data.output_json.runtimeArtifact?.blockers }, charged: 0 });
    if (Date.now() > Date.parse(job.expiresAt)) return Response.json({ error: "runtime_worker_job_expired" }, { status: 409 });
    let result;
    try { result = await pollRuntimeWorker(job, data.output_json); }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : "runtime_worker_poll_failed" }, { status: 503 }); }
    if (!result) return Response.json({ job, charged: 0 }, { status: 202 });
    const saved = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeJob: result.job, runtimeAcceptance: result.report, runtimePreview: result.preview, runtimeArtifact: { ...data.output_json.runtimeArtifact, status: result.blockers.length ? "acceptance_failed" : "accepted", blockers: result.blockers }, acceptancePending: result.blockers.length > 0 } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (saved.error) return Response.json({ error: "runtime_worker_result_save_failed" }, { status: 503 });
    if (!saved.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ job: result.job, artifact: { artifactVersion: job.artifactVersion, blockers: result.blockers }, preview: result.preview, charged: 0 });
  }
  if (body.action === "status") {
    const blueprint = data.output_json.runtimeBlueprint;
    const artifact = data.output_json.runtimeArtifact;
    return Response.json({ productionId: data.id, job: data.output_json.runtimeJob || null, blueprint: blueprint ? { ...blueprint, stale: blueprint.sourcePlanHash !== state.planHash } : null, artifact: artifact ? { artifactVersion: artifact.artifactVersion, blueprintHash: artifact.blueprintHash, status: artifact.status, blockers: artifact.blockers, stale: artifact.blueprintHash !== blueprint?.hash || blueprint?.sourcePlanHash !== state.planHash } : null, history: (Array.isArray(data.output_json.runtimeArtifactHistory) ? data.output_json.runtimeArtifactHistory : []).map((item: any) => ({ artifactVersion: item.artifactVersion, createdAt: item.createdAt, canRestore: !!item.blueprintSnapshot && item.sourcePlanHash === state.planHash })), preview: "not_provisioned", charged: 0 }, { headers: { "Cache-Control": "no-store" } });
  }
  if (body.action === "restore") {
    const current = data.output_json.runtimeArtifact;
    if (body.approve !== true || typeof body.artifactVersion !== "string" || body.expectedArtifactVersion !== current?.artifactVersion) return Response.json({ error: "runtime_restore_approval_or_version_required" }, { status: 409 });
    const history = Array.isArray(data.output_json.runtimeArtifactHistory) ? data.output_json.runtimeArtifactHistory : [];
    const target = history.find((item: any) => item.artifactVersion === body.artifactVersion);
    let snapshot;
    try { snapshot = checkedRuntimeSnapshot(target, state.planHash); }
    catch { return Response.json({ error: "runtime_restore_snapshot_invalid" }, { status: 422 }); }
    const revision = reviewRuntimeRevision(current?.blueprintSnapshot, snapshot);
    if (revision.blockers.length) return Response.json({ error: "runtime_data_migration_required", revision }, { status: 409 });
    const restored = { ...target, status: "acceptance_pending", blockers: [...new Set([...(target.blockers || []), "restored_source_requires_acceptance", "isolated_preview_required", "project_acceptance_required"])], restoredAt: new Date().toISOString() };
    const result = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeBlueprint: { ...snapshot, sourcePlanHash: state.planHash, review: "approved_for_development" }, runtimeArtifact: restored, runtimeArtifactHistory: [...history.filter((item: any) => item.artifactVersion !== target.artifactVersion), current].filter(Boolean).slice(-5), runtimeAcceptance: null, runtimePreview: data.output_json.runtimePreview ? { ...data.output_json.runtimePreview, status: "stale" } : null, acceptancePending: true } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (result.error) return Response.json({ error: "runtime_restore_save_failed" }, { status: 503 });
    if (!result.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ productionId: data.id, blueprint: snapshot, artifactVersion: restored.artifactVersion, blockers: restored.blockers, status: "acceptance_pending", charged: 0 }, { status: 202 });
  }
  if (body.action === "compile") {
    const stored = data.output_json?.runtimeBlueprint;
    if (!stored || stored.sourcePlanHash !== state.planHash) return Response.json({ error: "runtime_plan_changed_review_again" }, { status: 409 });
    if (body.approve !== true || body.blueprintHash !== stored.hash) return Response.json({ error: "runtime_blueprint_approval_required" }, { status: 409 });
    const revision = reviewRuntimeRevision(data.output_json.runtimeArtifact?.blueprintSnapshot, stored);
    if (revision.blockers.length) return Response.json({ error: "runtime_data_migration_required", revision }, { status: 409 });
    let artifact;
    try { artifact = compileRuntimeBlueprint(websiteEngineInput(state.brief), stored, body.blueprintHash); }
    catch { return Response.json({ error: "runtime_blueprint_validation_failed" }, { status: 422 }); }
    const history = [...(Array.isArray(data.output_json.runtimeArtifactHistory) ? data.output_json.runtimeArtifactHistory : []), ...(data.output_json.runtimeArtifact ? [data.output_json.runtimeArtifact] : [])].slice(-5);
    const result = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeBlueprint: { ...stored, review: "approved_for_development", approvedAt: new Date().toISOString() }, runtimeAcceptance: null, runtimePreview: data.output_json.runtimePreview ? { ...data.output_json.runtimePreview, status: "stale" } : null, runtimeArtifact: { ...artifact, sourcePlanHash: state.planHash, createdAt: new Date().toISOString() }, runtimeArtifactHistory: history, acceptancePending: true } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (result.error) return Response.json({ error: "runtime_artifact_save_failed" }, { status: 503 });
    if (!result.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ productionId: data.id, artifactVersion: artifact.artifactVersion, status: artifact.status, blockers: artifact.blockers, charged: 0, preview: "not_provisioned" }, { status: 202 });
  }
  if (body.action && body.action !== "propose") return Response.json({ error: "unsupported_action" }, { status: 400 });
  try {
    const blueprint = await proposeRuntimeBlueprint(state.brief, String(body.instruction || "Mevcut brief'e uygun uygulama planı hazırla."), data.output_json.runtimeBlueprint);
    const revision = reviewRuntimeRevision(data.output_json.runtimeArtifact?.blueprintSnapshot, blueprint);
    const result = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...data.output_json, runtimeAcceptance: null, runtimePreview: data.output_json.runtimePreview ? { ...data.output_json.runtimePreview, status: "stale" } : null, runtimeBlueprint: { ...blueprint, revision, review: "pending_user_approval", acceptance: "not_run", sourcePlanHash: state.planHash }, websiteAssistant: { ...state, approvedHash: null, phase: "draft" } } }).eq("id", data.id).eq("user_id", body.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
    if (result.error) return Response.json({ error: "blueprint_save_failed" }, { status: 503 });
    if (!result.data) return Response.json({ error: "project_changed_reload" }, { status: 409 });
    return Response.json({ productionId: data.id, blueprint: { ...blueprint, revision }, status: "plan_review", productionStarted: false, charged: 0 });
  } catch { return Response.json({ error: "blueprint_generation_failed", productionStarted: false, charged: 0 }, { status: 503 }); }
}
