import { AdminShell } from "@/components/AdminShell";

const brandAssetFields = [
  { label: "Logo URL", placeholder: "https://.../logo.svg" },
  { label: "Font URL", placeholder: "https://.../font.woff2" },
  { label: "Primary HEX", placeholder: "#7c5cff" },
  { label: "Accent HEX", placeholder: "#22d3ee" },
  { label: "Brand guide URL", placeholder: "https://.../brand-guide.pdf" },
  { label: "Render template ID", placeholder: "shotstack-template-id" }
];

export default function AdminBrandKitStoragePage() {
  return (
    <AdminShell title="Brand Kit Storage Operations" description="Store logo, font, color, brand guide and render template links in a structured way for production use.">
      <section className="production-hero-card admin-overview-hero">
        <span className="badge">Brand asset vault</span>
        <h2>Brand files stay ready for the production engine</h2>
        <p>This page is not a code view; it makes brand assets such as logos, fonts, HEX colors and render templates editable from the admin panel.</p>
      </section>

      <section className="admin-category-grid">
        <div className="card admin-category-card">
          <span className="badge">Assets</span>
          <h2>Logos, fonts and colors</h2>
          <p>The brand kit keeps the same identity across production outputs, video overlays, subtitles, social media images and PDF exports.</p>
          <div className="admin-production-editor">
            {brandAssetFields.map((field) => <div className="field" key={field.label}><label>{field.label}</label><input placeholder={field.placeholder} /></div>)}
          </div>
          <button className="btn" type="button">Prepare brand kit draft</button>
        </div>

        <div className="card admin-category-card">
          <span className="badge">Preview</span>
          <h2>Brand preview card</h2>
          <div className="brand-kit-preview-card">
            <div className="logo-mark">▶</div>
            <strong>Crelavo Brand Preview</strong>
            <span>Primary #7c5cff · Accent #22d3ee</span>
            <p>The logo renders in the top-right corner, subtitles use the brand font and CTAs use the brand accent color.</p>
          </div>
          <div className="admin-faq-actions">
            <button className="btn secondary" type="button">Refresh preview</button>
            <button className="btn" type="button">Apply to render template</button>
          </div>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Operations note</span>
        <h3>Storage model</h3>
        <p style={{ color: "var(--muted)" }}>For live persistence, this form can be connected to the <code>brand_kits</code> table or the <code>platform_configs</code> table in a later step. Right now it opens as a clean admin interface and clearly shows which fields will be stored.</p>
      </section>
    </AdminShell>
  );
}
