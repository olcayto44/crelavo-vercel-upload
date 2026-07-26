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
          <p className="section-lead">Prepare the competitor URLs, public market sources, report settings and alert channels for the autonomous market intelligence workflow.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">Provider-ready service workflow</span>
          <h3>Monitoring → report → campaign action</h3>
          <p>This dashboard stores the customer-side brief and is ready for DataForSEO, Apify, Google Maps and LLM-backed report prep when provider keys are configured; final report delivery stays entitlement/review gated.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="btn" href="/growth-intelligence">View plans</Link>
            <Link className="btn secondary" href="/admin/sample-videos">Admin demo video</Link>
          </div>
        </div>
      </section>
      <GrowthIntelligenceControlPanel />
    </DashboardShell>
  );
}
