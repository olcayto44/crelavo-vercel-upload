import { ConnectedAccountsPanel } from "@/components/ConnectedAccountsPanel";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default function ConnectionsPage() {
  return (
    <DashboardToolLayout id="connections">
      <span className="badge">Post-launch integrations</span>
      <h1>Connected accounts and store planning</h1>
      <p className="lead">Prepare social accounts, commerce stores, export targets and handoff notes without silent publishing.</p>
      <ConnectedAccountsPanel />
    </DashboardToolLayout>
  );
}
