import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const campaignUseCases = [
  {
    title: "Shopify product link to ad campaign",
    text: "Use a Shopify product page or store offer as the starting point for TikTok hooks, short-form product video direction, landing page copy, ad copy and campaign notes."
  },
  {
    title: "Amazon listing to product ad video",
    text: "Turn Amazon listing details, product benefits, review angles and marketplace positioning into a video-first campaign brief for sellers who need faster creative testing."
  },
  {
    title: "Trendyol product video and marketplace ecommerce ads",
    text: "Target lower-competition marketplace ecommerce searches such as Trendyol product link ad video, Trendyol AI product video and marketplace campaign production."
  }
];

const campaignDeliverables = [
  "Product link or product brief analysis",
  "First-three-second hook ideas for TikTok, Reels and Shorts",
  "UGC-style product video direction",
  "Ad copy, caption and CTA variants",
  "Landing page or product page messaging notes",
  "Internal links to relevant Crelavo ecommerce workflows"
];

export const metadata: Metadata = {
  title: "Campaign Category for Ecommerce Ads and Product Videos | Crelavo",
  description: "Campaign category page for Shopify product link ads, Amazon product ad videos, Trendyol product videos, TikTok hooks, UGC creative and AI ecommerce campaign workflows.",
  alternates: { canonical: "/categories/campaign" },
  openGraph: {
    title: "Campaign Category for Ecommerce Ads | Crelavo",
    description: "Start Shopify, Amazon, Trendyol and product-link campaign workflows from Crelavo.",
    url: "/categories/campaign",
    type: "website"
  }
};

export default async function CampaignCategoryPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <section className="production-hero-card clean-feed-section">
          <span className="badge">Campaign category</span>
          <h1>Campaign category for ecommerce ads, product videos and product-link workflows</h1>
          <p className="section-lead">
            This category is built for sellers who want to turn Shopify, Amazon, Trendyol or direct product links into campaign assets: product ad videos, UGC hooks, TikTok/Reels/Shorts ideas, captions, ad copy, landing page messaging and launch-ready creative directions.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn" href="/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Product%20link%20campaign">Start campaign request</Link>
            <Link className="btn secondary" href="/shopify-product-link-to-ad-video">Shopify video workflow</Link>
            <Link className="btn secondary" href="/amazon-product-ad-video">Amazon video workflow</Link>
            <Link className="btn secondary" href="/trendyol-product-video">Trendyol video workflow</Link>
            <Link className="btn secondary" href="/blog/shopify-amazon-trendyol-ai-campaign-checklist">Campaign checklist</Link>
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">High-intent ecommerce use cases</span>
          <h2>What this campaign category is for</h2>
          <p>
            The goal is to capture specific ecommerce searches instead of only broad AI video keywords. A seller searching for product link to ad video, Shopify TikTok ad generator, Amazon product ad video or Trendyol product video should land on a page that explains the exact workflow and sends them into Crelavo.
          </p>
          <div className="delivery-step-grid">
            {campaignUseCases.map((item) => (
              <div className="delivery-step-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Deliverables</span>
          <h2>What Crelavo can prepare from one product link</h2>
          <div className="delivery-step-grid">
            {campaignDeliverables.map((item) => (
              <div className="delivery-step-card" key={item}>
                <h3>{item}</h3>
                <p>Prepared as part of the campaign direction so the user can move from product research into creative production and delivery tracking.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">SEO intent</span>
          <h2>Long-tail searches this page supports</h2>
          <p>
            This page supports searches like Shopify product link to TikTok ad video, Amazon listing to product video, Trendyol product video generator, ecommerce UGC hook ideas, AI product ad campaign, product link to landing page copy and marketplace campaign production.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn" href="/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Product%20link%20campaign">Start from a product link</Link>
            <Link className="btn secondary" href="/categories">Back to all categories</Link>
            <Link className="btn secondary" href="/tools">Open tools catalog</Link>
          </div>
          <div className="plan-feature-groups" style={{ marginTop: 24 }}>
            <Link href="/blog/shopify-product-link-to-ai-video-guide"><b>Shopify product video guide</b><small>Shopify product link to AI video SEO path</small></Link>
            <Link href="/blog/amazon-product-page-to-ai-ad-video-guide"><b>Amazon product ad guide</b><small>Amazon product page to AI ad video path</small></Link>
            <Link href="/blog/trendyol-product-video-campaign-guide"><b>Trendyol product video guide</b><small>Turkish ecommerce product video path</small></Link>
            <Link href="/shopify-ai-product-video-app"><b>Shopify app roadmap</b><small>Future App Store integration path</small></Link>
            <Link href="/woocommerce-ai-product-video-plugin"><b>WooCommerce plugin roadmap</b><small>Future WordPress plugin integration path</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
