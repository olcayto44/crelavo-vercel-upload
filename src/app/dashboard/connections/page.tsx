import { ConnectedAccountsPanel } from "@/components/ConnectedAccountsPanel";
import { DashboardShell } from "@/components/DashboardShell";

export default function ConnectionsPage() {
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Post-launch integrations</span>
        <h2>Connected accounts and store planning</h2>
        <p>Use this area to prepare social accounts, commerce stores, export targets and handoff notes before a campaign or product delivery goes live.</p>
      </div>
      <ConnectedAccountsPanel />
    </DashboardShell>
  );
}
