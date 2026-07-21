import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { AdsRoasPanel } from "@/components/AdsRoasPanel";

const socialTargets = [
  "Facebook / Meta Ads",
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
  "LinkedIn",
  "X / Twitter"
];

export default function AdsPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Post-launch social export</span>
        <h2>Social export and ads planning center</h2>
        <p>Prepare platform-ready captions, hashtags, formats and campaign notes now. Direct publishing, ad launch and ROAS automation stay disabled until the final API/env setup after core launch cleanup.</p>
        <div className="url-action-center">
          <Link className="btn" href="/dashboard/connections">Connect social account</Link>
          <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=Produce%20social%20campaign">Produce social campaign</Link>
          <Link className="btn secondary" href="/dashboard/productions">Open ready productions</Link>
        </div>
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        <span className="badge">Supported social targets</span>
        <h3>Not a single channel, a multi-channel publishing center</h3>
        <div className="admin-info-grid ads-target-grid">
          {socialTargets.map((target) => (
            <div key={target}>
              <span>Platform</span>
              <strong>{target}</strong>
              <small>Connection / publishing / ad target</small>
              <small>Manual export/ad planning only until API/env setup is complete.</small>
            </div>
          ))}
        </div>
      </section>

      <AdsRoasPanel />
    </DashboardShell>
  );
}
