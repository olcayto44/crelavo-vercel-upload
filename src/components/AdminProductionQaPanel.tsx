"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type QaIssue = {
  code: string;
  severity: "critical" | "warning" | "info";
  message: string;
  fix: string;
};

type QaResult = {
  id: string;
  title: string;
  productionType: string;
  packageId: string;
  status: string;
  score: number;
  grade: "pass" | "watch" | "fail";
  deliveryStandard: string;
  createdAt: string | null;
  issues: QaIssue[];
  qualityProfile: {
    label: string;
    minimumStandard: string;
    customerReadyDefinition: string;
    adminReviewFocus: string[];
  };
};

type QaReport = {
  generatedAt: string;
  summary: {
    total: number;
    pass: number;
    watch: number;
    fail: number;
    averageScore: number;
    status: "pass" | "watch" | "fail";
    topIssues: { code: string; count: number }[];
  };
  results: QaResult[];
  nextActions: string[];
};

function gradeClass(grade: string) {
  if (grade === "pass") return "ready";
  if (grade === "watch") return "active";
  return "failed";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function AdminProductionQaPanel() {
  const [report, setReport] = useState<QaReport | null>(null);
  const [message, setMessage] = useState("Loading production QA report...");
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const adminEmail = userData.user?.email ?? "";
    const adminToken = getStoredAdminApiToken();

    if (!adminEmail) {
      setLoading(false);
      setMessage("Admin session not found. Sign in with an admin account to load live QA data.");
      return;
    }

    const response = await fetch("/api/admin/production-qa", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !data.summary || !Array.isArray(data.results)) {
      setMessage(data.error ?? "Production QA report could not be loaded.");
      return;
    }

    setReport(data);
    setMessage(`Production QA loaded at ${new Date(data.generatedAt).toLocaleString()}.`);
  }

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <div className="admin-production-head">
          <div>
            <span className="badge">Production QA</span>
            <h2>Production kalite QA raporu</h2>
            <p style={{ color: "var(--muted)" }}>
              Son production kayıtlarında kalite profili, teslim paketi, legal snapshot, output/cost planı ve hazır durum teslim linkleri kontrol edilir.
            </p>
          </div>
          <button className="btn secondary" type="button" onClick={loadReport} disabled={loading}>{loading ? "Loading..." : "Refresh QA"}</button>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>

      {report ? (
        <>
          <section className="kpi">
            <div className="card"><span>QA status</span><strong>{report.summary.status.toUpperCase()}</strong><p>Average score {report.summary.averageScore}/100</p></div>
            <div className="card"><span>Pass</span><strong>{report.summary.pass}</strong><p>Customer-ready metadata</p></div>
            <div className="card"><span>Watch</span><strong>{report.summary.watch}</strong><p>Warnings to review</p></div>
            <div className="card"><span>Fail</span><strong>{report.summary.fail}</strong><p>Critical issue exists</p></div>
          </section>

          <section className="card admin-wide-card">
            <div className="admin-production-head">
              <div>
                <span className={`provider-job-chip ${gradeClass(report.summary.status)}`}>{report.summary.status}</span>
                <h2>QA aksiyon özeti</h2>
              </div>
              <Link className="btn secondary" href="/admin/productions">Open productions</Link>
            </div>
            <div className="admin-info-grid">
              {report.nextActions.map((action) => (
                <div key={action}><span>Next action</span><strong>{action}</strong><small>Production QA</small></div>
              ))}
              {report.summary.topIssues.map((issue) => (
                <div key={issue.code}><span>Top issue</span><strong>{issue.code}</strong><small>{issue.count} records</small></div>
              ))}
            </div>
          </section>

          <section className="card admin-wide-card">
            <span className="badge">Recent production checks</span>
            <h2>Production QA kayıtları</h2>
            <div className="admin-table-wrap">
              <table className="table">
                <thead><tr><th>Production</th><th>Type</th><th>Score</th><th>Status</th><th>Quality standard</th><th>Issues</th><th>Created</th></tr></thead>
                <tbody>
                  {report.results.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong><br /><small>{item.id}</small></td>
                      <td>{item.productionType}<br /><small>{item.packageId || "-"}</small></td>
                      <td><span className={`provider-job-chip ${gradeClass(item.grade)}`}>{item.score}/100</span></td>
                      <td>{item.status}<br /><small>{item.deliveryStandard}</small></td>
                      <td>{item.qualityProfile.label}<br /><small>{item.qualityProfile.minimumStandard}</small></td>
                      <td>
                        {item.issues.length ? item.issues.slice(0, 3).map((issue) => (
                          <div key={`${item.id}-${issue.code}`}><strong>{issue.severity}: {issue.code}</strong><br /><small>{issue.fix}</small></div>
                        )) : <span className="provider-job-chip ready">No issue</span>}
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {!report.results.length ? <tr><td colSpan={7}>No productions found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
