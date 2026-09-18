import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function AdsPage() {
  return <DashboardEightShell active="ads" kicker="Creative only" title="Ads" lead="Score a concept and write a campaign in Assistant. Crelavo does not connect ad accounts, set daily budgets or spend media from this page." columns={2}>
    <article className="card"><h3>Ad score</h3><p>Hook, offer and proof check before you produce.</p><a className="cta" href="/dashboard/create?type=AI%20Video&category=video">Open ad score in Assistant</a></article>
    <article className="card"><h3>Campaign file</h3><p>Primary text, headline and CTA notes. You launch the ad yourself.</p><a className="ghost" href="/dashboard/create?type=AI%20Video&category=video">Open campaign in Assistant</a></article>
  </DashboardEightShell>;
}
