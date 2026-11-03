import { createHash } from "node:crypto";
import { validateRuntimeBlueprint, type RuntimeBlueprint } from "./blueprint.ts";
export type RuntimeRevisionReview = { status: "initial" | "safe_additive" | "migration_required"; blockers: string[]; additions: string[] };
export function reviewRuntimeRevision(previous: unknown, proposed: unknown): RuntimeRevisionReview {
  const next = validateRuntimeBlueprint(proposed);
  if (!previous) return { status: "initial", blockers: [], additions: [] };
  const old = validateRuntimeBlueprint(previous), blockers: string[] = [], additions: string[] = [];
  for (const collection of old.schema.collections) {
    const target = next.schema.collections.find(item => item.key === collection.key);
    if (!target) { blockers.push("collection_removal:" + collection.key); continue; }
    if (collection.private && !target.private) blockers.push("private_data_exposure:" + collection.key);
    for (const field of collection.fields) if (!target.fields.includes(field)) blockers.push("field_removal:" + collection.key + "." + field);
    for (const field of target.fields) if (!collection.fields.includes(field)) additions.push("field:" + collection.key + "." + field);
  }
  for (const collection of next.schema.collections) if (!old.schema.collections.some(item => item.key === collection.key)) additions.push("collection:" + collection.key);
  for (const page of old.pages) if (!next.pages.some(item => item.slug === page.slug)) blockers.push("page_removal_or_url_change:" + page.slug);
  for (const workflow of old.workflows || []) {
    const target = next.workflows?.find(item => item.id === workflow.id);
    if (!target || JSON.stringify(target) !== JSON.stringify(workflow)) blockers.push("workflow_migration:" + workflow.id);
  }
  return { status: blockers.length ? "migration_required" : "safe_additive", blockers, additions };
}
export function checkedRuntimeSnapshot(artifact: any, expectedPlanHash: string): RuntimeBlueprint {
  if (!artifact || artifact.sourcePlanHash !== expectedPlanHash || !Array.isArray(artifact.files) || !artifact.files.length || artifact.files.some((file: any) => !file || typeof file.path !== "string" || typeof file.content !== "string")) throw new Error("runtime_snapshot_invalid");
  const hash = createHash("sha256").update(JSON.stringify(artifact.files.map((file: any) => [file.path, file.content]))).digest("hex");
  const blueprint = validateRuntimeBlueprint(artifact.blueprintSnapshot);
  if (hash !== artifact.artifactVersion || artifact.blueprintHash !== blueprint.hash) throw new Error("runtime_snapshot_hash_mismatch");
  return blueprint;
}
