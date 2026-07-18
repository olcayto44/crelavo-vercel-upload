import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { customAgentSystem, launchBlockedNotes } from "@/lib/growth-launch-systems";

export default function DashboardCustomAgentsPage() {
  return (
    <DashboardShell>
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Custom agents</span>
        <h2>Reusable agent plans without unsafe autonomous actions</h2>
        <p>Custom agents are prepared as brief/planning workflows first. Autonomous publishing, scraping or provider-heavy work stays blocked until API readiness and review rules are active.</p>
        <div className="url-action-center"><Link className="btn" href="/admin/agents">Open admin agents</Link><Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Custom%20AI%20agent">Plan custom agent</Link></div>
      </section>
      <section className="admin-category-grid" style={{ marginTop: 20 }}>
        {customAgentSystem.map((item) => <div className="card admin-category-card" key={item.agent}><span className="badge">{item.status}</span><h3>{item.agent}</h3><p>{item.purpose}</p><p><strong>Inputs:</strong> {item.inputs}</p></div>)}
      </section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Blocked until ready</span><ul>{launchBlockedNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
    </DashboardShell>
  );
}
