import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { pinterestBoards, pinterestPinTemplates, pinterestYoutubeKeywords, visualDistributionSemiAutoChecklist, youtubeShortsTemplates } from "@/lib/social-distribution";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "Pinterest and YouTube Visual Distribution Plan for AI Product Videos | Crelavo",
  description: "Pinterest and YouTube visual distribution plan for AI product video pins, YouTube Shorts product videos, ecommerce video examples, UGC Shorts ideas and sample video SEO.",
  keywords: pinterestYoutubeKeywords,
  alternates: { canonical: "/pinterest-youtube-visual-distribution-plan" },
  openGraph: {
    title: "Pinterest and YouTube Visual Distribution Plan | Crelavo",
    description: "Visual search and YouTube Shorts sharing plan for AI product videos, ecommerce campaigns, samples, showcase pages and UGC product demos.",
    url: "/pinterest-youtube-visual-distribution-plan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinterest and YouTube Visual Distribution Plan | Crelavo",
    description: "Pinterest SEO, visual search traffic and YouTube Shorts launch planning for Crelavo."
  }
};

export default async function PinterestYoutubeVisualDistributionPlanPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">Pinterest + YouTube distribution</span>
          <h1>Pinterest and YouTube visual distribution plan for AI product videos and ecommerce examples</h1>
          <p className="section-lead">
            This page turns Crelavo samples, showcase pages, free tools, product video pages and ecommerce workflows into visual discovery assets for Pinterest boards and YouTube Shorts publishing.
          </p>
          <p>
            The SEO focus covers Pinterest product video ideas, Pinterest ecommerce marketing, AI product video pins, Pinterest SEO strategy, YouTube Shorts product video, YouTube Shorts ecommerce ads, UGC YouTube Shorts ideas and sample video SEO.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/ai-social-media-launch-plan">Social media launch plan</Link>
            <Link className="btn secondary" href="/showcase/explore-samples">Explore samples</Link>
            <Link className="btn secondary" href="/samples/ugc-product-demo">UGC product demo</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Visual SEO keywords</span>
          <h2>Pinterest SEO, YouTube Shorts and visual search keyword clusters</h2>
          <div className="admin-category-grid">
            {pinterestYoutubeKeywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Useful for visual search traffic, AI product video examples, ecommerce video examples, sample video SEO and YouTube Shorts launch planning.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Pinterest board plan</span>
          <h2>Pinterest boards for Crelavo visual discovery</h2>
          <p>
            Pinterest should use keyword-first boards and pins. Each pin should point to one focused page instead of sending every visitor to the homepage.
          </p>
          <div className="admin-category-grid">
            {pinterestBoards.map((board) => (
              <div className="card admin-category-card" key={board.board}>
                <span className="badge">{board.keyword}</span>
                <h3>{board.board}</h3>
                <p>Target URL: <Link href={board.url}>{board.url}</Link></p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Pin title templates</span>
          <h2>Pinterest pin titles for AI video, ecommerce, website and startup visuals</h2>
          <div className="admin-category-grid">
            {pinterestPinTemplates.map((title) => (
              <div className="card admin-category-card" key={title}>
                <h3>{title}</h3>
                <p>Use with a matching Crelavo sample, showcase, free tool or product video page.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">YouTube Shorts pack</span>
          <h2>YouTube Shorts title, description and hashtag templates</h2>
          <div className="admin-category-grid">
            {youtubeShortsTemplates.map((item) => (
              <div className="card admin-category-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="category-option-row">{item.hashtags.map((tag) => <small key={tag}>{tag}</small>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Semi-auto visual sharing</span>
          <h2>How to use Pinterest and YouTube semi-automatically</h2>
          <ul>{visualDistributionSemiAutoChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Visual pages, product videos and free tools to distribute</h2>
          <div className="plan-feature-groups">
            <Link href="/ai-social-media-launch-plan"><b>AI social media launch plan</b><small>General social sharing prep</small></Link>
            <Link href="/showcase/explore-samples"><b>Explore samples</b><small>AI production samples</small></Link>
            <Link href="/samples/product-ad-skincare"><b>Product ad sample</b><small>Ecommerce video sample</small></Link>
            <Link href="/samples/ugc-product-demo"><b>UGC product demo</b><small>Creator-style sample video</small></Link>
            <Link href="/ai-product-video-generator"><b>AI product video generator</b><small>Product video workflow</small></Link>
            <Link href="/shopify-product-link-to-ad-video"><b>Shopify product video</b><small>Shopify product page to ad video</small></Link>
            <Link href="/amazon-product-ad-video"><b>Amazon product ad video</b><small>Marketplace product ad workflow</small></Link>
            <Link href="/trendyol-product-video"><b>Trendyol product video</b><small>Turkish ecommerce video path</small></Link>
            <Link href="/free-tools/tiktok-hook-generator"><b>TikTok Hook Generator</b><small>Short-form hook ideas</small></Link>
            <Link href="/free-tools/ecommerce-ad-script-generator"><b>Ecommerce Ad Script Generator</b><small>UGC and Shorts script ideas</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
