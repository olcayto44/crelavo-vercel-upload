import Link from "next/link";
import {LegalPageShell} from "@/components/LegalPageShell";

export const metadata = {
  title: "Refund / Cancellation Policy | Crelavo",
  description: "Crelavo refund, cancellation and subscription policy for active payment provider payments, credit packages and managed production services.",
  alternates: { canonical: "/refund-policy" }
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell title="Refund / Cancellation Policy" updated="July 12, 2026" intro="This policy explains how cancellations and refund reviews work for Crelavo subscriptions, one-time credit packages and managed digital production services." current="/refund-policy" sections={[{"id":"section-1","title":"1. Subscription cancellations"},{"id":"section-2","title":"2. One-time purchases"},{"id":"section-3","title":"3. Refund review window"},{"id":"section-4","title":"4. When refunds are usually not available"},{"id":"section-5","title":"5. Partial or discretionary refunds"},{"id":"section-6","title":"6. Failed or duplicate payments"},{"id":"section-7","title":"7. How to request help"},{"id":"section-8","title":"8. Related policies"}]}>
        <h2 id="section-1">1. Subscription cancellations</h2>
        <p>Monthly and yearly subscriptions may start with a paid 24-hour preview. The setup fee is charged immediately, is non-refundable and covers preview access, one 10-second watermarked preview video and platform operating costs while downloads stay closed during preview. If you cancel within 24 hours, the main subscription does not start and the setup fee remains non-refundable. If you do not cancel within 24 hours, Whop automatically charges the selected monthly or yearly plan; later cancellation stops future renewals but does not automatically refund charges that have already been processed.</p>

        <h2 id="section-2">2. One-time purchases</h2>
        <p>One-time top-up packages and one-time production packages do not renew automatically. They are intended for credit activation, provider work, managed production work or a specific digital delivery path.</p>

        <h2 id="section-3">3. Refund review window</h2>
        <p>You may contact support within 14 days of purchase to request a refund review. A request is more likely to be eligible when no credits have been reserved or consumed, no production cost has been incurred, no manual production work has started, no report has been delivered and no final output has been made available.</p>

        <h2 id="section-4">4. When refunds are usually not available</h2>
        <p>Refunds are usually not available after credits are reserved for a production request, production work begins, manual research or production work starts, a Growth Intelligence report is delivered, a live-agent/service setup is initiated, a digital file/output is delivered or substantial platform resources have been consumed.</p>

        <h2 id="section-5">5. Partial or discretionary refunds</h2>
        <p>When only part of a service has been used, Crelavo may review whether a partial refund, credit adjustment or account credit is appropriate. Any discretionary resolution depends on payment status, consumed resources, provider costs, delivered work and the specific package terms.</p>

        <h2 id="section-6">6. Failed or duplicate payments</h2>
        <p>If you believe a payment failed incorrectly, was duplicated or was charged in error, contact support with your payment provider receipt or invoice email. We will review payment records and respond with the safest available resolution.</p>

        <h2 id="section-7">7. How to request help</h2>
        <p>Email <a href="mailto:support@crelavo.com">support@crelavo.com</a> with your account email, package name, payment date, receipt or invoice reference and a short explanation. Please do not send full card numbers or sensitive payment credentials.</p>

        <h2 id="section-8">8. Related policies</h2>
        <p>This policy should be read together with the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
      </LegalPageShell>
  );
}
