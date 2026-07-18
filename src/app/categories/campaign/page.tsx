import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "Campaign Category for Ecommerce Ads and Product Videos | Crelavo",
  description: "Campaign category page for Crelavo ecommerce ads, Shopify product videos, Amazon product ad videos, Trendyol product videos and AI campaign workflows.",
  alternates: { canonical: "/categories/campaign" },
  openGraph: {
    title: "Campaign Category | Crelavo",
    description: "Start ecommerce ad, product video and campaign production workflows from Crelavo.",
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
          <h1>Campaign category for ecommerce ads and product videos</h1>
          <p className="section-lead">
            Use this Crelavo category page to start Shopify product link campaigns, Amazon product ad videos, Trendyol product videos, TikTok ad scripts and multi-channel ecommerce campaign assets.
          </p>
          <div className="delivery-step-grid">
            <div className="delivery-step-card">
              <h2>Product link to campaign</h2>
              <p>Turn a Shopify, Amazon, Trendyol or direct product link into ad copy, short video direction, social posts and campaign notes.</p>
            </div>
            <div className="delivery-step-card">
              <h2>Best for ecommerce sellers</h2>
              <p>Useful for sellers who need product videos, UGC hooks, TikTok ad ideas, marketplace copy and launch-ready campaign assets.</p>
            </div>
            <div className="delivery-step-card">
              <h2>Admin-ready workflow</h2>
              <p>The user starts from this category, then continues into the workspace or dashboard where delivery and revisions can be tracked.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn" href="/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Product%20link%20campaign">Start campaign request</Link>
            <Link className="btn secondary" href="/categories">Back to categories</Link>
          </div>
        </section>
      </main>
    </>
  );
}
