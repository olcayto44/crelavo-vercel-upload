"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type LiveVisitorPage = {
  path: string;
  url: string;
  visitors: number;
  countries: string[];
  ips: string[];
  latestSeenAt: string;
  sessions: Array<{
    sessionId: string;
    ip: string;
    country: string;
    title: string;
    referrer: string;
    userAgent: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
    ref: string;
    firstTouchAt: string;
    firstTouchPath: string;
    lastSeenAt: string;
  }>;
};

type LiveVisitorsSummary = {
  activeVisitors: number;
  activeWindowSeconds: number;
  updatedAt: string;
  pages: LiveVisitorPage[];
};

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AdminLiveVisitorsCard() {
  const [adminEmail, setAdminEmail] = useState("");
  const [summary, setSummary] = useState<LiveVisitorsSummary | null>(null);
  const [message, setMessage] = useState("Loading live visitors...");

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      const { data } = await supabaseBrowser().auth.getUser();
      const email = data.user?.email ?? "";
      if (cancelled) return;
      setAdminEmail(email);
      if (!email) setMessage("Admin login required.");
    }

    loadAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adminEmail) return;
    let cancelled = false;

    async function loadSummary() {
      const response = await fetch("/api/admin/live-visitors", { headers: adminApiHeaders(adminEmail, getStoredAdminApiToken()) });
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok) {
        setMessage(data.error ?? "Live visitors could not be loaded.");
        return;
      }
      setSummary(data);
      setMessage("");
    }

    loadSummary();
    const timer = window.setInterval(loadSummary, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [adminEmail]);

  return (
    <section className="card admin-live-visitors-card">
      <span className="badge">Live traffic</span>
      <h2>{summary ? `${summary.activeVisitors.toLocaleString()} active visitors now` : "Live visitors"}</h2>
      <p style={{ color: "var(--muted)" }}>
        {message || `Realtime page ranking. Updates every 5 seconds. Active window: ${summary?.activeWindowSeconds ?? 60} seconds.`}
      </p>

      <div className="admin-info-grid">
        <div><span>Total active</span><strong>{summary?.activeVisitors.toLocaleString() ?? "..."}</strong><small>Visitors active now</small></div>
        <div><span>Active pages</span><strong>{summary?.pages.length ?? 0}</strong><small>Highest traffic page stays on top</small></div>
        <div><span>Last update</span><strong>{summary ? timeLabel(summary.updatedAt) : "..."}</strong><small>Live heartbeat data</small></div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {summary?.pages.length ? summary.pages.map((page, index) => (
          <div className="dynamic-brief-panel" key={page.path}>
            <div className="admin-production-head">
              <div>
                <span className="badge">#{index + 1} · {page.visitors} active</span>
                <h3>{page.path}</h3>
                <p style={{ color: "var(--muted)", wordBreak: "break-word" }}>{page.url}</p>
              </div>
              <div className="admin-production-status">
                <strong>{page.visitors.toLocaleString()} users</strong>
                <small>{page.countries.join(", ") || "Unknown country"}</small>
                <small>{page.ips.length} unique IPs</small>
              </div>
            </div>
            <div className="provider-job-list" style={{ marginTop: 10 }}>
              {page.sessions.map((session) => (
                <div className="provider-job-chip active" key={session.sessionId}>
                  <strong>{session.ip}</strong>
                  <span>{session.country || "Unknown"} · {session.title || "Untitled page"}</span>
                  <small>Last seen: {timeLabel(session.lastSeenAt)}</small>
                  {session.utmSource || session.utmMedium ? <small>Source / medium: {session.utmSource || "direct"} / {session.utmMedium || "none"}</small> : null}
                  {session.utmCampaign ? <small>Campaign utm: {session.utmCampaign}</small> : null}
                  {session.ref ? <small>ref: {session.ref}</small> : null}
                  {session.firstTouchPath ? <small>First touch: {session.firstTouchPath} · {session.firstTouchAt ? timeLabel(session.firstTouchAt) : "unknown"}</small> : null}
                  {session.referrer ? <small>Referrer: {session.referrer}</small> : null}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="dynamic-brief-panel">
            <span className="badge">No active visitors</span>
            <h3>No live traffic yet</h3>
            <p style={{ color: "var(--muted)" }}>Open a public page in another browser tab to see the live list here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
