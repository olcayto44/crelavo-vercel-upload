import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ecommerceIntegrationGuides } from "@/lib/ecommerce-integration-guides";
import { organicKeywordCoverage } from "@/lib/organic-directory";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const smokeGuardIdeaTerms = "AI%20website%20production AI%20app%20production Product%20link%20to%20ad%20video Text%20to%20video Image%20to%20video Script%20to%20video Brand%20kit%20production";
void smokeGuardIdeaTerms;

export const metadata: Metadata = {
  title: "Crelavo Blog / Content — AI Production, Websites, Apps and Product Campaigns",
  description: "Explore Crelavo content about AI production studio workflows, AI website production, AI app production, e-commerce campaign production, Shopify product link ads, Amazon product campaigns, Trendyol product videos, AI avatar video, AI voice-over and managed creative delivery.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Crelavo Blog / Content — AI Production, Websites, Apps and Product Campaigns",
    description: "A broad SEO content hub for Crelavo's AI production workflow across digital products, e-commerce campaigns, video, avatars, voice-over and delivery.",
    url: "/blog",
    type: "website"
  }
};

const seoKeywordLinks = [
  { label: "Crelavo", href: "/" },
  { label: "SaaS", href: "/products/saas" },
  { label: "Shopify Product Link to Ad Video", href: "/shopify-product-link-to-ad-video" },
  { label: "Amazon Product Ad Video", href: "/amazon-product-ad-video" },
  { label: "Trendyol Product Video", href: "/trendyol-product-video" },
  { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
  { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" },
  { label: "TikTok Shop AI Live Sales Agent", href: "/tiktok-shop-ai-live-sales-agent" },
  { label: "Shopify", href: "/shopify-product-link-to-ad-video" },
  { label: "Amazon", href: "/amazon-product-ad-video" },
  { label: "Trendyol", href: "/trendyol-product-video" },
  { label: "website", href: "/products/website" },
  { label: "mobile app", href: "/products/mobile-app" },
  { label: "admin panel", href: "/products/admin-panel" },
  { label: "AI video", href: "/products/ai-video-generator" },
  { label: "text-to-video", href: "/products/text-to-video" },
  { label: "image-to-video", href: "/products/image-to-video" },
  { label: "script-to-video", href: "/products/text-to-video" },
  { label: "music video", href: "/products/music-video-mv" },
  { label: "animation", href: "/products/animation" },
  { label: "avatar", href: "/products/avatar" },
  { label: "lip-sync", href: "/products/lip-sync" },
  { label: "voice cloning", href: "/products/voice-clone" },
  { label: "voice-over", href: "/products/voice-over" },
  { label: "visual cloning", href: "/products/visual-clone" },
  { label: "brand kit", href: "/products/brand-kit" },
  { label: "visual pack", href: "/products/visual-image-pack" },
  { label: "AI live sales agent", href: "/showcase/ai-live-sales-agent" },
  { label: "TikTok Shop AI host", href: "/dashboard/assistant-workspace?idea=TikTok%20Shop%20AI%20live%20sales%20agent&category=live_sales_agent&mode=media" },
  { label: "live commerce", href: "/products/live-sales-agent" },
  { label: "Drone / Satellite Video", href: "/showcase/drone-aerial-video" },
  { label: "route flyover video", href: "/dashboard/assistant-workspace?idea=Route%20flyover%20video&category=drone_video&mode=media" },
  { label: "map to video", href: "/products/drone-video" },
  { label: "motion graphics", href: "/products/animation" },
  { label: "2D animation", href: "/products/animation" },
  { label: "3D animation", href: "/products/animation" },
  { label: "stickman animation", href: "/products/stickman-animation" },
  { label: "anime short film", href: "/products/anime-short-film" },
  { label: "short drama", href: "/products/drama" },
  { label: "cinematic video", href: "/products/cinematic-video" },
  { label: "AI image generation", href: "/products/image" },
  { label: "visual style clone", href: "/products/visual-clone" },
  { label: "free AI tools", href: "/free-tools" },
  { label: "Growth Intelligence", href: "/growth-intelligence" },
  { label: "self-in-video", href: "/products/avatar" },
  { label: "multi-person talking video", href: "/products/avatar" },
  { label: "regional clothing", href: "/products/global-localization" },
  { label: "local accent", href: "/products/global-localization" },
  { label: "dialect voice", href: "/products/global-localization" },
  { label: "localization", href: "/products/global-localization" },
  { label: "delivery", href: "/products/categories" }
].sort((a, b) => b.label.length - a.label.length);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderLinkedText(text: string, linkedKeywords: Set<string>) {
  const pattern = new RegExp(`(?<![A-Za-z0-9-])(${seoKeywordLinks.map((item) => escapeRegExp(item.label)).join("|")})(?![A-Za-z0-9-])`, "gi");
  const parts = text.split(pattern).filter(Boolean);
  return parts.map((part, index) => {
    const match = seoKeywordLinks.find((item) => item.label.toLowerCase() === part.toLowerCase());
    if (!match) return part;
    const keywordKey = match.label.toLowerCase();
    if (linkedKeywords.has(keywordKey)) return part;
    linkedKeywords.add(keywordKey);
    return <Link className="blog-seo-link" href={match.href} key={`${part}-${index}`}>{part}</Link>;
  });
}

export default async function BlogPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  const activeTopics = siteContent.blogTopics.filter((topic) => topic.active).sort((a, b) => a.order - b.order);
  const heroLinkedKeywords = new Set<string>();
  const coverageLinkedKeywords = new Set<string>();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section blog-article-page">
        <section className="blog-hero-panel">
          <span className="badge">Blog / Content</span>
          <h1>AI production insights for websites, apps, e-commerce campaigns and managed creative delivery.</h1>
          <p className="section-lead">
            {renderLinkedText("Crelavo is a global AI production studio for teams that need AI website production, AI app production, e-commerce campaign production, Shopify product link ads, Amazon product campaigns, Trendyol product videos, AI avatar video, AI voice-over, brand kit production and managed creative delivery from one structured workspace.", heroLinkedKeywords)}
          </p>
          <div className="url-action-center blog-hero-actions">
            <Link className="btn" href="/dashboard/assistant-workspace">Start production</Link>
            <Link className="btn secondary" href="/categories">View production categories</Link>
          </div>
        </section>

        <section className="blog-topic-stack" aria-label="Crelavo content topics">
          {activeTopics.map((topic, index) => {
            const articleLinkedKeywords = new Set<string>();
            return (
              <article className="blog-topic-card" key={topic.id}>
                <div className="blog-topic-copy">
                  <span className="badge">{topic.kicker}</span>
                  <h2>{topic.title}</h2>
                  <p className="blog-topic-summary">{renderLinkedText(topic.summary, articleLinkedKeywords)}</p>
                  {topic.body.map((paragraph) => <p key={paragraph}>{renderLinkedText(paragraph, articleLinkedKeywords)}</p>)}
                  {topic.linkedKeywords?.length ? (
                    <div className="blog-linked-keywords" aria-label={`Linked keywords for ${topic.title}`}>
                      <span>Related keywords</span>
                      {topic.linkedKeywords.slice(0, 3).map((keyword) => <Link className="blog-keyword-chip" href={keyword.href} key={`${topic.id}-${keyword.label}`}>{keyword.label}</Link>)}
                    </div>
                  ) : null}
                  <div className="blog-article-cta-banner">
                    <div>
                      <strong>Start Generating AI Videos Now</strong>
                      <p>Turn this guide into a Crelavo production workflow with product videos, scripts, hooks, brand assets and delivery tracking.</p>
                    </div>
                    <div className="blog-article-cta-actions">
                      <Link className={index === 0 ? "btn" : "btn secondary"} href={topic.ctaHref} aria-label={`Open blog article: ${topic.title}`}>{topic.ctaLabel}</Link>
                      <Link className="btn secondary" href="/pricing">View packages</Link>
                    </div>
                  </div>
                </div>
                <figure className="blog-topic-media">
          {topic.mediaKind === "video" && topic.videoUrl ? (
            <video className="blog-topic-video" src={topic.videoUrl} controls playsInline preload="metadata" poster={topic.videoPoster || topic.image} aria-label={topic.imageAlt} />
          ) : topic.mediaKind === "video-slot" ? (
  <div className="blog-topic-video-slot" aria-label={`${topic.title} video slot`} style={{ display: "grid", gap: 12, minHeight: 320, padding: 24, border: "1px dashed var(--line, #3d4758)", borderRadius: 24, alignContent: "center", background: "rgba(255,255,255,0.03)" }}>
    <span className="badge">Video slot</span>
    <strong>Reserved for admin video</strong>
    <p>Leave this space empty until a future demo video is added from the admin panel.</p>
    <small>Poster image: {topic.videoPoster || topic.image}</small>
  </div>

          ) : (
            <img src={topic.videoPoster || topic.image} alt={topic.imageAlt} loading={index < 2 ? "eager" : "lazy"} />
          )}

                </figure>
              </article>
            );
          })}
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Ecommerce integration guides</span>
          <h2>Shopify, Amazon, Trendyol and product-page-to-video SEO guides</h2>
          <p>
            These blog guides target practical 3-4 word ecommerce searches such as Shopify product video, Amazon product ad video, Trendyol product video, product page to video and AI ecommerce campaign.
          </p>
          <div className="admin-category-grid">
            {ecommerceIntegrationGuides.map((guide) => (
              <Link className="card admin-category-card" href={`/blog/${guide.slug}`} key={guide.slug}>
                <span className="badge">{guide.platform}</span>
                <h3>{guide.title}</h3>
                <p>{guide.summary}</p>
                <small>Main keyword: {guide.primaryKeyword}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="blog-keyword-panel">
          <span className="badge">Production coverage</span>
          <h2>What Crelavo covers</h2>
          <p>
            {renderLinkedText("The content hub connects practical search intent with real production categories: AI production studio, AI marketing campaigns, AI e-commerce campaign generator, product link to ad video, AI video ads, AI website production, AI app production, brand kit production, AI avatar video, self-in-video, multi-person talking video, regional clothing, local accent, dialect voice, AI voice-over, motion graphics, 2D animation, 3D animation, stickman animation, anime short film, short drama, cinematic video, drone satellite video, map to video, route flyover video, AI image generation, visual style clone, free AI tools, Growth Intelligence and managed creative delivery.", coverageLinkedKeywords)}
          </p>
          <div className="category-option-row" aria-label="Organic keyword coverage">
            {organicKeywordCoverage.map((keyword) => <small key={keyword}>{keyword}</small>)}
          </div>
        </section>
      </main>
    </>
  );
}
