import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGroupBrowser } from "@/components/CategoryGroupBrowser";
import { Header } from "@/components/Header";
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
      <main className="container section public-funnel-page categories-funnel-page">
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
            <Link className="btn" href="/dashboard/assistant-workspace">Open Work</Link>
          </div>
        </section>

        <CategoryGroupBrowser />

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Ready to create?</span>
          <h2>Use one of the categories above or open Work directly</h2>
          <p>The category page stays focused on choosing the production type. Credit packages and checkout stay on the credits page.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Open Work</Link>
            <Link className="btn secondary" href="/dashboard/credits">Open credits</Link>
          </div>
        </section>
      </main>
    </>
  );
}
