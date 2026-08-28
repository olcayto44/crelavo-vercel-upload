import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminApiServicesManager } from "@/components/AdminApiServicesManager";
import { ProviderReadinessCard } from "@/components/ProviderReadinessCard";
import { apiServiceGroups } from "@/lib/api-services";

export default function AdminApiServicesPage() {
  return (
    <AdminShell title="API Service Cards" description="Manage public API documentation cards, provider readiness and integration claims from one admin panel.">
      <section className="card admin-wide-card">
        <span className="badge">API visibility control</span>
        <h2>Keep real connections aligned with public API claims</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>This page manages /api-documentation cards, but live API capacity must be verified separately through provider readiness. If a provider is missing, public copy must not imply availability; keep it as managed onboarding, pending, or planned.</p>
        <div className="admin-info-grid">
          <div><span>Public page</span><strong>/api-documentation</strong><small>Visible integration roadmap for SEO and technical buyers.</small></div>
          <div><span>Live tests</span><strong>/admin/providers</strong><small>Real env and low-cost readiness tests.</small></div>
          <div><span>Safe rule</span><strong>No fake availability</strong><small>Do not claim a missing API is live or active.</small></div>
          <div><span>Mode</span><strong>Managed first</strong><small>Self-serve public API key sistemi daha sonra.</small></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <Link className="btn" href="/api-documentation">Open public API documentation</Link>
          <Link className="btn secondary" href="/admin/providers">Open provider tests</Link>
        </div>
      </section>

      <ProviderReadinessCard />

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Admin-managed API cards</span>
        <h3>Public service cards</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Edit the visible cards on /api-documentation, including image path, service name, anchor slug, summary and use-case copy. Saved content is stored in platform_configs.api_services.</p>
        <AdminApiServicesManager initialGroups={apiServiceGroups} />
      </section>
    </AdminShell>
  );
}
