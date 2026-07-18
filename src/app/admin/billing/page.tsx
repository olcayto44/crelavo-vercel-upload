import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";

export default function AdminBillingPage() {
  return (
    <AdminShell title="Billing" description="Manage Whop checkout, payment references, subscriptions, failed renewals and one-time credit top-up payments.">
      <section className="card admin-billing-card">
        <span className="badge">Billing center</span>
        <h2>Subscription and payment management</h2>
        <p style={{ color: "var(--muted)" }}>Monthly and yearly credit packages renew through Whop. One-time top-up packages can be purchased repeatedly and do not renew automatically.</p>
        <div className="admin-info-grid">
          <div><span>Checkout</span><strong>/dashboard/payment</strong><small>User payment screen</small></div>
          <div><span>Subscriptions</span><strong>Automatic renewal</strong><small>Monthly/yearly Whop subscription payments</small></div>
          <div><span>Top-ups</span><strong>One-time payment</strong><small>Repeatable extra credit purchases</small></div>
          <div><span>Failed payments</span><strong>Planned workflow</strong><small>Past-due notices, card updates and temporary suspension</small></div>
        </div>
        <Link className="btn" href="/dashboard/payment">Open payment page</Link>
      </section>
    </AdminShell>
  );
}
