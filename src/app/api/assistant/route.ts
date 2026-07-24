import { detectActionRoute, detectCategory, detectLanguage, detectStyle, durationForCategory } from "@/lib/assistant-routing.mts";
import { validateProductionSafety } from "@/lib/content-safety";
import { supabaseAdmin } from "@/lib/supabase";
import { getClientIp, grantWelcomeAssistantCreditsOnce } from "@/lib/welcome-assistant-credits";

const ASSISTANT_CREDITS = {
  quick: 100,
  voice: 150,
  detailed: 300,
  script: 500,
  storyboard: 1000,
  drama: 1500
} as const;

type AssistantMode = keyof typeof ASSISTANT_CREDITS;

type AssistantSuggestion = {
  category: string;
  style: string;
  duration: string;
  requestType?: string;
  quality?: string;
  premiumMaterialType?: string;
  premiumMaterialOption?: string;
  suggestedPrompt: string;
  note: string;
  assistantReply?: string;
  action?: string;
  route?: string;
  automationLevel?: string;
  nextStep?: string;
};

function modeFromBody(value: unknown): AssistantMode {
  const mode = String(value ?? "quick") as AssistantMode;
  return mode in ASSISTANT_CREDITS ? mode : "quick";
}

function normalizeSuggestion(raw: Partial<AssistantSuggestion>, idea: string, mode: AssistantMode): AssistantSuggestion {
  const language = detectLanguage(idea);
  const category = detectCategory(raw.category || idea);
  const style = raw.style?.trim() || detectStyle(idea);
  const duration = raw.duration?.trim() || durationForCategory(category, idea);
  const premiumMaterialType = raw.premiumMaterialType?.trim() || "No premium material";
  const premiumMaterialOption = raw.premiumMaterialOption?.trim() || "None";
  const actionRoute = detectActionRoute(idea, category);

  return {
    category,
    style,
    duration,
    requestType: raw.requestType,
    quality: raw.quality?.trim() || (category === "AI Video" ? "1080p" : "Premium"),
    premiumMaterialType,
    premiumMaterialOption,
    suggestedPrompt: raw.suggestedPrompt?.trim() || idea,
    note: raw.note?.trim() || (language === "Turkish"
      ? (mode === "voice" ? "Sesli fikrini analiz ettim. Kurulumu kontrol edip talep formuna geçebilirsin." : "Fikrini analiz ettim. Kurulumu kontrol edip talep formuna geçebilirsin.")
      : (mode === "voice" ? "Voice idea analyzed. Review the setup, then continue to the request form." : "Idea analyzed. Review the setup, then continue to the request form.")),
    assistantReply: raw.assistantReply?.trim() || (language === "Turkish"
      ? `Fikrini analiz ettim ve full otomatik akış için en doğru adımı hazırladım: ${category}, ${style}, ${duration}. ${actionRoute.nextStep}.`
      : `I analyzed your request and prepared the best fully automatic next step: ${category}, ${style}, ${duration}. ${actionRoute.nextStep}.`),
    action: raw.action?.trim() || actionRoute.action,
    route: raw.route?.trim() || actionRoute.route,
    automationLevel: raw.automationLevel?.trim() || "full_auto",
    nextStep: raw.nextStep?.trim() || actionRoute.nextStep
  };
}

function localSuggestion(idea: string, mode: AssistantMode): AssistantSuggestion {
  return normalizeSuggestion({
    category: detectCategory(idea),
    style: detectStyle(idea),
    duration: durationForCategory(detectCategory(idea), idea),
    suggestedPrompt: idea
  }, idea, mode);
}

function normalizeConversationText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function isGeneralAssistantChat(idea: string) {
  const normalized = normalizeConversationText(idea);
  const hasQuestionSignal = /\?/.test(idea) || /(selam|merhaba|naber|nasilsin|iyimisin|iyi misin|kimsin|nerenin|neden|nasil|nedir|ne demek|hangi|kim|nerede|kac|yorum|fikir|oneri|tavsiye|anlat|acikla|what|why|how|who|which|where|when|advice|recommend)/.test(normalized);
  const hasProductionSignal = /(uret|olustur|tasarla|video|reklam|kampanya|website|web sitesi|site|saas|uygulama|app|avatar|gorsel|logo|brand|document|pdf|shopify|amazon|trendyol)/.test(normalized);
  return hasQuestionSignal && !hasProductionSignal;
}

function generalAssistantSuggestion(idea: string, mode: AssistantMode, generatedReply = ""): AssistantSuggestion {
  const language = detectLanguage(idea);
  const normalized = normalizeConversationText(idea);
  const turkish = language === "Turkish" || /[çğıöşü]/i.test(idea) || /(selam|merhaba|nasilsin|iyimisin|kimsin|nerenin|turkce|neden|nasil|nedir|yorum|fikir|oneri|tavsiye)/.test(normalized);
  const fallbackReply = turkish
    ? (/^(selam|merhaba|sa|slm|hey)\b/.test(normalized)
      ? "Selam, buradayım. Genel soru, fikir, kod, site işi veya üretim isteği yazabilirsin."
      : /(kimsin|nerenin)/.test(normalized)
        ? "Ben Crelavo içindeki yapay zekâ asistanıyım; sadece site formu değil, genel sohbet, fikir, yorum, kod ve üretim akışlarında da yardımcı olurum."
        : "Sorunu aldım. Bunu üretim formuna zorlamadan normal asistan gibi cevaplayacağım; üretim komutuysa tek prompt veya sesli komutla çalışma alanına taşıyacağım.")
    : "I’m here. I can answer general questions, discuss ideas, help with code, or route a real production request into the workspace.";
  const assistantReply = generatedReply.trim() || fallbackReply;
  return normalizeSuggestion({
    category: "AI Agents",
    style: "Premium SaaS",
    duration: "Project based",
    quality: "Premium",
    suggestedPrompt: idea,
    note: turkish ? "Genel sohbet olarak yanıtlandı; üretim kredisi harcanmadı." : "Answered as general chat; no production credits were spent.",
    assistantReply,
    action: "browse_catalog",
    route: "/dashboard/assistant-workspace",
    automationLevel: "conversation",
    nextStep: turkish ? "İstersen tek prompt veya sesli komutla üretim başlat" : "Start production with one prompt or voice command if needed"
  }, idea, mode);
}

async function openAiGeneralReply(idea: string, history: { role: "user" | "assistant"; content: string }[] = []): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";
  const language = detectLanguage(idea);
  const recentHistory = history.slice(-8).map((message) => ({ role: message.role, content: message.content }));
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are Crelavo's normal conversational assistant. Answer like ChatGPT or Gemini: a broad-world general AI partner with practical execution ability, not a narrow menu bot. Use ${language}. Help with almost any safe topic: general knowledge, business, SaaS, coding, APIs, Vercel, GitHub, deployment, design, marketing, health information, education, writing, strategy, troubleshooting, creative production, and unusual edge-case questions. If something can be answered, answer it directly. If something can be planned, design the plan. If something can be built through Crelavo, turn it into a Crelavo production path. If something needs user action, guide one clear step at a time. Refuse only unsafe/illegal requests or impossible real-world access, and give a safe alternative. Do not force general questions into production forms. Never claim that production has started, is rendering, is completed, or is visible in the dashboard unless the app has actually opened the production/credit confirmation step or a production record exists. If the user asks whether you/Crelavo can build a SaaS, website, app, landing page, admin panel, AI sales agent, video, ad or campaign for them, answer yes and explain that Crelavo can turn it into a managed production plan with dashboard delivery, source/package delivery when applicable, AI + human QA, and API/provider setup guidance. Never say you cannot build it; say you can help prepare and launch it through the Crelavo workflow. If the user says they do not know code/API, reassure them and give the next concrete step inside Crelavo, not generic advice. If the user asks to inspect or discuss crelavo.com, summarize Crelavo from known platform context instead of saying you cannot access external sites. For non-Crelavo external sites, ask the user to paste the URL/page text or screenshots if live browsing is unavailable. If the user wants a TikTok/video with duration, voice-over, subtitles, music, hook, cover/thumbnail or style, produce a concise production brief and next step, not a generic advice list. If the user asks for design, do the design work directly: propose a concrete visual direction, page sections, hero copy, color/style, layout, CTA, dashboard structure and what you will prepare next. Never answer with “use Figma/Canva/Webflow/Bubble”, “hire a developer/designer/freelancer”, or generic SaaS setup steps unless the user explicitly asks for outside tools. Avoid long numbered textbook lists; behave like a hands-on Crelavo production partner. Keep it short unless the user asks for detail.` },
        ...recentHistory,
        { role: "user", content: idea }
      ]
    })
  });
  if (!response.ok) return "";
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "").trim();
}

async function openAiSuggestion(idea: string, mode: AssistantMode, history: { role: "user" | "assistant"; content: string }[] = []): Promise<AssistantSuggestion | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const recentHistory = history.slice(-8).map((message) => ({ role: message.role, content: message.content }));
  const language = detectLanguage(idea);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Crelavo's senior AI production partner, not a form bot. Behave like a decisive creative/technical operator inside a fully automatic production platform: understand the user's intent, infer the best production path, preserve the user's wording, ask only when a missing detail would block the job, and otherwise move the work forward. Crelavo can build SaaS sites, websites, apps, admin panels, AI sales agents, videos, ads and campaigns as managed productions; never tell the user you cannot build the site for them. Never claim that production has started, is rendering, is completed, or is visible in the dashboard unless the app has actually opened the production/credit confirmation step or a production record exists. If the user says they do not know code/API, reassure them and give the next concrete step inside Crelavo, not generic advice. If the user asks about crelavo.com, summarize the platform from Crelavo context instead of claiming no access. If the user asks for a TikTok/video with duration, English voice-over, subtitles, background music, cinematic style, hook, cover image or 3-word cover text, convert those into production fields and a clear brief. If the user asks for design, do the design work directly with concrete visual direction, page sections, hero copy, color/style, layout, CTA and dashboard structure. Never recommend Figma/Canva/Webflow/Bubble, hiring a developer/designer/freelancer, or generic SaaS setup steps unless the user explicitly asks for outside tools. Return only JSON with category, style, duration, requestType, quality, premiumMaterialType, premiumMaterialOption, suggestedPrompt, note, assistantReply, action, route, automationLevel, nextStep. assistantReply and note must be written in ${language}. If the user writes Turkish, answer in Turkish. If the user writes English, answer in English. If the user writes another language, answer in that same language. Do not switch to English unless the user's latest message is English. Never sound like a generic FAQ or static menu. If the user is vague, respond like a helpful production teammate: briefly say what you understood, choose a sensible default, mention the next concrete step, and route them to the correct action. If the user says to continue, continue from the recent context instead of asking them to repeat everything. If they say they do not want a material/feature, skip it and keep the production flow moving. Valid actions include start_automatic_production, add_materials, external_publish, context_adaptation, manage_credits, track_delivery, browse_catalog, account_settings, admin_operations. Valid categories are Text-to-Campaign, AI Agents, Global Localization, Website, Mobile App, SaaS, AI Video, Image / Visual, Brand Kit, Document / File Pack, Admin Panel Project. Important routing: e-commerce website/storefront/cart/checkout/product page requests are Website projects; Shopify app/App Store integration is SaaS; product link ad or product advertising campaign is Text-to-Campaign. Valid styles include Premium SaaS, Luxury Brand, Startup Clean, Bold Social, Minimal Corporate, Mobile App Modern, E-commerce Product, Editorial Document, Cinematic Video, Global Campaign, Agentic Marketing. For non-video projects use duration as Project based. automationLevel must be full_auto. Keep suggestions practical, decisive, source-file focused, automation-aware, cost-aware, and ready to become a production record.`
        },
        ...recentHistory,
        { role: "user", content: `Mode: ${mode}\nLatest user message: ${idea}` }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("AI assistant provider failed.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  return normalizeSuggestion(JSON.parse(content) as Partial<AssistantSuggestion>, idea, mode);
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const userEmail = String(body.user_email ?? "").trim().toLowerCase();
  const idea = String(body.idea ?? "").trim().slice(0, 2000);
  const mode = modeFromBody(body.mode);
  const history = Array.isArray(body.messages)
    ? body.messages
        .map((message: { role?: string; content?: string }) => ({
          role: message.role === "assistant" ? "assistant" as const : "user" as const,
          content: String(message.content ?? "").slice(0, 1200)
        }))
        .filter((message: { content: string }) => message.content.trim().length > 0)
    : [];
  const requiredCredits = ASSISTANT_CREDITS[mode];

  if (!userId || !userEmail) {
    return Response.json({ error: "Please log in before using the AI Assistant." }, { status: 401 });
  }

  if (!idea) {
    return Response.json({ error: "Write your production idea first." }, { status: 400 });
  }

  const safety = validateProductionSafety([idea, ...history.map((message: { content: string }) => message.content)]);
  if (!safety.ok) {
    return Response.json({ error: safety.message }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUser.user) {
      return Response.json({ error: "User could not be verified. Please log in again." }, { status: 401 });
    }
    if (!authUser.user.email_confirmed_at && !authUser.user.confirmed_at) {
      return Response.json({ error: "Email confirmation is required before using the AI Assistant. Please open the confirmation link sent to your email." }, { status: 403 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: userEmail, full_name: String(authUser.user.user_metadata?.full_name ?? "") || null, role: "user" }, { onConflict: "id" });

    if (profileError) throw profileError;

    await grantWelcomeAssistantCreditsOnce({ supabase, userId, email: userEmail, ipAddress: getClientIp(request) });

    if (isGeneralAssistantChat(idea)) {
      const generatedReply = await openAiGeneralReply(idea, history).catch(() => "");
      return Response.json({
        suggestion: generalAssistantSuggestion(idea, mode, generatedReply),
        chargedCredits: 0,
        chargeSource: "conversation",
        assistantBalance: null,
        balance: null,
        available: null
      });
    }

    const { data: assistantBalanceRow, error: assistantBalanceError } = await supabase
      .from("assistant_credit_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (assistantBalanceError) throw assistantBalanceError;

    const assistantBalance = assistantBalanceRow?.balance ?? 0;
    let chargeSource: "assistant_trial" | "production" = "production";
    let nextAssistantBalance = assistantBalance;
    let nextBalance = 0;

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;
    const available = balance - reserved;

    if (available >= requiredCredits) {
      chargeSource = "production";
      nextBalance = balance - requiredCredits;
    } else if (assistantBalance >= requiredCredits) {
      chargeSource = "assistant_trial";
      nextAssistantBalance = assistantBalance - requiredCredits;
    } else {
      return Response.json({
        error: `Your AI Assistant trial credits are finished. To continue, prepare production plans and start video, image or document jobs, you need to buy credits. Required credits for this action: ${requiredCredits}.`,
        requiredCredits,
        assistantAvailable: assistantBalance,
        available,
        redirect: "/dashboard/credits"
      }, { status: 402 });
    }

    const suggestion = await openAiSuggestion(idea, mode, history) ?? localSuggestion(idea, mode);

    if (chargeSource === "assistant_trial") {
      const { error: spendError } = await supabase
        .from("assistant_credit_balances")
        .upsert({ user_id: userId, balance: nextAssistantBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      if (spendError) throw spendError;
    } else {
      const { error: spendError } = await supabase
        .from("credit_balances")
        .upsert({
          user_id: userId,
          balance: nextBalance,
          reserved,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (spendError) throw spendError;
    }

    const { error: eventError } = await supabase
      .from("credit_events")
      .insert({
        user_id: userId,
        type: "spend",
        amount: requiredCredits,
        note: chargeSource === "assistant_trial" ? `AI Assistant ${mode} analysis (trial credits)` : `AI Assistant ${mode} analysis (production credits)`
      });

    if (eventError) throw eventError;

    return Response.json({
      suggestion,
      chargedCredits: requiredCredits,
      chargeSource,
      assistantBalance: chargeSource === "assistant_trial" ? nextAssistantBalance : assistantBalance,
      balance: chargeSource === "production" ? nextBalance : balance,
      available: chargeSource === "production" ? nextBalance - reserved : available
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Assistant could not run.";
    return Response.json({ error: message }, { status: 500 });
  }
}
