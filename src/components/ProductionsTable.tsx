"use client";

import { useEffect, useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type ApprovalOption = {
  label: string;
  description?: string;
  extraCredits?: number;
};

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

type ProductionRow = {
  id: string;
  production_type: string;
  package_id?: string | null;
  title: string;
  prompt: string;
  status: string;
  generation_status?: string | null;
  automation_status?: string | null;
  automation_job_id?: string | null;
  delivery_link?: string | null;
  approval_question?: string | null;
  approval_options?: ApprovalOption[] | null;
  approval_status?: string | null;
  automation_steps?: AutomationStep[] | null;
  output_json?: Record<string, unknown> | null;
  request_metadata?: Record<string, unknown> | null;
  estimated_credits: number;
  reserved_credits?: number | null;
  preview_url?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  admin_notes?: string | null;
  legal_acceptance_id?: string | null;
  legal_acceptance_snapshot?: LegalSnapshot | null;
  created_at?: string | null;
};

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_production: "Production running",
    queued: "Queued",
    ready: "Ready",
    failed: "Failed",
    cancelled: "Cancelled"
  };
  return map[status] ?? status;
}

function liveStageFor(item: ProductionRow) {
  if (item.status === "ready" || item.delivery_link || item.delivery_zip_url || item.source_files_url) return "Final delivery ready";
  if (item.preview_url) return "Preview ready";
  if (item.automation_status || item.generation_status || item.automation_job_id) return "Provider / automation running";
  if (item.approval_status === "waiting") return "Waiting for user decision";
  return "Production record ready";
}

function nextActionFor(item: ProductionRow) {
  if (item.status === "ready" || item.delivery_link || item.delivery_zip_url || item.source_files_url) return "Open, download, or request a revision.";
  if (item.preview_url) return "Review the preview and request changes if needed.";
  if (item.approval_status === "waiting") return "Choose an option so automation can continue.";
  if (item.automation_status || item.generation_status || item.automation_job_id) return "Refresh status or follow it in the live workspace.";
  return "Open the live workspace and start the provider/package step.";
}

export function ProductionsTable() {
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [mode, setMode] = useState("loading");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [refreshingId, setRefreshingId] = useState("");

  useEffect(() => {
    async function loadProductions() {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) {
        setMode("login");
        return;
      }
      const userId = auth.user.id;

      fetch(`/api/productions?user_id=${userId}`, { headers: authHeaders(auth.accessToken) })
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

  async function submitApproval(item: ProductionRow, option: ApprovalOption) {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) return;
    const userId = auth.user.id;

    setApprovingId(`${item.id}:${option.label}`);
    setMessage("");

    const response = await fetch("/api/productions/approval", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        production_id: item.id,
        user_id: userId,
        selected_option: option.label,
        extra_credits: option.extraCredits ?? 0
      })
    });

    const data = await response.json().catch(() => ({}));
    setApprovingId("");

    if (!response.ok) {
      setMessage(data.error ?? "Approval decision could not be saved.");
      if (data.redirect) window.location.href = data.redirect;
      return;
    }

    setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
    setMessage("Your choice has been saved. Automation will continue with this decision.");
  }

  async function refreshAutomationStatus(item: ProductionRow) {
    setRefreshingId(item.id);
    setMessage("");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setRefreshingId("");
      setMessage(auth.message);
      return;
    }

    const response = await fetch("/api/automation/status", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ production_id: item.id, user_id: auth.user.id })
    });

    const data = await response.json().catch(() => ({}));
    setRefreshingId("");

    if (!response.ok) {
      setMessage(data.error ?? "Automation status could not be refreshed.");
      return;
    }

    if (data.production) {
      setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
      setMessage(data.finalVideoUrl ? "Final ad video is ready." : "Automation status updated.");
    }
  }

  function openRevisionRequest(item: ProductionRow, requestType: string, idea: string) {
    const params = new URLSearchParams({ requestType, idea });
    window.location.href = `/dashboard/assistant-workspace?${params.toString()}`;
  }

  async function cancelProduction(item: ProductionRow) {
    const confirmed = window.confirm("If you cancel this automatic production, 50% of the reserved credits will be charged and the remaining 50% will be released. Continue?");
    if (!confirmed) return;

    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) return;
    const userId = auth.user.id;

    setCancellingId(item.id);
    setMessage("");

    const response = await fetch("/api/productions/cancel", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ production_id: item.id, user_id: userId })
    });

    const data = await response.json().catch(() => ({}));
    setCancellingId("");

    if (!response.ok) {
      setMessage(data.error ?? "Production could not be cancelled.");
      return;
    }

    setRows((current) => current.map((row) => row.id === item.id ? data.production : row));
    setMessage(`Production cancelled. Charged: ${data.cancellation_fee ?? 0} credits, released: ${data.refund_amount ?? 0} credits.`);
  }

if (mode === "loading") return <p style={{ color: "var(--muted)" }}>Loading productions...</p>;
if (mode === "login") return <p style={{ color: "var(--muted)" }}>Sign in to view your productions.</p>;
if (mode === "error") return <p className="form-message">{message}</p>;

if (rows.length === 0) {
  return <p style={{ color: "var(--muted)" }}>No productions yet. Start a video, website, mobile app, visual pack, brand kit, document, or campaign from the AI Assistant.</p>;
}

  const readyCount = rows.filter((item) => item.status === "ready" || item.delivery_link || item.delivery_zip_url).length;
  const activeCount = rows.filter((item) => !["ready", "failed", "cancelled"].includes(item.status)).length;
  const previewCount = rows.filter((item) => item.preview_url).length;

  return (
    <div className="productions-list-shell">
      {message ? <p className="form-message">{message}</p> : null}
      <div className="productions-overview-row">
        <div><span>Total productions</span><strong>{rows.length}</strong></div>
        <div><span>Active jobs</span><strong>{activeCount}</strong></div>
        <div><span>Previews ready</span><strong>{previewCount}</strong></div>
        <div><span>Finals ready</span><strong>{readyCount}</strong></div>
      </div>
      <div className="productions-card-grid">
        {rows.map((item) => {
          const approvalOptions = item.approval_options ?? [];
          const needsApproval = item.approval_status === "waiting" && Boolean(item.approval_question);
          const automationSteps = item.automation_steps ?? [];
          const expectedDeliverySeconds = typeof item.output_json?.expectedDeliverySeconds === "string" ? item.output_json.expectedDeliverySeconds : null;
          const legalSnapshot = item.legal_acceptance_snapshot;
          const outputPlan = item.request_metadata?.outputPlan as { outputCount?: number } | undefined;
          const deliveryTargets = item.request_metadata?.deliveryTargets as { publishTargets?: string[]; connectedAccountTargets?: string; connectedStoreTargets?: string } | undefined;

          return (
            <div className="card production-list-card" key={item.id}>
              <div className="production-card-headline">
                <span className="badge">{item.production_type.replace("_", " ")}</span>
                <span className="production-status-chip">{statusLabel(item.status)}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.prompt}</p>
              <div className="production-live-card-summary">
                <div><span>Live stage</span><strong>{liveStageFor(item)}</strong></div>
                <div><span>Next action</span><strong>{nextActionFor(item)}</strong></div>
                <div><span>Reserved credits</span><strong>{(item.reserved_credits ?? item.estimated_credits).toLocaleString()}</strong></div>
                <div><span>Output / target</span><strong>{outputPlan?.outputCount ?? 1} output · {deliveryTargets?.publishTargets?.join(", ") ?? "Dashboard"}</strong></div>
              </div>
              {item.automation_job_id ? <small style={{ color: "var(--muted)" }}>Job: {item.automation_job_id}</small> : null}
              {legalSnapshot?.accepted ? <small style={{ color: "#86efac" }}>Legal acceptance recorded: {legalSnapshot.version ?? "recorded"} {item.legal_acceptance_id ? `- ${item.legal_acceptance_id}` : ""}</small> : <small style={{ color: "#fca5a5" }}>Legal acceptance missing</small>}
              {expectedDeliverySeconds ? <small style={{ color: "#93c5fd" }}>Estimated render window after provider response: {expectedDeliverySeconds} seconds.</small> : null}

              {automationSteps.length > 0 ? (
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {automationSteps.map((step) => (
                    <small key={step.key} style={{ color: step.status === "running" ? "#fcd34d" : "var(--muted)" }}>
                      {step.status.toUpperCase()} - {step.label}
                    </small>
                  ))}
                </div>
              ) : null}

              {needsApproval ? (
                <div className="dynamic-brief-panel" style={{ marginTop: 8 }}>
                  <strong>Live automation decision required</strong>
                  <p>{item.approval_question}</p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {approvalOptions.map((option) => {
                      const optionKey = `${item.id}:${option.label}`;
                      return (
                        <button className="btn secondary" type="button" key={option.label} onClick={() => submitApproval(item, option)} disabled={approvingId === optionKey}>
                          {approvingId === optionKey ? "Saving..." : option.label}
                          {option.extraCredits ? ` (+${option.extraCredits.toLocaleString()} credits)` : ""}
                        </button>
                      );
                    })}
                  </div>
                  {approvalOptions.some((option) => option.extraCredits) ? <small style={{ color: "var(--muted)" }}>Extra options automatically reserve additional credits.</small> : null}
                </div>
              ) : null}

              <a className="btn" href={`/dashboard/productions/${item.id}`}>Live production workspace</a>
              {item.preview_url ? <a className="btn secondary" href={item.preview_url} target="_blank" rel="noreferrer">Live preview</a> : null}
              {(item.delivery_link || item.delivery_zip_url) ? <a className="btn" href={(item.delivery_link || item.delivery_zip_url)!} target="_blank" rel="noreferrer">Open delivery</a> : <small style={{ color: "#fcd34d" }}>Automatic production is running. Delivery will appear here as one link.</small>}
              {item.package_id === "campaign_product_ad_video" && !["ready", "failed", "cancelled"].includes(item.status) ? <button className="btn secondary" type="button" onClick={() => refreshAutomationStatus(item)} disabled={refreshingId === item.id}>{refreshingId === item.id ? "Refreshing status…" : "Refresh status"}</button> : null}
              {item.readme_url ? <a className="btn secondary" href={item.readme_url} target="_blank" rel="noreferrer">How to use</a> : null}
              {item.status === "ready" && item.package_id === "campaign_product_ad_video" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button className="btn secondary" type="button" onClick={() => openRevisionRequest(item, "Change subtitle color", `Change the subtitle color for ${item.title}`)}>Change subtitle color</button>
                  <button className="btn secondary" type="button" onClick={() => openRevisionRequest(item, "Change voice", `Create a male voice version for ${item.title}`)}>Use male voice</button>
                  <button className="btn secondary" type="button" onClick={() => { window.location.href = "/dashboard/ads"; }}>Send to social ads center</button>
                  <button className="btn secondary" type="button" onClick={() => { window.location.href = "/dashboard/connections"; }}>Prepare for Shopify/Amazon/Trendyol</button>
                </div>
              ) : null}
              {!["ready", "failed", "cancelled"].includes(item.status) ? <button className="btn secondary" type="button" onClick={() => cancelProduction(item)} disabled={cancellingId === item.id}>{cancellingId === item.id ? "Cancelling..." : "Cancel (50% credit charge)"}</button> : null}
              {item.admin_notes ? <small style={{ color: "var(--muted)" }}>Automation note: {item.admin_notes}</small> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
