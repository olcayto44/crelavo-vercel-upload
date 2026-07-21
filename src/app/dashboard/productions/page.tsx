import { DashboardShell } from "@/components/DashboardShell";
import { ProductionsTable } from "@/components/ProductionsTable";

export default function MyProductionsPage() {
  return (
    <DashboardShell>
      <div className="production-hero-card">
        <span className="badge">My Productions</span>
        <h2>Production command center</h2>
        <p>Track active jobs, waiting decisions, preview-ready outputs and final deliveries from one clean production hub. Open any job to continue in the live workspace.</p>
      </div>
      <div style={{ marginTop: 18 }}>
        <ProductionsTable />
      </div>
    </DashboardShell>
  );
}
