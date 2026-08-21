import Link from "next/link";
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

const customerExamples = [
  "A shoe store answering size, material and shipping questions.",
  "A watch brand explaining product features and checkout concerns.",
  "A cosmetics brand turning campaign traffic into warm leads.",
  "Any store or website that wants a live sales assistant in their own account."
];

export default function LiveSalesCreditsPage() {
  return (
    <main className="container section pricing-page">
      <section className="promo-top-layout">
        <div>
          <span className="badge">Live commerce service</span>
          <h1>Live sales plans for the customer’s own brand accounts</h1>
          <p className="section-lead">This service is for buyers who want to use a live sales avatar on their own social media, ecommerce store or website. They pay for the service, connect their brand and let the avatar sell, explain and support their customers.</p>
        </div>
        <div className="card selected-billing-card">
          <span className="badge">How it works</span>
          <h3>Choose plan → checkout → use on your own account</h3>
          <p>Plans are monthly service subscriptions with fair-use live hours and pay-as-you-go provider/API usage when required.</p>
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

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <h2>Good for sellers who need to talk about</h2>
        <div className="grid" style={{ marginTop: 12 }}>
          {customerExamples.map((item) => (
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
                <Link className="btn secondary" href="/dashboard/live-sales-agent">Open avatar workspace</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 28 }}>
        <span className="badge">Recommended route</span>
        <h2>Use this page when you want a live sales assistant in your own brand environment</h2>
        <p className="section-lead">If you only need a one-off video, go to the video products. If you want a recurring sales assistant service with monthly live hours for your own channels, this is the right entry point.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn" href="/dashboard/live-sales-agent">Open live sales workspace</Link>
          <Link className="btn secondary" href="/pricing">Back to pricing overview</Link>
        </div>
      </section>
    </main>
  );
}
