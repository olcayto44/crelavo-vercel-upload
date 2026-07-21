import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { customAgentSystem, launchBlockedNotes } from "@/lib/growth-launch-systems";

export default function DashboardCustomAgentsPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Custom agents</span>
        <h2>Reusable agent plans without unsafe autonomous actions</h2>
        <p>Custom agents are prepared as brief/planning workflows first. Autonomous publishing, scraping or provider-heavy work stays blocked until API readiness and review rules are active.</p>
        <div className="url-action-center"><Link className="btn" href="/admin/agents">Open admin agents</Link><Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Custom%20AI%20agent">Plan custom agent</Link></div>
      </section>
      <section className="admin-category-grid custom-agent-grid" style={{ marginTop: 20 }}>
        {customAgentSystem.map((item) => (
          <div className="card admin-category-card custom-agent-card" key={item.agent}>
            <span className="badge">{item.status}</span>
            <h3>{item.agent}</h3>
            <div className="social-export-detail-list">
              <span><small>Purpose</small><strong>{item.purpose}</strong></span>
              <span><small>Inputs</small><strong>{item.inputs}</strong></span>
              <span><small>Status</small><strong>{item.status}</strong></span>
              <span><small>Safety rule</small><strong>Autonomous publishing, scraping and provider-heavy execution stay blocked until API readiness and review rules are active.</strong></span>
            </div>
          </div>
        ))}
      </section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Blocked until ready</span><ul>{launchBlockedNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
    </DashboardShell>
  );
}
