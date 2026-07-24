"use client";

import { useEffect, useState } from "react";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type AutomationStep = {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
};

type LegalSnapshot = Record<string, unknown> & {
  version?: string;
  accepted?: boolean;
  acceptedAt?: string;
};

type ProviderJobView = {
  label: string;
  provider: string;
  status: string;
  id: string;
  kind: "active" | "ready" | "failed" | "unknown";
};

type ProviderCostLine = {
  label: string;
  provider: string;
  estimatedCostUsd: number;
  basis: string;
};

type ProductionProfitEstimate = {
  estimatedRevenueUsd?: number;
  estimatedProviderCostUsd?: number;
  estimatedGrossProfitUsd?: number;
  estimatedMarginPercent?: number;
  providerCostLines?: ProviderCostLine[];
};

type ManualDeliveryDraft = {
  status: string;
  generation_status: string;
  automation_status: string;
  provider_status: string;
  provider_progress: string;
  preview_url: string;
  delivery_link: string;
  delivery_zip_url: string;
  source_files_url: string;
  readme_url: string;
  admin_notes: string;
};

type ProductionRow = {
  id: string;
  user_id: string;
  production_type: string;
  package_id?: string | null;
  title: string;
  prompt: string;
  status: string;
  generation_status?: string | null;
  automation_status?: string | null;
  automation_job_id?: string | null;
  automation_steps?: AutomationStep[] | null;
  delivery_link?: string | null;
  estimated_credits: number;
  reserved_credits?: number | null;
  input_json?: Record<string, unknown> | null;
  request_metadata?: Record<string, unknown> | null;
  output_json?: Record<string, unknown> | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  preview_url?: string | null;
  readme_url?: string | null;
  admin_notes?: string | null;
  legal_acceptance_id?: string | null;
  legal_acceptance_snapshot?: LegalSnapshot | null;
  created_at?: string | null;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    queued: "Automation queued",
    in_production: "Automation running",
    ready: "Ready",
    waiting_provider_config: "Waiting provider config",
    failed: "Failed",
    cancelled: "Cancelled"
  };
  return map[status] ?? status;
}

function automationHealth(row: ProductionRow) {
  if (row.generation_status === "waiting_provider_config" || row.automation_status === "waiting_provider_config") return "Provider config needed";
  if (row.status === "failed" || row.generation_status === "automation_failed") return "Needs review";
  if (row.status === "ready") return "Delivered";
  if (row.status === "queued") return "Queued";
  return "Running";
}

function providerKind(status: string): ProviderJobView["kind"] {
  const normalized = status.toLowerCase();
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(normalized)) return "ready";
  if (["failed", "failure", "error", "provider_failed"].includes(normalized)) return "failed";
  if (["queued", "running", "processing", "starting", "provider_queued", "provider_running", "provider_unknown", "revision_queued", "provider_job_created"].includes(normalized)) return "active";
  return "unknown";
}

function providerJobView(label: string, value: unknown): ProviderJobView | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const provider = String(record.provider ?? "").trim();
  const status = String(record.status ?? record.providerStatus ?? "unknown");
  if (!provider && status === "unknown") return null;
  return {
    label,
    provider: provider || "provider",
    status,
    id: String(record.id ?? record.jobId ?? "id pending"),
    kind: providerKind(status)
  };
}

function completionEmailLabel(row: ProductionRow) {
  const result = row.output_json?.completionEmailResult;
  if (!result || typeof result !== "object") return "Not attempted yet";
  const record = result as Record<string, unknown>;
  if (record.sent) return "Sent";
  if (record.skipped) return `Skipped: ${String(record.reason ?? "not configured")}`;
  return "Unknown";
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function deliveryRequirementsFor(row: ProductionRow) {
  const metadata = row.request_metadata ?? {};
  const input = row.input_json ?? {};
  return objectValue(metadata.deliveryRequirements) ?? objectValue(input.deliveryRequirements);
}

function deliveryRequirementFormats(row: ProductionRow) {
  const requirements = deliveryRequirementsFor(row);
  return Array.isArray(requirements?.formats) ? requirements.formats.map(String) : [];
}

function deliveryReadyStatus(row: ProductionRow, format: string) {
  if (format === "final_zip") return row.delivery_zip_url || row.delivery_link ? "ready" : "generated_on_download";
  if (format === "source_code") return row.source_files_url ? "ready" : "generated_on_download";
  if (format === "readme") return row.readme_url ? "ready" : "generated_on_download";
  if (format === "final_mp4") return row.output_json?.finalVideoUrl || row.preview_url || row.delivery_link ? "ready" : "waiting_provider";
  return "planned";
}

function deliveryBasePath(row: ProductionRow) {
  return `/api/productions/${row.id}/delivery`;
}

function revisionRequestsFor(row: ProductionRow) {
  const output = row.output_json ?? {};
  const metadata = row.request_metadata ?? {};
  const outputRevisions = Array.isArray(output.revisionRequests) ? output.revisionRequests : [];
  const metadataRevisions = Array.isArray(metadata.revisionRequests) ? metadata.revisionRequests : [];
  const pendingActions = Array.isArray(output.pendingOutputActions) ? output.pendingOutputActions : [];
  return [...outputRevisions, ...metadataRevisions, ...pendingActions]
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>);
}

function providerJobsFor(row: ProductionRow) {
  const output = row.output_json ?? {};
  const jobs: ProviderJobView[] = [];
  const mainVisual = providerJobView("Main video", output.visualJob);
  const render = providerJobView("Final render", output.renderJob);
  if (mainVisual) jobs.push(mainVisual);
  if (render) jobs.push(render);

  const alternatives = Array.isArray(output.alternatives) ? output.alternatives : [];
  alternatives.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const job = providerJobView(`Alternatif ${index + 1}`, (item as Record<string, unknown>).visualJob);
    if (job) jobs.push(job);
  });

  const voiceJobs = Array.isArray(output.voiceJobs) ? output.voiceJobs : [];
  voiceJobs.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    jobs.push({
      label: `Voice ${index + 1}`,
      provider: String(record.provider ?? "elevenlabs"),
      status: String(record.status ?? "unknown"),
      id: String(record.id ?? "id pending"),
      kind: providerKind(String(record.status ?? "unknown"))
    });
  });

  return jobs;
}

export function AdminProductionsTable({ productionTypeFilter }: { productionTypeFilter?: string } = {}) {
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [mode, setMode] = useState("loading");
  const [message, setMessage] = useState("");
  const [refreshingId, setRefreshingId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [refundingId, setRefundingId] = useState("");
  const [manualDeliveryDrafts, setManualDeliveryDrafts] = useState<Record<string, ManualDeliveryDraft>>({});
  const [savingDeliveryId, setSavingDeliveryId] = useState("");

  useEffect(() => {
    async function loadProductions() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const email = userData.user?.email ?? "";
      const token = getStoredAdminApiToken();
      setAdminEmail(email);
      setAdminToken(token);
      if (!email) {
        setMode("login");
        return;
      }

      fetch("/api/productions", { headers: adminApiHeaders(email, token) })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.productions)) {
            setRows(data.productions);
            setMode("live");
            return;
          }
          setMessage(data.error ?? "Productions could not be loaded.");
          setMode("error");
        })
        .catch(() => {
          setMessage("Productions could not be loaded.");
          setMode("error");
        });
    }

    loadProductions();
  }, []);

function draftFor(item: ProductionRow): ManualDeliveryDraft {
  const saved = manualDeliveryDrafts[item.id];
  if (saved) return saved;
  const output = item.output_json ?? {};
  return {
    status: item.status || "in_production",
    generation_status: item.generation_status || "manual_update",
    automation_status: item.automation_status || "manual_update",
    provider_status: String(output.providerStatus ?? item.generation_status ?? "manual_update"),
    provider_progress: output.providerProgress !== undefined ? String(output.providerProgress) : "",
    preview_url: item.preview_url || String(output.previewUrl ?? output.preview_url ?? ""),
    delivery_link: item.delivery_link || String(output.deliveryUrl ?? output.delivery_url ?? ""),
    delivery_zip_url: item.delivery_zip_url || String(output.deliveryZipUrl ?? output.delivery_zip_url ?? ""),
    source_files_url: item.source_files_url || String(output.sourceFilesUrl ?? output.source_files_url ?? ""),
    readme_url: item.readme_url || String(output.readmeUrl ?? output.readme_url ?? ""),
    admin_notes: item.admin_notes || ""
  };
}

function updateDraft(id: string, updates: Partial<ManualDeliveryDraft>) {
  setManualDeliveryDrafts((current) => ({ ...current, [id]: { ...draftFor(rows.find((row) => row.id === id) as ProductionRow), ...updates } }));
}

async function saveManualDelivery(item: ProductionRow) {
  const draft = draftFor(item);
  setSavingDeliveryId(item.id);
  setMessage("");
  const response = await fetch("/api/productions", {
    method: "PATCH",
    headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(adminApiBody({ id: item.id, ...draft }, adminEmail, adminToken))
  });
  const data = await response.json().catch(() => ({}));
  setSavingDeliveryId("");
  if (!response.ok) {
    setMessage(data.error ?? "Manual delivery update could not be saved.");
    return;
  }
  if (data.production) {
    setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
    setManualDeliveryDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setMessage("Preview, delivery and provider progress were updated.");
  }
}

async function retryProviderJob(item: ProductionRow) {
  setRefreshingId(item.id);
  setMessage("");

  const response = await fetch("/api/automation/start", {
    method: "POST",
    headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(adminApiBody({ production_id: item.id }, adminEmail, adminToken))
  });

  const data = await response.json().catch(() => ({}));
  setRefreshingId("");

  if (!response.ok) {
    setMessage(data.error ?? "Provider retry could not be started.");
    return;
  }

  if (data.production) {
    setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
    setMessage(data.already_running ? "An active provider job already exists; no new job was opened." : "Provider retry started for this production.");
  }
}

async function refundReservedCredits(item: ProductionRow) {
  setRefundingId(item.id);
  setMessage("");

  const response = await fetch("/api/admin/productions/refund-reserved", {

      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ production_id: item.id })
    });

    const data = await response.json().catch(() => ({}));
    setRefundingId("");

    if (!response.ok) {
      setMessage(data.error ?? "Reserved credits could not be refunded.");
      return;
    }

    if (data.production) {
      setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
      setMessage(`${Number(data.refunded_credits ?? 0).toLocaleString()} reserved credits released.`);
    }
  }

  const visibleRows = productionTypeFilter ? rows.filter((row) => row.production_type === productionTypeFilter) : rows;

  async function refreshAutomationStatus(item: ProductionRow) {
    setRefreshingId(item.id);
    setMessage("");

    const response = await fetch("/api/automation/status", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody({ production_id: item.id }, adminEmail, adminToken))
    });

    const data = await response.json().catch(() => ({}));
    setRefreshingId("");

    if (!response.ok) {
      setMessage(data.error ?? "Automation status could not be refreshed.");
      return;
    }

    if (data.production) {
      setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
      const emailNote = data.completionEmailResult?.sent ? " Completion email sent." : data.completionEmailResult?.skipped ? ` Completion email skipped: ${data.completionEmailResult.reason ?? "not configured"}.` : "";
      setMessage(`${data.finalVideoUrl ? "Final video ready and delivered." : "Provider status refreshed."}${emailNote}`);
    }
  }

  if (mode === "loading") return <p style={{ color: "var(--muted)" }}>Loading automation operations...</p>;
  if (mode === "login") return <p style={{ color: "var(--muted)" }}>Admin login required.</p>;
  if (mode === "error") return <p className="form-message">{message}</p>;
  if (rows.length === 0) return <p style={{ color: "var(--muted)" }}>No automatic production jobs yet.</p>;

  const allProviderJobs = rows.flatMap(providerJobsFor);
  const activeProviderJobs = allProviderJobs.filter((job) => job.kind === "active").length;
  const failedProviderJobs = allProviderJobs.filter((job) => job.kind === "failed").length;
  const readyProviderJobs = allProviderJobs.filter((job) => job.kind === "ready").length;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <span className="badge">Operations monitor</span>
        <h3>Automated production flow</h3>
        <p>Admin does not create production output here. This screen monitors payments, credits, queue state, errors, provider jobs, email/support and unusual requests.</p>
        <div className="provider-monitor-grid">
          <div><span>Active provider jobs</span><strong>{activeProviderJobs}</strong></div>
          <div><span>Failed jobs</span><strong>{failedProviderJobs}</strong></div>
          <div><span>Ready provider outputs</span><strong>{readyProviderJobs}</strong></div>
          <div><span>Total tracked jobs</span><strong>{allProviderJobs.length}</strong></div>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </div>

      {visibleRows.length === 0 ? <div className="card"><span className="badge">Filter</span><h3>No productions in this category</h3><p style={{ color: "var(--muted)" }}>{productionTypeFilter ? `No production records exist for ${productionTypeFilter} yet.` : "No production records yet."}</p></div> : null}

      {visibleRows.map((item) => {
        const pipelineType = typeof item.output_json?.pipelineType === "string" ? item.output_json.pipelineType : "general_production";
        const automationSteps = item.automation_steps ?? [];
        const legalSnapshot = item.legal_acceptance_snapshot;
        const outputPlan = item.request_metadata?.outputPlan as { outputCount?: number; variationStrategy?: string; profitEstimate?: ProductionProfitEstimate } | undefined;
        const profitEstimate = outputPlan?.profitEstimate;
        const deliveryTargets = item.request_metadata?.deliveryTargets as { publishTargets?: string[]; connectedAccountTargets?: string; connectedStoreTargets?: string } | undefined;
        const deliveryPackage = item.request_metadata?.deliveryPackage as { standard?: string; requiredItems?: string[]; fileFormats?: string[]; adminChecklist?: string[]; costCredits?: number } | undefined;
        const productionQuality = item.request_metadata?.productionQuality as { label?: string; minimumStandard?: string; customerReadyDefinition?: string; checklist?: string[]; acceptanceCriteria?: string[]; adminReviewFocus?: string[] } | undefined;
        const deliveryRequirements = deliveryRequirementsFor(item);
        const requestedDeliveryFormats = deliveryRequirementFormats(item);
        const deliveryPath = deliveryBasePath(item);
        const projectWorkflow = item.request_metadata?.projectWorkflow as { modules?: string; technicalStack?: string; sourceDelivery?: string; projectDetails?: string } | undefined;
        const musicVideoMaterialGroups = item.request_metadata?.musicVideoMaterialGroups as Record<string, string[] | undefined> | undefined;
        const musicVideoGroupSummary = musicVideoMaterialGroups ? Object.entries(musicVideoMaterialGroups).filter(([, urls]) => Array.isArray(urls) && urls.length > 0).map(([key, urls]) => `${key.replaceAll("_", " ")}: ${urls?.length ?? 0}`).join(", ") : "";
        const dramaDetails = item.request_metadata?.dramaDetails as { format?: string; genreTone?: string; structure?: string; characters?: string; hookType?: string; dialogueVoice?: string } | undefined;
        const dramaDetailsSummary = dramaDetails ? [dramaDetails.format, dramaDetails.genreTone, dramaDetails.structure, dramaDetails.characters, dramaDetails.hookType].filter(Boolean).join(" · ") : "";
        const droneDetails = item.request_metadata?.droneDetails as { locationAddress?: string; routePath?: string; markedArea?: string; shotType?: string; mapStyle?: string; cameraMovement?: string; visualStyle?: string; narrationLanguage?: string; subtitleOption?: string; musicStyle?: string; materialGroups?: Record<string, string[]> } | undefined;
        const droneDetailsSummary = droneDetails ? [droneDetails.locationAddress, droneDetails.shotType, droneDetails.mapStyle, droneDetails.visualStyle].filter(Boolean).join(" · ") : "";
        const liveSalesAgentDetails = item.request_metadata?.liveSalesAgentDetails as { productLinkDetails?: string; brandName?: string; productCategory?: string; targetMarketLanguage?: string; targetPlatform?: string; persona?: string; avatarSource?: string; avatarStyle?: string; voiceSource?: string; voiceLanguage?: string; voiceTone?: string; background?: string; visualStyle?: string; subtitleOption?: string; interactionMode?: string; streamGoal?: string; humanFallback?: string; providerReadiness?: string; ctaOffer?: string; complianceNotes?: string; creditPolicy?: string; materialGroups?: Record<string, string[]> } | undefined;
        const liveSalesAgentSummary = liveSalesAgentDetails ? [liveSalesAgentDetails.brandName, liveSalesAgentDetails.productCategory, liveSalesAgentDetails.targetPlatform, liveSalesAgentDetails.streamGoal, liveSalesAgentDetails.creditPolicy].filter(Boolean).join(" · ") : "";
        const commerceWorkflow = item.request_metadata?.commerceWorkflow as { storePlatform?: string; storeAssetGoal?: string; connectedStoreTargets?: string } | undefined;
        const providerJobs = providerJobsFor(item);
        const hasRefreshableJobs = providerJobs.some((job) => job.kind === "active" || job.kind === "unknown");
        const providerTestMode = Boolean(item.output_json?.providerTestMode ?? item.request_metadata?.providerTestMode);
        const providerPreflight = item.output_json?.providerPreflight && typeof item.output_json.providerPreflight === "object" ? item.output_json.providerPreflight as Record<string, unknown> : null;
        const providerReadiness = item.output_json?.providerReadiness && typeof item.output_json.providerReadiness === "object" ? item.output_json.providerReadiness as Record<string, any> : null;
        const agentAction = (item.request_metadata?.agentAction && typeof item.request_metadata.agentAction === "object" ? item.request_metadata.agentAction : item.output_json?.agentAction && typeof item.output_json.agentAction === "object" ? item.output_json.agentAction : null) as Record<string, unknown> | null;
        const agentProviderRoutePlan = (item.request_metadata?.agentProviderRoutePlan && typeof item.request_metadata.agentProviderRoutePlan === "object" ? item.request_metadata.agentProviderRoutePlan : item.output_json?.agentProviderRoutePlan && typeof item.output_json.agentProviderRoutePlan === "object" ? item.output_json.agentProviderRoutePlan : null) as Record<string, unknown> | null;
        const providerRequirements = Array.isArray(providerReadiness?.requirements) ? providerReadiness.requirements as Record<string, any>[] : [];
        const agentBlockingKeys = Array.isArray(agentProviderRoutePlan?.blockingKeys) ? agentProviderRoutePlan.blockingKeys.map((key) => String(key)) : [];
        const outputRegistry = Array.isArray(item.output_json?.outputRegistry) ? item.output_json.outputRegistry as Record<string, any>[] : [];
        const renderQueuePolicy = (item.request_metadata?.renderQueuePolicy && typeof item.request_metadata.renderQueuePolicy === "object" ? item.request_metadata.renderQueuePolicy : item.output_json?.renderQueuePolicy && typeof item.output_json.renderQueuePolicy === "object" ? item.output_json.renderQueuePolicy : null) as Record<string, unknown> | null;
        const capacityPolicy = (item.request_metadata?.capacityPolicy && typeof item.request_metadata.capacityPolicy === "object" ? item.request_metadata.capacityPolicy : item.output_json?.capacityPolicy && typeof item.output_json.capacityPolicy === "object" ? item.output_json.capacityPolicy : null) as Record<string, unknown> | null;
        const queueStatus = String(item.output_json?.queueStatus ?? "");
        const queueUserMessage = String(item.output_json?.userMessage ?? "");
        const activeVideoJobs = item.output_json?.activeVideoJobs !== undefined ? Number(item.output_json.activeVideoJobs) : undefined;
        const activeJobLimit = item.output_json?.activeJobLimit !== undefined ? Number(item.output_json.activeJobLimit) : undefined;
        const isQueuedForRenderSlot = item.status === "queued" || item.automation_status === "queued" || item.generation_status === "queued_for_render_slot" || queueStatus === "waiting_for_video_provider_slot";
        const creditResolution = item.output_json?.creditResolution && typeof item.output_json.creditResolution === "object" ? item.output_json.creditResolution as Record<string, unknown> : null;
        const reservedCredits = Number(item.reserved_credits ?? item.estimated_credits ?? 0) || 0;
        const canRetryProvider = item.status === "failed" && creditResolution?.status === "admin_review_required" && reservedCredits > 0;
        const retryBlockedAfterRefund = item.status === "failed" && creditResolution?.status === "refunded_reserved";
        const manualDraft = draftFor(item);

        return (
        <div className="card admin-production-card" key={item.id}>
          <div className="admin-production-head">
            <div>
              <span className="badge">{item.production_type.replace("_", " ")}</span>
              {agentAction ? <span className="badge">{String(agentAction.name ?? "agent action")}</span> : null}
              {agentProviderRoutePlan ? <span className="badge">{String(agentProviderRoutePlan.providerCategory ?? "provider")}</span> : null}
              {providerTestMode ? <span className="badge">Quick provider test</span> : null}
              {providerReadiness ? <span className="badge">{String(providerReadiness.status ?? "provider check")}</span> : null}
              <h3>{item.title}</h3>
              <p>{item.prompt}</p>
              {item.input_json ? <small style={{ color: "var(--muted)" }}>Package: {String(item.input_json.packageName ?? item.package_id ?? "-")}</small> : null}
            </div>
            <div className="admin-production-status">
              <strong>{statusLabel(item.status)}</strong>
              <small>{item.generation_status ?? item.automation_status ?? "automation_queued"}</small>
              {item.automation_job_id ? <small>{item.automation_job_id}</small> : null}
              {isQueuedForRenderSlot ? <small>Render queue: {String(renderQueuePolicy?.label ?? (queueStatus || "waiting"))}</small> : null}
              {legalSnapshot?.accepted ? <small>Legal: {legalSnapshot.version ?? "accepted"} {item.legal_acceptance_id ? `- ${item.legal_acceptance_id}` : ""}</small> : <small style={{ color: "#fca5a5" }}>Legal acceptance missing</small>}
              <small>{(item.reserved_credits ?? item.estimated_credits).toLocaleString()} credits</small>
            </div>
          </div>

          <div className="admin-info-grid">
            <div>
              <span>Automation health</span>
              <strong>{automationHealth(item)}</strong>
            </div>
            <div>
              <span>Payment / credits</span>
              <strong>{(item.reserved_credits ?? item.estimated_credits).toLocaleString()} reserved</strong>
              {creditResolution ? <small>{String(creditResolution.status ?? "admin_review_required")}</small> : null}
            </div>
            <div>
              <span>Customer delivery</span>
              <strong>{(item.delivery_link || item.delivery_zip_url) ? "One-click link ready" : "Waiting for automation"}</strong>
            </div>
            <div>
              <span>Agent route</span>
              <strong>{String(agentAction?.name ?? "No agent action")}</strong>
              {agentProviderRoutePlan ? <small>{String(agentProviderRoutePlan.providerCategory ?? "general")} · {String(agentProviderRoutePlan.readinessStatus ?? "pending")}</small> : null}
              {agentBlockingKeys.length ? <small>Missing: {agentBlockingKeys.join(", ")}</small> : null}
            </div>
            <div>
              <span>Email delivery</span>
              <strong>{completionEmailLabel(item)}</strong>
            </div>
            <div>
              <span>Legal record</span>
              <strong>{legalSnapshot?.accepted ? "Accepted before request" : "Missing"}</strong>
              <small>{legalSnapshot?.acceptedAt ?? item.legal_acceptance_id ?? "No legal id"}</small>
            </div>
            <div>
              <span>Output count</span>
              <strong>{outputPlan?.outputCount ?? 1} outputs</strong>
              <small>{outputPlan?.variationStrategy ?? "single_best_output"}</small>
            </div>
            <div>
              <span>Revenue value</span>
              <strong>{profitEstimate?.estimatedRevenueUsd !== undefined ? money(profitEstimate.estimatedRevenueUsd) : "Pending"}</strong>
              <small>{reservedCredits.toLocaleString()} reserved credits</small>
            </div>
            <div>
              <span>API/provider cost</span>
              <strong>{profitEstimate?.estimatedProviderCostUsd !== undefined ? money(profitEstimate.estimatedProviderCostUsd) : "Pending"}</strong>
              <small>{profitEstimate?.providerCostLines?.length ? `${profitEstimate.providerCostLines.length} cost lines` : "No breakdown yet"}</small>
            </div>
            <div>
              <span>Gross profit</span>
              <strong>{profitEstimate?.estimatedGrossProfitUsd !== undefined ? money(profitEstimate.estimatedGrossProfitUsd) : "Pending"}</strong>
              <small>{profitEstimate?.estimatedMarginPercent !== undefined ? `Margin %${profitEstimate.estimatedMarginPercent}` : "Margin pending"}</small>
            </div>
            <div>
              <span>Publish targets</span>
              <strong>{deliveryTargets?.publishTargets?.join(", ") ?? "dashboard_delivery"}</strong>
              <small>{deliveryTargets?.connectedAccountTargets || deliveryTargets?.connectedStoreTargets || "No target account or store selected"}</small>
            </div>
            <div>
              <span>Project stack</span>
              <strong>{projectWorkflow?.technicalStack || "General automation"}</strong>
              <small>{musicVideoGroupSummary || dramaDetailsSummary || droneDetailsSummary || liveSalesAgentSummary || projectWorkflow?.projectDetails || projectWorkflow?.modules || projectWorkflow?.sourceDelivery || "No module details"}</small>
            </div>
            <div>
              <span>Commerce target</span>
              <strong>{commerceWorkflow?.storePlatform || "No store selected"}</strong>
              <small>{commerceWorkflow?.storeAssetGoal || commerceWorkflow?.connectedStoreTargets || "No e-commerce target"}</small>
            </div>
            <div>
              <span>Delivery package</span>
              <strong>{deliveryPackage?.standard || "media_final"}</strong>
              <small>{deliveryPackage?.costCredits ? `${deliveryPackage.costCredits} delivery credits` : "standard delivery"}</small>
            </div>
            <div>
              <span>Requested files</span>
              <strong>{requestedDeliveryFormats.length ? `${requestedDeliveryFormats.length} requested` : "Default delivery"}</strong>
              <small>{String(deliveryRequirements?.status ?? "pending")}</small>
            </div>
          </div>

          {productionQuality ? (
            <section className="dynamic-brief-panel" style={{ marginTop: 12 }}>
              <span className="badge">Production quality</span>
              <h3>{productionQuality.label ?? "Category quality standard"}</h3>
              <p>{productionQuality.minimumStandard ?? "Category-specific delivery quality checklist is attached to this production."}</p>
              <div className="provider-job-list">
                {(productionQuality.adminReviewFocus ?? productionQuality.checklist ?? []).slice(0, 6).map((check) => (
                  <div className="provider-job-chip ready" key={`${item.id}-quality-${check}`}>
                    <strong>{check}</strong>
                    <span>{productionQuality.customerReadyDefinition ?? "Customer-ready delivery"}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {droneDetails ? (
            <section className="workspace-action-note" style={{ marginTop: 12 }}>
              <strong>Drone Production Brief</strong>
              <div className="admin-info-grid" style={{ marginTop: 10 }}>
                <div><span>Location / route</span><strong>{droneDetails.locationAddress || "No location"}</strong><small>{droneDetails.routePath || "No route"}</small></div>
                <div><span>Marked area</span><strong>{droneDetails.markedArea || "No marked area"}</strong><small>Map / satellite notes</small></div>
                <div><span>Shot type</span><strong>{droneDetails.shotType || "No shot type"}</strong><small>{droneDetails.cameraMovement || "No camera movement"}</small></div>
                <div><span>Map / visual style</span><strong>{droneDetails.mapStyle || "No map style"}</strong><small>{droneDetails.visualStyle || "No visual style"}</small></div>
                <div><span>Voice / subtitles</span><strong>{droneDetails.narrationLanguage || "No voice-over"}</strong><small>{droneDetails.subtitleOption || "No subtitle option"}</small></div>
                <div><span>Music / references</span><strong>{droneDetails.musicStyle || "No music style"}</strong><small>{Object.values(droneDetails.materialGroups ?? {}).flat().length} uploaded drone refs</small></div>
              </div>
            </section>
          ) : null}

          {liveSalesAgentDetails ? (
            <section className="workspace-action-note" style={{ marginTop: 12 }}>
              <strong>Live Agent Brief</strong>
              <div className="admin-info-grid" style={{ marginTop: 10 }}>
                <div><span>Brand / product</span><strong>{liveSalesAgentDetails.brandName || "No brand name"}</strong><small>{liveSalesAgentDetails.productCategory || liveSalesAgentDetails.productLinkDetails || "No product category"}</small></div>
                <div><span>Market / platform</span><strong>{liveSalesAgentDetails.targetPlatform || "No platform"}</strong><small>{liveSalesAgentDetails.targetMarketLanguage || "No market/language"}</small></div>
                <div><span>Host persona</span><strong>{liveSalesAgentDetails.persona || "No persona"}</strong><small>{liveSalesAgentDetails.avatarSource || "No avatar source"}</small></div>
                <div><span>Avatar style</span><strong>{liveSalesAgentDetails.avatarStyle || "No avatar style"}</strong><small>{liveSalesAgentDetails.materialGroups?.selfAvatar?.length ?? 0} self avatar uploads · {liveSalesAgentDetails.materialGroups?.avatarReference?.length ?? 0} avatar refs</small></div>
                <div><span>Voice setup</span><strong>{liveSalesAgentDetails.voiceSource || "No voice source"}</strong><small>{liveSalesAgentDetails.voiceLanguage || "No voice/language"} · {liveSalesAgentDetails.voiceTone || "No tone"}</small></div>
                <div><span>Background / visuals</span><strong>{liveSalesAgentDetails.background || "No background"}</strong><small>{liveSalesAgentDetails.visualStyle || "No visual style"} · {liveSalesAgentDetails.materialGroups?.background?.length ?? 0} background refs</small></div>
                <div><span>Subtitles</span><strong>{liveSalesAgentDetails.subtitleOption || "No subtitle option"}</strong><small>Caption / language handling</small></div>
                <div><span>Interaction goal</span><strong>{liveSalesAgentDetails.streamGoal || "No stream goal"}</strong><small>{liveSalesAgentDetails.interactionMode || "No interaction mode"}</small></div>
                <div><span>Offer / CTA</span><strong>{liveSalesAgentDetails.ctaOffer || "No offer"}</strong><small>{liveSalesAgentDetails.productLinkDetails || "No product link"}</small></div>
                <div><span>Provider readiness</span><strong>{liveSalesAgentDetails.providerReadiness || "Provider readiness later"}</strong><small>{liveSalesAgentDetails.creditPolicy || "No credit policy"}</small></div>
                <div><span>Human fallback</span><strong>{liveSalesAgentDetails.humanFallback || "No fallback rules"}</strong><small>Escalation policy</small></div>
                <div><span>Compliance notes</span><strong>{liveSalesAgentDetails.complianceNotes || "No compliance notes"}</strong><small>AI disclosure / restricted claims</small></div>
              </div>
            </section>
          ) : null}

          {isQueuedForRenderSlot ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Render queue</span>
              <p>{queueUserMessage || "This production is waiting for the next safe video provider slot."}</p>
              <div className="provider-job-list">
                <div className="provider-job-chip active">
                  <strong>{String(renderQueuePolicy?.label ?? "Standard render queue")}</strong>
                  <span>{String(renderQueuePolicy?.userBenefit ?? (queueStatus || "waiting_for_video_provider_slot"))}</span>
                  {Number.isFinite(activeVideoJobs) && Number.isFinite(activeJobLimit) ? <small>Active video jobs: {activeVideoJobs} / {activeJobLimit}</small> : null}
                </div>
                {capacityPolicy?.activeVideoJobs ? (
                  <div className="provider-job-chip unknown">
                    <strong>Capacity policy</strong>
                    <span>{String(capacityPolicy.activeVideoJobs)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {revisionRequestsFor(item).length > 0 ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Customer revision queue</span>
              <p>Latest customer revision requests and pending output actions for this production.</p>
              <div className="provider-job-list">
                {revisionRequestsFor(item).slice(-6).reverse().map((revision, index) => (
                  <div className="provider-job-chip active" key={`${item.id}-revision-${String(revision.id ?? index)}`}>
                    <strong>{String(revision.targetPart ?? "General production")}</strong>
                    <span>{String(revision.action ?? "Revision")} · {String(revision.status ?? "queued")}</span>
                    <small>{String(revision.message ?? "No message")}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {outputRegistry.length > 0 ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Output registry</span>
              <p>Expected and generated files for this delivery package.</p>
              <div className="provider-job-list">
                {outputRegistry.map((output) => (
                  <div className={`provider-job-chip ${String(output.status) === "ready" || String(output.status) === "generated_on_download" ? "ready" : String(output.status) === "waiting_provider" ? "active" : "unknown"}`} key={`${item.id}-output-${String(output.id)}`}>
                    <strong>{String(output.filename)}</strong>
                    <span>{String(output.outputType)} · {String(output.status)}</span>
                    {output.url ? <small>{String(output.url)}</small> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {providerReadiness ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Provider readiness</span>
              <p>{String(providerReadiness.userMessage ?? "Provider/API readiness is tracked before real production starts.")}</p>
              <div className="provider-job-list">
                {providerRequirements.map((provider) => (
                  <div className={`provider-job-chip ${String(provider.status) === "ready" ? "ready" : String(provider.status) === "missing" ? "failed" : "unknown"}`} key={`${item.id}-provider-${String(provider.key)}`}>
                    <strong>{String(provider.label)}</strong>
                    <span>{String(provider.status)}</span>
                    <small>{Array.isArray(provider.requiredEnv) ? provider.requiredEnv.join(", ") : "provider config"}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {deliveryRequirements || requestedDeliveryFormats.length > 0 ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Delivery requirements control</span>
              <p>Customer-selected delivery files and generated package routes for this production.</p>
              <div className="provider-job-list">
                {(requestedDeliveryFormats.length ? requestedDeliveryFormats : ["dashboard_delivery"]).map((format) => (
                  <div className={`provider-job-chip ${deliveryReadyStatus(item, format) === "ready" ? "ready" : deliveryReadyStatus(item, format) === "waiting_provider" ? "active" : "unknown"}`} key={`${item.id}-delivery-req-${format}`}>
                    <strong>{format}</strong>
                    <span>{deliveryReadyStatus(item, format)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <a className="btn secondary" href={`${deliveryPath}?file=zip`} target="_blank" rel="noreferrer">Generate ZIP</a>
                <a className="btn secondary" href={`${deliveryPath}?file=readme`} target="_blank" rel="noreferrer">README</a>
                <a className="btn secondary" href={`${deliveryPath}?file=source`} target="_blank" rel="noreferrer">Source guide</a>
                <a className="btn secondary" href={`${deliveryPath}?file=manifest`} target="_blank" rel="noreferrer">Manifest</a>
              </div>
            </div>
          ) : null}

          <div className="dynamic-brief-panel manual-delivery-panel" style={{ marginTop: 10 }}>
            <span className="badge">Manual preview / delivery update</span>
            <p>Use this when provider config is missing or when admin/automation needs to attach final customer preview, delivery files and progress manually.</p>
            <div className="provider-job-list" style={{ marginBottom: 10 }}>
              <div className={(manualDraft.delivery_link || manualDraft.delivery_zip_url) ? "provider-job-chip ready" : "provider-job-chip unknown"}>
                <strong>Final customer delivery</strong>
                <span>{(manualDraft.delivery_link || manualDraft.delivery_zip_url) ? "ready" : "waiting"}</span>
                <small>Use Delivery link or Delivery ZIP URL.</small>
              </div>
              <div className={manualDraft.source_files_url ? "provider-job-chip ready" : requestedDeliveryFormats.includes("source_code") ? "provider-job-chip active" : "provider-job-chip unknown"}>
                <strong>Source files</strong>
                <span>{manualDraft.source_files_url ? "ready" : requestedDeliveryFormats.includes("source_code") ? "requested" : "optional"}</span>
                <small>Attach source/package URL when selected by customer.</small>
              </div>
              <div className={manualDraft.readme_url ? "provider-job-chip ready" : requestedDeliveryFormats.includes("readme") ? "provider-job-chip active" : "provider-job-chip unknown"}>
                <strong>README / setup</strong>
                <span>{manualDraft.readme_url ? "ready" : requestedDeliveryFormats.includes("readme") ? "requested" : "optional"}</span>
                <small>Attach setup note or generated README URL.</small>
              </div>
            </div>
            <div className="manual-delivery-grid">
              <label><span>Status</span><select value={manualDraft.status} onChange={(event) => updateDraft(item.id, { status: event.target.value })}><option value="queued">Queued</option><option value="in_production">In production</option><option value="waiting_provider_config">Waiting provider config</option><option value="ready">Ready</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label>
              <label><span>Generation status</span><input value={manualDraft.generation_status} onChange={(event) => updateDraft(item.id, { generation_status: event.target.value })} placeholder="preview_ready" /></label>
              <label><span>Automation status</span><input value={manualDraft.automation_status} onChange={(event) => updateDraft(item.id, { automation_status: event.target.value })} placeholder="completed" /></label>
              <label><span>Provider status</span><input value={manualDraft.provider_status} onChange={(event) => updateDraft(item.id, { provider_status: event.target.value })} placeholder="kling_running / provider_succeeded" /></label>
              <label><span>Provider progress %</span><input type="number" min="0" max="100" value={manualDraft.provider_progress} onChange={(event) => updateDraft(item.id, { provider_progress: event.target.value })} placeholder="0-100" /></label>
              <label><span>Preview URL</span><input value={manualDraft.preview_url} onChange={(event) => updateDraft(item.id, { preview_url: event.target.value })} placeholder="https://...mp4 / image / preview page" /></label>
              <label><span>Delivery link</span><input value={manualDraft.delivery_link} onChange={(event) => updateDraft(item.id, { delivery_link: event.target.value })} placeholder="https://... final customer link" /></label>
              <label><span>Delivery ZIP URL</span><input value={manualDraft.delivery_zip_url} onChange={(event) => updateDraft(item.id, { delivery_zip_url: event.target.value })} placeholder="https://...zip" /></label>
              <label><span>Source files URL</span><input value={manualDraft.source_files_url} onChange={(event) => updateDraft(item.id, { source_files_url: event.target.value })} placeholder="https://... source/package" /></label>
              <label><span>README URL</span><input value={manualDraft.readme_url} onChange={(event) => updateDraft(item.id, { readme_url: event.target.value })} placeholder="https://... readme" /></label>
            </div>
            <label className="manual-delivery-notes"><span>Admin notes</span><textarea value={manualDraft.admin_notes} onChange={(event) => updateDraft(item.id, { admin_notes: event.target.value })} placeholder="Customer-facing/admin delivery note" /></label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button className="btn" type="button" onClick={() => saveManualDelivery(item)} disabled={savingDeliveryId === item.id}>{savingDeliveryId === item.id ? "Saving..." : "Save preview / delivery"}</button>
              <a className="btn secondary" href={`/dashboard/productions/${item.id}`} target="_blank" rel="noreferrer">Open customer preview</a>
            </div>
          </div>

          {deliveryPackage ? (
            <div className="dynamic-brief-panel" style={{ marginTop: 10 }}>
              <span className="badge">Delivery checklist</span>
              <p>{deliveryPackage.requiredItems?.join(" · ") || "Attach final files, preview and delivery notes before marking ready."}</p>
              <div className="provider-job-list">
                {deliveryPackage.adminChecklist?.slice(0, 6).map((item) => (
                  <div className="provider-job-chip ready" key={`delivery-${item}`}>
                    <strong>{item}</strong>
                    <span>{deliveryPackage.fileFormats?.join(", ") || "ZIP / URL / README"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {pipelineType === "ecommerce_product_ad_video" || providerJobs.length > 0 || profitEstimate?.providerCostLines?.length ? (
            <div className="dynamic-brief-panel provider-job-panel" style={{ marginTop: 10 }}>
              <span className="badge">Provider chain</span>
              <p>{pipelineType === "ecommerce_product_ad_video" ? "Product link - GPT-4o - Runway/Kling - ElevenLabs - Whisper - Shotstack/Remotion - final MP4" : "API cost breakdown plus visual, render, alternative and voice provider job states are monitored here."}</p>
              {providerPreflight ? <p className="provider-poll-note">Preflight: {String(providerPreflight.provider)} · {String(providerPreflight.model)} · {String(providerPreflight.durationSeconds)} sec · {String(providerPreflight.aspectRatio)}</p> : null}
              {creditResolution ? <p className="workspace-action-note error">{String(creditResolution.instruction ?? "Provider failed; credit resolution requires admin review.")}</p> : null}
              {canRetryProvider ? <button className="btn" type="button" onClick={() => retryProviderJob(item)} disabled={refreshingId === item.id}>{refreshingId === item.id ? "Starting provider retry..." : "Retry provider job"}</button> : null}
              {creditResolution?.status === "admin_review_required" ? <button className="btn secondary" type="button" onClick={() => refundReservedCredits(item)} disabled={refundingId === item.id}>{refundingId === item.id ? "Refunding credits..." : "Refund reserved credits"}</button> : null}
              {retryBlockedAfterRefund ? <p className="provider-poll-note">Provider retry is closed for this record because reserved credits were refunded. Create a new production instead.</p> : null}
              {profitEstimate?.providerCostLines?.length ? (
                <div className="provider-job-list">
                  {profitEstimate.providerCostLines.map((line) => (
                    <div className="provider-job-chip ready" key={`${item.id}-cost-${line.label}-${line.provider}`}>
                      <strong>{line.label}</strong>
                      <span>{line.provider} · {money(line.estimatedCostUsd)}</span>
                      <small>{line.basis}</small>
                    </div>
                  ))}
                </div>
              ) : null}
              {providerJobs.length > 0 ? (
                <div className="provider-job-list">
                  {providerJobs.map((job) => (
                    <div className={`provider-job-chip ${job.kind}`} key={`${item.id}-${job.label}-${job.id}`}>
                      <strong>{job.label}</strong>
                      <span>{job.provider} · {job.status}</span>
                      <small>{job.id}</small>
                    </div>
                  ))}
                </div>
              ) : null}
              {hasRefreshableJobs && !["ready", "failed", "cancelled"].includes(item.status) ? <button className="btn secondary" type="button" onClick={() => refreshAutomationStatus(item)} disabled={refreshingId === item.id}>{refreshingId === item.id ? "Polling provider..." : "Poll provider status"}</button> : null}
            </div>
          ) : null}

          {automationSteps.length > 0 ? (

            <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
              {automationSteps.map((step) => (
                <small key={step.key} style={{ color: step.status === "running" ? "#fcd34d" : "var(--muted)" }}>
                  {step.status.toUpperCase()} - {step.label}
                </small>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.preview_url ? <a className="btn secondary" href={item.preview_url} target="_blank" rel="noreferrer">Preview</a> : null}
            {(item.delivery_link || item.delivery_zip_url) ? <a className="btn" href={(item.delivery_link || item.delivery_zip_url)!} target="_blank" rel="noreferrer">One-click delivery</a> : <span className="badge">Automatic delivery pending</span>}
            {item.source_files_url ? <a className="btn secondary" href={item.source_files_url} target="_blank" rel="noreferrer">Source/package</a> : null}
            {item.readme_url ? <a className="btn secondary" href={item.readme_url} target="_blank" rel="noreferrer">How-to-use</a> : null}
          </div>

          {item.admin_notes ? <p style={{ color: "var(--muted)", marginTop: 10 }}>{item.admin_notes}</p> : null}
        </div>
        );
      })}
    </div>
  );
}
