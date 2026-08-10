import type { Metadata } from "next";
import Link from "next/link";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { packages, topUpPackages } from "@/lib/data";
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
            <h1>Choose your Crelavo production plan</h1>
            <p className="section-lead">
              Compare monthly and yearly credits, see estimated video output instantly, start with a paid 24-hour preview, then unlock clean export, campaign delivery, source files and client-ready handoff when the plan starts.
            </p>
          </div>
          <div className="promo-corner-slot pricing-promo-slot"><CampaignPromoSlot /></div>
        </section>

        <CreditPlansToggle plans={packages} ctaLabel="Start 24-Hour Preview" compact />

        <section className="card admin-wide-card" style={{ marginTop: 24 }}>
          <span className="badge">Need extra credits?</span>
          <h2>Add top-up credits</h2>
          <p className="section-lead">Top-ups stay below the main subscriptions so the first thing visitors see is the core credit package grid.</p>
          <div style={{ marginTop: 16 }}>
            <CreditPlansToggle plans={topUpPackages} ctaLabel="Add top-up credits" compact />
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">24-hour paid preview</span>
          <h2>Test the workflow before the full plan starts</h2>
          <p className="section-lead">Preview payments keep the first step low-risk: check direction, see a watermarked sample or review notes, then unlock clean downloads and full credits only after the selected subscription starts.</p>
          <div className="admin-info-grid" style={{ marginTop: 16 }}>
            <div><span>Step 1</span><strong>Pay preview setup</strong><small>$5 Pro, $10 Business, $15 Ultra or $20 Team preview path.</small></div>
            <div><span>Step 2</span><strong>Review direction</strong><small>Preview can stay watermarked and downloads remain controlled before full access.</small></div>
            <div><span>Step 3</span><strong>Unlock clean export</strong><small>Full credits, final files and delivery options open after the subscription starts.</small></div>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Choose faster</span>
          <h2>Pick the safest next step for your situation</h2>
          <p className="section-lead">Use Business for one brand, Team Annual for agency-scale production, or the free ad scorer if the creative angle is not ready yet.</p>
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
          <span className="badge">Credit safety</span>
          <h2>Simple rules before production starts</h2>
          <div className="admin-info-grid" style={{ marginTop: 16 }}>
            <div><span>Estimate first</span><strong>No surprise reserve</strong><small>Credits are estimated before the user confirms production.</small></div>
            <div><span>Rollover</span><strong>Unused credits stay useful</strong><small>Monthly rollover works while subscription renewal succeeds; top-ups stay separate.</small></div>
            <div><span>Preview</span><strong>Review before final delivery</strong><small>Preview, review notes or watermarked samples can appear before final handoff.</small></div>
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
          <span className="badge">Partner Program</span>
          <h2>Are you an AI or no-code creator?</h2>
          <p style={{ color: "var(--muted)" }}>Apply for early partner access now. Referral links, creator assets and commission terms are prepared around manual review, 30-day hold and finance approval.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link className="btn" href="/affiliate">Join the partner program</Link>
            <Link className="btn secondary" href="/dashboard/growth">View referral rewards</Link>
          </div>
        </section>
      </main>
    </>
  );
}
