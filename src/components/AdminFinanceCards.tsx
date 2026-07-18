"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";

type TopProductionPackage = {
  packageId: string;
  productionType: string;
  count: number;
  reservedCredits: number;
  revenueUsd: number;
  providerCostUsd: number;
  grossProfitUsd: number;
  marginPercent: number;
};

type PackageSalesSummary = {
  packageId: string;
  packageName: string;
  count: number;
  credits: number;
  revenueUsd: number;
  todayRevenueUsd: number;
  weeklyRevenueUsd: number;
  monthlyRevenueUsd: number;
};

type RecentPackageSale = {
  userId: string;
  packageId: string;
  packageName: string;
  billing: string;
  credits: number;
  revenueUsd: number;
  whopPayment: string;
  membership: string;
  createdAt: string;
};

type FinanceStats = {
  revenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  soldCredits: number;
  manualCredits: number;
  paymentLinkActivatedCredits: number;
  paymentLinkActivationCount: number;
  spentCredits: number;
  reservedCredits: number;
  pendingCreditReviews: number;
  pendingReviewReservedCredits: number;
  spentReservedProductions: number;
  refundedReservedProductions: number;
  cancelledHalfSpentProductions: number;
  finalizedSpentCredits: number;
  finalizedRefundedCredits: number;
  finalizedReleasedReservedCredits: number;
  estimatedCost: number;
  estimatedGrossProfit: number;
  margin: number;
  productionRevenue: number;
  estimatedApiCost: number;
  productionGrossProfit: number;
  productionMargin: number;
  apiBreakdownProductionCount: number;
  totalProductionCount: number;
  topProductionPackages: TopProductionPackage[];
  packageSalesSummary: PackageSalesSummary[];
  recentPackageSales: RecentPackageSale[];
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function AdminFinanceCards() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    async function loadFinance() {
      const adminToken = getStoredAdminApiToken();

      fetch("/api/admin/finance", { headers: adminApiHeaders("", adminToken) })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.revenue === "number") {
            setStats(data);
            setMode("live");
            return;
          }
          setMode("error");
        })
        .catch(() => setMode("error"));
    }

    loadFinance();
  }, []);

  if (mode === "error") {
    return <div className="card"><span>Finance</span><strong>!</strong><p>Finance data could not be loaded.</p></div>;
  }

  return (
    <div className="grid" style={{ marginTop: 20 }}>
      <div className="card"><span>Today's revenue</span><strong>{stats ? money(stats.todayRevenue) : "..."}</strong><p>From payment API purchase events; manual activations are tracked separately</p></div>
      <div className="card"><span>Weekly revenue</span><strong>{stats ? money(stats.weeklyRevenue) : "..."}</strong><p>Last 7 days</p></div>
      <div className="card"><span>Monthly revenue</span><strong>{stats ? money(stats.monthlyRevenue) : "..."}</strong><p>Last 30 days</p></div>
      <div className="card"><span>Total credit revenue</span><strong>{stats ? money(stats.revenue) : "..."}</strong><p>Payment API purchase events only</p></div>
      <div className="card"><span>Production revenue value</span><strong>{stats ? money(stats.productionRevenue) : "..."}</strong><p>Reserved credits converted with credit value</p></div>
      <div className="card"><span>API/provider cost</span><strong>{stats ? money(stats.estimatedApiCost) : "..."}</strong><p>{stats ? `${stats.apiBreakdownProductionCount}/${stats.totalProductionCount} jobs have API breakdowns` : "Estimated per production"}</p></div>
      <div className="card"><span>Production gross profit</span><strong>{stats ? money(stats.productionGrossProfit) : "..."}</strong><p>Margin: {stats ? `%${stats.productionMargin}` : "..."}</p></div>
      <div className="card"><span>Estimated cost</span><strong>{stats ? money(stats.estimatedCost) : "..."}</strong><p>Legacy target cost ratio</p></div>
      <div className="card"><span>Estimated gross profit</span><strong>{stats ? money(stats.estimatedGrossProfit) : "..."}</strong><p>Margin: {stats ? `%${stats.margin}` : "..."}</p></div>
      <div className="card"><span>Sold credits</span><strong>{stats ? stats.soldCredits : "..."}</strong><p>Payment purchase events</p></div>
      <div className="card"><span>Manual credits</span><strong>{stats ? stats.manualCredits : "..."}</strong><p>Not counted as payment API revenue</p></div>
      <div className="card"><span>Manual payment activations</span><strong>{stats ? stats.paymentLinkActivatedCredits : "..."}</strong><p>{stats ? `${stats.paymentLinkActivationCount} payment-reference-reviewed credit events` : "Manual launch payment credits"}</p></div>
      <div className="card"><span>Spent credits</span><strong>{stats ? stats.spentCredits : "..."}</strong><p>Completed jobs</p></div>
      <div className="card"><span>Reserved credits</span><strong>{stats ? stats.reservedCredits : "..."}</strong><p>Still locked for active jobs</p></div>
      <div className="card"><span>Credit reviews</span><strong>{stats ? stats.pendingCreditReviews : "..."}</strong><p>{stats ? `${stats.pendingReviewReservedCredits.toLocaleString()} credits need admin decision` : "Provider failure queue"}</p></div>
      <div className="card"><span>Finalized spend</span><strong>{stats ? stats.spentReservedProductions : "..."}</strong><p>{stats ? `${stats.finalizedSpentCredits.toLocaleString()} credits converted from reserved` : "Ready productions"}</p></div>
      <div className="card"><span>Provider refunds</span><strong>{stats ? stats.refundedReservedProductions : "..."}</strong><p>{stats ? `${stats.finalizedRefundedCredits.toLocaleString()} reserved credits released` : "Admin refunds"}</p></div>
      <div className="card"><span>Cancelled half-charge</span><strong>{stats ? stats.cancelledHalfSpentProductions : "..."}</strong><p>{stats ? `${stats.finalizedReleasedReservedCredits.toLocaleString()} credits released after 50% cut` : "Member cancellation policy"}</p></div>
      {stats?.packageSalesSummary?.length ? (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <span>Package sales summary</span>
          <div className="provider-job-list" style={{ marginTop: 12 }}>
            {stats.packageSalesSummary.map((item) => (
              <div className="provider-job-chip ready" key={item.packageId}>
                <strong>{item.packageName}</strong>
                <span>{item.packageId} · {item.count} sales · {item.credits.toLocaleString()} credits</span>
                <small>Total {money(item.revenueUsd)} · Today {money(item.todayRevenueUsd)} · Week {money(item.weeklyRevenueUsd)} · Month {money(item.monthlyRevenueUsd)}</small>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {stats?.recentPackageSales?.length ? (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <span>Recent package sales</span>
          <div className="admin-table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr><th>Date</th><th>User ID</th><th>Package</th><th>Billing</th><th>Credits</th><th>Revenue</th><th>Payment ref</th></tr>
              </thead>
              <tbody>
                {stats.recentPackageSales.map((sale) => (
                  <tr key={`${sale.userId}-${sale.createdAt}-${sale.packageId}`}>
                    <td className="admin-date-cell">{new Date(sale.createdAt).toLocaleString()}</td>
                    <td className="admin-user-id-cell"><code>{sale.userId}</code></td>
                    <td>{sale.packageName}<br /><small>{sale.packageId}</small></td>
                    <td>{sale.billing}</td>
                    <td>{sale.credits.toLocaleString()}</td>
                    <td>{money(sale.revenueUsd)}</td>
                    <td>{sale.whopPayment || sale.membership || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {stats?.topProductionPackages?.length ? (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <span>Top production packages</span>
          <div className="provider-job-list" style={{ marginTop: 12 }}>
            {stats.topProductionPackages.map((item) => (
              <div className="provider-job-chip ready" key={item.packageId}>
                <strong>{item.packageId}</strong>
                <span>{item.productionType} · {item.count} jobs · {item.reservedCredits.toLocaleString()} credits</span>
                <small>Revenue {money(item.revenueUsd)} · API cost {money(item.providerCostUsd)} · Profit {money(item.grossProfitUsd)} · Margin %{item.marginPercent}</small>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
