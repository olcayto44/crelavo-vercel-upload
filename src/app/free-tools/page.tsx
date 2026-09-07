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

const couponHuntCards = [
  {
    title: "Hidden preview code campaign",
    text: "On real campaign days, Crelavo can hide limited preview promo codes inside the Free AI Ad Scorer results. The campaign must be time-boxed and codes must actually exist before this copy is promoted.",
    href: "/free-tools/ad-performance-score-checker"
  },
  {
    title: "Use the score before checkout",
    text: "The user gets a useful ad score first, then sees the preview path only after understanding which hook, proof point or CTA should be improved.",
    href: "/free-tools/ad-performance-score-checker"
  },
  {
    title: "Safe FOMO guardrail",
    text: "Use wording like 'campaign-day hidden codes' or 'up to 50% off when active'. Do not show invented scarcity, expired codes or permanent daily resets.",
    href: "/admin/growth"
  }
];

const freeToolPreviewOffers = [
  {
    title: "Crelavo Pro 24-hour trial",
    text: "Start for $0 with one trial production and 2,500 credits/month after the trial. Then $9.99 every 30 days unless cancelled in Whop.",
    href: "https://whop.com/checkout/plan_ujLQgM3kEg0dg",
    cta: "Start free 24-hour trial"
  },
  {
    title: "Crelavo Pro Annual",
    text: "Use the same 24-hour trial, then continue at $99/year unless cancelled in Whop.",
    href: "https://whop.com/checkout/plan_fiabRYr6uWY43",
    cta: "Start free 24-hour trial"
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
            <div><span>Step 4</span><strong>Start the Pro trial</strong><small>Start for $0, make one trial production, then continue monthly or annually unless cancelled in Whop.</small></div>
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
          <span className="badge">Campaign-day Coupon Hunt</span>
          <h2>Turn the Free AI Ad Scorer into a high-intent preview funnel</h2>
          <p style={{ color: "var(--muted)" }}>When a real Whop promo campaign is active, the Free AI Ad Scorer can tease hidden preview codes after users generate useful ad feedback. This keeps visitors engaged without pretending a fake discount exists.</p>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {couponHuntCards.map((item) => (
              <Link className="card admin-category-card" href={item.href} key={item.title}>
                <span className="badge">Controlled FOMO</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
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
