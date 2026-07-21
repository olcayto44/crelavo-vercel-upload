import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const creatorKeywords = [
  "AI UGC creator",
  "UGC creator program",
  "product demo creator",
  "AI actor casting",
  "ecommerce UGC ads",
  "TikTok UGC creator",
  "Reels product demo",
  "short form creator",
  "creator marketplace",
  "AI video actor"
];

const creatorTypes = [
  { title: "Product demo creator", text: "Creators who can present skincare, fashion, gadgets, home products, apps or ecommerce offers in a clean product-demo style." },
  { title: "UGC ad actor", text: "Actors and creators who can record hook-led UGC ads for TikTok, Reels, Shorts and ecommerce campaign testing." },
  { title: "Niche marketplace creator", text: "Creators with specific category fit such as beauty, fashion, tech, home, fitness, SaaS, Turkish ecommerce or marketplace selling." },
  { title: "Multilingual video creator", text: "Creators who can support English, Turkish or other market-specific video ads, creator reads and localized product explainers." }
];

const intakeFields = [
  "Name and contact email",
  "Country, city and working language",
  "TikTok, Instagram, YouTube or portfolio URL",
  "Creator category: beauty, fashion, tech, home, fitness, SaaS, ecommerce or local market",
  "Video style: product demo, testimonial, talking video, unboxing, short ad or live commerce",
  "Consent and usage-rights confirmation before any client production",
  "Manual review status before being added to a creator pool"
];

export const metadata: Metadata = {
  title: "AI UGC Creator Program for Product Demo Actors | Crelavo",
  description: "Join the Crelavo AI UGC creator program for product demo creators, UGC ad actors, ecommerce video creators, TikTok/Reels product demos and AI video actor sourcing.",
  keywords: creatorKeywords,
  alternates: { canonical: "/ai-ugc-creator-program" },
  openGraph: {
    title: "AI UGC Creator Program | Crelavo",
    description: "Creator and actor sourcing path for ecommerce UGC ads, product demo videos and short-form product campaigns.",
    url: "/ai-ugc-creator-program",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI UGC Creator Program | Crelavo",
    description: "Apply for Crelavo UGC creator, product demo actor and ecommerce video creator opportunities."
  }
};

export default async function AiUgcCreatorProgramPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">AI UGC creator program</span>
          <h1>AI UGC creator program for product demo actors and ecommerce video creators</h1>
          <p className="section-lead">
            Crelavo is preparing a creator sourcing path for ecommerce UGC ads, product demo videos, TikTok/Reels creator reads, short-form product campaigns and AI-assisted video production workflows.
          </p>
          <p>
            This page targets niche searches like AI UGC creator, product demo creator, AI actor casting, ecommerce UGC ads and TikTok UGC creator while keeping intake manual, permission-based and safe.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/contact?topic=ugc-creator-program">Apply or contact Crelavo</Link>
            <Link className="btn secondary" href="/samples/ugc-product-demo">View UGC product demo sample</Link>
            <Link className="btn secondary" href="/categories/campaign">Open campaign category</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Niche SEO keywords</span>
          <h2>AI UGC creator keywords for short-form product campaigns</h2>
          <div className="admin-category-grid">
            {creatorKeywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Connected to product demo videos, ecommerce UGC ads, creator sourcing, short-form ad testing and Crelavo campaign production paths.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Creator categories</span>
          <h2>Who the Crelavo creator pool is for</h2>
          <p>
            This is not an open marketplace or automatic casting system. It is a structured sourcing page for creators and actors who support product videos, UGC ads, ecommerce campaigns, live-commerce tests and localized product demos.
          </p>
          <div className="delivery-step-grid">
            {creatorTypes.map((item) => (
              <div className="delivery-step-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Manual intake checklist</span>
          <h2>AI UGC actor crowdsourcing intake fields</h2>
          <p>
            Every creator should be reviewed manually before any production use. Consent, usage rights, category fit, language, portfolio links and platform style matter more than scale in the intake process.
          </p>
          <ul>{intakeFields.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Related UGC, sample and ecommerce production paths</h2>
          <div className="plan-feature-groups">
            <Link href="/samples/ugc-product-demo"><b>UGC product demo sample</b><small>Creator-style product demo example</small></Link>
            <Link href="/free-tools/tiktok-hook-generator"><b>TikTok Hook Generator</b><small>Prepare creator ad hooks</small></Link>
            <Link href="/free-tools/ecommerce-ad-script-generator"><b>Ecommerce Ad Script Generator</b><small>Turn products into UGC ad scripts</small></Link>
            <Link href="/ai-product-video-generator"><b>AI Product Video Generator</b><small>Product video workflow</small></Link>
            <Link href="/categories/campaign"><b>Ecommerce campaign category</b><small>Product-link ad campaign hub</small></Link>
            <Link href="/blog/shopify-amazon-trendyol-ai-campaign-checklist"><b>AI ecommerce campaign checklist</b><small>Prepare product campaign inputs</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
