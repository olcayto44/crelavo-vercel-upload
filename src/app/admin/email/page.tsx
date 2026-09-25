import { AdminShell } from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const { data, error } = await supabaseAdmin().from("email_logs").select("id,to_email,template,subject,status,error,created_at").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const sent = rows.filter((row) => row.status === "sent").length;
  const failed = rows.filter((row) => row.status !== "sent").length;
  return <AdminShell title="Email operations" description="Kullanıcıya gönderilen ödeme, kredi ve operasyon maillerinin gerçek logları.">
    <section className="card-grid"><article className="card"><span className="badge">Logged</span><h3>{rows.length}</h3><p>Son 100 kayıt</p></article><article className="card"><span className="badge">Sent</span><h3>{sent}</h3><p>Başarılı gönderim</p></article><article className="card"><span className="badge">Failed</span><h3>{failed}</h3><p>Başarısız/inceleme</p></article></section>
    <section className="card" style={{ marginTop: 16, overflowX: "auto" }}><h3>Email log</h3>{error ? <p>email_logs okunamadı. Migration’ın canlı Supabase’de çalıştığını kontrol et.</p> : rows.length === 0 ? <p>Henüz email logu yok.</p> : <table><thead><tr><th>Alıcı</th><th>Template</th><th>Konu</th><th>Durum</th><th>Tarih</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.to_email}</td><td>{row.template}</td><td>{row.subject}</td><td>{row.status}{row.error ? ` — ${row.error}` : ""}</td><td>{new Date(row.created_at).toLocaleString("tr-TR")}</td></tr>)}</tbody></table>}</section>
  </AdminShell>;
}
