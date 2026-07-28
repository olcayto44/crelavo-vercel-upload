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
  checkedAt?: string;
  mode?: string;
};

export function AdminNotificationBell() {
  const [state, setState] = useState<NotificationState>({ total: 0, items: [] });
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const adminEmail = userData.user?.email ?? "";
      const adminToken = getStoredAdminApiToken();
      if (!adminEmail) {
        if (!cancelled) setMode("login");
        return;
      }
      try {
        const response = await fetch("/api/admin/notifications", { headers: adminApiHeaders(adminEmail, adminToken), cache: "no-store" });
        const data = await response.json();
        if (!cancelled && typeof data.total === "number") {
          setState({ total: data.total, items: data.items ?? [], recentLeads: data.recentLeads ?? [], checkedAt: data.checkedAt, mode: data.mode });
          setMode("live");
        } else if (!cancelled) setMode("error");
      } catch {
        if (!cancelled) setMode("error");
      }
    }
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const hasAlerts = state.total > 0;
  return (
    <div className={`admin-notification-card ${hasAlerts ? "has-alerts" : ""}`}>
      <div className="admin-notification-head">
        <span className="badge">Bildirim</span>
        <strong>{mode === "loading" ? "..." : hasAlerts ? `${state.total} yeni` : "Temiz"}</strong>
      </div>
      <p>{hasAlerts ? "Gözden kaçmaması gereken kullanıcı mesajı, üretim, lead veya ödeme/komisyon işi var." : "Yeni kritik kullanıcı bildirimi görünmüyor."}</p>
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
              <span>{lead.metadata?.fullName || lead.email || "Yeni mesaj"}</span>
              <strong>{lead.metadata?.requesterType || lead.source || "Contact"}</strong>
              <small>{lead.metadata?.topic || lead.offer || "Konu kaydı yok"}</small>
            </Link>
          ))}
        </div>
      ) : null}
      <Link className="btn secondary" href="/admin/growth">Gelenleri kontrol et</Link>
    </div>
  );
}
