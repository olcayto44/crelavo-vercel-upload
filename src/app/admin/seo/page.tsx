import { AdminShell } from "@/components/AdminShell";
import { AdminSeoCompetitorAgent } from "@/components/AdminSeoCompetitorAgent";
import { googleIndexingAllSitemapUrls, googleIndexingContinuationUrls, googleIndexingGuardrails, googleIndexingSubmittedUrls, indexingChecklist, searchEngineSubmitTargets } from "@/lib/google-indexing";
import { globalSeoExpansionPlan, growthDataOptimizationPlan, programmaticSeoQualityGuardPlan, technicalSeoIntegrityPlan } from "@/lib/launch-ops-readiness";
import { seoLaunchKit } from "@/lib/seo-launch-kit";

const seoModules = [
  { title: "Meta title / description", file: "app metadata", fields: ["Default title", "Default description", "Page keywords", "Canonical base URL"] },
  { title: "Sitemap.xml", file: "src/app/sitemap.ts", fields: ["Static routes", "Public marketing routes", "Private route guard", "Last modified policy"] },
  { title: "Robots.txt", file: "src/app/robots.ts", fields: ["Allow rules", "Disallow admin/api/dashboard/auth", "Sitemap URL", "Crawler policy"] },
  { title: "Google Search Console", file: "manual submission", fields: ["Domain property", "Sitemap submit status", "URL inspection", "Indexing notes"] },
  { title: "Google Analytics / Tag Manager", file: "layout script area", fields: ["GA measurement ID", "GTM container ID", "Cookie consent", "Conversion events"] },
  { title: "Open Graph", file: "social preview config", fields: ["OG title", "OG description", "OG image", "Twitter card"] },
  { title: "Cultural localization proof", file: "src/components/PhaseOneFeaturePage.tsx", fields: ["Before/after proof block", "Localized campaign internal links", "Ecommerce checklist blog CTA", "Campaign category CTA"] },
  { title: "Academy content engine", file: "src/components/PhaseOneFeaturePage.tsx", fields: ["Lesson cluster cards", "Free tool CTAs", "Blog hub CTA", "Assistant brief CTA"] },
  { title: "Programmatic SEO engine", file: "src/app/blog/page.tsx", fields: ["Platform + product video template", "Industry + campaign asset template", "Country + localization template", "Problem + free tool template"] },
  { title: "Visual SEO / alt text", file: "public media components", fields: ["Sample gallery poster alt", "Showcase video aria-label", "Sample detail video aria-label", "Page demo video aria-label"] }
];

export default function AdminSeoPage() {
  return (
    <AdminShell title="SEO / Sitemap / Google" description="Manage SEO files, Google settings, sitemap, robots, metadata, and social sharing previews.">
      <section className="card admin-wide-card">
        <span className="badge">16 · Tier-1 global SEO plan</span>
        <h2>Country/use-case SEO plan needs owner priority before scale</h2>
        <p style={{ color: "var(--muted)" }}>{globalSeoExpansionPlan.qualityGuard}</p>
        <div className="admin-info-grid">
          <div><span>Status</span><strong>{globalSeoExpansionPlan.status}</strong><small>{seoLaunchKit.tier1GlobalSeoPlan.ownerGate}</small></div>
          <div><span>Countries</span><strong>{globalSeoExpansionPlan.countryPages.length} markets</strong><small>{globalSeoExpansionPlan.countryPages.join(", ")}</small></div>
          <div><span>Use cases</span><strong>{globalSeoExpansionPlan.useCaseClusters.length} clusters</strong><small>{globalSeoExpansionPlan.useCaseClusters.slice(0, 4).join(", ")}</small></div>
          <div><span>Quality guard</span><strong>No thin pages</strong><small>No fake local proof or unsupported local claims.</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">17 · Hreflang / canonical / schema</span>
        <h2>Technical SEO integrity guard</h2>
        <p style={{ color: "var(--muted)" }}>{technicalSeoIntegrityPlan.rule}</p>
        <div className="admin-info-grid">
          {technicalSeoIntegrityPlan.checks.map((item) => <div key={item}><span>SEO check</span><strong>{item}</strong><small>{technicalSeoIntegrityPlan.status}</small></div>)}
        </div>
        <ul>{seoLaunchKit.technicalSeoIntegrity.checks.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">18 · Programmatic SEO quality guard</span>
        <h2>Templates can expand only when thin-content checks pass</h2>
        <p style={{ color: "var(--muted)" }}>{seoLaunchKit.programmaticSeoQualityGuard.thinContentRule}</p>
        <div className="admin-info-grid">
          {programmaticSeoQualityGuardPlan.templates.map((item) => <div key={item}><span>Template</span><strong>{item}</strong><small>{programmaticSeoQualityGuardPlan.status}</small></div>)}
        </div>
        <ul>{programmaticSeoQualityGuardPlan.qualityChecks.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">23 · SEO/social data optimization</span>
        <h2>Optimize only after real growth signals arrive</h2>
        <p style={{ color: "var(--muted)" }}>{growthDataOptimizationPlan.nextAction}</p>
        <div className="admin-info-grid">
          {growthDataOptimizationPlan.requiredInputs.map((item) => <div key={item}><span>Required input</span><strong>{item}</strong><small>{growthDataOptimizationPlan.status}</small></div>)}
        </div>
        <ul>{growthDataOptimizationPlan.optimizationLoops.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <AdminSeoCompetitorAgent />

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Google indexing continuation</span>
        <h2>Search Console continuation starts at URL 12</h2>
        <p style={{ color: "var(--muted)" }}>URLs 1-11 were submitted by the user through Search Console. After the quota/wait period, continue manual URL inspection with the 12-20 list below.</p>
        <div className="admin-info-grid">
          <div><span>Already submitted</span><strong>{googleIndexingSubmittedUrls.length} URLs</strong><small>1-11 marked complete.</small></div>
          <div><span>Ready next</span><strong>{googleIndexingContinuationUrls.length} URLs</strong><small>Priority manual submission list for 12-20.</small></div>
          <div><span>Full sitemap master</span><strong>{googleIndexingAllSitemapUrls.length} URLs</strong><small>All public sitemap pages; the master list for checking missing pages.</small></div>
          <div><span>Start from</span><strong>URL 12</strong><small>{googleIndexingContinuationUrls[0]?.url}</small></div>
        </div>
        <div className="provider-job-list" style={{ marginTop: 12 }}>
          {googleIndexingContinuationUrls.map((item) => (
            <div className="provider-job-chip active" key={item.url}>
              <strong>{item.order}. {item.path}</strong>
              <span>{item.url}</span>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Full sitemap master list</span>
        <h2>All submittable public sitemap URLs</h2>
        <p style={{ color: "var(--muted)" }}>This master list follows the same public scope as the sitemap. Check ready URLs here after the priority 12-20 list so none are missed in Search Console.</p>
        <div className="provider-job-list" style={{ marginTop: 12 }}>
          {googleIndexingAllSitemapUrls.map((item) => (
            <div className={item.status === "already_submitted" ? "provider-job-chip" : "provider-job-chip active"} key={item.url}>
              <strong>{item.order}. {item.path}</strong>
              <span>{item.url}</span>
              <small>{item.status === "already_submitted" ? "Already submitted" : "Ready if not indexed"}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Search engine submit plan</span>
        <h2>Google’dan sonra Bing ve Yandex</h2>
        <div className="admin-info-grid">
          {searchEngineSubmitTargets.map((target) => (
            <div key={target.engine}>
              <span>{target.status}</span>
              <strong>{target.engine}</strong>
              <small>{target.action}</small>
            </div>
          ))}
        </div>
        <h3>Indexing checklist</h3>
        <ul>{indexingChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="admin-category-grid" style={{ marginTop: 20 }}>
        {seoModules.map((module) => (
          <div className="card admin-category-card" key={module.title}>
            <span className="badge">{module.file}</span>
            <h2>{module.title}</h2>
            <div className="admin-production-editor">
              {module.fields.map((field) => (
                <div className="field" key={field}>
                  <label>{field}</label>
                  <input placeholder={`Enter ${field}`} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button">Apply settings</button>
              <button className="btn secondary" type="button">View file</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card admin-wide-card">
        <h2>SEO sistem notu</h2>
        <p style={{ color: "var(--muted)" }}>Sitemap and robots are live. Search Console URL submission is manual; this panel keeps the remaining URL order and guardrails visible.</p>
        <ul>{googleIndexingGuardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </AdminShell>
  );
}
