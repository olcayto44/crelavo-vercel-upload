import { actionsPreviewOrigin } from "./actions-identity.ts";
import { randomUUID, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { runtimeDeliveryBlockers, runtimeCapabilityAccepted, RUNTIME_ACCEPTANCE_CHECKS, type RuntimeAcceptance } from "./acceptance.ts";
export type RuntimeWorkerJob = { id: string; projectId: string; userId: string; artifactVersion: string; blueprintHash: string; sourcePlanHash: string; provider?: "github-actions"; callbackOrigin?: string; status: "queued" | "running" | "passed" | "failed"; createdAt: string; expiresAt: string };
export function runtimeWorkerConfigured() {
  if (process.env.WEBSITE_RUNTIME_WORKER_PROVIDER === "github-actions") return process.env.VERCEL_ENV === "preview" && !!process.env.VERCEL_URL && !!process.env.WEBSITE_RUNTIME_GITHUB_TOKEN;
  return !!(process.env.WEBSITE_RUNTIME_WORKER_URL && process.env.WEBSITE_RUNTIME_WORKER_TOKEN && process.env.WEBSITE_RUNTIME_WORKER_REPORT_SECRET);
}
function config() {
  const endpoint = process.env.WEBSITE_RUNTIME_WORKER_URL, token = process.env.WEBSITE_RUNTIME_WORKER_TOKEN, secret = process.env.WEBSITE_RUNTIME_WORKER_REPORT_SECRET;
  if (!endpoint || !token || !secret || secret.length < 32) throw new Error("runtime_worker_not_configured");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("runtime_worker_configuration_invalid");
  return { origin: url.origin, token, secret };
}
export function createRuntimeWorkerJob(projectId: string, userId: string, output: any): RuntimeWorkerJob {
  const artifact = output.runtimeArtifact, blueprint = output.runtimeBlueprint;
  if (!artifact || !blueprint || artifact.blueprintHash !== blueprint.hash || blueprint.sourcePlanHash !== output.websiteAssistant?.planHash) throw new Error("runtime_worker_artifact_stale");
  if (!Array.isArray(artifact.files) || !artifact.files.length || artifact.files.length > 500 || artifact.files.some((f: any) => !f || typeof f.path !== "string" || typeof f.content !== "string" || !/^runtime\/[a-zA-Z0-9._/-]+$/.test(f.path) || f.path.split("/").some((p: string) => !p || p === "." || p === ".." || p === ".env"))) throw new Error("runtime_worker_sources_invalid");
  const paths = artifact.files.map((file: any) => file.path.toLowerCase());
  if (new Set(paths).size !== paths.length || artifact.files.reduce((sum: number, file: any) => sum + Buffer.byteLength(file.content), 0) > 20000000) throw new Error("runtime_worker_sources_invalid");
  if (createHash("sha256").update(JSON.stringify(artifact.files.map((f: any) => [f.path, f.content]))).digest("hex") !== artifact.artifactVersion) throw new Error("runtime_worker_source_hash_mismatch");
  if (process.env.WEBSITE_RUNTIME_WORKER_PROVIDER === "github-actions" && Buffer.byteLength(JSON.stringify({ artifact, blueprint })) > 3000000) throw new Error("runtime_actions_sources_exceed_preview_limit");
  return { ...(process.env.WEBSITE_RUNTIME_WORKER_PROVIDER === "github-actions" ? { provider: "github-actions" as const, callbackOrigin: actionsPreviewOrigin() } : {}), id: randomUUID(), projectId, userId, artifactVersion: artifact.artifactVersion, blueprintHash: blueprint.hash, sourcePlanHash: blueprint.sourcePlanHash, status: "queued", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1800000).toISOString() };
}
export async function dispatchRuntimeWorker(job: RuntimeWorkerJob, output: any) {
  if (job.provider === "github-actions") {
    const origin = actionsPreviewOrigin();
    if (job.callbackOrigin !== origin || Date.parse(job.expiresAt) <= Date.now()) throw new Error("runtime_actions_job_stale");
    const token = process.env.WEBSITE_RUNTIME_GITHUB_TOKEN;
    if (!token) throw new Error("runtime_actions_not_configured");
    const response = await fetch("https://api.github.com/repos/olcayto44/crelavo-acceptance-worker/actions/workflows/project-acceptance.yml/dispatches", { method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" }, body: JSON.stringify({ ref: "main", inputs: { job_id: job.id, project_id: job.projectId, preview_origin: origin } }) });
    if (response.status !== 204) throw new Error("runtime_actions_dispatch_failed");
    return { ...job, status: "running" as const };
  }
  const c = config();
  const response = await fetch(c.origin + "/v1/jobs/" + encodeURIComponent(job.id), { method: "PUT", redirect: "error", signal: AbortSignal.timeout(20000), headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json", "Idempotency-Key": job.id }, body: JSON.stringify({ job, artifact: output.runtimeArtifact, blueprint: output.runtimeBlueprint, deliveryMode: "downloadable_self_hosted", customerCredentialsRequired: false, requiredChecks: RUNTIME_ACCEPTANCE_CHECKS, isolation: { dedicated: true, persistentVolume: true, egress: "deny_by_default", cpuLimit: 1, memoryMb: 512, expiresAt: job.expiresAt } }) });
  if (!response.ok) throw new Error("runtime_worker_dispatch_failed");
  const data = await response.json();
  if (data.jobId !== job.id || data.artifactVersion !== job.artifactVersion) throw new Error("runtime_worker_response_mismatch");
  return { ...job, status: "running" as const };
}
export function verifyRuntimeWorkerReport(raw: string, signature: string, job: RuntimeWorkerJob, output: any, secret: string) {
  if (raw.length > 200000 || !/^[a-f0-9]{64}$/.test(signature)) throw new Error("runtime_worker_signature_invalid");
  const expected = createHmac("sha256", secret).update(raw).digest(), actual = Buffer.from(signature, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("runtime_worker_signature_invalid");
  const data = JSON.parse(raw);
  if (data.jobId !== job.id || data.projectId !== job.projectId || data.artifactVersion !== job.artifactVersion || data.blueprintHash !== job.blueprintHash || output.runtimeArtifact?.artifactVersion !== job.artifactVersion || output.runtimeBlueprint?.hash !== job.blueprintHash || output.websiteAssistant?.planHash !== job.sourcePlanHash) throw new Error("runtime_worker_report_stale");
  if (!Number.isFinite(Date.parse(data.completedAt)) || Date.parse(data.completedAt) < Date.parse(job.createdAt) || Date.parse(data.completedAt) > Date.now() + 60000 || Date.now() > Date.parse(job.expiresAt)) throw new Error("runtime_worker_report_expired");
  const report = data.acceptance as RuntimeAcceptance;
  if (!report || !report.checks || !Array.isArray(report.capabilities) || report.artifactVersion !== job.artifactVersion) throw new Error("runtime_worker_report_invalid");
  const blockers = runtimeDeliveryBlockers(report);
  for (const capability of output.runtimeBlueprint.capabilities || []) if (!report.capabilities.some(item => item.name === capability.name && item.required === true && runtimeCapabilityAccepted(item, job.artifactVersion, capability.kind))) blockers.push("capability:" + capability.name);
  for (const blocker of output.runtimeArtifact.blockers || []) if (blocker !== "runtime_actions_run_failed" && blocker !== "runtime_actions_acceptance_report_missing" && blocker !== "isolated_preview_required" && blocker !== "project_acceptance_required" && blocker !== "restored_source_requires_acceptance" && !String(blocker).startsWith("implementation:")) blockers.push(blocker);
  if (data.status !== "passed") blockers.push("runtime_worker_tests_failed");
  if (data.isolation?.dedicated !== true || data.isolation?.persistentVolume !== true || data.isolation?.egress !== "deny_by_default") blockers.push("runtime_worker_isolation_unverified");
  return { job: { ...job, status: blockers.length ? "failed" as const : "passed" as const }, blockers: [...new Set(blockers)], report, preview: { url: report.previewUrl || "", artifactVersion: job.artifactVersion, status: blockers.length ? "unverified" : report.previewUrl ? "running" : "not_provisioned", expiresAt: job.expiresAt } };
}
export async function pollRuntimeWorker(job: RuntimeWorkerJob, output: any) {
  if (job.provider === "github-actions") {
    // A failed claim cannot post a callback. Reconcile only a scoped, terminal run.
    if (job.callbackOrigin !== actionsPreviewOrigin()) throw new Error("runtime_actions_job_stale");
    const token = process.env.WEBSITE_RUNTIME_GITHUB_TOKEN;
    if (!token) throw new Error("runtime_actions_not_configured");
    const response = await fetch("https://api.github.com/repos/olcayto44/crelavo-acceptance-worker/actions/workflows/project-acceptance.yml/runs?event=workflow_dispatch&branch=main&per_page=100", { redirect: "error", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store" });
    if (!response.ok) throw new Error("runtime_actions_run_poll_failed");
    const data = await response.json();
    if (!Array.isArray(data.workflow_runs)) throw new Error("runtime_actions_run_response_invalid");
    const runs = data.workflow_runs.filter((run: any) => run.display_title === "Acceptance " + job.id && run.path === ".github/workflows/project-acceptance.yml" && run.event === "workflow_dispatch" && run.head_branch === "main" && run.repository?.full_name === "olcayto44/crelavo-acceptance-worker" && /^\d+$/.test(String(run.id)) && Number.isFinite(Date.parse(run.created_at)) && Date.parse(run.created_at) >= Date.parse(job.createdAt) - 60000);
    if (!runs.length || runs.some((run: any) => run.status !== "completed")) return null;
    const run = runs.sort((a: any, b: any) => Date.parse(b.created_at) - Date.parse(a.created_at) || Number(b.run_attempt || 1) - Number(a.run_attempt || 1))[0];
    if (!["failure", "cancelled", "timed_out", "action_required", "startup_failure", "stale", "success", "neutral", "skipped"].includes(run.conclusion)) return null;
    // A GitHub success without the signed/version-bound callback is not acceptance.
    const blockers = [...new Set([...(output.runtimeArtifact?.blockers || []), "project_acceptance_required", run.conclusion === "success" ? "runtime_actions_acceptance_report_missing" : "runtime_actions_run_failed"])];
    return { job: { ...job, status: "failed" as const }, blockers, report: null, preview: { url: "", artifactVersion: job.artifactVersion, status: "unverified", expiresAt: job.expiresAt } };
  }
  const c = config();
  const response = await fetch(c.origin + "/v1/jobs/" + encodeURIComponent(job.id), { redirect: "error", signal: AbortSignal.timeout(15000), headers: { Authorization: "Bearer " + c.token }, cache: "no-store" });
  if (response.status === 202) return null;
  if (!response.ok) throw new Error("runtime_worker_poll_failed");
  return verifyRuntimeWorkerReport(await response.text(), response.headers.get("x-runtime-signature") || "", job, output, c.secret);
}
