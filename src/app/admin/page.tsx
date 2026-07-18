import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminStatsCards } from "@/components/AdminStatsCards";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";
import { AdminLiveVisitorsCard } from "@/components/AdminLiveVisitorsCard";
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

const quickModules = [
  { title: "Members", href: "/admin/users", note: "Search users, view full user ID, registration date, last sign-in, IP/country/city/credit data, and add or remove credits." },
  { title: "All Requests", href: "/admin/productions", note: "Manage user production requests, delivery links and status updates." },
  { title: "Finance Dashboard", href: "/admin/finance", note: "Review revenue, provider spend estimates, reserved credit exposure, production margin and manual payment activations." },
  { title: "Ad Slots", href: "/admin/ads", note: "Manage splash, right/left, sidebar, header and in-content ad slots from the top priority area." },
  { title: "Site Content", href: "/admin/site-content", note: "Edit homepage, landing copy and important public content blocks." },
  { title: "Packages", href: "/admin/packages", note: "Management area for credit packages and production packages." },
  { title: "Category Cards", href: "/admin/categories", note: "Edit site category cards and add new cards." },
  { title: "Sample Output Videos", href: "/admin/sample-videos", note: "Manage public sample/demo videos shown before stronger API/provider demos are ready." },
  { title: "FAQ Management", href: "/admin/faqs", note: "Update public questions, answers and support guidance." },
  { title: "Free Tools Funnel", href: "/admin/free-tools", note: "Review public free tools, ecommerce script funnels, ad scoring tools, CTA paths and premium feature roadmap." },
  { title: "SEO Service Pages", href: "/admin/service-pages", note: "Control service-page publish status, noindex state, sitemap visibility and FAQ/internal-link blocks." },
  { title: "SEO / Google", href: "/admin/seo", note: "Sitemap, robots, meta, Google and social sharing settings." },
  { title: "Launch Readiness", href: "/admin/launch-readiness", note: "Check env keys, domain, Whop, email, providers, safe capacity policy and manual launch blockers." },
  { title: "Final API Checklist", href: "/admin/final-api-checklist", note: "Use on final setup day to connect Whop, Supabase, Resend and provider keys, then run live E2E in order." },
  { title: "Manual E2E Checklist", href: "/admin/manual-e2e-checklist", note: "Track pre-API and final API browser checks with PASS, FAIL and BLOCKED launch validation states." },
  { title: "Provider Readiness", href: "/admin/providers", note: "Review Claude/OpenAI, image, video, voice, render, email and payment provider routing before final API setup." },
  { title: "Security / Fraud Guard", href: "/admin/security-fraud", note: "Review abuse, payment-first production, rewards, partner commission and sensitive AI usage guardrails." },
  { title: "Monitoring / Error Logging", href: "/admin/monitoring", note: "Review health checks, provider readiness, API guard, backup plan, analytics and external logging blockers." },
  { title: "Legal / Support Final", href: "/admin/legal-final", note: "Confirm terms, refund policy, privacy, Whop billing/cancel and support paths are public." },
  { title: "Product Hunt / Global Launch", href: "/admin/global-launch", note: "Prepare launch copy, AI directory list and Product Hunt timing while major launch waits for final Whop/provider tests." },
  { title: "Lemon Integration — Last", href: "/admin/lemon-final", note: "Keep Lemon parked until Whop, provider, legal, monitoring and launch checks are stable." },
  { title: "Growth Backlog", href: "/admin/growth", note: "Post-launch growth planning after core launch validation: referral, share loops, analytics and organic launch assets." },
  { title: "Analytics Dashboard", href: "/admin/analytics", note: "Review live visitors, first-touch UTM/ref capture, event taxonomy and paid traffic analytics blockers." },
  { title: "Partner Program", href: "/admin/partners", note: "Prepare affiliate applications, creator assets, commission placeholders and API launch blockers before payout tracking goes live." },
  { title: "E-commerce Product Ad", href: "/admin/ecommerce-product-ad", note: "Monitor product-link campaign planning, provider preflight, delivery package and final dashboard output status." },
  { title: "Connected Accounts & Stores", href: "/admin/connections", note: "Phase-2 backlog for future social/store targets, export planning and API-dependent publishing." },
  { title: "Appearance / Theme", href: "/admin/appearance", note: "Header, sidebar, color, card, landing page and module appearance settings." },
  { title: "Code Backup", href: "/admin/backup", note: "Full code backup, restore and secure archive area for the site." }
];

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

      <section className="admin-category-grid">
        {quickModules.map((item) => (
          <Link className="card admin-category-card" href={item.href} key={item.href}>
            <span className="badge">Admin module</span>
            <h2>{item.title}</h2>
            <p>{item.note}</p>
            <span className="btn">Open module</span>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
