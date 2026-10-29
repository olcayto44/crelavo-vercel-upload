import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGroupBrowser } from "@/components/CategoryGroupBrowser";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { PageThumbnailStructuredData, defaultSearchThumbnail } from "@/components/PageThumbnailStructuredData";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Production Categories for Video, Website, App and Ecommerce | Crelavo",
  description: "Choose Crelavo AI production categories for video, websites, apps, ecommerce campaigns, product ads, brand kits and social media assets.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "AI Production Categories | Crelavo",
    description: "Choose the Crelavo production path for video, websites, apps, ecommerce campaigns and brand assets.",
    url: "/categories",
    type: "website",
    images: [{ url: defaultSearchThumbnail.path, width: defaultSearchThumbnail.width, height: defaultSearchThumbnail.height, alt: "Crelavo AI production categories dashboard preview" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Production Categories | Crelavo",
    description: "Choose the Crelavo production path for video, websites, apps, ecommerce campaigns and brand assets.",
    images: [defaultSearchThumbnail.path]
  }
};

export default async function CategoriesPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <PageThumbnailStructuredData
        pagePath="/categories"
        pageTitle="AI Production Categories | Crelavo"
        pageDescription="Choose Crelavo AI production categories for video, websites, apps, ecommerce campaigns and brand assets."
        imageAlt="Crelavo AI production categories dashboard preview"
        pageType="CollectionPage"
      />
      <Header navLinks={siteContent.navLinks} />
      <InnerMobileNav />
      <main id="clc" className="container section public-funnel-page categories-funnel-page">
        <style>{`.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}.page-with-rails{padding-left:0!important;padding-right:0!important}html{scroll-behavior:smooth}#clc a.category-tab-card{text-decoration:none;color:inherit}#clc .clc-btn-row{display:flex;gap:10px;flex-wrap:wrap}#clc .clc-btn-row .btn{flex:1 1 auto}#clc .category-browser{display:grid;gap:24px;margin-top:24px}#clc .category-group-head{display:grid;gap:10px;min-width:0}#clc .category-group-head h2,#clc .category-group-head p{margin:0;overflow-wrap:normal;word-break:normal;white-space:normal;line-height:1.35}#clc .category-tab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px}#clc .category-tab-card{display:grid;gap:7px;min-width:0;padding:16px;border:1px solid rgba(148,163,184,.18);border-radius:18px;background:rgba(255,255,255,.045)}#clc .category-tab-card span,#clc .category-tab-card small{display:block;line-height:1.4;overflow-wrap:anywhere}#clc .category-tab-card strong{display:block;line-height:1.2}#clc .category-group-section{display:grid;gap:14px;margin-top:0;min-width:0}#clc .production-pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px;align-items:stretch}#clc .production-pricing-card{display:flex;flex-direction:column;gap:12px;min-width:0;min-height:100%;padding:18px;box-sizing:border-box;overflow:hidden}#clc .production-pricing-card>svg{flex:0 0 auto}#clc .production-pricing-card h3,#clc .production-pricing-card p{margin:0;line-height:1.45;overflow-wrap:normal;word-break:normal;white-space:normal}#clc .category-card-visual{display:grid;gap:10px;min-height:150px;padding:18px;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;background:linear-gradient(135deg,rgba(34,211,238,.16),rgba(124,92,255,.16));position:relative}#clc .category-visual-panel-main{display:grid;gap:7px;align-content:start;position:relative;z-index:1}#clc .category-visual-panel-main strong,#clc .category-visual-panel-main small{display:block;line-height:1.25;overflow-wrap:anywhere}#clc .category-visual-strip{display:flex;flex-wrap:wrap;gap:6px;align-self:end;position:relative;z-index:1}#clc .category-visual-strip span,#clc .category-option-row small{display:inline-block;line-height:1.25;white-space:normal;overflow-wrap:anywhere}#clc .category-visual-strip span{padding:5px 8px;border-radius:999px;background:rgba(2,6,23,.3);font-size:.72rem}#clc .category-option-row{display:flex;flex-wrap:wrap;gap:6px;min-width:0}#clc .category-option-row small{padding:5px 8px;border:1px solid rgba(148,163,184,.2);border-radius:999px}#clc .production-package-list{display:grid;gap:8px;min-width:0}#clc .production-package-list>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-top:1px solid rgba(148,163,184,.14)}#clc .production-package-list strong,#clc .production-package-list span{display:block;line-height:1.35;overflow-wrap:anywhere}#clc .production-package-list span{text-align:right}#clc .production-pricing-card .clc-btn-row{margin-top:auto}#clc .production-pricing-card .btn{min-height:42px;justify-content:center;text-align:center;white-space:normal;line-height:1.2}@media(max-width:700px){#clc .promo-top-layout{grid-template-columns:1fr}#clc .production-pricing-grid{grid-template-columns:1fr}#clc .production-package-list>div{grid-template-columns:1fr}#clc .production-package-list span{text-align:left}}`}</style>
        <section className="promo-top-layout">
          <div>
            <span className="badge">Production categories</span>
            <h1>Choose what you want Crelavo to produce</h1>
            <p className="section-lead">
              Pick the production path first: video, product-link ads, UGC-style ads, creative angles, lower-cost ad planning, websites, apps, brand kits, images, voice and campaign assets.
            </p>
          </div>
          <div className="production-hero-card clean-feed-section">
            <span className="badge">Simple flow</span>
            <h2>Category → brief → production</h2>
            <p>Choose a category, describe what you need, and continue inside the Crelavo workspace.</p>
            <Link className="btn" href="/join">Open Work</Link>
          </div>
        </section>

        <CategoryGroupBrowser />

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Ready to create?</span>
          <h2>Use one of the categories above or open Work directly</h2>
          <p>The category page stays focused on choosing the production type. Credit packages and checkout stay on the credits page.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link className="btn" href="/join">Open Work</Link>
            <Link className="btn secondary" href="/dashboard/credits">Open credits</Link>
          </div>
        </section>
      </main>
    </>
  );
}
