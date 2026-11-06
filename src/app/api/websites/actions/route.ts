import { createHash, createHmac, randomBytes } from "node:crypto";
import { actionsPreviewOrigin, verifyActionsIdentity, verifyActionsRun } from "@/lib/website-runtime/actions-identity";
import { verifyRuntimeWorkerReport } from "@/lib/website-runtime/worker";
import { supabaseAdmin } from "@/lib/supabase";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const respond = (status: number, value: unknown) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
  let origin;
  try { origin = actionsPreviewOrigin(); } catch { return respond(403, { error: "runtime_actions_preview_only" }); }
  const url = new URL(request.url), jobId = url.searchParams.get("job"), projectId = url.searchParams.get("project"), operation = url.searchParams.get("operation");
  if (!jobId || !projectId || !/^[a-f0-9-]{36}$/.test(jobId) || !/^[a-f0-9-]{36}$/.test(projectId) || !["claim", "result"].includes(operation || "")) return respond(400, { error: "actions_request_invalid" });
  const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
  if (!token) return respond(401, { error: "actions_identity_required" });
  let identity;
  try { identity = await verifyActionsIdentity(token, origin + "/api/websites/actions/" + jobId); await verifyActionsRun(identity.runId, jobId); }
  catch { return respond(401, { error: "actions_identity_rejected" }); }
  const db = supabaseAdmin();
  const { data, error } = await db.from("production_requests").select("id,user_id,output_json,updated_at").eq("id", projectId).eq("production_type", "website").maybeSingle();
  if (error) return respond(503, { error: "actions_project_read_failed" });
  const output = data?.output_json, job = output?.runtimeJob;
  if (!data || !job || job.id !== jobId || job.userId !== data.user_id || job.projectId !== projectId || job.provider !== "github-actions" || job.callbackOrigin !== origin || output.runtimeArtifact?.artifactVersion !== job.artifactVersion || output.runtimeBlueprint?.hash !== job.blueprintHash || output.websiteAssistant?.planHash !== job.sourcePlanHash || !Number.isFinite(Date.parse(job.expiresAt)) || Date.parse(job.expiresAt) <= Date.now()) return respond(409, { error: "actions_job_stale" });
  const claim = output.runtimeActionsClaim;
  const same = claim?.runId === identity.runId && claim?.attempt === identity.attempt;
  if (operation === "claim") {
    if (!["queued", "running"].includes(job.status) || (claim && !same)) return respond(409, { error: "actions_job_already_claimed" });
    if (!claim) {
      const saved = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...output, runtimeJob: { ...job, status: "running" }, runtimeActionsClaim: { ...identity, claimedAt: new Date().toISOString() } } }).eq("id", data.id).eq("user_id", data.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
      if (saved.error || !saved.data) return respond(409, { error: "actions_claim_conflict_retry" });
    }
    // Only generated runtime sources are disclosed; never the full production record.
    return respond(200, { job, artifact: { files: output.runtimeArtifact.files, artifactVersion: job.artifactVersion, blueprintHash: job.blueprintHash }, blueprint: output.runtimeBlueprint });
  }
  if (!same) return respond(409, { error: "actions_result_not_claimed" });
  const chunks: Uint8Array[] = []; let bytes = 0;
  if (request.body) { const reader = request.body.getReader(); while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 200000) { await reader.cancel(); return respond(413, { error: "actions_result_too_large" }); } chunks.push(value); } }
  const raw = Buffer.concat(chunks).toString("utf8"), hash = createHash("sha256").update(raw).digest("hex");
  if (["passed", "failed"].includes(job.status)) return output.runtimeActionsReceipt?.hash === hash ? respond(200, { status: job.status }) : respond(409, { error: "actions_result_immutable" });
  let result;
  try { const key = randomBytes(32).toString("hex"); result = verifyRuntimeWorkerReport(raw, createHmac("sha256", key).update(raw).digest("hex"), job, output, key); }
  catch { return respond(422, { error: "actions_result_invalid" }); }
  const saved = await db.from("production_requests").update({ updated_at: new Date().toISOString(), output_json: { ...output, runtimeJob: result.job, runtimeAutomation: { status: result.job.status }, runtimeAcceptance: result.report, runtimePreview: result.preview, runtimeArtifact: { ...output.runtimeArtifact, status: result.blockers.length ? "acceptance_failed" : "accepted", blockers: result.blockers }, runtimeActionsReceipt: { hash, ...identity }, acceptancePending: result.blockers.length > 0 } }).eq("id", data.id).eq("user_id", data.user_id).eq("updated_at", data.updated_at).select("id").maybeSingle();
  if (saved.error || !saved.data) return respond(409, { error: "actions_result_conflict_retry" });
  return respond(200, { status: result.job.status });
}
