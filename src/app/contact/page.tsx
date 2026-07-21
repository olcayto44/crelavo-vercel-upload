import Link from "next/link";
import { Header } from "@/components/Header";
import { ContactForm } from "@/components/ContactForm";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata = {
  title: "Contact Crelavo | Production Support and Account Help",
  description: "Reach Crelavo support for production delivery, account help, AI + human QA creative requests and launch preparation.",
  alternates: { canonical: "/contact" }
};

const contactCards = [
  {
    title: "Production support",
    body: "Questions about active productions, delivery status, revisions, provider failures, or admin review should start from the production dashboard so the production ID stays connected.",
    href: "/dashboard/productions",
    label: "Open productions"
  },
  {
    title: "Project and package questions",
    body: "For websites, mobile apps, SaaS panels, e-commerce campaigns, AI videos, voice, brand kits, and AI + human QA requests, start a structured brief in the assistant workspace.",
    href: "/dashboard/assistant-workspace",
    label: "Start a brief"
  },
  {
    title: "Credits and account help",
    body: "For credit balance, package readiness, account access, and non-payment launch checks, use the dashboard credit and account areas before opening a production request.",
    href: "/dashboard/credits",
    label: "Open credits"
  }
];

export default async function ContactPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <section className="blog-hero-panel">
          <span className="badge">Contact</span>
          <h1>Contact Crelavo</h1>
          <p>
            Reach the right Crelavo support path for production delivery, account help, AI + human QA creative requests, and launch preparation.
          </p>
          <div className="button-nav" style={{ marginTop: 18 }}>
            <Link className="btn" href="/dashboard/assistant-workspace">Start production</Link>
            <Link className="btn secondary" href="/dashboard/productions">Open dashboard</Link>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h2>Send a contact request</h2>
          <p style={{ color: "var(--muted)" }}>
            Fill out the form below for support, launch, account, or AI + human QA delivery questions. The security check helps block automated spam submissions.
          </p>
          <ContactForm />
        </section>

        <section className="grid" style={{ marginTop: 24 }}>
          {contactCards.map((card) => (
            <Link className="card clickable-credit-card" href={card.href} key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <span className="btn">{card.label}</span>
            </Link>
          ))}
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h2>Direct contact</h2>
          <p style={{ color: "var(--muted)" }}>
            Use dashboard paths first for production-specific issues. For general launch, partnership, or account questions, contact Crelavo directly.
          </p>
          <div className="grid" style={{ marginTop: 16 }}>
            <div>
              <strong>Email</strong>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>support@crelavo.com</p>
            </div>
            <div>
              <strong>Support priority</strong>
              <p style={{ color: "var(--muted)", marginTop: 6 }}>Active production blockers, delivery issues, account access, and launch readiness requests.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
