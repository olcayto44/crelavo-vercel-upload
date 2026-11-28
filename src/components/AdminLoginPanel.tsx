"use client";

import { useEffect,useState } from "react";

export function AdminLoginPanel() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [available,setAvailable]=useState<boolean|null>(null);
  useEffect(()=>{let active=true;fetch("/api/admin/login",{cache:"no-store",credentials:"same-origin"}).then(r=>r.json()).then(d=>{if(active&&typeof d.available==="boolean")setAvailable(d.available)}).catch(()=>{});return()=>{active=false}},[]);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
    const response = await fetch("/api/admin/login", {
      credentials:"same-origin",cache:"no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Admin login failed.");
      return;
    }

    const check=await fetch("/api/admin/login",{cache:"no-store",credentials:"same-origin"}).then(r=>r.json());
    if(!check.authenticated){setMessage("Giriş doğrulandı ancak oturum kaydedilemedi. Tarayıcı çerezlerini ve doğru test adresini kontrol edin.");return;}
    window.location.reload();
    }catch{setMessage("Giriş hizmetine ulaşılamadı. Bağlantıyı kontrol edip yeniden deneyin.");}finally{setLoading(false);}
  }

  return (
    <main className="container section admin-login-page">
      <section className="admin-login-card">
        <div className="logo admin-login-logo"><span className="logo-mark">▶</span><span>Crelavo Admin</span></div>
        <span className="badge">Secure admin login</span>
        <h1>Yönetim paneli girişi</h1>
        <p>Site sahibi hesabının kullanıcı adı veya e-posta adresi ile giriş yap.</p>{available===false&&<p role="alert" className="form-message">Bu test dağıtımında yönetici giriş yapılandırması eksik. Parola değiştirmeden Vercel ayarlarını kontrol et.</p>}<small>Giriş sürümü: admin-login-v3</small>
        <form onSubmit={submitLogin} className="admin-login-form">
          <div className="field">
            <label>Username or email</label>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              placeholder="admin or admin email"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Admin password"
              type="password"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading||available===false}>{loading ? "Kontrol ediliyor…" : "Yönetim paneline gir"}</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
        <p className="admin-login-warning">Even if the direct /admin link is opened, panel content is hidden until login succeeds.</p>
      </section>
    </main>
  );
}

export function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return <button className="btn secondary" type="button" onClick={logout} disabled={loading}>{loading ? "Logging out..." : "Admin logout"}</button>;
}
