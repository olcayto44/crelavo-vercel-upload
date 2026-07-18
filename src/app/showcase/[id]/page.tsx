import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { getShowcaseItem, showcaseItems } from "@/lib/showcase-items";

export function generateStaticParams() {
  return showcaseItems.map((item) => ({ id: item.id }));
}

const fallbackShowcaseVideoUrl = "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200506566226583-1783200506537.mp4";

function buildShowcaseKeywords(item: { title: string; description: string; longDescription: string; bestFor: string[] }) {
  const base = [
    `${item.title} showcase`,
    `${item.title} demo`,
    `${item.title} examples`,
    `${item.title} workflow`,
    `${item.title} for ${item.bestFor[0] || "creators"}`
  ];

  if (item.title.toLowerCase().includes("sample") || item.title.toLowerCase().includes("explore")) {
    return [
      ...base,
      "AI production samples",
      "AI video production samples",
      "website and app production samples",
      "ecommerce campaign samples",
      "managed creative delivery examples"
    ];
  }

  if (item.title.toLowerCase().includes("video") || item.title.toLowerCase().includes("motion") || item.title.toLowerCase().includes("seedance")) {
    return [
      ...base,
      "AI video showcase",
      "short-form video workflow",
      "AI product video examples",
      "cinematic video workflow",
      "motion production preview"
    ];
  }

  if (item.title.toLowerCase().includes("workspace") || item.title.toLowerCase().includes("assets") || item.title.toLowerCase().includes("omni")) {
    return [
      ...base,
      "production workspace demo",
      "asset library showcase",
      "assistant workflow example",
      "managed delivery workflow",
      "project tracking preview"
    ];
  }

  return [
    ...base,
    "Crelavo showcase page",
    "AI production studio demo",
    "managed production workflow",
    "category showcase",
    "creative delivery examples"
  ];
}

 type ShowcasePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ShowcasePageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getShowcaseItem(id);
  if (!item) return { title: "Showcase detail | Crelavo" };
  const keywords = buildShowcaseKeywords(item).slice(0, 3).join(", ");
  return {
    title: `${item.title} showcase for ${item.bestFor[0] || "Crelavo users"} | Crelavo`,
    description: `${item.longDescription} Explore ${keywords} and related Crelavo categories, tools and production workflows.`,
    alternates: { canonical: `/showcase/${item.id}` },
    openGraph: {
      title: `${item.title} | Crelavo`,
      description: item.longDescription,
      url: `/showcase/${item.id}`,
      type: "website"
    }
  };
}

export default async function ShowcaseDetailPage({ params }: ShowcasePageProps) {
  const [{ id }, siteContent] = await Promise.all([params, getConfiguredSiteContentConfig()]);
  const item = getShowcaseItem(id);
  if (!item) notFound();
  const keywords = buildShowcaseKeywords(item);
  const relatedItems = showcaseItems.filter((entry) => entry.group === item.group && entry.id !== item.id).slice(0, 3);
  const showcaseVideoUrl = item.videoUrl || fallbackShowcaseVideoUrl;

  return (
    <>
      <SiteStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="showcase-detail-page">
        <section className={`container showcase-detail-hero tone-${item.tone}`}>
          <div className="showcase-detail-copy">
            <Link className="showcase-back-link" href="/">
              <ArrowLeft size={16} /> Back to homepage
            </Link>
            <span className="badge"><Sparkles size={15} /> {item.eyebrow}</span>
            <h1>{item.title}</h1>
            <p>{item.longDescription}</p>
            <p className="section-lead">Search-friendly keywords: {keywords.slice(0, 4).join(", ")}. This showcase helps visitors move from inspiration into the right Crelavo category or production workflow.</p>
            <div className="showcase-detail-actions">
              <Link className="btn" href={item.primaryCtaHref}>{item.primaryCtaLabel}</Link>
              <Link className="btn secondary" href={item.secondaryCtaHref}>{item.secondaryCtaLabel}</Link>
            </div>
          </div>
          <div className="showcase-video-panel" aria-label={`${item.title} video preview`}>
            <video className="showcase-detail-video" src={showcaseVideoUrl} controls playsInline preload="metadata" poster={item.imageUrl} />
          </div>
        </section>

        <section className="container showcase-detail-keywords-section">
          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">SEO keyword coverage</span>
            <h2>{item.title} keywords and long-tail searches</h2>
            <p>This showcase page is designed to support search intent for people looking for demos, workflows, examples, production previews and category-specific inspiration.</p>
            <div className="showcase-pill-row">
              {keywords.slice(0, 10).map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
          </div>
        </section>

        <section className="container showcase-detail-grid-section">
          <div className="showcase-info-card">
            <span className="badge">Highlights</span>
            <h2>What this page explains</h2>
            <ul>
              {item.highlights.map((highlight) => (
                <li key={highlight}><CheckCircle2 size={18} /> {highlight}</li>
              ))}
            </ul>
          </div>

          <div className="showcase-info-card">
            <span className="badge">Workflow</span>
            <h2>How it works</h2>
            <ol>
              {item.workflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">Best for</span>
            <h2>Recommended use cases</h2>
            <div className="showcase-pill-row">
              {item.bestFor.map((useCase) => (
                <span key={useCase}>{useCase}</span>
              ))}
            </div>
          </div>
        </section>

        {relatedItems.length ? (
          <section className="container showcase-related-section">
            <div className="sample-video-head">
              <div>
                <span className="badge">Related</span>
                <h2>More {item.group === "feature" ? "production features" : "production categories"}</h2>
                <p className="section-lead">Explore other cards from the same moving showcase.</p>
              </div>
            </div>
            <div className="showcase-related-grid">
              {relatedItems.map((related) => (
                <Link className={`showcase-related-card tone-${related.tone}`} href={related.href} key={related.id}>
                  <span>{related.kicker}</span>
                  <strong>{related.title}</strong>
                  <p>{related.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
