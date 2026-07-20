import { AdminShell } from "@/components/AdminShell";
import { AdminSiteContentManager } from "@/components/AdminSiteContentManager";
import { defaultSiteContentConfig } from "@/lib/site-content-config";

export default function AdminSiteContentPage() {
  return (
    <AdminShell title="Site Content" description="Manage public navigation, homepage moving sliders, Blog / Content articles, video slots and footer help content from one admin-ready config.">
      <section className="card admin-wide-card">
        <span className="badge">Content Management</span>
        <h3>Public site content</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>This panel manages top navigation, homepage moving showcase slides, blog topics, media slots and footer help content through the platform_configs table. Blog topics can be added, removed and re-ordered from here; the public Blog / Content page now also carries Academy and programmatic SEO engine sections.</p>
        <AdminSiteContentManager initialContent={defaultSiteContentConfig} />
      </section>
    </AdminShell>
  );
}
