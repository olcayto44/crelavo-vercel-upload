import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { shortFormGrowthSystem } from "@/lib/growth-launch-systems";

export default function DashboardShortsGrowthPage() {
  return (
    <DashboardShell>
      <section className="production-hero-card compact-production-hero">
        <span className="badge">TikTok / YouTube Shorts growth</span>
        <h2>Organic short-form launch plan</h2>
        <p>Use safe manual short-form content before paid ads: proof clips, free tool hooks, founder progress and customer-style demos.</p>
        <div className="url-action-center"><Link className="btn" href="/free-tools">Open free tools</Link><Link className="btn secondary" href="/dashboard/social-export">Open export pack</Link></div>
      </section>
      <section className="admin-category-grid" style={{ marginTop: 20 }}>
        {shortFormGrowthSystem.map((item) => <div className="card admin-category-card" key={item.stage}><span className="badge">{item.cadence}</span><h3>{item.stage}</h3><p>{item.idea}</p><p><strong>Action:</strong> {item.ownerAction}</p></div>)}
      </section>
    </DashboardShell>
  );
}
