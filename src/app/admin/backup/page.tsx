import { AdminBackupManager } from "@/components/AdminBackupManager";
import { AdminShell } from "@/components/AdminShell";

export default function AdminBackupPage() {
  return (
    <AdminShell title="Code backup" description="Manage safe backup manifests, restore plans, launch privacy checks and disaster recovery notes without exposing secret env values.">
      <AdminBackupManager />
    </AdminShell>
  );
}
