import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const checklist = [
  "Shopify Partner account and app name reservation",
  "OAuth install flow with least-privilege product read scopes",
  "Product URL, title, images and description handoff into Crelavo",
  "Admin settings page that opens the Crelavo campaign workspace",
  "Privacy policy, data deletion and store uninstall handling",
  "App review copy, screenshots, support email and billing explanation",
  "Manual product-link workflow first; app handoff and support assets stay simple"
];

const keywords = ["Shopify video app", "Shopify AI video app", "Shopify product video app", "Shopify product link video", "AI Shopify ad video", "Shopify product ads", "ecommerce video app"];

const shopifyFaqs = [
  { question: "What does a Shopify AI product video app do?", answer: "It helps a Shopify merchant turn product page context into product video briefs, ad hooks, captions, landing copy and ecommerce campaign assets." },
  { question: "Can I start before a Shopify app install exists?", answer: "Yes. A merchant can start with the Shopify product-link workflow or Chrome extension funnel, then keep app preparation as the deeper store handoff path." },
  { question: "What should the app send to Crelavo?", answer: "The useful handoff is product URL, title, images, description, store context, target platform and campaign goal." },
  { question: "Where should the merchant go after this page?", answer: "The strongest next step is the Shopify product-link ad video workflow, then pricing or dashboard/create for a production brief." }
];

export const metadata: Metadata = {
  title: "Shopify AI Product Video App Preparation | Crelavo",
  description: "Crelavo Shopify AI product video app preparation for product-link-to-video workflows, ecommerce campaign assets, app store positioning, OAuth scopes and store handoff steps.",
  keywords,
  alternates: { canonical: "/shopify-ai-product-video-app" },
  openGraph: {
    title: "Shopify AI Product Video App Preparation | Crelavo",
    description: "Plan the Crelavo Shopify app path for product link to AI product video and ecommerce campaign workflows.",
    url: "/shopify-ai-product-video-app",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify AI Product Video App Preparation | Crelavo",
    description: "Shopify video app preparation for Crelavo product-link-to-video workflows."
  }
};

export default async function ShopifyAiProductVideoAppPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">Shopify app preparation</span>
          <h1>Shopify AI product video app preparation for product-link-to-video campaigns</h1>
          <p className="section-lead">
            This page defines the Shopify App Store preparation path for Crelavo: merchants can move from a Shopify product page into AI product videos, TikTok ad hooks, Reels creatives, captions, landing copy and ecommerce campaign assets.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/shopify-product-link-to-ad-video">Open Shopify product video workflow</Link>
            <Link className="btn secondary" href="/chrome-extension">Chrome extension funnel</Link>
            <Link className="btn secondary" href="/blog/shopify-product-link-to-ai-video-guide">Read Shopify guide</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">SEO keywords</span>
          <h2>Shopify video app keywords and product-link campaign intent</h2>
          <div className="admin-category-grid">
            {keywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Supports Shopify merchants searching for AI product video, product page to video, product ad video and ecommerce campaign workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Preparation path</span>
          <h2>Product-link workflow and Shopify App Store preparation</h2>
          <p>
            The fastest current path is manual product link input plus the Chrome extension funnel. The Shopify App Store preparation path documents OAuth, product read scopes, privacy review, billing messaging and support operations for a clean merchant handoff.
          </p>
          <h2>What the Shopify app should do first</h2>
          <p>
            The first version should stay focused on a clear merchant action. It should pass product page context into Crelavo so the seller can start a campaign request with the product URL already prepared.
          </p>
          <div className="delivery-step-grid">
            {checklist.map((item) => (
              <div className="delivery-step-card" key={item}>
                <h3>{item}</h3>
                <p>Supports a review-ready Shopify app preparation package.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Related Crelavo Shopify and ecommerce paths</h2>
          <div className="plan-feature-groups">
            <Link href="/shopify-product-link-to-ad-video"><b>Shopify product link to ad video</b><small>Main Shopify product video page</small></Link>
            <Link href="/blog/shopify-product-link-to-ai-video-guide"><b>Shopify product link guide</b><small>SEO guide for Shopify product video searches</small></Link>
            <Link href="/woocommerce-ai-product-video-plugin"><b>WooCommerce AI product video plugin</b><small>WordPress/WooCommerce plugin preparation path</small></Link>
            <Link href="/categories/campaign"><b>Campaign category</b><small>Product-link campaign hub</small></Link>
            <Link href="/ai-product-video-generator"><b>AI product video generator</b><small>Product video workflow</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>Review delivery options</small></Link>
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>Shopify AI product video app questions</h2>
          <div className="plan-feature-groups">
            {shopifyFaqs.map((item) => <div key={item.question}><b>{item.question}</b><small>{item.answer}</small></div>)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/create?idea=Shopify%20product%20link%20to%20AI%20video">Start Shopify video brief</Link>
            <Link className="btn secondary" href="/pricing">Check packages</Link>
          </div>
        </section>
      </main>
    </>
  );
}
