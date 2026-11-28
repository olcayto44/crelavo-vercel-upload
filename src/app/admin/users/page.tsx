import { AdminCreateAdminManager } from "@/components/AdminCreateAdminManager";
import { AdminShell } from "@/components/AdminShell";
import { AdminUsersManager } from "@/components/AdminUsersManager";

export default function AdminUsersPage() {
  return (
    <AdminShell title="Üyeler ve aboneler" description="Üyeyi seçerek ödeme, kredi, üretim ve destek geçmişini aç.">
      <AdminUsersManager />
      <details className="card admin-wide-card"><summary>Yönetici hesabı oluştur</summary><AdminCreateAdminManager /></details>
    </AdminShell>
  );
}
