import { AdminShell } from "@/components/AdminShell";
import { AdminUserDetailManager } from "@/components/AdminUserDetailManager";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Üye detayları" description="Hesap, abonelik, ödeme, kredi ve üretim geçmişi.">
      <AdminUserDetailManager userId={id} />
    </AdminShell>
  );
}
