"use client";

import { useState } from "react";

const permissionOptions = [
  { key: "users", label: "Üye yönetimi", note: "Üye detaylarını görme, kullanıcı inceleme" },
  { key: "credits", label: "Kredi işlemleri", note: "Kredi yükleme/düşme ve kredi geçmişi" },
  { key: "productions", label: "Üretimler", note: "Üretim istekleri, teslimat ve durum kontrolü" },
  { key: "support", label: "Destek / gelen e-posta", note: "Gelen mesajlar ve kullanıcıya cevap yazma" },
  { key: "finance", label: "Finans", note: "Gelir, ödeme, provider maliyeti ve marj ekranları" },
  { key: "content", label: "Site içerikleri", note: "Paketler, kategori kartları, site metinleri ve SEO" },
  { key: "providers", label: "Provider / API", note: "Sağlayıcı, API guard, monitoring ve teknik kontroller" },
  { key: "growth", label: "Growth / partner", note: "Affiliate, growth, analytics ve launch sayfaları" },
  { key: "owner", label: "Tam yetki / owner", note: "Tüm admin alanları ve yeni admin oluşturma" }
];

export function AdminCreateAdminManager() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["users", "support"]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function togglePermission(key: string) {
    setPermissions((current) => {
      if (key === "owner") return current.includes("owner") ? [] : permissionOptions.map((item) => item.key);
      const withoutOwner = current.filter((item) => item !== "owner");
      return withoutOwner.includes(key) ? withoutOwner.filter((item) => item !== key) : [...withoutOwner, key];
    });
  }

  async function createAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password, permissions })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Admin oluşturulamadı.");
      return;
    }

    setMessage(`Admin oluşturuldu: ${data.admin?.email ?? email}. Bu kişi admin giriş ekranından e-posta + şifre ile girebilir.`);
    setFullName("");
    setEmail("");
    setPassword("");
    setPermissions(["users", "support"]);
  }

  return (
    <section className="card admin-wide-card">
      <span className="badge">Admin yönetimi</span>
      <h2>Yeni admin oluştur</h2>
      <p style={{ color: "var(--muted)" }}>Buradan oluşturulan hesap normal kullanıcı listesine karışmaz; rolü admin olarak kaydedilir. Hangi alanları açmak istiyorsan tikle, yetki kaydı o hesaba yazılır.</p>
      <form className="admin-production-editor" onSubmit={createAdmin}>
        <div className="field">
          <label>Ad soyad</label>
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Admin adı" required />
        </div>
        <div className="field">
          <label>Admin e-posta</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" type="email" required />
        </div>
        <div className="field">
          <label>Geçici şifre</label>
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 10 karakter" type="password" minLength={10} required />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Bu admine verilecek yetkiler</label>
          <div className="admin-permission-grid">
            {permissionOptions.map((item) => (
              <label className="admin-permission-card" key={item.key}>
                <input type="checkbox" checked={permissions.includes(item.key)} onChange={() => togglePermission(item.key)} />
                <span><strong>{item.label}</strong><small>{item.note}</small></span>
              </label>
            ))}
          </div>
          <small>Not: Yetkiler hesap kaydına yazılır ve kritik admin API route’larında kontrol edilir. Owner yetkisi tüm alanlara ve yeni admin oluşturma işlemine erişir.</small>
        </div>
        <div className="field" style={{ alignSelf: "end" }}>
          <button className="btn" type="submit" disabled={loading || permissions.length === 0}>{loading ? "Oluşturuluyor..." : "Admin oluştur"}</button>
        </div>
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
