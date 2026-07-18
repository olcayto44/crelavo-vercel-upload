import { AdminShell } from "@/components/AdminShell";
import { AdminLiveVisitorsCard } from "@/components/AdminLiveVisitorsCard";
import { analyticsEnvVariables, analyticsReadinessChecklist, buildTrackedUrl, paidTrafficChannelPlan, trackingEventDefinitions } from "@/lib/analytics-tracking";

function statusClass(status: string) {
  if (status === "ready") return "ready";
  if (status === "blocked") return "failed";
  return "active";
}

export default function AdminAnalyticsPage() {
  const readyEvents = trackingEventDefinitions.filter((event) => event.status === "ready").length;
  const blockedEvents = trackingEventDefinitions.filter((event) => event.status === "blocked").length;

  return (
    <AdminShell title="Analytics Dashboard" description="Live visitor, UTM/ref attribution, event taxonomy and paid traffic readiness without enabling third-party spend early.">
      <section className="card admin-wide-card">
        <span className="badge">Analytics command center</span>
        <h2>Traffic, attribution and conversion events are visible before paid spend</h2>
        <p style={{ color: "var(--muted)" }}>
          Internal heartbeat tracking is active for live visitor and first-touch attribution review. GA/GTM/pixel scripts remain inactive until real public IDs are added and final Whop payment attribution is validated.
        </p>
        <div className="admin-info-grid">
          <div><span>Mapped events</span><strong>{trackingEventDefinitions.length}</strong><small>{readyEvents} ready · {blockedEvents} blocked until payment validation</small></div>
          <div><span>Channel plans</span><strong>{paidTrafficChannelPlan.length}</strong><small>Google, Meta, TikTok and LinkedIn UTM structure</small></div>
          <div><span>Env slots</span><strong>{analyticsEnvVariables.length}</strong><small>{analyticsEnvVariables.join(", ")}</small></div>
          <div><span>Sample URL</span><strong>{buildTrackedUrl("/ai-video-generator", "google", "cpc", "crelavo_launch_search")}</strong><small>Use for naming format only; not a live spend instruction</small></div>
        </div>
      </section>

      <section className="admin-panel-section"><AdminLiveVisitorsCard /></section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Event taxonomy</span>
        <h2>Funnel events and guardrails</h2>
        <div className="provider-job-list">
          {trackingEventDefinitions.map((event) => (
            <div className={`provider-job-chip ${statusClass(event.status)}`} key={event.eventName}>
              <strong>{event.eventName}</strong>
              <span>{event.funnelStage} · {event.trigger}</span>
              <small>Required: {event.requiredProperties.join(", ")}</small>
              <small>Destination: {event.destination}</small>
              <small>Guardrail: {event.guardrail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Paid channel readiness</span>
        <h2>Prepared tracking plans, blocked live spend</h2>
        <div className="admin-category-grid">
          {paidTrafficChannelPlan.map((channel) => (
            <div className="card admin-category-card" key={channel.channel}>
              <span className="badge">{channel.utmSource} / {channel.utmMedium}</span>
              <h3>{channel.channel}</h3>
              <p>{channel.primaryGoal}</p>
              <p><strong>Campaign:</strong> {channel.sampleCampaign}</p>
              <p><strong>Safe action:</strong> {channel.firstSafeAction}</p>
              <p className="workspace-action-note warning">Blocked until: {channel.blockedUntil}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Readiness checklist</span>
        <ul>{analyticsReadinessChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </AdminShell>
  );
}
