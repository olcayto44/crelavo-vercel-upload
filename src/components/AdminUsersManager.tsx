"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { AdminEmailComposer } from "@/components/AdminEmailComposer";

type LegalAcceptance = {
  id: string;
  production_id?: string | null;
  version: string;
  accepted_at?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  production_type?: string | null;
  package_id?: string | null;
  title?: string | null;
  responsibility_text?: string | null;
  rights_warranty_text?: string | null;
};

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
  legal_acceptance_count?: number;
  latest_legal_acceptance?: LegalAcceptance | null;
  banned_until?: string | null;
  finance_summary?: UserFinanceSummary;
};

const fallbackUsers: AdminUser[] = [];

function money(value?: number) {
  return `$${(value ?? 0).toFixed(2)}`;
}

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
  const [users, setUsers] = useState<AdminUser[]>(fallbackUsers);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(fallbackUsers[0]?.id ?? "");
  const [creditAmount, setCreditAmount] = useState("500");
  const [banHours, setBanHours] = useState("24");
  const [note, setNote] = useState("Manual admin adjustment");
  const [message, setMessage] = useState("Live user data loads only after admin login is verified. No demo users are shown.");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const token = getStoredAdminApiToken();

    const response = await fetch("/api/admin/users", { headers: adminApiHeaders("", token) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !Array.isArray(data.users)) {
      setUsers([]);
      setSelectedId("");
      setMessage(data.error ?? "Live users could not be loaded. Demo users are hidden.");
      return;
    }

    setUsers(data.users);
    setSelectedId(data.users[0]?.id ?? "");
    setMessage(`${data.users.length} users loaded.`);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const clean = query.toLowerCase().trim();
    if (!clean) return users;
    return users.filter((user) =>
      user.id.toLowerCase().includes(clean) ||
      user.name.toLowerCase().includes(clean) ||
      user.email.toLowerCase().includes(clean) ||
      user.ip.toLowerCase().includes(clean)
    );
  }, [query, users]);

  const adminUsers = filteredUsers.filter((user) => String(user.role ?? "").toLowerCase() === "admin");
  const normalUsers = filteredUsers.filter((user) => String(user.role ?? "user").toLowerCase() !== "admin");
  const selectedUser = users.find((user) => user.id === selectedId) ?? normalUsers[0] ?? adminUsers[0] ?? users[0];
  const latestLegal = selectedUser?.latest_legal_acceptance ?? null;

  async function runUserAction(action: "delete_user" | "suspend_user" | "timed_ip_ban" | "unsuspend_user") {
    if (!selectedUser) return;
    if (action === "delete_user" && !window.confirm(`Delete ${selectedUser.email}? This cannot be undone.`)) return;

    setLoading(true);
    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: adminApiHeaders("", adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ user_id: selectedUser.id, action, ban_hours: Number(banHours), note })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "User admin action failed.");
      return;
    }

    setMessage(data.message ?? "User admin action completed.");
    await loadUsers();
  }

  async function adjustCredits(action: "add" | "remove") {
    if (!selectedUser) return;

    setLoading(true);
    const adminToken = getStoredAdminApiToken();
    const response = await fetch("/api/admin/credits", {
      method: "POST",
      headers: adminApiHeaders("", adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ email: selectedUser.email, amount: Number(creditAmount), action, note })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Credit operation failed.");
      return;
    }

    setMessage(action === "add" ? "Credits were added successfully." : "Credits were removed successfully.");
    await loadUsers();
  }

  if (!selectedUser) return <section className="card admin-wide-card"><h2>Member list</h2><p className="form-message">No live user is loaded. Sign in with an admin account and admin token to view real users. Demo users are hidden.</p></section>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <h2>Search members</h2>
        <p style={{ color: "var(--muted)" }}>Find members by name, surname, email, ID or IP address.</p>
        <div className="field">
          <label>Search</label>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter name, user ID, email or IP..." />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={loadUsers} disabled={loading}>{loading ? "Loading..." : "Refresh live data"}</button>
          {message ? <span className="badge">{message}</span> : null}
        </div>
      </section>

      <section className="card admin-wide-card">
        <h2>Normal users</h2>
        <p style={{ color: "var(--muted)" }}>Customer/member accounts are listed separately from admin accounts and affiliate partners.</p>
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Full name</th><th>Email</th><th>IP / country</th><th>Provider</th><th>Email status</th><th>Created at</th><th>Last sign-in</th><th>Credits</th><th>Value</th><th>Action</th></tr>
            </thead>
            <tbody>
              {normalUsers.map((user) => (
                <tr key={user.id}>
                  <td className="admin-user-id-cell"><code>{user.id}</code></td>
                  <td>{user.name}</td>
                  <td className="admin-email-cell">{user.email}</td>
                  <td>{user.ip}<br /><small>{user.city}, {user.country}</small></td>
                  <td>{user.provider ?? "email"}</td>
                  <td>{user.banned_until ? "Suspended" : user.email_confirmed ? "Confirmed" : "Pending"}</td>
                  <td className="admin-date-cell">{formatAdminDateTime(user.created_at)}</td>
                  <td className="admin-date-cell">{formatAdminDateTime(user.last_sign_in_at)}</td>
                  <td>{user.credits.toLocaleString()}</td>
                  <td>{user.value}</td>
                  <td className="admin-table-actions"><button className="btn" type="button" onClick={() => setSelectedId(user.id)}>Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <h2>Admin users</h2>
        <p style={{ color: "var(--muted)" }}>Only role=admin profiles appear here. New admins can sign in through the admin login screen with their own email and password.</p>
        <div className="admin-table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Full name</th><th>Email</th><th>Provider</th><th>Email status</th><th>Created at</th><th>Last sign-in</th><th>Action</th></tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id}>
                  <td className="admin-user-id-cell"><code>{user.id}</code></td>
                  <td>{user.name}</td>
                  <td className="admin-email-cell">{user.email}</td>
                  <td>{user.provider ?? "email"}</td>
                  <td>{user.banned_until ? "Suspended" : user.email_confirmed ? "Confirmed" : "Pending"}</td>
                  <td className="admin-date-cell">{formatAdminDateTime(user.created_at)}</td>
                  <td className="admin-date-cell">{formatAdminDateTime(user.last_sign_in_at)}</td>
                  <td className="admin-table-actions"><button className="btn" type="button" onClick={() => setSelectedId(user.id)}>Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <h2>Affiliate / partner people</h2>
        <p style={{ color: "var(--muted)" }}>Affiliate and partner applicants are managed separately from normal members. Their referrals, package sales and commissions are reviewed inside Partner Program.</p>
        <Link className="btn" href="/admin/partners">Open Partner Program</Link>
      </section>

      <section className="card selected-billing-card">
        <span className="badge">Selected user</span>
        <h2>{selectedUser.name}</h2>
        <p>{selectedUser.email} • {selectedUser.ip} • {selectedUser.city}, {selectedUser.country}</p>
        <div className="admin-info-grid">
          <div><span>User ID</span><strong className="admin-long-id">{selectedUser.id}</strong><small>Supabase user id</small></div>
          <div><span>Created / registered</span><strong>{formatAdminDateTime(selectedUser.created_at)}</strong><small>User registration date</small></div>
          <div><span>Last sign-in</span><strong>{formatAdminDateTime(selectedUser.last_sign_in_at)}</strong><small>Latest login date</small></div>
          <div><span>Account status</span><strong>{selectedUser.banned_until ? "Suspended" : "Active"}</strong><small>{selectedUser.banned_until ? `Until ${formatAdminDateTime(selectedUser.banned_until)}` : "No active admin ban"}</small></div>
          <div><span>Total credits</span><strong>{selectedUser.credits.toLocaleString()}</strong><small>Credit balance</small></div>
          <div><span>Reserved credits</span><strong>{(selectedUser.reserved ?? 0).toLocaleString()}</strong><small>Active requests</small></div>
          <div><span>Available</span><strong>{(selectedUser.available ?? selectedUser.credits).toLocaleString()}</strong><small>{selectedUser.value}</small></div>
          <div><span>Legal acceptance</span><strong>{selectedUser.legal_acceptance_count ?? 0}</strong><small>{latestLegal ? `Latest ${latestLegal.version}` : "No accepted production terms"}</small></div>
        </div>

        <div className="dynamic-brief-panel" style={{ marginTop: 14 }}>
          <span className="badge">User finance</span>
          <h3>Daily, weekly and monthly value from this user</h3>
          <div className="admin-info-grid">
            <div><span>Today revenue</span><strong>{money(selectedUser.finance_summary?.today_revenue_usd)}</strong><small>Purchases in the last 24 hours</small></div>
            <div><span>Weekly revenue</span><strong>{money(selectedUser.finance_summary?.weekly_revenue_usd)}</strong><small>Purchases in the last 7 days</small></div>
            <div><span>Monthly revenue</span><strong>{money(selectedUser.finance_summary?.monthly_revenue_usd)}</strong><small>Purchases in the last 30 days</small></div>
            <div><span>Total revenue</span><strong>{money(selectedUser.finance_summary?.total_revenue_usd)}</strong><small>Estimated from user purchase credits</small></div>
            <div><span>Spent credits</span><strong>{(selectedUser.finance_summary?.spent_credits ?? 0).toLocaleString()}</strong><small>Completed production spend</small></div>
            <div><span>Latest purchase</span><strong>{formatAdminDateTime(selectedUser.finance_summary?.latest_purchase_at)}</strong><small>{selectedUser.finance_summary?.purchased_packages?.length ? selectedUser.finance_summary.purchased_packages.join(", ") : "No package purchase recorded"}</small></div>
          </div>
        </div>

        <AdminEmailComposer
          title="Email this selected user"
          description="Send a one-to-one operational, billing or support email directly from the admin panel. Bulk normal-user email is available below."
          defaultTargetType="one_user"
          defaultRecipientEmail={selectedUser.email}
          defaultSubject="Crelavo account update"
          defaultBody={`Hello ${selectedUser.name},\n\nWe are contacting you about your Crelavo account.\n\n`}
          allowBulkUsers
        />

        <div className="dynamic-brief-panel" style={{ marginTop: 14 }}>
          <span className="badge">Legal Acceptance Records</span>
          <h3>Production liability acceptance</h3>
          {latestLegal ? (
            <div style={{ display: "grid", gap: 10 }}>
              <p style={{ color: "var(--muted)", margin: 0 }}>This user accepted the English responsibility text before starting production. Admin sees this record for production and user review.</p>
              <div className="admin-info-grid">
                <div><span>Acceptance ID</span><strong>{latestLegal.id}</strong><small>Version {latestLegal.version}</small></div>
                <div><span>Accepted at</span><strong>{latestLegal.accepted_at ? new Date(latestLegal.accepted_at).toLocaleString() : "Recorded"}</strong><small>{latestLegal.ip_address ?? "IP not captured"}</small></div>
                <div><span>Production</span><strong>{latestLegal.title ?? "Untitled"}</strong><small>{latestLegal.production_id ?? "No production id"}</small></div>
                <div><span>Package</span><strong>{latestLegal.package_id ?? "-"}</strong><small>{latestLegal.production_type ?? "-"}</small></div>
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto", padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, background: "rgba(2,6,23,0.36)", color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>
                <p style={{ marginTop: 0 }}>{latestLegal.responsibility_text}</p>
                <p>{latestLegal.rights_warranty_text}</p>
                {latestLegal.user_agent ? <p style={{ marginBottom: 0 }}>User agent: {latestLegal.user_agent}</p> : null}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>No production responsibility acceptance exists for this user yet.</p>
          )}
        </div>

        <div className="admin-production-editor">
          <div className="field"><label>Credit amount</label><input value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} /></div>
          <div className="field"><label>Ban duration, hours</label><input value={banHours} onChange={(event) => setBanHours(event.target.value)} /></div>
          <div className="field"><label>Operation note</label><input value={note} onChange={(event) => setNote(event.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" disabled={loading} onClick={() => adjustCredits("add")}>Add credits</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => adjustCredits("remove")}>Remove credits</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("suspend_user")}>Suspend user</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("timed_ip_ban")}>Timed IP/user ban</button>
          <button className="btn secondary" type="button" disabled={loading} onClick={() => runUserAction("unsuspend_user")}>Unblock user</button>
          <button className="btn danger" type="button" disabled={loading} onClick={() => runUserAction("delete_user")}>Delete user</button>
        </div>
      </section>
    </div>
  );
}
