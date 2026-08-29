"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type NotificationItem = {
  label: string;
  href: string;
  count: number;
  priority: "high" | "medium" | "low";
  note: string;
};

type RecentLead = {
  email?: string | null;
  source?: string | null;
  offer?: string | null;
  created_at?: string | null;
  metadata?: { fullName?: string; requesterType?: string; topic?: string } | null;
};

type NotificationState = {
  total: number;
  items: NotificationItem[];
  recentLeads?: RecentLead[];
};

type DashboardMetrics = {
  dailyNewMembers: number;
  dailyNewMembersAvailable: boolean;
  todayRevenue: number;
  todayRevenueAvailable: boolean;
  activeUsersNow: number;
  activeUsersNowAvailable: boolean;
  activeUsersTrackingConfigured: boolean;
  activeWindowSeconds: number;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function AdminNotificationBell() {
  const [state, setState] = useState<NotificationState>({ total: 0, items: [] });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [mode, setMode] = useState("loading");
  const [metricsMode, setMetricsMode] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const adminEmail = userData.user?.email ?? "";
      const headers = adminApiHeaders(adminEmail, getStoredAdminApiToken());
      if (!adminEmail) {
        if (!cancelled) {
          setMode("login");
          setMetricsMode("login");
        }
        return;
      }
      const [notificationsResponse, metricsResponse] = await Promise.all([
        fetch("/api/admin/notifications", { headers, cache: "no-store" }),
        fetch("/api/admin/dashboard-metrics", { headers, cache: "no-store" })
      ]);
      const [notifications, nextMetrics] = await Promise.all([
        notificationsResponse.json().catch(() => ({})),
        metricsResponse.json().catch(() => ({}))
      ]);
      if (cancelled) return;
      if (typeof notifications.total === "number") {
        setState({ total: notifications.total, items: notifications.items ?? [], recentLeads: notifications.recentLeads ?? [] });
        setMode("live");
      } else {
        setMode("error");
      }
      if (typeof nextMetrics.todayRevenue === "number") {
        setMetrics(nextMetrics);
        setMetricsMode("live");
      } else {
        setMetricsMode("error");
      }
    }

    loadDashboard().catch(() => {
      if (!cancelled) {
        setMode("error");
        setMetricsMode("error");
      }
    });
    const timer = window.setInterval(() => { loadDashboard().catch(() => undefined); }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const hasAlerts = state.total > 0;
  const metricValue = (available: boolean, value: string | number) => available ? value : "N/A";
  return (
    <div className={`admin-notification-card ${hasAlerts ? "has-alerts" : ""}`}>
      <div className="admin-kpi-strip" aria-label="Daily admin metrics">
        <div><span>Daily new members</span><strong>{metricsMode === "loading" ? "..." : metricValue(Boolean(metrics?.dailyNewMembersAvailable), metrics?.dailyNewMembers ?? 0)}</strong><small>UTC day</small></div>
        <div><span>Today revenue</span><strong>{metricsMode === "loading" ? "..." : metrics?.todayRevenueAvailable ? money(metrics.todayRevenue) : "N/A"}</strong><small>Confirmed payment events</small></div>
        <div><span>Active users now</span><strong>{metricsMode === "loading" ? "..." : metrics?.activeUsersTrackingConfigured ? metricValue(Boolean(metrics.activeUsersNowAvailable), metrics.activeUsersNow) : "N/A"}</strong><small>{metrics?.activeUsersTrackingConfigured ? `Last ${metrics.activeWindowSeconds}s` : "Tracking not configured"}</small></div>
      </div>
      <div className="admin-notification-head">
        <span className="badge">Notifications</span>
        <strong>{mode === "loading" ? "..." : hasAlerts ? `${state.total} new` : "Clear"}</strong>
      </div>
      <p>{hasAlerts ? "User messages, productions, leads, payments, or commissions need attention." : "No critical user notifications are waiting."}</p>
      {state.items.length > 0 ? (
        <div className="admin-notification-list">
          {state.items.slice(0, 4).map((item) => (
            <Link href={item.href} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
              <small>{item.note}</small>
            </Link>
          ))}
        </div>
      ) : null}
      {state.recentLeads?.length ? (
        <div className="admin-notification-list recent">
          {state.recentLeads.slice(0, 2).map((lead, index) => (
            <Link href="/admin/growth" key={`${lead.email}-${lead.created_at}-${index}`}>
              <span>{lead.metadata?.fullName || lead.email || "New message"}</span>
              <strong>{lead.metadata?.requesterType || lead.source || "Contact"}</strong>
              <small>{lead.metadata?.topic || lead.offer || "No topic recorded"}</small>
            </Link>
          ))}
        </div>
      ) : null}
      <Link className="btn secondary" href="/admin/growth">Review incoming items</Link>
    </div>
  );
}
