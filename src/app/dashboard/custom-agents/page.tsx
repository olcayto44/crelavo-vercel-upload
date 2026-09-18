import Link from "next/link";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";
import { customAgentSystem, launchBlockedNotes } from "@/lib/growth-launch-systems";

export default function DashboardCustomAgentsPage() {
  return (
    <DashboardToolLayout id="custom-agents">
      <span className="badge">Custom agents</span>
      <h1>Reusable agent plans without unsafe autonomous actions</h1>
      <p className="lead">Prepare reusable brief, approval and workflow plans for brand, ecommerce, live sales and growth requests.</p>
      <div className="btns">
        <Link className="btn" href="/dashboard/ai-agents">Create social content package</Link>
        <Link className="btn btn-out" href="/admin/agents">Open admin agents</Link>
        <Link className="btn btn-out" href="/dashboard/create?type=AI%20Video&category=ai_agent">Plan custom agent</Link>
      </div>
      <section className="grid" style={{ marginTop: 20 }}>
        {customAgentSystem.map((item) => (
          <article className="card" key={item.agent}>
            <span className="badge">{item.status}</span>
            <h3>{item.agent}</h3>
            <p><strong>Purpose:</strong> {item.purpose}</p>
            <p><strong>Inputs:</strong> {item.inputs}</p>
            <p className="note">Every agent keeps human review, approval steps and clear delivery boundaries before execution.</p>
          </article>
        ))}
        <article className="card wide">
          <span className="badge">Blocked until ready</span>
          <ul className="list">{launchBlockedNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </article>
      </section>
    </DashboardToolLayout>
  );
}
