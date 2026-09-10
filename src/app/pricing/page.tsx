import type { Metadata } from "next";
import Link from "next/link";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { packages } from "@/lib/data";

const publicLaunchPlans = packages;
import { PricingStructuredData } from "@/components/PricingStructuredData";
import { PageThumbnailStructuredData, defaultSearchThumbnail } from "@/components/PageThumbnailStructuredData";

export const metadata: Metadata = {
  title: "Crelavo Pricing and AI Production Credits",
  description: "24-hour Pro trial for $0, then $9.99 every 30 days or $99 per year unless cancelled in Whop.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Crelavo Pricing and AI Production Credits",
    description: "24-hour Pro trial for $0, then $9.99/month or $99/year unless cancelled in Whop.",
    url: "/pricing",
    type: "website",
    images: [{ url: defaultSearchThumbnail.path, width: defaultSearchThumbnail.width, height: defaultSearchThumbnail.height, alt: "Crelavo pricing and credits dashboard preview" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Crelavo Pricing and AI Production Credits",
    description: "24-hour Pro trial for $0, then $9.99/month or $99/year unless cancelled in Whop.",
    images: [defaultSearchThumbnail.path]
  }
};

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
    title: "Check your ad first",
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
        pageDescription="24-hour Pro trial for $0, then $9.99/month or $99/year unless cancelled in Whop."
        imageAlt="Crelavo Pro pricing"
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
