"use client";

import { useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

type AdminEmailComposerProps = {
  title: string;
  description: string;
  defaultTargetType: "all_users" | "all_partners" | "one_user" | "one_partner" | "custom";
  defaultRecipientEmail?: string;
  defaultSubject?: string;
  defaultBody?: string;
  allowBulkUsers?: boolean;
  allowBulkPartners?: boolean;
};

const targetLabels = {
  all_users: "Send to all regular users",
  all_partners: "Send to all affiliate / partner contacts",
  one_user: "Send to one user",
  one_partner: "Send to one affiliate / partner contact",
  custom: "Send to a custom email address"
};

export function AdminEmailComposer({
  title,
  description,
  defaultTargetType,
  defaultRecipientEmail = "",
  defaultSubject = "",
  defaultBody = "",
  allowBulkUsers = false,
  allowBulkPartners = false
}: AdminEmailComposerProps) {
  const [targetType, setTargetType] = useState(defaultTargetType);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const options = [
    ...(allowBulkUsers ? ["all_users" as const] : []),
    ...(allowBulkPartners ? ["all_partners" as const] : []),
    "one_user" as const,
    "one_partner" as const,
    "custom" as const
  ];
  const needsRecipient = targetType !== "all_users" && targetType !== "all_partners";

  async function sendEmail() {
    setSending(true);
    setStatus("Sending...");
    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/email", {
      method: "POST",
      headers: adminApiHeaders("", adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ target_type: targetType, recipient_email: recipientEmail, subject, body })
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setStatus(data.error ?? "Email could not be sent.");
      return;
    }

    setStatus(`${data.sentCount ?? 0} email sent. ${data.failedCount ?? 0} failed.`);
  }

  return (
    <section className="card admin-wide-card">
      <span className="badge">Admin email</span>
      <h2>{title}</h2>
      <p style={{ color: "var(--muted)" }}>{description}</p>
      <div className="admin-production-editor">
        <div className="field">
          <label>Recipient group</label>
          <select value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)}>
            {options.map((option) => <option key={option} value={option}>{targetLabels[option]}</option>)}
          </select>
        </div>
        {needsRecipient ? (
          <div className="field">
            <label>Recipient email</label>
            <input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder="name@example.com" />
          </div>
        ) : null}
        <div className="field">
          <label>Subject</label>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Email subject" />
        </div>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Email body</label>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} placeholder="Write the email message..." />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn" type="button" disabled={sending} onClick={sendEmail}>{sending ? "Sending..." : "Send email"}</button>
        {status ? <span className="badge">{status}</span> : null}
      </div>
    </section>
  );
}
