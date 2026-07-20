import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
import { footerGroups } from "@/lib/site-content";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Tools Catalog for Video, Website, App, Ecommerce and Brand Production | Crelavo",
  description: "Explore Crelavo AI tools for product videos, Shopify ads, Amazon product videos, Trendyol campaigns, AI website builder workflows, app production, brand kits and social media assets.",
  keywords: [
    "AI tools catalog",
    "AI video tools",
    "AI website builder tools",
    "AI ecommerce tools",
    "brand kit tools",
    "social media production tools"
  ],
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "AI Tools Catalog | Crelavo",
    description: "Explore Crelavo AI tools for video, website, app, ecommerce and brand production.",
    url: "/tools",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tools Catalog | Crelavo",
    description: "Explore Crelavo AI tools for video, website, app, ecommerce and brand production."
  }
};

const toolGroups = footerGroups.filter((group) => ["Products", "Video Tools", "Music and Audio Tools", "Business and File Production", "More Production Categories"].includes(group.title));

export default async function ToolsPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section tools-page tools-catalog-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Tools catalog</span>
          <h1>AI tools catalog for product videos, websites, apps, ecommerce campaigns and brand production</h1>
          <p>
            Browse Crelavo tools by production area: AI product video generator, Shopify product link to ad video, Amazon product ad video, Trendyol product video, AI website builder, AI app builder, AI ecommerce builder, brand kit builder and social media campaign workflows. Each tool opens a focused information page first, then the user can continue into the production workspace, category page, dashboard or credit page.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Start a request</Link>
            <Link className="btn secondary" href="/categories">Open categories</Link>
            <Link className="btn secondary" href="/alternatives">AI tool alternatives</Link>
            <Link className="btn secondary" href="/chrome-extension">Chrome extension funnel</Link>
            <Link className="btn secondary" href="/ai-tool-launch-distribution-plan">Launch plan</Link>
            <Link className="btn secondary" href="/pricing">View credits</Link>
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 18 }}>
          <span className="badge">SEO tool coverage</span>
          <h2>Search-friendly tool paths for high-intent production needs</h2>
          <p>
            The catalog helps visitors discover the right Crelavo entry for AI product videos, AI website building, AI app creation, ecommerce campaigns, brand kits and social media workflows.
          </p>
          <div className="delivery-step-grid">
            <div className="delivery-step-card">
              <h3>Video tools</h3>
              <p>AI video generator, product video, talking video, clipping and motion workflows.</p>
            </div>
            <div className="delivery-step-card">
              <h3>Business tools</h3>
              <p>Website builder, app builder, ecommerce builder, brand kit and campaign planning.</p>
            </div>
            <div className="delivery-step-card">
              <h3>Growth tools</h3>
              <p>Social media, ads planning, credit paths and production-ready workflows.</p>
            </div>
          </div>
        </section>

        <section id="feature-paths" className="production-hero-card clean-feed-section" style={{ marginTop: 18 }}>
          <span className="badge">New Crelavo feature paths</span>
          <h2>AI ad scoring, virtual model visuals, cultural localization and campaign planning tools for ecommerce teams</h2>
          <p>
            Use these niche Crelavo entry points to validate ad ideas, prepare market-specific creative, plan seasonal campaigns and turn examples into credit-based production requests.
          </p>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {phaseOneFeaturePages.map((page) => (
              <Link className="card admin-category-card production-pricing-card" href={`/${page.slug}`} key={page.slug}>
                <div className="sample-video-preview sample-video-preview-cinematic" aria-label={`${page.title} preview`}>
                  <div className="sample-card-video sample-card-static-fallback" aria-hidden="true" />
                  <small>{page.badge}</small>
                  <strong>Preview</strong>
                </div>
                <span className="badge">{page.primaryKeyword}</span>
                <h3>{page.title}</h3>
                <p>{page.summary}</p>
                <span className="text-link">View page</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 18 }}>
          <span className="badge">Ecommerce integration paths</span>
          <h2>Shopify, WooCommerce, Amazon and Trendyol product video workflows</h2>
          <p>
            These paths connect product-page-to-video keywords with Crelavo's ecommerce campaign workflows, Shopify app roadmap, WooCommerce plugin roadmap and marketplace product video pages.
          </p>
          <div className="plan-feature-groups">
            <Link href="/shopify-ai-product-video-app"><b>Shopify AI product video app</b><small>Future Shopify App Store path</small></Link>
            <Link href="/woocommerce-ai-product-video-plugin"><b>WooCommerce AI product video plugin</b><small>Future WordPress plugin path</small></Link>
            <Link href="/blog/ecommerce-product-page-to-video-workflow"><b>Product page to video workflow</b><small>SEO guide for product URL campaigns</small></Link>
            <Link href="/blog/shopify-amazon-trendyol-ai-campaign-checklist"><b>AI ecommerce campaign checklist</b><small>Multi-platform campaign preparation</small></Link>
            <Link href="/ai-ugc-creator-program"><b>AI UGC creator program</b><small>Creator sourcing for UGC product demo ads</small></Link>
            <Link href="/samples/ugc-product-demo"><b>UGC product demo sample</b><small>Creator-style ecommerce video sample</small></Link>
            <Link href="/ai-tool-launch-distribution-plan"><b>AI tool launch distribution plan</b><small>Directory, community and organic traffic plan</small></Link>
            <Link href="/ai-social-media-launch-plan"><b>AI social media launch plan</b><small>Semi-automatic social sharing pack</small></Link>
            <Link href="/pinterest-youtube-visual-distribution-plan"><b>Pinterest + YouTube visual distribution</b><small>Visual search and Shorts sharing pack</small></Link>
          </div>
        </section>

        <section className="admin-category-grid" style={{ marginTop: 18 }}>
          {toolGroups.map((group, index) => (
            <div className={`card admin-category-card tools-catalog-card tools-tone-${index % 5}`} key={group.title}>
              <span className="badge">{group.title}</span>
              <h2>{group.title}</h2>
              <p>Open a tool guide, understand what it does, then continue to the right production flow.</p>
              <div className="plan-feature-groups">
                {group.links.map((link, linkIndex) => (
                  <Link className={`admin-inline-select tools-link-tone-${linkIndex % 4}`} href={link.href} key={`${group.title}-${link.label}`}>
                    <b>{link.label}</b>
                    <small>Open guide and start path</small>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
