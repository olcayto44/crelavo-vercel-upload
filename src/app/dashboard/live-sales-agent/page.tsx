import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { LiveSalesControlCenter } from "@/components/LiveSalesControlCenter";

export default function DashboardLiveSalesAgentPage() {
  return (
    <DashboardShell className="dashboard-standalone-service-page">
      <section className="promo-top-layout dashboard-service-hero">
        <div>
          <span className="badge">Avatar live stream</span>
          <h1>AI Live Sales Agent control center</h1>
          <p className="section-lead">Manage the purchased fair-use live hours, extra setup features, scheduled live sessions and start/stop controls from one place.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">Monthly service plan</span>
          <h3>Same flow as Buy this drone package</h3>
          <p>Choose the service plan, review included hours and extras, then start the live stream without using normal credit top-up.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="btn" href="/live-sales-credits">Buy / upgrade plan</Link>
            <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20brief&category=live_sales_agent&mode=media">Edit live-agent brief</Link>
          </div>
        </div>
      </section>
      <LiveSalesControlCenter />
    </DashboardShell>
  );
}
