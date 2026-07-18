"use client";

import { useState } from "react";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type State = "idle" | "loading" | "success" | "error";

export function AdminCreditForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("add");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("loading");
    setMessage("");

    const { data: userData } = await supabaseBrowser().auth.getUser();
    const adminEmail = userData.user?.email ?? "";

    if (!adminEmail) {
      setState("error");
      setMessage("You must sign in to perform admin actions.");
      return;
    }

    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody(payload, adminEmail, adminToken))
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Credits could not be added.");
      return;
    }

    setState("success");
    const emailNote = data.email?.sent ? " Activation email sent." : data.email?.reason ? ` Email skipped: ${data.email.reason}` : "";
    const balance = data.balance;
    const available = typeof balance?.balance === "number" && typeof balance?.reserved === "number" ? balance.balance - balance.reserved : null;
    setMessage(`${action === "remove" ? "Credits removed" : "Production credits added"}. Balance: ${balance?.balance ?? "?"}, reserved: ${balance?.reserved ?? 0}, available: ${available ?? "?"}.${emailNote}`);
    formElement.reset();
    setAction("add");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="workspace-action-note" style={{ marginBottom: 12 }}>
        Use this for manual Payment Link activation and manual E2E test credits. These are production credits, separate from welcome AI Assistant credits.
      </div>
      <div className="admin-info-grid" style={{ marginBottom: 12 }}>
        <div><span>Manual E2E starter</span><strong>10,000 credits</strong><small>Good for testing the Assistant credit guard and production start.</small></div>
        <div><span>Paid activation</span><strong>Use payment reference</strong><small>Whop is the current billing source of record.</small></div>
        <div><span>Balance rule</span><strong>Available = balance - reserved</strong><small>Assistant blocks Start when estimate exceeds available credits.</small></div>
      </div>
      <div className="field"><label>User email</label><input name="email" type="email" required placeholder="customer@example.com" /></div>
      <div className="field"><label>Action</label><select name="action" value={action} onChange={(event) => setAction(event.target.value)}><option value="add">Add production credits</option><option value="remove">Remove production credits</option></select></div>
      <div className="field"><label>{action === "remove" ? "Credits to remove" : "Credits to add"}</label><input name="amount" type="number" required min="1" placeholder="10000" /></div>
      <div className="field"><label>Note</label><input name="note" placeholder="Manual E2E test credit / Payment Link activation - Creator Credit Pack" /></div>
      <div className="field"><label>Whop payment / receipt reference</label><input name="receiptReference" placeholder="Whop payment ID, receipt URL, or customer email" /></div>
      <div className="field"><label>Invoice / membership reference</label><input name="invoiceReference" placeholder="Whop membership/subscription ID or invoice reference if available" /></div>
      <input type="hidden" name="notifyUser" value="false" />
      <label className="checkbox-row"><input name="notifyUser" type="checkbox" defaultChecked value="true" disabled={action === "remove"} /> Send credits activated email to user</label>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Saving..." : action === "remove" ? "Remove production credits" : "Add production credits and notify user"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
