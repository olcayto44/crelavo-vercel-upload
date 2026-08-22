import { requireAdminPermission } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const allowedStatuses = ["draft", "active", "paused", "review_required", "disabled"];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["support", "productions", "growth"]);
  if (!access.ok) return access.response;

  try {
    const { searchParams } = new URL(request.url);
    const agentId = clean(searchParams.get("agent_id"));
    const search = clean(searchParams.get("search")).toLowerCase();
    const status = clean(searchParams.get("status"));
    const supabase = supabaseAdmin();

    if (agentId) {
      const { data: agent, error } = await supabase
        .from("live_sales_agents")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return Response.json({ agent });
    }

    let query = supabase
      .from("live_sales_agents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    const agents = (data ?? []).filter((agent) => {
      if (!search) return true;
      const haystack = [
        agent.agent_id,
        agent.user_id,
        agent.platform,
        agent.industry,
        agent.avatar_role,
        agent.language,
        agent.product_info,
        agent.shipping_info,
        agent.order_info
      ].map((item) => String(item ?? "").toLowerCase()).join(" ");
      return haystack.includes(search);
    });

    const counts = agents.reduce((acc: Record<string, number>, agent) => {
      const key = String(agent.status ?? "draft");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Response.json({ agents, counts });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load live sales agents") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const access = await requireAdminPermission(request, ["support", "productions", "growth"], body);
  if (!access.ok) return access.response;

  try {
    const agentId = clean(body.agent_id);
    const status = clean(body.status || "draft");
    const adminNotes = clean(body.admin_notes);

    if (!agentId) return Response.json({ error: "agent_id is required." }, { status: 400 });
    if (!allowedStatuses.includes(status)) return Response.json({ error: "Invalid live sales agent status." }, { status: 400 });

    const existing = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata as Record<string, unknown>
      : {};

    const update = {
      status,
      metadata: {
        ...existing,
        adminNotes: adminNotes || null,
        adminStatusUpdatedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin()
      .from("live_sales_agents")
      .update(update)
      .eq("agent_id", agentId)
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({ agent: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not update live sales agent") }, { status: 500 });
  }
}
