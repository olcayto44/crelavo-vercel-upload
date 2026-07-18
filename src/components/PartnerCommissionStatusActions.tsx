"use client";

import { useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

const statusActions = [
  { label: "Approve commission", value: "approved" },
  { label: "Reject commission", value: "rejected" },
  { label: "Mark paid", value: "paid" },
  { label: "Margin review", value: "manual_margin_review" },
  { label: "No commission", value: "no_commission" },
  { label: "Back to pending", value: "pending_review" }
];

type PartnerCommissionStatusActionsProps = {
  commissionId: string;
  currentStatus: string;
};

export function PartnerCommissionStatusActions({ commissionId, currentStatus }: PartnerCommissionStatusActionsProps) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState(() => getStoredAdminApiToken());
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before updating commission status.");
      return;
    }

    setLoadingStatus(nextStatus);
    setMessage("");

    const response = await fetch(`/api/admin/partners/commissions/${commissionId}/status`, {
      method: "PATCH",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody({ payout_status: nextStatus, admin_notes: adminNotes }, adminEmail, adminToken))
    });
    const data = await response.json().catch(() => ({}));

    setLoadingStatus("");

    if (!response.ok) {
      setMessage(data.error ?? "Could not update commission payout status.");
      return;
    }

    setStatus(data.commission?.payout_status ?? nextStatus);
    setMessage(`Commission status updated to ${data.commission?.payout_status ?? nextStatus}. Refresh page to re-sort payout views.`);
  }

  return (
    <div className="card" style={{ marginTop: 12, padding: 12 }}>
      <span className="badge">Live payout status: {status.replaceAll("_", " ")}</span>
      <div className="brief-two-col" style={{ marginTop: 10 }}>
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Finance/admin notes</label>
        <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} placeholder="Optional payout review note" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {statusActions.map((item) => (
          <button className={item.value === "approved" || item.value === "paid" ? "btn" : "btn secondary"} disabled={Boolean(loadingStatus)} key={item.value} onClick={() => updateStatus(item.value)} type="button">
            {loadingStatus === item.value ? "Updating..." : item.label}
          </button>
        ))}
      </div>
      {message ? <p className="form-message" style={{ color: message.toLowerCase().includes("updated") ? "#86efac" : "#fca5a5" }}>{message}</p> : null}
    </div>
  );
}
