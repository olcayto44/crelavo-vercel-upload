import { DashboardShell } from "@/components/DashboardShell";
import { DubbingPanel } from "@/components/DubbingPanel";

export default function DubbingPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Dubbing workspace</span>
        <h2>Dubbing and lip-sync workflow planning</h2>
        <p>Prepare source video, language pair, voice direction and delivery notes so dubbing requests can move cleanly into dashboard production review.</p>
      </div>
      <DubbingPanel />
    </DashboardShell>
  );
}
