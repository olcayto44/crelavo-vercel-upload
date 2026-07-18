import { AdminShell } from "@/components/AdminShell";

export default function AdminBulkPage() {
  return (
    <AdminShell title="Bulk Production Backlog" description="Phase-2 CSV/XLSX batch validation, concurrency, rate-limit and invalid-row planning. Real bulk provider execution waits for final API/env setup.">
      <div className="grid">
        <div className="card">
          <span className="badge">Queue</span>
          <h3>Bulk batch monitoring</h3>
          <p>Batch status, valid/invalid rows and completed job counts are tracked through the bulk_generation_batches and bulk_generation_items tables.</p>
        </div>
        <div className="card">
          <span className="badge">Risk review</span>
          <h3>Validation before API cost</h3>
          <p>Broken links, empty products and invalid CSV rows are caught before they enter the production queue.</p>
        </div>
        <div className="card">
          <span className="badge">Concurrency</span>
          <h3>Controlled production between 5-10 jobs</h3>
          <p>The BULK_GENERATION_CONCURRENCY value will control grouped production after final provider/API setup; for now this remains a planning guardrail.</p>
        </div>
      </div>
    </AdminShell>
  );
}
