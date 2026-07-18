"use client";

import { useEffect, useMemo, useState } from "react";
import { growthIntelligencePlans } from "@/lib/data";
import { requireVerifiedBrowserUser } from "@/lib/auth-guards";

type IntelligenceJob = {
  id: string;
  createdAt: string;
  brandName: string;
  ownWebsite: string;
  competitors: string;
  reportLanguage: string;
  reportFrequency?: string;
  alertChannel: string;
  status: "waiting_entitlement" | "monitoring_ready" | "in_progress" | "report_ready" | "delivered" | "cancelled";
  entitlementStatus?: string;
  reportFileUrl?: string | null;
  reportFileName?: string | null;
  adminNotes?: string | null;
};

type GrowthState = {
  planId: string;
  brandName: string;
  ownWebsite: string;
  competitors: string;
  watchedPages: string;
  adLibraries: string;
  reviewSources: string;
  targetMarket: string;
  reportLanguage: string;
  reportFrequency: string;
  alertChannel: string;
  jobs: IntelligenceJob[];
};

const storageKey = "clipora-growth-intelligence-control-v1";

const reportFrequencyOptions = [
  "Daily executive PDF",
  "Every 3 days executive PDF",
  "Weekly executive PDF",
  "Every 15 days executive PDF",
  "Monthly executive PDF"
];

const defaultState: GrowthState = {
  planId: growthIntelligencePlans[0]?.id ?? "growth_intelligence_starter",
  brandName: "",
  ownWebsite: "",
  competitors: "",
  watchedPages: "",
  adLibraries: "",
  reviewSources: "",
  targetMarket: "United States / Europe",
  reportLanguage: "English",
  reportFrequency: "Weekly executive PDF",
  alertChannel: "Email",
  jobs: []
};

function loadState(): GrowthState {
  if (typeof window === "undefined") return defaultState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    return parsed && typeof parsed === "object" ? { ...defaultState, ...parsed } : defaultState;
  } catch {
    return defaultState;
  }
}

function normalizeJob(item: Record<string, unknown>): IntelligenceJob {
  return {
    id: String(item.id ?? `growth-${Date.now()}`),
    createdAt: String(item.created_at ?? item.createdAt ?? new Date().toISOString()),
    brandName: String(item.brand_name ?? item.brandName ?? "Growth Intelligence request"),
    ownWebsite: String(item.own_website ?? item.ownWebsite ?? ""),
    competitors: String(item.competitors ?? ""),
    reportLanguage: String(item.report_language ?? item.reportLanguage ?? "English"),
    reportFrequency: String(item.report_frequency ?? item.reportFrequency ?? "Weekly executive PDF"),
    alertChannel: String(item.alert_channel ?? item.alertChannel ?? "Email"),
    status: String(item.status ?? "waiting_entitlement") as IntelligenceJob["status"],
    entitlementStatus: String(item.entitlement_status ?? item.entitlementStatus ?? "waiting_entitlement"),
    reportFileUrl: item.report_file_url ? String(item.report_file_url) : null,
    reportFileName: item.report_file_name ? String(item.report_file_name) : null,
    adminNotes: item.admin_notes ? String(item.admin_notes) : null
  };
}

function statusText(job: IntelligenceJob) {
  if (job.status === "waiting_entitlement") return "Waiting for entitlement / credits";
  if (job.status === "monitoring_ready") return "Monitoring ready";
  if (job.status === "in_progress") return "Report in progress";
  if (job.status === "report_ready") return "Report ready";
  if (job.status === "delivered") return "Delivered";
  if (job.status === "cancelled") return "Cancelled";
  return String(job.status).replaceAll("_", " ");
}

export function GrowthIntelligenceControlPanel() {
  const [state, setState] = useState<GrowthState>(defaultState);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mode, setMode] = useState("idle");
  const [message, setMessage] = useState("");
  const activePlan = useMemo(() => growthIntelligencePlans.find((plan) => plan.id === state.planId) ?? growthIntelligencePlans[0], [state.planId]);
  const competitorCount = state.competitors.split(/\n|,/).map((item) => item.trim()).filter(Boolean).length;
  const ready = Boolean(state.brandName.trim() && state.ownWebsite.trim() && competitorCount > 0);

  async function loadRequests(nextUserId: string) {
    const response = await fetch(`/api/growth-intelligence/requests?user_id=${encodeURIComponent(nextUserId)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not load Growth Intelligence requests");
    const jobs = Array.isArray(data.requests) ? data.requests.map((item: Record<string, unknown>) => normalizeJob(item)) : [];
    setState((current) => ({ ...current, jobs }));
  }

  useEffect(() => {
    const cached = loadState();
    setState(cached);
    requireVerifiedBrowserUser().then(async (auth) => {
      if (!auth.ok) {
        setMessage(auth.message);
        setMode("auth_required");
        return;
      }
      setUserId(auth.user.id);
      setUserEmail(auth.user.email ?? "");
      try {
        await loadRequests(auth.user.id);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load Growth Intelligence requests");
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify({ ...state, jobs: [] }));
  }, [state]);

  async function startMonitoring() {
    if (!ready || mode === "saving") return;
    if (!userId) {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) {
        window.location.href = auth.redirect;
        return;
      }
      setUserId(auth.user.id);
      setUserEmail(auth.user.email ?? "");
    }

    setMode("saving");
    setMessage("");
    try {
      const auth = userId ? null : await requireVerifiedBrowserUser();
      if (auth && !auth.ok) throw new Error(auth.message);
      const activeUserId = userId || auth?.user.id;
      const activeUserEmail = userEmail || auth?.user.email || "";
      if (!activeUserId) throw new Error("User session is required.");
      const response = await fetch("/api/growth-intelligence/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: activeUserId,
          user_email: activeUserEmail,
          plan_id: state.planId,
          brand_name: state.brandName,
          own_website: state.ownWebsite,
          competitors: state.competitors,
          watched_pages: state.watchedPages,
          ad_libraries: state.adLibraries,
          review_sources: state.reviewSources,
          target_market: state.targetMarket,
          report_language: state.reportLanguage,
          report_frequency: state.reportFrequency,
          alert_channel: state.alertChannel
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create Growth Intelligence request");
      const job = normalizeJob(data.request ?? {});
      setState((current) => ({ ...current, jobs: [job, ...current.jobs.filter((item) => item.id !== job.id)].slice(0, 10) }));
      setMode("saved");
      setMessage(job.status === "waiting_entitlement" ? "Brief saved. Report delivery will unlock after active entitlement or credit eligibility is confirmed." : "Brief saved. Monitoring is ready and the report will be delivered as a dashboard PDF/file when prepared.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Could not create Growth Intelligence request");
    }
  }

  return (
    <section className="live-sales-control-stack">
      <div className="card admin-wide-card">
        <div className="sample-video-head">
          <div>
            <span className="badge">Growth Intelligence Control</span>
            <h2>Competitor monitoring setup</h2>
            <p style={{ color: "var(--muted)" }}>Use this pre-API dashboard to prepare the competitor intelligence brief. Final n8n/API automation can later read the same structure: competitors, public sources, report language, frequency and alert channel. The finished report should be delivered as a dashboard PDF/file only when the user has active service entitlement or enough credits.</p>
          </div>
        </div>
        <div className="admin-info-grid">
          <div><span>Selected plan</span><strong>{activePlan?.name}</strong><p>{activePlan?.competitorLimit} · {activePlan?.monitoringFrequency}</p></div>
          <div><span>Competitors entered</span><strong>{competitorCount}</strong><p>URLs or brand names from the textarea</p></div>
          <div><span>Report delivery</span><strong>{state.reportFrequency}</strong><p>{state.reportLanguage} · {state.alertChannel}</p></div>
          <div><span>File access</span><strong>Entitlement / credits gated</strong><p>PDF/report file appears in dashboard after eligibility check</p></div>
          <div><span>Latest status</span><strong>{state.jobs[0] ? statusText(state.jobs[0]) : "Not started"}</strong><p>{state.jobs[0]?.entitlementStatus ? `Access: ${state.jobs[0].entitlementStatus.replaceAll("_", " ")}` : "Pre-API monitoring job state"}</p></div>
        </div>
        <div className="workspace-action-note warning" style={{ marginTop: 14 }}>
          <strong>Responsible use notice:</strong> Monitor only public sources that can be lawfully reviewed for market research. Do not enter private dashboards, restricted data, bypassed pages or sources that violate platform terms. The customer is responsible for using competitor insights in compliance with competition, privacy, advertising and data protection rules.
        </div>
      </div>

      <div className="grid">
        {growthIntelligencePlans.map((plan) => (
          <button className={`card clickable-credit-card credit-sale-card ${state.planId === plan.id ? "active-billing-plan" : ""}`} type="button" onClick={() => setState((current) => ({ ...current, planId: plan.id }))} key={plan.id}>
            <span className="badge">{plan.competitorLimit}</span>
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.monitoringFrequency}</p>
          </button>
        ))}
      </div>

      <div className="card admin-wide-card">
        <span className="badge">Monitoring brief</span>
        <div className="brief-two-col">
          <label>Brand / company name<input value={state.brandName} onChange={(event) => setState((current) => ({ ...current, brandName: event.target.value }))} placeholder="Your company or client brand" /></label>
          <label>Your website<input value={state.ownWebsite} onChange={(event) => setState((current) => ({ ...current, ownWebsite: event.target.value }))} placeholder="https://yourbrand.com" /></label>
          <label>Target market<input value={state.targetMarket} onChange={(event) => setState((current) => ({ ...current, targetMarket: event.target.value }))} placeholder="US, EU, Turkey, GCC..." /></label>
          <label>Report language<select value={state.reportLanguage} onChange={(event) => setState((current) => ({ ...current, reportLanguage: event.target.value }))}><option>English</option><option>Turkish</option><option>German</option><option>Spanish</option></select></label>
        </div>
        <label>Competitors to monitor<textarea value={state.competitors} onChange={(event) => setState((current) => ({ ...current, competitors: event.target.value }))} placeholder="One competitor URL or brand per line" /></label>
        <label>Product / pricing / landing pages to watch<textarea value={state.watchedPages} onChange={(event) => setState((current) => ({ ...current, watchedPages: event.target.value }))} placeholder="Pricing pages, offer pages, product URLs, feature pages..." /></label>
        <label>Public ad library / social links<textarea value={state.adLibraries} onChange={(event) => setState((current) => ({ ...current, adLibraries: event.target.value }))} placeholder="Facebook Ad Library, Google Ads Transparency, TikTok, LinkedIn, YouTube links..." /></label>
        <label>Review / complaint sources<textarea value={state.reviewSources} onChange={(event) => setState((current) => ({ ...current, reviewSources: event.target.value }))} placeholder="Reddit, X/Twitter, Trustpilot, app store, complaint sites, review pages..." /></label>
        <div className="brief-two-col">
          <label>Report frequency<select value={state.reportFrequency} onChange={(event) => setState((current) => ({ ...current, reportFrequency: event.target.value }))}>{reportFrequencyOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Alert channel<select value={state.alertChannel} onChange={(event) => setState((current) => ({ ...current, alertChannel: event.target.value }))}><option>Email</option><option>Slack</option><option>Email + Slack</option><option>Email + SMS for critical alerts</option></select></label>
        </div>
        {!ready ? <p className="workspace-action-note warning">Add brand name, your website and at least one competitor before starting monitoring.</p> : null}
        <p className="workspace-action-note">Report file delivery follows the existing Crelavo access rule: active Growth Intelligence entitlement or enough credits first, then the finished PDF/report file becomes visible in the dashboard.</p>
        {message ? <p className={`workspace-action-note ${mode === "error" || mode === "auth_required" ? "error" : mode === "saved" ? "success" : ""}`}>{message}</p> : null}
        <button className="btn" type="button" style={{ marginTop: 12 }} onClick={startMonitoring} disabled={!ready || mode === "saving"}>{mode === "saving" ? "Saving brief..." : "Start intelligence monitoring"}</button>
      </div>

      <div className="card admin-wide-card">
        <span className="badge">Monitoring jobs</span>
        <h3>Latest intelligence requests</h3>
        {state.jobs.length ? state.jobs.map((job) => (
          <div className="workspace-action-note" key={job.id} style={{ marginTop: 10 }}>
            <strong>{job.brandName} · {statusText(job)}</strong>
            <p>{new Date(job.createdAt).toLocaleString()} · {job.reportLanguage} · {job.reportFrequency ?? "Weekly executive PDF"} · {job.alertChannel}</p>
            <small>{job.ownWebsite}</small>
            <p><small>Access: {job.entitlementStatus?.replaceAll("_", " ") ?? "waiting entitlement"}</small></p>
            {job.reportFileUrl ? <p><a className="btn secondary" href={job.reportFileUrl} target="_blank" rel="noreferrer">Download report file</a></p> : <p><small>Report file will appear here when admin/automation marks it ready.</small></p>}
            {job.adminNotes ? <p><small>Admin note: {job.adminNotes}</small></p> : null}
          </div>
        )) : <p style={{ color: "var(--muted)" }}>No intelligence monitoring request started yet.</p>}
      </div>
    </section>
  );
}
