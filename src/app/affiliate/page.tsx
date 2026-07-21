import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PartnerApplicationForm } from "@/components/PartnerApplicationForm";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { partnerAssets, partnerAudienceSegments, partnerCommissionDefaults, partnerCreatorAssetPack, partnerLaunchChecklist, partnerPackageCommissionRules, partnerProgramPolicy, partnerWhopOptimizationPlan, partnerWorkflowStages } from "@/lib/partner-program";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";

const affiliateEarningExamples = [
  { plan: "Credit / top-up sale", price: "$25", commission: "15%", estimated: "$3.75 pending for 30 days" },
  { plan: "Standard production package", price: "$199", commission: "25%", estimated: "$49.75 pending for 30 days" },
  { plan: "Growth Intelligence plan", price: "$499", commission: "30%", estimated: "$149.70 pending for 30 days" }
];

export const metadata: Metadata = {
  title: "Crelavo Partner Program — Affiliate and Creator Rewards",
  description: "Apply for early access to the Crelavo Partner Program for AI, no-code, creator, ecommerce and agency audiences.",
  alternates: { canonical: "/affiliate" },
  openGraph: { title: "Crelavo Partner Program", description: "Early partner access for AI and no-code creators.", url: "/affiliate", type: "website" }
};

function PartnerStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/affiliate#webpage`,
        url: `${siteUrl}/affiliate`,
        name: "Crelavo Partner Program",
        description: "Early partner access for creators, AI educators, no-code reviewers, agencies and growth partners.",
        inLanguage: "en-US",
        isPartOf: { "@id": `${siteUrl}/#website` }
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Crelavo",
        url: siteUrl
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default async function AffiliatePage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <PartnerStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section tools-page affiliate-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Partner Program</span>
          <h1>Earn by introducing creators and businesses to Crelavo</h1>
          <p>Apply for early partner access if you create AI, no-code, SaaS, ecommerce, agency or creator economy content. The active launch path uses Whop payment references, partner referral codes and a controlled manual commission ledger before payout automation.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/auth/register?next=%2Faffiliate">Apply for early access</Link>
            <Link className="btn secondary" href="/pricing">View pricing</Link>
            <Link className="btn secondary" href="/free-tools">Try free tools</Link>
          </div>
        </section>

        <section className="admin-info-grid" style={{ marginTop: 20 }}>
          <div className="affiliate-tone-warm"><span>Draft commission</span><strong>{partnerCommissionDefaults.plannedRange}</strong><small>Final percent set before launch</small></div>
          <div className="affiliate-tone-cyan"><span>Launch mode</span><strong>Early access</strong><small>Applications first; 30-day hold before payout review</small></div>
          <div className="affiliate-tone-purple"><span>Best channels</span><strong>TikTok + YouTube</strong><small>AI, no-code and product content</small></div>
          <div className="affiliate-tone-blue"><span>Tracking</span><strong>Whop + ledger</strong><small>Referral codes, Whop references and 30-day hold</small></div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Whop launch path</span>
          <h2>Partner tracking starts with Whop references and a manual ledger</h2>
          <p style={{ color: "var(--muted)" }}>Crelavo is using Whop as the active payment path. Partner payouts are reviewed manually after the 30-day hold; Lemon is not part of the current partner launch.</p>
          <div className="admin-category-grid">
            {partnerWhopOptimizationPlan.slice(0, 4).map((item) => (
              <div className="card admin-category-card" key={item.title}>
                <span className="badge">{item.status.replaceAll("_", " ")}</span>
                <h3>{item.title}</h3>
                <p>{item.action}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Creator asset pack</span>
          <h2>Ready-to-use angles for approved partners</h2>
          <div className="admin-category-grid">
            {partnerCreatorAssetPack.map((asset) => (
              <div className="card admin-category-card" key={asset.asset}>
                <span className="badge">{asset.target}</span>
                <h3>{asset.asset}</h3>
                <p>{asset.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Partner earnings</span>
          <h2>Growth Intelligence creates higher recurring affiliate value</h2>
          <p style={{ color: "var(--muted)" }}>The numbers below show the launch-safe commission rules: 15% credit/top-up, 25% standard production, 30% Growth Intelligence. Every commission stays pending for 30 days and is cancelled if the sale is refunded, cancelled, chargebacked, unpaid or abuse/fraud flagged.</p>
          <div className="admin-info-grid">
            {affiliateEarningExamples.map((item) => (
              <div key={item.plan}>
                <span>{item.plan}</span>
                <strong>{item.estimated}</strong>
                <small>{item.price} · {item.commission}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">30-day payout hold</span>
          <h2>Affiliate earnings are paid only after refund/cancellation risk clears</h2>
          <p style={{ color: "var(--muted)" }}>{partnerCommissionDefaults.payoutSchedule}</p>
          <div className="admin-info-grid">
            <div><span>Attribution window</span><strong>{partnerProgramPolicy.attributionWindowDays} days</strong><small>Referral click/code must be inside this window</small></div>
            <div><span>Payout hold</span><strong>{partnerProgramPolicy.payoutHoldDays} days</strong><small>Commissions stay pending before payable review</small></div>
            <div><span>Minimum payout</span><strong>${partnerProgramPolicy.minimumPayoutUsd}</strong><small>Payable balance must reach minimum</small></div>
            <div><span>Refund/cancel rule</span><strong>No commission</strong><small>Refunded, cancelled, chargebacked or unpaid sales are void</small></div>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Eligibility rules</span>
          <h2>What partners must know before promoting Crelavo</h2>
          <p style={{ color: "var(--muted)" }}>{partnerProgramPolicy.partnerFacingSummary}</p>
          <ul>{partnerProgramPolicy.payoutEligibility.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Variable commission</span>
          <h2>Commission changes by package margin and delivery cost</h2>
          <p style={{ color: "var(--muted)" }}>Affiliate commission is not one fixed rate for every product. Lower-cost or high-margin recurring services can receive stronger rates, while custom or high production-cost packages may use lower commission or manual approval.</p>
          <div className="admin-category-grid">
            {partnerPackageCommissionRules.map((rule) => (
              <div className="card admin-category-card" key={rule.packageGroup}>
                <span className="badge">{rule.defaultPercent}% default</span>
                <h3>{rule.packageGroup}</h3>
                <p><strong>Examples:</strong> {rule.examplePackages.join(", ")}</p>
                <p>{rule.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-category-grid" style={{ marginTop: 20 }}>
          {partnerAudienceSegments.map((segment, index) => (
            <div className={`card admin-category-card affiliate-card-tone-${index % 5}`} key={segment}>
              <span className="badge">Ideal partner</span>
              <h2>{segment}</h2>
              <p>Creators with an audience that wants faster websites, apps, ecommerce assets, AI videos, brand kits, Growth Intelligence reports or production-ready delivery packages.</p>
            </div>
          ))}
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">What partners will get</span>
          <h2>Prepared now, activated after tracking and payout API setup</h2>
          <div className="admin-category-grid">
            {partnerAssets.map((asset, index) => (
              <div className={`card admin-category-card affiliate-card-tone-${(index + 2) % 5}`} key={asset.title}>
                <span className="badge">{asset.status}</span>
                <h3>{asset.title}</h3>
                <p>{asset.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Workflow</span>
          <h2>Partner journey from application to commission review</h2>
          <div className="admin-info-grid">
            {partnerWorkflowStages.map((stage, index) => (
              <div className={`affiliate-card-tone-${index % 5}`} key={stage}><span>Step {index + 1}</span><strong>{stage}</strong><small>{index < 4 ? "Ready before API" : "Activated after tracking/payout setup"}</small></div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" id="apply" style={{ marginTop: 20 }}>
          <span className="badge">Apply</span>
          <h2>Apply for early partner access</h2>
          <p style={{ color: "var(--muted)" }}>This form is ready for intake. Email delivery starts after Resend/env setup. Commission payout starts only after tracking and payout provider testing.</p>
          <PartnerApplicationForm />
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Before live launch</span>
          <h2>What remains after this page is ready</h2>
          <ul>{partnerLaunchChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </main>
    </>
  );
}
