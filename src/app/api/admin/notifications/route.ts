import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
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
  if (!isAdminRequest(request)) return adminRequiredResponse();

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
    { label: "Gelen e-posta / iletişim", href: "/admin/growth", count: contactLeads.count, priority: "high", note: "Contact form veya support mesajı incelemesi." },
    { label: "Yeni lead / talep", href: "/admin/growth", count: capturedLeads.count, priority: "medium", note: "Exit intent, checkout intent, streak veya kampanya leadleri." },
    { label: "Asistan konuşmaları", href: "/admin/assistant", count: assistantNeedsReview.count, priority: "high", note: "Yeni veya follow-up isteyen kullanıcı mesajları." },
    { label: "Üretim aksiyonları", href: "/admin/productions", count: pendingProductions.count, priority: "high", note: "Bekleyen, üretimde veya admin review isteyen işler." },
    { label: "Başarısız üretim", href: "/admin/production-qa", count: failedProductions.count, priority: "high", note: "Kredi release/refund ve teslimat kontrolü gerekebilir." },
    { label: "Video istekleri", href: "/admin/legacy", count: pendingVideoRequests.count, priority: "medium", note: "Legacy video request durumları." },
    { label: "Partner başvuruları", href: "/admin/partners", count: partnerApplications.count, priority: "medium", note: "Yeni creator/affiliate başvuruları." },
    { label: "Komisyon incelemesi", href: "/admin/partners", count: partnerCommissions.count, priority: "medium", note: "Payout/refund/margin review bekleyen komisyonlar." }
  ];

  const visibleItems = items.filter((item) => item.count > 0);
  const total = visibleItems.reduce((sum, item) => sum + item.count, 0);
  const recentLeads = await safeRecentLeads();

  return Response.json({ total, items: visibleItems, recentLeads, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
