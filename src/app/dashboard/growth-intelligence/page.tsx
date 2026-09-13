import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { GrowthIntelligenceControlPanel } from "@/components/GrowthIntelligenceControlPanel";

export default function DashboardGrowthIntelligencePage() {
  return (
    <DashboardShell className="dashboard-standalone-service-page">
      <section className="promo-top-layout dashboard-service-hero">
        <div>
          <span className="badge">Growth Intelligence</span>
          <h1>AI competitor monitoring control center</h1>
          <p className="section-lead">Prepare competitor URLs, public market sources, report settings and alert channels for the market intelligence workflow.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">Service workflow</span>
          <h3>{"Monitoring \u2192 report \u2192 campaign action"}</h3>
          <p>Prepare the customer-side brief here. Final report delivery stays entitlement and review gated.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="btn" href="/growth-intelligence">View public plans</Link>
          </div>
        </div>
      </section>
      <GrowthIntelligenceControlPanel />
    </DashboardShell>
  );
}
