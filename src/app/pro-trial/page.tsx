import type { Metadata } from "next";
import Link from "next/link";
import { PaymentCheckoutButton } from "@/components/PaymentCheckoutButton";

export const metadata: Metadata = {
  title: "Crelavo Pro 24-Hour Free Trial",
  description: "Start one Crelavo Pro production for $0 today. Card required; then $9.99 every 30 days unless cancelled in the customer portal.",
  alternates: { canonical: "/pro-trial" },
  robots: { index: false, follow: false }
};

const annualCheckout = "https://www.crelavo.com/checkout/unavailable";

export default function ProTrialPage() {
  return (
    <main className="container section public-funnel-page" style={{ maxWidth: 980 }}>
      <section className="card" style={{ padding: "clamp(28px, 6vw, 72px)", textAlign: "center" }}>
        <span className="badge">PRO 24-HOUR FREE TRIAL</span>
        <h1 style={{ fontSize: "clamp(2.3rem, 6vw, 5rem)", margin: "18px auto 16px", maxWidth: 780 }}>Try Crelavo Pro for $0 today</h1>
        <p className="section-lead" style={{ maxWidth: 680, margin: "0 auto" }}>Create one ecommerce product video or campaign asset with Crelavo before committing to the paid plan.</p>
        <div className="admin-info-grid" style={{ maxWidth: 720, margin: "28px auto" }}>
          <div><span>Today</span><strong>$0</strong><small>24-hour trial</small></div>
          <div><span>Included</span><strong>1 production</strong><small>Up to 10 seconds</small></div>
          <div><span>After trial</span><strong>$9.99</strong><small>Every 30 days</small></div>
        </div>
        <p style={{ color: "var(--muted)", maxWidth: 650, margin: "0 auto 24px" }}>Card required. You are not charged until the 24-hour trial ends. Cancel in the customer portal before the trial ends and you pay $0. If you already used a Crelavo trial, the checkout may charge the full subscription price.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <PaymentCheckoutButton productId="pro_24h_free_trial" billing="monthly">Start free 24-hour trial</PaymentCheckoutButton>
          <a className="btn secondary" href={annualCheckout}>Annual plan coming soon</a>
        </div>
      </section>
      <section className="grid" style={{ marginTop: 20 }}>
        <article className="card"><span className="badge">For ecommerce teams</span><h2>From product link to usable creative</h2><p>Use the Pro workspace for product videos, ad concepts, campaign assets and controlled production requests.</p></article>
        <article className="card"><span className="badge">Clear billing</span><h2>No hidden preview package</h2><p>The trial is $0 for 24 hours. Monthly billing is handled by Polar, where cancellation is managed. Annual checkout is temporarily unavailable.</p></article>
        <article className="card"><span className="badge">Need to review first?</span><h2>Check the full Pro offer</h2><p><Link href="/pricing">View the current Pro pricing page</Link> before checkout.</p></article>
      </section>
    </main>
  );
}
