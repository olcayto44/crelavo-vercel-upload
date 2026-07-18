import Link from "next/link";
import { Header } from "@/components/Header";
import { PageDemoVideoSection, pickPageDemoVideo } from "@/components/PageDemoVideoSection";
import { growthIntelligencePlans } from "@/lib/data";
import { getConfiguredSampleVideos } from "@/lib/sample-video-config";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { hasWhopPlan } from "@/lib/whop";

export const metadata = {
  title: "AI Growth Intelligence Agent | Crelavo",
  description: "Monitor competitors, price changes, public ads, landing pages and market signals with an autonomous AI growth intelligence agent and weekly executive PDF reports."
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

const workflowSteps = [
  { title: "Add competitors", body: "Enter your own website, competitor URLs, public ad library links, product pages and target market notes." },
  { title: "n8n monitors public signals", body: "The workflow checks public pricing pages, landing pages, public ad libraries and review sources on a schedule, then stores change events for review." },
  { title: "AI creates the strategy report", body: "Claude/OpenAI-style reasoning turns raw signals into a weekly executive PDF with risks, opportunities and lawful market response recommendations." },
  { title: "Launch the response inside Crelavo", body: "Use the report to brief ad videos, landing pages, product campaigns, social post packs or email campaign ideas inside Crelavo." }
];

const automationArchitecture = [
  {
    title: "n8n data collection agent",
    body: "Scheduled n8n workflows can use HTTP Request, approved scraper nodes and platform-provided APIs to monitor only publicly available pages, pricing tables, landing pages, source-code changes visible to any visitor and public ad library entries."
  },
  {
    title: "Strategic AI analysis bridge",
    body: "Collected changes are packaged for Claude 3.5 Sonnet, OpenAI o3-style reasoning or another approved LLM to summarize what changed, why it matters and which lawful growth actions the customer can consider."
  },
  {
    title: "Report packaging and delivery",
    body: "n8n can convert the AI analysis into a branded Weekly Intelligence Report PDF, send it by email and trigger critical Slack, Telegram or SMS alerts when public pricing, offer or availability signals change."
  }
];

const complianceSafeguards = [
  "This platform analyzes only publicly available data for market research purposes. It does not perform cyber attacks, credential abuse, unauthorized access, hidden data extraction or confidential data breaches.",
  "Customers are responsible for using competitor information in compliance with applicable competition, privacy, advertising, data protection and platform terms of service rules in their markets.",
  "Monitoring must not bypass logins, paywalls, captchas, rate limits, robots restrictions, private APIs or any technical access control.",
  "Reports are business intelligence outputs, not legal advice. Customers should consult qualified counsel before using insights for regulated, sensitive or high-risk competitive actions.",
  "Recommended actions should focus on lawful market responses such as pricing review, campaign positioning, landing page improvements, retention offers and customer communication."
];

const intelligenceSignals = [
  "Public competitor website and pricing changes",
  "Landing page and offer message changes",
  "Public ad library creative and copy signals",
  "Review, complaint and reputation trend summaries",
  "Weekly executive PDF report and action plan",
  "Optional Slack/email opportunity alerts on higher plans"
];

export default async function GrowthIntelligencePage() {
  const [siteContent, sampleVideos] = await Promise.all([
    getConfiguredSiteContentConfig(),
    getConfiguredSampleVideos()
  ]);
  const growthDemo = pickPageDemoVideo(sampleVideos, ["growth-intelligence-page-demo", "growth_intelligence", "competitor intelligence", "market intelligence"]);

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page">
        <section className="promo-top-layout">
          <div>
            <span className="badge">AI Growth Intelligence</span>
            <h1>Autonomous competitor and market intelligence agent</h1>
            <p className="section-lead">
              Monitor competitors, price changes, public ad signals, landing page updates and customer complaint trends. Every week, eligible users receive an executive strategy report as a dashboard PDF/file that explains what changed and what to do next.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <Link className="btn" href="/auth/register?next=%2Fgrowth-intelligence">View intelligence plans</Link>
              <Link className="btn secondary" href="/dashboard/growth-intelligence">Prepare intelligence brief</Link>
            </div>
          </div>
          <div className="card selected-billing-card">
            <span className="badge">Service subscription</span>
            <h3>Not a credit top-up</h3>
            <p>Growth Intelligence is a monthly monitoring and reporting service. It does not add normal production credits; it creates recurring competitor intelligence and delivers the finished report as a dashboard PDF/file for users with active entitlement or enough credits.</p>
          </div>
        </section>

        <PageDemoVideoSection
          sample={growthDemo}
          badge="Growth Intelligence demo video"
          title="Competitor intelligence workflow preview"
          description="Use this area to show how a company enters competitor URLs, the agents monitor public signals, the AI creates a strategy PDF and the user launches response campaigns from Crelavo."
          fallbackFeatures={["Competitor URL monitoring", "Public ad signal tracking", "Price and offer change detection", "Weekly CEO PDF report", "Crelavo campaign response actions"]}
          ctaHref="/auth/register?next=%2Fgrowth-intelligence"
          ctaLabel="View plans"
          secondaryHref="/dashboard/growth-intelligence"
          secondaryLabel="Prepare intelligence brief"
          adminHint="Admin setup: open /admin/sample-videos and create or edit a sample with category growth_intelligence or id growth-intelligence-page-demo. Add Video URL and Thumbnail URL there."
        />

        <section style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">How it works</span>
              <h2>From market monitoring to campaign action</h2>
              <p className="section-lead">This workflow is not video generation. It is an autonomous service workflow: collect public signals, analyze them, deliver a gated dashboard PDF/file report and turn insights into Crelavo production actions.</p>
            </div>
          </div>
          <div className="admin-info-grid">
            {workflowSteps.map((step, index) => (
              <div key={step.title}>
                <span>Step {index + 1}</span>
                <strong>{step.title}</strong>
                <small>{step.body}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Monitored signals</span>
          <h2>What the intelligence agent watches</h2>
          <div className="plan-feature-groups">
            <div>
              <b>Public market signals</b>
              {intelligenceSignals.map((item) => <small key={item}>{item}</small>)}
            </div>
          </div>
          <p style={{ color: "var(--muted)" }}>The system should monitor public sources only. It should not bypass logins, captchas, private data, platform restrictions or confidential competitor systems.</p>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">Automation architecture</span>
              <h2>n8n collection, AI analysis and executive delivery</h2>
              <p className="section-lead">The production version can connect n8n, public data sources, LLM analysis and automated report delivery without crossing into unauthorized access or hidden data extraction.</p>
            </div>
          </div>
          <div className="admin-info-grid">
            {automationArchitecture.map((step, index) => (
              <div key={step.title}>
                <span>Automation step {index + 1}</span>
                <strong>{step.title}</strong>
                <small>{step.body}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Legal and responsible use</span>
          <h2>Public-data-only market research policy</h2>
          <p className="section-lead">Growth Intelligence is designed for lawful market research and executive decision support, not unauthorized access, cyber activity or confidential data collection.</p>
          <div className="plan-feature-groups">
            <div>
              <b>Compliance safeguards</b>
              {complianceSafeguards.map((item) => <small key={item}>{item}</small>)}
            </div>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Affiliate opportunity</span>
          <h2>Growth Intelligence is a strong recurring partner offer</h2>
          <p className="section-lead">Creators, agencies and consultants can promote this service as a higher-ticket monthly plan. At a 35% draft commission, one active $499/mo Growth Intelligence customer could represent about $174.65/mo in estimated partner commission before final payout rules.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="btn" href="/affiliate">Open affiliate program</Link>
            <Link className="btn secondary" href="/dashboard/partners">View partner dashboard</Link>
          </div>
        </section>

        <section id="growth-plans" style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">Choose a plan</span>
              <h2>Growth Intelligence subscription plans</h2>
              <p className="section-lead">Monthly service plans for competitor monitoring, market signal summaries and executive PDF reports.</p>
            </div>
          </div>
          <div className="production-pricing-grid">
            {growthIntelligencePlans.map((plan) => (
              <div className="card clickable-credit-card credit-sale-card" key={plan.id}>
                <span className="badge">{plan.competitorLimit}</span>
                <h3>{plan.name}</h3>
                <strong style={{ fontSize: 30 }}>{plan.price}</strong>
                <p><strong>Yearly: {formatUsd(plan.priceUsd * 10)}/yr</strong> · 2 months free</p>
                {"setupFeeUsd" in plan ? <p><strong>Start 24-Hour Preview — {formatUsd(Number(plan.setupFeeUsd))}</strong> non-refundable setup fee today. Includes one 10-second watermarked preview; downloads stay closed during preview.</p> : null}
                <p><strong>{plan.monitoringFrequency}</strong></p>
                <p>{plan.description}</p>
                <div className="plan-feature-groups">
                  <div>
                    <b>Included intelligence scope</b>
                    {plan.usage.map((item) => <small key={item}>{item}</small>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <Link className="btn" href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=monthly`}>Start monthly preview</Link>
                  {hasWhopPlan(plan.id, "yearly") ? <Link className="btn secondary" href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=yearly`}>Start yearly preview</Link> : <span className="workspace-action-note warning">Yearly checkout is not active for this plan yet.</span>}
                  <Link className="btn secondary" href="/dashboard/growth-intelligence">Prepare brief</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
