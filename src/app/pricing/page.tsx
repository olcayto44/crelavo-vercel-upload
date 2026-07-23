import type { Metadata } from "next";
import Link from "next/link";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { productionPackageHref } from "@/lib/assistant-links";
import { creditRolloverSummaryRows, topupRolloverSummaryRows, rolloverPolicyText } from "@/lib/credit-rollover";
import { dronePurchasePackages, growthIntelligencePlans, liveSalesServicePlans, packages, topUpPackages } from "@/lib/data";
import { creditCalculatorExamples, productionCreditGuide, quickCreditMath } from "@/lib/pricing";
import { productionPackages, productionTypes } from "@/lib/production";
import { PricingStructuredData } from "@/components/PricingStructuredData";
import { PageThumbnailStructuredData, defaultSearchThumbnail } from "@/components/PageThumbnailStructuredData";

export const metadata: Metadata = {
  title: "Crelavo Pricing and AI Production Credits",
  description: "Compare Crelavo credit packages, preview checkout paths, rollover rules and production delivery options for ecommerce videos, websites, apps and campaign assets.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Crelavo Pricing and AI Production Credits",
    description: "Compare Crelavo credit packages, preview checkout paths, rollover rules and production delivery options.",
    url: "/pricing",
    type: "website",
    images: [{ url: defaultSearchThumbnail.path, width: defaultSearchThumbnail.width, height: defaultSearchThumbnail.height, alt: "Crelavo pricing and credits dashboard preview" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Crelavo Pricing and AI Production Credits",
    description: "Compare Crelavo credit packages, preview checkout paths, rollover rules and production delivery options.",
    images: [defaultSearchThumbnail.path]
  }
};

const standalonePurchaseTypeIds = new Set(["live_sales_agent", "drone_video"]);

const deliveryFormats = [
  { title: "Preview & review links", text: "Shareable preview pages for video, website, app, campaign or brand-file outputs before final delivery.", tone: "pricing-delivery-cyan" },
  { title: "Final ZIP package", text: "A packaged delivery folder for completed assets, exports, source files, README notes and client handoff material.", tone: "pricing-delivery-purple" },
  { title: "Source files", text: "Project source can include code, editable documents, captions, prompt notes, scene plans, brand files and structured assets.", tone: "pricing-delivery-blue" },
  { title: "Setup guide / README", text: "Step-by-step setup notes for websites, apps, SaaS demos, automation packs and reusable production files.", tone: "pricing-delivery-green" },
  { title: "Export-ready media", text: "Platform-ready videos, images, thumbnails, captions, subtitles, ratios and publish notes for social or campaign use.", tone: "pricing-delivery-warm" },
  { title: "Revision path", text: "Clear delivery status, requested changes, admin notes and revision-ready output tracking from the workspace.", tone: "pricing-delivery-pink" }
];

const deliveryFeatureUnlocks = [
  { title: "AI Ad Performance Score Checker", text: "Ad score reports, hook rewrites, CTA notes and video-ready creative briefs can be delivered as tracked workspace assets.", href: "/ai-ad-performance-score-checker", tone: "pricing-delivery-cyan" },
  { title: "AI Virtual Model Studio", text: "Virtual model visuals, catalog image packs, product placement notes and final ZIP deliveries can be scoped with credits.", href: "/ai-virtual-model-studio", tone: "pricing-delivery-purple" },
  { title: "AI Cultural Localization", text: "Country-specific hooks, localized scripts, CTA adaptation and market-ready video briefs can be delivered as production files.", href: "/ai-cultural-localization", tone: "pricing-delivery-blue" },
  { title: "AI Campaign Calendar", text: "Seasonal campaign briefs, hook calendars, script packs and asset plans can move from planning into production delivery.", href: "/ai-campaign-calendar", tone: "pricing-delivery-green" },
  { title: "Crelavo Academy", text: "Premium templates and done-with-you creative briefs can unlock guided production paths after the learning flow.", href: "/crelavo-academy", tone: "pricing-delivery-warm" },
  { title: "Community Showcase", text: "Showcase examples can become similar-style requests, reusable templates and tracked production packages.", href: "/community-showcase", tone: "pricing-delivery-pink" }
];

const deliveryLocations = [
  "Customer dashboard delivery panel",
  "Preview link before final approval",
  "Final download buttons for ZIP/source/README",
  "Admin-managed production and delivery status",
  "Manual handoff links when a custom project needs external storage",
  "Connected workflow delivery and handoff links"
];

const pricingTrustPoints = [
  {
    title: "No surprise production reserve",
    text: "Credits are estimated first, then reserved only when the production request is confirmed."
  },
  {
    title: "Preview before final delivery",
    text: "Preview links, watermarked samples or review notes can appear before the final download package opens."
  },
  {
    title: "AI + human QA handoff",
    text: "Requests are structured for AI speed, then tracked with admin notes, revision status and final delivery context."
  },
  {
    title: "Files you can actually use",
    text: "Depending on the package, delivery can include exports, source files, captions, README/setup notes and ZIP handoff."
  }
];

const pricingDecisionCards = [
  {
    title: "Choose Business if you want clean exports for one brand",
    text: "$79/month with 12,000 credits is the safer path for solo sellers, small Shopify stores and first product video tests.",
    href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000",
    cta: "Start $10 Business preview"
  },
  {
    title: "Choose Team Annual if you run many client or product tests",
    text: "$1,300/year gives 174,000 credits, 12 simultaneous tasks and the agency bundle for bulk ecommerce video production.",
    href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000",
    cta: "Start $20 Team preview"
  },
  {
    title: "Not ready to pay yet? Score the ad first",
    text: "Use the free AI Ad Scorer to check hook, CTA and proof quality before spending credits on production.",
    href: "/free-tools/ad-performance-score-checker",
    cta: "Run free ad score"
  }
];

type PublicPricingRow = {
  name: string;
  price: string;
  billing: string;
  credits: string;
  setupFee?: string;
  notes: string;
};

const cleanExportUpsellCards = [
  {
    title: "Preview mode",
    badge: "Watermarked sample",
    text: "The 24-hour preview is for checking access and direction. Preview outputs can stay watermarked and downloads remain controlled before the main plan starts."
  },
  {
    title: "Business clean export",
    badge: "Best first upgrade",
    text: "Business is the clean-export path for one store or one brand: remove the Crelavo watermark after the subscription starts and production is confirmed."
  },
  {
    title: "Team agency export",
    badge: "Client-ready handoff",
    text: "Team Annual is positioned for agencies and power sellers that need clean client delivery, bulk workflows, source handoff and high credit capacity."
  }
];

const publicPricingRows: PublicPricingRow[] = [
  ...packages.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}/mo · $${plan.priceUsd * 10}/yr`,
    billing: "Monthly plan or yearly plan with 2 months free",
    credits: `${plan.credits.toLocaleString()} credits monthly · ${("yearlyCredits" in plan && typeof plan.yearlyCredits === "number" ? plan.yearlyCredits : plan.credits * 12).toLocaleString()} credits yearly`,
    setupFee: `$${plan.setupFeeUsd} 24-hour preview setup fee`,
    notes: `Preview includes one 10-second watermarked video. Downloads are closed during preview and open only after the selected subscription starts. ${rolloverPolicyText(plan, "monthly")}`
  })),
  ...topUpPackages.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}`,
    billing: "One-time purchase",
    credits: `${plan.credits.toLocaleString()} credits`,
    notes: rolloverPolicyText(plan, "one_time")
  })),
  ...liveSalesServicePlans.map((plan) => ({
    name: plan.name,
    price: `$${plan.priceUsd}/mo`,
    billing: "Monthly service plan",
    credits: "No included credits",
    setupFee: `$${plan.setupFeeUsd} setup fee`,
    notes: `${plan.fairUseHours} fair-use live hours. Extra live-operation usage is pay-as-you-go after cost analysis.`
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

function planStoreFit(planName: string) {
  const clean = planName.toLowerCase();
  if (clean.includes("pro")) return { label: "Best for Shopify beginners", range: "Built for stores under $5k/mo" };
  if (clean.includes("business")) return { label: "Best for growing stores", range: "Built for stores doing $5k-$20k/mo" };
  if (clean.includes("ultra")) return { label: "Best for scaling brands", range: "Built for brands doing $20k-$50k/mo" };
  if (clean.includes("team")) return { label: "Best for agencies & power sellers", range: "Built for 6-7 figure operators" };
  return { label: "Flexible credit path", range: "Use when you need extra production capacity" };
}

export default async function PricingPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <PricingStructuredData />
      <PageThumbnailStructuredData
        pagePath="/pricing"
        pageTitle="Crelavo Pricing and AI Production Credits"
        pageDescription="Compare Crelavo credit packages, preview checkout paths, rollover rules and production delivery options."
        imageAlt="Crelavo pricing and credits dashboard preview"
      />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page public-funnel-page">
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

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Choose faster</span>
          <h2>Pick the safest next step for your situation</h2>
          <p className="section-lead">This block removes the main pricing hesitation: start free if the creative angle is not ready, use Business for one brand, or use Team Annual when the goal is agency-scale production.</p>
          <div className="admin-category-grid" style={{ marginTop: 18 }}>
            {pricingDecisionCards.map((item) => (
              <Link className="card admin-category-card" href={item.href} key={item.title}>
                <span className="badge">Decision path</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="text-link">{item.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Buyer confidence</span>
          <h2>What you get before, during and after production</h2>
          <p className="section-lead">Pricing is tied to a dashboard workflow, not a blind one-click generation promise. You can estimate scope, review delivery expectations and keep revisions connected to the same production record.</p>
          <div className="admin-category-grid" style={{ marginTop: 18 }}>
            {pricingTrustPoints.map((item) => (
              <div className="card admin-category-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/create?idea=Help%20me%20choose%20the%20right%20Crelavo%20package">Help me choose a package</Link>
            <Link className="btn secondary" href="/dashboard/productions">View delivery workspace</Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Watermark and clean export path</span>
          <h2>Preview safely, then upgrade when you need clean files</h2>
          <p className="section-lead">The preview should reduce risk without giving away the full delivery package. Buyers can test direction first, then move to Business or Team when they need clean, client-ready exports.</p>
          <div className="admin-category-grid" style={{ marginTop: 18 }}>
            {cleanExportUpsellCards.map((item) => (
              <div className="card admin-category-card" key={item.title}>
                <span className="badge">{item.badge}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/payment?package=business&billing=monthly&campaign=clean-export-business">Remove watermark with Business</Link>
            <Link className="btn secondary" href="/dashboard/payment?package=team&billing=yearly&campaign=agency-clean-export">Agency clean export path</Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Unused credits rollover</span>
          <h2>No monthly credit waste while your subscription stays active</h2>
          <p className="section-lead">Monthly plan credits roll over to the next billing cycle when renewal succeeds, capped at 3x the monthly credit allowance. Annual credits stay available during the active 12-month subscription period, and top-up credits stay separate for 12 months.</p>
          <div className="admin-category-grid" style={{ marginTop: 18 }}>
            {creditRolloverSummaryRows().map((item) => (
              <div className="card admin-category-card" key={item.packageId}>
                <span className="badge">{item.packageName}</span>
                <h3>{item.monthlyCap.toLocaleString()} max monthly rollover cap</h3>
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

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Credit calculator</span>
          <h2>Estimate credits before starting production</h2>
          <p className="section-lead">
            Use these simple examples to understand the usual credit range before opening a production request. Final reserved credits can still change when a project needs extra scenes, source delivery, voice, subtitles, revisions or premium quality.
          </p>
          <div className="admin-info-grid">
            {quickCreditMath.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.result}</strong>
                <small>{item.math} credits/sec estimate</small>
              </div>
            ))}
          </div>
          <div className="admin-category-grid" style={{ marginTop: 18 }}>
            {creditCalculatorExamples.map((item) => (
              <Link className="card admin-category-card" href={item.href} key={item.title}>
                <span className="badge">Estimated usage</span>
                <h3>{item.title}</h3>
                <p><strong>{item.estimate}</strong></p>
                <p>{item.bestFor}</p>
                <small>{item.nextStep}</small>
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/create?idea=Estimate%20my%20credits%20before%20production">Estimate my project</Link>
            <Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Start with free ad score</Link>
          </div>
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
            <Link className="btn secondary" href="/dashboard/create">Plan a delivery</Link>
          </div>
          <div className="pricing-delivery-grid">
            {deliveryFormats.map((item) => (
              <div className={`pricing-delivery-card ${item.tone}`} key={item.title}>
                <span>{item.title}</span>
                <p>{item.text}</p>
              </div>
            ))}
            {deliveryFeatureUnlocks.map((item) => (
              <Link className={`pricing-delivery-card pricing-delivery-feature-card ${item.tone}`} href={item.href} key={item.title}>
                <small>New feature category</small>
                <span>{item.title}</span>
                <p>{item.text}</p>
              </Link>
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
          <Link className="card clickable-credit-card pricing-service-card pricing-service-live" href="/live-sales-credits">
            <span className="badge">Separate service plans</span>
            <h3>AI Live Sales Agent</h3>
            <p>Monthly avatar live sales plans with 10h, 40h or 120h fair-use live hours. No included credits.</p>
            <span className="btn">Open live sales plans</span>
          </Link>
          <Link className="card clickable-credit-card pricing-service-card pricing-service-drone" href="/drone-credits">
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
            {publicPricingRows.map((row) => {
              const fit = planStoreFit(row.name);
              return (
              <article className="public-pricing-card" key={`${row.name}-${row.price}`}>
                <div className="public-pricing-card-head">
                  <h3>{row.name}</h3>
                  <strong>{row.price}</strong>
                </div>
                <div className="workspace-action-note" style={{ margin: "10px 0 12px" }}>
                  <span className="badge">{fit.label}</span>
                  <p style={{ margin: "8px 0 0" }}>{fit.range}</p>
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
              );
            })}
          </div>
        </section>

        <CreditPlansToggle plans={packages} ctaLabel="Start 24-Hour Preview" />

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Partner Program</span>
          <h2>Are you an AI or no-code creator?</h2>
          <p style={{ color: "var(--muted)" }}>Apply for early partner access now. Referral links, creator assets and commission terms are prepared around manual review, 30-day hold and finance approval.</p>
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
                <Link className="btn" href="/dashboard/create">Start request</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
