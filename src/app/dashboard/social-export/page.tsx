import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { launchBlockedNotes, socialExportPack } from "@/lib/growth-launch-systems";

export default function DashboardSocialExportPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Social media export pack</span>
        <h2>Platform-ready export notes for every approved production</h2>
        <p>Prepare captions, hashtags, cover text, CTA notes and export formats for TikTok, Shorts, Reels, X and LinkedIn without enabling direct publishing before APIs are ready.</p>
        <div className="url-action-center">
          <Link className="btn" href="/dashboard/productions">Open productions</Link>
          <Link className="btn secondary" href="/dashboard/ads">Open ads planning</Link>
          <Link className="btn secondary" href="/dashboard/connections">Connect accounts</Link>
          <Link className="btn secondary" href="/dashboard/create">Create new production</Link>
        </div>
      </section>
      <section className="admin-category-grid social-export-grid" style={{ marginTop: 20 }}>
        {socialExportPack.map((item) => (
          <div className="card admin-category-card social-export-card" key={item.platform}>
            <span className="badge">{item.format}</span>
            <h3>{item.platform}</h3>
            <div className="social-export-detail-list">
              <span><small>Format</small><strong>{item.format}</strong></span>
              <span><small>Platform</small><strong>{item.platform}</strong></span>
              <span><small>Included assets</small><strong>{item.assets}</strong></span>
              <span><small>Publishing rule</small><strong>{item.guardrail}</strong></span>
            </div>
          </div>
        ))}
      </section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Blocked automation</span><ul>{launchBlockedNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
    </DashboardShell>
  );
}
