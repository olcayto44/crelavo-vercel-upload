import { DashboardAccountStyles } from "@/components/DashboardAccountStyles";

export default function DashboardContactPage() {
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
          <a href="/dashboard/settings">Settings</a>
          <a className="is-active" href="/dashboard/contact">Contact</a>
        </nav>

        <div className="cdx-chip">Contact</div>
        <h1>Contact Crelavo</h1>
        <p className="cdx-lead">Choose the fastest path for an active production, account help, or a new brief.</p>

        <div className="cdx-grid-3">
          <article className="cdx-card">
            <h2>Production support</h2>
            <p>Active productions, delivery questions, revision status, provider failures, or refund review.</p>
            <a className="cdx-btn" href="/dashboard/productions">Open productions</a>
          </article>
          <article className="cdx-card">
            <h2>Account and credit help</h2>
            <p>Credit balance, package selection, billing, and account checks.</p>
            <a className="cdx-btn" href="/dashboard/credits">Open credits</a>
          </article>
          <article className="cdx-card">
            <h2>New production brief</h2>
            <p>Start a reviewed brief for sites, apps, campaigns, video, voice, or brand kits.</p>
            <a className="cdx-btn" href="/dashboard/create?type=AI%20Video&category=video">Start production</a>
          </article>
        </div>

        <aside className="cdx-note">
          <h2>Direct support details</h2>
          <p>Keep requests in the dashboard so production IDs, credits and delivery context stay together.</p>
          <div className="cdx-split">
            <div>
              <h3>Email</h3>
              <p>support@crelavo.com</p>
            </div>
            <div>
              <h3>Response priority</h3>
              <p>Active production issues, delivery blockers, and account access first.</p>
            </div>
          </div>
        </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
