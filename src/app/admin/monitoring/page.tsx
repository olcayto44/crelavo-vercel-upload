import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { apiAfterKeysReviewList, monitoringBackupLoggingControls } from "@/lib/launch-final-controls";

function statusClass(status: string) {
  if (status === "active") return "ready";
  if (status.includes("blocked") || status.includes("needs")) return "active";
  return "failed";
}

export default function AdminMonitoringPage() {
  return (
    <AdminShell title="Backup / Monitoring / Error Logging" description="Final operational monitoring, backup and error logging checklist before public launch.">
      <section className="card admin-wide-card">
        <span className="badge">Operations readiness</span>
        <h2>Monitoring and backup controls</h2>
        <div className="provider-job-list">
          {monitoringBackupLoggingControls.map((item) => (
            <div className={`provider-job-chip ${statusClass(item.status)}`} key={item.area}>
              <strong>{item.area}</strong>
              <span>{item.status.replaceAll("_", " ")}</span>
              <small>{item.check}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">API/env sonrası tekrar bakılacak</span>
        <ul>{apiAfterKeysReviewList.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="url-action-center" style={{ marginTop: 14 }}>
          <Link className="btn" href="/admin/backup">Backup</Link>
          <Link className="btn secondary" href="/admin/analytics">Analytics</Link>
          <Link className="btn secondary" href="/admin/providers">Provider Readiness</Link>
          <Link className="btn secondary" href="/admin/api-guard">API Guard</Link>
        </div>
      </section>
    </AdminShell>
  );
}
