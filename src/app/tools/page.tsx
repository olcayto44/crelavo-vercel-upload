import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
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

const featuredToolCopy: Record<string, string> = {
  "ai-ad-performance-score-checker": "Score hooks, CTA clarity, and platform fit before you spend credits on a final render.",
  "ai-virtual-model-studio": "Generate model-ready product visuals for fashion, jewelry, beauty, and accessories.",
  "ai-cultural-localization": "Adapt messaging, tone, visuals, and CTA by market. More than translation.",
  "ai-campaign-calendar": "Plan Black Friday, Ramadan, New Year, back-to-school, and launch campaigns before the deadline.",
  "crelavo-academy": "Short lessons on product videos, UGC ads, hooks, and landing pages.",
  "community-showcase": "Approved examples you can reuse as a starting point in production."
};

export default async function ToolsPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} /><InnerMobileNav />
      <main className="container section tools-page tools-catalog-page public-funnel-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Tools</span>
          <h1>Crelavo tools</h1>
          <p>Score ads, plan campaigns, localize creative, and open production from here. Full production types stay on Categories.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Start production</Link>
            <Link className="btn secondary" href="/categories">Open categories</Link>
            <Link className="btn secondary" href="/pricing">View credits</Link>
          </div>
        </section>

        <section id="feature-paths" className="production-hero-card clean-feed-section" style={{ marginTop: 18 }}>
          <span className="badge">Featured tools</span>
          <h2>Six tools next to production</h2>
          <p>Validate an ad, prepare market-specific creative, plan a campaign, or open a sample. Then continue in the assistant.</p>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {phaseOneFeaturePages.map((page) => (
              <Link className="card admin-category-card production-pricing-card" href={`/${page.slug}`} key={page.slug}>
                <div className={`feature-card-visual feature-visual-${page.slug}`} aria-label={`${page.title} visual preview`}>
                  <div className="feature-visual-frame feature-visual-frame-large">
                    <span>{page.badge}</span>
                    <strong>{page.title}</strong>
                  </div>
                  <div className="feature-visual-metrics" aria-hidden="true">
                    {page.keywords.slice(0, 3).map((keyword) => <small key={`${page.slug}-tools-visual-${keyword}`}>{keyword}</small>)}
                  </div>
                </div>
                <span className="badge">{page.primaryKeyword}</span>
                <h3>{page.title}</h3>
                <p>{featuredToolCopy[page.slug] ?? page.summary}</p>
                <span className="text-link">Open {page.primaryKeyword} workflow</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
