import { AdminShell } from "@/components/AdminShell";
import { AdminCreditForm } from "@/components/AdminCreditForm";
import { AdminCreditRolloverOverview } from "@/components/AdminCreditRolloverOverview";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminCreditsPage() {
  const { data: ledger } = await supabaseAdmin().from("credit_ledger").select("id,user_id,delta,reason,whop_payment_id,note,created_at").order("created_at", { ascending: false }).limit(50);
  const { data: fulfillments } = await supabaseAdmin().from("payment_fulfillments").select("id,whop_payment_id,user_id,plan_id,product_title,amount_usd,credits,kind,status,billing_reason,created_at").order("created_at", { ascending: false }).limit(50);
  return (
    <AdminShell title="Credit Operations" description="Manual credit activation, payment-link review notes, receipt references and credit operations.">
      <section className="card admin-wide-card">
        <h2>Manual credit activation</h2>
        <p style={{ color: "var(--muted)" }}>Use this after verifying a Whop payment in Whop Dashboard, or to give a test user production credits for manual E2E. Add the same customer email, credit amount and payment/reference ID, then notify the user automatically.</p>
        <div className="workspace-action-note warning" style={{ marginBottom: 14 }}>
          Whop is the current billing source of record for checkout receipts, payments and memberships. Crelavo sends the credit activation email after admin review and stores the payment/reference ID in the credit event note. Use this form for normal credit purchases and Drone / Satellite Video credit packs. Do not use it for AI Live Sales Agent service plans because those have 0 account credits.
        </div>
        <AdminCreditForm />
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20, overflowX: "auto" }}><span className="badge">Live audit</span><h2>Whop fulfillments and credit ledger</h2>{!ledger?.length && !fulfillments?.length ? <p>Henüz audit kaydı yok veya migration canlı veritabanında uygulanmamış.</p> : <><h3>Payment fulfillments</h3><table><thead><tr><th>Ürün</th><th>Plan</th><th>Kredi</th><th>Durum</th><th>Payment</th><th>Tarih</th></tr></thead><tbody>{(fulfillments ?? []).map((row) => <tr key={row.id}><td>{row.product_title}</td><td>{row.plan_id}</td><td>{row.credits}</td><td>{row.status}</td><td>{row.whop_payment_id}</td><td>{new Date(row.created_at).toLocaleString("tr-TR")}</td></tr>)}</tbody></table><h3 style={{ marginTop: 18 }}>Credit ledger</h3><table><thead><tr><th>User</th><th>Delta</th><th>Reason</th><th>Payment</th><th>Tarih</th></tr></thead><tbody>{(ledger ?? []).map((row) => <tr key={row.id}><td>{row.user_id}</td><td>{row.delta}</td><td>{row.reason}</td><td>{row.whop_payment_id || "—"}</td><td>{new Date(row.created_at).toLocaleString("tr-TR")}</td></tr>)}</tbody></table></>}</section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Credit rollover</span>
        <h2>Unused credits rollover tracking</h2>
        <p style={{ color: "var(--muted)" }}>Monthly subscription credits roll over only while the subscription remains active, yearly credits stay available during the active annual period, and top-up credits stay in a separate 12-month bucket. Whop renewal webhooks update these buckets automatically after successful billing.</p>
        <AdminCreditRolloverOverview />
      </section>
    </AdminShell>
  );
}
