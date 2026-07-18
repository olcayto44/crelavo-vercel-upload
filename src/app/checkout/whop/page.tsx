import Link from "next/link";
import Script from "next/script";
import { findPaymentProduct } from "@/lib/data";
import { whopProductForPlanId } from "@/lib/whop";
import { whopPreviewNotice, whopPreviewSummary } from "@/lib/whop-preview-policy";

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export default async function WhopCheckoutPage({ searchParams }: { searchParams?: Promise<{ planId?: string; returnUrl?: string }> }) {
  const params = await searchParams;
  const planId = String(params?.planId ?? "").trim();
  const returnUrl = String(params?.returnUrl ?? "https://www.crelavo.com/checkout/complete").trim();
  const mappedPlan = planId ? whopProductForPlanId(planId) : null;
  const product = mappedPlan ? findPaymentProduct(mappedPlan.productId) : null;
  const isSubscription = mappedPlan?.billing === "monthly" || mappedPlan?.billing === "yearly";
  const previewSummary = whopPreviewSummary(product, mappedPlan?.billing ?? "monthly");
  const previewNotice = whopPreviewNotice(product, mappedPlan?.billing ?? "monthly");

  return (
    <main className="container section pricing-page">
      <section className="card payment-checkout-card">
        <span className="badge">Whop secure checkout</span>
        <h1>Crelavo checkout</h1>
        <p style={{ color: "var(--muted)" }}>
          {product && mappedPlan
            ? isSubscription
              ? `This ${product.name} plan starts with a ${formatUsd(previewSummary.setupFeeUsd)} non-refundable 24-hour preview/setup charge. Downloads stay closed during preview. If not cancelled within 24 hours, Whop automatically charges the selected ${previewSummary.billingInterval} plan and renews it until cancelled.`
              : `This ${product.name} purchase is a one-time payment and does not renew automatically.`
            : "This checkout starts with the configured non-refundable 24-hour preview/setup charge for subscription products. Downloads stay closed during preview; if not cancelled within 24 hours, Whop automatically charges the selected plan and renews it until cancelled."}
        </p>
        {product ? (
          <div className="workspace-action-note" style={{ marginTop: 12 }}>
            <strong>{product.name}</strong>
            <small>{isSubscription ? `Preview/setup fee today: ${formatUsd(previewSummary.setupFeeUsd)} — non-refundable.` : "One-time purchase; no automatic renewal."}</small>
            {isSubscription ? <small>{previewNotice}</small> : null}
          </div>
        ) : null}
        {planId ? (
          <>
            <Script async defer src="https://js.whop.com/static/checkout/loader.js" />
            <div data-whop-checkout-plan-id={planId} data-whop-checkout-return-url={returnUrl} />
          </>
        ) : (
          <div className="workspace-action-note error">
            Missing legacy checkout plan ID. Return to pricing and choose a package again.
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          <Link className="btn secondary" href="/pricing">Back to pricing</Link>
        </div>
      </section>
    </main>
  );
}
