"use client";

import { useState } from "react";

const permissionOptions = [
  { key: "users", label: "Member management", note: "View member details and review users" },
  { key: "credits", label: "Credit operations", note: "Add, deduct, and review credit history" },
  { key: "productions", label: "Productions", note: "Production requests, delivery, and status checks" },
  { key: "support", label: "Support / incoming email", note: "Review messages and reply to users" },
  { key: "finance", label: "Finance", note: "Revenue, payments, provider costs, and margin screens" },
  { key: "content", label: "Site content", note: "Packages, category cards, site copy, and SEO" },
  { key: "providers", label: "Provider / API", note: "Provider, API guard, monitoring, and technical checks" },
  { key: "growth", label: "Growth / partner", note: "Affiliate, growth, analytics, and launch pages" },
  { key: "owner", label: "Full access / owner", note: "All admin areas and new admin creation" }
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
      setMessage(data.error ?? "Admin could not be created.");
      return;
    }

    setMessage(`Admin created: ${data.admin?.email ?? email}. This person can sign in from the admin login screen with email and password.`);
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
