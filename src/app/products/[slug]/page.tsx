import Link from "next/link";
import { notFound } from "next/navigation";
import { footerInfoPageMap, footerInfoPages } from "@/lib/footer-info-pages";

export function generateStaticParams() {
  return footerInfoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = footerInfoPageMap.get(slug);
  if (!page) return {};
  return {
    title: `${page.title} | Crelavo`,
    description: page.summary
  };
}

export default async function FooterInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = footerInfoPageMap.get(slug);
  if (!page) notFound();

  return (
    <main className="container section product-detail-page">
      <section className="production-hero-card admin-overview-hero">
        <span className="badge">{page.badge}</span>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href={page.primaryCtaHref}>{page.primaryCtaLabel}</Link>
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
              <Link className="card admin-category-card" href={`/dashboard/assistant-workspace?idea=${encodeURIComponent(item)}&mode=project`} key={item}>
                <span className="badge">{page.label}</span>
                <h3>{item}</h3>
                <p>Use this example as the starting brief.</p>
              </Link>
            ))}
          </div>
      </section>
    </main>
  );
}
