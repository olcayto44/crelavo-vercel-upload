import { DashboardEightShell } from "@/components/DashboardEightShell";

export default function DashboardDroneShootPage() {
  return <DashboardEightShell active="drone" kicker="Create in Assistant" title="Drone / Satellite Video" lead="Location, coordinates, route, shot and camera live in Assistant. Buy a one-time pack, then shoot there. Not a physical UAV flight." columns={2}>
    <article className="card"><h3>Shoot in Assistant</h3><p>Map, move, angle, voiceover and duration stay on the drone form in Assistant.</p><a className="cta" href="/dashboard/create?type=AI%20Video&category=video">Open Drone in Assistant</a></article>
    <article className="card"><h3>One-time packs</h3><p>{"Drone Location $299 \u00B7 2,600 credits. Satellite + Drone $699 \u00B7 6,800 credits. No monthly renewal."}</p><a className="ghost" href="/drone-credits">Buy drone pack</a></article>
  </DashboardEightShell>;
}
