import { AdminShell } from "@/components/AdminShell";
import { AdminStatsCards } from "@/components/AdminStatsCards";
import { AdminLiveVisitorsCard } from "@/components/AdminLiveVisitorsCard";

export default function AdminPage() {
  return (
    <AdminShell
      title="Crelavo Admin Panel"
      description="Daily operations for members, productions, finance, providers, and site management. Use the grouped menu to open detailed admin screens."
    >
      <section className="admin-panel-section"><AdminStatsCards /></section>
      <section className="admin-panel-section"><AdminLiveVisitorsCard /></section>
    </AdminShell>
  );
}
