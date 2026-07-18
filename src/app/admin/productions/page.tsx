import { AdminShell } from "@/components/AdminShell";
import { AdminProductionsTable } from "@/components/AdminProductionsTable";

export default function AdminProductionsPage() {
  return (
    <AdminShell title="Tüm production talepleri" description="Tüm üretim kategorilerinden gelen talepleri durum, not ve teslim linkleriyle yönet.">
      <section className="card admin-wide-card">
        <AdminProductionsTable />
      </section>
    </AdminShell>
  );
}
