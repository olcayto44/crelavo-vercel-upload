import Link from "next/link";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { productionPackageHref } from "@/lib/assistant-links";
import { dronePurchasePackages, growthIntelligencePlans, liveSalesServicePlans, packages, topUpPackages } from "@/lib/data";
import { productionCreditGuide } from "@/lib/pricing";
import { productionPackages, productionTypes } from "@/lib/production";
import { PricingStructuredData } from "@/components/PricingStructuredData";

const standalonePurchaseTypeIds = new Set(["live_sales_agent", "drone_video"]);

const deliveryFormats = [
  { title: "Preview & review links", text: "Shareable preview pages for video, website, app, campaign or brand-file outputs before final delivery.", tone: "pricing-delivery-cyan" },
  { title: "Final ZIP package", text: "A packaged delivery folder for completed assets, exports, source files, README notes and client handoff material.", tone: "pricing-delivery-purple" },
  { title: "Source files", text: "Project source can include code, editable documents, captions, prompt notes, scene plans, brand files and structured assets.", tone: "pricing-delivery-blue" },
  { title: "Setup guide / README", text: "Step-by-step setup notes for websites, apps, SaaS demos, automation packs and reusable production files.", tone: "pricing-delivery-green" },
  { title: "Export-ready media", text: "Platform-ready videos, images, thumbnails, captions, subtitles, ratios and publish notes for social or campaign use.", tone: "pricing-delivery-warm" },
  { title: "Revision path", text: "Clear delivery status, requested changes, admin notes and revision-ready output tracking from the workspace.", tone: "pricing-delivery-pink" }
];

const deliveryLocations = [
  "Customer dashboard delivery panel",
  "Preview link before final approval",
  "Final download buttons for ZIP/source/README",
  "Admin-managed production and delivery status",
  "Manual handoff links when a custom project needs external storage",
  "Future API/webhook delivery for connected workflows"
];

type PublicPricingRow = {
  name: string;
  price: string;
  billing: string;
  credits: string;
  setupFee?: string;
  notes: string;
};

const publicPricingRows: PublicPricingRow[] = [
  ...packages.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}/mo · $${plan.priceUsd * 10}/yr`,
    billing: "Monthly plan or yearly plan with 2 months free",
    credits: `${plan.credits.toLocaleString()} credits monthly · ${(plan.credits * 12).toLocaleString()} credits yearly`,
    setupFee: `$${plan.setupFeeUsd} 24-hour preview setup fee`,
    notes: "Preview includes one 10-second watermarked video. Downloads are closed during preview and open only after the selected subscription starts."
  })),
  ...topUpPackages.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}`,
    billing: "One-time purchase",
    credits: `${plan.credits.toLocaleString()} credits`,
    notes: "Does not renew automatically."
  })),
  ...liveSalesServicePlans.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}/mo`,
    billing: "Monthly service plan",
    credits: "No included credits",
    setupFee: `$${plan.setupFeeUsd} setup fee`,
    notes: `${plan.fairUseHours} fair-use live hours. Extra provider/API usage is pay-as-you-go after cost analysis.`
  })),
  ...growthIntelligencePlans.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}/mo`,
    billing: "Monthly intelligence plan",
    credits: "No included credits",
    setupFee: `$${plan.setupFeeUsd} setup fee`,
    notes: `${plan.competitorLimit}; ${plan.monitoringFrequency}. Dashboard report delivery.`
  })),
  ...dronePurchasePackages.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}`,
    billing: "One-time drone credit purchase",
    credits: `${plan.credits.toLocaleString()} credits`,
    setupFee: `$${plan.setupFeeUsd} setup fee`,
    notes: "Does not renew automatically. Adds credits after payment confirmation."
  }))
];

export default async function PricingPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <PricingStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page">
        <section className="promo-top-layout">
          <div>
            <span className="badge">Pricing & credits</span>
            <h1>Credit packages for normal AI production</h1>
            <p className="section-lead">
              Normal credits are used for standard production requests through monthly or yearly subscription plans with a paid 24-hour preview. Avatar live sales plans have separate service pricing; Drone / Satellite Video uses normal credit logic but stays on its own purchase page.
            </p>
          </div>
          <div className="promo-corner-slot pricing-promo-slot"><CampaignPromoSlot /></div>
        </section>

        <section className="pricing-delivery-section" style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">Delivery options</span>
              <h2>What your credits can unlock and how Crelavo can deliver it</h2>
              <p className="section-lead">
                Crelavo is being prepared as a production delivery system, not a simple prompt tool. Depending on the package, the output can be delivered as preview links, final files, source packages, documentation, export-ready media and admin-tracked revision assets.
              </p>
            </div>
            <Link className="btn secondary" href="/dashboard/assistant-workspace">Plan a delivery</Link>
          </div>
          <div className="pricing-delivery-grid">
            {deliveryFormats.map((item) => (
              <div className={`pricing-delivery-card ${item.tone}`} key={item.title}>
                <span>{item.title}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="pricing-delivery-locations">
            <strong>Supported delivery locations and handoff paths</strong>
            <div>
              {deliveryLocations.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 28 }}>
          <Link className="card clickable-credit-card" href="/live-sales-credits">
            <span className="badge">Separate service plans</span>
            <h3>AI Live Sales Agent</h3>
            <p>Monthly avatar live sales plans with 10h, 40h or 120h fair-use live hours. No included credits.</p>
            <span className="btn">Open live sales plans</span>
          </Link>
          <Link className="card clickable-credit-card" href="/drone-credits">
            <span className="badge">Separate credit packs</span>
            <h3>Drone / Satellite Video</h3>
            <p>One-time drone and map/satellite credit packs with their own sales cards, using the same credit activation logic.</p>
            <span className="btn">Open drone credit packs</span>
          </Link>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Popular ecommerce workflows</span>
          <h2>Choose a product-link or live commerce path</h2>
          <p className="section-lead">These high-intent workflows connect pricing to the pages buyers usually search for before purchasing credits or a service plan.</p>
          <div className="plan-feature-groups">
            <Link href="/ai-product-video-generator"><b>AI Product Video Generator</b><small>Product URL to preview and final video workflow</small></Link>
            <Link href="/shopify-product-link-to-ad-video"><b>Shopify Product Link to Ad Video</b><small>Shopify URL to short-form ad creative</small></Link>
            <Link href="/amazon-product-ad-video"><b>Amazon Product Ad Video</b><small>Marketplace product video planning</small></Link>
            <Link href="/trendyol-product-video"><b>Trendyol Product Video</b><small>Localized ecommerce product videos</small></Link>
            <Link href="/tiktok-shop-ai-live-sales-agent"><b>TikTok Shop AI Live Sales Agent</b><small>Live commerce service plans and safe claims</small></Link>
            <Link href="/ai-ecommerce-campaign-generator"><b>AI Ecommerce Campaign Generator</b><small>Product-link campaigns with video, copy and assets</small></Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Public USD pricing</span>
          <h2>Clear plans, credits and preview fees</h2>
          <p className="section-lead">Choose a subscription or one-time credit pack. Prices are shown in USD, yearly plans include 2 months free, and paid previews include one 10-second watermarked video with downloads closed before full access starts.</p>
          <div className="public-pricing-card-grid">
            {publicPricingRows.map((row) => (
              <article className="public-pricing-card" key={`${row.name}-${row.price}`}>
                <div className="public-pricing-card-head">
                  <h3>{row.name}</h3>
                  <strong>{row.price}</strong>
                </div>
                <dl>
                  <div>
                    <dt>Billing</dt>
                    <dd>{row.billing}</dd>
                  </div>
                  <div>
                    <dt>Credits / access</dt>
                    <dd>{row.credits}</dd>
                  </div>
                  <div>
                    <dt>Setup / preview</dt>
                    <dd>{row.setupFee ?? "No setup fee"}</dd>
                  </div>
                  <div>
                    <dt>Notes</dt>
                    <dd>{row.notes}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <CreditPlansToggle plans={packages} ctaLabel="Start 24-Hour Preview" />

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Partner Program</span>
          <h2>Are you an AI or no-code creator?</h2>
          <p style={{ color: "var(--muted)" }}>Apply for early partner access now. Referral links, creator assets and commission terms are being prepared so the program can start quickly after tracking and payout APIs are connected.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link className="btn" href="/affiliate">Join the partner program</Link>
            <Link className="btn secondary" href="/dashboard/growth">View referral rewards</Link>
          </div>
        </section>

        <div style={{ marginTop: 28 }}>
          <CreditPlansToggle plans={topUpPackages} ctaLabel="Add top-up credits" />
        </div>

        <section className="credit-guide-section" style={{ marginTop: 28 }}>
          <h2>Production credit guide</h2>
          <div className="grid credit-guide-grid" style={{ marginTop: 14 }}>
            {productionCreditGuide.map((item, index) => (
              <div className={`card credit-guide-card credit-guide-tone-${index % 5}`} key={item.name}>
                <span className="badge">{item.rate}</span>
                <h3>{item.name}</h3>
                <strong>{item.sixtySeconds}</strong>
                <p>{item.note}</p>
                <Link className="btn" href="/dashboard/credits">Choose credits for this</Link>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <h2>Campaign, agent, localization and file delivery packages</h2>
          <p className="section-lead">
            These are the fixed starting packages used by Assistant Workspace, including website, mobile app, SaaS, e-commerce, series/film studio and long film/series clipping packs. Extra AI visuals, source delivery, scene planning, voice, subtitles and revision buffer can increase the final reserved credits.
          </p>
          <div className="production-pricing-grid">
            {productionTypes.filter((type) => !standalonePurchaseTypeIds.has(type.id)).map((type) => (
              <div className={`card production-pricing-card production-tone-${type.id}`} key={type.id}>
                <span className="badge">{type.startingCredits > 0 ? `Starts from ${type.startingCredits.toLocaleString()} credits` : "Service plan pricing"}</span>
                <h3>{type.label}</h3>
                <p>{type.description}</p>
                <div className="production-package-list">
                  {productionPackages.filter((item) => item.productionType === type.id).map((item) => (
                    <div key={item.id}>
                      <strong>{item.name}</strong>
                      <span>{item.credits > 0 ? `${item.credits.toLocaleString()} credits` : "No included credits"}</span>
                      <Link href={productionPackageHref(item.id)}>Start with this package</Link>
                    </div>
                  ))}
                </div>
                <Link className="btn" href="/dashboard/assistant-workspace">Start request</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
