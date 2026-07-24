import { deliveryPackageForProduction } from "./delivery-package.ts";
import { qualityProfileForProduction, type ProductionQualityProfile } from "./production-quality.ts";

export type ProductionQaInput = {
  id: string;
  title?: string | null;
  production_type?: string | null;
  package_id?: string | null;
  status?: string | null;
  generation_status?: string | null;
  automation_status?: string | null;
  estimated_credits?: number | null;
  reserved_credits?: number | null;
  preview_url?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  admin_notes?: string | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
  output_json?: Record<string, any> | null;
  materials_json?: Array<Record<string, any>> | null;
  legal_acceptance_snapshot?: Record<string, any> | null;
  created_at?: string | null;
};

export type ProductionQaIssue = {
  code: string;
  severity: "critical" | "warning" | "info";
  message: string;
  fix: string;
};

export type ProductionQaResult = {
  id: string;
  title: string;
  productionType: string;
  packageId: string;
  status: string;
  score: number;
  grade: "pass" | "watch" | "fail";
  issues: ProductionQaIssue[];
  qualityProfile: ProductionQualityProfile;
  deliveryStandard: string;
  agentAction: string;
  providerCategory: string;
  providerReadiness: string;
  providerBlockingKeys: string[];
  createdAt: string | null;
};

function objectValue(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function arrayValue(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function addIssue(issues: ProductionQaIssue[], condition: boolean, issue: ProductionQaIssue) {
  if (condition) issues.push(issue);
}

function gradeFrom(score: number, criticalCount: number): ProductionQaResult["grade"] {
  if (criticalCount > 0 || score < 70) return "fail";
  if (score < 90) return "watch";
  return "pass";
}

export function qaProduction(record: ProductionQaInput): ProductionQaResult {
  const metadata = objectValue(record.request_metadata) ?? {};
  const input = objectValue(record.input_json) ?? {};
  const output = objectValue(record.output_json) ?? {};
  const productionType = String(record.production_type ?? metadata.productionType ?? input.production_type ?? "video");
  const packageId = String(record.package_id ?? metadata.packageId ?? input.package_id ?? "");
  const status = String(record.status ?? "unknown");
  const qualityProfile = objectValue(metadata.productionQuality) as ProductionQualityProfile | null ?? objectValue(input.productionQuality) as ProductionQualityProfile | null ?? qualityProfileForProduction(productionType, packageId);
  const deliveryPackage = objectValue(metadata.deliveryPackage) ?? objectValue(input.deliveryPackage) ?? deliveryPackageForProduction({ productionType, packageId });
  const deliveryRequirements = objectValue(metadata.deliveryRequirements) ?? objectValue(input.deliveryRequirements) ?? null;
  const outputPlan = objectValue(metadata.outputPlan) ?? objectValue(input.outputPlan) ?? null;
  const agentAction = objectValue(metadata.agentAction) ?? objectValue(output.agentAction) ?? null;
  const agentProviderRoutePlan = objectValue(metadata.agentProviderRoutePlan) ?? objectValue(output.agentProviderRoutePlan) ?? null;
  const projectWorkflow = objectValue(metadata.projectWorkflow) ?? objectValue(input.projectWorkflow) ?? null;
  const deliveryTargets = objectValue(metadata.deliveryTargets) ?? objectValue(input.deliveryTargets) ?? null;
  const legalAccepted = Boolean(record.legal_acceptance_snapshot?.accepted);
  const issues: ProductionQaIssue[] = [];

  addIssue(issues, !qualityProfile || !Array.isArray(qualityProfile.checklist) || qualityProfile.checklist.length < 5, {
    code: "quality_profile_missing",
    severity: "critical",
    message: "Production quality profile/checklist is missing or incomplete.",
    fix: "Rebuild the production payload with category-specific productionQuality metadata."
  });
  addIssue(issues, !Array.isArray(qualityProfile.acceptanceCriteria) || qualityProfile.acceptanceCriteria.length < 3, {
    code: "acceptance_criteria_missing",
    severity: "warning",
    message: "Acceptance criteria are missing or incomplete.",
    fix: "Attach acceptanceCriteria from production-quality profile."
  });
  addIssue(issues, !deliveryPackage || !Array.isArray(deliveryPackage.requiredItems) || deliveryPackage.requiredItems.length < 2, {
    code: "delivery_package_missing",
    severity: "critical",
    message: "Delivery package standard is missing.",
    fix: "Attach deliveryPackage metadata before production is marked ready."
  });
  addIssue(issues, !deliveryRequirements || !Array.isArray(deliveryRequirements.formats), {
    code: "delivery_requirements_missing",
    severity: "warning",
    message: "Requested delivery formats were not captured.",
    fix: "Capture deliveryRequirements from the assistant wizard/payload."
  });
  addIssue(issues, !outputPlan || typeof outputPlan.totalReservedCredits !== "number", {
    code: "output_plan_missing",
    severity: "warning",
    message: "Output/cost plan is missing.",
    fix: "Attach outputPlan with output count, reserved credits and cost notes."
  });
  addIssue(issues, !agentAction || !hasText(agentAction.name), {
    code: "agent_action_missing",
    severity: "warning",
    message: "Production is missing assistant agent action metadata.",
    fix: "Attach agentAction from Assistant Workspace/orchestrator to request_metadata and output_json."
  });
  addIssue(issues, !agentProviderRoutePlan || !hasText(agentProviderRoutePlan.readinessStatus), {
    code: "agent_provider_route_missing",
    severity: "warning",
    message: "Production is missing agent provider route/readiness metadata.",
    fix: "Attach agentProviderRoutePlan when /api/productions creates the record."
  });
  addIssue(issues, !legalAccepted, {
    code: "legal_acceptance_missing",
    severity: "critical",
    message: "Legal acceptance snapshot is missing.",
    fix: "Do not start production without legal acceptance snapshot."
  });
  addIssue(issues, status === "ready" && !hasText(record.preview_url) && !hasText(record.delivery_link) && !hasText(record.delivery_zip_url), {
    code: "ready_without_delivery",
    severity: "critical",
    message: "Production is marked ready without preview or delivery link.",
    fix: "Attach preview/delivery link or move status back to in_production."
  });
  addIssue(issues, ["website", "saas", "mobile_app", "admin_project"].includes(productionType) && (!projectWorkflow || !hasText(projectWorkflow.technicalStack)), {
    code: "project_stack_missing",
    severity: "warning",
    message: "Project/source delivery production is missing technical stack notes.",
    fix: "Attach projectWorkflow.technicalStack and sourceDelivery notes."
  });
  addIssue(issues, productionType === "campaign" && (!deliveryTargets || !arrayValue(deliveryTargets.publishTargets).length), {
    code: "campaign_targets_missing",
    severity: "warning",
    message: "Campaign production has no publish targets.",
    fix: "Attach deliveryTargets.publishTargets for campaign/social delivery."
  });
  addIssue(issues, status === "failed" && !objectValue(output.creditResolution), {
    code: "failed_without_credit_resolution",
    severity: "warning",
    message: "Failed production has no credit resolution metadata.",
    fix: "Add creditResolution before refund/retry decision."
  });

  const providerBlockingKeys = arrayValue(agentProviderRoutePlan?.blockingKeys).map((key) => String(key));
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === "critical" ? 28 : issue.severity === "warning" ? 12 : 4), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;

  return {
    id: record.id,
    title: String(record.title ?? record.id ?? "Untitled production"),
    productionType,
    packageId,
    status,
    score,
    grade: gradeFrom(score, criticalCount),
    issues,
    qualityProfile,
    deliveryStandard: String(deliveryPackage.standard ?? "media_final"),
    agentAction: String(agentAction?.name ?? "missing"),
    providerCategory: String(agentProviderRoutePlan?.providerCategory ?? "unknown"),
    providerReadiness: String(agentProviderRoutePlan?.readinessStatus ?? "missing"),
    providerBlockingKeys,
    createdAt: record.created_at ?? null
  };
}

export function summarizeProductionQa(results: ProductionQaResult[]) {
  const total = results.length;
  const pass = results.filter((item) => item.grade === "pass").length;
  const watch = results.filter((item) => item.grade === "watch").length;
  const fail = results.filter((item) => item.grade === "fail").length;
  const averageScore = total ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / total) : 100;
  const issueCounts = new Map<string, number>();
  for (const result of results) {
    for (const issue of result.issues) issueCounts.set(issue.code, (issueCounts.get(issue.code) ?? 0) + 1);
  }
  const topIssues = Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, count]) => ({ code, count }));
  return {
    total,
    pass,
    watch,
    fail,
    averageScore,
    status: fail > 0 ? "fail" : watch > 0 ? "watch" : "pass",
    topIssues
  };
}
