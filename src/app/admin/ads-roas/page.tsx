import { AdminShell } from "@/components/AdminShell";
import { analyticsEnvVariables, buildTrackedUrl, paidTrafficChannelPlan, trackingEventDefinitions } from "@/lib/analytics-tracking";

export default function AdminAdsRoasPage() {
  return (
    <AdminShell title="Ads & ROAS Backlog" description="Phase-2 planning for future OAuth connections, tracking, ad/export plans and ROAS review loops. Live ad launch and direct publishing wait for final API/env setup.">
      <section className="card admin-wide-card">
        <span className="badge">Analytics tracking readiness</span>
        <h2>UTM, pixel and conversion map prepared before paid spend</h2>
        <p style={{ color: "var(--muted)" }}>Crelavo can now capture first-touch UTM/ref data in the internal live traffic heartbeat. Third-party pixels stay inactive until real IDs are provided and final Whop payment attribution is verified.</p>
        <div className="admin-info-grid">
          <div><span>Event map</span><strong>{trackingEventDefinitions.length} events</strong><small>Visit to Whop conversion lifecycle.</small></div>
          <div><span>Env placeholders</span><strong>{analyticsEnvVariables.length} slots</strong><small>{analyticsEnvVariables.join(", ")}</small></div>
          <div><span>Sample tracked URL</span><strong>{buildTrackedUrl("/ai-video-generator", "google", "cpc", "crelavo_launch_search")}</strong><small>Use as naming format, not live spend instruction.</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Paid traffic channel plan</span>
        <h2>Prepared channels and launch-safe blockers</h2>
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

      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <span className="badge">Future OAuth</span>
          <h3>Social account plans</h3>
          <p>The connected_ad_accounts table tracks future Meta, Instagram, TikTok, YouTube, LinkedIn, and X targets; live OAuth opens after final API/env setup.</p>
        </div>
        <div className="card">
          <span className="badge">Planning</span>
          <h3>Campaign / post / export plan</h3>
          <p>The ad_campaign_jobs table stores social platform, plan payload, future external IDs, and error states; live publishing is currently disabled.</p>
        </div>
        <div className="card">
          <span className="badge">ROAS</span>
          <h3>AI optimization</h3>
          <p>If ROAS is low, future plans may pause ads, generate new hooks, or suggest platform-specific variations; live optimization comes after final API/env setup.</p>
        </div>
      </div>
    </AdminShell>
  );
}
