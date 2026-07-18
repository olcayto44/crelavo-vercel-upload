import { DashboardShell } from "@/components/DashboardShell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="card">
        <h2>Settings</h2>
        <p style={{ color: "var(--muted)" }}>Profile, brand kit, and default video preferences will be managed here.</p>
      </div>
    </DashboardShell>
  );
}
