import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { alternativeHubKeywords, alternativePages } from "@/lib/alternative-pages";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Tool Alternatives for Video, Website, Ecommerce and Campaigns | Crelavo",
  description: "Compare Crelavo with popular AI tools and discover alternatives for AI product videos, ecommerce campaigns, website production, ad creative, social assets and AI + human QA delivery.",
  keywords: alternativeHubKeywords,
  alternates: { canonical: "/alternatives" },
  openGraph: {
    title: "AI Tool Alternatives | Crelavo",
    description: "Browse Crelavo alternative pages for AI video, ecommerce, ad creative, website builders and campaign production tools.",
    url: "/alternatives",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tool Alternatives | Crelavo",
    description: "Compare Crelavo with AI video, design, website, ecommerce and campaign production tools."
  }
};

const categoryGroups = Array.from(new Set(alternativePages.map((page) => page.category)));

export default async function AlternativesPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">AI tool alternatives</span>
          <h1>Crelavo alternatives for AI video, ecommerce campaigns, websites and creative production</h1>
          <p className="section-lead">
            Compare Crelavo with popular AI tools and find the right path for product videos, Shopify/Amazon/Trendyol campaigns, website production, app concepts, ad creative, social assets and AI + human QA delivery.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Start a Crelavo request</Link>
            <Link className="btn secondary" href="/categories/campaign">Open campaign category</Link>
            <Link className="btn secondary" href="/tools">Browse tools</Link>
            <Link className="btn secondary" href="/ai-tool-launch-distribution-plan">Launch distribution plan</Link>
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 18 }}>
          <span className="badge">SEO comparison hub</span>
          <h2>Alternative pages for high-intent comparison searches</h2>
          <p>
            These pages support searches like Canva alternative, Runway alternative, Synthesia alternative, Crelavo vs Runway, Crelavo vs HeyGen, best Shopify video generator tools, best AI product video generators, AI website builder alternative and Shopify video app alternative. Each page links back to Crelavo categories, tools, ecommerce product video pages, pricing and the assistant workspace.
          </p>
          <div className="category-option-row">
            {alternativeHubKeywords.map((keyword) => <small key={keyword}>{keyword}</small>)}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Coverage</span>
          <h2>Alternative categories covered</h2>
          <div className="admin-info-grid">
            {categoryGroups.map((category) => (
              <div key={category}>
                <span>{alternativePages.filter((page) => page.category === category).length} pages</span>
                <strong>{category}</strong>
                <small>Connected to Crelavo internal SEO paths.</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">How to compare</span>
          <h2>Use alternatives pages as a decision guide, not only a tool list</h2>
          <div className="admin-info-grid">
            <div><span>Self-serve fit</span><strong>Editor or template needed</strong><small>Choose a specialist tool when the user wants to edit directly and does not need production delivery support.</small></div>
            <div><span>Crelavo fit</span><strong>Brief-to-delivery needed</strong><small>Choose Crelavo when the project needs campaign context, asset planning, credit guidance, QA and dashboard handoff.</small></div>
            <div><span>Before checkout</span><strong>Compare scope first</strong><small>Check output count, channel, deadline, source files, revision needs and whether the workflow requires human review.</small></div>
            <div><span>Safe next step</span><strong>Start a focused brief</strong><small>Visitors can move from comparison intent into one clear Crelavo request instead of browsing every tool.</small></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/create">Start a focused brief</Link>
            <Link className="btn secondary" href="/pricing">Review pricing</Link>
            <Link className="btn secondary" href="/categories">Browse categories</Link>
          </div>
        </section>

        <section className="admin-category-grid" style={{ marginTop: 18 }}>
          {alternativePages.map((page) => (
            <Link className="card admin-category-card" href={`/alternatives/${page.slug}`} key={page.slug}>
              <span className="badge">{page.category}</span>
              <h2>{page.title}</h2>
              <p>{page.summary}</p>
              <p><strong>Main keyword:</strong> {page.primaryKeyword}</p>
            </Link>
          ))}
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Continue from alternatives into Crelavo production paths</h2>
          <div className="plan-feature-groups">
            <Link href="/ai-product-video-generator"><b>AI product video generator</b><small>Product video and ad video workflow</small></Link>
            <Link href="/shopify-product-link-to-ad-video"><b>Shopify product link to ad video</b><small>Product URL to campaign asset path</small></Link>
            <Link href="/amazon-product-ad-video"><b>Amazon product ad video</b><small>Marketplace product campaign workflow</small></Link>
            <Link href="/trendyol-product-video"><b>Trendyol product video</b><small>Regional ecommerce video path</small></Link>
            <Link href="/ai-website-builder"><b>AI website builder</b><small>Website and landing page production</small></Link>
            <Link href="/ai-tool-launch-distribution-plan"><b>AI tool launch distribution plan</b><small>Launch channel and organic traffic plan</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>Review delivery and package options</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
