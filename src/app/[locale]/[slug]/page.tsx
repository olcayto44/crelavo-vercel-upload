import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getLocalizedEuropePage, localizedEuropePages, localizedLanguageAlternates } from "@/lib/localized-europe-pages";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

type LocalizedPageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return localizedEuropePages.map((page) => ({ locale: page.locale, slug: page.slug }));
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
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
  const [{ locale, slug }, siteContent] = await Promise.all([params, getConfiguredSiteContentConfig()]);
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) notFound();

  return (
    <>
      <LocalizedStructuredData page={page} />
      <Header navLinks={siteContent.navLinks} />
      <main className="public-funnel-page localized-europe-page">
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
            <Link className="btn" href="/dashboard/create">{page.primaryCta}</Link>
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
              <span className="badge">Use cases</span>
              <h2>{page.locale === "tr" ? "Crelavo ile üretilebilecek işler" : page.locale === "fr" ? "Cas d’usage Crelavo" : "Crelavo use cases"}</h2>
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
