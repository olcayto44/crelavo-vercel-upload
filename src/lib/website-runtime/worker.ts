import { randomUUID, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { runtimeDeliveryBlockers, type RuntimeAcceptance } from "./acceptance.ts";
export type RuntimeWorkerJob = { id: string; projectId: string; userId: string; artifactVersion: string; blueprintHash: string; sourcePlanHash: string; status: "queued" | "running" | "passed" | "failed"; createdAt: string; expiresAt: string };
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
  return { id: randomUUID(), projectId, userId, artifactVersion: artifact.artifactVersion, blueprintHash: blueprint.hash, sourcePlanHash: blueprint.sourcePlanHash, status: "queued", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1800000).toISOString() };
}
export async function dispatchRuntimeWorker(job: RuntimeWorkerJob, output: any) {
  const c = config();
  const response = await fetch(c.origin + "/v1/jobs/" + encodeURIComponent(job.id), { method: "PUT", redirect: "error", signal: AbortSignal.timeout(20000), headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json", "Idempotency-Key": job.id }, body: JSON.stringify({ job, artifact: output.runtimeArtifact, blueprint: output.runtimeBlueprint, requiredChecks: ["syntax_build", "admin_login", "unauthorized_access", "csrf", "persistent_crud", "public_reflection", "upload", "mobile_browser", "clean_install"], isolation: { dedicated: true, persistentVolume: true, egress: "deny_by_default", cpuLimit: 1, memoryMb: 512, expiresAt: job.expiresAt } }) });
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
  for (const capability of output.runtimeBlueprint.capabilities || []) if (!report.capabilities.some(item => item.name === capability.name && item.required === true && item.status === "implemented")) blockers.push("capability:" + capability.name);
  for (const blocker of output.runtimeArtifact.blockers || []) if (blocker !== "isolated_preview_required" && blocker !== "project_acceptance_required" && !String(blocker).startsWith("implementation:")) blockers.push(blocker);
  if (data.status !== "passed") blockers.push("runtime_worker_tests_failed");
  if (data.isolation?.dedicated !== true || data.isolation?.persistentVolume !== true || data.isolation?.egress !== "deny_by_default") blockers.push("runtime_worker_isolation_unverified");
  return { job: { ...job, status: blockers.length ? "failed" as const : "passed" as const }, blockers: [...new Set(blockers)], report, preview: { url: report.previewUrl, artifactVersion: job.artifactVersion, status: blockers.length ? "unverified" : "running", expiresAt: job.expiresAt } };
}
export async function pollRuntimeWorker(job: RuntimeWorkerJob, output: any) {
  const c = config();
  const response = await fetch(c.origin + "/v1/jobs/" + encodeURIComponent(job.id), { redirect: "error", signal: AbortSignal.timeout(15000), headers: { Authorization: "Bearer " + c.token }, cache: "no-store" });
  if (response.status === 202) return null;
  if (!response.ok) throw new Error("runtime_worker_poll_failed");
  return verifyRuntimeWorkerReport(await response.text(), response.headers.get("x-runtime-signature") || "", job, output, c.secret);
}
