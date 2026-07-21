import { DashboardShell } from "@/components/DashboardShell";
import { BulkGenerationPanel } from "@/components/BulkGenerationPanel";

export default function BulkPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Bulk workspace</span>
        <h2>Bulk production queue planning</h2>
        <p>Validate CSV structure, separate each item, review batch inputs and prepare clean production queues before any large delivery run starts.</p>
      </div>
      <BulkGenerationPanel />
    </DashboardShell>
  );
}
