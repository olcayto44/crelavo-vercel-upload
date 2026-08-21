import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { buildAssistantKnowledgePrompt } from "@/lib/assistant-knowledge";
import { createMiniMaxH3VideoTask, hasMiniMaxConfig } from "@/lib/providers/minimax";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
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

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function detectLanguage(message: string) {
  const text = message.toLowerCase();
  const turkishSignals = /[ğüşöçıİ]/i.test(message) || /(merhaba|selam|kredi|paket|fiyat|ücret|ucret|ödeme|odeme|kampanya|sipariş|siparis|kargo|ürün|urun|nasıl|nasil|nedir|yardım|yardim|evet|tamam|lütfen|lutfen)/.test(text);
  const englishSignals = /(hello|hi|price|pricing|package|credit|campaign|order|shipping|product|how|what|support|help|yes|please|thanks)/.test(text);
  if (turkishSignals && !englishSignals) return "tr";
  if (englishSignals && !turkishSignals) return "en";
  return "auto";
}

function speakingDuration(text: string): 8 | 10 | 12 | 15 {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 22) return 8;
  if (words <= 40) return 10;
  if (words <= 58) return 12;
  return 15;
}

function spokenSnippet(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 360);
}

function minimaxSpeakingAvatarPrompt(reply: string, userMessage: string) {
  const language = detectLanguage(userMessage);
  const languageInstruction = language === "tr" ? "Turkish" : language === "en" ? "English" : "the same language as the visitor";
  const dialogue = spokenSnippet(reply);
  return [
    "Create a vertical 9:16 talking live sales avatar response video for the Crelavo website widget.",
    "A premium AI sales avatar appears waist-up in a modern dark-blue Crelavo digital studio, facing the camera.",
    "The avatar must look alive: natural head motion, eye blinks, facial expression changes, subtle hand gestures, and realistic lip sync.",
    `The avatar speaks in ${languageInstruction}.`,
    "The voice should be a clear adult female voice: warm, friendly, confident, natural, and easy to understand.",
    "Avoid male voice, robotic delivery, garbled pronunciation, or overly fast speech.",
    "Use natural voice audio if the model supports audio. The mouth movement must match the spoken answer.",
    "No subtitles, no captions, no large on-screen text, no logos except a very subtle Crelavo brand feeling in the background.",
    "Keep the framing clean for a small website chat widget: centered face, full head visible, no cropped forehead, no fast camera motion.",
    `Spoken answer, verbatim: \"${dialogue}\"`,
    "End with the avatar looking attentive, ready for the visitor's next question."
  ].join("\n");
}

async function submitMiniMaxSpeakingAvatar(reply: string, userMessage: string) {
  if (!hasMiniMaxConfig()) return null;
  const prompt = minimaxSpeakingAvatarPrompt(reply, userMessage);
  const duration = speakingDuration(reply);
  const result = await createMiniMaxH3VideoTask({
    content: [{ type: "text", text: prompt }],
    resolution: "768P",
    duration,
    ratio: "9:16"
  });
  return {
    provider: "minimax",
    model: "MiniMax-H3",
    status: "submitted",
    task_id: result.task_id || "",
    request_id: result.request_id || "",
    duration,
    ratio: "9:16",
    prompt,
    next: result.task_id ? `/api/minimax?action=query&task_id=${encodeURIComponent(result.task_id)}` : null
  };
}

function demoCrelavoAgent(agentId = "agent_demo_live_sales_001") {
  return {
    agent_id: agentId,
    platform: "Crelavo website",
    industry: "AI production studio, ecommerce, video, websites, apps, SaaS, campaigns and live sales",
    avatar_role: "24/7 Crelavo live sales avatar",
    language: "auto",
    voice: "premium live avatar voice",
    tone: "helpful, sales-aware, practical and natural",
    availability: "24/7",
    product_info: "Crelavo helps users create AI videos, UGC ads, ecommerce campaigns, product videos, websites, apps, SaaS/admin projects, live sales avatars, Growth Intelligence reports, voice-over, dubbing, brand assets and delivery packages. The avatar can explain what it does, how to connect it to a website, store, marketplace or social channel, what hours it can run, how to save the setup, how to copy and paste the embed code, and what to connect next for product, order and shipping data. It can also explain categories, credits, packages, campaigns, production steps, revisions and dashboard delivery.",
    shipping_info: "Crelavo services are digital. Users receive previews, revisions and final files through the dashboard production/delivery flow.",
    order_info: "Users can track productions in the dashboard after a production record is created and approved."
  };
}

function publicReply(message: string, agent: Record<string, unknown>) {
  const language = clean(agent.language) || "auto";
  const platform = clean(agent.platform) || "website";
  const role = clean(agent.avatar_role) || "All-in-one host";
  const product = clean(agent.product_info);
  const shipping = clean(agent.shipping_info);
  const order = clean(agent.order_info);
  const turkish = language === "tr" || detectLanguage(message) === "tr";

  return turkish
    ? `Bu canlı satış avatarı ${platform} için ürün, kargo, sipariş, entegrasyon ve çalışma saatleri hakkında yardımcı olabilir. Setup'ı kaydedip embed kodunu ekleyerek kullanabilir, ürün / sipariş / kargo verilerini bağladıkça daha akıllı hale getirebilirsiniz. Rol: ${role}. ${product || "Ürün bilgisi hazır olduğunda"} müşteriyi doğru teklif sayfasına yönlendirebilir. ${shipping || "Teslimat bilgisi"} ve ${order || "sipariş akışı"} bağlanınca daha net cevap verir.`
    : `This live sales avatar can help with product, shipping, order, integration, and hours for ${platform}. Save the setup, paste the embed code, and connect product, order, and shipping data to make it smarter. Role: ${role}. ${product || "Once product details are ready"} it can guide customers toward the right offer page. It becomes more precise when ${shipping || "delivery info"} and ${order || "order flow"} are connected.`;
}

async function loadAgent(agentId: string) {
  const { data, error } = await supabaseAdmin()
    .from("live_sales_agents")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) throw error;
  return data || (agentId === "agent_demo_live_sales_001" ? demoCrelavoAgent(agentId) : null);
}

async function aiLiveAvatarReply(message: string, agent: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  const language = detectLanguage(message);
  const agentContext = [
    `agent_id: ${clean(agent.agent_id)}`,
    `platform: ${clean(agent.platform) || "Crelavo website"}`,
    `industry: ${clean(agent.industry) || "AI production, ecommerce, websites, apps, video, campaigns and live sales"}`,
    `role: ${clean(agent.avatar_role) || "24/7 Crelavo live sales avatar"}`,
    `language: ${language}`,
    `voice: ${clean(agent.voice) || "brand live avatar voice"}`,
    `tone: ${clean(agent.tone) || "helpful, sales-aware, concise and practical"}`,
    `availability: ${clean(agent.availability) || "24/7"}`,
    `product_info: ${clean(agent.product_info) || "Crelavo offers AI video, UGC ads, ecommerce campaigns, websites, apps, SaaS/admin projects, live sales avatar, Growth Intelligence, voice, dubbing, visual production and delivery workflows."}`,
    `shipping_info: ${clean(agent.shipping_info) || "For Crelavo digital services, delivery is normally handled through the dashboard, preview, revision and final delivery flow."}`,
    `order_info: ${clean(agent.order_info) || "Users can track productions from the dashboard production area after a production is created."}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the 24/7 live Crelavo sales avatar embedded on crelavo.com. You are not a narrow FAQ bot. You answer like a real-time AI sales consultant and general AI assistant. Use the user's language exactly: if the user writes Turkish, answer Turkish; if English, answer English; if another language, answer in that same language as closely as possible.

Hard rules:
- Answer the user's actual question directly.
- Know Crelavo categories, credits, campaigns, pricing logic, dashboard flows, production delivery, live sales avatar plans, Growth Intelligence, video/ad production, websites, apps, SaaS/admin panels, voice/avatar/dubbing and support routes.
- You may also answer safe general knowledge questions like a normal AI assistant, then connect back to Crelavo only when useful.
- Be concise, practical and human.
- Do not claim a production, payment, delivery or live stream has started unless the user is on the real confirmation/production flow.
- For pricing/credits, explain that exact cost depends on duration, quality, provider/API usage and package. Route to pricing/credits pages when useful.
- For live sales avatar: explain 24/7 website/live commerce assistant, product FAQ, categories, offers, campaigns, credit/package guidance, lead capture, human fallback and dashboard control.
- When asked how to use the avatar, explain the practical steps: save the setup, copy the embed code, paste it into a website or store, use a hosted landing page for social channels or marketplaces that do not allow widgets, and connect product/order/shipping data if available.
- When asked about hours, explain business hours, custom schedule, manual start/stop, and any plan-based fair-use/live-hour limits in plain language.

Agent context:
${agentContext}

${buildAssistantKnowledgePrompt()}`
        },
        { role: "user", content: message }
      ],
      temperature: 0.35
    })
  });

  if (!response.ok) return "";
  const data = await response.json().catch(() => ({}));
  return String(data.choices?.[0]?.message?.content ?? "").trim().slice(0, 1800);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const agentId = clean(body.agent_id);
    const message = clean(body.message).slice(0, 2000);
    const userId = clean(body.user_id);
    const sessionId = clean(body.session_id) || crypto.randomUUID();

    if (!agentId) return corsJson({ error: "agent_id is required." }, { status: 400 });
    if (!message) return corsJson({ error: "message is required." }, { status: 400 });

    const guardConfig = apiCostGuardConfig();
    const routeBudget = enforceRouteBudget(request, {
      route: "live-sales-agent-chat",
      userId: agentId,
      ipLimit: guardConfig.assistantChatIpLimit,
      userLimit: guardConfig.assistantChatUserLimit,
      windowMs: 15 * 60 * 1000
    });
    if (!routeBudget.ok) return routeBudget.response;

    if (userId) {
      const verified = await requireVerifiedRequestUser(request, userId);
      if (!verified.ok) return verified.response;
    }

    const agent = await loadAgent(agentId);
    if (!agent) return corsJson({ error: "Live sales agent not found." }, { status: 404 });

    const aiReply = await aiLiveAvatarReply(message, agent).catch(() => "");
    const reply = aiReply || publicReply(message, agent);
    const wantsAvatarVideo = body.avatar_video !== false;
    const avatarVideo = wantsAvatarVideo
      ? await submitMiniMaxSpeakingAvatar(reply, message).catch((error) => ({
        provider: "minimax",
        model: "MiniMax-H3",
        status: "failed_to_submit",
        error: errorMessage(error, "MiniMax speaking avatar task could not be submitted.")
      }))
      : null;

    return corsJson({
      status: "success",
      session_id: sessionId,
      agent: {
        agent_id: agent.agent_id,
        platform: agent.platform,
        industry: agent.industry,
        avatar_role: agent.avatar_role,
        language: agent.language,
        voice: agent.voice,
        tone: agent.tone,
        availability: agent.availability
      },
      reply,
      avatar_video: avatarVideo
    });
  } catch (error) {
    return corsJson({ error: errorMessage(error, "Could not answer live sales chat.") }, { status: 500 });
  }
}
