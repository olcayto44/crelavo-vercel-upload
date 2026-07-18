import { ConnectedAccountsPanel } from "@/components/ConnectedAccountsPanel";
import { DashboardShell } from "@/components/DashboardShell";

export default function ConnectionsPage() {
  return (
    <DashboardShell>
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Post-launch integrations</span>
        <h2>Connected accounts and store planning</h2>
        <p>Use this area to prepare future social and commerce integrations. Direct OAuth, publishing and store push actions require the final API/env setup and will remain planning/backlog items until after core launch validation.</p>
      </div>
      <ConnectedAccountsPanel />
    </DashboardShell>
  );
}
