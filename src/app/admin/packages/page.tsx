import { AdminShell } from "@/components/AdminShell";
import { AdminPackagesManager } from "@/components/AdminPackagesManager";

export default function AdminPackagesPage() {
  return (
    <AdminShell title="Package management" description="Edit and save package config used by Assistant planning, production reserve, delivery estimates and Stripe checkout readiness.">
      <AdminPackagesManager />
    </AdminShell>
  );
}
