import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";
import { productionReadinessScorePlan, providerCostLedgerPlan, providerQueueConcurrencyGuard } from "@/lib/launch-ops-readiness";

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
        <span className="badge">Production readiness / credit burn</span>
        <h2>Production Readiness Score and Credit Burn Forecast</h2>
        <p style={{ color: "var(--muted)" }}>
          Score status: {productionReadinessScorePlan.status}. Finance should keep payment, reserve/spend, provider cost, queue pressure and forced-failure proof visible before paid traffic scales.
        </p>
        <div className="admin-info-grid">
          <div><span>Single-job cap</span><strong>{providerQueueConcurrencyGuard.defaults.maxSingleJobCredits.toLocaleString()} credits</strong><small>Block oversized jobs before provider spend</small></div>
          <div><span>Daily user cap</span><strong>{providerQueueConcurrencyGuard.defaults.dailyUserProductionCount} jobs</strong><small>Launch-safe production count limit</small></div>
          <div><span>Queue pressure</span><strong>{providerQueueConcurrencyGuard.defaults.maxConcurrentProviderJobs} concurrent jobs</strong><small>Raise only after controlled provider smoke tests pass</small></div>
          <div><span>Retry/backoff</span><strong>{providerQueueConcurrencyGuard.defaults.maxProviderRetries} retries</strong><small>{providerQueueConcurrencyGuard.defaults.backoffSeconds.join(" / ")} sec forecast windows</small></div>
        </div>
        <div className="admin-grid two-col" style={{ marginTop: 16 }}>
          <div className="mini-card">
            <h3>Score inputs</h3>
            <ul>{productionReadinessScorePlan.scoreInputs.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="mini-card">
            <h3>Score bands</h3>
            <ul>{productionReadinessScorePlan.scoreBands.map((item) => <li key={item.band}><strong>{item.band}</strong>: {item.meaning}</li>)}</ul>
          </div>
        </div>
        <div className="mini-card" style={{ marginTop: 16 }}>
          <h3>Credit Burn Forecast rules</h3>
          <ul>{productionReadinessScorePlan.creditBurnForecast.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Provider Cost Ledger / margin</span>
        <h2>Actual provider cost and margin tracking</h2>
        <p style={{ color: "var(--muted)" }}>{providerCostLedgerPlan.reviewGate}</p>
        <div className="admin-info-grid">
          {providerCostLedgerPlan.fields.map((field) => <div key={field}><span>Ledger field</span><strong>{field}</strong><small>{providerCostLedgerPlan.status}</small></div>)}
        </div>
        <ul>{providerCostLedgerPlan.marginRules.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

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
