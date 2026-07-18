import { AdminShell } from "@/components/AdminShell";
import { AdminCategoryPagesManager } from "@/components/AdminCategoryPagesManager";

export default function AdminCategoriesPage() {
  return (
    <AdminShell title="Category SEO Pages" description="Manage programmatic category SEO pages, redirects and publish status from admin.">
      <section className="card admin-wide-card">
        <span className="badge">Programmatic SEO</span>
        <h3>Public category pages</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Edit category slugs, summaries, sections, internal links and redirect targets. Default pages can be hidden; custom pages can be added and removed.</p>
        <AdminCategoryPagesManager />
      </section>
    </AdminShell>
  );
}
