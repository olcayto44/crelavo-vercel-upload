import Link from "next/link";
import { Header } from "@/components/Header";
import type { PhaseOneFeaturePage } from "@/lib/feature-phase-one";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export async function PhaseOneFeaturePageView({ page }: { page: PhaseOneFeaturePage }) {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">{page.badge} · Phase 1 SEO</span>
          <h1>{page.h1}</h1>
          <p className="section-lead">{page.summary}</p>
          <p>
            This is the SEO, category and roadmap layer. The MVP layer can deliver real reports, scripts, visuals, briefs or files through admin/assistant-assisted production before full API automation is added later.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Start a request</Link>
            <Link className="btn secondary" href="/categories">Open categories</Link>
            <Link className="btn secondary" href="/tools">Open tools</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Niche keyword cluster</span>
          <h2>{page.primaryKeyword} keywords and long-tail SEO paths</h2>
          <div className="admin-category-grid">
            {[page.primaryKeyword, ...page.keywords].map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Connected to Crelavo category, MVP delivery, credit pricing and future API automation paths.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Use cases</span>
          <h2>What this Crelavo category can be used for</h2>
          <div className="delivery-step-grid">
            {page.useCases.map((item) => (
              <div className="delivery-step-card" key={item}>
                <h3>{item}</h3>
                <p>Use this as a focused entry point before turning the request into a dashboard production.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Phase 2 MVP delivery</span>
          <h2>What users can receive in the MVP version</h2>
          <p>
            MVP does not mean a fake product. It means a smaller but real delivery path: the user submits a request, Crelavo prepares the output with admin/assistant support, and the user receives usable digital deliverables.
          </p>
          <ul>{page.mvpDeliverables.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Credits and pricing</span>
          <h2>Suggested credit model</h2>
          <ul>{page.creditModel.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Internal links</span>
          <h2>Continue from {page.title} into related Crelavo workflows</h2>
          <div className="plan-feature-groups">
            {page.internalLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                <b>{link.label}</b>
                <small>{link.note}</small>
              </Link>
            ))}
            <Link href="/ai-tool-launch-distribution-plan"><b>AI tool launch distribution plan</b><small>Launch and organic traffic planning</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>Credit package and delivery options</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
