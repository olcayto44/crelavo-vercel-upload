"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type ApiGuardConfig = {
  singleProductionCreditLimit: number;
  dailyProductionCreditLimit: number;
  dailyProductionCountLimit: number;
  assistantChatIpLimit: number;
  assistantChatUserLimit: number;
  assistantPlanIpLimit: number;
  assistantPlanUserLimit: number;
  automationStartIpLimit: number;
  automationStartUserLimit: number;
  automationStatusIpLimit: number;
  automationStatusUserLimit: number;
};

type GuardUser = {
  userId: string;
  count: number;
  credits: number;
  latestAt: string | null;
  creditUtilizationPct: number;
  countUtilizationPct: number;
  nearLimit: boolean;
};

type RecentProduction = {
  id: string;
  userId: string;
  title: string;
  status: string;
  automationStatus: string | null;
  generationStatus: string | null;
  credits: number;
  createdAt: string | null;
};

type ApiGuardReport = {
  generatedAt: string;
  dayStart: string;
  config: ApiGuardConfig;
  today: {
    totalProductions: number;
    activeProductions: number;
    failedProductions: number;
    estimatedCredits: number;
    dailyCreditLimit: number;
    dailyCountLimit: number;
    creditUtilizationPct: number;
    countUtilizationPct: number;
  };
  topUsers: GuardUser[];
  nearLimitUsers: GuardUser[];
  recentProductions: RecentProduction[];
  intervention: {
    usersAdminPath: string;
    productionsAdminPath: string;
  };
  notes: string[];
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function usageLabel(percent: number) {
  if (percent >= 90) return "Critical";
  if (percent >= 70) return "Watch";
  return "Healthy";
}

function usageClass(percent: number) {
  if (percent >= 90) return "failed";
  if (percent >= 70) return "active";
  return "ready";
}

export function AdminApiGuardPanel() {
  const [report, setReport] = useState<ApiGuardReport | null>(null);
  const [message, setMessage] = useState("Loading API guard report...");
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const adminEmail = userData.user?.email ?? "";
    const adminToken = getStoredAdminApiToken();

    if (!adminEmail) {
      setLoading(false);
      setMessage("Admin session not found. Sign in with an admin account to load live guard data.");
      return;
    }

    const response = await fetch("/api/admin/api-guard", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !data.today || !data.config) {
      setMessage(data.error ?? "API guard report could not be loaded.");
      return;
    }

    setReport(data);
    setMessage(`Live guard data loaded at ${new Date(data.generatedAt).toLocaleString()}.`);
  }

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <div className="admin-production-head">
          <div>
            <span className="badge">Cost safety</span>
            <h2>API Guard görünürlük paneli</h2>
            <p style={{ color: "var(--muted)" }}>
              Bu ekran aktif limit değerlerini, bugünkü production kredi kullanımını ve limite yaklaşan kullanıcıları admin tarafında görünür yapar.
            </p>
          </div>
          <button className="btn secondary" type="button" onClick={loadReport} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      {report ? (
        <>
          <section className="kpi">
            <div className="card"><span>Today's productions</span><strong>{formatNumber(report.today.totalProductions)}</strong><p>{report.today.countUtilizationPct}% of daily count limit</p></div>
            <div className="card"><span>Today's estimated credits</span><strong>{formatNumber(report.today.estimatedCredits)}</strong><p>{report.today.creditUtilizationPct}% of daily credit limit</p></div>
            <div className="card"><span>Active productions</span><strong>{formatNumber(report.today.activeProductions)}</strong><p>Pending / queued / in production</p></div>
            <div className="card"><span>Failed today</span><strong>{formatNumber(report.today.failedProductions)}</strong><p>Needs operations review if rising</p></div>
          </section>

          <section className="card admin-wide-card">
            <span className="badge">Active guard limits</span>
            <h2>Limit mantığı</h2>
            <div className="admin-info-grid">
              <div><span>Single production max</span><strong>{formatNumber(report.config.singleProductionCreditLimit)}</strong><small>One job safety ceiling</small></div>
              <div><span>Daily user credit limit</span><strong>{formatNumber(report.config.dailyProductionCreditLimit)}</strong><small>Per user / UTC day</small></div>
              <div><span>Daily user production count</span><strong>{formatNumber(report.config.dailyProductionCountLimit)}</strong><small>Per user / UTC day</small></div>
              <div><span>Assistant chat</span><strong>{report.config.assistantChatUserLimit} user / {report.config.assistantChatIpLimit} IP</strong><small>15-minute route budget</small></div>
              <div><span>Assistant plan</span><strong>{report.config.assistantPlanUserLimit} user / {report.config.assistantPlanIpLimit} IP</strong><small>15-minute route budget</small></div>
              <div><span>Automation start</span><strong>{report.config.automationStartUserLimit} user / {report.config.automationStartIpLimit} IP</strong><small>15-minute route budget</small></div>
              <div><span>Automation status</span><strong>{report.config.automationStatusUserLimit} user / {report.config.automationStatusIpLimit} IP</strong><small>15-minute route budget</small></div>
            </div>
          </section>

          <section className="card admin-wide-card">
            <span className={`provider-job-chip ${usageClass(Math.max(report.today.creditUtilizationPct, report.today.countUtilizationPct))}`}>
              {usageLabel(Math.max(report.today.creditUtilizationPct, report.today.countUtilizationPct))}
            </span>
            <h2>Bugünkü toplam kullanım</h2>
            <div className="admin-info-grid">
              <div><span>Credit usage</span><strong>{report.today.creditUtilizationPct}%</strong><small>{formatNumber(report.today.estimatedCredits)} / {formatNumber(report.today.dailyCreditLimit)}</small></div>
              <div><span>Production count usage</span><strong>{report.today.countUtilizationPct}%</strong><small>{formatNumber(report.today.totalProductions)} / {formatNumber(report.today.dailyCountLimit)}</small></div>
              <div><span>Near-limit users</span><strong>{report.nearLimitUsers.length}</strong><small>70%+ of daily count or credit limit</small></div>
            </div>
          </section>

          <section className="card admin-wide-card">
            <div className="admin-production-head">
              <div>
                <span className="badge">Intervention</span>
                <h2>Limite yaklaşan kullanıcılar</h2>
                <p style={{ color: "var(--muted)" }}>Buradan kullanıcı/kredi ekranına veya production listesine geçip inceleme, kredi düzeltme, suspend veya retry işlemi yapabilirsin.</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="btn secondary" href={report.intervention.usersAdminPath}>Users</Link>
                <Link className="btn secondary" href={report.intervention.productionsAdminPath}>Productions</Link>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="table">
                <thead><tr><th>User ID</th><th>Productions today</th><th>Credits today</th><th>Count usage</th><th>Credit usage</th><th>Latest</th><th>Status</th></tr></thead>
                <tbody>
                  {(report.nearLimitUsers.length ? report.nearLimitUsers : report.topUsers).map((user) => (
                    <tr key={user.userId}>
                      <td className="admin-user-id-cell"><code>{user.userId}</code></td>
                      <td>{formatNumber(user.count)}</td>
                      <td>{formatNumber(user.credits)}</td>
                      <td>{user.countUtilizationPct}%</td>
                      <td>{user.creditUtilizationPct}%</td>
                      <td>{formatDate(user.latestAt)}</td>
                      <td><span className={`provider-job-chip ${user.nearLimit ? "active" : "ready"}`}>{user.nearLimit ? "Watch" : "Healthy"}</span></td>
                    </tr>
                  ))}
                  {!report.topUsers.length ? <tr><td colSpan={7}>No production usage today.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card admin-wide-card">
            <span className="badge">Recent productions</span>
            <h2>Bugünkü son production kayıtları</h2>
            <div className="admin-table-wrap">
              <table className="table">
                <thead><tr><th>Production</th><th>User</th><th>Status</th><th>Credits</th><th>Created</th></tr></thead>
                <tbody>
                  {report.recentProductions.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong><br /><small>{item.id}</small></td>
                      <td className="admin-user-id-cell"><code>{item.userId}</code></td>
                      <td>{item.status}<br /><small>{item.automationStatus ?? item.generationStatus ?? "-"}</small></td>
                      <td>{formatNumber(item.credits)}</td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {!report.recentProductions.length ? <tr><td colSpan={5}>No productions today.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card admin-wide-card">
            <span className="badge">Notes</span>
            <h2>Ne görebiliyoruz?</h2>
            {report.notes.map((note) => <p key={note} style={{ color: "var(--muted)" }}>{note}</p>)}
          </section>
        </>
      ) : null}
    </div>
  );
}
