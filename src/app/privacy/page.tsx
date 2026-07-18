import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Crelavo",
  description: "Crelavo Privacy Policy for accounts, production requests, payments, support and AI-assisted digital delivery."
};

export default function PrivacyPage() {
  return (
    <main className="container legal-page clean-feed-section">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Legal</span>
        <h1>Privacy Policy</h1>
        <p>Last updated: July 12, 2026</p>
        <p>This Privacy Policy explains how Crelavo handles information connected to accounts, production requests, payments, support and digital delivery.</p>
      </section>

      <section className="card legal-content-card">
        <h2>1. Information we collect</h2>
        <p>We may collect account details such as name, email address, login information, project notes, production briefs, uploaded materials, messages, selected packages, credit activity, support requests and delivery status information.</p>

        <h2>2. Production materials</h2>
        <p>When you submit prompts, files, product links, images, videos, audio, brand assets or business documents, we use them to prepare, generate, process, review and deliver the requested production work. Please do not submit materials you do not have permission to use.</p>

        <h2>3. Payment information</h2>
        <p>Payments are processed by Whop or another active listed payment provider. Crelavo does not store raw card numbers. We may store payment status, package name, receipt references, subscription status and billing support notes so we can reconcile access, credits and support requests.</p>

        <h2>4. How we use information</h2>
        <p>We use information to operate the platform, create and track production requests, reserve or activate credits, deliver files, provide support, prevent abuse, improve workflows, send transactional emails and maintain platform security.</p>

        <h2>5. Service providers</h2>
        <p>We may use trusted providers for hosting, database storage, email delivery, analytics, payment processing, AI generation, file storage, rendering or automation. These providers process information only as needed to support Crelavo services.</p>

        <h2>6. Cookies and analytics</h2>
        <p>Crelavo may use cookies or similar technologies for authentication, dashboard sessions, security, preferences and basic usage analytics. When enabled, Yandex Metrica may help us understand public marketing page behavior with analytics, click maps and session replay so we can improve navigation, pricing clarity and conversion paths. Admin, API, dashboard and auth areas are excluded from the Yandex Metrica script. You can control cookies through your browser settings, but some features may not work without required session cookies. For more detail, review our <Link href="/cookie-policy">Cookie Policy</Link>.</p>

        <h2>7. Data retention</h2>
        <p>We keep account, billing, production and support records for as long as needed to provide the service, meet legal or tax obligations, resolve disputes, prevent abuse and maintain accurate delivery history.</p>

        <h2>8. Your choices</h2>
        <p>You may contact us to request access, correction or deletion of personal information where applicable. Some records may need to be retained for billing, fraud prevention, legal compliance or service integrity.</p>

        <h2>9. Security</h2>
        <p>We use reasonable technical and organizational measures to protect information. No online service can guarantee absolute security, so you should keep your login information private and avoid uploading sensitive information that is not needed for production.</p>

        <h2>10. Contact</h2>
        <p>For privacy questions, contact <a href="mailto:support@crelavo.com">support@crelavo.com</a>. You can also review our <Link href="/terms">Terms of Service</Link> and <Link href="/refund-policy">Refund / Cancellation Policy</Link>.</p>
      </section>
    </main>
  );
}
