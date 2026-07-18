"use client";

import { useEffect, useState } from "react";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";

type GrowthRequestRow = {
  id: string;
  user_id: string;
  user_email?: string | null;
  plan_id: string;
  brand_name: string;
  own_website: string;
  competitors: string;
  report_language: string;
  report_frequency: string;
  alert_channel: string;
  status: string;
  entitlement_status: string;
  report_file_url?: string | null;
  report_file_name?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
};

type DeliveryDraft = {
  status: string;
  entitlement_status: string;
  report_file_url: string;
  report_file_name: string;
  admin_notes: string;
};

const statusOptions = ["waiting_entitlement", "monitoring_ready", "in_progress", "report_ready", "delivered", "cancelled"];
const entitlementOptions = ["waiting_entitlement", "active_service", "credit_eligible", "manual_approved", "insufficient"];

function newDraft(row: GrowthRequestRow): DeliveryDraft {
  return {
    status: row.status || "waiting_entitlement",
    entitlement_status: row.entitlement_status || "waiting_entitlement",
    report_file_url: row.report_file_url ?? "",
    report_file_name: row.report_file_name ?? "Growth Intelligence report",
    admin_notes: row.admin_notes ?? ""
  };
}

export function AdminGrowthIntelligenceRequests() {
  const [rows, setRows] = useState<GrowthRequestRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [mode, setMode] = useState("idle");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  async function loadRows(email = adminEmail, token = adminToken) {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage("Enter admin email to load Growth Intelligence requests.");
      return;
    }
    setMode("loading");
    setMessage("");
    try {
      const response = await fetch(`/api/growth-intelligence/requests?admin_email=${encodeURIComponent(cleanEmail)}`, {
        headers: adminApiHeaders(cleanEmail, token)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load Growth Intelligence requests");
      const nextRows = Array.isArray(data.requests) ? data.requests : [];
      setRows(nextRows);
      setDrafts(Object.fromEntries(nextRows.map((row: GrowthRequestRow) => [row.id, newDraft(row)])));
      setMode("ready");
      setMessage(nextRows.length ? "Growth Intelligence requests loaded." : "No Growth Intelligence requests yet.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Could not load Growth Intelligence requests");
    }
  }

  useEffect(() => {
    const storedToken = getStoredAdminApiToken();
    setAdminToken(storedToken);
  }, []);

  function updateDraft(id: string, patch: Partial<DeliveryDraft>) {
    const fallbackRow = rows.find((row) => row.id === id);
    const fallbackDraft: DeliveryDraft = fallbackRow ? newDraft(fallbackRow) : { status: "waiting_entitlement", entitlement_status: "waiting_entitlement", report_file_url: "", report_file_name: "Growth Intelligence report", admin_notes: "" };
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? fallbackDraft), ...patch } }));
  }

  async function saveRow(row: GrowthRequestRow) {
    const draft = drafts[row.id] ?? newDraft(row);
    setSavingId(row.id);
    setMessage("");
    try {
      rememberAdminApiToken(adminToken);
      const response = await fetch("/api/growth-intelligence/requests", {
        method: "PATCH",
        headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify(adminApiBody({ id: row.id, ...draft }, adminEmail, adminToken))
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update Growth Intelligence request");
      const updated = data.request as GrowthRequestRow;
      setRows((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrafts((current) => ({ ...current, [updated.id]: newDraft(updated) }));
      const emailResult = data.reportEmailResult as { sent?: boolean; skipped?: boolean; reason?: string } | null | undefined;
      const emailText = emailResult?.sent ? " Email notification sent." : emailResult?.skipped ? ` Email notification skipped: ${emailResult.reason ?? "not configured"}.` : "";
      setMessage(`Growth Intelligence report delivery updated.${emailText}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update Growth Intelligence request");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <div className="brief-two-col">
        <label>Admin email<input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" /></label>
        <label>Admin API token<input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Optional if configured" /></label>
      </div>
      <button className="btn" type="button" onClick={() => loadRows()} disabled={mode === "loading"}>{mode === "loading" ? "Loading..." : "Load Growth Intelligence requests"}</button>
      {message ? <p className={`workspace-action-note ${mode === "error" ? "error" : ""}`}>{message}</p> : null}

      <div className="admin-category-grid" style={{ marginTop: 16 }}>
        {rows.map((row) => {
          const draft = drafts[row.id] ?? newDraft(row);
          return (
            <div className="card admin-category-card" key={row.id}>
              <span className="badge">{row.status} · {row.entitlement_status}</span>
              <h3>{row.brand_name}</h3>
              <p><strong>User:</strong> {row.user_email || row.user_id}</p>
              <p><strong>Website:</strong> {row.own_website}</p>
              <p><strong>Plan:</strong> {row.plan_id}</p>
              <p><strong>Report:</strong> {row.report_frequency} · {row.report_language} · {row.alert_channel}</p>
              <label>Status<select value={draft.status} onChange={(event) => updateDraft(row.id, { status: event.target.value })}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Entitlement status<select value={draft.entitlement_status} onChange={(event) => updateDraft(row.id, { entitlement_status: event.target.value })}>{entitlementOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Report file URL<input value={draft.report_file_url} onChange={(event) => updateDraft(row.id, { report_file_url: event.target.value })} placeholder="https://.../report.pdf" /></label>
              <label>Report file name<input value={draft.report_file_name} onChange={(event) => updateDraft(row.id, { report_file_name: event.target.value })} placeholder="Growth Intelligence report" /></label>
              <label>Admin notes<textarea value={draft.admin_notes} onChange={(event) => updateDraft(row.id, { admin_notes: event.target.value })} placeholder="Internal delivery notes" /></label>
              <button className="btn secondary" type="button" onClick={() => saveRow(row)} disabled={savingId === row.id}>{savingId === row.id ? "Saving..." : "Save report delivery"}</button>
              {row.report_file_url ? <p><a href={row.report_file_url} target="_blank" rel="noreferrer">Open current report file</a></p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
