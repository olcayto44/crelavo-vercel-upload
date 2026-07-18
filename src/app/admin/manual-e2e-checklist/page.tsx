import { AdminShell } from "@/components/AdminShell";
import { buildManualE2EChecklist } from "@/lib/manual-e2e-checklist";

function statusLabel(status: string) {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  if (status === "blocked") return "BLOCKED";
  if (status === "not_applicable") return "N/A";
  return "Not tested";
}

function statusClass(status: string) {
  if (status === "pass" || status === "not_applicable") return "ready";
  if (status === "fail") return "failed";
  if (status === "blocked") return "active";
  return "unknown";
}

function phaseLabel(phase: string) {
  if (phase === "final_api") return "Final API/env pass";
  if (phase === "both") return "Pre-API + final";
  return "Pre-API pass";
}

export default function ManualE2EChecklistPage() {
  const checklist = buildManualE2EChecklist();

  return (
    <AdminShell
      title="Manual E2E Checklist"
      description="Track browser/manual launch checks for assistant routing, public entry points, production creation, admin visibility, payment, email and provider validation."
    >
      <section className="card admin-user-info-card launch-readiness-hero">
        <span className="badge">Manual launch pass</span>
        <h2>PASS / FAIL / BLOCKED tracking for final launch validation</h2>
        <p style={{ color: "var(--muted)" }}>
          Use this screen as the admin-facing checklist while running manual E2E. During pre-API cleanup, payment, email and provider live checks should remain blocked until final API/env setup is complete.
        </p>
        <div className="admin-info-grid launch-readiness-summary">
          <div><span>Total checks</span><strong>{checklist.summary.total}</strong><small>Generated at {checklist.generatedAt}</small></div>
          <div><span>Pre-API checks</span><strong>{checklist.preApiItems}</strong><small>Can be tested before live keys</small></div>
          <div><span>Final API checks</span><strong>{checklist.finalApiItems}</strong><small>Blocked until keys/domain are ready</small></div>
          <div><span>Currently blocked</span><strong>{checklist.summary.blocked}</strong><small>Expected during pre-API cleanup</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Status legend</span>
        <h2>How to record manual results</h2>
        <div className="admin-info-grid">
          {checklist.statusLegend.map((entry) => (
            <div key={entry.status}>
              <span>Status</span>
              <strong>{entry.status}</strong>
              <small>{entry.meaning}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Failure capture</span>
        <h2>Required notes for every FAIL</h2>
        <div className="admin-info-grid">
          {checklist.failureCaptureFields.map((field) => (
            <div key={field}>
              <span>Capture</span>
              <strong>{field}</strong>
              <small>Required before continuing the launch pass.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Acceptance gates</span>
        <h2>What counts as done?</h2>
        <div className="admin-category-grid">
          <div className="card admin-category-card">
            <span className="badge">Pre-API acceptance</span>
            <h3>Before keys are added</h3>
            {checklist.acceptance.preApi.map((entry) => <p key={entry}>{entry}</p>)}
          </div>
          <div className="card admin-category-card">
            <span className="badge">Final API/env acceptance</span>
            <h3>After keys are added</h3>
            {checklist.acceptance.finalApi.map((entry) => <p key={entry}>{entry}</p>)}
          </div>
        </div>
      </section>

      <section className="launch-readiness-grid" style={{ marginTop: 20 }}>
        {checklist.groups.map((group) => (
          <article className="card admin-category-card launch-readiness-group" key={group.title}>
            <div className="admin-production-head">
              <div>
                <span className="badge">{group.summary.total} checks</span>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
            </div>
            <div className="admin-info-grid" style={{ marginTop: 12 }}>
              <div><span>Not tested</span><strong>{group.summary.notTested}</strong><small>Default manual state</small></div>
              <div><span>Blocked</span><strong>{group.summary.blocked}</strong><small>Expected for final API items</small></div>
            </div>
            <div className="launch-readiness-items" style={{ marginTop: 12 }}>
              {group.items.map((entry) => (
                <div className={`launch-readiness-item ${statusClass(entry.defaultStatus)}`} key={`${group.title}-${entry.label}`}>
                  <div className="launch-readiness-item-head">
                    <strong>{entry.label}</strong>
                    <span>{statusLabel(entry.defaultStatus)}</span>
                  </div>
                  <p>{entry.expected}</p>
                  {entry.route ? <small>Route: {entry.route}</small> : <small>Route: context-dependent</small>}
                  <small>Phase: {phaseLabel(entry.phase)}</small>
                  <em>FAIL note: {entry.failNote}</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
