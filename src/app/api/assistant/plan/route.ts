import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { buildAssistantRoutingRules } from "@/lib/assistant-knowledge";
import { buildAssistantUserContextPrompt, loadAssistantUserContext } from "@/lib/assistant-user-context";
import { validateProductionSafety } from "@/lib/content-safety";
import { normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { estimateProductionCost } from "@/lib/production";
import { packageIdFromSelection } from "@/lib/production-payload";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { getClientIp, grantWelcomeAssistantCreditsOnce } from "@/lib/welcome-assistant-credits";

const PLAN_CREDITS = {
  quick: 100,
  voice: 150,
  detailed: 300,
  script: 500,
  storyboard: 1000,
  drama: 1500
} as const;

type PlanMode = keyof typeof PLAN_CREDITS;

type AssistantHistoryMessage = { role: "user" | "assistant"; content: string };

type AgentAction = {
  name: string;
  intent: string;
  production_type: string;
  confirmation_required: boolean;
  credit_check_required: boolean;
  provider_route: string;
  state_before_confirmation: "draft_ready";
  next_backend_endpoint: string;
  args: Record<string, unknown>;
};

type AiProductionDraft = {
  production_type?: string;
  selected_quality?: string;
  selected_duration?: string;
  selected_style?: string;
  selected_modules?: string[];
  selected_features?: string[];
  selected_platforms?: string[];
  missing_fields?: string[];
  workflow_stage?: string;
  next_user_action?: string;
  delivery_path?: string[];
  summary?: string;
  next_step?: string;
  agent_action?: AgentAction;
};

function modeFromBody(value: unknown): PlanMode {
  const mode = String(value ?? "quick") as PlanMode;
  return mode in PLAN_CREDITS ? mode : "quick";
}

function hasUrl(text: string) {
  return /https?:\/\/\S+/i.test(text);
}

function actionNameForProductionType(productionType: string) {
  if (["campaign", "video", "music_video", "animation"].includes(productionType)) return "create_ai_video";
  if (["image", "brand_kit"].includes(productionType)) return "generate_image";
  if (productionType === "talking_video") return "run_lip_sync";
  if (productionType === "website") return "create_website_project";
  if (productionType === "saas") return "create_saas_project";
  if (productionType === "mobile_app") return "create_mobile_app_project";
  if (productionType === "admin_project") return "create_admin_panel_project";
  if (productionType === "document_pack") return "create_document_pack";
  return "create_production";
}

function detectProductionType(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/shopify|amazon|trendyol|woocommerce|ürün link|urun link|product link|kampanya|reklam|ad video|tiktok reklam|instagram reklam|marketplace/.test(text)) return "campaign";
  if (/konuşmalı|konusmali|talking video|lip sync|lip-sync|dudak|avatar video/.test(text)) return "talking_video";
  if (/web sitesi|website|landing|site|e-?commerce|e-ticaret|storefront|checkout|sepet/.test(text)) return "website";
  if (/saas|dashboard|portal|subscription|billing/.test(text)) return "saas";
  if (/mobil|mobile app|uygulama|ios|android|expo/.test(text)) return "mobile_app";
  if (/admin panel|yönetim panel|yonetim panel|crud/.test(text)) return "admin_project";
  if (/logo|brand kit|marka kiti|kurumsal kimlik|visual identity/.test(text)) return "brand_kit";
  if (/pdf|doküman|dokuman|pitch deck|sunum|proposal|document/.test(text)) return "document_pack";
  if (/görsel|gorsel|image|poster|afiş|afis|banner|thumbnail|kapak/.test(text)) return "image";
  if (/müzik video|music video|mv|lyric/.test(text)) return "music_video";
  if (/animasyon|animation/.test(text)) return "animation";
  return "video";
}

function detectQuality(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/4k|ultra|yüksek çözünürlük|yuksek cozunurluk/.test(text)) return "4K";
  if (/720p|test|draft|taslak/.test(text)) return "720p draft";
  if (/premium|1080p|hd|sinematik|cinematic/.test(text)) return "1080p";
  return "1080p";
}

function detectDuration(message: string, productionType: string) {
  const match = message.match(/(\d{1,3})\s*(sn|sec|saniye|second|seconds|dk|dakika|min|minute)/i);
  if (match) return /dk|dakika|min|minute/i.test(match[2]) ? `${Number(match[1]) * 60} sec` : `${Number(match[1])} sec`;
  if (["website", "saas", "mobile_app", "admin_project", "brand_kit", "document_pack"].includes(productionType)) return "Project based";
  return "30 sec";
}

function detectStyle(message: string, productionType: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/sinematik|cinematic|film/.test(text)) return "Cinematic";
  if (/lüks|luxury|premium/.test(text)) return "Luxury Brand";
  if (/minimal|clean|sade/.test(text)) return "Minimal Corporate";
  if (/saas|startup/.test(text)) return "Premium SaaS";
  if (/e-?commerce|shopify|amazon|trendyol|ürün|urun/.test(text)) return "Bold Social";
  if (["website", "saas", "mobile_app", "admin_project"].includes(productionType)) return "Premium SaaS";
  return "Cinematic";
}

function detectPlatforms(message: string, productionType: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const platforms = [
    /tiktok/.test(text) ? "TikTok" : null,
    /instagram|reels/.test(text) ? "Instagram" : null,
    /youtube|shorts/.test(text) ? "YouTube Shorts" : null,
    /shopify/.test(text) ? "Shopify" : null,
    /amazon/.test(text) ? "Amazon" : null,
    /trendyol/.test(text) ? "Trendyol" : null,
    /linkedin/.test(text) ? "LinkedIn" : null
  ].filter(Boolean) as string[];
  if (platforms.length) return platforms;
  if (productionType === "campaign") return ["TikTok", "Instagram", "Dashboard delivery"];
  return ["Dashboard delivery"];
}

function detectModules(message: string, productionType: string) {
  if (productionType === "campaign") return ["E-commerce product pack", "Product visual set"];
  if (productionType === "website") return ["Website", "Responsive pages"];
  if (productionType === "saas") return ["SaaS screen", "Dashboard flow"];
  if (productionType === "mobile_app") return ["Mobile app", "App screens"];
  if (productionType === "admin_project") return ["Admin panel", "CRUD modules"];
  if (productionType === "image") return ["Image generation"];
  if (productionType === "document_pack") return ["Document / File Pack"];
  return ["AI video"];
}

function detectFeatures(message: string, productionType: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const features = [
    /voice|seslendirme|dublaj|kendi ses/.test(text) ? "Voice-over" : null,
    /subtitle|altyaz/.test(text) ? "Subtitles" : null,
    /source|kaynak|zip|readme|kurulum|setup/.test(text) ? "Working source package" : "Production package",
    /3 alternatif|3 alternatives|varyasyon/.test(text) ? "3 alternatives" : null,
    /5 alternatif|5 alternatives/.test(text) ? "5 alternatives" : null,
    /revision|revizyon/.test(text) ? "Revision right" : null
  ].filter(Boolean) as string[];
  if (["website", "saas", "mobile_app", "admin_project"].includes(productionType) && !features.includes("Working source package")) features.push("Working source package");
  if (productionType === "campaign" && !features.includes("Subtitles")) features.push("Subtitles");
  return Array.from(new Set(features));
}

function deliveryRequirements(message: string, productionType: string, features: string[], platforms: string[], quality: string) {
  const signal = `${message} ${productionType} ${features.join(" ")} ${platforms.join(" ")} ${quality}`.toLocaleLowerCase("tr-TR");
  const formats = [
    /mp4|video|reklam|campaign|tiktok|instagram/.test(signal) ? "final_mp4" : null,
    /zip|paket/.test(signal) ? "final_zip" : null,
    /source|kaynak|working source/.test(signal) ? "source_code" : null,
    /readme|setup|kurulum/.test(signal) ? "readme" : null,
    /subtitle|altyaz/.test(signal) ? "subtitle_file" : null,
    /thumbnail|cover|kapak/.test(signal) ? "thumbnail" : null,
    /pdf|document|doküman|dokuman/.test(signal) ? "pdf" : null,
    /admin panel/.test(signal) ? "admin_panel" : null,
    /4k/.test(signal) ? "4k_export" : null
  ].filter(Boolean) as string[];
  return {
    requested: formats.length > 0,
    status: "pending",
    formats: formats.length ? Array.from(new Set(formats)) : ["dashboard_delivery"]
  };
}

function missingFields(message: string, productionType: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const missing: string[] = [];
  if (productionType === "campaign" && /link|shopify|amazon|trendyol|ürün|urun|product/.test(text) && !hasUrl(message)) missing.push("product_url");
  if (["website", "saas", "mobile_app", "admin_project"].includes(productionType) && !/(marka|brand|şirket|sirket|business|proje|project|uygulama|app|site)/.test(text)) missing.push("project_name_or_business_context");
  if (productionType === "talking_video" && !/(ses|voice|kişi|kisi|person|avatar)/.test(text)) missing.push("speaker_or_voice_direction");
  return missing;
}

function assistantSummary(message: string, productionType: string, packageId: string, missing: string[], credits: number) {
  const tr = /[çğıöşü]/i.test(message) || /\b(bana|için|icin|istiyorum|yap|ürün|urun|reklam|site|uygulama)\b/i.test(message);
  if (tr) {
    return missing.length
      ? `Talebi ${productionType} işi olarak planladım. Eksik kritik bilgi: ${missing.join(", ")}. Tahmini rezerv: ${credits.toLocaleString()} kredi.`
      : `Talebi ${productionType} işi olarak planladım. Paket: ${packageId}. Tahmini rezerv: ${credits.toLocaleString()} kredi.`;
  }
  return missing.length
    ? `I planned this as a ${productionType} production. Missing critical field: ${missing.join(", ")}. Estimated reserve: ${credits.toLocaleString()} credits.`
    : `I planned this as a ${productionType} production. Package: ${packageId}. Estimated reserve: ${credits.toLocaleString()} credits.`;
}

function cleanStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 12);
  return cleaned.length ? Array.from(new Set(cleaned)) : fallback;
}

async function openAiProductionDraft(message: string, mode: PlanMode, history: AssistantHistoryMessage[], userContextPrompt = ""): Promise<AiProductionDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

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
          content: `You are Crelavo's advanced production brain and turnkey project guide. Convert the latest user request into a concrete production plan for an AI creative/product/software studio. Return only JSON with production_type, selected_quality, selected_duration, selected_style, selected_modules, selected_features, selected_platforms, missing_fields, workflow_stage, next_user_action, delivery_path, summary, next_step. Use the same language as the user's latest message for summary, next_user_action and next_step. Be decisive: ask for missing fields only when production would be blocked. Do not treat example subjects as fixed categories; infer the workflow dynamically. Valid production_type values: campaign, talking_video, website, saas, mobile_app, admin_project, brand_kit, document_pack, image, music_video, animation, video. Prefer practical module names that already exist in Crelavo, such as AI video, Product ad video, Website, SaaS screen, Admin panel, Voice-over, Subtitles, Music, Final ZIP, README, Dashboard delivery, TikTok, Instagram Reels, YouTube Shorts. delivery_path should describe the real turnkey path such as brief, materials, preview, revision, final delivery, or structure, local preview, testing, admin handoff for software.\n\n${buildAssistantRoutingRules()}\n\n${userContextPrompt}`
        },
        ...history.slice(-8),
        { role: "user", content: `Mode: ${mode}\nLatest request: ${message}` }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as AiProductionDraft;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const userEmail = String(body.user_email ?? "").trim().toLowerCase();
  const message = String(body.idea ?? body.message ?? "").trim().slice(0, 2000);
  const mode = modeFromBody(body.mode);
  const history: AssistantHistoryMessage[] = Array.isArray(body.messages)
    ? body.messages
        .map((item: { role?: string; content?: string }) => ({
          role: item.role === "assistant" ? "assistant" as const : "user" as const,
          content: String(item.content ?? "").slice(0, 1200)
        }))
        .filter((item: AssistantHistoryMessage) => item.content.trim().length > 0)
    : [];
  const requiredCredits = PLAN_CREDITS[mode];

  if (!userId || !userEmail) return Response.json({ error: "Please log in before using the AI Assistant." }, { status: 401 });
  const guardConfig = apiCostGuardConfig();
  const routeBudget = enforceRouteBudget(request, { route: "assistant-plan", userId, ipLimit: guardConfig.assistantPlanIpLimit, userLimit: guardConfig.assistantPlanUserLimit, windowMs: 15 * 60 * 1000 });
  if (!routeBudget.ok) return routeBudget.response;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  if (!message) return Response.json({ error: "Write your production idea first." }, { status: 400 });

  const safety = validateProductionSafety([message]);
  if (!safety.ok) return Response.json({ error: safety.message }, { status: 400 });

  try {
    const supabase = supabaseAdmin();
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUser.user) return Response.json({ error: "User could not be verified. Please log in again." }, { status: 401 });

    const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, email: userEmail, full_name: String(authUser.user.user_metadata?.full_name ?? "") || null, role: "user" }, { onConflict: "id" });
    if (profileError) throw profileError;

    await grantWelcomeAssistantCreditsOnce({ supabase, userId, email: userEmail, ipAddress: getClientIp(request) });

    const { data: assistantBalanceRow, error: assistantBalanceError } = await supabase.from("assistant_credit_balances").select("balance").eq("user_id", userId).maybeSingle();
    if (assistantBalanceError) throw assistantBalanceError;
    const assistantBalance = assistantBalanceRow?.balance ?? 0;

    const { data: balanceRow, error: balanceError } = await supabase.from("credit_balances").select("balance, reserved").eq("user_id", userId).maybeSingle();
    if (balanceError) throw balanceError;
    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;
    const available = balance - reserved;

    let chargeSource: "assistant_trial" | "production" = "production";
    let nextAssistantBalance = assistantBalance;
    let nextBalance = balance;

    if (available >= requiredCredits) {
      chargeSource = "production";
      nextBalance = balance - requiredCredits;
    } else if (assistantBalance >= requiredCredits) {
      chargeSource = "assistant_trial";
      nextAssistantBalance = assistantBalance - requiredCredits;
    } else {
      return Response.json({ error: `AI Assistant credits required. Required credits: ${requiredCredits}.`, requiredCredits, assistantAvailable: assistantBalance, available, redirect: "/dashboard/credits" }, { status: 402 });
    }

    const userContext = await loadAssistantUserContext(supabase, userId);
    const userContextPrompt = buildAssistantUserContextPrompt(userContext);
    const aiDraft = await openAiProductionDraft(message, mode, history, userContextPrompt);
    const productionType = aiDraft?.production_type?.trim() || detectProductionType(message);
    const selectedQuality = aiDraft?.selected_quality?.trim() || detectQuality(message);
    const selectedDuration = aiDraft?.selected_duration?.trim() || detectDuration(message, productionType);
    const selectedStyle = aiDraft?.selected_style?.trim() || detectStyle(message, productionType);
    const selectedModules = cleanStringArray(aiDraft?.selected_modules, detectModules(message, productionType));
    const selectedFeatures = cleanStringArray(aiDraft?.selected_features, detectFeatures(message, productionType));
    const selectedPlatforms = cleanStringArray(aiDraft?.selected_platforms, detectPlatforms(message, productionType));
    const selection = { input: message, selectedStyle, selectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, quickProviderTest: false };
    const requirements = deliveryRequirements(message, productionType, selectedFeatures, selectedPlatforms, selectedQuality);

    const { data: deliveryRateRow } = await supabase.from("platform_configs").select("value").eq("key", "delivery_credit_rates").maybeSingle();
    const { data: packageConfigRow } = await supabase.from("platform_configs").select("value").eq("key", PACKAGE_CONFIG_KEY).maybeSingle();
    const deliveryCreditRates = normalizeDeliveryCreditRates(deliveryRateRow?.value);
    const packageConfig = normalizePackageConfig(packageConfigRow?.value);
    const packageId = packageIdFromSelection(productionType, selection, packageConfig.productionPackages);
    const durationSeconds = Number(selectedDuration.replace(/\D/g, "")) || 30;
    const estimate = estimateProductionCost(packageId, {
      outputCount: selectedFeatures.includes("5 alternatives") ? 5 : selectedFeatures.includes("3 alternatives") ? 3 : 1,
      quality: selectedQuality,
      durationSeconds,
      features: selectedFeatures,
      productionType,
      deliveryRequirements: requirements,
      deliveryCreditRates,
      packageCatalog: packageConfig.productionPackages
    });

    const missing = cleanStringArray(aiDraft?.missing_fields, missingFields(message, productionType));
    const agentAction: AgentAction = aiDraft?.agent_action ?? {
      name: actionNameForProductionType(productionType),
      intent: "create_confirmed_production",
      production_type: productionType,
      confirmation_required: true,
      credit_check_required: true,
      provider_route: "auto",
      state_before_confirmation: "draft_ready",
      next_backend_endpoint: "/api/productions",
      args: {
        prompt: message,
        package_id: packageId,
        selected_quality: selectedQuality,
        selected_duration: selectedDuration,
        selected_style: selectedStyle,
        selected_modules: selectedModules,
        selected_features: selectedFeatures,
        selected_platforms: selectedPlatforms,
        delivery_requirements: requirements,
        estimated_credits: estimate.totalCredits,
        minimum_safe_credits: estimate.minimumSafeCredits
      }
    };
    const baseSummary = assistantSummary(message, productionType, packageId, missing, estimate.totalCredits);
    const summary = aiDraft?.summary?.trim()
      ? `${aiDraft.summary.trim()} Tahmini rezerv: ${estimate.totalCredits.toLocaleString()} kredi.`
      : baseSummary;
    const plan = {
      intent: "production",
      production_type: productionType,
      package_id: packageId,
      missing_fields: missing,
      delivery_requirements: requirements,
      estimated_credits: estimate.totalCredits,
      minimum_safe_credits: estimate.minimumSafeCredits,
      selected_quality: selectedQuality,
      selected_duration: selectedDuration,
      selected_style: selectedStyle,
      selected_modules: selectedModules,
      selected_features: selectedFeatures,
      selected_platforms: selectedPlatforms,
      workflow_stage: aiDraft?.workflow_stage?.trim() || (missing.length ? "collect_critical_info" : "ready_to_start_production"),
      next_user_action: aiDraft?.next_user_action?.trim() || (missing.length ? `Provide: ${missing.join(", ")}` : "Review the plan and start production."),
      delivery_path: cleanStringArray(aiDraft?.delivery_path, ["Brief", "Materials", "Production setup", "Preview", "Revision", "Final delivery"]),
      agent_action: agentAction,
      summary,
      assistant_brain: aiDraft ? "openai" : "local_rules"
    };

    const suggestion = {
      category: productionType,
      style: selectedStyle,
      duration: selectedDuration,
      quality: selectedQuality,
      suggestedPrompt: message,
      note: summary,
      assistantReply: summary,
      action: missing.length ? "collect_missing_fields" : agentAction.name,
      agent_action: agentAction,
      route: "/dashboard/assistant-workspace",
      automationLevel: aiDraft ? "assistant_brain_openai_v2" : "assistant_brain_local_v1",
      nextStep: aiDraft?.next_step?.trim() || (missing.length ? `Collect: ${missing.join(", ")}` : "Review credits and start production")
    };

    if (chargeSource === "assistant_trial") {
      const { error } = await supabase.from("assistant_credit_balances").upsert({ user_id: userId, balance: nextAssistantBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("credit_balances").upsert({ user_id: userId, balance: nextBalance, reserved, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
    }

    const { error: eventError } = await supabase.from("credit_events").insert({ user_id: userId, type: "spend", amount: requiredCredits, note: chargeSource === "assistant_trial" ? `Assistant Brain ${mode} plan (trial credits)` : `Assistant Brain ${mode} plan (production credits)` });
    if (eventError) throw eventError;

    return Response.json({
      plan,
      suggestion,
      chargedCredits: requiredCredits,
      chargeSource,
      assistantBalance: chargeSource === "assistant_trial" ? nextAssistantBalance : assistantBalance,
      balance: chargeSource === "production" ? nextBalance : balance,
      available: chargeSource === "production" ? nextBalance - reserved : available,
      lowAssistantCredits: chargeSource === "assistant_trial" && nextAssistantBalance > 0 && nextAssistantBalance < 300,
      lowProductionCredits: chargeSource === "production" && nextBalance > 0 && nextBalance < 500
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Assistant Brain could not create a plan.";
    return Response.json({ error: messageText }, { status: 500 });
  }
}
