import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { RequestsTable } from "@/components/RequestsTable";
import { SignOutButton } from "@/components/SignOutButton";
import { CreditBalanceCard } from "@/components/CreditBalanceCard";
import { dashboardNextBestActions } from "@/lib/retention-growth";

const dashboardConversionShortcuts = [
  { title: "I need the cheapest safe test", text: "Use the free ad score first, then start the free 24-hour Business trial if the hook is strong enough.", href: "/free-tools/ad-performance-score-checker", cta: "Score ad free" },
  { title: "I am ready to test one brand", text: "Open the Business preview path for 12,000 credits and one focused ecommerce production test.", href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000", cta: "Start Business preview" },
  { title: "I need agency-scale output", text: "Open the Team Annual preview path for 174,000 credits, 12 simultaneous tasks and bulk client/product workflows.", href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000", cta: "Start Team preview" }
];

const workflowStarters = [
  ["Website builder", "AI Website Builder", "Plan a landing page, business site, SaaS page or full website package with source files, README, setup guide and ZIP handoff.", "/ai-website-builder", "Open website builder"],
  ["App builder", "AI App Builder", "Start a mobile app, web app, admin panel or SaaS launch plan with modules, screens, source package and delivery tracking.", "/ai-app-builder", "Open app builder"],
  ["Commerce builder", "AI Ecommerce Builder", "Create store pages, product ad kits, product descriptions, offer assets, checkout notes and e-commerce delivery files.", "/ai-ecommerce-builder", "Open ecommerce builder"],
  ["Video generator", "AI Video Generator", "Prepare short videos, product clips, multi-format exports, captions, ratios, thumbnail notes and provider-ready video jobs.", "/ai-video-generator", "Open video generator"],
  ["Live sales", "Live Sales Control Center", "Start or stop avatar live sales sessions, select extra setup features, and track remaining fair-use live hours.", "/dashboard/live-sales-agent", "Open live control"],
  ["Drone shoot", "Drone Shoot Panel", "Prepare the purchased drone package with location, route, map area, camera movement and start the drone production request.", "/dashboard/drone-shoot", "Open drone shoot"],
  ["Social media", "AI Social Media AI", "Build social posts, captions, short-video plans, campaign angles, platform export notes and share-ready delivery packages.", "/ai-social-media-ai", "Open social media AI"],
  ["Export pack", "Social Media Export Pack", "Prepare platform-ready captions, hashtags, cover text, CTA notes and manual publishing guardrails.", "/dashboard/social-export", "Open export pack"],
  ["Shorts growth", "TikTok / YouTube Shorts Growth", "Use proof clips, free tool hooks and founder posts as the safe organic short-form launch system.", "/dashboard/shorts-growth", "Open shorts plan"],
  ["Share loop", "Viral Share-to-Earn", "Review manual reward rules for approved shares, invites, case studies and paid referral activation.", "/dashboard/share-to-earn", "Open share loop"],
  ["Brand kit", "AI Brand Kit Builder", "Prepare brand voice, visual direction, content kit, reusable assets and dashboard delivery notes for a launch package.", "/dashboard/brand-kit", "Open brand kit"],
  ["Bulk tools", "AI Bulk Content Builder", "Plan batch content, CSV-driven production, multi-item exports and post-launch bulk automation preparation.", "/dashboard/bulk", "Open bulk builder"],
  ["Voice / dubbing", "AI Dubbing & Voice", "Prepare voiceover, dubbing, localization notes and audio-ready delivery workflows for managed production handoff.", "/dashboard/dubbing", "Open dubbing"],
  ["Ads planning", "AI Ads Planner", "Prepare paid ad campaign structure, ROAS notes, creative angles and post-launch ad workflow planning.", "/dashboard/ads", "Open ads planner"],
  ["Custom agents", "Custom Agents", "Prepare reusable brand, ecommerce, live sales and growth intelligence agents without unsafe autonomous actions.", "/dashboard/custom-agents", "Open agents"],
  ["Premium expansion", "Localization / Competitor Analyzer", "Open premium localization, competitor ad analysis and global growth intelligence modules with safety rules.", "/dashboard/premium-expansion", "Open premium modules"],
  ["Connections", "AI Channel Connections", "Prepare Meta, TikTok, Shopify, Amazon, Trendyol and store connection targets for export and campaign handoff.", "/dashboard/connections", "Open connections"],
  ["Growth", "AI Growth Rewards", "Review share-to-earn, referral prep, watermark rules and organic growth loops for launch readiness.", "/dashboard/growth", "Open growth"],
  ["Partners", "Partner Program", "Prepare referral links, creator assets, commission review and partner rewards from one dashboard area.", "/dashboard/partners", "Open partners"],
  ["Delivery center", "Production Delivery Center", "Open all production requests, delivery statuses, preview links, source packages, README files and revision paths.", "/dashboard/productions", "Open deliveries"],
  ["Credits", "Credits & Billing", "Check credit balance, top-up flow, billing status and payment readiness before live production spend.", "/dashboard/credits", "Open credits"],
  ["Billing", "Billing & Account Help", "Open credit packages, payment confirmation guidance, cancellation help and account support from the dashboard billing flow.", "/dashboard/billing", "Open billing"],
  ["Provider test", "Provider Smoke Test", "Run a controlled 10-second / 1080p provider smoke test before committing to a full production.", "/dashboard/assistant-workspace?providerTest=1", "Run smoke test"]
] as const;

export default function DashboardPage() {
  const vipAgencyHubUrl = process.env.NEXT_PUBLIC_VIP_AGENCY_HUB_URL?.trim();
  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 20 }}><div><h1 style={{ margin: 0 }}>Dashboard</h1><p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Production planning, live stage tracking, dashboard delivery and post-launch social/e-commerce export preparation.</p></div><SignOutButton /></div>
      <div className="kpi"><CreditBalanceCard /><div className="card"><span>Next step</span><strong>Brief</strong><p>Start one focused request before provider work begins.</p></div><div className="card"><span>Safety check</span><strong>Confirm</strong><p>Review scope and credit reserve before production starts.</p></div><div className="card"><span>Delivery</span><strong>Files</strong><p>Track previews, source packages, README notes and final outputs.</p></div></div>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Conversion shortcuts</span><h2>Choose the next action without searching the dashboard</h2><p style={{ color: "var(--muted)" }}>These three paths match the main launch funnel: free score, Business preview or Team Annual preview.</p><div className="admin-category-grid" style={{ marginTop: 16 }}>{dashboardConversionShortcuts.map((item) => <Link className="card admin-category-card" href={item.href} key={item.title}><h3>{item.title}</h3><p>{item.text}</p><span className="text-link">{item.cta}</span></Link>)}</div></section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">VIP Agency Hub</span><h2>Get first-video feedback and prompt tips after preview checkout</h2><p style={{ color: "var(--muted)" }}>Preview buyers can use the private agency hub for ecommerce ad examples, prompt direction, launch notes and first-output optimization. If the hub URL is not configured yet, request an invite from support.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>{vipAgencyHubUrl ? <a className="btn" href={vipAgencyHubUrl} target="_blank" rel="noreferrer">Open VIP Agency Hub</a> : <Link className="btn" href="/dashboard/contact">Request invite</Link>}<Link className="btn secondary" href="/community-showcase">View community showcase</Link><Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Score an ad first</Link></div></section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Viral credits</span><h2>Need more credits? Invite a friend.</h2><p style={{ color: "var(--muted)" }}>Bring another ecommerce seller or agency owner to Crelavo. Planned launch reward: +100 credits for both verified users, then +2,000 bonus credits for you when the invited user becomes a paid Business or Team subscriber. Rewards stay manually reviewed until automated anti-abuse checks are connected.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}><Link className="btn" href="/dashboard/share-to-earn">Open share-to-earn</Link><Link className="btn secondary" href="/dashboard/credits">View credit rewards</Link><Link className="btn secondary" href="/dashboard/partners">Partner area</Link></div></section>
      <section className="card" style={{ marginTop: 20 }}><span className="badge">Next best actions</span><h2>Keep building from where users usually drop off</h2><div className="admin-info-grid">{dashboardNextBestActions.map((action) => <div key={action.href}><span>{action.reason}</span><strong>{action.label}</strong><small><Link href={action.href}>{action.href}</Link></small></div>)}</div></section>
      <section className="dashboard-workflow-starters" style={{ marginTop: 20 }}><div className="sample-video-head"><div><span className="badge">AI builder launchpad</span><h2>Choose the AI builder you want to open</h2><p className="section-lead">Website, app, ecommerce, video, social media, brand kit, bulk content, dubbing and provider smoke-test flows all open their own ready-start path.</p></div><Link className="btn secondary" href="/dashboard/productions">View productions</Link></div><div className="dashboard-workflow-grid">{workflowStarters.map(([badge, title, text, href, cta]) => <Link className="card clickable-credit-card dashboard-workflow-card" href={href} key={title}><span className="badge">{badge}</span><h3>{title}</h3><p>{text}</p><span className="btn">{cta}</span></Link>)}</div></section>
      <div className="card" style={{ marginTop: 20 }}><h2>Recent video requests</h2><RequestsTable /><div style={{ marginTop: 18 }}><Link className="btn" href="/dashboard/create">Start live production</Link></div></div>
    </DashboardShell>
  );
}
