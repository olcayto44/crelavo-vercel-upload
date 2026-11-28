import {createHash} from "node:crypto";
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

async function countUnread(email:string){
 try{
 const db=supabaseAdmin(),prefix="inbox_read_v1_"+createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0,32)+"_";
 const leads=await db.from("lead_captures").select("id").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(300);
 if(leads.error)throw leads.error;const ids=(leads.data??[]).map(r=>String(r.id));let count=ids.length;
 for(let i=0;i<ids.length;i+=50){const r=await db.from("platform_configs").select("key").in("key",ids.slice(i,i+50).map(id=>prefix+id));if(r.error)throw r.error;count-=(r.data??[]).length}
 return {count,available:true}
 }catch{return {count:0,available:false}}
}
export async function GET(request: Request) {
  const access = await requireAdminPermission(request, "owner");
  if (!access.ok) return access.response;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE)) {
    return Response.json({error:"Notification data unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  }

  const [
    unreadLeads,
    assistantNeedsReview,
    pendingProductions,
    failedProductions,
    pendingVideoRequests,
    partnerApplications,
    partnerCommissions
  ] = await Promise.all([
    countUnread(access.context.email),
    safeCount("assistant_conversations", (query) => query.in("admin_status", ["new", "needs_follow_up"])),
    safeCount("production_requests", (query) => query.in("status", ["pending", "queued", "in_production", "admin_review"])),
    safeCount("production_requests", (query) => query.eq("status", "failed")),
    safeCount("video_requests", (query) => query.in("status", ["pending", "in_production", "failed"])),
    safeCount("partner_applications", (query) => query.eq("status", "pending")),
    safeCount("partner_commission_ledger", (query) => query.in("payout_status", ["pending_review", "manual_margin_review"]))
  ]);

  const items: NotificationItem[] = [
    { label: "Okunmamış gelen kutusu", href: "/admin/inbox", count: unreadLeads.count, priority: "high", note: "Son 300 kayıtta okunmamış iletişim ve lead mesajları." },
    { label: "Assistant conversations", href: "/admin/assistant", count: assistantNeedsReview.count, priority: "high", note: "New messages or conversations needing follow-up." },
    { label: "Production actions", href: "/admin/productions", count: pendingProductions.count, priority: "high", note: "Pending, active, or admin-review jobs (failed jobs shown separately)." },
    { label: "Failed productions", href: "/admin/production-qa", count: failedProductions.count, priority: "high", note: "Credit release/refund and delivery review may be needed." },
    { label: "Video requests", href: "/admin/legacy", count: pendingVideoRequests.count, priority: "medium", note: "Legacy video request statuses." },
    { label: "Partner applications", href: "/admin/partners", count: partnerApplications.count, priority: "medium", note: "New creator or affiliate applications." },
    { label: "Commission reviews", href: "/admin/partners", count: partnerCommissions.count, priority: "medium", note: "Commissions awaiting payout, refund, or margin review." }
  ];

  const available=[unreadLeads,assistantNeedsReview,pendingProductions,failedProductions,pendingVideoRequests,partnerApplications,partnerCommissions].every(x=>x.available);
  const visibleItems = items.filter((item) => item.count > 0);
  const total = visibleItems.reduce((sum, item) => sum + item.count, 0);
  const recentLeads:unknown[] = [];

  return Response.json({ total, available, items: visibleItems, recentLeads, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
