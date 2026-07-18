"use client";

import { useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

const payoutStatuses = [
  { label: "Pending bank details", value: "pending_bank_details" },
  { label: "Pending verification", value: "pending_verification" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "Paused", value: "paused" }
];

type PartnerPayoutDetailsFormProps = {
  partnerCode: string;
  initialPayoutMethod?: string;
  initialPayoutEmail?: string;
  initialBankName?: string;
  initialBankAccountHolder?: string;
  initialBankIban?: string;
  initialBankSwift?: string;
  initialPayoutStatus?: string;
  initialPayoutNotes?: string;
};

export function PartnerPayoutDetailsForm({
  partnerCode,
  initialPayoutMethod = "Bank transfer",
  initialPayoutEmail = "",
  initialBankName = "",
  initialBankAccountHolder = "",
  initialBankIban = "",
  initialBankSwift = "",
  initialPayoutStatus = "pending_bank_details",
  initialPayoutNotes = ""
}: PartnerPayoutDetailsFormProps) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState(() => getStoredAdminApiToken());
  const [payoutMethod, setPayoutMethod] = useState(initialPayoutMethod);
  const [payoutEmail, setPayoutEmail] = useState(initialPayoutEmail);
  const [bankName, setBankName] = useState(initialBankName);
  const [bankAccountHolder, setBankAccountHolder] = useState(initialBankAccountHolder);
  const [bankIban, setBankIban] = useState(initialBankIban);
  const [bankSwift, setBankSwift] = useState(initialBankSwift);
  const [payoutStatus, setPayoutStatus] = useState(initialPayoutStatus);
  const [payoutNotes, setPayoutNotes] = useState(initialPayoutNotes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitPayoutDetails() {
    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before updating payout details.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/partners/profiles/${partnerCode}/payout`, {
      method: "PATCH",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody({
        payout_method: payoutMethod,
        payout_email: payoutEmail,
        bank_name: bankName,
        bank_account_holder: bankAccountHolder,
        bank_iban: bankIban,
        bank_swift: bankSwift,
        payout_status: payoutStatus,
        payout_notes: payoutNotes
      }, adminEmail, adminToken))
    });
    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not update payout details.");
      return;
    }

    setMessage(`Payout details updated for ${data.profile?.partner_code ?? partnerCode}. Refresh page to verify saved values.`);
  }

  return (
    <div className="card" style={{ marginTop: 12, padding: 12 }}>
      <span className="badge">Admin payout editor</span>
      <div className="brief-two-col" style={{ marginTop: 10 }}>
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="field">
          <label>Payout status</label>
          <select value={payoutStatus} onChange={(event) => setPayoutStatus(event.target.value)}>
            {payoutStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Payout method</label>
          <input value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value)} placeholder="Bank transfer" />
        </div>
        <div className="field">
          <label>Payout email</label>
          <input value={payoutEmail} onChange={(event) => setPayoutEmail(event.target.value)} placeholder="partner@example.com" />
        </div>
        <div className="field">
          <label>Account holder</label>
          <input value={bankAccountHolder} onChange={(event) => setBankAccountHolder(event.target.value)} placeholder="Legal account holder" />
        </div>
        <div className="field">
          <label>Bank name</label>
          <input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Bank name" />
        </div>
        <div className="field">
          <label>IBAN</label>
          <input value={bankIban} onChange={(event) => setBankIban(event.target.value)} placeholder="IBAN" />
        </div>
        <div className="field">
          <label>SWIFT</label>
          <input value={bankSwift} onChange={(event) => setBankSwift(event.target.value)} placeholder="SWIFT/BIC" />
        </div>
      </div>
      <div className="field" style={{ marginTop: 10 }}>
        <label>Finance verification notes</label>
        <textarea value={payoutNotes} onChange={(event) => setPayoutNotes(event.target.value)} rows={3} placeholder="Verification note, change reason, or finance approval details" />
      </div>
      <button className="btn" disabled={loading} onClick={submitPayoutDetails} type="button" style={{ marginTop: 10 }}>
        {loading ? "Saving..." : "Save payout details"}
      </button>
      {message ? <p className="form-message" style={{ color: message.toLowerCase().includes("updated") ? "#86efac" : "#fca5a5" }}>{message}</p> : null}
    </div>
  );
}
