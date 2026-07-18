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
          <h3>Sosyal hesap planları</h3>
          <p>connected_ad_accounts tablosu gelecekteki Meta, Instagram, TikTok, YouTube, LinkedIn ve X hedeflerini izler; canlı OAuth final API/env sonrası açılır.</p>
        </div>
        <div className="card">
          <span className="badge">Planning</span>
          <h3>Campaign / post / export plan</h3>
          <p>ad_campaign_jobs tablosu sosyal platform, plan payload, future external id ve hata durumlarını saklar; canlı publish launch şimdilik kapalıdır.</p>
        </div>
        <div className="card">
          <span className="badge">ROAS</span>
          <h3>AI optimizasyon</h3>
          <p>ROAS düşükse gelecekte reklam durdurma, yeni hook üretme veya platforma özel varyasyon önerisi planlanır; canlı optimizasyon final API/env sonrasına kalır.</p>
        </div>
      </div>
    </AdminShell>
  );
}
