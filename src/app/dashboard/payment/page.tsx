import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { rolloverPolicyText } from "@/lib/credit-rollover";
import { PaymentCheckoutButton } from "@/components/PaymentCheckoutButton";
import { allCreditProducts, dronePurchasePackages, findPaymentProduct, growthIntelligencePlans, liveSalesServicePlans, packages } from "@/lib/data";
import { billingTermsText } from "@/lib/legal";
import { whopPreviewNotice } from "@/lib/whop-preview-policy";

type BillingMode = "monthly" | "yearly" | "one_time";

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function normalizeBilling(value?: string): BillingMode {
  if (value === "yearly") return "yearly";
  if (value === "one_time") return "one_time";
  return "monthly";
}

function planPrice(plan: { name?: string; price: string; priceUsd?: number; planType?: string }, billing: BillingMode) {
  if (["topup", "production_one_time"].includes(String(plan.planType))) return plan.price;
  if (!plan.priceUsd) return plan.price;
  const seatSuffix = plan.name === "Team" ? "/seat" : "";
  return billing === "yearly" ? `${formatUsd(plan.priceUsd * 10)}${seatSuffix}/yr` : `$${plan.priceUsd}${seatSuffix}/mo`;
}

function planCredits(plan: { credits: number; yearlyCredits?: number; planType?: string }, billing: BillingMode) {
  if (["topup", "production_one_time", "service_subscription"].includes(String(plan.planType))) return plan.credits;
  return billing === "yearly" ? plan.yearlyCredits ?? plan.credits * 12 : plan.credits;
}

function creditUnitPrice(plan: { priceUsd?: number; credits: number; yearlyCredits?: number; planType?: string; serviceCategory?: string }, billing: BillingMode) {
  if (plan.planType === "service_subscription") return plan.serviceCategory === "growth_intelligence" ? "No included credits; competitor monitoring and report delivery apply." : "No included credits; fair-use live hours apply.";
  if (plan.planType === "production_one_time") return "Managed production package; not a general credit top-up.";
  if (!plan.priceUsd) return "Payment setup pending";
  const price = plan.planType === "topup" ? plan.priceUsd : billing === "yearly" ? plan.priceUsd * 10 : plan.priceUsd;
  return `$${((price / planCredits(plan, billing)) * 1000).toFixed(2)} / 1,000 credits`;
}

const previewConfidenceSteps = [
  { title: "Preview first", text: "The preview fee starts a 24-hour test window so the buyer can check access before the full subscription continues." },
  { title: "Cancel clearly", text: "If the buyer does not want the main subscription to start, they can cancel from Whop before the 24-hour preview ends." },
  { title: "Downloads stay controlled", text: "Preview access is intentionally limited; final downloads open after the selected plan starts and payment is confirmed." },
  { title: "Same email match", text: "The checkout email should match the Crelavo account email so admin review can connect the payment quickly during early launch." }
];

const checkoutHesitationAnswers = [
  { question: "What if I picked the wrong plan?", answer: "Start with Business if you only need one brand or a small product test. Choose Team Annual only when bulk ecommerce or agency production is the goal." },
  { question: "When are credits used?", answer: "Credits are added after payment confirmation, but production credits are reserved only after a specific production request is confirmed." },
  { question: "What should I do before checkout?", answer: "If the ad idea is not ready, use the free AI Ad Scorer first. If the direction is clear, start the preview checkout." }
];

export default async function PaymentPage({ searchParams }: { searchParams?: Promise<{ package?: string; billing?: string }> }) {
  const params = await searchParams;
  const selectedPackageId = params?.package ?? packages[0].id;
  const selectedPackage = findPaymentProduct(selectedPackageId) ?? packages[0];
  const isServicePlan = selectedPackage.planType === "service_subscription";
  const serviceCategory = "serviceCategory" in selectedPackage ? selectedPackage.serviceCategory : "";
  const isGrowthService = serviceCategory === "growth_intelligence";
  const isLiveSalesService = serviceCategory === "live_sales_agent";
  const isDronePackage = serviceCategory === "drone_video";
  const isProductionPackage = selectedPackage.planType === "production_one_time" || isDronePackage;
  const requestedBilling = selectedPackage.planType === "topup" || isProductionPackage ? "one_time" : normalizeBilling(params?.billing);
  const billing = requestedBilling;
  const displayPrice = planPrice(selectedPackage, billing);
  const displayCredits = planCredits(selectedPackage, billing);
  const isSubscription = selectedPackage.planType === "subscription" || isServicePlan;
  const packageFamily = isServicePlan ? isGrowthService ? growthIntelligencePlans : liveSalesServicePlans : isProductionPackage ? dronePurchasePackages : allCreditProducts;
  const previewNotice = whopPreviewNotice(selectedPackage, billing);
  const rolloverNotice = rolloverPolicyText(selectedPackage, billing);
  const vipAgencyHubUrl = process.env.NEXT_PUBLIC_VIP_AGENCY_HUB_URL?.trim();

  return (
    <DashboardShell className="payment-dashboard-shell">
      <div className="payment-page">
      <div className="production-hero-card compact-production-hero">
        <span className="badge">Payment Page</span>
        {/* Smoke guard legacy copy: Buy one-time top-up credits */}
        <h2>{isServicePlan ? isGrowthService ? "Start Growth Intelligence service plan" : "Start avatar live sales service plan" : isProductionPackage ? "Buy Drone / Satellite production package" : isSubscription ? "Start recurring credit subscription" : "Buy one-time extra credits"}</h2>
          <p>
            {isServicePlan
              ? isGrowthService ? "This AI competitor and market intelligence service starts with a paid 24-hour preview/setup fee, then renews monthly or yearly through Whop unless cancelled. It does not add normal production credits to the account." : "This AI live sales agent service starts with a paid 24-hour preview/setup fee, then renews monthly or yearly through Whop unless cancelled. It does not add normal production credits to the account."
              : isProductionPackage
                ? "This is a one-time managed Drone / Satellite Video production package. It is separate from normal credit top-ups."
                : isSubscription
                    ? "Monthly and yearly subscriptions start with a paid 24-hour preview. Downloads are closed during preview; if not cancelled within 24 hours, Whop automatically charges the selected plan and keeps renewing it until cancelled."
                  : "Extra credit packages are one-time purchases, do not renew automatically, and can be bought repeatedly whenever you need extra credits. Use the same email as your Crelavo account at checkout."}
          </p>

      </div>

      <section className="payment-trust-flow" aria-label="Checkout trust flow">
        <div><strong>1. Secure checkout</strong><span>Card details stay with the active payment provider.</span></div>
        <div><strong>2. Credit/account match</strong><span>Use the same Crelavo email so the payment can be matched quickly.</span></div>
        <div><strong>3. Credits or service access</strong><span>{isServicePlan ? "Service access starts after preview/payment confirmation." : isProductionPackage ? "The managed production package is tracked separately from normal top-ups." : "Credits are added after payment confirmation."}</span></div>
        <div><strong>4. Production confirmation</strong><span>Production credits are still reserved only when a job is confirmed.</span></div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Preview confidence</span>
        <h2>What the 24-hour preview means</h2>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {previewConfidenceSteps.map((step) => (
            <div className="card admin-category-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
        <div className="workspace-action-note" style={{ marginTop: 16 }}>
          <span className="badge">VIP Agency Hub</span>
          <h3>After checkout, use the buyer hub for faster first-output direction</h3>
          <p>
            Preview buyers can receive prompt tips, ecommerce ad examples and first-video feedback through the VIP Agency Hub. The invite link is shown when configured; otherwise support can send the correct invite manually.
          </p>
          {vipAgencyHubUrl ? (
            <a className="btn secondary" href={vipAgencyHubUrl} target="_blank" rel="noreferrer">Open VIP Agency Hub</a>
          ) : (
            <Link className="btn secondary" href="/dashboard/contact">Request hub invite</Link>
          )}
        </div>
      </section>

      <div className="payment-layout">
        <section className="card selected-billing-card payment-summary-card">
          <span className="badge">Selected package - {isServicePlan ? billing === "yearly" ? "Yearly service plan" : "Monthly service plan" : isProductionPackage ? "One-time production package" : isSubscription ? billing === "yearly" ? "Yearly subscription" : "Monthly subscription" : "One-time credit purchase"}</span>
          <h3>{selectedPackage.name}</h3>
          <strong>{displayPrice}</strong>
          {isLiveSalesService && "fairUseHours" in selectedPackage ? <p><strong>{selectedPackage.fairUseHours} fair-use live hours/month</strong> are included. No production credits are added.</p> : null}
          {isGrowthService && "competitorLimit" in selectedPackage ? <p><strong>{selectedPackage.competitorLimit}</strong> · {"monitoringFrequency" in selectedPackage ? selectedPackage.monitoringFrequency : "Scheduled monitoring"}. No production credits are added.</p> : null}
          {isProductionPackage && "productionCredits" in selectedPackage ? <p><strong>{Number(selectedPackage.productionCredits).toLocaleString()} credits equivalent</strong> is used as the internal production guide, but this is not a general credit top-up.</p> : null}
          {!isServicePlan && !isProductionPackage ? <p><strong>{displayCredits.toLocaleString()} credits</strong> will be added to the account after payment confirmation.</p> : null}
          {previewNotice ? <p><strong>Start 24-Hour Preview.</strong> {previewNotice}</p> : null}
          <p><strong>Unused credit protection.</strong> {rolloverNotice}</p>
          <p>{creditUnitPrice(selectedPackage, billing)}</p>
          {isSubscription && billing === "yearly" && selectedPackage.priceUsd ? <p>With yearly billing, you receive 12 months of access and pay {formatUsd(selectedPackage.priceUsd * 10)} instead of {formatUsd(selectedPackage.priceUsd * 12)}. 2 months are free and the plan renews yearly.</p> : null}
          {isServicePlan ? <p>{isGrowthService ? `This intelligence service plan renews ${billing === "yearly" ? "yearly" : "monthly"} until cancelled. Scraping, monitoring, report generation and alert limits follow the selected plan.` : `This live-agent service plan renews ${billing === "yearly" ? "yearly" : "monthly"} until cancelled. Extra live-operation hours are handled as pay-as-you-go after cost analysis.`}</p> : null}
          {!isServicePlan && isSubscription && billing === "monthly" ? <p>This subscription renews every monthly subscription cycle until cancelled. The active payment provider securely processes checkout and subscription billing.</p> : null}
          {isProductionPackage ? <p>This Drone / Satellite Video package is a one-time production purchase and does not renew automatically.</p> : null}
          {!isSubscription && !isProductionPackage ? <p>This top-up does not renew automatically. You can buy the same top-up again whenever you need more credits.</p> : null}
          <p>{selectedPackage.description}</p>
          {"usage" in selectedPackage ? (
            <ul>
              {selectedPackage.usage.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </section>

        <section className="card payment-checkout-card">
          <span className="badge">Secure checkout</span>
          <h3>{isServicePlan ? isGrowthService ? `Authorize ${billing} intelligence plan` : `Authorize ${billing} live-agent plan` : isSubscription ? "Authorize 24-hour preview and automatic renewal" : "Complete one-time payment"}</h3>
          <p style={{ color: "var(--muted)" }}>{billingTermsText}</p>
          <PaymentCheckoutButton productId={selectedPackage.id} billing={billing}>
            {isServicePlan ? isGrowthService ? "Start intelligence preview checkout" : "Start live-agent preview checkout" : isProductionPackage ? "Continue to drone package checkout" : isSubscription ? "Start 24-hour preview checkout" : "Continue to payment checkout"}
          </PaymentCheckoutButton>
          {isSubscription ? (
            <div className="workspace-action-note" style={{ marginTop: 12 }}>
              <p><strong>Need to cancel during preview?</strong> Use Whop before the 24-hour preview ends so the main subscription does not start.</p>
              <a className="btn secondary" href="https://whop.com/hub" target="_blank" rel="noreferrer">Open Whop cancellation</a>
              <Link className="btn secondary" href="/whop-billing">Cancellation steps</Link>
            </div>
          ) : null}
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Card details are entered on the secure checkout page of the active payment provider. Crelavo does not store raw card numbers. Use the same email as your Crelavo account so admin review can match the payment quickly during early launch.
          </p>
        </section>
      </div>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Before you continue</span>
        <h2>Common checkout questions</h2>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {checkoutHesitationAnswers.map((item) => (
            <div className="card admin-category-card" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Score the ad first</Link>
          <Link className="btn secondary" href="/pricing">Compare plans again</Link>
        </div>
      </section>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Choose another package</h3>
        <div className="grid" style={{ marginTop: 14 }}>
          {packageFamily.map((plan) => {
            const isPlanService = plan.planType === "service_subscription";
            const isPlanProduction = plan.planType === "production_one_time";
            const planBilling = plan.planType === "topup" || isPlanProduction ? "one_time" : billing === "yearly" ? "yearly" : "monthly";
            const isRecommendedPlan = plan.priceUsd === 79 || plan.name.toLowerCase() === "business";
            const normalizedPlanName = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const planTone = plan.planType === "topup" ? `topup-${normalizedPlanName}` : isRecommendedPlan ? "recommended" : normalizedPlanName;
            return (
              <Link className={`card clickable-credit-card credit-plan-tone-${planTone}${isRecommendedPlan ? " recommended-credit-plan" : ""} ${selectedPackage.id === plan.id ? "active-billing-plan" : ""}`} href={`/dashboard/payment?package=${encodeURIComponent(plan.id)}&billing=${planBilling}`} key={plan.id}>
                  <span className="badge">{isPlanService ? "serviceCategory" in plan && plan.serviceCategory === "growth_intelligence" ? planBilling === "yearly" ? "Yearly intelligence service" : "Monthly intelligence service" : planBilling === "yearly" ? "Yearly live-agent service" : "Monthly live-agent service" : isPlanProduction ? "One-time drone package" : plan.planType === "topup" ? "One-time credit purchase" : planBilling === "yearly" ? "Yearly subscription" : "Monthly subscription"}</span>
                <h3>{plan.name}</h3>
                <strong style={{ fontSize: 30 }}>{planPrice(plan, planBilling)}</strong>
                {isPlanService && "competitorLimit" in plan ? <p><strong>{plan.competitorLimit}</strong></p> : isPlanService && "fairUseHours" in plan ? <p><strong>{plan.fairUseHours}h/month fair use</strong></p> : isPlanProduction && "productionCredits" in plan ? <p><strong>{Number(plan.productionCredits).toLocaleString()} credits equivalent</strong></p> : <p><strong>{planCredits(plan, planBilling).toLocaleString()} credits</strong></p>}
                <p>{creditUnitPrice(plan, planBilling)}</p>
                <span className="btn">Choose this package</span>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </DashboardShell>
  );
}
