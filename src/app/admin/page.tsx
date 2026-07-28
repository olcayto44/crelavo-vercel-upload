import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminStatsCards } from "@/components/AdminStatsCards";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";
import { AdminLiveVisitorsCard } from "@/components/AdminLiveVisitorsCard";
import { adminDailyFocus, adminOwnerRoutine } from "@/lib/admin";
import { buildFinalApiChecklist } from "@/lib/final-api-checklist";
import { buildLaunchReadiness } from "@/lib/launch-readiness";
import { buildManualE2EChecklist } from "@/lib/manual-e2e-checklist";

function commandStatusClass(status: string) {
  if (["ready", "go", "ready_for_live_e2e"].includes(status.toLowerCase())) return "ready";
  if (["blocked", "missing", "no_go"].includes(status.toLowerCase())) return "failed";
  return "active";
}

function commandStatusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

export default function AdminPage() {
  const launchReadiness = buildLaunchReadiness();
  const finalApiChecklist = buildFinalApiChecklist();
  const manualE2E = buildManualE2EChecklist();
  const whopReady = hasEnv("WHOP_API_KEY") && hasEnv("WHOP_WEBHOOK_SECRET") && process.env.PAYMENT_PROVIDER === "whop";
  const commandCards = [
    {
      title: "Launch Readiness",
      href: "/admin/launch-readiness",
      status: launchReadiness.summary.goNoGo,
      metric: `${launchReadiness.summary.readyCount}/${launchReadiness.summary.totalCount}`,
      note: `${launchReadiness.summary.hardBlockerCount} hard blockers · ${launchReadiness.summary.softBlockerCount} soft blockers`
    },
    {
      title: "Final API Checklist",
      href: "/admin/final-api-checklist",
      status: finalApiChecklist.summary.status,
      metric: `${finalApiChecklist.summary.readyCount}/${finalApiChecklist.summary.totalCount}`,
      note: `${finalApiChecklist.summary.missingCount} missing final env/API checks`
    },
    {
      title: "Manual E2E Checklist",
      href: "/admin/manual-e2e-checklist",
      status: manualE2E.summary.blocked ? "pending" : "ready",
      metric: `${manualE2E.preApiItems} pre-API`,
      note: `${manualE2E.finalApiItems} final API checks remain separated`
    },
    {
      title: "Whop Payment Launch",
      href: "/admin/payments",
      status: whopReady ? "ready" : "pending",
      metric: whopReady ? "Whop active" : "Check Whop env",
      note: whopReady
        ? "PAYMENT_PROVIDER=whop and Whop env keys are present; live payment test is the next gated step."
        : "Confirm PAYMENT_PROVIDER=whop plus WHOP_API_KEY and WHOP_WEBHOOK_SECRET before live payments."
    },
    {
      title: "Service Pages",
      href: "/admin/service-pages",
      status: "pending",
      metric: "Publish controls",
      note: "Draft/noindex/sitemap/FAQ/internal link controls are ready for admin review."
    }
  ];

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
            <Link className="card admin-category-card" href={item.href} key={item.href}>
              <span className="badge">{item.priority}</span>
              <h2>{item.label}</h2>
              <p>{item.note}</p>
              <span className="btn">Aç</span>
            </Link>
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

      <section className="card admin-user-info-card" style={{ marginTop: 20 }}>
        <span className="badge">Control center</span>
        <h2>Quick access for site management</h2>
        <p style={{ color: "var(--muted)" }}>
          This main panel is only a summary screen. Each management area opens as a separate page from the left menu and contains its own settings.
        </p>
        <div className="admin-info-grid">
          <div><span>Member management</span><strong>Search + credit operations</strong><small>On the Members page</small></div>
          <div><span>Content management</span><strong>Categories + packages</strong><small>Cards are editable</small></div>
          <div><span>Site settings</span><strong>SEO + appearance + ads</strong><small>WordPress-like structure</small></div>
          <div><span>Security</span><strong>Code backup</strong><small>Ready area for restore</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch Command Center</span>
        <h2>Pre-launch control summary</h2>
        <p style={{ color: "var(--muted)" }}>
          Use this overview to move between launch readiness, final API setup, manual E2E, Payment Link activation and SEO/service-page publishing without opening every page first.
        </p>
        <div className="admin-info-grid launch-readiness-summary" style={{ marginTop: 14 }}>
          <div><span>Go / no-go</span><strong>{commandStatusLabel(launchReadiness.summary.goNoGo)}</strong><small>{launchReadiness.summary.status}</small></div>
          <div><span>Ready checks</span><strong>{launchReadiness.summary.readyCount}/{launchReadiness.summary.totalCount}</strong><small>Launch readiness items</small></div>
          <div><span>Final env missing</span><strong>{finalApiChecklist.summary.missingCount}</strong><small>Keys and live provider checks</small></div>
          <div><span>Payment mode</span><strong>{whopReady ? "Whop active" : "Whop check needed"}</strong><small>{whopReady ? "Webhook + admin fallback" : "Confirm env before live test"}</small></div>
        </div>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {commandCards.map((card) => (
            <Link className="card admin-category-card" href={card.href} key={card.href}>
              <span className={`provider-job-chip ${commandStatusClass(card.status)}`}>{commandStatusLabel(card.status)}</span>
              <h2>{card.title}</h2>
              <strong>{card.metric}</strong>
              <p>{card.note}</p>
              <span className="btn">Open</span>
            </Link>
          ))}
        </div>
        <div className="workspace-action-note warning" style={{ marginTop: 14 }}>
          Current payment mode: Whop checkout is active. After verifying a Whop payment or membership, use /admin/credits as the safe fallback for manual credit activation and store the payment reference in the credit event note.
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
