"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";

type AdminStats = {
  totalRequests: number;
  pending: number;
  inProduction: number;
  ready: number;
  totalCredits: number;
  reservedCredits: number;
};

export function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats>({
    totalRequests: 0,
    pending: 0,
    inProduction: 0,
    ready: 0,
    totalCredits: 0,
    reservedCredits: 0
  });
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    async function loadStats() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const adminEmail = userData.user?.email ?? "";
      const adminToken = getStoredAdminApiToken();

      if (!adminEmail) {
        setMode("login");
        return;
      }

      fetch("/api/admin/stats", { headers: adminApiHeaders(adminEmail, adminToken) })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.totalRequests === "number") {
            setStats(data);
            setMode("live");
            return;
          }
          setMode("error");
        })
        .catch(() => setMode("error"));
    }

    loadStats();
  }, []);

  if (mode === "error") {
    return <div className="card"><span>Admin stats</span><strong>!</strong><p>Stats could not be loaded.</p></div>;
  }

  return (
    <div className="kpi">
      <div className="card"><span>Total requests</span><strong>{mode === "loading" ? "..." : stats.totalRequests}</strong><p>Supabase records</p></div>
      <div className="card"><span>Pending</span><strong>{mode === "loading" ? "..." : stats.pending}</strong><p>Waiting for review</p></div>
      <div className="card"><span>In production</span><strong>{mode === "loading" ? "..." : stats.inProduction}</strong><p>Active jobs</p></div>
      <div className="card"><span>Ready</span><strong>{mode === "loading" ? "..." : stats.ready}</strong><p>Delivered productions</p></div>
      <div className="card"><span>Total credits</span><strong>{mode === "loading" ? "..." : stats.totalCredits}</strong><p>All user balances</p></div>
      <div className="card"><span>Reserved credits</span><strong>{mode === "loading" ? "..." : stats.reservedCredits}</strong><p>Pending jobs</p></div>
    </div>
  );
}
