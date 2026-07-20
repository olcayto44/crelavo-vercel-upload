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
            {page.slug === "ai-ad-performance-score-checker" ? (
              <>
                <Link className="btn" href="/free-tools/ad-performance-score-checker">Run the free ad score now</Link>
                <Link className="btn secondary" href="/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Score%20my%20ad%20and%20turn%20it%20into%20a%20stronger%20campaign">Turn score into campaign</Link>
              </>
            ) : <Link className="btn" href="/dashboard/assistant-workspace">Start a request</Link>}
            <Link className="btn secondary" href="/categories">Open categories</Link>
            <Link className="btn secondary" href="/tools">Open tools</Link>
          </div>
        </section>

        {page.slug === "ai-ad-performance-score-checker" ? (
          <section className="card admin-wide-card" style={{ marginTop: 18 }}>
            <span className="badge">Free lead magnet</span>
            <h2>Score the ad first, then sell the stronger campaign path</h2>
            <p style={{ color: "var(--muted)" }}>
              This page now acts as the low-friction entry door: visitors can paste an ad hook, script, product offer or video idea, get a quick score, then carry the selected result into Assistant Workspace for an AI + human QA campaign brief.
            </p>
            <div className="admin-info-grid">
              <div><span>Free value</span><strong>Instant score</strong><small>Hook strength, CTA clarity, platform fit and conversion weak spots.</small></div>
              <div><span>Capture intent</span><strong>Selected result</strong><small>The score output is passed into Assistant Workspace as context.</small></div>
              <div><span>Upgrade path</span><strong>Production brief</strong><small>Turn the weak points into improved angles, script and video direction.</small></div>
              <div><span>Paid path</span><strong>Preview / package</strong><small>Credits are introduced after the visitor understands the campaign gap.</small></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn" href="/free-tools/ad-performance-score-checker">Open free AI Ad Scorer</Link>
              <Link className="btn secondary" href="/free-tools/ecommerce-ad-script-generator">Write an ad script first</Link>
              <Link className="btn secondary" href="/ai-product-video-generator">Create product video after scoring</Link>
            </div>
          </section>
        ) : null}

        {page.slug === "crelavo-academy" ? (
          <section className="card admin-wide-card" style={{ marginTop: 18 }}>
            <span className="badge">SEO content engine</span>
            <h2>Turn Crelavo Academy into a learning hub that feeds production demand</h2>
            <p style={{ color: "var(--muted)" }}>
              The Academy page now explains the content engine behind Crelavo: beginner lessons create organic traffic, each lesson links to a related free tool or production path, and the best learners can move into credit-based AI + human QA production.
            </p>
            <div className="admin-info-grid">
              <div><span>Lesson cluster</span><strong>Product video basics</strong><small>Teach product links, hooks, proof points and short-form ad structure.</small></div>
              <div><span>Lesson cluster</span><strong>Ecommerce localization</strong><small>Teach country-specific buyer psychology before paid localization briefs.</small></div>
              <div><span>Lesson cluster</span><strong>AI creative workflow</strong><small>Teach prompt, storyboard, voice, visuals and delivery handoff basics.</small></div>
              <div><span>Conversion path</span><strong>Learn → tool → brief</strong><small>Each lesson sends users to Free Tools, Assistant Workspace or Pricing.</small></div>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              <Link className="card admin-category-card" href="/blog/shopify-product-link-to-ai-video-guide">
                <span className="badge">Lesson 01</span>
                <h3>Shopify product link to AI video</h3>
                <p>Teach sellers how product pages become ad hooks, video briefs and delivery-ready creative packages.</p>
              </Link>
              <Link className="card admin-category-card" href="/blog/shopify-amazon-trendyol-ai-campaign-checklist">
                <span className="badge">Lesson 02</span>
                <h3>Marketplace campaign checklist</h3>
                <p>Teach ecommerce teams what to prepare before requesting Shopify, Amazon or Trendyol campaign assets.</p>
              </Link>
              <Link className="card admin-category-card" href="/ai-cultural-localization">
                <span className="badge">Lesson 03</span>
                <h3>Cultural localization proof</h3>
                <p>Teach why hooks, CTA, proof and buyer trust need to change by market.</p>
              </Link>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn" href="/blog">Open content hub</Link>
              <Link className="btn secondary" href="/free-tools">Open free tools</Link>
              <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Turn%20this%20lesson%20into%20a%20production%20brief">Turn lesson into brief</Link>
            </div>
          </section>
        ) : null}

        {page.slug === "ai-cultural-localization" ? (
          <section className="card admin-wide-card" style={{ marginTop: 18 }}>
            <span className="badge">Before / after proof</span>
            <h2>Show how one product message changes for different markets</h2>
            <p style={{ color: "var(--muted)" }}>
              Cultural localization needs visual proof, not only SEO copy. This proof block compares the same ecommerce product before localization and after Crelavo adapts the hook, CTA, proof angle, pacing and buyer trust message for specific markets.
            </p>
            <div className="admin-category-grid">
              <div className="card admin-category-card production-pricing-card">
                <div className="sample-video-preview sample-video-preview-cinematic" aria-label="Before localization preview">
                  <div className="sample-card-video sample-card-static-fallback" aria-hidden="true" />
                  <small>Before</small>
                  <strong>Generic global ad</strong>
                </div>
                <h3>Before localization</h3>
                <p>Same hook, same claim, same CTA and same visual rhythm for every market. The message may be clear, but buyer trust, cultural proof and local urgency are weak.</p>
              </div>
              <div className="card admin-category-card production-pricing-card">
                <div className="sample-video-preview sample-video-preview-cinematic" aria-label="After localization preview">
                  <div className="sample-card-video sample-card-static-fallback" aria-hidden="true" />
                  <small>After</small>
                  <strong>Market-specific campaign</strong>
                </div>
                <h3>After Crelavo localization</h3>
                <p>Country-specific hook, local buyer objection, proof angle, CTA wording, visual pace and AI + human QA notes are prepared before production credits are spent.</p>
              </div>
            </div>
            <div className="admin-info-grid" style={{ marginTop: 16 }}>
              <div><span>Hook</span><strong>Local buying trigger</strong><small>Different first sentence for Germany, USA, Gulf, Japan or Turkey.</small></div>
              <div><span>Proof</span><strong>Market trust signal</strong><small>Reviews, guarantees, before/after logic or local usage context.</small></div>
              <div><span>Visuals</span><strong>Country fit</strong><small>Pace, framing, product context and lifestyle direction are adapted.</small></div>
              <div><span>Output</span><strong>Production brief</strong><small>The result becomes a dashboard-ready localized campaign request.</small></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn" href="/dashboard/assistant-workspace?mode=commerce&category=cultural_localization&idea=Localize%20my%20product%20campaign">Prepare localization brief</Link>
              <Link className="btn secondary" href="/blog/shopify-amazon-trendyol-ai-campaign-checklist">Open ecommerce checklist</Link>
              <Link className="btn secondary" href="/categories/campaign">Open campaign category</Link>
            </div>
          </section>
        ) : null}

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
