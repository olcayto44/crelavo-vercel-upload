import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { rewardCreditRules, watermarkPolicy } from "@/lib/growth";
import { shortFormGrowthSystem, socialExportPack } from "@/lib/growth-launch-systems";
import { dashboardNextBestActions, growthRewardReadiness, lifecycleNudges, retentionGrowthSummary } from "@/lib/retention-growth";

export default function DashboardGrowthPage() {
  return (
    <DashboardShell className="dashboard-sidebar-lift dashboard-postlaunch-shell">
      <section className="card">
        <span className="badge">Retention / growth hub</span>
        <h2>Earn, return and continue building with Crelavo</h2>
        <p style={{ color: "var(--muted)" }}>{retentionGrowthSummary.promise}</p>
        <p className="workspace-action-note warning">{retentionGrowthSummary.guardrail}</p>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Next best actions</span>
        <h2>Choose the next step that moves your account forward</h2>
        <div className="admin-info-grid">
          {dashboardNextBestActions.map((action) => (
            <div key={action.href}>
              <span>{action.reason}</span>
              <strong>{action.label}</strong>
              <small><Link href={action.href}>{action.href}</Link></small>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Social + shorts growth system</span>
        <h2>Export pack and short-form channels are ready for manual launch</h2>
        <div className="admin-info-grid">
          <div><span>Export targets</span><strong>{socialExportPack.length} platforms</strong><small>TikTok, Shorts, Reels, X/LinkedIn assets.</small></div>
          <div><span>Short-form plays</span><strong>{shortFormGrowthSystem.length} loops</strong><small>Proof clips, free tools, founder posts and demos.</small></div>
          <div><span>Publishing mode</span><strong>Manual first</strong><small>No auto-publish before OAuth/API approval.</small></div>
        </div>
        <div style={{ marginTop: 18 }}><Link className="btn" href="/dashboard/social-export">Open export pack</Link><Link className="btn secondary" href="/dashboard/shorts-growth" style={{ marginLeft: 10 }}>Open shorts plan</Link></div>
      </section>

      <section className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <span className="badge">Preview watermark</span>
          <h3>Free preview outputs stay shareable</h3>
          <p>Free previews can include a Crelavo preview watermark. Paid final delivery can become watermark-free once credits/payment eligibility is confirmed.</p>
          <ul>{watermarkPolicy.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </div>
        <div className="card">
          <span className="badge">Referral MVP</span>
          <h3>Referral and affiliate tracking</h3>
          <p>Referral links can track signups and first production starts while Whop remains the active payment path. Paid commission automation waits for manual Whop E2E validation.</p>
          <p className="workspace-action-note warning">Lemon is postponed. API automation comes later after the non-API launch cleanup group is complete.</p>
          <Link className="btn secondary" href="/dashboard/partners">Open partner program</Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Lifecycle nudges</span>
        <h2>How Crelavo brings users back</h2>
        <div className="admin-category-grid">
          {lifecycleNudges.map((nudge) => (
            <div className="card admin-category-card" key={nudge.stage}>
              <span className="badge">{nudge.status.replaceAll("_", " ")}</span>
              <h3>{nudge.stage}</h3>
              <p><strong>Trigger:</strong> {nudge.trigger}</p>
              <p>{nudge.message}</p>
              <Link className="btn secondary" href={nudge.href}>{nudge.primaryCta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Share-to-earn readiness</span>
        <h2>Reward credit rules remain manual-review safe</h2>
        <div className="admin-info-grid">
          {growthRewardReadiness.map((rule) => (
            <div key={rule.reward}>
              <span>{rule.status.replaceAll("_", " ")}</span>
              <strong>{rule.credits.toLocaleString()} credits</strong>
              <small>{rule.reward} · {rule.cap}</small>
            </div>
          ))}
        </div>
        <h3>Existing draft reward examples</h3>
        <div className="admin-info-grid">
          {rewardCreditRules.map((rule) => (
            <div key={rule.action}>
              <span>{rule.action}</span>
              <strong>{rule.credits.toLocaleString()} credits</strong>
              <small>{rule.limit}</small>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <Link className="btn" href="/dashboard/assistant-workspace">Start a production to share</Link>
          <Link className="btn secondary" href="/dashboard/credits" style={{ marginLeft: 10 }}>View credits</Link>
        </div>
      </section>
    </DashboardShell>
  );
}
