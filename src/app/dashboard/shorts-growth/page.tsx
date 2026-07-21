import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { shortFormGrowthSystem } from "@/lib/growth-launch-systems";

export default function DashboardShortsGrowthPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">TikTok / YouTube Shorts growth</span>
        <h2>Organic short-form launch plan</h2>
        <p>Use safe manual short-form content before paid ads: proof clips, free tool hooks, founder progress and customer-style demos.</p>
        <div className="url-action-center"><Link className="btn" href="/free-tools">Open free tools</Link><Link className="btn secondary" href="/dashboard/social-export">Open export pack</Link></div>
      </section>
      <section className="admin-category-grid shorts-growth-grid" style={{ marginTop: 20 }}>
        {shortFormGrowthSystem.map((item) => (
          <div className="card admin-category-card shorts-growth-card" key={item.stage}>
            <span className="badge">{item.cadence}</span>
            <h3>{item.stage}</h3>
            <div className="social-export-detail-list">
              <span><small>Cadence</small><strong>{item.cadence}</strong></span>
              <span><small>Content idea</small><strong>{item.idea}</strong></span>
              <span><small>Owner action</small><strong>{item.ownerAction}</strong></span>
              <span><small>Manual status</small><strong>Manual publishing only until account APIs are connected.</strong></span>
            </div>
          </div>
        ))}
      </section>
    </DashboardShell>
  );
}
