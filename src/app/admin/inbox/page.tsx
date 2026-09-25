import { AdminShell } from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function text(value: unknown) { return String(value ?? "-"); }
function date(value: string | null) { return value ? new Date(value).toLocaleString("tr-TR") : "-"; }

export default async function AdminInboxPage() {
  const { data, error } = await supabaseAdmin().from("lead_captures").select("id,email,source,offer,status,ip_address,page_url,landing_url,referrer,utm_source,utm_campaign,metadata,created_at").order("created_at", { ascending: false }).limit(300);
  const rows = data ?? [];
  return <AdminShell title="Inbox / User messages" description="Contact, support, lead, checkout ve kampanya kaynaklı gelen kayıtları tek yerde incele.">
    <section className="card-grid"><article className="card"><span className="badge">All incoming</span><h3>{rows.length}</h3><p>Son 300 kayıt</p></article><article className="card"><span className="badge">Contact</span><h3>{rows.filter((row) => row.source === "contact_request").length}</h3><p>Destek/contact mesajı</p></article><article className="card"><span className="badge">Leads</span><h3>{rows.filter((row) => row.source !== "contact_request").length}</h3><p>Lead ve checkout kayıtları</p></article></section>
    <section className="card" style={{ marginTop: 16, overflowX: "auto" }}><h2>Gelen kayıtlar</h2>{error ? <p>Gelen kayıtlar okunamadı. Supabase migration ve service-role ayarlarını kontrol et.</p> : rows.length === 0 ? <p>Henüz gelen kayıt yok.</p> : <table><thead><tr><th>Tarih</th><th>Email</th><th>Kaynak</th><th>Konu / teklif</th><th>Mesaj</th><th>IP</th><th>Sayfa</th></tr></thead><tbody>{rows.map((row) => { const metadata = (row.metadata ?? {}) as Record<string, unknown>; return <tr key={row.id}><td>{date(row.created_at)}</td><td>{row.email}</td><td>{row.source}</td><td>{row.offer}</td><td>{text(metadata.message ?? metadata.topic ?? metadata.note)}</td><td>{row.ip_address || "-"}</td><td>{row.page_url || row.landing_url || "-"}</td></tr>; })}</tbody></table>}</section>
  </AdminShell>;
}
