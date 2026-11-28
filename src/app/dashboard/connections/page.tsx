import {ProductionPublishingPanel} from "@/components/ProductionPublishingPanel";
import { ConnectedAccountsPanel } from "@/components/ConnectedAccountsPanel";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default async function ConnectionsPage({searchParams}:{searchParams:Promise<{production?:string}>}) {
 const {production}=await searchParams;
  return (
    <DashboardToolLayout id="connections">
      <span className="badge">Post-launch integrations</span>
      <h1>Connected accounts and store planning</h1>
      <p className="lead">Prepare social accounts, commerce stores, export targets and handoff notes without silent publishing.</p>
      <ProductionPublishingPanel initialProduction={typeof production==="string"?production:""}/><ConnectedAccountsPanel />
      <details className="card"><summary>Pinterest integration status</summary><p>Direct publishing is temporarily disabled until secure media handling and platform approval tests are complete.</p></details>
    </DashboardToolLayout>
  );
}
