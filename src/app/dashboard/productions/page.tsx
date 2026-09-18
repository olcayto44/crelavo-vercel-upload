const CDP_CSS = `
#cdp{max-width:1120px;margin:0 auto;padding:28px 20px 64px;color:#e2e8f0;font-family:Inter,system-ui,sans-serif}
#cdp .pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 28px}
#cdp .pills a{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.06);color:#e2e8f0;text-decoration:none;font-size:14px;line-height:1.2}
#cdp .pills a.is-active{background:#22d3ee;color:#0b1220;font-weight:600}
#cdp .hero{margin:0 0 24px}
#cdp .badge{display:inline-flex;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);font-size:12px}
#cdp h1{margin:12px 0 8px;font-size:40px;line-height:1.1;color:#fff}
#cdp .hero p{margin:0;max-width:640px;color:#94a3b8}
#cdp .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
#cdp .card{background:rgba(2,6,23,.72);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px}
#cdp .card h2{margin:0 0 6px;font-size:18px;color:#fff}
#cdp .card p{margin:0 0 16px;color:#94a3b8;font-size:14px}
#cdp .btn-primary,#cdp .btn-outline{display:flex;align-items:center;justify-content:center;height:48px;border-radius:999px;text-decoration:none;font-weight:600}
#cdp .btn-primary{background:linear-gradient(90deg,#22d3ee,#38bdf8);color:#0b1220}
#cdp .btn-outline{border:1px solid rgba(255,255,255,.16);color:#e2e8f0}
@media (max-width:720px){#cdp .grid{grid-template-columns:1fr}#cdp h1{font-size:32px}}
`;

export default function MyProductionsPage() {
  return (
    <main className="container section dashboard-shell-layout dashboard-postlaunch-shell">
      <style>{CDP_CSS}</style>
      <div id="cdp">
        <nav className="pills" aria-label="Dashboard">
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/credits">Credits</a>
          <a href="/dashboard/billing">Billing</a>
          <a className="is-active" href="/dashboard/productions">Productions</a>
          <a href="/dashboard/create?type=AI%20Video&category=video">Assistant</a>
          <a href="/growth-intelligence">Growth Intelligence</a>
          <a href="/dashboard/partners">Partners</a>
          <a href="/pricing">Pricing</a>
        </nav>

        <div className="hero">
          <span className="badge">My Productions</span>
          <h1>Production command center</h1>
          <p>Track active jobs, waiting decisions, preview-ready outputs and final deliveries from one clean production hub.</p>
        </div>

        <div className="grid">
          <article className="card">
            <h2>Start production</h2>
            <p>Open the filled AI Video assistant. Type and category stay selected.</p>
            <a className="btn-primary" href="/dashboard/create?type=AI%20Video&category=video">Start production</a>
          </article>
          <article className="card">
            <h2>Your jobs</h2>
            <p>Sign in to view your productions.</p>
            <a className="btn-outline" href="/?auth=login">Sign in</a>
          </article>
          <article className="card">
            <h2>Studio</h2>
            <p>Credits, billing and partners stay on the main dashboard.</p>
            <a className="btn-outline" href="/dashboard">Open dashboard</a>
          </article>
          <article className="card">
            <h2>Credits</h2>
            <p>Plans and one-time packs.</p>
            <a className="btn-outline" href="/dashboard/credits">View credits</a>
          </article>
        </div>
      </div>
    </main>
  );
}
