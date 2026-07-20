import { AdminShell } from "@/components/AdminShell";
import { googleIndexingAllSitemapUrls, googleIndexingContinuationUrls, googleIndexingGuardrails, googleIndexingSubmittedUrls, indexingChecklist, searchEngineSubmitTargets } from "@/lib/google-indexing";

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
    <AdminShell title="SEO / Sitemap / Google" description="SEO dosyaları, Google ayarları, sitemap, robots, meta ve sosyal paylaşım önizlemelerini yönet.">
      <section className="card admin-wide-card">
        <span className="badge">Google indexing continuation</span>
        <h2>Search Console devam listesi 12. URL’den başlıyor</h2>
        <p style={{ color: "var(--muted)" }}>1-11 URL kullanıcı tarafından Search Console üzerinden gönderildi. Kota/bekleme sonrası manuel URL inspection devamı aşağıdaki 12-20 listesiyle yapılmalı.</p>
        <div className="admin-info-grid">
          <div><span>Already submitted</span><strong>{googleIndexingSubmittedUrls.length} URLs</strong><small>1-11 tamamlandı olarak notlandı.</small></div>
          <div><span>Ready next</span><strong>{googleIndexingContinuationUrls.length} URLs</strong><small>12-20 öncelikli manuel submit listesi.</small></div>
          <div><span>Full sitemap master</span><strong>{googleIndexingAllSitemapUrls.length} URLs</strong><small>Tüm public sitemap sayfaları; eksik sayfa kontrolü için ana liste.</small></div>
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
        <h2>Tüm gönderilebilir public sitemap URL’leri</h2>
        <p style={{ color: "var(--muted)" }}>Bu ana liste sitemap ile aynı public kapsamı takip eder. Search Console’da eksik kalmasın diye 12-20 öncelikli listeden sonra bu listedeki ready olan URL’ler kontrol edilebilir.</p>
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
                  <input placeholder={`${field} değerini gir`} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button">Ayarları uygula</button>
              <button className="btn secondary" type="button">Dosyayı görüntüle</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card admin-wide-card">
        <h2>SEO sistem notu</h2>
        <p style={{ color: "var(--muted)" }}>Sitemap ve robots canlıdır. Search Console URL submission manuel yapılır; bu panel kalan URL sırasını ve guardrail’leri görünür tutar.</p>
        <ul>{googleIndexingGuardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </AdminShell>
  );
}
