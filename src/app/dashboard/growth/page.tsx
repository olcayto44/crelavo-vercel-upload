import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardGrowthPage() {
  return <DashboardEightShell active="growth" kicker="After production" title="Growth" lead="Next step after a file is ready: share a preview, apply as a partner, or start another production. No automatic credit minting from this page." columns={3}>
    <article className="card"><h3>Produce</h3><p>Video, campaign or file in Assistant.</p><a className="cta" href="/dashboard/create?type=AI%20Video&category=video">Open assistant</a></article>
    <article className="card"><h3>Partners</h3><p>Apply and share Crelavo. Commissions stay on the partners page.</p><a className="ghost" href="/dashboard/partners">Open partners</a></article>
    <article className="card"><h3>Credits</h3><p>Plans and packs. Checkout on Whop.</p><a className="ghost" href="/dashboard/credits">View credits</a></article>
  </DashboardEightShell>;
}
