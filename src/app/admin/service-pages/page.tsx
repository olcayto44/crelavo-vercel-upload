import { AdminShell } from "@/components/AdminShell";
import { AdminServicePagesManager } from "@/components/AdminServicePagesManager";
import { servicePages } from "@/lib/service-pages";

export default function AdminServicePagesPage() {
  return (
    <AdminShell title="SEO Service Pages" description="Manage public AI Website Builder, AI App Builder, AI Ecommerce Builder and other service pages, including copy, SEO fields and redirect links.">
      <section className="card admin-wide-card">
        <span className="badge">Admin-managed SEO</span>
        <h3>Public service pages</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Edit headings, descriptions, article sections, delivery lists, examples and CTA redirect links. Saved content is stored in platform_configs.service_pages.</p>
        <AdminServicePagesManager initialPages={servicePages} />
      </section>
    </AdminShell>
  );
}
