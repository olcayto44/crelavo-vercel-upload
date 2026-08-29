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
  const packagePrice = packageId ? findPaymentProduct(packageId)?.priceUsd : null;
  return Number(packagePrice ?? (Number(event.amount ?? 0) * CREDIT_VALUE)) || 0;
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["users", "finance", "support"]);
  if (!access.ok) return access.response;

  const dayStart = startOfUtcDay();
  const supabase = supabaseAdmin();
  const [profilesResult, purchasesResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    supabase.from("credit_events").select("amount, created_at").eq("type", "purchase").gte("created_at", dayStart)
  ]);

  if (profilesResult.error) {
    return Response.json({ error: "Dashboard member metrics could not be loaded." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  if (purchasesResult.error) {
    return Response.json({ error: "Dashboard revenue metrics could not be loaded." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  const live = getLiveVisitorSnapshot();
  const todayRevenue = (purchasesResult.data ?? []).reduce((total, event) => total + purchaseRevenueUsd(event), 0);

  return Response.json({
    dailyNewMembers: profilesResult.count ?? 0,
    dailyNewMembersAvailable: true,
    todayRevenue: Number(todayRevenue.toFixed(2)),
    todayRevenueAvailable: true,
    activeUsersNow: live.activeVisitors,
    activeUsersNowAvailable: true,
    activeUsersTrackingConfigured: true,
    activeWindowSeconds: live.activeWindowSeconds,
    updatedAt: new Date().toISOString()
  }, { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" } });
}
