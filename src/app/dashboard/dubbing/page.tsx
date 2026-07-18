import { DashboardShell } from "@/components/DashboardShell";
import { DubbingPanel } from "@/components/DubbingPanel";

export default function DubbingPage() {
  return (
    <DashboardShell>
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Phase 2 dubbing planning</span>
        <h2>Dubbing and lip-sync workflow planning</h2>
        <p>This area documents future dubbing/lip-sync jobs. Real provider execution requires final voice/video API setup and should remain post-launch until core payment and production E2E are complete.</p>
      </div>
      <DubbingPanel />
    </DashboardShell>
  );
}
