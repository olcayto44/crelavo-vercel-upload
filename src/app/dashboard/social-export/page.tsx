import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardSocialExportPage() {
  return <DashboardEightShell active="export" kicker="Download, then post" title="Social export" lead="Captions and 9:16 / 4:5 / 1:1 notes in Assistant. Files stay in Productions. This page does not publish to TikTok, Shorts, Reels, Meta, LinkedIn or X." columns={2}>
    <article className="card"><h3>Write the pack</h3><p>Campaign copy, hooks and format notes in Assistant.</p><a className="cta" href="/dashboard/create?type=AI%20Video&category=video">Open campaign in Assistant</a></article>
    <article className="card"><h3>Get the file</h3><p>Preview and download from Productions when the job is ready.</p><a className="ghost" href="/dashboard/productions">Open productions</a></article>
  </DashboardEightShell>;
}
