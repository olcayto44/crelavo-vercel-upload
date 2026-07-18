import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { securityAbuseFraudControls } from "@/lib/launch-final-controls";

function statusClass(status: string) {
  if (status === "active" || status === "policy_ready") return "ready";
  if (status === "manual_review") return "active";
  return "failed";
}

export default function AdminSecurityFraudPage() {
  return (
    <AdminShell title="Security / Abuse / Fraud Guard" description="Final launch guardrail review for authentication, payment-first production, rewards, partner commissions and sensitive AI use cases.">
      <section className="card admin-wide-card">
        <span className="badge">Launch safety</span>
        <h2>Security, abuse and fraud controls are active or manual-review gated</h2>
        <p style={{ color: "var(--muted)" }}>This page keeps the launch safety checklist visible before more traffic, provider spend or automated rewards are enabled.</p>
        <div className="provider-job-list">
          {securityAbuseFraudControls.map((item) => (
            <div className={`provider-job-chip ${statusClass(item.status)}`} key={item.area}>
              <strong>{item.area}</strong>
              <span>{item.status.replaceAll("_", " ")}</span>
              <small>{item.check}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Fast links</span>
        <div className="url-action-center">
          <Link className="btn" href="/admin/api-guard">API Guard</Link>
          <Link className="btn secondary" href="/admin/credits">Credit Operations</Link>
          <Link className="btn secondary" href="/admin/partners">Partner Program</Link>
          <Link className="btn secondary" href="/terms">Terms</Link>
        </div>
      </section>
    </AdminShell>
  );
}
