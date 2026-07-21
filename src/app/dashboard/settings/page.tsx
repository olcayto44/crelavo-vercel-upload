import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";

const settingsSections = [
  {
    title: "Brand defaults",
    description: "Keep logo, colors and font notes ready for future videos, websites, ads and social export packs.",
    href: "/dashboard/brand-kit",
    action: "Open brand kit"
  },
  {
    title: "Production defaults",
    description: "Start a new production with quality, format, credits and provider readiness visible before confirmation.",
    href: "/dashboard/create",
    action: "Open production studio"
  },
  {
    title: "Credits and billing",
    description: "Review credit balance, subscriptions, top-ups and payment confirmation paths from one place.",
    href: "/dashboard/credits",
    action: "Open credits"
  },
  {
    title: "Support and account help",
    description: "Use the contact path when account, billing, production or delivery context should stay connected.",
    href: "/dashboard/contact",
    action: "Contact support"
  }
];

export default function SettingsPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Settings</span>
        <h2>Account and production settings</h2>
        <p>Use this page as the control point for brand defaults, production setup, credits and support routing. Deeper automation settings will appear only after provider/API readiness is complete.</p>
      </section>

      <section className="admin-category-grid share-earn-grid" style={{ marginTop: 20 }}>
        {settingsSections.map((section) => (
          <Link className="card admin-category-card share-earn-card" href={section.href} key={section.title}>
            <h3>{section.title}</h3>
            <div className="social-export-detail-list">
              <span><small>Purpose</small><strong>{section.description}</strong></span>
              <span><small>Action</small><strong>{section.action}</strong></span>
            </div>
            <span className="btn secondary">{section.action}</span>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}
