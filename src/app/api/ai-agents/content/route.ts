import { generateSocialAgentContent, type SocialAgentInput } from "@/lib/providers/openai";
import { ProviderConfigError } from "@/lib/providers/types";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

const agentTypes = ["agent_brand_face", "agent_social_manager", "agent_live_brand"] as const;
type AgentType = typeof agentTypes[number];

function clean(value: unknown, max = 1200) {
  return String(value ?? "").trim().slice(0, max);
}

function array(value: unknown, max = 12) {
  return Array.isArray(value) ? Array.from(new Set(value.map((item) => clean(item, 160)).filter(Boolean))).slice(0, max) : [];
}

function agentId(userId: string, type: AgentType) {
  return `agent_${userId.replace(/[^a-z0-9]/gi, "").slice(0, 10)}_${type}_${Date.now().toString(36)}`;
}

function markdown(input: SocialAgentInput, content: Awaited<ReturnType<typeof generateSocialAgentContent>>, id: string) {
  const posts = content.platformPosts.map((item) => `## ${item.platform}\n\n**Hook:** ${item.hook}\n\n${item.post}\n\n**Caption:** ${item.caption}\n\n**CTA:** ${item.cta}\n\n**Hashtags:** ${item.hashtags.join(" ")}`).join("\n\n");
  const calendar = content.calendar.map((item) => `| ${item.day} | ${item.platform} | ${item.pillar} | ${item.format} | ${item.topic} | ${item.objective} |`).join("\n");
  return `# ${input.brandName} — Social Content Package\n\n- Agent: ${input.agentType}\n- Agent ID: ${id}\n- Market: ${input.languageMarket}\n- Platforms: ${input.platforms.join(", ")}\n- Frequency: ${input.postingFrequency}\n- Publishing status: **approval_required / not published**\n\n## Positioning\n\n${content.positioning}\n\n## Content pillars\n\n${content.contentPillars.map((item) => `- **${item.name}:** ${item.purpose} — ${item.ideas.join("; ")}`).join("\n")}\n\n## Platform content\n\n${posts}\n\n## Content calendar\n\n| Day | Platform | Pillar | Format | Topic | Objective |\n|---|---|---|---|---|---|\n${calendar}\n\n## Next steps\n\n${content.nextSteps.map((item) => `- ${item}`).join("\n")}\n\n> Crelavo creates an export-ready draft. No connected account was published without explicit user approval.`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id, 100);
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const type = clean(body.agent_type, 40) as AgentType;
  if (!agentTypes.includes(type)) return Response.json({ error: "agent_type must be agent_brand_face, agent_social_manager or agent_live_brand." }, { status: 400 });
  const input: SocialAgentInput = {
    agentType: type,
    brandName: clean(body.brand_name, 160),
    product: clean(body.product, 1000),
    industry: clean(body.industry, 180),
    audience: clean(body.audience, 500),
    languageMarket: clean(body.language_market, 180),
    tone: clean(body.tone, 300),
    contentPillars: array(body.content_pillars, 8),
    platforms: array(body.platforms, 8),
    postingFrequency: clean(body.posting_frequency, 120)
  };
  const missing = Object.entries(input).filter(([key, value]) => key !== "agentType" && (!value || Array.isArray(value) && value.length === 0)).map(([key]) => key);
  if (missing.length) return Response.json({ error: "required_fields", missing }, { status: 400 });

  try {
    const content = await generateSocialAgentContent(input);
    const id = agentId(userId, type);
    const origin = new URL(request.url).origin;
    const deliveryLink = `${origin}/dashboard/ai-agents?agent_id=${encodeURIComponent(id)}`;
    const output = { input, content, agent_id: id, provider: "openai", provider_model: process.env.OPENAI_SOCIAL_AGENT_MODEL || process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini", status: "ready_for_review", publish_status: "approval_required", delivery_link: deliveryLink, generated_at: new Date().toISOString() };
    const { data: agent, error } = await supabaseAdmin().from("live_sales_agents").upsert({ agent_id: id, user_id: userId, status: "active", plan_id: type, platform: input.platforms.join(", "), industry: input.industry, avatar_source: type === "agent_brand_face" ? "AI brand face" : "Content agent", avatar_role: type, language: input.languageMarket, voice: "Not configured", tone: input.tone, product_info: `${input.brandName}: ${input.product}`, availability: input.postingFrequency, custom_schedule: input.postingFrequency, metadata: { source: "ai_agents_content", contentPackage: output, publishPolicy: "approval_required" }, updated_at: new Date().toISOString() }, { onConflict: "agent_id" }).select("agent_id,status,plan_id,platform,industry,metadata,created_at,updated_at").single();
    if (error) return Response.json({ error: "database_required", message: error.message }, { status: 503 });
    return Response.json({ agent, output, markdown: markdown(input, content, id), downloads: { json: `${deliveryLink}&format=json`, markdown: `${deliveryLink}&format=markdown` } });
  } catch (error) {
    if (error instanceof ProviderConfigError) return Response.json({ error: "provider_required", message: "OPENAI_API_KEY is required for real AI social content." }, { status: 503 });
    return Response.json({ error: error instanceof Error ? error.message : "AI social content generation failed." }, { status: 502 });
  }
}
