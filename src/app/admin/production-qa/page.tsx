import { AdminProductionQaPanel } from "@/components/AdminProductionQaPanel";
import { AdminShell } from "@/components/AdminShell";

export default function AdminProductionQaPage() {
  return (
    <AdminShell
      title="Production Quality QA"
      description="Run operational QA across recent productions: quality metadata, delivery package, legal snapshot, cost/output plan and ready-state delivery links."
    >
      <AdminProductionQaPanel />
    </AdminShell>
  );
}
