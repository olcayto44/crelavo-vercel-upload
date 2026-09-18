import { DashboardAccountStyles } from "@/components/DashboardAccountStyles";
import { SettingsAccountPanel } from "@/components/SettingsAccountPanel";

export default function SettingsPage() {
  return (
    <main className="container section dashboard-postlaunch-shell">
      <DashboardAccountStyles />
      <div className="cdx">
        <div className="cdx-shell w-full" style={{ background: "transparent" }}>
          <div className="cdx-shell-inner mx-auto w-full max-w-6xl px-4 sm:px-6">
        <nav className="cdx-pills" aria-label="Dashboard">
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/credits">Credits</a>
          <a href="/dashboard/billing">Billing</a>
          <a href="/dashboard/productions">Productions</a>
          <a href="/dashboard/create?type=AI%20Video&category=video">Assistant</a>
          <a href="/dashboard/growth-intelligence">Growth Intelligence</a>
          <a href="/dashboard/partners">Partners</a>
          <a href="/pricing">Pricing</a>
        </nav>

        <nav className="cdx-account" aria-label="Account">
          <a className="is-active" href="/dashboard/settings">Settings</a>
          <a href="/dashboard/contact">Contact</a>
        </nav>

        <div className="cdx-chip">Settings</div>
        <h1>Account and production settings</h1>
        <p className="cdx-lead">Brand, production, credits and support from one place. Email, password, 2FA, language, notifications and team stay on this page.</p>

        <div className="cdx-grid">
          <article className="cdx-card">
            <h2>Brand defaults</h2>
            <p>Keep logo, colors and font notes ready for videos, sites, ads and social export.</p>
            <a className="cdx-btn" href="/dashboard/brand-kit">Open brand kit</a>
          </article>
          <article className="cdx-card">
            <h2>Production defaults</h2>
            <p>Start a new production with quality, format and credits visible before you confirm.</p>
            <a className="cdx-btn" href="/dashboard/create?type=AI%20Video&category=video">Open production studio</a>
          </article>
          <article className="cdx-card">
            <h2>Credits and billing</h2>
            <p>Review credit balance, subscriptions and top-ups.</p>
            <a className="cdx-btn" href="/dashboard/credits">Open credits</a>
          </article>
          <article className="cdx-card">
            <h2>Support</h2>
            <p>Use contact when account, billing or delivery should stay connected.</p>
            <a className="cdx-btn" href="/dashboard/contact">Contact support</a>
          </article>
        </div>

        <SettingsAccountPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
