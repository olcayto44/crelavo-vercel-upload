import { AdminShell } from "@/components/AdminShell";

const designModules = [
  { title: "Site genel renk şablonu", fields: ["Primary color", "Accent color", "Background", "Gradient style"] },
  { title: "Header menü düzeni", fields: ["Logo text", "Menu links", "CTA button", "Announcement bar"] },
  { title: "Sidebar düzeni", fields: ["Sidebar width", "Group style", "Icon mode", "Collapsed mode"] },
  { title: "Dashboard kart tasarımı", fields: ["Card radius", "Card shadow", "Card border", "Card density"] },
  { title: "Landing page hero şablonu", fields: ["Hero title", "Hero subtitle", "Hero CTA", "Hero visual mode"] },
  { title: "Buton stilleri", fields: ["Primary button", "Secondary button", "Hover effect", "Disabled style"] },
  { title: "Reklam alanı görünürlüğü", fields: ["Splash enabled", "Sidebar ad", "Header ad", "Content ad"] },
  { title: "Yeni modül ekleme alanı", fields: ["Module name", "Module route", "Menu group", "Visibility"] }
];

export default function AdminAppearancePage() {
  return (
    <AdminShell title="Site tasarım ayarları" description="Site şablonu, kart görünümü, header/sidebar, reklam alanı ve yeni modül tasarım ayarlarını yönet.">
      <section className="admin-category-grid">
        {designModules.map((module) => (
          <div className="card admin-category-card" key={module.title}>
            <span className="badge">Tasarım modülü</span>
            <h2>{module.title}</h2>
            <div className="admin-production-editor">
              {module.fields.map((field) => (
                <div className="field" key={field}>
                  <label>{field}</label>
                  <input placeholder={`${field} ayarı`} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button">Uygula</button>
              <button className="btn secondary" type="button">Önizle</button>
            </div>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
