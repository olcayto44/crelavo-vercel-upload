"use client";

import { useState } from "react";

export function AdminLoginPanel() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
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

    setMessage("Admin login successful. Opening panel...");
    window.location.reload();
  }

  return (
    <main className="container section admin-login-page">
      <section className="admin-login-card">
        <div className="logo admin-login-logo"><span className="logo-mark">▶</span><span>Crelavo Admin</span></div>
        <span className="badge">Secure admin login</span>
        <h1>Admin panel login</h1>
        <p>The admin panel is not public. Enter your username or email and password to continue.</p>
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
          <button className="btn" type="submit" disabled={loading}>{loading ? "Checking..." : "Enter admin panel"}</button>
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
