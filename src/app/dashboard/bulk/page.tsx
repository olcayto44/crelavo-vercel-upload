import { DashboardShell } from "@/components/DashboardShell";
import { BulkGenerationPanel } from "@/components/BulkGenerationPanel";

export default function BulkPage() {
  return (
    <DashboardShell>
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Phase 2 bulk planning</span>
        <h2>Bulk production queue planning</h2>
        <p>CSV validation and batch structure can be reviewed now, but real bulk provider jobs stay disabled until final API/env setup, queue limits and launch E2E are complete.</p>
      </div>
      <BulkGenerationPanel />
    </DashboardShell>
  );
}
