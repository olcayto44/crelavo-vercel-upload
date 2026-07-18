import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { shareToEarnLoop } from "@/lib/growth-launch-systems";

export default function DashboardShareToEarnPage() {
  return (
    <DashboardShell>
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Viral / share-to-earn loop</span>
        <h2>Manual-review reward loop for safe launch growth</h2>
        <p>Reward sharing, invites and case studies only after review. No automatic credit minting from unverified social activity.</p>
        <div className="url-action-center"><Link className="btn" href="/dashboard/partners">Open partners</Link><Link className="btn secondary" href="/dashboard/credits">Open credits</Link></div>
      </section>
      <section className="admin-category-grid" style={{ marginTop: 20 }}>
        {shareToEarnLoop.map((item) => <div className="card admin-category-card" key={item.action}><span className="badge">{item.reward.toLocaleString()} credits</span><h3>{item.action}</h3><p><strong>Cap:</strong> {item.cap}</p><p>{item.review}</p></div>)}
      </section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Abuse guard</span><p>Rewards remain manual until self-referral, duplicate account, suspicious IP and Whop payment idempotency checks are proven.</p></section>
    </DashboardShell>
  );
}
