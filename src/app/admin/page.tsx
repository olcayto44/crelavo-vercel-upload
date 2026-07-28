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
        <span className="badge">Günlük kontrol merkezi</span>
        <h2>En sık takip edeceğin bölümler</h2>
        <p style={{ color: "var(--muted)" }}>
          Admin paneli kalabalık olduğu için günlük işlerde önce buraya bak: üretimler, krediler, finans, QA, provider ve monitoring. Diğer modüller aşağıda kalır.
        </p>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {adminDailyFocus.map((item) => (
            <article className="card admin-category-card" key={item.href}>
              <span className="badge">{item.priority}</span>
              <h2>{item.label}</h2>
              <p>{item.note}</p>
              <Link className="btn" href={item.href}>Aç</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Bakma rutini</span>
        <h2>Günlük / düzenli kontrol sırası</h2>
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
        <span className="badge">Ayrı sayfa sistemi</span>
        <h2>Modüller artık ana sayfayı uzatmadan kendi ekranında açılır</h2>
        <p style={{ color: "var(--muted)" }}>
          Ana panel sadece günlük özet ve kritik kontrol merkezi olarak kalır. Üye, üretim, kredi, finans, SEO, growth, provider, appearance ve diğer modüller sol menüden kendi ayrı admin sayfasında açılır.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/admin/productions">Üretimler</Link>
          <Link className="btn secondary" href="/admin/users">Members</Link>
          <Link className="btn secondary" href="/admin/credits">Krediler</Link>
          <Link className="btn secondary" href="/admin/seo">SEO</Link>
        </div>
      </section>
    </AdminShell>
  );
}
