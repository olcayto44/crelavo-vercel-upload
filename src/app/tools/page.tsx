import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
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
            <Link className="btn secondary" href="/chrome-extension">Chrome extension funnel</Link>
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
