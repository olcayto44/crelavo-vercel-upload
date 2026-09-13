import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardPremiumExpansionPage() {
  return <DashboardEightShell active="premium" kicker="Own assets only" title="Premium" lead="Localization, cultural notes and voice in Assistant. Competitor work is public structure only. Do not copy footage, logos, scripts, music or faces." columns={3}>
    <article className="card"><h3>Localization</h3><p>Titles, bullets and captions for another market.</p><a className="cta" href="/dashboard/assistant-workspace?type=localization">Open localization</a></article>
    <article className="card"><h3>Voice</h3><p>MiniMax speech-2.8-hd. Confirm likeness rights before a clone.</p><a className="ghost" href="/dashboard/assistant-workspace?type=voice">Open voice</a></article>
    <article className="card"><h3>GI reports</h3><p>Public-source competitor reports. Separate service plans.</p><a className="ghost" href="/growth-intelligence">Open GI plans</a></article>
  </DashboardEightShell>;
}
