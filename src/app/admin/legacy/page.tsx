import { AdminShell } from "@/components/AdminShell";
import { AdminRequestsTable } from "@/components/AdminRequestsTable";

export default function AdminLegacyPage() {
  return (
    <AdminShell title="Eski video talepleri" description="Yeni production sistemi tamamlanana kadar eski video talepleri burada takip edilir.">
      <section className="card admin-wide-card">
        <AdminRequestsTable />
      </section>
    </AdminShell>
  );
}
