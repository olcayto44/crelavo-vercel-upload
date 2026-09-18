import { BulkGenerationPanel } from "@/components/BulkGenerationPanel";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default function BulkPage() {
  return (
    <DashboardToolLayout id="bulk">
      <span className="badge">Bulk workspace</span>
      <h1>Bulk production queue planning</h1>
      <p className="lead">Validate CSV structure, review batch inputs and prepare clean production queues before a large delivery run.</p>
      <BulkGenerationPanel />
    </DashboardToolLayout>
  );
}
