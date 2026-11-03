import { createHash } from "node:crypto";
import { runtimeDeliveryBlockers, type RuntimeAcceptance } from "./acceptance.ts";
export function runtimeArtifactDelivery(output: Record<string, any>) {
  const artifact = output.runtimeArtifact, blueprint = output.runtimeBlueprint;
  const blockers: string[] = [];
  if (!artifact || !blueprint) return { blockers: ["runtime_artifact_required"], files: [] };
  if (blueprint.sourcePlanHash !== output.websiteAssistant?.planHash || artifact.blueprintHash !== blueprint.hash) blockers.push("runtime_plan_stale");
  const files = Array.isArray(artifact.files) ? artifact.files : [];
  const paths = new Set<string>();
  if (!files.length || files.length > 500) blockers.push("runtime_sources_invalid");
  let total = 0;
  for (const file of files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string" || !/^runtime\/[a-zA-Z0-9._/-]+$/.test(file.path) || file.path.split("/").some((part: string) => !part || part === "." || part === ".." || part === ".env") || paths.has(file.path.toLowerCase())) { blockers.push("runtime_source_path_invalid"); continue; }
    paths.add(file.path.toLowerCase()); total += Buffer.byteLength(file.content);
  }
  if (total > 20000000) blockers.push("runtime_sources_too_large");
  const validFiles = files.every((file: any) => file && typeof file.path === "string" && typeof file.content === "string");
  const hash = validFiles ? createHash("sha256").update(JSON.stringify(files.map((file: any) => [file.path, file.content]))).digest("hex") : "";
  if (hash !== artifact.artifactVersion) blockers.push("runtime_source_hash_mismatch");
  if (artifact.status !== "accepted") blockers.push("runtime_acceptance_pending");
  const report = output.runtimeAcceptance as RuntimeAcceptance | undefined;
  if (!report || report.artifactVersion !== artifact.artifactVersion) blockers.push("runtime_acceptance_version_mismatch");
  else {
    const required = Array.isArray(blueprint.capabilities) ? blueprint.capabilities : [];
    if (!report.checks || !Array.isArray(report.capabilities)) blockers.push("runtime_acceptance_invalid");
    else {
      blockers.push(...runtimeDeliveryBlockers(report));
      for (const capability of required) if (!report.capabilities.some(item => item.name === capability.name && item.required === true && item.status === "implemented")) blockers.push("runtime_capability_unverified:" + capability.name);
    }
    if (output.runtimePreview?.artifactVersion !== artifact.artifactVersion || output.runtimePreview?.url !== report.previewUrl || output.runtimePreview?.status !== "running") blockers.push("runtime_preview_unverified");
  }
  if (Array.isArray(artifact.blockers) && artifact.blockers.length) blockers.push(...artifact.blockers);
  return { blockers: [...new Set(blockers)], files: blockers.length ? [] : files, previewUrl: report?.previewUrl || "" };
}
