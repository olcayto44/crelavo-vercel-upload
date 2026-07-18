import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Crelavo",
  description: "Crelavo Terms of Service for AI production studio subscriptions, credit packages, managed services and digital delivery."
};

export default function TermsPage() {
  return (
    <main className="container legal-page clean-feed-section">
      <section className="production-hero-card compact-production-hero">
        <span className="badge">Legal</span>
        <h1>Terms of Service</h1>
        <p>Last updated: July 12, 2026</p>
        <p>These Terms of Service explain the rules for using Crelavo, a managed AI production studio for digital creative work, websites, apps, campaign assets, AI video, visuals, voice, documents and related services.</p>
      </section>

      <section className="card legal-content-card">
        <h2>1. Who we are</h2>
        <p>Crelavo provides digital production workflows, AI-assisted creative tools, managed production requests, credit packages, service subscriptions and dashboard delivery for customers who need digital assets and production support.</p>

        <h2>2. Account and customer responsibility</h2>
        <p>You are responsible for keeping your account information accurate, using a valid email address and making sure you have the rights to submit any text, images, videos, audio, brand assets, product links or other materials you upload or reference.</p>

        <h2>3. Acceptable use</h2>
        <p>You may not use Crelavo for illegal activity, copyright infringement, impersonation, fraud, adult or explicit sexual content, gambling, tobacco, alcohol sales, crypto or forex investment advice, regulated financial advice, dangerous instructions, hateful content or content that violates another party's rights.</p>
        <p>Voice cloning, visual cloning, avatar, lip-sync, presenter, live sales agent and style-reference workflows may only be used with materials you own, control, have licensed or have clear written permission to use. You may not clone or imitate another person's voice, face, likeness, identity, brand, product, artwork or protected style without authorization. Crelavo may suspend accounts, reject requests, remove outputs, withhold delivery or report abuse when a request appears to involve impersonation, fraud, unauthorized identity use, copyright infringement, trademark misuse or unsafe commercial claims.</p>

        <h2>4. AI and production outputs</h2>
        <p>Crelavo may use third-party AI and production providers to generate, process or deliver requested outputs. AI-generated results can vary and may require review, editing or revision before commercial use. You are responsible for reviewing final outputs for accuracy, compliance, rights clearance and suitability for your intended use.</p>

        <h2>5. Credits, subscriptions and one-time packages</h2>
        <p>Some Crelavo services use credits. Monthly or yearly subscriptions may start with a paid 24-hour preview, including a non-refundable setup fee, one 10-second watermarked preview video and downloads closed until the selected subscription begins. Monthly or yearly subscriptions renew automatically through the payment provider until cancelled. One-time top-up packages and one-time production packages do not renew automatically. Credits may be reserved when production begins, and package details shown at checkout or in the dashboard control what is included.</p>

        <h2>6. Payments</h2>
        <p>Payments are processed by Whop or another active listed payment provider. Crelavo does not store raw card numbers. Please keep your payment receipt or invoice email for billing support.</p>

        <h2>7. Delivery and revisions</h2>
        <p>Delivery timing depends on the selected package, user-provided materials, provider availability, review needs and production complexity. Revision availability is governed by the package description, dashboard notes and any written agreement shown before or during the request.</p>

        <h2>8. Refunds and cancellations</h2>
        <p>Refund and cancellation rules are described in our <Link href="/refund-policy">Refund / Cancellation Policy</Link>. In general, refund eligibility becomes limited after credits are reserved, provider work begins, manual production work starts, a report is delivered or final output is made available.</p>

        <h2>9. Changes to the service</h2>
        <p>We may update packages, features, prices, provider availability, credit costs and these Terms as the platform evolves. Material changes will be reflected on this page or inside the dashboard.</p>

        <h2>10. Contact</h2>
        <p>For support or billing questions, contact <a href="mailto:support@crelavo.com">support@crelavo.com</a>.</p>
      </section>
    </main>
  );
}
