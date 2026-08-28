import { AdminShell } from "@/components/AdminShell";
import { AdminProductionsTable } from "@/components/AdminProductionsTable";

export default function AdminProductionsPage() {
  return (
    <AdminShell title="All production requests" description="Manage requests from all production categories by status, notes, and delivery links.">
      <section className="card admin-wide-card">
        <AdminProductionsTable />
      </section>
    </AdminShell>
  );
}
