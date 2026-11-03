export const RUNTIME_ACCEPTANCE_CHECKS = ["syntax_build", "admin_login", "unauthorized_access", "csrf", "persistent_crud", "public_reflection", "upload", "mobile_browser", "clean_install"] as const;
export type AcceptanceCheck = typeof RUNTIME_ACCEPTANCE_CHECKS[number];
export type RuntimeAcceptance = { artifactVersion: string; previewUrl: string; checks: Partial<Record<AcceptanceCheck, { status: "passed" | "failed" | "not_run"; artifactVersion: string }>>; capabilities: Array<{ name: string; required: boolean; status: "implemented" | "configuration_pending" | "not_implemented" }> };
export function runtimeDeliveryBlockers(report: RuntimeAcceptance): string[] {
  const blockers: string[] = [];
  if (!report.artifactVersion || !/^[a-zA-Z0-9._-]{1,120}$/.test(report.artifactVersion)) blockers.push("artifact_version_missing");
  try { const url = new URL(report.previewUrl); if (url.protocol !== "https:" || url.username || url.password) blockers.push("secure_preview_required"); } catch { blockers.push("secure_preview_required"); }
  for (const name of RUNTIME_ACCEPTANCE_CHECKS) { const check = report.checks[name]; if (!check || check.status !== "passed" || check.artifactVersion !== report.artifactVersion) blockers.push("acceptance:" + name); }
  for (const capability of report.capabilities) if (capability.required && capability.status !== "implemented") blockers.push("capability:" + capability.name + ":" + capability.status);
  return blockers;
}
