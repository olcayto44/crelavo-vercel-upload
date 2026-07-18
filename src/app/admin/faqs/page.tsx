import { AdminFaqManager } from "@/components/AdminFaqManager";
import { AdminShell } from "@/components/AdminShell";
import { defaultFaqItems } from "@/lib/site-content";

export default function AdminFaqsPage() {
  return (
    <AdminShell title="FAQ Management" description="Add, edit, pause or remove homepage Frequently Asked Questions in a question-answer format.">
      <section className="card admin-wide-card">
        <span className="badge">Content Management</span>
        <h3>Public FAQ content</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>This area keeps common customer questions visible on the homepage in an SEO-friendly and manageable format.</p>
        <AdminFaqManager initialFaqs={defaultFaqItems} />
      </section>
    </AdminShell>
  );
}
