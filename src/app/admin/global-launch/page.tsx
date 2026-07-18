import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { aiDirectorySubmissionKit, aiDirectorySubmissionTargets } from "@/lib/organic-directory";
import { productHuntGlobalLaunchControls } from "@/lib/launch-final-controls";

function statusClass(status: string) {
  if (status.includes("ready")) return "ready";
  if (status.includes("wait") || status.includes("needs")) return "active";
  return "failed";
}

export default function AdminGlobalLaunchPage() {
  return (
    <AdminShell title="Product Hunt / Global Launch" description="Final launch preparation for Product Hunt, AI directories, launch copy, public proof and community launch timing.">
      <section className="card admin-wide-card">
        <span className="badge">Global launch control</span>
        <h2>Product Hunt waits; directory prep is ready</h2>
        <div className="provider-job-list">
          {productHuntGlobalLaunchControls.map((item) => (
            <div className={`provider-job-chip ${statusClass(item.status)}`} key={item.area}>
              <strong>{item.area}</strong>
              <span>{item.status.replaceAll("_", " ")}</span>
              <small>{item.check}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch copy</span>
        <h2>{aiDirectorySubmissionKit.productName}</h2>
        <p><strong>One-line:</strong> {aiDirectorySubmissionKit.oneLinePitch}</p>
        <p>{aiDirectorySubmissionKit.shortDescription}</p>
        <h3>Public links</h3>
        <ul>{aiDirectorySubmissionKit.publicLinks.map((link) => <li key={link}>{link}</li>)}</ul>
      </section>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Directory / launch targets</span>
        <div className="admin-category-grid">
          {aiDirectorySubmissionTargets.map((target) => <div className="card admin-category-card" key={target.name}><span className="badge">{target.priority} · {target.status}</span><h3>{target.name}</h3><p>{target.type} · {target.category}</p><p>{target.fit}</p></div>)}
        </div>
        <div className="url-action-center" style={{ marginTop: 14 }}><Link className="btn" href="/admin/growth">Open growth directory kit</Link></div>
      </section>
    </AdminShell>
  );
}
