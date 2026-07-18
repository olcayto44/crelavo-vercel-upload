import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { DroneShootControlPanel } from "@/components/DroneShootControlPanel";

export default function DashboardDroneShootPage() {
  return (
    <DashboardShell className="dashboard-standalone-service-page">
      <section className="promo-top-layout dashboard-service-hero">
        <div>
          <span className="badge">Drone production start</span>
          <h1>Drone / Satellite Video shoot panel</h1>
          <p className="section-lead">Start the purchased drone package, prepare location and route details, and track the latest drone production request.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">Drone credit pack</span>
          <h3>Same credit logic as other top-ups</h3>
          <p>Choose a drone credit pack, confirm location or route, add map/satellite details, then start the production request from this panel.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="btn" href="/drone-credits">Buy drone package</Link>
            <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media">Edit drone brief</Link>
          </div>
        </div>
      </section>
      <DroneShootControlPanel />
    </DashboardShell>
  );
}
