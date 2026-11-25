import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { localizedSeoNavLinks } from "@/lib/site-content-config";
import { getLocalizedEuropePage, localizedEuropePages, localizedLanguageAlternates } from "@/lib/localized-europe-pages";

import {globalCategoryId,globalCategoryProfiles} from "@/lib/category-global-content";
import {globalCategoryMeta,localizedCategoryVisibility} from "@/lib/category-global-meta";
import {GlobalCategoryPage} from "@/components/GlobalCategoryPage";
import {categoryWorkspace} from "@/lib/category-public-routes";
export const dynamic="force-dynamic";
type LocalizedPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...localizedEuropePages.filter(page=>page.locale==="fr").map(page=>({slug:page.slug})),...Object.values(globalCategoryProfiles).map(p=>({slug:p.fr.slug}))];
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const id=globalCategoryId("fr",slug);if(id)return globalCategoryMeta(id,"fr");
  const locale = "fr";
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) return { title: "Localized Crelavo page" };

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
      languages: {
        "en-US": "/ai-video-generator",
        ...localizedLanguageAlternates(),
        "x-default": "/ai-video-generator"
      }
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
      type: "website"
    },
    robots: { index: true, follow: true }
  };
}

function LocalizedStructuredData({ page }: { page: (typeof localizedEuropePages)[number] }) {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "").replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}${page.path}#webpage`,
    url: `${siteUrl}${page.path}`,
    name: page.title,
    description: page.description,
    inLanguage: page.hreflang,
    isPartOf: { "@type": "WebSite", name: "Crelavo", url: siteUrl },
    about: {
      "@type": "Service",
      name: "Crelavo AI production studio",
      serviceType: "AI video, ecommerce and campaign production",
      areaServed: "Europe"
    }
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default async function LocalizedEuropePage({ params }: LocalizedPageProps) {
  const { slug } = await params;
  const id=globalCategoryId("fr",slug);if(id){if((await localizedCategoryVisibility(id)).draft)notFound();return <GlobalCategoryPage id={id} locale="fr"/>;}
  const locale = "fr";
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) notFound();

  return (
    <>
      <LocalizedStructuredData page={page} />
      <Header navLinks={localizedSeoNavLinks} languageOverride={page.locale} /><InnerMobileNav />
      <main lang={page.hreflang} className="public-funnel-page localized-europe-page">
        <section className="container section clean-feed-section localized-hero">
          <div className="localized-language-switcher" aria-label="Language versions">
            <Link href="/ai-video-generator">English</Link>
            {localizedEuropePages.map((item) => <Link className={item.locale === page.locale ? "active" : undefined} href={item.path} key={item.path}>{item.languageName}</Link>)}
          </div>
          <span className="badge">{page.eyebrow}</span>
          <h1>{page.h1}</h1>
          <p className="section-lead">{page.lead}</p>
          <p className="localized-market-note">{page.marketNote}</p>
          <div className="sample-detail-actions">
            <Link className="btn" href={categoryWorkspace("video")}>{page.primaryCta}</Link>
            <Link className="btn secondary" href="/pricing">{page.secondaryCta}</Link>
          </div>
        </section>

        <section className="container section home-section-tight clean-feed-section">
          <div className="admin-category-grid">
            {page.sections.map((section) => (
              <article className="card admin-category-card" key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container section home-section-tight clean-feed-section">
          <div className="sample-video-head">
            <div>
              <span className="badge">{page.locale === "tr" ? "Kullanım alanları" : page.locale === "fr" ? "Cas d’usage" : "Anwendungsfälle"}</span>
              <h2>{page.locale === "tr" ? "Crelavo ile üretilebilecek işler" : page.locale === "fr" ? "Cas d’usage Crelavo" : "Crelavo Anwendungsfälle"}</h2>
            </div>
          </div>
          <div className="showcase-pill-row">
            {page.useCases.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </main>
    </>
  );
}
