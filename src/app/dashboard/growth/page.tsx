import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { rewardCreditRules, watermarkPolicy } from "@/lib/growth";
import { shortFormGrowthSystem, socialExportPack } from "@/lib/growth-launch-systems";
import { dashboardNextBestActions, growthRewardReadiness, lifecycleNudges, retentionGrowthSummary } from "@/lib/retention-growth";

const viralGrowthCommandCards = [
  { title: "Invite-friend credits", status: "Manual review", text: "+100 starter credits for both verified users and +2,000 bonus credits after a referred Business/Team upgrade, once automation is ready." },
  { title: "Watermarked preview sharing", status: "Preview loop", text: "Approved preview outputs can carry Made with Crelavo AI branding so small sellers share Crelavo while larger teams upgrade for clean exports." },
  { title: "Partner and affiliate path", status: "Tracked links", text: "Approved partners use referral links and campaign assets; commissions remain finance-reviewed with hold, refund and chargeback checks." },
  { title: "Community showcase", status: "Proof loop", text: "Approved examples can become public proof, reusable templates and case-study fuel without exposing private client assets." }
];

export default function DashboardGrowthPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="card">
        <span className="badge">Retention / growth hub</span>
        <h2>Earn, return and continue building with Crelavo</h2>
        <p style={{ color: "var(--muted)" }}>{retentionGrowthSummary.promise}</p>
        <p className="workspace-action-note warning">{retentionGrowthSummary.guardrail}</p>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Viral Growth Command Center</span>
        <h2>Use every happy user as a safe growth channel</h2>
        <p style={{ color: "var(--muted)" }}>This is the dashboard-level map for referral, watermark, affiliate and showcase loops. It keeps the funnel visible now, while real credit awards remain manual until API tracking and fraud checks are connected.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {viralGrowthCommandCards.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href="/dashboard/share-to-earn">Open share-to-earn</Link>
          <Link className="btn secondary" href="/dashboard/partners">Open partners</Link>
          <Link className="btn secondary" href="/community-showcase">View showcase</Link>
        </div>
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
          <span className="badge">Referral rewards</span>
          <h3>Referral and affiliate tracking</h3>
          <p>Referral links can track signups and first production starts while partner rewards stay under finance review.</p>
          <p className="workspace-action-note warning">Commission review uses payment tracking, fraud checks and payout approval rules before any payout is released.</p>
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
