import Link from "next/link";
import { Header } from "@/components/Header";
import { PageDemoVideoSection, pickPageDemoVideo } from "@/components/PageDemoVideoSection";
import { getConfiguredSampleVideos } from "@/lib/sample-video-config";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { liveSalesServicePlans } from "@/lib/data";
import { hasWhopPlan } from "@/lib/whop";

export const metadata = {
  title: "AI Live Sales Agent Plans | Crelavo",
  description: "Choose Crelavo AI live sales agent service plans for avatar host setup, live FAQ planning, product selling flows and monthly live-commerce support.",
  alternates: { canonical: "/live-sales-credits" }
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

const liveSalesSafetySafeguards = [
  "Customers are responsible for ensuring their product claims, prices, discounts, guarantees and health/financial/legal statements are accurate, lawful and approved before any live session.",
  "The AI Live Sales Agent must follow the rules of each streaming platform, marketplace and payment provider. It should not impersonate a real person, mislead viewers or make prohibited claims.",
  "Customer lists, chat messages, order data and audience information must be used only with proper permission, privacy notices and consent required by applicable law.",
  "Crelavo provides setup, avatar, script and automation tooling. The customer remains responsible for the brand offer, product fulfillment, refunds, consumer protection duties and regulatory compliance.",
  "Live sessions should include human review or fallback for sensitive questions, complaints, regulated products, medical/financial/legal advice and high-value transactions."
];

export default async function LiveSalesCreditsPage() {
  const [siteContent, sampleVideos] = await Promise.all([
    getConfiguredSiteContentConfig(),
    getConfiguredSampleVideos()
  ]);
  const liveSalesDemo = pickPageDemoVideo(sampleVideos, ["live-sales-page-demo", "live_sales_agent", "ai live sales", "avatar live"]);

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page">
        <section className="promo-top-layout">
          <div>
            <span className="badge">AI live sales service plans</span>
            <h1>Separate purchase page for avatar live sales agents</h1>
            <p className="section-lead">
              AI Live Sales Agent is now sold from its own plan page instead of being mixed into the normal credit purchase page. Customers choose a monthly service plan, then continue to the payment page.
            </p>
          </div>
          <div className="card selected-billing-card">
            <span className="badge">Monthly service plan</span>
            <h3>What the customer receives</h3>
            <p>Starter, Pro and Agency plans include fair-use live hours, avatar host setup, voice/language direction, live FAQ and CTA planning. No production credit balance is added.</p>
          </div>
        </section>

        <PageDemoVideoSection
          sample={liveSalesDemo}
          badge="Live sales demo video"
          title="Avatar live sales video example"
          description="Use this left-side text area to explain the live stream example, avatar host, voice, product FAQ and CTA flow. The actual demo video will appear on the right after admin adds a video URL."
          fallbackFeatures={["Avatar presenter preview", "Product selling flow", "Voice and language direction", "Live FAQ and CTA example", "Admin-managed demo video URL"]}
          ctaHref="/dashboard/live-sales-agent"
          ctaLabel="Start live stream"
          secondaryHref="/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20for%20fair-use%20product%20selling&category=live_sales_agent&mode=media"
          secondaryLabel="Prepare live-agent brief"
          adminHint="Admin setup: open /admin/sample-videos and create or edit a sample with category live_sales_agent or id live-sales-page-demo. Add Video URL and Thumbnail URL there."
        />

        <section className="card admin-wide-card" style={{ marginTop: 28 }}>
          <span className="badge">Responsible live selling</span>
          <h2>Platform, product-claim and customer-data safety policy</h2>
          <p className="section-lead">AI Live Sales Agent is a sales-support and automation service. It does not remove the customer&apos;s responsibility for lawful product claims, platform rules, consumer protection and privacy compliance.</p>
          <div className="plan-feature-groups">
            <div>
              <b>Live commerce safeguards</b>
              {liveSalesSafetySafeguards.map((item) => <small key={item}>{item}</small>)}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="sample-video-head">
            <div>
              <span className="badge">Choose a live-agent plan</span>
              <h2>Live-agent sales cards are outside normal credit top-ups</h2>
              <p className="section-lead">These plans route to payment as monthly service subscriptions, not generic account credit refills.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/dashboard/live-sales-agent">Start live stream</Link>
              <Link className="btn secondary" href="/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20for%20fair-use%20product%20selling&category=live_sales_agent&mode=media">Prepare live-agent brief</Link>
            </div>
          </div>
          <div className="production-pricing-grid">
            {liveSalesServicePlans.map((plan) => (
              <div className="card clickable-credit-card credit-sale-card" key={plan.id}>
                <span className="badge">{plan.fairUseHours}h/month fair use</span>
                <h3>{plan.name}</h3>
                <strong style={{ fontSize: 30 }}>{plan.price}</strong>
                <p><strong>Yearly: {formatUsd(plan.priceUsd * 10)}/yr</strong> · 2 months free</p>
                {"setupFeeUsd" in plan ? <p><strong>Start 24-Hour Preview — {formatUsd(Number(plan.setupFeeUsd))}</strong> non-refundable setup fee today. Includes one 10-second watermarked preview; downloads stay closed during preview.</p> : null}
                <p><strong>{plan.platformLimit}</strong></p>
                <p>{plan.description}</p>
                <div className="plan-feature-groups">
                  <div>
                    <b>Included service scope</b>
                    {plan.usage.map((item) => <small key={item}>{item}</small>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <Link className="btn" href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=monthly`}>Start monthly preview</Link>
                  {hasWhopPlan(plan.id, "yearly") ? <Link className="btn secondary" href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=yearly`}>Start yearly preview</Link> : <span className="workspace-action-note warning">Yearly checkout is not active for this plan yet.</span>}
                  <Link className="btn secondary" href="/dashboard/live-sales-agent">Start live stream</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
