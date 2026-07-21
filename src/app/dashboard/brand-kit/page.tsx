import { DashboardShell } from "@/components/DashboardShell";
import { BrandKitPanel } from "@/components/BrandKitPanel";

export default function BrandKitPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Brand kit planning</span>
        <h2>Brand assets for future production templates</h2>
        <p>Collect logo, color and font information now. Automatic template application through render providers remains post-launch and depends on final API/env setup.</p>
      </div>
      <BrandKitPanel />
    </DashboardShell>
  );
}
