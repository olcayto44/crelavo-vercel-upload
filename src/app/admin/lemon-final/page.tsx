import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { lemonFinalControls } from "@/lib/launch-final-controls";

function statusClass(status: string) {
  if (status === "whop_active" || status === "active") return "ready";
  if (status === "postponed" || status === "manual_later" || status === "parked") return "active";
  return "failed";
}

export default function AdminLemonFinalPage() {
  return (
    <AdminShell title="Lemon Integration — Last" description="Final Lemon review page. Whop stays active; Lemon remains postponed until all launch/payment/provider checks are stable.">
      <section className="card admin-wide-card">
        <span className="badge">Do last</span>
        <h2>Lemon is parked; Whop remains active</h2>
        <p style={{ color: "var(--muted)" }}>This page exists so Lemon is visible as the final task without accidentally switching the live payment path away from Whop.</p>
        <div className="provider-job-list">
          {lemonFinalControls.map((item) => (
            <div className={`provider-job-chip ${statusClass(item.status)}`} key={item.area}>
              <strong>{item.area}</strong>
              <span>{item.status.replaceAll("_", " ")}</span>
              <small>{item.check}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Before Lemon</span>
        <ul>
          <li>Finish real Whop payment + automatic subscription test.</li>
          <li>Finish payment notification / user email / automatic credit loading checks.</li>
          <li>Finish provider API connections and real provider smoke tests.</li>
          <li>Confirm legal, monitoring, fraud guard and launch pages are stable.</li>
        </ul>
        <div className="url-action-center" style={{ marginTop: 14 }}><Link className="btn" href="/admin/payments">Whop payments</Link><Link className="btn secondary" href="/admin/providers">Provider readiness</Link></div>
      </section>
    </AdminShell>
  );
}
