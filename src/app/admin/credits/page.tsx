import { AdminShell } from "@/components/AdminShell";
import { AdminCreditForm } from "@/components/AdminCreditForm";

export default function AdminCreditsPage() {
  return (
    <AdminShell title="Credit Operations" description="Manual credit activation, payment-link review notes, receipt references and credit operations.">
      <section className="card admin-wide-card">
        <h2>Manual credit activation</h2>
        <p style={{ color: "var(--muted)" }}>Use this after verifying a Whop payment in Whop Dashboard, or to give a test user production credits for manual E2E. Add the same customer email, credit amount and payment/reference ID, then notify the user automatically.</p>
        <div className="workspace-action-note warning" style={{ marginBottom: 14 }}>
          Whop is the current billing source of record for checkout receipts, payments and memberships. Crelavo sends the credit activation email after admin review and stores the payment/reference ID in the credit event note. Use this form for normal credit purchases and Drone / Satellite Video credit packs. Do not use it for AI Live Sales Agent service plans because those have 0 account credits.
        </div>
        <AdminCreditForm />
      </section>
    </AdminShell>
  );
}
