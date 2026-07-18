import { AdminCreateAdminManager } from "@/components/AdminCreateAdminManager";
import { AdminShell } from "@/components/AdminShell";
import { AdminUsersManager } from "@/components/AdminUsersManager";

export default function AdminUsersPage() {
  return (
    <AdminShell title="Members" description="Manage normal users, admin users, user IP/location, credit operations and admin account creation.">
      <AdminCreateAdminManager />
      <AdminUsersManager />
    </AdminShell>
  );
}
