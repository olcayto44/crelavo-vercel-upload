import { AdminProductionQaPanel } from "@/components/AdminProductionQaPanel";
import { AdminShell } from "@/components/AdminShell";
import { finalQaLaunchHardeningPlan, productionFlowExpansionPlan } from "@/lib/launch-ops-readiness";

export default function AdminProductionQaPage() {
  return (
    <AdminShell
      title="Production Quality QA"
      description="Run operational QA across recent productions: quality metadata, delivery package, legal snapshot, cost/output plan and ready-state delivery links."
    >
      <section className="card admin-wide-card" style={{ marginBottom: 20 }}>
        <span className="badge">13-14 · Production flow expansion</span>
        <h2>Social/UGC and project production flows stay review-gated</h2>
        <div className="admin-grid two-col" style={{ marginTop: 16 }}>
          <div className="mini-card"><h3>Social / UGC flows</h3><ul>{productionFlowExpansionPlan.socialUgcFlows.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="mini-card"><h3>Website / mobile / ecommerce flows</h3><ul>{productionFlowExpansionPlan.projectProductionFlows.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <ul>{productionFlowExpansionPlan.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="card admin-wide-card" style={{ marginBottom: 20 }}>
        <span className="badge">15 · Final QA / launch hardening</span>
        <h2>Stop rules before public launch or provider scale</h2>
        <div className="admin-info-grid">
          {finalQaLaunchHardeningPlan.checkpoints.map((item) => <div key={item}><span>Checkpoint</span><strong>{item}</strong><small>{finalQaLaunchHardeningPlan.status}</small></div>)}
        </div>
        <ul>{finalQaLaunchHardeningPlan.stopRules.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <AdminProductionQaPanel />
    </AdminShell>
  );
}
