import { AdminShell } from "@/components/AdminShell";
import { AdminApiServicesManager } from "@/components/AdminApiServicesManager";
import { apiServiceGroups } from "@/lib/api-services";

export default function AdminApiServicesPage() {
  return (
    <AdminShell title="API Service Cards" description="Manage the public API documentation cards, service images, card copy and anchors from the admin panel.">
      <section className="card admin-wide-card">
        <span className="badge">Admin-managed API cards</span>
        <h3>Public service cards</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Edit the visible cards on /api-documentation, including image path, service name, anchor slug, summary and use-case copy. Saved content is stored in platform_configs.api_services.</p>
        <AdminApiServicesManager initialGroups={apiServiceGroups} />
      </section>
    </AdminShell>
  );
}
