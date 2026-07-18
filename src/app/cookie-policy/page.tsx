import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | Crelavo",
  description: "Crelavo Cookie Policy for required session cookies, preferences, analytics and security-related technologies."
};

export default function CookiePolicyPage() {
  return (
    <main className="container legal-page clean-feed-section">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Legal</span>
        <h1>Cookie Policy</h1>
        <p>Last updated: July 13, 2026</p>
        <p>This Cookie Policy explains how Crelavo may use cookies and similar technologies for account access, platform security, preferences, analytics and production workflow delivery.</p>
      </section>

      <section className="card legal-content-card">
        <h2>1. What cookies are</h2>
        <p>Cookies are small text files or similar browser storage technologies that help a website remember basic information about a visit, account session or user preference.</p>

        <h2>2. Required cookies</h2>
        <p>Crelavo may use required cookies or local storage for authentication, dashboard sessions, security checks, referral tracking, account continuity, language preferences and safe operation of production workflows. These technologies are necessary for parts of the service to work correctly.</p>

        <h2>3. Analytics and performance</h2>
        <p>Crelavo may use limited analytics or performance tools, including Yandex Metrica when enabled, to understand page visits, product interest, feature usage, conversion paths and technical reliability. Session replay or click-map features may be used on public marketing pages to improve pricing pages, production flows, checkout readiness and support experiences. Admin, API, dashboard and auth areas are excluded from the Yandex Metrica script.</p>

        <h2>4. Payment and provider cookies</h2>
        <p>Payment providers such as Whop or another active listed payment provider may use their own cookies or security technologies during checkout, fraud prevention, tax calculation, receipt delivery and subscription management. Their own policies apply when you interact with their checkout pages.</p>

        <h2>5. Managing cookies</h2>
        <p>You can control or delete cookies through your browser settings. Blocking required cookies may prevent sign-in, dashboard access, credit tracking, checkout return flows, language preferences or production delivery features from working correctly.</p>

        <h2>6. Contact</h2>
        <p>For questions about cookies or privacy, contact <a href="mailto:support@crelavo.com">support@crelavo.com</a>. You can also review our <Link href="/privacy">Privacy Policy</Link>, <Link href="/terms">Terms of Service</Link> and <Link href="/refund-policy">Refund / Cancellation Policy</Link>.</p>
      </section>
    </main>
  );
}
