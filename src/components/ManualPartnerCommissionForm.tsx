"use client";

import { useMemo, useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

export function ManualPartnerCommissionForm() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState(() => getStoredAdminApiToken());
  const [purchaseAmount, setPurchaseAmount] = useState("499");
  const [commissionPercent, setCommissionPercent] = useState("35");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const commissionAmount = useMemo(() => {
    const amount = Number(purchaseAmount);
    const percent = Number(commissionPercent);
    if (!Number.isFinite(amount) || !Number.isFinite(percent)) return "0.00";
    return ((amount * percent) / 100).toFixed(2);
  }, [purchaseAmount, commissionPercent]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before creating a commission record.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setLoading(true);

    const payload = {
      partner_code: String(form.get("partner_code") ?? ""),
      customer_email: String(form.get("customer_email") ?? ""),
      purchase_category: String(form.get("purchase_category") ?? ""),
      package_name: String(form.get("package_name") ?? ""),
      purchase_amount: purchaseAmount,
      commission_percent: commissionPercent,
      commission_amount: commissionAmount,
      currency: String(form.get("currency") ?? "USD"),
      payment_reference: String(form.get("payment_reference") ?? ""),
      payout_status: String(form.get("payout_status") ?? "pending_review"),
      payout_window: String(form.get("payout_window") ?? ""),
      admin_notes: String(form.get("admin_notes") ?? "")
    };

    const response = await fetch("/api/admin/partners/commissions", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(adminApiBody(payload, adminEmail, adminToken))
    });
    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not create commission record.");
      return;
    }

    setMessage(`Commission created for ${data.commission?.partner_code ?? payload.partner_code}: $${data.commission?.commission_amount ?? commissionAmount}. Refresh page to see the ledger.`);
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ marginTop: 16 }}>
      <h3>Manual purchase / commission attribution</h3>
      <p style={{ color: "var(--muted)" }}>Use this while Whop/referral attribution is reviewed manually before full automation. It creates one commission ledger record and one manual purchase referral event.</p>
      <div className="brief-two-col">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
      </div>
      <div className="brief-two-col">
        <div className="field"><label>Partner code</label><input name="partner_code" required placeholder="CRELAVO-AGENCY" /></div>
        <div className="field"><label>Customer email</label><input name="customer_email" required type="email" placeholder="customer@example.com" /></div>
        <div className="field"><label>Purchase category</label><input name="purchase_category" required placeholder="Growth Intelligence" /></div>
        <div className="field"><label>Package name</label><input name="package_name" required placeholder="Growth Intelligence Agent monthly" /></div>
        <div className="field"><label>Purchase amount</label><input inputMode="decimal" name="purchase_amount" onChange={(event) => setPurchaseAmount(event.target.value)} required value={purchaseAmount} /></div>
        <div className="field"><label>Commission percent</label><input inputMode="decimal" name="commission_percent" onChange={(event) => setCommissionPercent(event.target.value)} required value={commissionPercent} /></div>
        <div className="field"><label>Commission amount</label><input name="commission_amount" readOnly value={commissionAmount} /></div>
        <div className="field"><label>Currency</label><input name="currency" defaultValue="USD" /></div>
        <div className="field"><label>Payment reference</label><input name="payment_reference" placeholder="Whop payment reference, checkout receipt, manual invoice" /></div>
        <div className="field"><label>Payout status</label><select name="payout_status" defaultValue="pending_review"><option value="pending_review">pending_review</option><option value="approved">approved</option><option value="manual_margin_review">manual_margin_review</option><option value="no_commission">no_commission</option></select></div>
        <div className="field"><label>Payout window</label><input name="payout_window" placeholder="2026-W28" /></div>
      </div>
      <div className="field"><label>Admin notes</label><textarea name="admin_notes" rows={3} placeholder="Why this commission was added manually" /></div>
      <button className="btn" disabled={loading} type="submit">{loading ? "Creating..." : "Create manual commission"}</button>
      {message ? <p className="form-message" style={{ color: message.toLowerCase().includes("created") ? "#86efac" : "#fca5a5" }}>{message}</p> : null}
    </form>
  );
}
