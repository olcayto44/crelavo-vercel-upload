export const RUNTIME_ACCEPTANCE_CHECKS = ["syntax_build", "admin_login", "unauthorized_access", "csrf", "persistent_crud", "public_reflection", "upload", "mobile_browser", "clean_install", "public_routes", "admin_routes", "internal_links", "business_workflows"] as const;
export type AcceptanceCheck = typeof RUNTIME_ACCEPTANCE_CHECKS[number];
export type RuntimeCapabilityAcceptance = { name: string; required: boolean; status: "implemented" | "configuration_pending" | "not_implemented"; adapterImplemented?: boolean; adapterTest?: { status: "passed" | "failed" | "not_run"; artifactVersion: string }; setupGuidePath?: string; settingsPath?: string };
export type RuntimeAcceptance = { artifactVersion: string; previewUrl?: string; checks: Partial<Record<AcceptanceCheck, { status: "passed" | "failed" | "not_run"; artifactVersion: string }>>; capabilities: RuntimeCapabilityAcceptance[] };
export function runtimeCapabilityAccepted(capability: RuntimeCapabilityAcceptance, version: string, kind?: string): boolean {
  if (capability.status === "implemented") return true;
  // Customer-owned accounts may remain unconfigured; missing code may not.
  return kind === "external_integration" && capability.status === "configuration_pending" && capability.adapterImplemented === true && capability.adapterTest?.status === "passed" && capability.adapterTest.artifactVersion === version && capability.settingsPath === "/admin#integrations" && typeof capability.setupGuidePath === "string" && /^runtime\/[a-zA-Z0-9._/-]+\.md$/.test(capability.setupGuidePath) && !capability.setupGuidePath.split("/").includes("..");
}
export function runtimeDeliveryBlockers(report: RuntimeAcceptance): string[] {
  const blockers: string[] = [];
  if (!report.artifactVersion || !/^[a-zA-Z0-9._-]{1,120}$/.test(report.artifactVersion)) blockers.push("artifact_version_missing");
  for (const name of RUNTIME_ACCEPTANCE_CHECKS) { const check = report.checks?.[name]; if (!check || check.status !== "passed" || check.artifactVersion !== report.artifactVersion) blockers.push("acceptance:" + name); }
  for (const capability of report.capabilities || []) if (capability.required && capability.status === "not_implemented") blockers.push("capability:" + capability.name + ":not_implemented");
  return blockers;
}
