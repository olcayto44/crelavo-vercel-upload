"use client";

import { useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

const quickStatuses = [
  { label: "Mark contacted", value: "contacted" },
  { label: "Approve", value: "approved" },
  { label: "Reject", value: "rejected" },
  { label: "Approve pending code", value: "approved_pending_code" },
  { label: "Mark live", value: "live" },
  { label: "Pause", value: "paused" }
];

type PartnerApplicationStatusActionsProps = {
  applicationId?: string;
  currentStatus: string;
};

export function PartnerApplicationStatusActions({ applicationId, currentStatus }: PartnerApplicationStatusActionsProps) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState(() => getStoredAdminApiToken());
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");
  const [createdLinks, setCreatedLinks] = useState<{ link_type: string; full_url: string | null; path: string }[]>([]);

  if (!applicationId) {
    return <p className="workspace-action-note warning">Sample fallback item. Status updates are available after a real Supabase application record exists.</p>;
  }

  async function updateStatus(nextStatus: string) {
    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before updating status.");
      return;
    }

    setLoadingStatus(nextStatus);
    setMessage("");

    const response = await fetch(`/api/admin/partners/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody({ status: nextStatus, admin_notes: adminNotes }, adminEmail, adminToken))
    });
    const data = await response.json().catch(() => ({}));

    setLoadingStatus("");

    if (!response.ok) {
      setMessage(data.error ?? "Could not update partner application status.");
      return;
    }

    setStatus(data.application?.status ?? nextStatus);
    setMessage(`Status updated to ${data.application?.status ?? nextStatus}. Refresh page if you want to re-sort the inbox.`);
  }

  async function createPartnerProfile() {
    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before creating partner profile.");
      return;
    }

    setLoadingStatus("create_profile");
    setMessage("");
    setCreatedLinks([]);

    const response = await fetch(`/api/admin/partners/applications/${applicationId}/create-profile`, {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody({ admin_notes: adminNotes }, adminEmail, adminToken))
    });
    const data = await response.json().catch(() => ({}));

    setLoadingStatus("");

    if (!response.ok) {
      setMessage(data.error ?? "Could not create partner profile and referral links.");
      return;
    }

    setStatus("approved_pending_code");
    setCreatedLinks(data.links ?? []);
    setMessage(`Partner profile created: ${data.profile?.partner_code ?? "partner code ready"}. Refresh page to see it in referral links.`);
  }

  return (
    <div className="card" style={{ marginTop: 12, padding: 12 }}>
      <span className="badge">Live Supabase status: {status}</span>
      <div className="brief-two-col" style={{ marginTop: 10 }}>
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Admin notes</label>
        <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} placeholder="Optional review note for this partner application" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {quickStatuses.map((item) => (
          <button className={item.value === "approved" ? "btn" : "btn secondary"} disabled={Boolean(loadingStatus)} key={item.value} onClick={() => updateStatus(item.value)} type="button">
            {loadingStatus === item.value ? "Updating..." : item.label}
          </button>
        ))}
        <button className="btn" disabled={Boolean(loadingStatus)} onClick={createPartnerProfile} type="button">
          {loadingStatus === "create_profile" ? "Creating..." : "Create partner profile + referral links"}
        </button>
      </div>
      {createdLinks.length > 0 ? (
        <div className="admin-info-grid" style={{ marginTop: 10 }}>
          {createdLinks.map((link) => (
            <div key={link.link_type}>
              <span>{link.link_type.replaceAll("_", " ")}</span>
              <strong style={{ wordBreak: "break-all" }}>{link.full_url ?? link.path}</strong>
              <small>Active referral link</small>
            </div>
          ))}
        </div>
      ) : null}
      {message ? <p className="form-message" style={{ color: message.toLowerCase().includes("updated") || message.toLowerCase().includes("created") ? "#86efac" : "#fca5a5" }}>{message}</p> : null}
    </div>
  );
}
