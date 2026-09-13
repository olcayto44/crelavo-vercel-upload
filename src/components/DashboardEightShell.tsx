import type { ReactNode } from "react";

const dashEightCss = "/* CL-DASH 8 */\nbody:has(#cld8) aside.dashboard-sidebar-card,\nbody:has(#cld8) nav.dashboard-topbar{display:none!important}\nbody:has(#cld8) main.dashboard-shell-layout{display:block!important;grid-template-columns:none!important}\n#cld8{width:100%;--line:rgba(255,255,255,.08);--muted:#9aa8c0;--text:#f8fbff;color:var(--text);font-family:Inter,system-ui,sans-serif;max-width:1180px;margin:0 auto;padding:24px 20px 72px}\n#cld8 *{box-sizing:border-box}#cld8 a{text-decoration:none}\n#cld8 .path{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}\n#cld8 .path a{color:#d7e3f5;border:1px solid var(--line);background:rgba(255,255,255,.03);border-radius:999px;padding:8px 12px;font:650 13px Inter,sans-serif}\n#cld8 .path a.on{background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032;border:0}\n#cld8 .kicker{display:inline-flex;height:28px;align-items:center;padding:0 12px;border-radius:999px;border:1px solid var(--line);color:#c9d6ea;font:600 12px Inter,sans-serif}\n#cld8 h1{margin:12px 0 8px;font-size:clamp(28px,4vw,44px);letter-spacing:-.03em}\n#cld8 .lead{margin:0 0 22px;max-width:640px;color:var(--muted);font-size:15px;line-height:1.55}\n#cld8 .grid{display:grid;gap:14px}#cld8 .g2{grid-template-columns:repeat(2,minmax(0,1fr))}#cld8 .g3{grid-template-columns:repeat(3,minmax(0,1fr))}\n#cld8 .card{padding:20px;border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.94));border:1px solid var(--line);display:flex;flex-direction:column}\n#cld8 .card h3{margin:0 0 6px;font-size:18px}#cld8 .card p{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.5}\n#cld8 .cta,#cld8 .ghost{display:flex;align-items:center;justify-content:center;height:42px;border-radius:999px;font:700 14px Inter,sans-serif;margin-top:auto}\n#cld8 .cta{background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032}\n#cld8 .ghost{border:1px solid rgba(34,211,238,.45);color:#d7fbff}\n@media(max-width:900px){#cld8 .g2,#cld8 .g3{grid-template-columns:1fr}}";

const tools = [
  ["Drone", "/dashboard/drone-shoot", "drone"],
  ["GI", "/dashboard/growth-intelligence", "gi"],
  ["Growth", "/dashboard/growth", "growth"],
  ["Share", "/dashboard/share-to-earn", "share"],
  ["Export", "/dashboard/social-export", "export"],
  ["Shorts", "/dashboard/shorts-growth", "shorts"],
  ["Ads", "/dashboard/ads", "ads"],
  ["Premium", "/dashboard/premium-expansion", "premium"]
] as const;

type DashboardEightShellProps = {
  active: typeof tools[number][2];
  kicker: string;
  title: string;
  lead: string;
  columns: 2 | 3;
  children: ReactNode;
  growthIntelligencePrimary?: boolean;
};

export function DashboardEightShell({ active, kicker, title, lead, columns, children, growthIntelligencePrimary = false }: DashboardEightShellProps) {
  return (
    <main className="container section dashboard-shell-layout">
      <style id="cl-dash8-css">{dashEightCss}</style>
      <div id="cld8">
        <nav className="path" aria-label="Studio">
          <a href="/dashboard">Overview</a><a href="/dashboard/credits">Credits</a><a href="/dashboard/billing">Billing</a><a href="/dashboard/productions">Productions</a><a href="/dashboard/assistant-workspace">Assistant</a><a className={growthIntelligencePrimary ? "on" : undefined} href="/growth-intelligence">Growth Intelligence</a><a href="/dashboard/partners">Partners</a><a href="/pricing">Pricing</a>
        </nav>
        <nav className="path" aria-label="Studio tools">
          {tools.map(([label, href, key]) => <a className={active === key ? "on" : undefined} href={href} key={key}>{label}</a>)}
        </nav>
        <span className="kicker">{kicker}</span>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <div className={"grid g" + columns}>{children}</div>
      </div>
    </main>
  );
}
