"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type RolloverRow = {
  user_id: string;
  balance: number;
  reserved: number;
  current_subscription_credits: number;
  rolled_over_credits: number;
  topup_credits: number;
  bonus_credits: number;
  rollover_cap: number;
  subscription_status: string;
  billing_cycle_ends_at: string | null;
  active_subscription_package: string | null;
  active_subscription_billing: string | null;
  last_rollover_at: string | null;
  topup_expires_at: string | null;
  updated_at: string | null;
  profiles?: { email?: string | null } | null;
};

type PolicyRow = {
  packageId: string;
  packageName: string;
  monthlyCredits: number;
  monthlyCap: number;
  yearlyCredits: number;
  monthlyText: string;
  yearlyText: string;
};

type TopupPolicyRow = {
  packageId: string;
  packageName: string;
  credits: number;
  validityDays: number;
  text: string;
};

type ApiState = {
  rows: RolloverRow[];
  monthlyPolicy: PolicyRow[];
  topupPolicy: TopupPolicyRow[];
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function AdminCreditRolloverOverview() {
  const [data, setData] = useState<ApiState | null>(null);
  const [message, setMessage] = useState("Loading rollover data...");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const adminEmail = userData.user?.email ?? "";
      const adminToken = getStoredAdminApiToken();
      if (!adminEmail) {
        setMessage("Sign in as admin to load rollover data.");
        return;
      }

      const response = await fetch("/api/admin/credits/rollover", {
        cache: "no-store",
        headers: adminApiHeaders(adminEmail, adminToken)
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(json.error ?? "Rollover data could not be loaded.");
        return;
      }
      setData(json);
      setMessage("");
    }

    void load();
  }, []);

  if (!data) return <p style={{ color: "var(--muted)" }}>{message}</p>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="admin-info-grid">
        <div><span>Monthly rollover</span><strong>Active subscription required</strong><small>Unused monthly credits roll over only while renewal succeeds.</small></div>
        <div><span>Cap rule</span><strong>3x monthly credits</strong><small>Business example: 12,000 monthly credits can hold up to 36,000 rollover-protected credits.</small></div>
        <div><span>Annual pool</span><strong>Valid for 12 months</strong><small>Team Annual credits stay available across the active yearly period.</small></div>
        <div><span>Top-up credits</span><strong>12 months</strong><small>Top-ups stay separate from subscription cancellation.</small></div>
      </div>

      <div className="admin-category-grid">
        {data.monthlyPolicy.map((item) => (
          <div className="card admin-category-card" key={item.packageId}>
            <span className="badge">{item.packageName}</span>
            <h3>{item.monthlyCap.toLocaleString()} max rollover cap</h3>
            <p>{item.monthlyText}</p>
            <p>{item.yearlyText}</p>
          </div>
        ))}
      </div>

      <div className="card admin-wide-card">
        <h3>Latest user rollover balances</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Total</th>
                <th>Reserved</th>
                <th>Current</th>
                <th>Rollover</th>
                <th>Top-up</th>
                <th>Cap</th>
                <th>Cycle end</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.profiles?.email ?? row.user_id}</td>
                  <td>{row.subscription_status}</td>
                  <td>{row.active_subscription_package ?? "-"} / {row.active_subscription_billing ?? "-"}</td>
                  <td>{row.balance.toLocaleString()}</td>
                  <td>{row.reserved.toLocaleString()}</td>
                  <td>{row.current_subscription_credits.toLocaleString()}</td>
                  <td>{row.rolled_over_credits.toLocaleString()}</td>
                  <td>{row.topup_credits.toLocaleString()}</td>
                  <td>{row.rollover_cap.toLocaleString()}</td>
                  <td>{formatDate(row.billing_cycle_ends_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
