import { AdminShell } from "@/components/AdminShell";
import { getPersistedLiveVisitorSnapshot } from "@/lib/live-visitors";

export const dynamic = "force-dynamic";

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

export default async function AdminLivePage() {
  const snapshot = await getPersistedLiveVisitorSnapshot();
  const activeVisitors = snapshot.activeVisitors;
  const pages = snapshot.pages;
  const rows = pages.flatMap((page) => page.sessions.map((session) => ({ ...session, path: page.path })));

  return (
    <AdminShell title="Live visitors" description="Son 60 saniyede heartbeat gönderen gerçek ziyaretçi oturumları; mobil ve masaüstü birlikte sayılır.">
      <section className="card-grid">
        <article className="card"><span className="badge">Active now</span><h3>{activeVisitors}</h3><p>Tekil aktif ziyaretçi</p></article>
        <article className="card"><span className="badge">Pages</span><h3>{pages.length}</h3><p>Aktif sayfa</p></article>
        <article className="card"><span className="badge">Window</span><h3>{snapshot.activeWindowSeconds}s</h3><p>Son heartbeat aralığı</p></article>
      </section>
      <section className="card" style={{ marginTop: 16, overflowX: "auto" }}>
        <h3>Recent presence</h3>
        {!rows.length ? <p>Şu anda aktif ziyaretçi görünmüyor.</p> : <table><thead><tr><th>Visitor</th><th>Path</th><th>Device</th><th>Country</th><th>Seen at</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.sessionId}-${row.lastSeenAt}`}><td>{row.sessionId.slice(0, 12)}</td><td>{row.path || "/"}</td><td>{/mobile|android|iphone|ipad/i.test(row.userAgent || "") ? "mobile" : "desktop"}</td><td>{row.country || "—"}</td><td>{formatTime(row.lastSeenAt)}</td></tr>)}</tbody></table>}
      </section>
    </AdminShell>
  );
}