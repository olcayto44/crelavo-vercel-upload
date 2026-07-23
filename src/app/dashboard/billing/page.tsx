import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { packages, topUpPackages } from "@/lib/data";

export default async function BillingPage({ searchParams }: { searchParams?: Promise<{ package?: string }> }) {
  const params = await searchParams;
  const selectedPackageName = params?.package;
  const selectedPackage = [...packages, ...topUpPackages].find((plan) => plan.id === selectedPackageName || plan.name === selectedPackageName);

  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Billing</span>
        <h2>Subscriptions and credit top-ups</h2>
        <p>
          Start a monthly or yearly credit subscription, or buy one-time top-up credits whenever a production needs extra balance.
        </p>
        <div className="url-action-center">
          <a className="btn" href="https://whop.com/hub" target="_blank" rel="noreferrer">Cancel Preview / Subscription</a>
          <Link className="btn secondary" href="/whop-billing">How cancellation works</Link>
          <Link className="btn secondary" href="/dashboard/credits">View credit balance</Link>
          <Link className="btn secondary" href="/dashboard/payment">Open payment page</Link>
          <Link className="btn secondary" href="/dashboard/contact">Need billing help?</Link>
        </div>
      </div>

      <section className="payment-trust-flow" aria-label="Billing trust flow" style={{ marginTop: 18 }}>
        <div><strong>1. Choose package</strong><span>Select subscription or one-time top-up before checkout.</span></div>
        <div><strong>2. Payment confirmation</strong><span>Credits or service access are activated after payment/admin confirmation.</span></div>
        <div><strong>3. Clear cancellation</strong><span>Preview and subscription cancellation stays visible here and in Whop.</span></div>
        <div><strong>4. Support path</strong><span>Billing questions route through credits, payment and contact pages.</span></div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Cancel preview / subscription</span>
        <h2>Need to stop before renewal?</h2>
        <p style={{ color: "var(--muted)" }}>
          If you are inside the 24-hour preview window and do not want the main subscription to start, cancel from Whop before the preview ends. The preview/setup fee remains non-refundable, but the main monthly or yearly subscription will not continue after a successful Whop cancellation.
        </p>
        <div className="url-action-center">
          <a className="btn" href="https://whop.com/hub" target="_blank" rel="noreferrer">Open Whop to cancel</a>
          <Link className="btn secondary" href="/whop-billing">Read cancellation steps</Link>
        </div>
      </section>

      {selectedPackage ? (
        <div className="card selected-billing-card">
          <span className="badge">Selected package</span>
          <h3>{selectedPackage.name}</h3>
          <strong>{selectedPackage.price}</strong>
          <p>{selectedPackage.credits.toLocaleString()} credits will be added after payment confirmation.</p>
          <p>{selectedPackage.planType === "topup" ? "This is a one-time top-up and does not renew automatically." : "This subscription renews automatically according to the selected billing cycle."}</p>
          <Link className="btn" href={`/dashboard/payment?package=${encodeURIComponent(selectedPackage.id)}&billing=${selectedPackage.planType === "topup" ? "one_time" : "monthly"}`}>Open payment page</Link>
        </div>
      ) : null}

      <section style={{ marginTop: 18 }}>
        <h2>Recurring subscriptions</h2>
        <div className="grid" style={{ marginTop: 14 }}>
          {packages.map((plan) => (
            <Link className={`card clickable-credit-card ${selectedPackageName === plan.id ? "active-billing-plan" : ""}`} href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=monthly`} key={plan.id}>
              <span className="badge">Monthly / yearly subscription</span>
              <h3>{plan.name}</h3>
              <strong style={{ fontSize: 34 }}>{plan.price}</strong>
              <p>{plan.credits.toLocaleString()} credits per month</p>
              <p>{plan.description}</p>
              <span className="btn">Select subscription</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>One-time top-up credits</h2>
        <div className="grid" style={{ marginTop: 14 }}>
          {topUpPackages.map((plan) => (
            <Link className={`card clickable-credit-card ${selectedPackageName === plan.id ? "active-billing-plan" : ""}`} href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=one_time`} key={plan.id}>
              <span className="badge">One-time top-up</span>
              <h3>{plan.name}</h3>
              <strong style={{ fontSize: 34 }}>{plan.price}</strong>
              <p>{plan.credits.toLocaleString()} credits</p>
              <p>{plan.description}</p>
              <span className="btn">Buy top-up</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Payment status</h3>
        <p style={{ color: "var(--muted)" }}>
          Whop or active payment provider receipts and invoices are sent after checkout. During early launch, credits are activated after admin review and you will receive a Crelavo credits activated email when the balance is updated.
        </p>
        <Link className="btn secondary" href="/dashboard/credits">Back to credits</Link>
      </div>
    </DashboardShell>
  );
}
