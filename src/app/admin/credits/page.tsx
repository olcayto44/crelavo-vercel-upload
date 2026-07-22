import { AdminShell } from "@/components/AdminShell";
import { AdminCreditForm } from "@/components/AdminCreditForm";
import { AdminCreditRolloverOverview } from "@/components/AdminCreditRolloverOverview";

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

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Credit rollover</span>
        <h2>Unused credits rollover tracking</h2>
        <p style={{ color: "var(--muted)" }}>Monthly subscription credits roll over only while the subscription remains active, yearly credits stay available during the active annual period, and top-up credits stay in a separate 12-month bucket. Whop renewal webhooks update these buckets automatically after successful billing.</p>
        <AdminCreditRolloverOverview />
      </section>
    </AdminShell>
  );
}
