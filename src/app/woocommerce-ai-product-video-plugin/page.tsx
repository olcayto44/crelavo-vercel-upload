import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const checklist = [
  "WordPress plugin slug and public plugin positioning",
  "WooCommerce REST API connection and store permission model",
  "Product ID, product URL, title, images and description handoff",
  "Plugin settings page with Crelavo workspace launch button",
  "Nonce, capability checks and secure admin-only actions",
  "Readme.txt, screenshots, support link and WordPress.org submission assets",
  "Manual ZIP plugin path first; directory submission package stays review-ready"
];

const keywords = ["WooCommerce video plugin", "WooCommerce AI video", "WooCommerce product video", "WordPress product video", "AI product video plugin", "WooCommerce ad video", "ecommerce video plugin"];

const wooCommerceFaqs = [
  { question: "What does a WooCommerce AI product video plugin prepare?", answer: "It prepares the path for WordPress store owners to send product context into Crelavo for product videos, hooks, captions and campaign files." },
  { question: "Is the product page URL enough for a useful video brief?", answer: "The URL is the starting point. The best brief also includes target platform, audience, offer, proof points and any reference style." },
  { question: "How does this connect to Shopify and Chrome extension pages?", answer: "Shopify and WooCommerce cover store-specific handoff, while the Chrome extension page covers the fastest product-page traffic capture path." },
  { question: "What is the next step for a WooCommerce seller?", answer: "Read the product page workflow, then open dashboard/create or pricing to prepare the production package." }
];

export const metadata: Metadata = {
  title: "WooCommerce AI Product Video Plugin Preparation | Crelavo",
  description: "Crelavo WooCommerce AI product video plugin preparation for WordPress stores, product page to video workflows, ecommerce campaign assets and plugin submission steps.",
  keywords,
  alternates: { canonical: "/woocommerce-ai-product-video-plugin" },
  openGraph: {
    title: "WooCommerce AI Product Video Plugin Preparation | Crelavo",
    description: "Plan the Crelavo WooCommerce plugin path for product page to AI product video and ecommerce campaign workflows.",
    url: "/woocommerce-ai-product-video-plugin",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "WooCommerce AI Product Video Plugin Preparation | Crelavo",
    description: "WooCommerce product video plugin preparation for Crelavo ecommerce workflows."
  }
};

export default async function WooCommerceAiProductVideoPluginPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">WooCommerce plugin preparation</span>
          <h1>WooCommerce AI product video plugin preparation for WordPress ecommerce campaigns</h1>
          <p className="section-lead">
            This page defines the WooCommerce plugin preparation path for Crelavo: WordPress store owners can send product page context into AI product videos, ad hooks, captions, landing copy and ecommerce campaign assets.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/blog/ecommerce-product-page-to-video-workflow">Read product page workflow</Link>
            <Link className="btn secondary" href="/shopify-ai-product-video-app">Shopify app preparation</Link>
            <Link className="btn secondary" href="/categories/campaign">Campaign category</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">SEO keywords</span>
          <h2>WooCommerce video plugin keywords and WordPress ecommerce intent</h2>
          <div className="admin-category-grid">
            {keywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Supports WordPress and WooCommerce sellers searching for product video plugins, AI ecommerce campaign tools and product page to video workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Preparation path</span>
          <h2>Product page workflow and WooCommerce plugin preparation</h2>
          <p>
            Crelavo can capture WooCommerce intent through product page URLs and campaign requests. The plugin preparation path adds a WordPress admin button, secure product context handoff and plugin submission assets around that workflow.
          </p>
          <h2>What the WooCommerce plugin should do first</h2>
          <p>
            The first plugin should be simple: let an admin send product context to Crelavo with a clear review handoff. Product data, privacy notes and support expectations should stay easy for merchants to understand.
          </p>
          <div className="delivery-step-grid">
            {checklist.map((item) => (
              <div className="delivery-step-card" key={item}>
                <h3>{item}</h3>
                <p>Supports a review-ready WooCommerce plugin preparation package.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Related Crelavo WooCommerce and ecommerce paths</h2>
          <div className="plan-feature-groups">
            <Link href="/blog/ecommerce-product-page-to-video-workflow"><b>Product page to video workflow</b><small>Broad ecommerce guide</small></Link>
            <Link href="/shopify-ai-product-video-app"><b>Shopify AI product video app</b><small>Shopify app-store preparation</small></Link>
            <Link href="/ai-product-video-generator"><b>AI product video generator</b><small>Product video workflow</small></Link>
            <Link href="/categories/campaign"><b>Campaign category</b><small>Product-link campaign hub</small></Link>
            <Link href="/chrome-extension"><b>Chrome extension funnel</b><small>Fastest acquisition path before plugins</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>Review delivery options</small></Link>
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>WooCommerce AI product video plugin questions</h2>
          <div className="plan-feature-groups">
            {wooCommerceFaqs.map((item) => <div key={item.question}><b>{item.question}</b><small>{item.answer}</small></div>)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/create?idea=WooCommerce%20product%20page%20to%20AI%20video">Start WooCommerce brief</Link>
            <Link className="btn secondary" href="/pricing">Check packages</Link>
          </div>
        </section>
      </main>
    </>
  );
}
