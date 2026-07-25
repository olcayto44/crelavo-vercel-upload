export type ProductionWorkflowStage =
  | "queued"
  | "waiting_provider_config"
  | "provider_ready"
  | "in_production"
  | "qa_review"
  | "ready"
  | "failed"
  | "cancelled";

export type ProductionWorkflowAction = {
  key: string;
  label: string;
  status: "pending" | "available" | "blocked" | "done";
  reason?: string;
};

type ProductionLike = {
  id?: string;
  status?: string | null;
  automation_status?: string | null;
  generation_status?: string | null;
  approval_status?: string | null;
  reserved_credits?: number | null;
  estimated_credits?: number | null;
  preview_url?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  output_json?: unknown;
  request_metadata?: unknown;
};

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function providerReadinessFrom(production: ProductionLike) {
  const output = objectValue(production.output_json);
  const metadata = objectValue(production.request_metadata);
  return objectValue(output.providerReadiness ?? metadata.providerReadiness ?? metadata.agentProviderRoutePlan);
}

function hasDelivery(production: ProductionLike) {
  return Boolean(text(production.delivery_link) || text(production.delivery_zip_url) || text(production.preview_url));
}

export function productionWorkflowStage(production: ProductionLike): ProductionWorkflowStage {
  const status = text(production.status).toLowerCase();
  const automationStatus = text(production.automation_status).toLowerCase();
  const generationStatus = text(production.generation_status).toLowerCase();
  const approvalStatus = text(production.approval_status).toLowerCase();

  if (status === "cancelled" || automationStatus === "cancelled") return "cancelled";
  if (status === "failed" || automationStatus === "failed" || generationStatus.includes("failed")) return "failed";
  if (status === "ready" || automationStatus === "completed" || hasDelivery(production)) return "ready";
  if (approvalStatus === "waiting") return "qa_review";
  if (automationStatus === "running" || status === "in_production") return "in_production";
  if (automationStatus === "waiting_provider_config" || generationStatus === "waiting_provider_config") return "waiting_provider_config";

  const readiness = providerReadinessFrom(production);
  if (readiness.canStartRealProvider === true || readiness.readinessStatus === "ready" || readiness.status === "ready") return "provider_ready";
  return "queued";
}

export function buildProductionWorkflowState(production: ProductionLike) {
  const stage = productionWorkflowStage(production);
  const output = objectValue(production.output_json);
  const readiness = providerReadinessFrom(production);
  const reservedCredits = Number(production.reserved_credits ?? 0) || 0;
  const estimatedCredits = Number(production.estimated_credits ?? 0) || 0;
  const hasReservedCredits = reservedCredits > 0 && (estimatedCredits <= 0 || reservedCredits >= estimatedCredits);
  const activeProviderJob = Boolean(objectValue(output.visualJob).id || objectValue(output.renderJob).id);
  const deliveryReady = hasDelivery(production) || output.deliveryReady === true;

  const actions: ProductionWorkflowAction[] = [
    {
      key: "start_automation",
      label: "Start provider automation",
      status: stage === "queued" || stage === "provider_ready" ? hasReservedCredits ? "available" : "blocked" : activeProviderJob || ["in_production", "ready"].includes(stage) ? "done" : "pending",
      reason: hasReservedCredits ? undefined : "Credits must be reserved before provider jobs start."
    },
    {
      key: "poll_provider_status",
      label: "Poll provider/render status",
      status: activeProviderJob || stage === "in_production" ? "available" : stage === "ready" ? "done" : "pending"
    },
    {
      key: "admin_qa",
      label: "Admin QA / approval",
      status: stage === "qa_review" ? "available" : stage === "ready" ? "done" : stage === "failed" ? "blocked" : "pending"
    },
    {
      key: "final_delivery",
      label: "Release dashboard delivery",
      status: deliveryReady ? "done" : stage === "ready" ? "available" : "pending"
    },
    {
      key: "revision_flow",
      label: "Handle revision request",
      status: ["ready", "qa_review"].includes(stage) ? "available" : ["failed", "cancelled"].includes(stage) ? "blocked" : "pending"
    }
  ];

  return {
    stage,
    reservedCredits,
    estimatedCredits,
    hasReservedCredits,
    providerReadiness: readiness,
    activeProviderJob,
    deliveryReady,
    actions,
    updatedAt: new Date().toISOString()
  };
}

export function mergeWorkflowState<T extends Record<string, unknown>>(output: T, production: ProductionLike) {
  return {
    ...output,
    workflowState: buildProductionWorkflowState({ ...production, output_json: output })
  };
}
