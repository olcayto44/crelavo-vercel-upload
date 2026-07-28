"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

type UserFinanceSummary = {
  total_revenue_usd: number;
  today_revenue_usd: number;
  weekly_revenue_usd: number;
  monthly_revenue_usd: number;
  spent_credits: number;
  purchased_packages: string[];
  latest_purchase_at?: string | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  ip: string;
  country: string;
  city: string;
  role?: string;
  provider?: string;
  email_confirmed?: boolean;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  credits: number;
  reserved?: number;
  available?: number;
  value: string;
  banned_until?: string | null;
  finance_summary?: UserFinanceSummary;
};

function formatAdminDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Live user data loads only after admin login is verified. No demo users are shown.");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const token = getStoredAdminApiToken();
    const response = await fetch("/api/admin/users", { headers: adminApiHeaders("", token), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !Array.isArray(data.users)) {
      setUsers([]);
      setMessage(data.error ?? "Live users could not be loaded. Demo users are hidden.");
      return;
    }

    setUsers(data.users);
    setMessage(`${data.users.length} members loaded.`);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const clean = query.toLowerCase().trim();
    const visibleUsers = users.filter((user) => String(user.role ?? "user").toLowerCase() !== "admin");
    if (!clean) return visibleUsers;
    return visibleUsers.filter((user) =>
      user.id.toLowerCase().includes(clean) ||
      user.name.toLowerCase().includes(clean) ||
      user.email.toLowerCase().includes(clean) ||
      user.ip.toLowerCase().includes(clean) ||
      user.country.toLowerCase().includes(clean)
    );
  }, [query, users]);

  const adminUsers = users.filter((user) => String(user.role ?? "").toLowerCase() === "admin");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <span className="badge">Üyeler</span>
        <h2>Alt alta üye listesi</h2>
        <p style={{ color: "var(--muted)" }}>
          Her üyeye tıklayınca kendi detay sayfası açılır. Detayda ID, e-posta, ülke, kayıt tarihi, kredi paketi, kullanılan/kalan kredi, üretim geçmişi, kredi yükleme, engelleme, askıya alma, silme ve e-posta cevap alanı bulunur.
        </p>
        <div className="field">
          <label>Üye ara</label>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad, e-posta, user ID, IP veya ülke yaz..." />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={loadUsers} disabled={loading}>{loading ? "Yükleniyor..." : "Canlı veriyi yenile"}</button>
          {message ? <span className="badge">{message}</span> : null}
        </div>
      </section>

      <section className="admin-member-list">
        {filteredUsers.map((user) => (
          <Link className="card admin-member-row" href={`/admin/users/${user.id}`} key={user.id}>
            <div>
              <span className="badge">{user.banned_until ? "Askıda" : user.email_confirmed ? "Onaylı" : "E-posta bekliyor"}</span>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <small className="admin-long-id">ID: {user.id}</small>
            </div>
            <div className="admin-member-row-metrics">
              <div><span>Ülke</span><strong>{user.country}</strong><small>{user.city}</small></div>
              <div><span>Kayıt</span><strong>{formatAdminDateTime(user.created_at)}</strong><small>Son giriş: {formatAdminDateTime(user.last_sign_in_at)}</small></div>
              <div><span>Kredi</span><strong>{(user.available ?? user.credits).toLocaleString()}</strong><small>Toplam {user.credits.toLocaleString()} · Reserved {(user.reserved ?? 0).toLocaleString()}</small></div>
              <div><span>Paket</span><strong>{user.finance_summary?.purchased_packages?.[0] ?? "-"}</strong><small>Kullanılan {(user.finance_summary?.spent_credits ?? 0).toLocaleString()}</small></div>
            </div>
            <span className="btn">Detay aç</span>
          </Link>
        ))}
        {!filteredUsers.length ? <section className="card admin-wide-card"><p className="form-message">Üye bulunamadı veya admin oturumu doğrulanmadı.</p></section> : null}
      </section>

      <section className="card admin-wide-card">
        <h2>Admin hesapları</h2>
        <p style={{ color: "var(--muted)" }}>Admin hesapları normal üyelerden ayrı tutulur.</p>
        <div className="admin-member-list compact">
          {adminUsers.map((user) => (
            <Link className="card admin-member-row" href={`/admin/users/${user.id}`} key={user.id}>
              <div>
                <span className="badge">Admin</span>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
              </div>
              <span className="btn secondary">Admin detay</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
