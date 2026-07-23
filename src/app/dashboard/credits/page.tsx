import Link from "next/link";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { DashboardShell } from "@/components/DashboardShell";
import { creditRolloverSummaryRows, topupRolloverSummaryRows } from "@/lib/credit-rollover";
import { packages, topUpPackages } from "@/lib/data";
import { productionCreditGuide } from "@/lib/pricing";
import { productionPackages, productionTypes } from "@/lib/production";

const standalonePurchaseTypeIds = new Set(["live_sales_agent", "drone_video"]);

export default function CreditsPage() {
  return (
    <DashboardShell>
      <div className="card">
        <h2>Credits and plans</h2>
        <p style={{ color: "var(--muted)" }}>Choose a normal credit plan first. Avatar live sales plans stay separate as service plans; Drone / Satellite Video credit packs stay on a separate purchase page but add credits like other top-ups.</p>
        <p style={{ color: "var(--muted)" }}>Paid 24-hour previews include one 10-second watermarked preview video with downloads closed. Yearly plans give 12 months of access while charging for 10 months, so 2 months are free. Unused monthly subscription credits roll over while the subscription remains active, annual credits stay available during the active yearly period, and top-up credits stay separate for 12 months.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <Link className="btn secondary" href="/live-sales-credits">Open live sales plans</Link>
          <Link className="btn secondary" href="/drone-credits">Open drone packages</Link>
        </div>
      </div>

      <section className="credit-trust-strip" aria-label="Credit safety summary">
        <div>
          <span className="badge">Credit safety</span>
          <h3>Estimate first, reserve only after confirmation</h3>
          <p>Production screens show estimated credits before a job starts. Credits are reserved only when the user confirms production start.</p>
        </div>
        <div>
          <span className="badge">Balance clarity</span>
          <h3>Balance, reserved and available stay separate</h3>
          <p>Available credits mean balance minus reserved credits, so users can see what is still usable before checkout.</p>
        </div>
        <div>
          <span className="badge">Delivery honesty</span>
          <h3>Status is shown clearly</h3>
          <p>The job workspace separates planning, preview, production and delivery states so users know what is happening before credits are spent.</p>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 24 }}>
        <span className="badge">Viral credits</span>
        <h2>Need more credits? Invite a friend.</h2>
        <p style={{ color: "var(--muted)" }}>
          Share Crelavo with another Shopify seller, agency owner or ecommerce friend. Planned reward path: both users get +100 starter credits after verified signup, and the inviter can receive +2,000 bonus credits after the invited user becomes a paid Business or Team subscriber. Rewards stay review-based until automated abuse checks are connected.
        </p>
        <div className="admin-info-grid" style={{ marginTop: 14 }}>
          <div><span>Signup reward</span><strong>+100 credits each</strong><small>Email verified users only; no self-referral or duplicate-account abuse.</small></div>
          <div><span>Paid upgrade reward</span><strong>+2,000 bonus credits</strong><small>After real payment confirmation for Business or Team plans.</small></div>
          <div><span>Manual launch guardrail</span><strong>Review first</strong><small>IP/device, disposable email and suspicious referral loops must be checked.</small></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/dashboard/share-to-earn">Open share-to-earn</Link>
          <Link className="btn secondary" href="/dashboard/partners">Partner/referral area</Link>
          <Link className="btn secondary" href="/affiliate">Affiliate program</Link>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 24 }}>
        <span className="badge">Rollover rules</span>
        <h2>Unused credits do not disappear immediately</h2>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {creditRolloverSummaryRows().map((item) => (
            <div className="card admin-category-card" key={item.packageId}>
              <span className="badge">{item.packageName}</span>
              <h3>{item.monthlyCap.toLocaleString()} monthly rollover cap</h3>
              <p>{item.monthlyText}</p>
              <p>{item.yearlyText}</p>
            </div>
          ))}
          {topupRolloverSummaryRows().map((item) => (
            <div className="card admin-category-card" key={item.packageId}>
              <span className="badge">Top-up</span>
              <h3>{item.packageName}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <CreditPlansToggle plans={packages} ctaLabel="Start 24-Hour Preview" />

      <div style={{ marginTop: 24 }}>
        <CreditPlansToggle plans={topUpPackages} ctaLabel="Add credits" />
      </div>

      <section className="credit-guide-section" style={{ marginTop: 24 }}>
        <h2>Production credit guide</h2>
        <div className="grid credit-guide-grid" style={{ marginTop: 14 }}>
          {productionCreditGuide.map((item) => (
            <div className="card" key={item.name}>
              <span className="badge">{item.rate}</span>
              <h3>{item.name}</h3>
              <strong>{item.sixtySeconds}</strong>
              <p>{item.note}</p>
              <Link className="btn" href="/pricing">Start this production</Link>
            </div>
          ))}
        </div>
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Production package starting points</h2>
        <p className="section-lead">Use this guide to choose enough credits before starting website, mobile app, visual, brand, document, or admin-panel requests.</p>
        <div className="production-pricing-grid">
            {productionTypes.filter((type) => !standalonePurchaseTypeIds.has(type.id)).map((type) => (
            <div className="card production-pricing-card" key={type.id}>
              <span className="badge">{type.startingCredits > 0 ? `From ${type.startingCredits.toLocaleString()} credits` : "Service plan pricing"}</span>
              <h3>{type.label}</h3>
              <p>{type.description}</p>
              <div className="production-package-list">
                {productionPackages.filter((item) => item.productionType === type.id).map((item) => (
                  <div key={item.id}>
                    <strong>{item.name}</strong>
                    <span>{item.credits > 0 ? `${item.credits.toLocaleString()} credits` : "No included credits"}</span>
                  </div>
                ))}
              </div>
              <Link className="btn" href="/pricing">Create this</Link>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
