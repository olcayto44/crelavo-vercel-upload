import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";

const financeGuardrails = [
  "Payment API purchase events count as revenue; manual credit activations stay visible but separate.",
  "Reserved credits are shown as exposure until a production is finalized, refunded or sent to admin review.",
  "Provider/API cost is estimated from production profit metadata when available, with target cost ratio fallback.",
  "Real provider spend should remain blocked until payment, credit reservation and provider readiness checks pass.",
  "Lemon remains postponed; Whop is the active payment path for finance reconciliation."
];

export default function AdminFinancePage() {
  return (
    <AdminShell title="Finance Dashboard" description="Revenue, provider spend, reserved-credit exposure, production margin and manual payment activation review.">
      <section className="card admin-wide-card">
        <span className="badge">Revenue / provider spend</span>
        <h2>Finance overview for launch-safe production spend</h2>
        <p style={{ color: "var(--muted)" }}>
          This page separates real payment API revenue from manual credit activations, tracks reserved credits, estimates provider/API spend, and keeps production margin visible before scaling traffic or provider usage.
        </p>
        <div className="admin-info-grid">
          <div><span>Revenue source</span><strong>Payment events</strong><small>Credit purchase events only; manual activations are separate</small></div>
          <div><span>Spend source</span><strong>Production credits</strong><small>Reserved/spent credits and provider cost estimates</small></div>
          <div><span>Provider guard</span><strong>Payment first</strong><small>No live provider job without credit/payment eligibility</small></div>
          <div><span>Payment mode</span><strong>Whop active</strong><small>Lemon integration stays last</small></div>
        </div>
      </section>

      <section className="admin-panel-section"><AdminFinanceCards /></section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Finance guardrails</span>
        <h2>What must be checked before scaling</h2>
        <ul>{financeGuardrails.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="url-action-center" style={{ marginTop: 14 }}>
          <Link className="btn" href="/admin/payments">Open automated payments</Link>
          <Link className="btn secondary" href="/admin/credits">Open credit operations</Link>
          <Link className="btn secondary" href="/admin/api-guard">Open API guard</Link>
          <Link className="btn secondary" href="/admin/providers">Open provider readiness</Link>
        </div>
      </section>
    </AdminShell>
  );
}
