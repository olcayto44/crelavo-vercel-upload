import { AdminLiveSalesAgentsPanel } from "@/components/AdminLiveSalesAgentsPanel";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLiveSalesAgentPage() {
  return (
    <AdminShell
      title="AI Live Sales Agent Management"
      description="Kaydedilen canlı satış avatarlarını, platformlarını, ürün bilgisini, operasyon durumunu ve embed kodlarını yönet."
    >
      <AdminLiveSalesAgentsPanel />
    </AdminShell>
  );
}
