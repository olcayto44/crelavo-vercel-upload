import Link from "next/link";
import {LegalPageShell} from "@/components/LegalPageShell";

export const metadata = {
  title: "Cookie Policy | Crelavo",
  description: "Crelavo Cookie Policy for required session cookies, preferences, analytics and security-related technologies.",
  alternates: { canonical: "/cookie-policy" }
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" updated="July 13, 2026" intro="This Cookie Policy explains how Crelavo may use cookies and similar technologies for account access, platform security, preferences, analytics and production workflow delivery." current="/cookie-policy" sections={[{"id":"section-1","title":"1. What cookies are"},{"id":"section-2","title":"2. Required cookies"},{"id":"section-3","title":"3. Analytics and performance"},{"id":"section-4","title":"4. Payment and provider cookies"},{"id":"section-5","title":"5. Managing cookies"},{"id":"section-6","title":"6. Contact"}]}>
        <h2 id="section-1">1. What cookies are</h2>
        <p>Cookies are small text files or similar browser storage technologies that help a website remember basic information about a visit, account session or user preference.</p>

        <h2 id="section-2">2. Required cookies</h2>
        <p>Crelavo may use required cookies or local storage for authentication, dashboard sessions, security checks, referral tracking, account continuity, language preferences and safe operation of production workflows. These technologies are necessary for parts of the service to work correctly.</p>

        <h2 id="section-3">3. Analytics and performance</h2>
        <p>Crelavo may use limited analytics or performance tools, including Yandex Metrica when enabled, to understand page visits, product interest, feature usage, conversion paths and technical reliability. Session replay or click-map features may be used on public marketing pages to improve pricing pages, production flows, checkout readiness and support experiences. Admin, API, dashboard and auth areas are excluded from the Yandex Metrica script.</p>

        <h2 id="section-4">4. Payment and provider cookies</h2>
        <p>Payment providers such as Whop or another active listed payment provider may use their own cookies or security technologies during checkout, fraud prevention, tax calculation, receipt delivery and subscription management. Their own policies apply when you interact with their checkout pages.</p>

        <h2 id="section-5">5. Managing cookies</h2>
        <p>You can control or delete cookies through your browser settings. Blocking required cookies may prevent sign-in, dashboard access, credit tracking, checkout return flows, language preferences or production delivery features from working correctly.</p>

        <h2 id="section-6">6. Contact</h2>
        <p>For questions about cookies or privacy, contact <a href="mailto:support@crelavo.com">support@crelavo.com</a>. You can also review our <Link href="/privacy">Privacy Policy</Link>, <Link href="/terms">Terms of Service</Link> and <Link href="/refund-policy">Refund / Cancellation Policy</Link>.</p>
      </LegalPageShell>
  );
}
