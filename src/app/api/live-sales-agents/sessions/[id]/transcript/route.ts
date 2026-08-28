import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
const clean = (value: unknown) => String(value ?? "").trim();
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = clean(new URL(request.url).searchParams.get("user_id"));
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data: session, error } = await supabase.from("live_sales_sessions").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!session) return Response.json({ error: "Session not found." }, { status: 404 });
  const { data: messages } = await supabase.from("live_sales_session_messages").select("role, content, actions, created_at").eq("session_id", id).order("created_at", { ascending: true });
  const transcript = { session, messages: messages ?? [] };
  const format = new URL(request.url).searchParams.get("format") === "md" ? "md" : "json";
  const body = format === "md" ? `# Live sales session ${id}\n\n- Status: ${session.status}\n- Provider: ${session.provider || "none"}\n\n${(messages ?? []).map((item) => `**${item.role}** (${item.created_at})\n\n${item.content}`).join("\n\n---\n\n")}` : JSON.stringify(transcript, null, 2);
  return new Response(body, { headers: { "Content-Type": format === "md" ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="live-sales-${id}.${format === "md" ? "md" : "json"}"` } });
}
