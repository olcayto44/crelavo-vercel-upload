import { createHash } from "node:crypto";
import type { WebsiteEngineInput } from "../website-engine";
import { validateRuntimeBlueprint, validateBlueprintPageCoverage, validateBlueprintLinks } from "./blueprint.ts";
import { generateCustomerRuntime } from "./package.ts";
export function compileRuntimeBlueprint(input: WebsiteEngineInput, proposed: unknown, approvedHash: string) {
  const blueprint = validateBlueprintLinks(validateBlueprintPageCoverage(input, validateRuntimeBlueprint(proposed)));
  if (!approvedHash || approvedHash !== blueprint.hash) throw new Error("runtime_blueprint_approval_required");
  const files = generateCustomerRuntime({ ...input, runtimeSchema: blueprint.schema });
  const seedFile = files.find(file => file.path === "runtime/seed.json");
  if (!seedFile) throw new Error("runtime_seed_missing");
  const seed = JSON.parse(seedFile.content);
  if (blueprint.theme) { const settings = seed.documents.find((document: { collection: string }) => document.collection === "settings"); if (settings) Object.assign(settings.payload, blueprint.theme); }
  seed.documents = seed.documents.filter((document: { collection: string }) => document.collection !== "pages");
  const ordered = [...blueprint.pages].sort((a, b) => Number(b.slug === "home") - Number(a.slug === "home"));
  for (const [index, page] of ordered.entries()) {
    seed.documents.push({ id: "page-" + page.slug, collection: "pages", payload: { title: page.title, slug: page.slug, published: true, menuOrder: index, showInMenu: true, seoDescription: page.purpose.slice(0, 170), blocks: page.blocks || [{ type: "text", title: page.title, text: page.purpose }, ...page.collections.map(key => ({ type: "collection", title: key, collection: key }))] } });
  }
  seed.workflows = blueprint.workflows || [];
  seed.blueprintHash = blueprint.hash;
  seed.integrations = blueprint.capabilities.filter(capability => capability.kind !== "crud").map(capability => ({ name: capability.name, kind: capability.kind, status: "not_implemented" }));
  seedFile.content = JSON.stringify(seed, null, 2);
  const acceptance = files.find(file => file.path === "runtime/acceptance.json")!;
  acceptance.content = JSON.stringify({ status: "not_run", blueprintHash: blueprint.hash, integrations: seed.integrations }, null, 2);
  const artifactVersion = createHash("sha256").update(JSON.stringify(files.map(file => [file.path, file.content]))).digest("hex");
  const designBlockers = blueprint.pages.filter(page => !page.blocks?.length).map(page => "design_content:" + page.slug);
  if (!blueprint.theme) designBlockers.push("design_theme_required");
  const blockers = blueprint.capabilities.filter(capability => capability.kind !== "crud").map(capability => "implementation:" + capability.name);
  return { files, blueprintSnapshot: blueprint, blueprintHash: blueprint.hash, artifactVersion, status: "acceptance_pending" as const, blockers: [...designBlockers, ...blockers, "project_acceptance_required"] };
}
