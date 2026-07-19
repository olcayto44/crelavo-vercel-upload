import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolsHubStructuredData } from "@/components/FreeToolsHubStructuredData";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { freeTools } from "@/lib/free-tools";

export const metadata: Metadata = {
  title: "Free AI Tools for TikTok Hooks, Product Descriptions, Prompts and Ecommerce Ads | Crelavo",
  description: "Use free AI tools for TikTok hooks, UGC ad scripts, product descriptions, prompts, SEO meta titles, landing page copy, ecommerce campaigns, captions and brand slogans, then continue into Crelavo production workflows.",
  alternates: { canonical: "/free-tools" }
};

export default async function FreeToolsPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  return (
    <>
      <FreeToolsHubStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section tools-page free-tools-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Free AI tools</span>
          <h1>Free AI tools for TikTok hooks, product descriptions, prompts, ecommerce ads and landing page copy</h1>
          <p>Use free AI tools for hooks, prompts, product descriptions, captions, UGC ad scripts, SEO meta titles, landing page copy and brand ideas. Then turn the result into a full Crelavo production package with preview, final ZIP, source files, README and revision path.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/free-tools/ad-performance-score-checker">Score an ad free</Link>
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
            <div><span>Step 4</span><strong>Buy credits when ready</strong><small>Payment Link launch uses the same Crelavo account email.</small></div>
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
