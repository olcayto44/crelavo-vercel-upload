"use client";

import { useState } from "react";

type Cycle = "monthly" | "annual";
type Plan = {
  name: string; pill: string; monthlyPrice: string; annualPrice?: string; period?: string;
  monthlyPlan: string; annualPlan?: string; preview?: string; save?: string;
  features: string[]; popular?: boolean; cta: string; oneTime?: boolean;
};

const checkoutBase = "https://crelavo.whop.site/checkout/";

const creditPlans: Plan[] = [
  { name: "Pro Credits", pill: "2,500 credits / mo", monthlyPrice: "$29", annualPrice: "$290", period: "/mo", monthlyPlan: "plan_ECfkkMySZHtIZ", annualPlan: "plan_A9zegHpbjxAfO", preview: "$5", save: "Save $58 vs monthly", cta: "Start preview", features: ["Monthly credit refill", "Studio production", "Dashboard delivery", "Cancel anytime in Whop"] },
  { name: "Business Credits", pill: "9,000 credits / mo", monthlyPrice: "$59", annualPrice: "$590", period: "/mo", monthlyPlan: "plan_DTxjYMeiRPBWz", annualPlan: "plan_R3OSfDLVHI9zi", preview: "$10", save: "Save $118 vs monthly", cta: "Start preview", popular: true, features: ["Monthly credit refill", "Higher production volume", "Dashboard delivery", "Cancel anytime in Whop"] },
  { name: "Team Credits", pill: "12,000 credits / seat", monthlyPrice: "$130", annualPrice: "$1,300", period: "/mo", monthlyPlan: "plan_rkeOQU3gjmujh", annualPlan: "plan_jSBaM1LgMuaNL", preview: "$20", save: "Save $260 vs monthly", cta: "Start preview", features: ["Per-seat monthly refill", "Team production volume", "Dashboard delivery", "Cancel anytime in Whop"] },
  { name: "Ultra Credits", pill: "25,000 credits / mo", monthlyPrice: "$199", annualPrice: "$1,990", period: "/mo", monthlyPlan: "plan_UtIprGEXNEooK", annualPlan: "plan_apVKry7XkvOky", preview: "$15", save: "Save $398 vs monthly", cta: "Start preview", features: ["Highest monthly refill", "Heavy production volume", "Dashboard delivery", "Cancel anytime in Whop"] }
];

const packPlans: Plan[] = [
  { name: "Starter Pack", pill: "800 credits", monthlyPrice: "$10", monthlyPlan: "plan_kmGVCrQu90NBV", cta: "Buy pack", oneTime: true, features: ["800 credits after payment", "Studio production", "Dashboard delivery"] },
  { name: "Creator Pack", pill: "2,500 credits", monthlyPrice: "$25", monthlyPlan: "plan_Q0fJdHNnKGPd6", cta: "Buy pack", oneTime: true, features: ["2,500 credits after payment", "Studio production", "Dashboard delivery"] },
  { name: "Business Pack", pill: "7,000 credits", monthlyPrice: "$60", monthlyPlan: "plan_kkn9PeDilHc1q", cta: "Buy pack", oneTime: true, features: ["7,000 credits after payment", "Studio production", "Dashboard delivery"] }
];

const dronePlans: Plan[] = [
  { name: "Drone Location Video", pill: "2,600 credits", monthlyPrice: "$299", monthlyPlan: "plan_Sm0chNhnmVKBG", cta: "Checkout", oneTime: true, features: ["Location / coordinates", "Route / path plan", "Aerial scene direction", "Dashboard delivery"] },
  { name: "Satellite + Drone Story", pill: "6,800 credits", monthlyPrice: "$699", monthlyPlan: "plan_ENiXR71BMaqB2", cta: "Checkout", oneTime: true, features: ["Marked map / satellite area", "Satellite-view intro", "Flyover + landmark reveal", "Final delivery package"] }
];

const livePlans: Plan[] = [
  { name: "Starter Live Sales Agent", pill: "10h / month", monthlyPrice: "$249", annualPrice: "$2,490", period: "/mo", monthlyPlan: "plan_sw8N3lkTKH1N0", annualPlan: "plan_vDBBqvR8dpO9f", preview: "$25", save: "Save $498 vs monthly", cta: "Checkout", popular: true, features: ["1 live platform", "10h fair-use live hours", "Avatar host persona", "Voice / language setup"] },
  { name: "Pro Live Commerce Agent", pill: "40h / month", monthlyPrice: "$799", period: "/mo", monthlyPlan: "plan_7xBXQaBb9w0tw", preview: "$79", cta: "Checkout", features: ["Up to 3 live platforms", "40h fair-use live hours", "Voice / avatar direction", "Multilingual live prompts"] },
  { name: "Agency Autonomous Brand Agent", pill: "120h / month", monthlyPrice: "$2,499", period: "/mo", monthlyPlan: "plan_G2ZGmpykTfRIE", preview: "$119", cta: "Checkout", features: ["White-label brand agent", "120h fair-use live hours", "Catalog and FAQ logic", "Human fallback policy"] }
];

const growthPlans: Plan[] = [
  { name: "Starter Intelligence Agent", pill: "1 competitor", monthlyPrice: "$179", annualPrice: "$1,790", period: "/mo", monthlyPlan: "plan_FlOEa6urAuKEx", annualPlan: "plan_5l0pLPgYyV1Zu", preview: "$15", save: "Save $358 vs monthly", cta: "Start monthly preview", features: ["Weekly public web checks", "Basic ad / message review", "Weekly PDF report", "Dashboard file delivery"] },
  { name: "Growth Intelligence Agent", pill: "Up to 3 competitors", monthlyPrice: "$499", period: "/mo", monthlyPlan: "plan_BCGKWVCrRakWc", preview: "$29", cta: "Start monthly preview", popular: true, features: ["Daily price / page monitoring", "Public ad and landing signals", "Weekly CEO intelligence PDF", "Recommended campaign actions"] },
  { name: "Enterprise Intelligence Agent", pill: "5–10 competitors", monthlyPrice: "$1,999", period: "/mo", monthlyPlan: "plan_ZnbxWuOwrrFwh", preview: "$79", cta: "Start monthly preview", features: ["Hourly critical-page checks", "Slack / email opportunity alerts", "Executive PDF strategy report", "Agency / client workspace ready"] }
];

function PlanCard({ plan, cycle }: { plan: Plan; cycle: Cycle }) {
  const annualActive = cycle === "annual" && Boolean(plan.annualPlan) && !plan.oneTime;
  const unavailableAnnual = cycle === "annual" && !plan.annualPlan && !plan.oneTime;
  const planId = annualActive ? plan.annualPlan! : plan.monthlyPlan;
  const price = annualActive ? plan.annualPrice : plan.monthlyPrice;
  const cta = annualActive && plan.name.includes("Intelligence") ? "Start yearly preview" : plan.cta;
  return <article className={`clp-card${plan.popular ? " is-popular" : ""}`}>
    {plan.popular ? <span className="clp-pop">Popular</span> : null}
    <span className="clp-pill">{plan.pill}</span>
    <h3>{plan.name}</h3>
    <div className="clp-price"><b>{price}</b><span>{annualActive ? "/yr" : plan.period ?? ""}</span></div>
    <p className="clp-note">{plan.oneTime ? "One-time · no renewal" : `24h preview · ${plan.preview} today`}</p>
    {annualActive && plan.save ? <p className="clp-save">{plan.save}</p> : null}
    {unavailableAnnual ? <p className="clp-only">Yearly checkout is not active for this plan yet.</p> : null}
    <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
    <a className={`clp-cta${plan.popular || plan.oneTime ? " fill" : ""}`} href={`${checkoutBase}${planId}`}>{cta}</a>
  </article>;
}

function PlanSection({ id, title, subtitle, plans, columns, cycle }: { id: string; title: string; subtitle: string; plans: Plan[]; columns: 2 | 3 | 4; cycle: Cycle }) {
  return <section className="clp-sec" id={id}>
    <h2>{title}</h2><p className="clp-sub">{subtitle}</p>
    <div className={`clp-grid clp-${columns}`}>{plans.map((plan) => <PlanCard key={plan.name} plan={plan} cycle={cycle} />)}</div>
  </section>;
}

export function PricingPageBody() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  return <section id="clp" className="clp">
    <style>{`
      #clp.clp{--line:rgba(255,255,255,.08);--muted:#9aa8c0;--text:#f8fbff;--cyan:#22d3ee;color:var(--text);font-family:Inter,system-ui,sans-serif;max-width:1180px;margin:0 auto;padding:28px 20px 80px}
      #clp *{box-sizing:border-box} #clp a{text-decoration:none}.clp-hero{padding:12px 0 8px}.clp-kicker{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:#c9d6ea;font-size:12px;font-weight:600}.clp-hero h1{margin:14px 0 10px;font-size:clamp(32px,5vw,52px);line-height:1.08;letter-spacing:-.03em}.clp-lead{margin:0;max-width:640px;color:var(--muted);font-size:16px;line-height:1.55}.clp-jump{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 18px}.clp-jump a{color:#d7e3f5;border:1px solid var(--line);background:rgba(255,255,255,.03);border-radius:999px;padding:8px 12px;font-size:13px}.clp-toggle-wrap{display:flex;justify-content:center;margin:8px 0 28px}.clp-toggle{display:inline-flex;padding:4px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--line)}.clp-toggle button{border:0;background:transparent;color:#c9d6ea;font:inherit;font-weight:650;font-size:14px;padding:8px 18px;border-radius:999px;cursor:pointer}.clp-toggle button[aria-pressed=true]{background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032}.clp-sec{margin:56px 0 0}.clp-sec h2{margin:0 0 6px;font-size:28px;letter-spacing:-.02em}.clp-sub{margin:0 0 22px;color:var(--muted);font-size:14px}.clp-grid{display:grid;gap:16px}.clp-4{grid-template-columns:repeat(4,minmax(0,1fr))}.clp-3{grid-template-columns:repeat(3,minmax(0,1fr))}.clp-2{grid-template-columns:repeat(2,minmax(0,1fr))}.clp-card{position:relative;display:flex;flex-direction:column;min-height:100%;padding:22px 20px 20px;border-radius:20px;background:linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.94));border:1px solid var(--line)}.clp-card.is-popular{border-color:rgba(34,211,238,.45);box-shadow:0 0 0 1px rgba(34,211,238,.18),0 18px 50px rgba(14,165,233,.12)}.clp-pop{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#eab308;color:#1a1403;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px}.clp-pill{display:inline-flex;align-items:center;width:max-content;height:24px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.06);color:#cfe0f5;font-size:12px;font-weight:600;margin-bottom:12px}.clp-card h3{margin:0 0 8px;font-size:18px}.clp-price{display:flex;align-items:baseline;gap:4px;margin:0 0 6px}.clp-price b{font-size:36px;letter-spacing:-.03em;line-height:1}.clp-price span,.clp-note,.clp-only{color:var(--muted);font-size:13px}.clp-note,.clp-save,.clp-only{margin:0 0 14px}.clp-save{color:#7dd3fc;font-size:13px}.clp-card ul{margin:0 0 18px;padding:0 0 0 18px;color:#c5d2e6;font-size:13px;line-height:1.55;flex:1}.clp-card li{margin:0 0 6px}.clp-cta{display:flex;align-items:center;justify-content:center;height:44px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid rgba(34,211,238,.45);color:#d7fbff}.clp-cta.fill{border:0;background:linear-gradient(90deg,#38bdf8,#22d3ee);color:#082032}@media(max-width:1100px){.clp-4{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.clp-4,.clp-3,.clp-2{grid-template-columns:1fr}.clp-hero h1{font-size:32px}}
    `}</style>
    <header className="clp-hero"><span className="clp-kicker">All plans</span><h1>Pricing for production, live sales and intelligence</h1><p className="clp-lead">Credit subscriptions, one-time packs, drone, live-sales hours and growth intelligence on one page. Subscriptions start with a 24-hour preview.</p><nav className="clp-jump" aria-label="Pricing sections"><a href="#clp-credits">Credits</a><a href="#clp-packs">One-time packs</a><a href="#clp-drone">Drone</a><a href="#clp-live">Live sales</a><a href="#clp-growth">Growth intelligence</a></nav></header>
    <div className="clp-toggle-wrap"><div className="clp-toggle" role="group" aria-label="Billing cycle"><button type="button" onClick={() => setCycle("monthly")} aria-pressed={cycle === "monthly"}>Monthly</button><button type="button" onClick={() => setCycle("annual")} aria-pressed={cycle === "annual"}>Annual</button></div></div>
    <PlanSection id="clp-credits" title="Production credits" subtitle="Monthly refill. 24-hour preview today, then the listed price unless cancelled." plans={creditPlans} columns={4} cycle={cycle} />
    <PlanSection id="clp-packs" title="One-time credit packs" subtitle="Credits added after payment. Does not renew." plans={packPlans} columns={3} cycle={cycle} />
    <PlanSection id="clp-drone" title="Drone / Satellite" subtitle="One-time packs. Credits are added after payment confirmation." plans={dronePlans} columns={2} cycle={cycle} />
    <PlanSection id="clp-live" title="Live Sales Agents" subtitle="Service hours — not production credits. 24-hour preview, then monthly. Extra provider/API usage is billed separately." plans={livePlans} columns={3} cycle={cycle} />
    <PlanSection id="clp-growth" title="Growth Intelligence" subtitle="Monthly monitoring service — not a credit top-up. Public-data competitor reports as dashboard PDFs." plans={growthPlans} columns={3} cycle={cycle} />
  </section>;
}
