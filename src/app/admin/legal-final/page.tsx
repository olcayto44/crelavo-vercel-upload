import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { legalSupportCancellationControls } from "@/lib/launch-final-controls";

export default function AdminLegalFinalPage() {
  return (
    <AdminShell title="Legal / Support / Refund / Cancellation" description="Final legal and support checklist for public pages, refund policy, cancellation flow and Whop billing support.">
      <section className="card admin-wide-card">
        <span className="badge">Legal final control</span>
        <h2>Public legal, support and cancellation paths</h2>
        <div className="admin-category-grid">
          {legalSupportCancellationControls.map((item) => (
            <Link className="card admin-category-card" href={item.href} key={item.area}>
              <span className="badge">{item.status}</span>
              <h3>{item.area}</h3>
              <p>{item.check}</p>
              <span className="btn secondary">Open</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Final note</span>
        <p style={{ color: "var(--muted)" }}>Whop is the active billing source. Lemon wording must stay postponed until the final integration decision.</p>
      </section>
    </AdminShell>
  );
}
