import { requireAdminPermission } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

type NotificationItem = {
  label: string;
  href: string;
  count: number;
  priority: "high" | "medium" | "low";
  note: string;
};

async function safeCount(table: string, apply?: (query: any) => any) {
  try {
    let query = supabaseAdmin().from(table).select("id", { count: "exact", head: true });
    if (apply) query = apply(query);
    const { count, error } = await query;
    if (error) return { count: 0, available: false, error: error.message };
    return { count: count ?? 0, available: true };
  } catch (error) {
    return { count: 0, available: false, error: error instanceof Error ? error.message : "unavailable" };
  }
}

async function safeRecentLeads() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("lead_captures")
      .select("email, source, offer, page_url, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["support", "productions", "growth"]);
  if (!access.ok) return access.response;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ total: 0, items: [], recentLeads: [], mode: "mock" }, { headers: { "Cache-Control": "no-store" } });
  }

  const [
    contactLeads,
    capturedLeads,
    assistantNeedsReview,
    pendingProductions,
    failedProductions,
    pendingVideoRequests,
    partnerApplications,
    partnerCommissions
  ] = await Promise.all([
    safeCount("lead_captures", (query) => query.eq("source", "contact_request")),
    safeCount("lead_captures", (query) => query.eq("status", "captured")),
    safeCount("assistant_conversations", (query) => query.in("admin_status", ["new", "needs_follow_up"])),
    safeCount("production_requests", (query) => query.in("status", ["pending", "queued", "in_production", "admin_review", "failed"])),
    safeCount("production_requests", (query) => query.eq("status", "failed")),
    safeCount("video_requests", (query) => query.in("status", ["pending", "in_production", "failed"])),
    safeCount("partner_applications", (query) => query.eq("status", "pending")),
    safeCount("partner_commission_ledger", (query) => query.in("payout_status", ["pending_review", "manual_margin_review"]))
  ]);

  const items: NotificationItem[] = [
    { label: "Incoming email / contact", href: "/admin/growth", count: contactLeads.count, priority: "high", note: "Review contact form and support messages." },
    { label: "New leads / requests", href: "/admin/growth", count: capturedLeads.count, priority: "medium", note: "Exit-intent, checkout, streak, or campaign leads." },
    { label: "Assistant conversations", href: "/admin/assistant", count: assistantNeedsReview.count, priority: "high", note: "New messages or conversations needing follow-up." },
    { label: "Production actions", href: "/admin/productions", count: pendingProductions.count, priority: "high", note: "Pending, active, failed, or admin-review jobs." },
    { label: "Failed productions", href: "/admin/production-qa", count: failedProductions.count, priority: "high", note: "Credit release/refund and delivery review may be needed." },
    { label: "Video requests", href: "/admin/legacy", count: pendingVideoRequests.count, priority: "medium", note: "Legacy video request statuses." },
    { label: "Partner applications", href: "/admin/partners", count: partnerApplications.count, priority: "medium", note: "New creator or affiliate applications." },
    { label: "Commission reviews", href: "/admin/partners", count: partnerCommissions.count, priority: "medium", note: "Commissions awaiting payout, refund, or margin review." }
  ];

  const visibleItems = items.filter((item) => item.count > 0);
  const total = visibleItems.reduce((sum, item) => sum + item.count, 0);
  const recentLeads = await safeRecentLeads();

  return Response.json({ total, items: visibleItems, recentLeads, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
