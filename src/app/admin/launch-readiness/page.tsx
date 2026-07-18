import { AdminShell } from "@/components/AdminShell";
import { buildLaunchReadiness } from "@/lib/launch-readiness";

function statusLabel(status: string) {
  if (status === "ready") return "Ready";
  if (status === "missing") return "Missing";
  if (status === "optional") return "Optional";
  return "Pending";
}

function statusClass(status: string) {
  if (status === "ready" || status === "optional") return "ready";
  if (status === "missing") return "failed";
  return "active";
}

export default function LaunchReadinessPage() {
  const readiness = buildLaunchReadiness();

  return (
    <AdminShell
      title="Launch Readiness"
      description="Check production launch blockers, provider keys, email delivery, Whop setup, safe capacity policy and manual launch actions without exposing secrets."
    >
      <section className="card admin-user-info-card launch-readiness-hero">
        <span className="badge">Launch control</span>
        <h2>Production readiness summary</h2>
        <p style={{ color: "var(--muted)" }}>
          This page never prints secret values. It only shows whether required environment variables and manual launch steps are ready, missing or pending.
        </p>
        <div className="admin-info-grid launch-readiness-summary">
          <div><span>Go / no-go</span><strong>{readiness.summary.goNoGo}</strong><small>Generated at {readiness.generatedAt}</small></div>
          <div><span>Ready / optional</span><strong>{readiness.summary.readyCount}</strong><small>Configured or not launch-blocking</small></div>
          <div><span>Hard blockers</span><strong>{readiness.summary.hardBlockerCount}</strong><small>Must be solved before full launch</small></div>
          <div><span>Soft blockers</span><strong>{readiness.summary.softBlockerCount}</strong><small>Can allow soft launch with monitoring</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Next critical actions</span>
        <h2>Fix these before opening traffic</h2>
        <div className="admin-category-grid">
          {readiness.nextCriticalActions.length ? readiness.nextCriticalActions.map((entry) => (
            <div className="card admin-category-card" key={`${entry.priority}-${entry.group}-${entry.label}`}>
              <span className="badge">{entry.priority}</span>
              <h3>{entry.label}</h3>
              <p><strong>{entry.group}</strong></p>
              <small>{entry.action}</small>
            </div>
          )) : (
            <div className="card admin-category-card">
              <span className="badge">Clear</span>
              <h3>No critical blockers detected</h3>
              <p>Continue with manual E2E and final API/provider checks.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch modes</span>
        <h2>What can safely open on launch day?</h2>
        <div className="admin-info-grid">
          {readiness.launchModes.map((mode) => (
            <div key={mode.label}>
              <span>{mode.label}</span>
              <strong>{mode.ready ? "Ready" : "Blocked"}</strong>
              <small>{mode.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Final setup order</span>
        <h2>Connect live systems in this sequence</h2>
        <div className="admin-info-grid">
          {readiness.finalSetupSequence.map((step) => (
            <div key={step.step}>
              <span>Step {step.step} · {statusLabel(step.status)}</span>
              <strong>{step.title}</strong>
              <small>{step.owner}</small>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>{step.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Blocker board</span>
        <h2>Hard blockers, soft blockers and non-hard missing items</h2>
        <div className="admin-category-grid">
          <div className="card admin-category-card">
            <span className="badge">Hard blockers</span>
            <h3>{readiness.blockerBoard.hardBlockers.length} items</h3>
            {readiness.blockerBoard.hardBlockers.length ? readiness.blockerBoard.hardBlockers.slice(0, 6).map((item) => <p key={`${item.group}-${item.label}`}><strong>{item.group}:</strong> {item.label}</p>) : <p>No hard blockers detected.</p>}
          </div>
          <div className="card admin-category-card">
            <span className="badge">Soft blockers</span>
            <h3>{readiness.blockerBoard.softBlockers.length} items</h3>
            {readiness.blockerBoard.softBlockers.length ? readiness.blockerBoard.softBlockers.slice(0, 6).map((item) => <p key={`${item.group}-${item.label}`}><strong>{item.group}:</strong> {item.label}</p>) : <p>No soft blockers detected.</p>}
          </div>
          <div className="card admin-category-card">
            <span className="badge">Other missing</span>
            <h3>{readiness.blockerBoard.missingButNotHard.length} items</h3>
            {readiness.blockerBoard.missingButNotHard.length ? readiness.blockerBoard.missingButNotHard.slice(0, 6).map((item) => <p key={`${item.group}-${item.label}`}><strong>{item.group}:</strong> {item.label}</p>) : <p>No other missing items.</p>}
          </div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Final validation plan</span>
        <h2>Required tests before public launch</h2>
        <div className="admin-info-grid">
          {readiness.finalValidationPlan.map((check) => (
            <div key={check.label}>
              <span>{check.label}</span>
              <strong>{check.command}</strong>
              <small>{check.result}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Monitoring and rollback</span>
        <h2>What to watch after traffic starts</h2>
        <div className="admin-info-grid">
          {readiness.monitoringAndRollbackPlan.map((guard) => (
            <div key={guard.label}>
              <span>{statusLabel(guard.status)}</span>
              <strong>{guard.label}</strong>
              <small>{guard.action}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch-day timeline</span>
        <h2>Operational timeline for Product Hunt, Reddit or creator traffic</h2>
        <div className="admin-info-grid">
          {readiness.launchDayTimeline.map((step) => (
            <div key={step.phase}>
              <span>{step.phase}</span>
              <strong>{step.owner}</strong>
              <small>{step.action}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="launch-readiness-grid" style={{ marginTop: 20 }}>
        {readiness.groups.map((group) => (
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
                  <small>Required: {entry.required.join(", ")}</small>
                  <em>{entry.action}</em>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
