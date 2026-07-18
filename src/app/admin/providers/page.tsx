import { AdminShell } from "@/components/AdminShell";
import { buildProviderPlan } from "@/lib/provider-plan";

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

const finalSetupOrder = [
  "Confirm selected brain, image and video provider choices before adding keys.",
  "Add one provider key at a time and run the matching low-cost test before adding the next provider.",
  "Keep video/provider concurrency conservative during launch week.",
  "Use Whop checkout for the active paid launch; keep Lemon Squeezy out of scope until the later application/migration phase.",
  "Run Manual E2E after provider keys are added and stop if any provider job fails silently."
];

const lowCostTests = [
  { label: "Brain", test: "Run Assistant Workspace planning with a real test user and verify no fallback/mock warning." },
  { label: "Image", test: "Run one image generation or image-editing request only if image products are sold at launch." },
  { label: "Video", test: "Run one 5-second low-cost provider job and verify status polling plus delivery link." },
  { label: "Voice", test: "Run one short voiceover/dubbing test only if voice products are sold at launch." },
  { label: "Email", test: "Send contact, partner application and credits activated test emails." },
  { label: "Payment", test: "Use Whop checkout first; run live payment, webhook, duplicate-credit and admin fallback checks before full automation." }
];

export default function AdminProvidersPage() {
  const providerPlan = buildProviderPlan();

  return (
    <AdminShell title="Provider Readiness" description="Central AI/API provider plan for final setup. Secrets are never shown; only model choices, env names, safe mode and launch blockers are visible.">
      <section className="card admin-user-info-card launch-readiness-hero">
        <span className="badge">Provider control</span>
        <h2>API-ready provider map</h2>
        <p style={{ color: "var(--muted)" }}>This page defines which provider powers each part of Crelavo. The goal is to finish all UI and operational logic now, then only add keys, choose final models and run E2E tests during final API setup.</p>
        <div className="admin-info-grid launch-readiness-summary">
          <div><span>Overall status</span><strong>{providerPlan.summary.status}</strong><small>Generated at {providerPlan.generatedAt}</small></div>
          <div><span>Ready / optional</span><strong>{providerPlan.summary.readyCount}</strong><small>Configured or non-blocking</small></div>
          <div><span>Missing</span><strong>{providerPlan.summary.missingCount}</strong><small>Needs API/env before live use</small></div>
          <div><span>Total providers</span><strong>{providerPlan.summary.totalCount}</strong><small>Brain, video, image, voice, render, email, payment</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Selected routing</span>
        <h2>Current provider choices</h2>
        <div className="admin-info-grid">
          <div><span>Brain</span><strong>{providerPlan.selected.brainProvider}</strong><small>AI_BRAIN_PROVIDER or default</small></div>
          <div><span>Video</span><strong>{providerPlan.selected.videoProvider}</strong><small>VIDEO_PROVIDER / GENERATION_PROVIDER</small></div>
          <div><span>Image</span><strong>{providerPlan.selected.imageProvider}</strong><small>IMAGE_PROVIDER</small></div>
          <div><span>Safe mode</span><strong>Enabled by design</strong><small>Missing keys block real jobs, not the UI</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Final setup order</span>
        <h2>Connect providers one at a time</h2>
        <div className="admin-info-grid">
          {finalSetupOrder.map((step, index) => (
            <div key={step}>
              <span>Step {index + 1}</span>
              <strong>{step}</strong>
              <small>Prevents hidden provider failures and unexpected spend.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Low-cost provider tests</span>
        <h2>Run only the tests needed for launch products</h2>
        <div className="admin-info-grid">
          {lowCostTests.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.test}</strong>
              <small>Record result in Manual E2E Checklist.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Safe mode policy</span>
        <h2>Missing provider keys should not break the product UI</h2>
        <p style={{ color: "var(--muted)" }}>
          If a provider key is missing, Crelavo should keep the request as a structured plan, queued dashboard record, manual delivery path or waiting_provider_config state. Real paid provider jobs should start only after the matching low-cost E2E passes.
        </p>
      </section>

      <section className="launch-readiness-grid" style={{ marginTop: 20 }}>
        {providerPlan.plans.map((plan) => (
          <article className="card admin-category-card launch-readiness-group" key={plan.id}>
            <div className="admin-production-head">
              <div>
                <span className={`provider-job-chip ${statusClass(plan.status)}`}>{statusLabel(plan.status)}</span>
                <h2>{plan.label}</h2>
                <p>{plan.intendedUse}</p>
              </div>
            </div>
            <div className="launch-readiness-items">
              <div className={`launch-readiness-item ${statusClass(plan.status)}`}>
                <div className="launch-readiness-item-head"><strong>{plan.provider}</strong><span>{plan.category}</span></div>
                <p>Primary model: {plan.primaryModel}</p>
                <small>Fallbacks: {plan.fallbackModels.join(", ") || "None"}</small>
                <em>Status: {statusLabel(plan.status)}</em>
              </div>
              <div className="launch-readiness-item active">
                <div className="launch-readiness-item-head"><strong>Required env</strong><span>{plan.requiredEnv.length}</span></div>
                <p>{plan.requiredEnv.join(", ") || "No required env"}</p>
                <small>Optional: {plan.optionalEnv.join(", ") || "None"}</small>
              </div>
              <div className="launch-readiness-item active">
                <div className="launch-readiness-item-head"><strong>Safe mode</strong><span>pre-API</span></div>
                <p>{plan.safeMode}</p>
                <em>{plan.finalSetup}</em>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
