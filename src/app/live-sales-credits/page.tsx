import { LiveSalesControlCenter } from "@/components/LiveSalesControlCenter";
import { PaymentCheckoutButton } from "@/components/PaymentCheckoutButton";
import { liveSalesServicePlans } from "@/lib/data";

export const metadata = {
  title: "Live Sales Agent Plans for Social, Ecommerce and Websites | Crelavo",
  description: "Choose Crelavo live sales agent service plans for your own social media accounts, ecommerce store and website. Plans include fair-use live hours, multilingual avatar direction and pay-as-you-go provider usage.",
  alternates: { canonical: "/live-sales-credits" }
};

const useCases = [
  {
    title: "Your own social media accounts",
    text: "Use the avatar on Instagram, TikTok, Reels or campaign landing pages to introduce products, answer questions and push people toward the offer."
  },
  {
    title: "Your ecommerce store",
    text: "Put it on product pages, store homepages or checkout support flows to explain price, shipping, bundles, size, materials and trust questions."
  },
  {
    title: "Your website or funnel",
    text: "Add a 24/7 website sales assistant that greets visitors, gives product info, collects interest and routes buyers to the right page."
  }
];

const buyerBenefits = [
  "You buy the service for your own brand account, not a generic shared bot.",
  "The avatar can present products, run promo messages, explain offers and answer sales questions.",
  "It can also share shipping, order and delivery information based on your store setup.",
  "Monthly fair-use live hours are included; extra provider/API usage is billed separately when needed."
];

export default function LiveSalesCreditsPage() {
  return (
    <main className="container section pricing-page">
      <section className="promo-top-layout">
        <div>
          <span className="badge">Live commerce service</span>
          <h1>Build the live sales avatar on this page, then choose the plan below</h1>
          <p className="section-lead">This page is the full Crelavo live sales category. The visitor can read the explanation, configure the avatar here, and then choose the monthly plan for their own social media, ecommerce store or website.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">One page flow</span>
          <h3>No workspace hopping</h3>
          <p>Configure the avatar here, choose a plan here, and continue with the same service page.</p>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <h2>Where buyers use it</h2>
        <div className="grid" style={{ marginTop: 12 }}>
          {useCases.map((item) => (
            <div className="selected-billing-card" key={item.title}>
              <strong style={{ display: "block", marginBottom: 8 }}>{item.title}</strong>
              <p style={{ margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <h2>What the service gives the buyer</h2>
        <div className="grid" style={{ marginTop: 12 }}>
          {buyerBenefits.map((item) => (
            <div className="selected-billing-card" key={item}>
              <p style={{ margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="sample-video-head">
          <div>
            <span className="badge">Service plans</span>
            <h2>Choose the monthly live hours you need</h2>
            <p className="section-lead">No included credits. These are service subscriptions built around live hours, avatar direction and sales-flow setup for the customer’s own account.</p>
          </div>
        </div>
        <div className="production-pricing-grid">
          {liveSalesServicePlans.map((plan) => (
            <div className="card clickable-credit-card credit-sale-card" key={plan.id}>
              <span className="badge">{plan.fairUseHours}h / month</span>
              <h3>{plan.name}</h3>
              <strong style={{ fontSize: 30 }}>{plan.price}</strong>
              <p>{plan.description}</p>
              <p><strong>{plan.platformLimit}</strong></p>
              <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "var(--muted)", display: "grid", gap: 6 }}>
                {plan.usage.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <PaymentCheckoutButton productId={plan.id} billing="monthly">Checkout</PaymentCheckoutButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <span className="badge">Avatar creation</span>
        <h2>Create the live sales avatar here</h2>
        <p className="section-lead">Choose the platform, avatar type, voice, language, tone, product info, shipping rules and order support flow on the same page after you review the plans above.</p>
        <LiveSalesControlCenter />
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <span className="badge">Recommended route</span>
        <h2>Use this page when you want a live sales assistant in your own brand environment</h2>
        <p className="section-lead">If you only need a one-off video, go to the video products. If you want a recurring sales assistant service with monthly live hours for your own channels, this is the right entry point.</p>
      </section>
    </main>
  );
}
