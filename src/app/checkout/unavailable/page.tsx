import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout coming soon | Crelavo",
  description: "This Crelavo package is temporarily unavailable while its Polar checkout is prepared.",
  robots: { index: false, follow: false }
};

export default function CheckoutUnavailablePage() {
  return (
    <main className="container section public-funnel-page" style={{ maxWidth: 860 }}>
      <section className="card" style={{ padding: "clamp(28px, 6vw, 64px)", textAlign: "center" }}>
        <span className="badge">CHECKOUT UPDATE</span>
        <h1 style={{ margin: "18px auto 14px" }}>This package is coming soon on Polar</h1>
        <p className="section-lead" style={{ maxWidth: 640, margin: "0 auto 24px" }}>Whop checkout is disabled. This package will return when its Polar product and payment flow are ready.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/pricing">View available plans</Link>
          <Link className="btn secondary" href="/contact">Contact support</Link>
        </div>
      </section>
    </main>
  );
}
