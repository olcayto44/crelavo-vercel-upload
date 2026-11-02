import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("user_id") ?? "";
  if (!userId) return Response.json({ error: "user_required" }, { status: 401 });
  const verified = await requireVerifiedRequestUser(request, userId); if (!verified.ok) return verified.response;
  const { data, error } = await supabaseAdmin().from("production_requests").select("id,title,status,updated_at").eq("user_id", userId).eq("production_type", "website").order("updated_at", { ascending: false }).limit(50);
  if (error) return Response.json({ error: "website_list_failed" }, { status: 502 });
  return Response.json({ websites: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
