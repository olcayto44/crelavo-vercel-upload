"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
export function AdminSidebarAlert() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => { let active = true; const load = () => fetch("/api/admin/notifications", { credentials: "include", headers: adminApiHeaders("", getStoredAdminApiToken()), cache: "no-store" }).then((r) => r.json()).then((data) => { if (active) setCount(Number(data.total ?? 0)); }).catch(() => { if (active) setCount(null); }); load(); const timer = window.setInterval(load, 15000); return () => { active = false; window.clearInterval(timer); }; }, []);
  return <Link href="/admin/inbox" className={`admin-sidebar-alert ${count ? "has-alerts" : ""}`}><span>Bildirimler / Inbox</span><strong>{count === null ? "-" : count}</strong></Link>;
}
