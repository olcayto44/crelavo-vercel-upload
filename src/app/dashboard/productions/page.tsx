import { DashboardShell } from "@/components/DashboardShell";
import { ProductionsTable } from "@/components/ProductionsTable";

export default function MyProductionsPage() {
  return (
    <DashboardShell>
      <div className="production-hero-card">
        <span className="badge">My Productions</span>
        <h2>Live jobs, previews, and deliveries in one place</h2>
        <p>Track videos, websites, mobile apps, visuals, brand kits, documents, and admin panel projects started from the AI Assistant. Ready items open directly into the live workspace, preview, or final delivery link.</p>
      </div>
      <div style={{ marginTop: 18 }}>
        <ProductionsTable />
      </div>
    </DashboardShell>
  );
}
