import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { premiumExpansionSystem } from "@/lib/growth-launch-systems";

export default function DashboardPremiumExpansionPage() {
  return (
    <DashboardShell>
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Premium localization / competitor analyzer</span>
        <h2>Premium expansion modules for global ecommerce and safe competitor analysis</h2>
        <p>Prepare localization, dubbing, competitor ad analysis and Growth Intelligence response briefs with clear safety rules before deeper automation.</p>
        <div className="url-action-center"><Link className="btn" href="/ai-marketplace-localization">Open localization</Link><Link className="btn secondary" href="/competitor-ad-analyzer">Open competitor analyzer</Link><Link className="btn secondary" href="/dashboard/growth-intelligence">Growth Intelligence</Link></div>
      </section>
      <section className="admin-category-grid" style={{ marginTop: 20 }}>
        {premiumExpansionSystem.map((item) => <div className="card admin-category-card" key={item.module}><span className="badge">Premium module</span><h3>{item.module}</h3><p>{item.output}</p><p className="workspace-action-note warning">{item.safety}</p></div>)}
      </section>
    </DashboardShell>
  );
}
