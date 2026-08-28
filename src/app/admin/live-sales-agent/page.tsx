import { AdminLiveSalesAgentsPanel } from "@/components/AdminLiveSalesAgentsPanel";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLiveSalesAgentPage() {
  return (
    <AdminShell
      title="AI Live Sales Agent Management"
      description="Manage saved live sales avatars, platforms, product information, operational status, and embed codes."
    >
      <AdminLiveSalesAgentsPanel />
    </AdminShell>
  );
}
