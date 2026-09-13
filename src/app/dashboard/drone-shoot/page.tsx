import { DashboardShell } from "@/components/DashboardShell";

export default function DashboardDroneShootPage() {
  return (
    <DashboardShell className="dashboard-standalone-service-page">
      <section className="promo-top-layout dashboard-service-hero">
        <div>
          <span className="badge">Create in Assistant</span>
          <h1>Drone / Satellite Video</h1>
          <p className="section-lead">Location, coordinates, route, shot and camera live in Assistant. Buy a one-time pack, then shoot there. Not a physical UAV flight.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">One-time credits</span>
          <h3>Packs stay on the drone page</h3>
          <p>Drone Location $299 · 2,600 credits. Satellite + Drone $699 · 6,800 credits. No monthly renewal.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <a className="btn" href="/dashboard/assistant-workspace?type=drone">Open Drone in Assistant</a>
            <a className="btn secondary" href="/drone-credits">Buy drone pack</a>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
