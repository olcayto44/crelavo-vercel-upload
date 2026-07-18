"use client";

import { useEffect } from "react";
import { adminApiTokenHelpText, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";

type AdminCredentialFieldsProps = {
  adminEmail: string;
  adminToken: string;
  onAdminEmailChange: (value: string) => void;
  onAdminTokenChange: (value: string) => void;
  emailPlaceholder?: string;
};

export function AdminCredentialFields({
  adminEmail,
  adminToken,
  onAdminEmailChange,
  onAdminTokenChange,
  emailPlaceholder = "ADMIN_EMAIL"
}: AdminCredentialFieldsProps) {
  useEffect(() => {
    if (!adminToken) onAdminTokenChange(getStoredAdminApiToken());
  }, [adminToken, onAdminTokenChange]);

  function handleTokenChange(value: string) {
    onAdminTokenChange(value);
    rememberAdminApiToken(value);
  }

  return (
    <>
      <div className="field">
        <label>Admin email</label>
        <input value={adminEmail} onChange={(event) => onAdminEmailChange(event.target.value)} placeholder={emailPlaceholder} />
      </div>
      <div className="field">
        <label>Admin API token</label>
        <input value={adminToken} onChange={(event) => handleTokenChange(event.target.value)} placeholder="ADMIN_API_TOKEN" type="password" autoComplete="off" />
        <small style={{ color: "var(--muted)" }}>{adminApiTokenHelpText()}</small>
      </div>
    </>
  );
}
