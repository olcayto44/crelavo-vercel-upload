import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardShortsGrowthPage() {
  return <DashboardEightShell active="shorts" kicker="9:16 in Assistant" title="Shorts" lead="Produce a short in Assistant, download it, then post it yourself. No connected auto-publish from this page." columns={2}>
    <article className="card"><h3>Make a short</h3><p>{"Video type, 4\u201315s on MiniMax H3. Proof clip, tool demo or product hook."}</p><a className="cta" href="/dashboard/assistant-workspace?type=video">Open video in Assistant</a></article>
    <article className="card"><h3>Export notes</h3><p>Captions and cover text as a campaign file if you need a pack around the clip.</p><a className="ghost" href="/dashboard/assistant-workspace?type=campaign">Open campaign in Assistant</a></article>
  </DashboardEightShell>;
}
