import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, PackageCheck, Send } from "lucide-react";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { CategoryGroupBrowser } from "@/components/CategoryGroupBrowser";
import { Header } from "@/components/Header";
import { HomeShowcaseSlider, type HomeShowcaseSlide } from "@/components/HomeShowcaseSlider";
import { categoryShowcaseItems } from "@/lib/showcase-items";
import { getConfiguredCategoryPages } from "@/lib/category-pages-loader";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Production Categories for Video, Website, App and Ecommerce | Crelavo",
  description: "Browse Crelavo AI production categories for AI video generator workflows, AI website builder pages, ecommerce campaigns, product videos, apps, brand kits and social media assets.",
  keywords: [
    "AI production categories",
    "AI video generator workflows",
    "AI website builder categories",
    "AI app builder categories",
    "AI ecommerce campaign categories",
    "brand kit category page"
  ],
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "AI Production Categories | Crelavo",
    description: "Browse Crelavo AI production categories for video, websites, apps, ecommerce campaigns and brand assets.",
    url: "/categories",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Production Categories | Crelavo",
    description: "Browse Crelavo AI production categories for video, websites, apps, ecommerce campaigns and brand assets."
  }
};

type CategoryShowcaseSlide = HomeShowcaseSlide & { section?: "launcher" | "features" | "categories"; order?: number; active?: boolean };

function categorySlides(slides: CategoryShowcaseSlide[]) {
  const configured = slides
    .filter((slide) => slide.section === "categories" && slide.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return configured.length ? configured : categoryShowcaseItems;
}

const deliverySteps = [
  {
    icon: PackageCheck,
    title: "1. Choose a category",
    text: "Choose campaign, AI agent, localization, video, website, mobile app, brand kit, document, visual or admin panel production."
  },
  {
    icon: Send,
    title: "2. Submit the request",
    text: "Write the platform, style, features, pages, screens, files and delivery expectations."
  },
  {
    icon: BadgeCheck,
    title: "3. Receive the files",
    text: "Admin adds previews, ZIP packages, source files, README and delivery notes to the user dashboard."
  }
];

export default async function CategoriesPage() {
  const [siteContent, categoryPages] = await Promise.all([getConfiguredSiteContentConfig(), getConfiguredCategoryPages()]);

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <section className="promo-top-layout">
          <div>
            <span className="badge">Production categories</span>
            <h1>AI production categories for video, websites, apps, ecommerce campaigns and brand assets</h1>
            <p className="section-lead">
              Crelavo is now a broader AI production platform: AI video generator workflows, AI website builder pages, AI app production, Shopify/Amazon/Trendyol ecommerce campaigns, Text-to-Campaign, AI Agents, Global Localization, visuals, brand kits, document packs and admin-panel projects can all start from one managed request.
            </p>
          </div>
          <div className="promo-corner-slot categories-promo-slot"><CampaignPromoSlot /></div>
        </section>

        <section className="production-hero-card clean-feed-section category-delivery-template">
          <span className="badge">Category-based delivery template</span>
          <h2>Choose the production type first, then track delivery files from the panel</h2>
          <p>
            Every category follows the same core flow: the user creates a request, credits are reserved, admin manages production and delivery links are added to the dashboard.
          </p>
          <div className="delivery-step-grid">
            {deliverySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div className="delivery-step-card" key={step.title}>
                  <Icon color="var(--cyan)" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <HomeShowcaseSlider title="Crelavo production categories" subtitle="A moving showcase for Crelavo production categories: video, web, apps, avatars, brand files and e-commerce." slides={categorySlides(siteContent.showcaseSlides)} />

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Programmatic SEO category pages</span>
          <h2>Search pages that can be edited from admin</h2>
          <p>
            These public category pages can be added, hidden and updated from the admin panel. Each page has its own SEO summary, sections, FAQs and redirect links.
          </p>
          <div className="delivery-step-grid">
            {categoryPages.slice(0, 3).map((page) => (
              <div className="delivery-step-card" key={page.slug}>
                <h3>{page.title}</h3>
                <p>{page.summary}</p>
                <Link className="btn secondary" href={`/categories/${page.slug}`}>Open page</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Alternative SEO pages</span>
          <h2>Compare Crelavo with AI video, design, website and campaign tools</h2>
          <p>
            The alternatives hub supports comparison searches like Canva alternative, Runway alternative, Synthesia alternative, AI product video generator alternative and Shopify video app alternative, then routes visitors into Crelavo categories and production workflows.
          </p>
          <Link className="btn secondary" href="/alternatives">Open AI tool alternatives</Link>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">SEO category coverage</span>
          <h2>High-intent production categories and search paths</h2>
          <p>
            This page supports visitors who search for AI video generator categories, AI website builder categories, AI app builder workflows, ecommerce campaign paths, brand kits and social media production options.
          </p>
          <div className="delivery-step-grid">
            <div className="delivery-step-card">
              <h3>AI video and motion</h3>
              <p>Product videos, social clips, shorts, ads, avatar video and motion workflows.</p>
            </div>
            <div className="delivery-step-card">
              <h3>Web and app production</h3>
              <p>Landing pages, SaaS websites, mobile apps, dashboards and admin panels.</p>
            </div>
            <div className="delivery-step-card">
              <h3>Ecommerce and brand assets</h3>
              <p>Shopify, Amazon, Trendyol, product pages, brand kits and reusable campaign material.</p>
            </div>
          </div>
        </section>

        <CategoryGroupBrowser />

        <div style={{ marginTop: 24 }}>
          <Link className="btn" href="/dashboard/credits">Open credits</Link>
        </div>
      </main>
    </>
  );
}
