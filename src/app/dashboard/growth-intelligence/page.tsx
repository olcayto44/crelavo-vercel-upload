import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardGrowthIntelligencePage() {
  return <DashboardEightShell active="gi" kicker="Public sources only" title="Growth Intelligence" lead="Monthly competitor reports from public pages, ad libraries and reviews. Not a credit top-up. No private dashboards, logins or paywall bypass. Checkout stays on the public plans page." columns={2} growthIntelligencePrimary>
    <article className="card"><h3>View plans</h3><p>{"Starter $179/mo \u00B7 Growth $499/mo \u00B7 Enterprise $1,999/mo. Reports after entitlement."}</p><a className="cta" href="/growth-intelligence">Open GI plans</a></article>
    <article className="card"><h3>Studio home</h3><p>Credits, billing and productions stay on the main dashboard.</p><a className="ghost" href="/dashboard">Back to dashboard</a></article>
  </DashboardEightShell>;
}
