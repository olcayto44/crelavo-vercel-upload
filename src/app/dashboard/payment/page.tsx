import { PaymentCheckoutButton } from "@/components/PaymentCheckoutButton";
import { findPaymentProduct, liveSalesServicePlans, packages } from "@/lib/data";

export const dynamic = "force-dynamic";

function normalizeBilling(value?: string) {
  return value === "yearly" ? "yearly" : "monthly";
}

export default async function PaymentPage({ searchParams }: { searchParams?: Promise<{ package?: string; billing?: string }> }) {
  const params = await searchParams;
  const selectedPackageId = params?.package ?? packages[0].id;
  const selectedPackage = findPaymentProduct(selectedPackageId) ?? packages[0];
  const billing = normalizeBilling(params?.billing);
  const isLiveSalesService = selectedPackage.planType === "service_subscription" && "serviceCategory" in selectedPackage && selectedPackage.serviceCategory === "live_sales_agent";
  const livePlan = isLiveSalesService ? liveSalesServicePlans.find((plan) => plan.id === selectedPackage.id) ?? liveSalesServicePlans[0] : null;

  return (
    <main className="container section payment-page payment-dashboard-shell">
      <section className="promo-top-layout compact-production-hero">
        <div>
          <span className="badge">Checkout</span>
          <h1>{isLiveSalesService ? "Live sales avatar plan" : "Selected package"}</h1>
          <p className="section-lead">Minimal checkout step with one clean summary and one secure payment button.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">Summary</span>
          <h3>{selectedPackage.name}</h3>
          <p>{selectedPackage.description}</p>
          {livePlan ? <p><strong>{livePlan.fairUseHours}h / month</strong> fair-use live hours.</p> : null}
        </div>
      </section>

      <div className="payment-layout" style={{ marginTop: 20 }}>
        <section className="card payment-summary-card">
          <span className="badge">Package info</span>
          <h3>{selectedPackage.name}</h3>
          <strong>{selectedPackage.price}</strong>
          <p>{selectedPackage.description}</p>
          {livePlan ? <p><strong>{livePlan.platformLimit}</strong></p> : null}
          {livePlan ? <p>This plan unlocks the live avatar workspace.</p> : null}
        </section>

        <section className="card payment-checkout-card">
          <span className="badge">Secure payment</span>
          <h3>Continue to checkout</h3>
          <p style={{ color: "var(--muted)" }}>Use the same account email and continue with your live sales setup.</p>
          <PaymentCheckoutButton productId={selectedPackage.id} billing={billing as "monthly" | "yearly" | "one_time"}>
            Go to payment
          </PaymentCheckoutButton>

        </section>
      </div>
    </main>
  );
}
