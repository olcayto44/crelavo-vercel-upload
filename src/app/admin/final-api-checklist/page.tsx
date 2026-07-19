import { AdminShell } from "@/components/AdminShell";
import { buildFinalApiChecklist } from "@/lib/final-api-checklist";

function statusLabel(status: string) {
  if (status === "ready") return "Ready";
  if (status === "optional") return "Optional";
  if (status === "missing") return "Missing";
  if (status === "ready_for_live_e2e") return "Ready for live E2E";
  return "Pending";
}

function statusClass(status: string) {
  if (status === "ready" || status === "optional" || status === "ready_for_live_e2e") return "ready";
  if (status === "missing" || status === "blocked") return "failed";
  return "active";
}

export default function FinalApiChecklistPage() {
  const checklist = buildFinalApiChecklist();

  return (
    <AdminShell
      title="Final API / Env Checklist"
      description="Final-stage setup guide for Whop, Supabase, Resend, AI providers, package/payment IDs and live E2E checks without exposing secret values."
    >
      <section className="card admin-user-info-card launch-readiness-hero">
        <span className="badge">Final setup only</span>
        <h2>API/env key setup remains deferred until final testing</h2>
        <p style={{ color: "var(--muted)" }}>
          Do not paste real secrets into chat, docs or screenshots. Add them only to local .env.local and deployment environment variables when code, SEO, admin and non-payment launch checks are stable.
        </p>
        <div className="admin-info-grid launch-readiness-summary">
          <div><span>Status</span><strong>{statusLabel(checklist.summary.status)}</strong><small>Generated at {checklist.generatedAt}</small></div>
          <div><span>Ready / optional</span><strong>{checklist.summary.readyCount}</strong><small>Configured or not launch-blocking</small></div>
          <div><span>Missing</span><strong>{checklist.summary.missingCount}</strong><small>Required before live E2E</small></div>
          <div><span>Total checks</span><strong>{checklist.summary.totalCount}</strong><small>Across domain, payment, email and providers</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Next missing env/actions</span>
        <h2>Resolve these first on final API day</h2>
        <div className="admin-category-grid">
          {checklist.nextMissing.length ? checklist.nextMissing.map((entry) => (
            <div className="card admin-category-card" key={`${entry.group}-${entry.label}`}>
              <span className={`provider-job-chip ${statusClass(entry.status)}`}>{statusLabel(entry.status)}</span>
              <h3>{entry.label}</h3>
              <p><strong>{entry.group}</strong></p>
              <small>Env: {entry.env.join(", ")}</small>
              <p style={{ color: "var(--muted)" }}>{entry.validation}</p>
            </div>
          )) : (
            <div className="card admin-category-card">
              <span className="badge">Clear</span>
              <h3>No missing final env checks</h3>
              <p>Proceed to live E2E in the order below.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Validation commands</span>
        <h2>Run after final external setup</h2>
        <div className="admin-info-grid">
          {checklist.commands.map((command) => (
            <div key={command}>
              <span>Command</span>
              <strong>{command}</strong>
              <small>Must pass before public launch or live provider/payment traffic.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Live E2E order</span>
        <h2>Manual validation sequence</h2>
        <div className="admin-info-grid">
          {checklist.liveE2EOrder.map((step, index) => (
            <div key={step}>
              <span>Step {index + 1}</span>
              <strong>{step}</strong>
              <small>Stop the launch pass if this step fails.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Still blocked until keys are added</span>
        <h2>Do not test these during pre-API cleanup</h2>
        <div className="admin-info-grid">
          {checklist.stillBlockedUntilKeys.map((entry) => (
            <div key={entry}>
              <span>Blocked</span>
              <strong>{entry}</strong>
              <small>Allowed only during final API/env pass.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Resend email templates</span>
        <h2>Prepared message templates and smoke checklist</h2>
        <p style={{ color: "var(--muted)" }}>Use these templates for the first live Resend smoke pass. Send each one to an internal test inbox before using bulk or user-facing email actions.</p>
        <div className="admin-category-grid">
          {checklist.resendEmailTemplates.map((template) => (
            <div className="card admin-category-card" key={template.label}>
              <span className="badge">{template.audience}</span>
              <h3>{template.label}</h3>
              <p><strong>Subject:</strong> {template.subject}</p>
              <p style={{ whiteSpace: "pre-line" }}>{template.body}</p>
              <p className="workspace-action-note">{template.smokeStep}</p>
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: 16 }}>Resend smoke checklist</h3>
        <ul>{checklist.resendSmokeChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="launch-readiness-grid" style={{ marginTop: 20 }}>
        {checklist.groups.map((group) => (
          <article className="card admin-category-card launch-readiness-group" key={group.title}>
            <div className="admin-production-head">
              <div>
                <span className={`provider-job-chip ${statusClass(group.status)}`}>{statusLabel(group.status)}</span>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
            </div>
            <div className="launch-readiness-items">
              {group.items.map((entry) => (
                <div className={`launch-readiness-item ${statusClass(entry.status)}`} key={`${group.title}-${entry.label}`}>
                  <div className="launch-readiness-item-head">
                    <strong>{entry.label}</strong>
                    <span>{statusLabel(entry.status)}</span>
                  </div>
                  <p>{entry.note}</p>
                  <small>Env: {entry.env.join(", ")}</small>
                  <em>{entry.validation}</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
