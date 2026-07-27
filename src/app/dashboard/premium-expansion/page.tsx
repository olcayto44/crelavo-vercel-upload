import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { adSniperV2Plan } from "@/lib/ad-sniper-v2";
import { premiumExpansionSystem } from "@/lib/growth-launch-systems";

export default function DashboardPremiumExpansionPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Premium localization / competitor analyzer</span>
        <h2>Premium expansion modules for global ecommerce and safe competitor analysis</h2>
        <p>Prepare localization, dubbing, competitor ad analysis and Growth Intelligence response briefs with clear safety rules before deeper automation.</p>
        <div className="url-action-center"><Link className="btn" href="/ai-marketplace-localization">Open localization</Link><Link className="btn secondary" href="/competitor-ad-analyzer">Open competitor analyzer</Link><Link className="btn secondary" href="/dashboard/growth-intelligence">Growth Intelligence</Link></div>
      </section>
      <section className="admin-category-grid premium-expansion-grid" style={{ marginTop: 20 }}>
        {premiumExpansionSystem.map((item) => (
          <div className="card admin-category-card premium-expansion-card" key={item.module}>
            <span className="badge">Premium module</span>
            <h3>{item.module}</h3>
            <div className="social-export-detail-list">
              <span><small>Output</small><strong>{item.output}</strong></span>
              <span><small>Safety rule</small><strong>{item.safety}</strong></span>
              <span><small>Delivery status</small><strong>Planning, brief creation and review-ready handoff are available from the dashboard.</strong></span>
            </div>
          </div>
        ))}
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">{adSniperV2Plan.name}</span>
        <h2>Reference ad analysis without competitor copying</h2>
        <p style={{ color: "var(--muted)" }}>{adSniperV2Plan.positioning}</p>
        <div className="admin-category-grid">
          <div className="card admin-category-card"><h3>Extract only structure</h3><ul>{adSniperV2Plan.extractedStructureOnly.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="card admin-category-card"><h3>Never reuse</h3><ul>{adSniperV2Plan.prohibitedReuse.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="card admin-category-card"><h3>V2 output</h3><ul>{adSniperV2Plan.outputPlan.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <p className="workspace-action-note"><strong>Rights checkbox:</strong> {adSniperV2Plan.consentCheckbox}</p>
      </section>
    </DashboardShell>
  );
}
