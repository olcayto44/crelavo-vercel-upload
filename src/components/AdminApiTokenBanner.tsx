"use client";

import { useEffect, useState } from "react";
import { adminApiTokenHelpText, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";

export function AdminApiTokenBanner() {
  const [adminToken, setAdminToken] = useState("");

  useEffect(() => {
    setAdminToken(getStoredAdminApiToken());
  }, []);

  function updateToken(value: string) {
    setAdminToken(value);
    rememberAdminApiToken(value);
  }

  return (
    <section className="card admin-wide-card">
      <span className="badge">Production admin security</span>
      <div className="brief-two-col">
        <div>
          <h3 style={{ marginTop: 0 }}>Admin API token</h3>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>{adminApiTokenHelpText()} Pages that auto-load admin data will use this saved token with your signed-in admin email.</p>
        </div>
        <div className="field">
          <label>Admin API token</label>
          <input value={adminToken} onChange={(event) => updateToken(event.target.value)} placeholder="ADMIN_API_TOKEN" type="password" autoComplete="off" />
        </div>
      </div>
    </section>
  );
}
