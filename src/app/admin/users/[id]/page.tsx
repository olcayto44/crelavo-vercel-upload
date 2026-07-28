import { AdminShell } from "@/components/AdminShell";
import { AdminUserDetailManager } from "@/components/AdminUserDetailManager";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Member detail" description="View one member's ID, email, country, registration date, credits, packages, production usage, admin actions and support replies.">
      <AdminUserDetailManager userId={id} />
    </AdminShell>
  );
}
