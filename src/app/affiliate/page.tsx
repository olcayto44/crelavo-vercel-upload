import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { PartnerApplicationForm } from "@/components/PartnerApplicationForm";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { partnerAssets, partnerCommissionDefaults, partnerCreatorAssetPack, partnerPackageCommissionRules, partnerProgramPolicy, partnerWorkflowStages } from "@/lib/partner-program";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";

const affiliateEarningExamples = [
  { plan: "Credit / top-up sale", price: "$25", commission: "15%", estimated: "$3.75 pending for 30 days" },
  { plan: "Standard production package", price: "$199", commission: "25%", estimated: "$49.75 pending for 30 days" },
  { plan: "Growth Intelligence plan", price: "$499", commission: "30%", estimated: "$149.70 pending for 30 days" }
];

const partnerAudienceCopy = [
  { title: "AI tool reviewers", text: "Creators who review AI tools and production studios, and whose audience wants faster video, website, and campaign output." },
  { title: "No-code educators", text: "Educators who teach no-code, websites, or apps and want a studio their students can actually ship from." },
  { title: "TikTok AI creators", text: "Short-form creators who demo AI products, ads, and ecommerce workflows on TikTok." },
  { title: "YouTube Shorts creators", text: "Shorts creators who show product demos, AI workflows, and launch recaps." },
  { title: "SaaS and startup creators", text: "Founders and SaaS creators who need product videos, landing pages, and launch assets." },
  { title: "Ecommerce growth creators", text: "Ecommerce creators who turn products into ads, UGC-style clips, and store campaigns." },
  { title: "Agency owners and consultants", text: "Agencies that want an AI production layer for client videos, sites, apps, and brand kits." }
];

const publicPartnerPackageCommissionRules = partnerPackageCommissionRules.map((rule) => ({
  ...rule,
  packageGroup: rule.packageGroup.replaceAll("12,000 credits", "9,000 credits"),
  examplePackages: rule.examplePackages.map((item) => item.replaceAll("12,000 credits", "9,000 credits")),
  note: rule.note
    .replaceAll("12,000 credits", "9,000 credits")
    .replace("Highest launch default is 30%. Recurring is off at launch; admin can manually review Growth Intelligence recurring later.", "Highest partner rate is 30% on Growth Intelligence. Commission stays pending for 30 days.")
    .replace("High delivery-cost packages need lower commission or manual approval to protect margin; refund/cancel always voids commission.", "Custom and high-delivery packages may use 15% or manual approval. Refunds and cancellations void commission.")
}));

const publicPartnerAssets = partnerAssets.map((asset) => ({
  ...asset,
  status: asset.status === "API-ready placeholder" ? "Included" : asset.status === "Waiting for final percent" ? "Published rates" : asset.status,
  detail: asset.detail === "Each approved partner will receive a unique referral code/link once tracking is connected."
    ? "Each approved partner receives a unique referral code to share on Crelavo pages."
    : asset.detail === "The structure is ready; final public percent is set when payout/API provider is selected."
      ? "15% credits, 25% production, 30% Growth Intelligence. Pending 30 days."
      : asset.detail
}));


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
      <Header navLinks={siteContent.navLinks} /><InnerMobileNav />
      <main className="container section tools-page affiliate-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Partner Program</span>
          <h1>Earn by introducing creators and businesses to Crelavo</h1>
          <p>Apply for early partner access if you create AI, no-code, SaaS, ecommerce, agency or creator economy content. Approved partners share Crelavo with a referral code. Commission is reviewed against paid Whop purchases after a 30-day hold.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/auth/register?next=%2Faffiliate">Apply for early access</Link>
            <Link className="btn secondary" href="/pricing">View pricing</Link>
            <Link className="btn secondary" href="/free-tools">Try free tools</Link>
          </div>
        </section>

        <section className="admin-info-grid" style={{ marginTop: 20 }}>
          <div className="affiliate-tone-warm"><span>Commission</span><strong>15-30% by product</strong><small>Credits 15%. Production 25%. Growth Intelligence 30%.</small></div>
          <div className="affiliate-tone-cyan"><span>Launch mode</span><strong>Early access</strong><small>Applications first; 30-day hold before payout review</small></div>
          <div className="affiliate-tone-purple"><span>Best channels</span><strong>TikTok + YouTube</strong><small>AI, no-code and product content</small></div>
          <div className="affiliate-tone-blue"><span>Tracking</span><strong>Whop tracking</strong><small>Referral codes, Whop references and 30-day hold</small></div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">How it works</span>
          <h2>Partner tracking uses Whop payments and your referral code</h2>
          <p style={{ color: "var(--muted)" }}>Crelavo checks out on Whop. After a paid purchase, commission stays pending for 30 days. Eligible payouts are then reviewed. Minimum payout is $50.</p>
          <div className="admin-category-grid">
            <div className="card admin-category-card"><span className="badge">Share</span><h3>Referral code</h3><p>Approved partners share Crelavo pages with a unique referral code.</p></div>
            <div className="card admin-category-card"><span className="badge">Paid</span><h3>Whop purchase</h3><p>Commission is tied to a paid Whop payment, not a signup.</p></div>
            <div className="card admin-category-card"><span className="badge">Pages</span><h3>Where to share</h3><p>Home, pricing, free tools, and Growth Intelligence work well with your code.</p></div>
            <div className="card admin-category-card"><span className="badge">Assets</span><h3>Creator pack</h3><p>Approved partners get hooks, demo scripts, landing URLs, and offer copy.</p></div>
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
          <ul>{partnerProgramPolicy.payoutEligibility.map((item) => <li key={item}>{item === "Admin/finance can manually pause, reject or override a commission before payout." ? "Crelavo may pause or reject a commission if the sale is unpaid, refunded, or flagged for abuse." : item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Variable commission</span>
          <h2>Commission changes by package margin and delivery cost</h2>
          <p style={{ color: "var(--muted)" }}>Affiliate commission is not one fixed rate for every product. Lower-cost or high-margin recurring services can receive stronger rates, while custom or high production-cost packages may use lower commission or manual approval.</p>
          <div className="admin-category-grid">
            {publicPartnerPackageCommissionRules.map((rule) => (
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
          {partnerAudienceCopy.map((segment, index) => (
            <div className={`card admin-category-card affiliate-card-tone-${index % 5}`} key={segment.title}>
              <span className="badge">Ideal partner</span>
              <h2>{segment.title}</h2>
              <p>{segment.text}</p>
            </div>
          ))}
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">What partners will get</span>
          <h2>What approved partners receive</h2>
          <div className="admin-category-grid">
            {publicPartnerAssets.map((asset, index) => (
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
              <div className={`affiliate-card-tone-${index % 5}`} key={stage}><span>Step {index + 1}</span><strong>{stage}</strong><small>{index < 4 ? "Open now" : "After approval"}</small></div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" id="apply" style={{ marginTop: 20 }}>
          <span className="badge">Apply</span>
          <h2>Apply for early partner access</h2>
          <p style={{ color: "var(--muted)" }}>Send your channel details. We email an approval or rejection after review. Payouts start after the 30-day hold and a $50 minimum.</p>
          <PartnerApplicationForm />
        </section>
      </main>
    </>
  );
}
