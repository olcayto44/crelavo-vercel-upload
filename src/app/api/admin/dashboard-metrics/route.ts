import { requireAdminPermission } from "@/lib/admin-guard";
import { findPaymentProduct } from "@/lib/data";
import { getLiveVisitorSnapshot } from "@/lib/live-visitors";
import { supabaseAdmin } from "@/lib/supabase";

const CREDIT_VALUE = Number(process.env.CREDIT_VALUE_USD ?? 0.1);

function noteValue(note: string | null | undefined, key: string) {
  const match = String(note ?? "").split("|").map((part) => part.trim()).find((part) => part.toLowerCase().startsWith(`${key.toLowerCase()}=`));
  return match ? match.slice(key.length + 1).trim() : "";
}

function purchaseRevenueUsd(event: { amount?: number | null; note?: string | null }) {
  const packageId = noteValue(event.note, "package");
  return Number(findPaymentProduct(packageId)?.priceUsd ?? (Number(event.amount ?? 0) * CREDIT_VALUE)) || 0;
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null; count?: number | null }>) {
  try {
    const result = await query;
    return result.error ? null : result;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["users", "finance", "support"]);
  if (!access.ok) return access.response;

  try {
    const dayStart = startOfUtcDay();
    const supabase = supabaseAdmin();
    const [profilesResult, purchasesResult, dailyVisitors, totalVisitors, dailyCheckouts, totalCheckouts, transactions, subscriptions] = await Promise.all([
      safeQuery(supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayStart)),
      safeQuery(supabase.from("credit_events").select("amount, created_at, note").eq("type", "purchase").gte("created_at", dayStart)),
      safeQuery(supabase.from("visitor_sessions").select("anonymous_id", { count: "exact", head: true }).gte("first_seen_at", dayStart)),
      safeQuery(supabase.from("visitor_sessions").select("anonymous_id", { count: "exact", head: true })),
      safeQuery(supabase.from("checkout_intents").select("id", { count: "exact", head: true }).gte("started_at", dayStart)),
      safeQuery(supabase.from("checkout_intents").select("id", { count: "exact", head: true })),
      safeQuery(supabase.from("payment_transactions").select("user_id, status, occurred_at, plan_id, product_id").in("status", ["paid", "succeeded", "active"])),
      safeQuery(supabase.from("subscriptions").select("user_id, plan_id, product_id, status").in("status", ["active", "trialing"]))
    ]);

    const live = getLiveVisitorSnapshot();
    const transactionRows = transactions?.data ?? [];
    const paidUserIds = new Set(transactionRows.filter((row) => row.user_id).map((row) => row.user_id as string));
    const paidToday = new Set(transactionRows.filter((row) => row.user_id && row.occurred_at >= dayStart).map((row) => row.user_id as string));
    const planBreakdown = (subscriptions?.data ?? []).reduce<Record<string, number>>((result, row) => {
      const plan = String(row.product_id || row.plan_id || "unknown");
      result[plan] = (result[plan] || 0) + 1;
      return result;
    }, {});
    const available = Boolean(dailyVisitors && totalVisitors && dailyCheckouts && totalCheckouts && transactions && subscriptions);

    return Response.json({
      dailyNewMembers: profilesResult?.count ?? 0,
      dailyNewMembersAvailable: Boolean(profilesResult),
      todayRevenue: Number((purchasesResult?.data ?? []).reduce((total, event) => total + purchaseRevenueUsd(event), 0).toFixed(2)),
      todayRevenueAvailable: Boolean(purchasesResult),
      activeUsersNow: live.activeVisitors,
      activeUsersNowAvailable: true,
      activeUsersTrackingConfigured: true,
      activeWindowSeconds: live.activeWindowSeconds,
      activeVisitorsNow: live.activeVisitors,
      dailyUniqueVisitors: dailyVisitors?.count ?? null,
      totalUniqueVisitors: totalVisitors?.count ?? null,
      checkoutStartedToday: dailyCheckouts?.count ?? null,
      checkoutStartedTotal: totalCheckouts?.count ?? null,
      paidUsersToday: transactions ? paidToday.size : null,
      paidUsersTotal: transactions ? paidUserIds.size : null,
      activeSubscribers: subscriptions ? (subscriptions.data ?? []).filter((row) => row.status === "active").length : null,
      trialingSubscribers: subscriptions ? (subscriptions.data ?? []).filter((row) => row.status === "trialing").length : null,
      planBreakdown: available ? planBreakdown : null,
      acquisitionBillingAvailable: available,
      liveVisitors: live.pages.flatMap((page) => page.sessions.map((session) => ({ ...session, path: page.path }))),
      updatedAt: new Date().toISOString()
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Dashboard metrics could not be loaded.", acquisitionBillingAvailable: false }, { status: 200, headers: { "Cache-Control": "private, no-store" } });
  }
}
