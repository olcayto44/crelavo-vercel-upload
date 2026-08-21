import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { buildAssistantKnowledgePrompt } from "@/lib/assistant-knowledge";
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
    product_info: "Crelavo helps users create AI videos, UGC ads, ecommerce campaigns, product videos, websites, apps, SaaS/admin projects, live sales avatars, Growth Intelligence reports, voice-over, dubbing, brand assets and delivery packages. It can explain categories, credits, packages, campaigns, production steps, revisions and dashboard delivery.",
    shipping_info: "Crelavo services are digital. Users receive previews, revisions and final files through the dashboard production/delivery flow.",
    order_info: "Users can track productions in the dashboard after a production record is created and approved."
  };
}

function publicReply(message: string, agent: Record<string, unknown>) {
  const text = message.toLowerCase().trim();
  const shipping = clean(agent.shipping_info);
  const order = clean(agent.order_info);
  const product = clean(agent.product_info);
  const role = clean(agent.avatar_role) || "All-in-one host";
  const language = clean(agent.language) || "auto";
  const platform = clean(agent.platform) || "website";
  const industry = clean(agent.industry) || "e-commerce";
  const turkish = language === "tr" || detectLanguage(message) === "tr";

  if (/^(selam|merhaba|mrb|sa|slm)\b/.test(text)) {
    return turkish
      ? `Merhaba, hoş geldiniz. Crelavo’nun canlı avatarıyım; web sitesi, e-ticaret, sosyal medya ve üretim akışları hakkında yardımcı olabilirim. Ne öğrenmek istersiniz?`
      : `Hello, welcome. I’m Crelavo’s live avatar; I can help with websites, e-commerce, social media, and production workflows. What would you like to know?`;
  }

  if (/(crelavo|neler yapıyorsun|neler yapıyorsunuz|what can you do|what do you do|who are you|you do|ne yaparsın|ne yapıyorsunuz|nedir|nasıl çalışır|nasil calisir)/.test(text)) {
    return turkish
      ? `Crelavo; web sitesi, uygulama, e-ticaret video/reklam üretimi, sosyal medya içerikleri, canlı avatar ve marka üretim akışlarını tek merkezden hazırlayan AI production platformudur. Ben de bunu sitede canlı avatar örneği olarak gösteriyorum.`
      : `Crelavo is an AI production platform for websites, apps, e-commerce videos, ads, social media assets, live avatars, and brand workflows. I’m showing this as a live avatar example on the site.`;
  }

  if (/(kargo|ship|delivery|teslim)/.test(text)) {
    return turkish
      ? `Ben ${role} rolünde yardımcı oluyorum. ${shipping || "Kargo ve teslimat bilgisi henüz eklenmemiş. Teslim süresi, kargo firması ve iade politikasını bağlayınca net yanıt verebilirim."}`
      : `I am helping as an ${role}. ${shipping || "Shipping and delivery details are not added yet. Once you connect carrier, delivery time, and return policy, I can answer precisely."}`;
  }

  if (/(sipariş|order|tracking|status)/.test(text)) {
    return turkish
      ? `Sipariş durumunu yanıtlayabilmem için sipariş numarası ve doğrulama gerekir. ${order || "Sipariş destek akışı henüz eklenmedi."}`
      : `I need an order number and verification to answer order status. ${order || "Order support flow is not added yet."}`;
  }

  if (/(ürün|product|feature|özellik|price|fiyat|kampanya|offer)/.test(text)) {
    return turkish
      ? `${product || "Ürün bilgisi henüz tanımlanmadı."} Bu avatar ${role} olarak ${industry} akışında satış konuşması yapabilir ve müşteriyi doğru teklif sayfasına yönlendirebilir.`
      : `${product || "Product details are not defined yet."} This avatar can act as an ${role} for ${platform} and guide customers toward the right offer.`;
  }

  return turkish
    ? `Canlı satış avatarı hazır. Rol: ${role}. Web sitesi, e-ticaret ve destek akışına göre müşteriye yardımcı olabilirim.`
    : `The live sales avatar is ready. Role: ${role}. I can help customers based on the website, e-commerce, and support flow.`;
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
      reply
    });
  } catch (error) {
    return corsJson({ error: errorMessage(error, "Could not answer live sales chat.") }, { status: 500 });
  }
}
