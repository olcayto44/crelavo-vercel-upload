import Link from "next/link";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { DashboardShell } from "@/components/DashboardShell";
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
        <p style={{ color: "var(--muted)" }}>Paid 24-hour previews include one 10-second watermarked preview video with downloads closed. Yearly plans give 12 months of access while charging for 10 months, so 2 months are free.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <Link className="btn secondary" href="/live-sales-credits">Open live sales plans</Link>
          <Link className="btn secondary" href="/drone-credits">Open drone packages</Link>
        </div>
      </div>

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
