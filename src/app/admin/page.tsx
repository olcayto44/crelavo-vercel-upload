import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminStatsCards } from "@/components/AdminStatsCards";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";
import { AdminLiveVisitorsCard } from "@/components/AdminLiveVisitorsCard";
import { adminDailyFocus, adminOwnerRoutine } from "@/lib/admin";

export default function AdminPage() {
  return (
    <AdminShell
      title="Crelavo Admin Panel"
      description="A detailed control center similar to WordPress: members, requests, packages, categories, SEO, ads, appearance, payments and backups are managed from one panel."
    >
      <section className="card admin-user-info-card">
        <span className="badge">Daily control center</span>
        <h2>Most important areas</h2>
        <p style={{ color: "var(--muted)" }}>
          The admin panel is extensive, so start here for daily work: productions, credits, finance, QA, providers, and monitoring. Other modules are available below.
        </p>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {adminDailyFocus.map((item) => (
            <article className="card admin-category-card" key={item.href}>
              <span className="badge">{item.priority}</span>
              <h2>{item.label}</h2>
              <p>{item.note}</p>
              <Link className="btn" href={item.href}>Open</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Review routine</span>
        <h2>Daily / recurring review order</h2>
        <div className="admin-grid three-col" style={{ marginTop: 14 }}>
          {adminOwnerRoutine.map((routine) => (
            <div className="mini-card" key={routine.cadence}>
              <h3>{routine.cadence}</h3>
              <ul>{routine.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel-section"><AdminLiveVisitorsCard /></section>
      <section className="admin-panel-section"><AdminStatsCards /></section>
      <section className="admin-panel-section"><AdminFinanceCards /></section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Separate page system</span>
        <h2>Modules now open on their own screens instead of extending the home page</h2>
        <p style={{ color: "var(--muted)" }}>
          The main panel remains a daily summary and critical control center. Members, productions, credits, finance, SEO, growth, providers, appearance, and other modules open on their own admin pages from the left menu.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/admin/productions">Productions</Link>
          <Link className="btn secondary" href="/admin/users">Members</Link>
          <Link className="btn secondary" href="/admin/credits">Credits</Link>
          <Link className="btn secondary" href="/admin/seo">SEO</Link>
        </div>
      </section>
    </AdminShell>
  );
}
