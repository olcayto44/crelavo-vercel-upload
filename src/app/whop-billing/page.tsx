import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata = {
  title: "Billing and cancellation | Crelavo",
  description: "How to manage Crelavo Whop subscriptions, cancel during the 24-hour preview, and understand preview fees, credits and renewal timing.",
  alternates: { canonical: "/whop-billing" }
};

const subscriptionSteps = [
  "Open the Whop payment or membership email you received after checkout.",
  "Click Manage subscription, Manage membership, or open your Whop account dashboard.",
  "Find the active Crelavo membership or subscription.",
  "Choose Cancel membership or Cancel subscription before the 24-hour preview ends.",
  "Keep the Whop confirmation email or cancellation confirmation for your records."
];

const whopMenuNames = [
  "My Whop / My products",
  "Purchases / Subscriptions",
  "Manage membership",
  "Manage subscription",
  "Cancel membership / Cancel subscription"
];

export default async function WhopBillingPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page public-funnel-page billing-help-page">
        <section className="blog-hero-panel">
          <span className="badge">Whop billing</span>
          <h1>Manage payment, preview and cancellation</h1>
          <p>
            Crelavo payments and subscriptions are managed through Whop. Use this page to understand where to cancel, what happens during the 24-hour preview and when credits are added.
          </p>
          <div className="button-nav" style={{ marginTop: 18 }}>
            <a className="btn" href="https://whop.com/hub" target="_blank" rel="noreferrer">Open Whop account</a>
            <Link className="btn secondary" href="/dashboard/credits">Open Crelavo credits</Link>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 24 }}>
          <div className="card">
            <span className="badge">24-hour preview</span>
            <h2>Cancel before the main plan starts</h2>
            <p style={{ color: "var(--muted)" }}>
              Subscription plans can start with a paid 24-hour preview/setup payment. If you cancel in Whop before the 24-hour preview ends, the selected main monthly or yearly subscription will not start.
            </p>
            <p style={{ color: "var(--muted)" }}>
              The preview/setup fee charged today is non-refundable. Downloads stay closed during preview. If you do not cancel within 24 hours, Whop automatically charges the selected plan and keeps it renewing until cancelled.
            </p>
          </div>

          <div className="card">
            <span className="badge">Where to cancel</span>
            <h2>Use Whop, not Crelavo dashboard</h2>
            <p style={{ color: "var(--muted)" }}>
              The recurring payment is controlled by Whop, so cancellation must be completed inside Whop. Crelavo can show your credits and productions, but Whop is the billing source of record.
            </p>
            <ul className="feature-list">
              {whopMenuNames.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <span className="badge">Step by step</span>
          <h2>How to cancel during preview</h2>
          <ol style={{ color: "var(--muted)", display: "grid", gap: 10, paddingLeft: 22 }}>
            {subscriptionSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="button-nav" style={{ marginTop: 18 }}>
            <a className="btn" href="https://whop.com/hub" target="_blank" rel="noreferrer">Go to Whop</a>
            <Link className="btn secondary" href="/dashboard/contact">Contact support</Link>
          </div>
        </section>

        <section className="grid" style={{ marginTop: 24 }}>
          <div className="card">
            <h2>One-time credit packs</h2>
            <p style={{ color: "var(--muted)" }}>
              One-time packs such as Starter Credit Pack, Creator Credit Pack and Business Credit Pack do not renew automatically. After a successful Whop payment, eligible credits are added to the matching Crelavo account email.
            </p>
          </div>
          <div className="card">
            <h2>Subscription credits</h2>
            <p style={{ color: "var(--muted)" }}>
              Preview/setup payments do not add the full subscription credits immediately. Full recurring credits are added after the main monthly or yearly subscription payment is confirmed.
            </p>
          </div>
          <div className="card">
            <h2>Need help?</h2>
            <p style={{ color: "var(--muted)" }}>
              If you cannot find the Whop cancellation link, contact support with your Crelavo account email and Whop payment or membership reference.
            </p>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>support@crelavo.com</p>
          </div>
        </section>
      </main>
    </>
  );
}
