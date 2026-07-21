import Link from "next/link";
import { Suspense } from "react";
import { WhopPaymentReconcileStatus } from "@/components/WhopPaymentReconcileStatus";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function CheckoutCompletePage() {
  return (
    <main className="container section pricing-page public-funnel-page checkout-complete-page">
      <section className="card payment-checkout-card">
        <span className="badge">Payment status</span>
        <h1>Payment received — verification in progress</h1>
        <p style={{ color: "var(--muted)" }}>
          Your checkout was completed. Crelavo now verifies the payment details, matches them to the same account email and applies eligible credits or service access automatically.
        </p>
        <p style={{ color: "var(--muted)" }}>
          One-time credit packs are added after payment verification. Subscription setup/preview payments start Crelavo&apos;s 24-hour preview workflow with a non-refundable setup fee and downloads closed during preview. If you do not cancel within 24 hours, Whop automatically charges the selected plan; full recurring credits are added after the main subscription payment is confirmed.
        </p>
        <Suspense fallback={null}>
          <WhopPaymentReconcileStatus />
        </Suspense>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <Link className="btn" href="/dashboard/credits">Open credits</Link>
          <Link className="btn secondary" href="/dashboard/create">Start a request</Link>
        </div>
      </section>
    </main>
  );
}
