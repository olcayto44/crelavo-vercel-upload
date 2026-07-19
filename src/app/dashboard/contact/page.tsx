import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";

const contactOptions = [
  {
    title: "Production support",
    description: "Use this path for active productions, delivery questions, revision status, provider failures, or refund review requests.",
    action: "Open productions",
    href: "/dashboard/productions"
  },
  {
    title: "Account and credit help",
    description: "Use this path for credit balance questions, package selection, billing preparation, and non-payment account checks.",
    action: "Open credits",
    href: "/dashboard/credits"
  },
  {
    title: "AI + Human QA request",
    description: "Start a new expert-reviewed production brief for websites, mobile apps, SaaS panels, product campaigns, videos, voice, or brand kits.",
    action: "Start production",
    href: "/dashboard/assistant-workspace"
  }
];

export default function DashboardContactPage() {
  return (
    <DashboardShell>
      <section className="card">
        <span className="badge">Contact</span>
        <h1 style={{ marginBottom: 8 }}>Contact Crelavo</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Choose the fastest support path for your production, account, or AI + human QA request. Public contact details can be managed from the admin content area later.
        </p>
      </section>

      <section className="grid" style={{ marginTop: 20 }}>
        {contactOptions.map((option) => (
          <Link className="card clickable-credit-card" href={option.href} key={option.title}>
            <h3>{option.title}</h3>
            <p>{option.description}</p>
            <span className="btn">{option.action}</span>
          </Link>
        ))}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Direct support details</h2>
        <p style={{ color: "var(--muted)" }}>
          For launch preparation, keep support requests inside the dashboard so production IDs, credit state, provider status, and delivery context stay connected.
        </p>
        <div className="grid" style={{ marginTop: 16 }}>
          <div>
            <strong>Email</strong>
            <p style={{ color: "var(--muted)", marginTop: 6 }}>support@crelavo.com</p>
          </div>
          <div>
            <strong>Response priority</strong>
            <p style={{ color: "var(--muted)", marginTop: 6 }}>Active production issues, delivery blockers, and account access requests first.</p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
