"use client";

import { useState } from "react";

export function AdminCreateAdminManager() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password })
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
  }

  return (
    <section className="card admin-wide-card">
      <span className="badge">Admin yönetimi</span>
      <h2>Yeni admin oluştur</h2>
      <p style={{ color: "var(--muted)" }}>Buradan oluşturulan hesap normal kullanıcı listesine karışmaz; rolü admin olarak kaydedilir ve admin giriş ekranından e-posta + şifre ile giriş yapabilir.</p>
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
        <div className="field" style={{ alignSelf: "end" }}>
          <button className="btn" type="submit" disabled={loading}>{loading ? "Oluşturuluyor..." : "Admin oluştur"}</button>
        </div>
      </form>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}
