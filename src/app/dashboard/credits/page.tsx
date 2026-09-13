const CLW_CSS = "#clw{grid-column:1/-1;width:100%;--line:rgba(255,255,255,.08);--muted:#9aa8c0;--text:#f8fbff;--cyan:#22d3ee;color:var(--text);font-family:Inter,system-ui,sans-serif;max-width:1180px;margin:0 auto;padding:24px 20px 72px}\n#clw *{box-sizing:border-box}#clw a{text-decoration:none}\n#clw .path{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}\n#clw .path a{color:#d7e3f5;border:1px solid var(--line);background:rgba(255,255,255,.03);border-radius:999px;padding:8px 12px;font:650 13px Inter,sans-serif}\n#clw .path a.on{background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032;border:0}\n#clw .kicker{display:inline-flex;height:28px;align-items:center;padding:0 12px;border-radius:999px;border:1px solid var(--line);color:#c9d6ea;font:600 12px Inter,sans-serif}\n#clw h1{margin:12px 0 8px;font-size:clamp(28px,4vw,44px);letter-spacing:-.03em}\n#clw .lead{margin:0 0 22px;max-width:640px;color:var(--muted);font-size:15px;line-height:1.55}\n#clw .grid{display:grid;gap:14px}#clw .g2{grid-template-columns:repeat(2,minmax(0,1fr))}#clw .g3{grid-template-columns:repeat(3,minmax(0,1fr))}#clw .g4{grid-template-columns:repeat(4,minmax(0,1fr))}\n#clw .card{padding:20px;border-radius:18px;background:linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.94));border:1px solid var(--line);display:flex;flex-direction:column;min-height:100%}\n#clw .card h3{margin:0 0 6px;font-size:18px}#clw .card p,#clw .note{margin:0 0 12px;color:var(--muted);font-size:13px;line-height:1.5}\n#clw .price{font-size:32px;letter-spacing:-.03em;margin:0 0 8px}#clw .price span{font-size:14px;color:var(--muted);font-weight:600}\n#clw .cta,#clw .ghost{display:flex;align-items:center;justify-content:center;height:42px;border-radius:999px;font:700 14px Inter,sans-serif;margin-top:auto}\n#clw .cta{background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032}\n#clw .ghost{border:1px solid rgba(34,211,238,.45);color:#d7fbff}\n@media(max-width:900px){#clw .g2,#clw .g3,#clw .g4{grid-template-columns:1fr}}";

export default function CreditsPage() {
  return (
    <main className="container section dashboard-shell-layout">
      <style id="clw-css">{CLW_CSS}</style>
      <div id="clw">
        <nav className="path" aria-label="Studio">
          <a className="" href="/dashboard">Overview</a>
          <a className="on" href="/dashboard/credits">Credits</a>
          <a className="" href="/dashboard/billing">Billing</a>
          <a className="" href="/dashboard/productions">Productions</a>
          <a className="" href="/dashboard/assistant-workspace">Assistant</a>
          <a className="" href="/growth-intelligence">Growth Intelligence</a>
          <a className="" href="/dashboard/partners">Partners</a>
          <a className="" href="/pricing">Pricing</a>
        </nav>
        <span className="kicker">Credits</span>
        <h1>Credit plans</h1>
        <p className="lead">Card required. No charge until the preview ends. Download locks spend in the assistant. Live sales and drone stay on their own pages.</p>
        <div className="grid g2">
          <article className="card"><span className="kicker">INTRO</span><h3>Pro</h3><p className="price">$9.99 <span>/mo after 24h</span></p><p className="note">24-hour preview, then $9.99/month unless cancelled.</p><a className="cta" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Start Pro · $9.99/mo</a></article>
          <article className="card"><span className="kicker">2,500 / mo</span><h3>Pro Credits</h3><p className="price">$29 <span>/mo</span></p><p className="note">24h preview, then $29/month unless cancelled.</p><a className="cta" href="https://whop.com/checkout/plan_ECfkkMySZHtIZ">Start preview</a></article>
        </div>
        <div className="grid g3" style={{ marginTop: 14 }}>
          <article className="card"><span className="kicker">9,000 / mo</span><h3>Business</h3><p className="price">$59 <span>/mo</span></p><p className="note">24h preview, then $59/month unless cancelled.</p><a className="cta" href="https://whop.com/checkout/plan_DTxjYMeiRPBWz">Start preview</a></article>
          <article className="card"><span className="kicker">12,000 / seat</span><h3>Team</h3><p className="price">$130 <span>/mo</span></p><p className="note">24h preview, then $130/month unless cancelled.</p><a className="cta" href="https://whop.com/checkout/plan_rkeOQU3gjmujh">Start preview</a></article>
          <article className="card"><span className="kicker">25,000 / mo</span><h3>Ultra</h3><p className="price">$199 <span>/mo</span></p><p className="note">24h preview, then $199/month unless cancelled.</p><a className="cta" href="https://whop.com/checkout/plan_UtIprGEXNEooK">Start preview</a></article>
        </div>
        <h1 style={{ fontSize: 28, marginTop: 36 }}>One-time packs</h1>
        <p className="lead">Added after payment. Does not renew.</p>
        <div className="grid g3">
          <article className="card"><h3>Starter Pack</h3><p className="price">$10</p><p>800 credits</p><a className="cta" href="https://whop.com/checkout/plan_kmGVCrQu90NBV">Buy pack</a></article>
          <article className="card"><h3>Creator Pack</h3><p className="price">$25</p><p>2,500 credits</p><a className="cta" href="https://whop.com/checkout/plan_Q0fJdHNnKGPd6">Buy pack</a></article>
          <article className="card"><h3>Business Pack</h3><p className="price">$60</p><p>7,000 credits</p><a className="cta" href="https://whop.com/checkout/plan_kkn9PeDilHc1q">Buy pack</a></article>
        </div>
        <p className="note" style={{ marginTop: 18 }}><a href="/dashboard/billing">Billing</a> · <a href="/live-sales-credits">Live Sales</a> · <a href="/drone-credits">Drone</a> · Annual Pro · <a href="https://whop.com/checkout/plan_fiabRYr6uWY43">$99/yr</a></p>
      </div>
    </main>
  );
}
