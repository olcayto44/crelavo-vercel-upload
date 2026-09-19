import { DashboardAccountStyles } from "@/components/DashboardAccountStyles";
import { DashboardFooter } from "@/components/DashboardFooter";

const PRODUCTIONS_CSS = `
.cdx-nav a {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #d7e3f5;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}
.cdx-nav a:hover { background: rgba(255, 255, 255, 0.08); }
.cdx-nav a.is-active {
  background: var(--cdx-cyan);
  border-color: var(--cdx-cyan);
  color: var(--cdx-ink);
}
.cdx > p {
  max-width: 640px;
  margin: 0;
  color: var(--cdx-muted);
  font-size: 15px;
  line-height: 1.5;
}
.cdx-btn-ghost {
  height: 44px;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e2e8f0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 650;
}

/* Kit 5 — /dashboard/productions only */
.cdx {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  float: none !important;
  grid-column: 1 / -1 !important;
  flex: 1 1 auto !important;
}

.cdx-nav {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100% !important;
}

.cdx-chip {
  display: inline-flex;
  margin: 18px 0 10px;
}

.cdx-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 16px !important;
  width: 100% !important;
  margin-top: 28px;
}

.cdx-card {
  min-width: 0 !important;
  max-width: none !important;
  width: auto !important;
  word-break: normal !important;
  overflow-wrap: break-word;
  hyphens: none;
}

.cdx-card h2,
.cdx-card p,
.cdx-btn,
.cdx-btn-ghost {
  overflow-wrap: break-word;
  word-break: normal !important;
  hyphens: none;
}

.cdx-btn,
.cdx-btn-ghost {
  display: block;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  box-sizing: border-box;
}

@media (max-width: 720px) {
  .cdx-grid {
    grid-template-columns: 1fr !important;
  }
  .cdx-btn,
  .cdx-btn-ghost {
    white-space: normal;
  }
}
`;

export default function MyProductionsPage() {
  return (
    <main className="cdx-full-page">
      <style id="kit-5-productions-css">{PRODUCTIONS_CSS}</style>
      <DashboardAccountStyles footer={<DashboardFooter />}>
        <nav className="cdx-nav" aria-label="Dashboard">
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/credits">Credits</a>
          <a href="/dashboard/billing">Billing</a>
          <a href="/dashboard/productions" className="is-active" aria-current="page">Productions</a>
          <a href="/dashboard/create?type=AI%20Video&category=video">Assistant</a>
          <a href="/dashboard/growth-intelligence">Growth Intelligence</a>
          <a href="/dashboard/partners">Partners</a>
          <a href="/pricing">Pricing</a>
        </nav>

        <div className="cdx-chip">My Productions</div>

        <h1>Production command center</h1>
        <p>
          Track active jobs, waiting decisions, preview-ready outputs
          and final deliveries from one clean production hub.
        </p>

        <div className="cdx-grid">
          <article className="cdx-card">
            <h2>Start production</h2>
            <p>Open the filled AI Video assistant. Type and category stay selected.</p>
            <a className="cdx-btn" href="/dashboard/create?type=AI%20Video&category=video">Start production</a>
          </article>

          <article className="cdx-card">
            <h2>Your jobs</h2>
            <p>Sign in to view your productions.</p>
            <a className="cdx-btn-ghost" href="/?auth=login">Sign in</a>
          </article>

          <article className="cdx-card">
            <h2>Studio</h2>
            <p>Credits, billing and partners stay on the main dashboard.</p>
            <a className="cdx-btn-ghost" href="/dashboard">Open dashboard</a>
          </article>

          <article className="cdx-card">
            <h2>Credits</h2>
            <p>Plans and one-time packs.</p>
            <a className="cdx-btn-ghost" href="/dashboard/credits">View credits</a>
          </article>
        </div>
      </DashboardAccountStyles>
    </main>
  );
}
