import { AdminShell } from "@/components/AdminShell";
import { AdminProductionsTable } from "@/components/AdminProductionsTable";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminProductionsPage() {
  const { data: jobs, error: jobsError } = await supabaseAdmin().from("production_jobs").select("id,user_id,production_id,type,status,fail_code,fail_message,credits_cost,provider,heartbeat_at,created_at").order("created_at", { ascending: false }).limit(100);
  return <AdminShell title="All production requests" description="Manage requests from all production categories by status, notes, and delivery links.">
    <section className="card admin-wide-card" style={{ marginBottom: 20, overflowX: "auto" }}><span className="badge">Production jobs</span><h2>Provider job health</h2>{jobsError ? <p>production_jobs okunamadı. Supabase migration durumunu kontrol et.</p> : jobs?.length ? <table><thead><tr><th>Type</th><th>Status</th><th>Provider</th><th>Failure</th><th>Credits</th><th>Heartbeat</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td>{job.type}</td><td>{job.status}</td><td>{job.provider || "—"}</td><td>{job.fail_code || job.fail_message || "—"}</td><td>{job.credits_cost}</td><td>{job.heartbeat_at ? new Date(job.heartbeat_at).toLocaleString("tr-TR") : "—"}</td></tr>)}</tbody></table> : <p>Henüz production job kaydı yok.</p>}</section>
    <section className="card admin-wide-card"><AdminProductionsTable /></section>
  </AdminShell>;
}
