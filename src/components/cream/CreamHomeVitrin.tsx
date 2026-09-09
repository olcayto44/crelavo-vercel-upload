import Link from "next/link";
import { whopFreeTrialCheckoutUrl } from "@/lib/whop";
import VideoVitrin from "./VideoVitrin";

const goals = [
  { label: "01", title: "International", text: "Localize product ads, hooks and campaign direction for another market.", href: "/dashboard/assistant-workspace?intent=international" },
  { label: "02", title: "Ad scorer", text: "Score an existing ad before production credits move.", href: "/free-tools/ad-performance-score-checker" },
  { label: "03", title: "From scratch", text: "Create a product video, landing page or campaign pack from one brief.", href: "/dashboard/assistant-workspace?intent=scratch" },
];

export default function CreamHomeVitrin() {
  return (
    <section className="cl-home cream-home-vitrin" aria-label="Crelavo cream sales vitrin">
      <div className="cl-island">
        <div className="cl-island-grid">
          <div>
            <p className="cl-kicker">For hosts selling physical goods live</p>
            <h2 className="cl-display">Don&apos;t lose<br />live orders.</h2>
            <p className="cl-lead">Launch your 24/7 AI Live Sales Agent in 60 seconds. First 24 hours free.</p>
            <div className="cl-actions">
              <a className="cl-btn" href={whopFreeTrialCheckoutUrl}>Start 24-hour trial</a>
              <Link className="cl-btn cl-btn-outline" href="/pricing">See pricing</Link>
            </div>
          </div>
          <div className="cl-home-card">
            <img src="/images/cream/home-checklist.png" alt="SKU on camera with live order checklist" />
          </div>
        </div>
      </div>

      <div className="cl-wrap cl-home-cards">
        {goals.map((goal) => (
          <Link key={goal.label} className="cl-card" href={goal.href}>
            <p className="cl-kicker">{goal.label}</p>
            <h3>{goal.title}</h3>
            <p>{goal.text}</p>
          </Link>
        ))}
      </div>

      <section className="cl-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">Live Sales Agent</p>
          <h2 className="cl-h2">The SKU stays on camera. The agent captures the order.</h2>
          <div className="cl-grid-3" style={{ marginTop: 22 }}>
            <article className="cl-card"><span className="cl-step">1</span><h3>SKU on the floor</h3><p>The physical product stays in frame.</p></article>
            <article className="cl-card"><span className="cl-step">2</span><h3>Order captured</h3><p>Shipping is asked while you talk to the room.</p></article>
            <article className="cl-card"><span className="cl-step">3</span><h3>Dashboard delivery</h3><p>Preview, source and final files stay in the dashboard.</p></article>
          </div>
          <div className="cl-actions" style={{ marginTop: 24 }}>
            <Link className="cl-btn cl-btn-outline" href="/dashboard/assistant-workspace">Open the assistant</Link>
            <a className="cl-btn" href={whopFreeTrialCheckoutUrl}>Start 24-hour trial</a>
          </div>
        </div>
      </section>

      <section className="cl-page-white" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">Categories</p>
          <h2 className="cl-h2">Choose what CreLavo should put on camera.</h2>
          <div className="cl-grid-3" style={{ marginTop: 22 }}>
            <Link className="cl-card" href="/categories"><h3>Live agent</h3><p>Captures live orders while you talk to the room.</p></Link>
            <Link className="cl-card" href="/ai-video-generator"><h3>Create media</h3><p>Product video, cinematic, UGC and presenter assets.</p></Link>
            <Link className="cl-card" href="/ai-website-builder"><h3>Build</h3><p>Website, landing and campaign pack from one brief.</p></Link>
          </div>
        </div>
      </section>

      <section className="cl-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">Free tools</p>
          <h2 className="cl-h2">Score the ad before credits move.</h2>
          <p className="cl-muted">The scorer remains free; production starts only after the assistant scope is trusted.</p>
          <Link className="cl-btn cl-btn-outline" href="/free-tools/ad-performance-score-checker">Open free Ad Scorer</Link>
        </div>
      </section>

      <section className="cl-page-white" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">How it works</p>
          <div className="cl-grid-3" style={{ marginTop: 22 }}>
            <article className="cl-card"><span className="cl-step">1</span><h3>Start with one clear brief</h3><p>Choose a goal, paste a product link or describe the asset.</p></article>
            <article className="cl-card"><span className="cl-step">2</span><h3>Review scope before credits move</h3><p>Estimates and format choices stay visible before confirmation.</p></article>
            <article className="cl-card"><span className="cl-step">3</span><h3>Receive dashboard delivery</h3><p>Preview, final files, source and README land together.</p></article>
          </div>
        </div>
      </section>

      <section className="cl-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">Example productions</p>
          <h2 className="cl-h2">Every job is a vitrin.</h2>
          <p className="cl-muted">Demo credit values are examples, not plan prices.</p>
          <div className="cl-grid-3" style={{ marginTop: 22 }}>
            <article className="cl-card"><img src="/images/cream/pouch-hero.png" alt="White pouch live sales example" /><h3>Live sales agent</h3><p>Example: 420 credits</p></article>
            <article className="cl-card"><img src="/images/cream/tote.png" alt="Canvas tote product video example" /><h3>Product video</h3><p>Example: 180 credits</p></article>
            <article className="cl-card"><img src="/images/cream/campaign-pack.png" alt="Campaign pack example" /><h3>Campaign pack</h3><p>Example: 240 credits</p></article>
          </div>
        </div>
      </section>

      <div className="cl-wrap"><VideoVitrin limit={32} heading="Crelavo video showcase" kicker="32 live catalog examples" /></div>

      <section className="cl-page-white" style={{ paddingTop: 56, paddingBottom: 48 }}>
        <div className="cl-wrap">
          <p className="cl-kicker">Pricing</p>
          <h2 className="cl-h2">$0 today. Then Pro monthly unless you cancel in Whop.</h2>
          <div className="cl-price-grid">
            <article className="cl-price-card is-on"><p className="cl-kicker">Join here</p><h2>Pro monthly</h2><p className="cl-price-amount">$9.99</p><p className="cl-muted">/ 30 days · 2,500 credits</p><a className="cl-btn cl-btn-block" href={whopFreeTrialCheckoutUrl}>Start 24-hour trial</a></article>
            <article className="cl-price-card"><h2>Pro annual</h2><p className="cl-price-amount">$99</p><p className="cl-muted">/ year · 30,000 credits</p><Link className="cl-btn cl-btn-ghost cl-btn-block" href="/pricing">View annual pricing</Link></article>
          </div>
        </div>
      </section>

      <section className="cl-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="cl-wrap"><p className="cl-kicker">Trust</p><h2 className="cl-h2">Credits, refund, cancel — in Whop.</h2><div className="cl-grid-3" style={{ marginTop: 22 }}><article className="cl-card"><h3>Credits</h3><p>Live ledger and estimates stay in the existing account system.</p></article><article className="cl-card"><h3>Cancel</h3><p>Cancel the subscription in Whop before renewal.</p></article><article className="cl-card"><h3>Refund</h3><p>Refund rules remain in the existing policy and billing flow.</p></article></div></div>
      </section>

      <section className="cl-page-white" style={{ paddingTop: 56, paddingBottom: 72 }}><div className="cl-wrap" style={{ textAlign: "center" }}><h2 className="cl-h2">Don&apos;t lose live orders.</h2><p className="cl-muted">First 24 hours free. Card required. No charge until the trial ends.</p><a className="cl-btn" href={whopFreeTrialCheckoutUrl}>Start 24-hour trial</a></div></section>
    </section>
  );
}