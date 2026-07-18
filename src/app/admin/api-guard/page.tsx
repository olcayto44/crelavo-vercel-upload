import { AdminApiGuardPanel } from "@/components/AdminApiGuardPanel";
import { AdminShell } from "@/components/AdminShell";

export default function AdminApiGuardPage() {
  return (
    <AdminShell
      title="API Guard / Cost Control"
      description="Monitor active API cost limits, today's production credit usage, near-limit users and admin intervention paths."
    >
      <AdminApiGuardPanel />
    </AdminShell>
  );
}
