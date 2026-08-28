import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "agent";
}

function makeAgentId(userId: string, platform: string, industry: string) {
  const shortUser = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "user";
  return `agent_${shortUser}_${slug(platform)}_${slug(industry)}_${Date.now().toString(36)}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function publicAgentPayload(data: Record<string, unknown>) {
  return {
    agent_id: data.agent_id,
    status: data.status,
    plan_id: data.plan_id,
    platform: data.platform,
    industry: data.industry,
    avatar_source: data.avatar_source,
    avatar_role: data.avatar_role,
    language: data.language,
    voice: data.voice,
    tone: data.tone,
    product_info: data.product_info,
    shipping_info: data.shipping_info,
    order_info: data.order_info,
    availability: data.availability,
    custom_schedule: data.custom_schedule,
     metadata: data.metadata ?? {},
     catalog_snapshot: data.catalog_snapshot ?? []
   };
}

function demoCrelavoAgent(agentId = "agent_demo_live_sales_001") {
  return {
    agent_id: agentId,
    status: "active",
    plan_id: "crelavo_live_demo",
    platform: "Crelavo website",
    industry: "AI production studio and live sales",
    avatar_source: "Crelavo brand avatar",
    avatar_role: "24/7 Crelavo live sales avatar",
    language: "Turkish and English",
    voice: "premium live avatar voice",
    tone: "helpful, sales-aware, practical and natural",
    product_info: "Crelavo categories, credits, campaigns, production packages, videos, websites, apps, SaaS projects, ecommerce ads, Growth Intelligence and live sales avatar services.",
    shipping_info: "Digital delivery happens through previews, revisions and final dashboard files.",
    order_info: "Users can track approved productions from the dashboard productions area.",
    availability: "24/7",
    custom_schedule: "Always on",
    metadata: {}
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function corsJson(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...corsHeaders()
    }
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = clean(searchParams.get("agent_id"));
    const userId = clean(searchParams.get("user_id"));

    if (!agentId && !userId) {
      return corsJson({ error: "agent_id or user_id is required." }, { status: 400 });
    }

    if (agentId) {
      const { data, error } = await supabaseAdmin()
        .from("live_sales_agents")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle();
      if (error) throw error;
      const agent = data || (agentId === "agent_demo_live_sales_001" ? demoCrelavoAgent(agentId) : null);
      if (!agent) return corsJson({ error: "Live sales agent not found." }, { status: 404 });

      return corsJson({ agent: publicAgentPayload(agent as Record<string, unknown>) });
    }

    const verified = await requireVerifiedRequestUser(request, userId);
    if (!verified.ok) return verified.response;

    const { data, error } = await supabaseAdmin()
      .from("live_sales_agents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return corsJson({ agent: null });

    return corsJson({
      agent: {
        agent_id: data.agent_id,
        status: data.status,
        plan_id: data.plan_id,
        platform: data.platform,
        industry: data.industry,
        avatar_source: data.avatar_source,
        avatar_role: data.avatar_role,
        language: data.language,
        voice: data.voice,
        tone: data.tone,
        product_info: data.product_info,
        shipping_info: data.shipping_info,
        order_info: data.order_info,
        availability: data.availability,
        custom_schedule: data.custom_schedule,
         metadata: data.metadata ?? {},
         catalog_snapshot: data.catalog_snapshot ?? []
       }
    });
  } catch (error) {
    return corsJson({ error: errorMessage(error, "Could not load live sales agent.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = clean(body.user_id);
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const platform = clean(body.platform) || "Own website";
    const industry = clean(body.industry) || "E-commerce / Retail";
    const existingAgentId = clean(body.agent_id);
    const agentId = existingAgentId.startsWith("agent_") ? existingAgentId : makeAgentId(userId, platform, industry);
    const now = new Date().toISOString();
    const { data: existingAgent } = await supabaseAdmin()
      .from("live_sales_agents")
      .select("metadata, catalog_snapshot, created_at")
      .eq("agent_id", agentId)
      .maybeSingle();
    const previousMetadata = existingAgent?.metadata && typeof existingAgent.metadata === "object" && !Array.isArray(existingAgent.metadata)
       ? existingAgent.metadata as Record<string, unknown>
       : {};
    const previousCatalog = Array.isArray(existingAgent?.catalog_snapshot) ? existingAgent.catalog_snapshot : [];

     const payload = {
      agent_id: agentId,
      user_id: userId,
      status: "draft",
      plan_id: clean(body.plan_id),
      platform,
      industry,
      avatar_source: clean(body.avatar_source),
      avatar_role: clean(body.avatar_role),
      language: clean(body.language),
      voice: clean(body.voice),
      tone: clean(body.tone),
      product_info: clean(body.product_info),
      shipping_info: clean(body.shipping_info),
      order_info: clean(body.order_info),
      availability: clean(body.availability),
      custom_schedule: clean(body.custom_schedule),
       catalog_snapshot: Array.isArray(body.catalog_snapshot) ? body.catalog_snapshot.slice(0, 50) : previousCatalog,
       metadata: {
         ...previousMetadata,
         embedTheme: "dark",
        embedPosition: "bottom-right",
        source: "dashboard_live_sales_agent"
      },
      updated_at: now,
      created_at: existingAgent?.created_at ?? now
    };

    const { data, error } = await supabaseAdmin()
      .from("live_sales_agents")
      .upsert(payload, { onConflict: "agent_id" })
      .select("*")
      .single();

    if (error) {
      const message = errorMessage(error, "Could not save live sales agent.");
      if (message.toLowerCase().includes("live_sales_agents") || message.toLowerCase().includes("schema") || message.toLowerCase().includes("column")) {
        return Response.json({
          saved: false,
          pending_schema: true,
          agent_id: agentId,
          message: "Agent setup is ready in the UI, but the live_sales_agents database table/columns still need to be created.",
          draft: payload
        });
      }
      throw error;
    }

    return Response.json({ saved: true, agent_id: agentId, agent: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save live sales agent.") }, { status: 500 });
  }
}
