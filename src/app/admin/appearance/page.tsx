import { AdminShell } from "@/components/AdminShell";

const designModules = [
  { title: "Global site color template", fields: ["Primary color", "Accent color", "Background", "Gradient style"] },
  { title: "Header menu layout", fields: ["Logo text", "Menu links", "CTA button", "Announcement bar"] },
  { title: "Sidebar layout", fields: ["Sidebar width", "Group style", "Icon mode", "Collapsed mode"] },
  { title: "Dashboard card design", fields: ["Card radius", "Card shadow", "Card border", "Card density"] },
  { title: "Landing page hero template", fields: ["Hero title", "Hero subtitle", "Hero CTA", "Hero visual mode"] },
  { title: "Button styles", fields: ["Primary button", "Secondary button", "Hover effect", "Disabled style"] },
  { title: "Ad area visibility", fields: ["Splash enabled", "Sidebar ad", "Header ad", "Content ad"] },
  { title: "Add new module", fields: ["Module name", "Module route", "Menu group", "Visibility"] }
];

export default function AdminAppearancePage() {
  return (
    <AdminShell title="Site design settings" description="Manage site templates, card appearance, header/sidebar, ad areas, and new module design settings.">
      <section className="admin-category-grid">
        {designModules.map((module) => (
          <div className="card admin-category-card" key={module.title}>
            <span className="badge">Design module</span>
            <h2>{module.title}</h2>
            <div className="admin-production-editor">
              {module.fields.map((field) => (
                <div className="field" key={field}>
                  <label>{field}</label>
                  <input placeholder={`${field} setting`} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button">Apply</button>
              <button className="btn secondary" type="button">Preview</button>
            </div>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
