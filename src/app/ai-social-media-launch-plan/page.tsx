import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { socialContentCalendar, socialLaunchKeywords, socialSemiAutoChecklist, socialSharePlatforms } from "@/lib/social-distribution";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Social Media Launch Plan for SaaS and Ecommerce | Crelavo",
  description: "A semi-automatic AI social media launch plan for SaaS launches, AI startup social posts, LinkedIn founder posts, X launch threads, TikTok product videos and YouTube Shorts.",
  keywords: socialLaunchKeywords,
  alternates: { canonical: "/ai-social-media-launch-plan" },
  openGraph: {
    title: "AI Social Media Launch Plan | Crelavo",
    description: "Semi-automatic social sharing prep for AI tools, SaaS launches, ecommerce product videos, founder posts and short-form content.",
    url: "/ai-social-media-launch-plan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Social Media Launch Plan | Crelavo",
    description: "LinkedIn, X, TikTok, Reels, Shorts and community launch planning for Crelavo."
  }
};

export default async function AiSocialMediaLaunchPlanPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">Semi-automatic social sharing</span>
          <h1>AI social media launch plan for SaaS, ecommerce videos and startup content</h1>
          <p className="section-lead">
            This page prepares Crelavo social sharing without risky auto-posting. Each platform gets post copy, target URLs, UTM direction, content cadence and a manual review step before publishing.
          </p>
          <p>
            The SEO focus is niche: AI social media launch plan, SaaS social media launch, AI startup social posts, product launch social media, ecommerce video social plan, LinkedIn founder post, X launch thread and YouTube Shorts launch plan.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/ai-tool-launch-distribution-plan">Launch distribution plan</Link>
            <Link className="btn secondary" href="/pinterest-youtube-visual-distribution-plan">Pinterest + YouTube plan</Link>
            <Link className="btn secondary" href="/free-tools">Free AI tools</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Niche social keywords</span>
          <h2>Social media launch keywords for AI tools, SaaS and ecommerce campaigns</h2>
          <div className="admin-category-grid">
            {socialLaunchKeywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Connected to Crelavo social posts, short-form videos, founder updates, ecommerce content and semi-automatic sharing workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Platform packs</span>
          <h2>Platform-by-platform semi-automatic sharing plan</h2>
          <p>
            Semi-automatic means the post is prepared, formatted and linked, but the final publish action remains manual. This protects the brand from spam, API, OAuth and account-risk issues.
          </p>
          <div className="admin-category-grid">
            {socialSharePlatforms.map((platform) => (
              <div className="card admin-category-card" key={platform.platform}>
                <span className="badge">{platform.keyword}</span>
                <h3>{platform.platform}</h3>
                <p><strong>Cadence:</strong> {platform.cadence}</p>
                <p>{platform.postTemplate}</p>
                <p><strong>Semi-auto action:</strong> {platform.semiAutoAction}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Content calendar</span>
          <h2>Social media content calendar for Crelavo launch assets</h2>
          <div className="admin-info-grid">
            {socialContentCalendar.map((item) => (
              <div key={item.day}>
                <span>{item.day}</span>
                <strong>{item.theme}</strong>
                <small>{item.keyword} · {item.url}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Manual safety checklist</span>
          <h2>How to use semi-automatic social sharing safely</h2>
          <ul>{socialSemiAutoChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Social launch pages, samples and free tools to share</h2>
          <div className="plan-feature-groups">
            <Link href="/ai-tool-launch-distribution-plan"><b>AI tool launch distribution plan</b><small>Directory, community and UTM plan</small></Link>
            <Link href="/pinterest-youtube-visual-distribution-plan"><b>Pinterest + YouTube visual distribution</b><small>Visual search and Shorts plan</small></Link>
            <Link href="/samples/ugc-product-demo"><b>UGC product demo sample</b><small>Creator-style product demo</small></Link>
            <Link href="/free-tools/tiktok-hook-generator"><b>TikTok Hook Generator</b><small>Hook ideas for product posts</small></Link>
            <Link href="/free-tools/ecommerce-ad-script-generator"><b>Ecommerce Ad Script Generator</b><small>Short-form product script ideas</small></Link>
            <Link href="/alternatives"><b>AI tool alternatives</b><small>Comparison SEO hub</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
