import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

const clean = (value: unknown) => String(value ?? "").trim();
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Live sales session could not be saved.";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const userId = clean(params.get("user_id"));
    const agentId = clean(params.get("agent_id"));
    if (!userId || !agentId) return Response.json({ error: "user_id and agent_id are required." }, { status: 400 });
    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;
    const { data, error } = await supabaseAdmin().from("live_sales_sessions").select("*").eq("user_id", userId).eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    return Response.json({ sessions: data ?? [] });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = clean(body.user_id);
    const agentId = clean(body.agent_id);
    const action = clean(body.action);
    if (!userId || !agentId || !["create", "start", "stop"].includes(action)) return Response.json({ error: "user_id, agent_id and action (create/start/stop) are required." }, { status: 400 });
    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;
    const supabase = supabaseAdmin();
    const { data: agent, error: agentError } = await supabase.from("live_sales_agents").select("agent_id, metadata").eq("agent_id", agentId).eq("user_id", userId).maybeSingle();
    if (agentError) throw agentError;
    if (!agent) return Response.json({ error: "Live sales agent not found." }, { status: 404 });
    if (action === "stop") {
      const sessionId = clean(body.session_id);
      if (!sessionId) return Response.json({ error: "session_id is required to stop a session." }, { status: 400 });
      const { data, error } = await supabase.from("live_sales_sessions").update({ status: "stopped", stopped_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", sessionId).eq("agent_id", agentId).eq("user_id", userId).select("*").single();
      if (error) throw error;
      return Response.json({ session: data, provider_result: { status: "unsupported", message: "No live-stream provider is connected; the session was stopped and persisted without fabricating a stream." } });
    }
    const metadata = agent.metadata && typeof agent.metadata === "object" ? agent.metadata as Record<string, unknown> : {};
    const provider = clean(metadata.liveStreamProvider);
    const providerReady = Boolean(provider && metadata.liveStreamProviderReady === true);
    const status = action === "start" ? (providerReady ? "starting" : "provider_required") : "created";
    const { data, error } = await supabase.from("live_sales_sessions").insert({ agent_id: agentId, user_id: userId, status, provider: provider || null, metadata: { requestedAction: action, providerReady } }).select("*").single();
    if (error) throw error;
    return Response.json({ session: data, provider_result: providerReady ? { status: "starting", provider } : { status: "provider_required", message: "A live-stream provider is required. Avatar preview/talking-video remains available, but no fake live URL was created." } });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}
