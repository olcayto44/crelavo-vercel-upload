import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ecommerceIntegrationGuides, getEcommerceIntegrationGuide } from "@/lib/ecommerce-integration-guides";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export function generateStaticParams() {
  return ecommerceIntegrationGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getEcommerceIntegrationGuide(slug);
  if (!guide) return {};

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: [guide.primaryKeyword, ...guide.keywords],
    alternates: { canonical: `/blog/${guide.slug}` },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: `/blog/${guide.slug}`,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription
    },
    robots: { index: true, follow: true }
  };
}

export default async function EcommerceGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [siteContent, guide] = await Promise.all([getConfiguredSiteContentConfig(), Promise.resolve(getEcommerceIntegrationGuide(slug))]);
  if (!guide) notFound();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section blog-article-page service-page-detail">
        <section className="blog-hero-panel production-hero-card">
          <span className="badge">{guide.platform} guide</span>
          <h1>{guide.h1}</h1>
          <p className="section-lead">{guide.summary}</p>
          <p>Main SEO keyword: <strong>{guide.primaryKeyword}</strong>. Related searches: {guide.keywords.slice(0, 5).join(", ")}.</p>
          <div className="url-action-center blog-hero-actions">
            <Link className="btn" href={guide.ctaHref}>{guide.ctaLabel}</Link>
            <Link className="btn secondary" href="/blog">Back to blog</Link>
            <Link className="btn secondary" href="/categories/campaign">Campaign category</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Keyword cluster</span>
          <h2>{guide.primaryKeyword} keywords and ecommerce search intent</h2>
          <p>These 3-4 word and long-tail keywords help the page support product-link, marketplace, campaign and AI product video searches.</p>
          <div className="admin-category-grid">
            {guide.keywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Relevant to {guide.platform} product pages, ecommerce product videos, campaign briefs and Crelavo internal production paths.</p>
              </div>
            ))}
          </div>
        </section>

        <article className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Integration guide</span>
          {guide.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              <div className="delivery-step-grid">
                {section.bullets.map((item) => (
                  <div className="delivery-step-card" key={item}>
                    <h3>{item}</h3>
                    <p>Use this as a focused subtopic for {guide.primaryKeyword} and related ecommerce production searches.</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Continue from this guide into Crelavo ecommerce workflows</h2>
          <div className="plan-feature-groups">
            {guide.relatedLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                <b>{link.label}</b>
                <small>{link.note}</small>
              </Link>
            ))}
            <Link href="/ai-product-video-generator"><b>AI product video generator</b><small>Broad product video workflow</small></Link>
            <Link href="/categories/campaign"><b>Ecommerce campaign category</b><small>Product-link campaign hub</small></Link>
            <Link href="/tools"><b>AI tools catalog</b><small>All Crelavo production tools</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>Review package and delivery options</small></Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>{guide.title} questions</h2>
          <div className="admin-category-grid">
            {guide.faq.map((item) => (
              <div className="card admin-category-card" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
