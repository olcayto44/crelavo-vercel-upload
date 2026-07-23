import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { shareToEarnLoop } from "@/lib/growth-launch-systems";

const viralLoopSteps = [
  { title: "Invite a friend", reward: "+100 credits each", text: "Share Crelavo with a verified ecommerce seller or agency contact. Both sides can receive starter credits after signup review." },
  { title: "Bring a paid upgrade", reward: "+2,000 bonus credits", text: "When the invited user becomes a paid Business or Team subscriber, the inviter can receive bonus credits after payment and fraud review." },
  { title: "Share a watermarked preview", reward: "Manual credit review", text: "Users can share approved Made with Crelavo AI preview outputs. Rewards stay manual until watermark/export tracking is automated." },
  { title: "Submit a public case study", reward: "Higher review priority", text: "Approved before/after stories, community showcase assets or client-safe examples can unlock additional manual reward review." }
];

const viralGuardrails = [
  "No self-referrals, duplicate accounts or disposable-email reward abuse.",
  "No automatic credits before email verification, payment confirmation and review.",
  "No rewards for spam comments, fake reviews, misleading competitor claims or trademark abuse.",
  "Paid upgrade rewards require Whop/payment idempotency and cancellation/chargeback checks."
];

export default function DashboardShareToEarnPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Viral / share-to-earn loop</span>
        <h2>Turn happy users into safe distribution channels</h2>
        <p>Invite friends, share approved preview outputs and submit case studies for manual reward review. No automatic credit minting from unverified social activity.</p>
        <div className="url-action-center"><Link className="btn" href="/dashboard/partners">Open partners</Link><Link className="btn secondary" href="/dashboard/credits">Open credits</Link><Link className="btn secondary" href="/community-showcase">View showcase</Link></div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Invite-friend credit loop</span>
        <h2>Need more credits? Start with a reviewed invite</h2>
        <p style={{ color: "var(--muted)" }}>This is the API-free launch version of the referral loop. It explains the reward logic now while keeping real credit awards under manual review until referral tracking and fraud checks are connected.</p>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {viralLoopSteps.map((step) => (
            <div className="card admin-category-card" key={step.title}>
              <span className="badge">{step.reward}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
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
      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Abuse guard</span>
        <h2>Reward rules stay strict until automation is ready</h2>
        <p style={{ color: "var(--muted)" }}>Rewards remain manual until self-referral, duplicate account, suspicious IP and Whop payment idempotency checks are proven.</p>
        <ul className="feature-list">
          {viralGuardrails.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </section>
    </DashboardShell>
  );
}
