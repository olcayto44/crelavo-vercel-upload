import { DashboardShell } from "@/components/DashboardShell";
import { BrandKitPanel } from "@/components/BrandKitPanel";

export default function BrandKitPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Brand kit planning</span>
        <h2>Brand assets for production templates</h2>
        <p>Collect logo, color, font and brand direction so videos, websites, ads and social export packs can reuse the same visual identity.</p>
      </div>
      <BrandKitPanel />
    </DashboardShell>
  );
}
