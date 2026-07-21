import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { shareToEarnLoop } from "@/lib/growth-launch-systems";

export default function DashboardShareToEarnPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Viral / share-to-earn loop</span>
        <h2>Manual-review reward loop for safe launch growth</h2>
        <p>Reward sharing, invites and case studies only after review. No automatic credit minting from unverified social activity.</p>
        <div className="url-action-center"><Link className="btn" href="/dashboard/partners">Open partners</Link><Link className="btn secondary" href="/dashboard/credits">Open credits</Link></div>
      </section>
      <section className="admin-category-grid share-earn-grid" style={{ marginTop: 20 }}>
        {shareToEarnLoop.map((item) => (
          <div className="card admin-category-card share-earn-card" key={item.action}>
            <span className="badge">{item.reward.toLocaleString()} credits</span>
            <h3>{item.action}</h3>
            <div className="social-export-detail-list">
              <span><small>Reward</small><strong>{item.reward.toLocaleString()} credits</strong></span>
              <span><small>Cap</small><strong>{item.cap}</strong></span>
              <span><small>Review rule</small><strong>{item.review}</strong></span>
              <span><small>Safety status</small><strong>Manual review only; no automatic credit minting from unverified social activity.</strong></span>
            </div>
          </div>
        ))}
      </section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Abuse guard</span><p>Rewards remain manual until self-referral, duplicate account, suspicious IP and Whop payment idempotency checks are proven.</p></section>
    </DashboardShell>
  );
}
