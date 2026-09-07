import type { Metadata } from "next";
import Link from "next/link";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { packages } from "@/lib/data";

const publicLaunchPlans = packages.filter((plan) => plan.id === "pro");
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
    title: "Choose Pro to start with one free trial production",
    text: "$0 for the first 24 hours, then $9.99/month with 2,500 credits unless cancelled in Whop.",
    href: "https://whop.com/checkout/plan_ujLQgM3kEg0dg",
    cta: "Start free Pro trial"
  },
  {
    title: "Save with annual",
    text: "$0 today, then $99/year after the 24-hour free trial. Save $21 versus paying $9.99 every 30 days.",
    href: "https://whop.com/checkout/plan_fiabRYr6uWY43",
    cta: "Start annual trial"
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
              Start with a 24-hour free Pro trial. Make one trial production for $0, then continue at $9.99 every 30 days or $99 per year. Card required; cancel in Whop before the trial ends and pay nothing.
            </p>
          </div>
          <div className="promo-corner-slot pricing-promo-slot"><CampaignPromoSlot /></div>
        </section>

        <CreditPlansToggle plans={publicLaunchPlans} ctaLabel="Start Free 24-Hour Trial" compact sideBySideAnnual />

<section className="card admin-wide-card" style={{ marginTop: 28 }}>
           <span className="badge">24-hour free trial</span>
           <h2>Try Pro before the subscription starts</h2>
           <p className="section-lead">Both Pro plans start at $0 today. Card required. Cancel in Whop before the trial ends and you pay nothing.</p>
           <div className="admin-info-grid" style={{ marginTop: 16 }}>
             <div><span>Step 1</span><strong>Start free</strong><small>Choose monthly at $9.99 every 30 days or annual at $99/year after the trial.</small></div>
             <div><span>Step 2</span><strong>Make one production</strong><small>Use one controlled trial production during the first 24 hours.</small></div>
             <div><span>Step 3</span><strong>Continue or cancel</strong><small>Continue in Whop or cancel before the trial ends with no charge.</small></div>
           </div>
         </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Choose faster</span>
          <h2>Pick the safest next step for your situation</h2>
          <p className="section-lead">Start with Pro monthly, save with Pro annual, or use the free ad scorer if your creative angle is not ready yet.</p>
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


      </main>
    </>
  );
}
