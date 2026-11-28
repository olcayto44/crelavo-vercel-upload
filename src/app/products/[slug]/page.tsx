import type { Metadata } from "next";
import Link from "next/link";
import {CategoryDetailPage} from "@/components/CategoryDetailPage";
import {categoryDetailMeta} from "@/lib/category-detail-meta";
import { notFound } from "next/navigation";
import { footerInfoPageMap, footerInfoPages } from "@/lib/footer-info-pages";
import { CampaignWorkspaceBody } from "@/components/CampaignWorkspaceBody";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import {categoryForPublicPath,categoryWorkspace} from "@/lib/category-public-routes";

export function generateStaticParams() {
  return footerInfoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = footerInfoPageMap.get(slug);
  if (!page) return {};
  const canonical = `/products/${page.slug}`;
  const categoryId=categoryForPublicPath(canonical);if(categoryId)return categoryDetailMeta(categoryId);
  return {
    title: `${page.title} | Crelavo`,
    description: page.summary,
    alternates: { canonical },
    openGraph: {
      title: `${page.title} | Crelavo`,
      description: page.summary,
      url: canonical,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Crelavo`,
      description: page.summary
    },
    robots: { index: true, follow: true }
  };
}

export default async function FooterInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = footerInfoPageMap.get(slug);
  if (!page) notFound();

  const categoryId=categoryForPublicPath("/products/"+slug);
  if(categoryId)return <CategoryDetailPage id={categoryId}/>;
  if (slug === "text-to-campaign") return <><InnerMobileNav /><CampaignWorkspaceBody /></>;

  const site = await getConfiguredSiteContentConfig();
  return (
    <>
      <Header navLinks={site.navLinks} /><InnerMobileNav />
      <main className="container section product-detail-page cr-public-page cr-legacy-product">
      <section className="production-hero-card admin-overview-hero">
        <nav aria-label="Breadcrumb" style={{fontSize:12,marginBottom:12}}><Link href="/">Home</Link> / <Link href="/categories">Categories</Link> / {page.title}</nav>
        <span className="badge">{page.badge}</span>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
        {categoryId&&<p>Start with a category-specific brief and plan. Automated production and final delivery depend on the supported tools, confirmed scope and approval.</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href={categoryId?categoryWorkspace(categoryId):page.primaryCtaHref}>{categoryId?"Start category project":page.primaryCtaLabel}</Link>
          {page.secondaryCtaHref && page.secondaryCtaLabel ? <Link className="btn secondary" href={page.secondaryCtaHref}>{page.secondaryCtaLabel}</Link> : null}
          <Link className="btn secondary" href="/tools">All tools</Link>
        </div>
      </section>

      <section className="admin-info-grid" style={{ marginTop: 18 }}>
        <div><span>Group</span><strong>{page.group}</strong><small>Crelavo production area</small></div>
        <div><span>Best for</span><strong>{page.bestFor}</strong><small>Recommended use case</small></div>
        <div><span>Input</span><strong>{page.input}</strong><small>What the user should provide</small></div>
        <div><span>Output</span><strong>{page.output}</strong><small>What Crelavo prepares</small></div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">How it works</span>
        <h2>From selection to production</h2>
        <div className="plan-feature-groups">
          {page.steps.map((step, index) => (
            <div key={step}>
              <b>{index + 1}. {step}</b>
              <small>Continue when ready and Crelavo will route the request to the right workspace flow.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Example uses</span>
        <h2>What users can do here</h2>
          <div className="admin-category-grid">
            {page.examples.map((item) => (
              <Link className="card admin-category-card" href={categoryId?categoryWorkspace(categoryId):`/dashboard/assistant-workspace?idea=${encodeURIComponent(item)}&mode=project`} key={item}>
                <span className="badge">{page.label}</span>
                <h3>{item}</h3>
                <p>Use this example as the starting brief.</p>
              </Link>
            ))}
          </div>
      </section>
      </main>
    </>
  );
}
