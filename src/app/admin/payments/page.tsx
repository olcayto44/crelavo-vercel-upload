import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";

const paymentLinkSteps = [
  "Confirm PAYMENT_PROVIDER=whop in Vercel Production before sending customers to checkout.",
  "Keep Whop plan IDs mapped to each subscription, top-up, Live Sales service plan, Growth Intelligence service plan and Drone credit pack.",
  "Ask customers to use the same email as their Crelavo account at Whop checkout.",
  "Verify the payment, receipt, membership or subscription in Whop Dashboard.",
  "For normal credit products, open /admin/credits, add credits to the matching user email and paste the Whop payment/receipt reference.",
  "For Drone / Satellite credit packs, activate credits like other one-time top-ups while keeping the purchase page separate. For Live Sales and Growth Intelligence, do not add normal credits; verify the service payment separately. Growth Intelligence report files should be visible only after active entitlement or enough credits are confirmed."
];

const standalonePaymentControls = [
  { title: "AI Live Sales Agent", route: "/admin/live-sales-agent", purchase: "/live-sales-credits", policy: "Monthly service_subscription, 0 credits, fair-use live hours, pay-as-you-go provider/API usage after cost analysis." },
  { title: "AI Growth Intelligence", route: "/admin/packages", purchase: "/growth-intelligence", policy: "Monthly service_subscription, 0 credits, public-signal competitor monitoring, gated dashboard PDF/file delivery and alert-channel service limits." },
  { title: "Drone / Satellite Video", route: "/admin/drone-video", purchase: "/drone-credits", policy: "Separate one-time drone credit packs. Payment adds credits like other top-ups; production scope is tracked from the drone brief." }
];

const futureAutomationSteps = [
  "Keep using Whop as the active payment provider until Lemon Squeezy is intentionally moved back into scope.",
  "Run live Whop payment, subscription preview and renewal tests before enabling fully automatic credit activation.",
  "Confirm duplicate-payment safeguards and idempotency checks for every Whop payment/subscription event.",
  "When Lemon is resumed later, add Lemon env values and run separate Lemon webhook tests before switching provider."
];

export default function AdminPaymentsPage() {
  return (
    <AdminShell title="Payment readiness" description="Review Whop checkout launch, manual credit activation, payment references and future webhook automation.">
      <section className="card admin-wide-card">
        <span className="badge">Current launch mode</span>
        <h2>Whop checkout + controlled credit activation</h2>
        <p style={{ color: "var(--muted)" }}>
          Early launch accepts payments through Whop checkout. Whop is the current source of record for payment IDs, receipts, memberships and subscriptions. Crelavo can reconcile Whop payments automatically where supported, while admin manual activation remains available as a safe fallback.
        </p>
        <div className="admin-info-grid" style={{ marginTop: 14 }}>
          <div><span>Payment collection</span><strong>Whop checkout</strong><small>Configured from Whop plan IDs and PAYMENT_PROVIDER=whop</small></div>
          <div><span>Payment record</span><strong>Whop</strong><small>Use payment ID, receipt, membership or subscription reference</small></div>
          <div><span>Credit activation</span><strong>Webhook + admin fallback</strong><small>/admin/credits stores payment references for credit plans and top-ups</small></div>
          <div><span>Standalone products</span><strong>Mixed policy</strong><small>Live Sales and Growth Intelligence are service-only; Drone stays separate but adds credits like top-ups</small></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/admin/packages">Review Packages</Link>
          <Link className="btn secondary" href="/admin/credits">Activate Credits</Link>
          <Link className="btn secondary" href="/admin/manual-e2e-checklist">Manual E2E Checklist</Link>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Standalone payments</span>
        <h2>Live Sales, Growth Intelligence and Drone use separate payment policies</h2>
        <div className="admin-info-grid">
          {standalonePaymentControls.map((item) => (
            <div key={item.title}>
              <span>{item.title}</span>
              <strong>{item.policy}</strong>
              <small><Link href={item.route}>Admin operations</Link> · <Link href={item.purchase}>Public purchase page</Link></small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Operational checklist</span>
        <h2>Whop activation sequence</h2>
        <div className="admin-info-grid">
          {paymentLinkSteps.map((step, index) => (
            <div key={step}>
              <span>Step {index + 1}</span>
              <strong>{step}</strong>
              <small>Required for controlled Whop launch.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Later automation</span>
        <h2>Automatic activation stays gated until live payment tests pass</h2>
        <div className="workspace-action-note warning" style={{ marginBottom: 14 }}>
          Do not rely on fully automatic credit activation until live Whop payment tests, duplicate-payment safeguards and idempotency checks pass.
        </div>
        <div className="admin-info-grid">
          {futureAutomationSteps.map((step, index) => (
            <div key={step}>
              <span>Future step {index + 1}</span>
              <strong>{step}</strong>
              <small>Required before full automation or future Lemon migration.</small>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
