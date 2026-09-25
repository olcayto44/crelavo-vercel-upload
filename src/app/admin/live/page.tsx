import { AdminShell } from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

export default async function AdminLivePage() {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data, error } = await supabaseAdmin().from("presence").select("id,user_id,guest_id,path,device,country,seen_at").gte("seen_at", since).order("seen_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const unique = new Set(rows.map((row) => row.user_id || row.guest_id).filter(Boolean)).size;

  return (
    <AdminShell title="Live visitors" description="Son 60 saniyede presence beacon gönderen ziyaretçiler.">
      <section className="card-grid">
        <article className="card"><span className="badge">Active now</span><h3>{unique}</h3><p>Tekil ziyaretçi</p></article>
        <article className="card"><span className="badge">Events</span><h3>{rows.length}</h3><p>Son dakika beacon</p></article>
        <article className="card"><span className="badge">Status</span><h3>{error ? "Error" : "Live"}</h3><p>{error ? "Supabase okunamadı" : "Presence aktif"}</p></article>
      </section>
      <section className="card" style={{ marginTop: 16, overflowX: "auto" }}>
        <h3>Recent presence</h3>
        {error ? <p>Presence verisi okunamadı.</p> : rows.length === 0 ? <p>Şu anda aktif ziyaretçi görünmüyor.</p> : <table><thead><tr><th>Visitor</th><th>Path</th><th>Device</th><th>Country</th><th>Seen at</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.user_id ? `User ${row.user_id.slice(0, 8)}` : `Guest ${(row.guest_id || "").slice(0, 8)}`}</td><td>{row.path || "/"}</td><td>{row.device || "—"}</td><td>{row.country || "—"}</td><td>{formatTime(row.seen_at)}</td></tr>)}</tbody></table>}
      </section>
    </AdminShell>
  );
}
