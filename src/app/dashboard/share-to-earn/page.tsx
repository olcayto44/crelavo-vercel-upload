import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardShareToEarnPage() {
  return <DashboardEightShell active="share" kicker="Manual review" title="Share" lead="Share an approved preview or apply as a partner. This page does not mint credits from likes, comments or unverified posts." columns={2}>
    <article className="card"><h3>Partner program</h3><p>Referral links and commission rules live on Partners. Empty stats until you apply.</p><a className="cta" href="/dashboard/partners">Open partners</a></article>
    <article className="card"><h3>Make something to share</h3><p>Produce in Assistant, then download from Productions.</p><a className="ghost" href="/dashboard/assistant-workspace">Open assistant</a></article>
  </DashboardEightShell>;
}
