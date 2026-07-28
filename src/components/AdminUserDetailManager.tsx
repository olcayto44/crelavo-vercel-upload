"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEmailComposer } from "@/components/AdminEmailComposer";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role?: string;
  provider?: string;
  email_confirmed?: boolean;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  country: string;
  city: string;
  ip: string;
  credits: number;
  reserved: number;
  available: number;
  bonus_credits: number;
  credit_value_usd: number;
  purchased_credits: number;
  spent_credits: number;
  purchased_packages: string[];
  balance_updated_at?: string | null;
};

type CreditEvent = { id?: string; type: string; amount: number; note?: string | null; created_at?: string | null };
type ProductionItem = { id: string; title?: string | null; prompt?: string | null; production_type?: string | null; status?: string | null; automation_status?: string | null; package_id?: string | null; estimated_credits?: number | null; reserved_credits?: number | null; final_video_url?: string | null; created_at?: string | null; updated_at?: string | null };
type MessageItem = { id?: string; email?: string | null; source?: string | null; offer?: string | null; status?: string | null; page_url?: string | null; metadata?: any; created_at?: string | null };
type OutgoingEmail = { id?: string; recipient_email?: string | null; subject?: string | null; body?: string | null; status?: string | null; created_at?: string | null };

type DetailState = {
  user: UserDetail;
  creditEvents: CreditEvent[];
  productions: ProductionItem[];
  legacyVideoRequests: ProductionItem[];
  incomingMessages: MessageItem[];
  outgoingEmails: OutgoingEmail[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function messageText(item: MessageItem) {
  const metadata = item.metadata ?? {};
  return String(metadata.message ?? metadata.note ?? item.offer ?? "No message body recorded.");
}

export function AdminUserDetailManager({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [creditAmount, setCreditAmount] = useState("500");
  const [banHours, setBanHours] = useState("24");
  const [note, setNote] = useState("Manual admin adjustment");
  const [message, setMessage] = useState("Loading user detail...");
  const [loading, setLoading] = useState(false);

  async function loadDetail() {
    setLoading(true);
    const token = getStoredAdminApiToken();
    const response = await fetch(`/api/admin/users/${userId}`, { headers: adminApiHeaders("", token), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !data.user) {
      setDetail(null);
      setMessage(data.error ?? "User detail could not be loaded.");
      return;
    }

    setDetail(data);
    setMessage("User detail loaded.");
  }

  useEffect(() => {
    loadDetail();
  }, [userId]);

  async function runUserAction(action: "delete_user" | "suspend_user" | "timed_ip_ban" | "unsuspend_user") {
    if (!detail?.user) return;
    if (action === "delete_user" && !window.confirm(`Delete ${detail.user.email}? This cannot be undone.`)) return;

    setLoading(true);
    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: adminApiHeaders("", adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ user_id: detail.user.id, action, ban_hours: Number(banHours), note })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "User admin action failed.");
      return;
    }

    setMessage(data.message ?? "User admin action completed.");
    if (action === "delete_user") window.location.href = "/admin/users";
    else await loadDetail();
  }

  async function adjustCredits(action: "add" | "remove") {
    if (!detail?.user) return;

    setLoading(true);
    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: adminApiHeaders("", adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ email: detail.user.email, amount: Number(creditAmount), action, note })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Credit operation failed.");
      return;
    }

    setMessage(action === "add" ? "Credits were added successfully." : "Credits were removed successfully.");
    await loadDetail();
  }

  if (!detail) {
    return <section className="card admin-wide-card"><h2>Üye detayı</h2><p className="form-message">{message}</p><Link className="btn secondary" href="/admin/users">Üyelere dön</Link></section>;
  }

  const user = detail.user;
  const allProductions = [...detail.productions, ...detail.legacyVideoRequests];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card selected-billing-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span className="badge">Üye detayı</span>
            <h2>{user.name}</h2>
            <p>{user.email} • {user.city}, {user.country} • {user.ip}</p>
          </div>
          <Link className="btn secondary" href="/admin/users">Tüm üyelere dön</Link>
        </div>
        <div className="admin-info-grid" style={{ marginTop: 14 }}>
          <div><span>ID</span><strong className="admin-long-id">{user.id}</strong><small>Supabase user id</small></div>
          <div><span>E-posta</span><strong>{user.email}</strong><small>{user.email_confirmed ? "Onaylı" : "Onay bekliyor"}</small></div>
          <div><span>Ülke / şehir</span><strong>{user.country}</strong><small>{user.city}</small></div>
          <div><span>Kayıt tarihi</span><strong>{formatDate(user.created_at)}</strong><small>Son giriş: {formatDate(user.last_sign_in_at)}</small></div>
          <div><span>Alınan kredi paketi</span><strong>{user.purchased_packages.length ? user.purchased_packages.join(", ") : "-"}</strong><small>Yüklenen kredi: {user.purchased_credits.toLocaleString()}</small></div>
          <div><span>Kullanılan kredi</span><strong>{user.spent_credits.toLocaleString()}</strong><small>Üretim harcaması</small></div>
          <div><span>Kalan kredi</span><strong>{user.available.toLocaleString()}</strong><small>Toplam {user.credits.toLocaleString()} · Reserved {user.reserved.toLocaleString()}</small></div>
          <div><span>Hesap durumu</span><strong>{user.banned_until ? "Askıda" : "Aktif"}</strong><small>{user.banned_until ? `Şu tarihe kadar: ${formatDate(user.banned_until)}` : "Aktif engel yok"}</small></div>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Kredi ve hesap aksiyonları</span>
        <h2>Kredi yükleme, engelleme, askıya alma ve silme</h2>
        <div className="admin-production-editor">
          <div className="field"><label>Kredi miktarı</label><input value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} /></div>
          <div className="field"><label>Askıya alma süresi, saat</label><input value={banHours} onChange={(event) => setBanHours(event.target.value)} /></div>
          <div className="field"><label>İşlem notu</label><input value={note} onChange={(event) => setNote(event.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button className="btn" type="button" disabled={loading} onClick={() => adjustCredits("add")}>Kredi yükle</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => adjustCredits("remove")}>Kredi düş</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("suspend_user")}>Askıya al</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("timed_ip_ban")}>Süreli engelle</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("unsuspend_user")}>Engeli kaldır</button>
          <button className="btn danger" type="button" disabled={loading} onClick={() => runUserAction("delete_user")}>Sil</button>
          {message ? <span className="badge">{message}</span> : null}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Kredi geçmişi</span>
        <h2>Alınan, kullanılan ve manuel değişen krediler</h2>
        <div className="admin-table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Tip</th><th>Miktar</th><th>Not / paket</th></tr></thead><tbody>
          {detail.creditEvents.map((event, index) => <tr key={event.id ?? index}><td>{formatDate(event.created_at)}</td><td>{event.type}</td><td>{Number(event.amount ?? 0).toLocaleString()}</td><td>{event.note ?? "-"}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Üretim geçmişi</span>
        <h2>Kredileri hangi üretimde kullanmış</h2>
        <div className="admin-table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Üretim</th><th>Tip/paket</th><th>Durum</th><th>Kredi</th><th>İstek konusu</th><th>Çıktı</th></tr></thead><tbody>
          {allProductions.map((item) => <tr key={item.id}><td>{formatDate(item.created_at)}</td><td><strong>{item.title ?? "Untitled"}</strong><br /><small>{item.id}</small></td><td>{item.production_type ?? "video"}<br /><small>{item.package_id ?? "-"}</small></td><td>{item.status ?? "-"}<br /><small>{item.automation_status ?? ""}</small></td><td>{Number(item.reserved_credits ?? item.estimated_credits ?? 0).toLocaleString()}</td><td>{item.prompt ?? "-"}</td><td>{item.final_video_url ? <a href={item.final_video_url} target="_blank">Aç</a> : "-"}</td></tr>)}
        </tbody></table></div>
        {!allProductions.length ? <p className="form-message">Bu üyeye ait üretim kaydı bulunamadı.</p> : null}
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Gelen mesajlar</span>
        <h2>Şikayet, bilgi, problem ve support kayıtları</h2>
        <div className="admin-message-thread">
          {detail.incomingMessages.map((item, index) => (
            <div className="mini-card" key={item.id ?? index}>
              <strong>{item.offer ?? item.source ?? "Gelen mesaj"}</strong>
              <small>{formatDate(item.created_at)} · {item.status ?? "captured"} · {item.page_url ?? "-"}</small>
              <p>{messageText(item)}</p>
            </div>
          ))}
          {!detail.incomingMessages.length ? <p className="form-message">Bu kullanıcıdan kayıtlı contact/support mesajı görünmüyor.</p> : null}
        </div>
      </section>

      <AdminEmailComposer
        title="Bu üyeye cevap yaz"
        description="Kullanıcıya support, kredi, üretim veya hesap cevabını buradan gönder. Gönderim başarılı olursa admin e-posta log tablosu varsa cevap geçmişinde tutulur."
        defaultTargetType="one_user"
        defaultRecipientEmail={user.email}
        defaultSubject="Crelavo support update"
        defaultBody={`Hello ${user.name},\n\nWe are contacting you about your Crelavo account/request.\n\n`}
        allowBulkUsers={false}
      />

      <section className="card admin-wide-card">
        <span className="badge">Cevap geçmişi</span>
        <h2>Admin tarafından gönderilen cevaplar</h2>
        <div className="admin-message-thread">
          {detail.outgoingEmails.map((item, index) => (
            <div className="mini-card" key={item.id ?? index}>
              <strong>{item.subject ?? "Admin reply"}</strong>
              <small>{formatDate(item.created_at)} · {item.status ?? "sent"}</small>
              <p>{item.body ?? "-"}</p>
            </div>
          ))}
          {!detail.outgoingEmails.length ? <p className="form-message">Henüz kayıtlı admin cevabı yok. E-posta log tablosu yoksa gönderimler Resend üzerinden gider ama burada geçmiş görünmeyebilir.</p> : null}
        </div>
      </section>
    </div>
  );
}
