import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolsHubStructuredData } from "@/components/FreeToolsHubStructuredData";
import { Header } from "@/components/Header";
import { PageThumbnailStructuredData, defaultSearchThumbnail } from "@/components/PageThumbnailStructuredData";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { freeTools } from "@/lib/free-tools";

export const metadata: Metadata = {
  title: "Free AI Tools for Ad References, TikTok Hooks, Product Descriptions and Ecommerce Ads | Crelavo",
  description: "Use free AI tools for ad reference analysis, TikTok hooks, UGC ad scripts, product descriptions, prompts, SEO meta titles, landing page copy, ecommerce campaigns, captions and brand slogans, then continue into Crelavo production workflows.",
  alternates: { canonical: "/free-tools" },
  openGraph: {
    title: "Free AI Tools for Ad References and Ecommerce Ads | Crelavo",
    description: "Use free AI tools for ad reference analysis, TikTok hooks, product descriptions and ecommerce campaigns.",
    url: "/free-tools",
    type: "website",
    images: [{ url: defaultSearchThumbnail.path, width: defaultSearchThumbnail.width, height: defaultSearchThumbnail.height, alt: "Crelavo free AI tools dashboard preview" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Tools for Ad References and Ecommerce Ads | Crelavo",
    description: "Use free AI tools for ad reference analysis, TikTok hooks, product descriptions and ecommerce campaigns.",
    images: [defaultSearchThumbnail.path]
  }
};

const freeToolPreviewOffers = [
  {
    title: "$10 Business preview",
    text: "Best for a single seller testing ecommerce ad drafts, product video variations and campaign assets before the $79 monthly plan continues.",
    href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000",
    cta: "Start $10 preview"
  },
  {
    title: "$20 Team Annual preview",
    text: "Best for agencies and ecommerce teams testing the 174,000-credit annual workflow, 12 simultaneous tasks and team workspace before yearly billing continues.",
    href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000",
    cta: "Start $20 preview"
  }
];

export default async function FreeToolsPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  return (
    <>
      <FreeToolsHubStructuredData />
      <PageThumbnailStructuredData
        pagePath="/free-tools"
        pageTitle="Free AI Tools for Ad References and Ecommerce Ads | Crelavo"
        pageDescription="Use free AI tools for ad reference analysis, TikTok hooks, product descriptions and ecommerce campaigns."
        imageAlt="Crelavo free AI tools dashboard preview"
        pageType="CollectionPage"
      />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section tools-page free-tools-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Free AI tools</span>
          <h1>Free AI tools for ad references, TikTok hooks, product descriptions, prompts, ecommerce ads and landing page copy</h1>
          <p>Use free AI tools for ad reference analysis, hooks, prompts, product descriptions, captions, UGC ad scripts, SEO meta titles, landing page copy and brand ideas. Then turn the result into a full Crelavo production package with preview, final ZIP, source files, README and revision path.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/free-tools/ad-reference-analyzer">Analyze ad reference</Link>
            <Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Score an ad free</Link>
            <Link className="btn secondary" href="/dashboard/assistant-workspace">Open Crelavo Assistant</Link>
            <Link className="btn secondary" href="/pricing">Get credits for full production</Link>
          </div>
        </section>
        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">Free tool funnel</span>
          <h2>Generate a quick result, then continue into production</h2>
          <div className="admin-info-grid">
            <div><span>Step 1</span><strong>Use a free tool</strong><small>Create a hook, prompt, caption, ad script, product idea or ad score.</small></div>
            <div><span>Step 2</span><strong>Select the best result</strong><small>The selected output or ad score is carried into Assistant Workspace.</small></div>
            <div><span>Step 3</span><strong>Start production</strong><small>Turn the result into a delivery plan, credits and final package.</small></div>
            <div><span>Step 4</span><strong>Test with a preview</strong><small>Start with a $10 Business preview or $20 Team preview before committing to the full plan.</small></div>
          </div>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {freeToolPreviewOffers.map((offer) => (
              <Link className="card admin-category-card" href={offer.href} key={offer.title}>
                <span className="badge">Preview path</span>
                <h3>{offer.title}</h3>
                <p>{offer.text}</p>
                <span className="text-link">{offer.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 20 }}>
          <span className="badge">SEO categories</span>
          <h2>Free AI tools connected to Crelavo production categories</h2>
          <p>Start with a free generator, then continue into high-intent categories like AI product video generator, AI ecommerce builder, AI social media AI, AI video generator, AI website builder, pricing and all Crelavo production categories.</p>
          <div className="plan-feature-groups">
            <Link href="/ai-product-video-generator"><b>AI Product Video Generator</b><small>Turn scripts and product notes into product videos</small></Link>
            <Link href="/ai-ecommerce-builder"><b>AI Ecommerce Builder</b><small>Build ecommerce product pages, campaigns and descriptions</small></Link>
            <Link href="/ai-social-media-ai"><b>AI Social Media AI</b><small>Turn hooks and captions into social campaigns</small></Link>
            <Link href="/categories"><b>All production categories</b><small>Browse every Crelavo category</small></Link>
          </div>
        </section>

        <section className="admin-category-grid" style={{ marginTop: 20 }}>
          {freeTools.map((tool) => (
            <Link className="card admin-category-card" href={`/free-tools/${tool.slug}`} key={tool.slug}>
              <span className="badge">{tool.category}</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <small>{tool.keyword}</small>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
