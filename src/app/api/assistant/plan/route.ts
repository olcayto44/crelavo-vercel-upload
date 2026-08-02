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
  provider_route?: string;
  voice_profile?: string;
  voice_language?: string;
  music_profile?: string;
  environment_profile?: string;
  delivery_handoff?: string;
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
  if (["campaign", "video", "music_video", "animation", "stickman_animation", "documentary", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "studio", "drama", "cinematic_video", "video_tools", "cultural_localization"].includes(productionType)) return "create_ai_video";
  if (["image", "brand_kit", "virtual_model_studio", "visual_clone"].includes(productionType)) return "generate_image";
  if (["talking_video", "avatar", "lip_sync", "live_sales_agent", "voice_clone"].includes(productionType)) return "run_lip_sync";
  if (productionType === "ad_score_checker") return "score_ad_performance";
  if (productionType === "campaign_calendar") return "create_campaign_calendar";
  if (productionType === "crelavo_academy") return "create_academy_pack";
  if (productionType === "community_showcase") return "reuse_showcase_template";
  if (productionType === "ai_agent") return "create_ai_agent_plan";
  if (productionType === "website") return "create_website_project";
  if (productionType === "saas") return "create_saas_project";
  if (productionType === "mobile_app") return "create_mobile_app_project";
  if (productionType === "admin_project") return "create_admin_panel_project";
  if (productionType === "document_pack") return "create_document_pack";
  return "create_production";
}

function isVoiceCloneIntent(text: string) {
  return /voice clone|ses klon|ses klonlama|sesimi klon|kendi ses|own voice/.test(text);
}

function isLipSyncIntent(text: string) {
  return /lip sync|lip-sync|dudak|ağzını oynat|agzini oynat|sesle konuştur|sesle konustur/.test(text);
}

function isAvatarIntent(text: string) {
  return /avatar|talking head|talking video|konuşmalı|konusmali|sunucu|spokesperson|ai presenter/.test(text);
}

function isCharacterDialogueAnimationPrompt(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const sceneCount = (text.match(/sahne\s*\d+\s*:/g) ?? []).length;
  const quotedDialogueCount = (message.match(/[“\"][^”\"]{2,160}[”\"]/g) ?? []).length;
  const wantsAnimation = /animasyon|animation|çizgi film|cizgi film|cartoon|2d/.test(text);
  const wantsSpeech = /seslendirme|voice-over|voiceover|diyalog|dialogue|konuş|konus|subtitles|subtitle|altyaz/.test(text);
  const hasCharacterContinuity = /consistent characters|same character|karakter|character|dede|babaanne|torun|anne|baba|aynı görün|ayni gorun/.test(text);
  return wantsAnimation && wantsSpeech && hasCharacterContinuity && sceneCount >= 2 && quotedDialogueCount >= 2;
}

function detectProductionType(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (isCharacterDialogueAnimationPrompt(message)) return "animation";
  if (/reklam puan|ad score|performance score|video reklam puan|tiktok reklam puan/.test(text)) return "ad_score_checker";
  if (/sanal model|virtual model|fashion model|moda model|model stüdyosu|model studyosu/.test(text)) return "virtual_model_studio";
  if (/kültürel yerelleştirme|kulturel yerellestirme|cultural localization|global localization|yerelleştirme|yerellestirme/.test(text)) return "cultural_localization";
  if (/kampanya takvimi|campaign calendar|black friday|kara cuma|sezonluk kampanya/.test(text)) return "campaign_calendar";
  if (/akademi|academy|kurs|course|ders|şablon|sablon/.test(text)) return "crelavo_academy";
  if (/topluluk|community showcase|showcase|vitrin|örnek stil|ornek stil|template reuse/.test(text)) return "community_showcase";
  if (/ai ajan|yapay zeka ajan|ai influencer|sosyal medya yöneticisi|trend monitor|24\/7|24 saat|satış asistanı|satis asistani/.test(text)) return "ai_agent";
  if (/drone|uydu|satellite|harita|rota|map location|flyover/.test(text)) return "drone_video";
  if (/çöp adam|cop adam|stickman/.test(text)) return "stickman_animation";
  if (/rakip|competitor|seo|keyword|anahtar kelime|growth intelligence|site analizi|site analiz/.test(text)) return "document_pack";
  if (/shopify|amazon|trendyol|woocommerce|ürün link|urun link|product link|kampanya|reklam|ad video|tiktok reklam|instagram reklam|marketplace/.test(text)) return "campaign";
  if (isVoiceCloneIntent(text)) return "voice_clone";
  if (isLipSyncIntent(text)) return "lip_sync";
  if (isAvatarIntent(text)) return "avatar";
  if (/mobil uygulama|mobile app|ios|android|expo|react native|app store|play store/.test(text)) return "mobile_app";
  if (/saas|yazılım|software|dashboard|portal|crm|abonelik/.test(text)) return "saas";
  if (/admin panel|yönetim panel|yonetim panel|crud/.test(text)) return "admin_project";
  if (/e-?commerce|e commerce|e-ticaret|storefront|online store|shop|shopping|product catalog|checkout|cart|sepet|ürün|urun/.test(text)) return "website";
  if (/web sitesi|website|landing|site/.test(text)) return "website";
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
  if (productionType === "avatar") return ["AI avatar", "Talking head setup", "Voice-over"];
  if (productionType === "lip_sync") return ["Lip-sync video", "Face/video source", "Voice/audio source"];
  if (productionType === "voice_clone") return ["Voice clone", "Reference audio", "Consent and usage rules"];
  if (productionType === "website") return ["Website", "Responsive pages"];
  if (productionType === "saas") return ["SaaS screen", "Dashboard flow"];
  if (productionType === "mobile_app") return ["Mobile app", "App screens"];
  if (productionType === "admin_project") return ["Admin panel", "CRUD modules"];
  if (productionType === "image") return ["Image generation"];
  if (productionType === "ad_score_checker") return ["AI ad score checker", "Creative weakness report"];
  if (productionType === "virtual_model_studio") return ["AI virtual model studio", "Product visual set"];
  if (productionType === "cultural_localization") return ["Cultural localization", "Localized creative brief"];
  if (productionType === "campaign_calendar") return ["Campaign calendar", "Campaign asset plan"];
  if (productionType === "crelavo_academy") return ["Crelavo Academy", "Template pack"];
  if (productionType === "community_showcase") return ["Community showcase", "Template reuse"];
  if (productionType === "ai_agent") return ["AI influencer", "Daily social manager", "Approval flow"];
  if (productionType === "drone_video") return ["Drone-style aerial video", "AI map/location drone-style video"];
  if (productionType === "stickman_animation") return ["Stickman animation", "Storyboard"];
  if (productionType === "document_pack") return ["Document / File Pack"];
  return ["AI video"];
}

function detectFeatures(message: string, productionType: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const wantsSourcePackage = /(?:^|\b)(?:source|kaynak|zip|readme|kurulum|setup)(?:\b|$)/.test(text) && !/no\s+(?:saas\s+)?source\s+code|not\s+(?:a\s+)?working\s+saas|not\s+(?:a\s+)?working\s+app|no\s+expo\s+source\s+zip|no\s+app\s+development\s+package|no\s+website\s+builder\s+package/.test(text);
  const features = [
    /voice|voice acting|per-character voice|different voices|seslendirme|dublaj|kendi ses/.test(text) ? "Voice-over" : null,
    /subtitle|subtitles|add subtitles|altyaz/.test(text) ? "Subtitles" : null,
    wantsSourcePackage ? "Working source package" : "Production package",
    /3 alternatif|3 alternatives|varyasyon/.test(text) ? "3 alternatives" : null,
    /5 alternatif|5 alternatives/.test(text) ? "5 alternatives" : null,
    /revision|revizyon/.test(text) ? "Revision right" : null
  ].filter(Boolean) as string[];
  if (["website", "saas", "mobile_app", "admin_project"].includes(productionType) && !features.includes("Working source package")) features.push("Working source package");
  if (productionType === "campaign" && !features.includes("Subtitles")) features.push("Subtitles");
  return Array.from(new Set(features));
}

function detectProviderRoute(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/kling/.test(text)) return "Kling";
  if (/runway/.test(text)) return "Runway";
  if (/\bfal\b/.test(text)) return "Fal";
  if (/replicate/.test(text)) return "Replicate";
  if (/seedance/.test(text)) return "Seedance route";
  return "auto";
}

function detectVoiceProfile(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/çocuk|cocuk|child/.test(text)) return "Child voice";
  if (/yaşlı|yasli|senior|old/.test(text)) return "Senior voice";
  if (/erkek|male/.test(text)) return "Male voice";
  if (/kadın|kadin|female|woman/.test(text)) return "Female voice";
  if (/enerjik|sales|satış|satis/.test(text)) return "Energetic sales voice";
  if (/belgesel|documentary|calm|sakin/.test(text)) return "Calm documentary voice";
  return /voice|seslendirme|konuşma|konusma/.test(text) ? "Adult neutral voice" : "No voice-over";
}

function detectVoiceLanguage(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/ingilizce|english/.test(text)) return "English";
  if (/türkçe|turkce|turkish/.test(text)) return "Turkish";
  if (/almanca|german/.test(text)) return "German";
  if (/fransızca|fransizca|french/.test(text)) return "French";
  if (/ispanyolca|spanish/.test(text)) return "Spanish";
  if (/arapça|arapca|arabic/.test(text)) return "Arabic";
  return "English";
}

function detectMusicProfile(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/mubert/.test(text)) return "Mubert";
  if (/stable audio/.test(text)) return "Stable Audio";
  if (/müzik yok|muzik yok|no music/.test(text)) return "No music";
  if (/enerjik|viral|tiktok/.test(text)) return "Energetic ad music";
  if (/luxury|lüks|luks|premium/.test(text)) return "Luxury brand music";
  if (/ambient|sakin|calm/.test(text)) return "Calm ambient music";
  return /music|müzik|muzik|bgm/.test(text) ? "Cinematic background music" : "No music";
}

function deliveryRequirements(message: string, productionType: string, features: string[], platforms: string[], quality: string) {
  const signal = `${message} ${productionType} ${features.join(" ")} ${platforms.join(" ")} ${quality}`.toLocaleLowerCase("tr-TR");
  const promoVideo = isSaasPromoVideoIntent(message);
  const formats = [
    /mp4|video|reklam|campaign|tiktok|instagram/.test(signal) ? "final_mp4" : null,
    !promoVideo && /zip|paket/.test(signal) ? "final_zip" : null,
    !promoVideo && /\bworking source\b|\bkaynak\b/.test(signal) ? "source_code" : null,
    !promoVideo && /readme|setup|kurulum/.test(signal) ? "readme" : null,
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
  if (["talking_video", "avatar"].includes(productionType) && !/(ses|voice|kişi|kisi|person|avatar|foto|görüntü|goruntu)/.test(text)) missing.push("avatar_or_speaker_reference");
  if (productionType === "lip_sync" && !/(ses|voice|audio|video|yüz|yuz|face|avatar)/.test(text)) missing.push("face_video_and_audio_source");
  if (productionType === "voice_clone" && !/(ses|voice|audio|referans|reference|izin|onay|consent)/.test(text)) missing.push("reference_audio_and_voice_consent");
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

function isSaasPromoVideoIntent(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  return /saas\s*promo|promo\s*video|commercial|ad\s*video|video\s*ad|ready-to-post\s*video|product\s*link|website\s*link|paste\s*(a|any)?\s*link|get\s*an\s*ad|crelavo|tiktok|reels|shorts/.test(text) && /video|mp4|ad|reklam|promo|tanıtım|tanitim|commercial/.test(text);
}

function safeProductionType(message: string, proposedType: string) {
  if (isSaasPromoVideoIntent(message)) return "video";
  return proposedType;
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
          content: `You are Crelavo's advanced production brain and turnkey project guide. Convert the latest user request into a concrete production plan for an AI creative/product/software studio. Return only JSON with production_type, selected_quality, selected_duration, selected_style, selected_modules, selected_features, selected_platforms, missing_fields, workflow_stage, next_user_action, delivery_path, summary, next_step. Use the same language as the user's latest message for summary, next_user_action and next_step. Be decisive: ask for missing fields only when production would be blocked. Do not treat example subjects as fixed categories; infer the workflow dynamically. Valid production_type values: campaign, ai_agent, localization, ad_score_checker, virtual_model_studio, cultural_localization, campaign_calendar, crelavo_academy, community_showcase, video, talking_video, documentary, animation, anime_short_film, animal_video, nature_video, planet_space_video, drone_video, live_sales_agent, studio, drama, cinematic_video, video_clipping, avatar, lip_sync, voice_clone, visual_clone, video_tools, stickman_animation, music_video, website, saas, mobile_app, admin_project, brand_kit, document_pack, image. Prefer practical module names that already exist in Crelavo, such as AI video, Product ad video, Website, SaaS screen, Admin panel, Voice-over, Subtitles, Music, Final ZIP, README, Dashboard delivery, TikTok, Instagram Reels, YouTube Shorts. delivery_path should describe the real turnkey path such as brief, materials, preview, revision, final delivery, or structure, local preview, testing, admin handoff for software.\n\n${buildAssistantRoutingRules()}\n\n${userContextPrompt}`
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

async function geminiProductionDraft(message: string, mode: PlanMode, history: AssistantHistoryMessage[], userContextPrompt = ""): Promise<AiProductionDraft | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
      contents: [{
        role: "user",
        parts: [{ text: `You are Crelavo's production intent router. Return only JSON with production_type, selected_quality, selected_duration, selected_style, selected_modules, selected_features, selected_platforms, missing_fields, provider_route, voice_profile, voice_language, music_profile, environment_profile, delivery_handoff, workflow_stage, next_user_action, delivery_path, summary, next_step.
Valid production_type values: campaign, video, talking_video, documentary, animation, anime_short_film, animal_video, nature_video, planet_space_video, drone_video, drama, cinematic_video, video_clipping, avatar, lip_sync, voice_clone, video_tools, music_video, website, saas, mobile_app, admin_project, brand_kit, document_pack, image.
Critical routing rules:
- SaaS promo, Crelavo promo, product/website link to ad, ready-to-post video ad, TikTok/Reels/Shorts export as ad output => production_type video, not saas, not website, not video_clipping, not animation.
- "No cartoon" is a negative instruction, never route to animation because of it.
- Reels/Shorts/TikTok as export destination is not clipping unless user asks to extract clips from existing long footage.
- If user asks for working app/source code, then saas/website/mobile_app may be used.
Use user's language for summary.
${buildAssistantRoutingRules()}
${userContextPrompt}
History: ${JSON.stringify(history.slice(-6))}
Mode: ${mode}
Latest request: ${message}` }]
      }]
    })
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
    const openAiDraft = await openAiProductionDraft(message, mode, history, userContextPrompt);
    const geminiDraft = openAiDraft ? null : await geminiProductionDraft(message, mode, history, userContextPrompt);
    const aiDraft = openAiDraft || geminiDraft;
    const assistantBrain = openAiDraft ? "openai" : geminiDraft ? "gemini" : "local_rules";
    const productionType = safeProductionType(message, aiDraft?.production_type?.trim() || detectProductionType(message));
    const selectedQuality = aiDraft?.selected_quality?.trim() || detectQuality(message);
    const selectedDuration = aiDraft?.selected_duration?.trim() || detectDuration(message, productionType);
    const selectedStyle = aiDraft?.selected_style?.trim() || detectStyle(message, productionType);
    const selectedModules = cleanStringArray(aiDraft?.selected_modules, detectModules(message, productionType));
    const selectedFeatures = cleanStringArray(aiDraft?.selected_features, detectFeatures(message, productionType));
    const selectedPlatforms = cleanStringArray(aiDraft?.selected_platforms, detectPlatforms(message, productionType));
    const providerRoute = aiDraft?.provider_route?.trim() || detectProviderRoute(message);
    const voiceProfile = aiDraft?.voice_profile?.trim() || detectVoiceProfile(message);
    const voiceLanguage = aiDraft?.voice_language?.trim() || detectVoiceLanguage(message);
    const musicProfile = aiDraft?.music_profile?.trim() || detectMusicProfile(message);
    const environmentProfile = aiDraft?.environment_profile?.trim() || "Auto scene environment";
    const deliveryHandoff = aiDraft?.delivery_handoff?.trim() || selectedPlatforms[0] || "Dashboard delivery";
    const selection = { input: message, selectedStyle, selectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, quickProviderTest: false, selectedProviderService: providerRoute === "auto" ? "" : providerRoute, selectedServiceNetwork: providerRoute === "auto" ? "" : "video", selectedVoiceProfile: voiceProfile, selectedVoiceLanguage: voiceLanguage, selectedMusicProfile: musicProfile, selectedEnvironmentProfile: environmentProfile, selectedDeliveryHandoff: deliveryHandoff };
    const requirements = deliveryRequirements(message, productionType, selectedFeatures, selectedPlatforms, selectedQuality);

    const { data: deliveryRateRow } = await supabase.from("platform_configs").select("value").eq("key", "delivery_credit_rates").maybeSingle();
    const { data: packageConfigRow } = await supabase.from("platform_configs").select("value").eq("key", PACKAGE_CONFIG_KEY).maybeSingle();
    const deliveryCreditRates = normalizeDeliveryCreditRates(deliveryRateRow?.value);
    const packageConfig = normalizePackageConfig(packageConfigRow?.value);
    const packageId = isSaasPromoVideoIntent(message) ? "video_premium" : packageIdFromSelection(productionType, selection, packageConfig.productionPackages);
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
    const rawAgentAction = aiDraft?.agent_action;
    const agentAction: AgentAction = {
      intent: rawAgentAction?.intent ?? "create_confirmed_production",
      name: actionNameForProductionType(productionType),
      production_type: productionType,
      confirmation_required: true,
      credit_check_required: true,
      provider_route: providerRoute,
      state_before_confirmation: "draft_ready",
      next_backend_endpoint: "/api/productions",
      args: {
        ...(rawAgentAction?.args ?? {}),
        prompt: message,
        package_id: packageId,
        selected_quality: selectedQuality,
        selected_duration: selectedDuration,
        selected_style: selectedStyle,
        selected_modules: selectedModules,
        selected_features: selectedFeatures,
        selected_platforms: selectedPlatforms,
        delivery_requirements: requirements,
        provider_route: providerRoute,
        voice_profile: voiceProfile,
        voice_language: voiceLanguage,
        music_profile: musicProfile,
        environment_profile: environmentProfile,
        delivery_handoff: deliveryHandoff,
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
      provider_route: providerRoute,
      voice_profile: voiceProfile,
      voice_language: voiceLanguage,
      music_profile: musicProfile,
      environment_profile: environmentProfile,
      delivery_handoff: deliveryHandoff,
      workflow_stage: aiDraft?.workflow_stage?.trim() || (missing.length ? "collect_critical_info" : "ready_to_start_production"),
      next_user_action: aiDraft?.next_user_action?.trim() || (missing.length ? `Provide: ${missing.join(", ")}` : "Review the plan and start production."),
      delivery_path: cleanStringArray(aiDraft?.delivery_path, ["Brief", "Materials", "Production setup", "Preview", "Revision", "Final delivery"]),
      agent_action: agentAction,
      summary,
      assistant_brain: assistantBrain
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
        automationLevel: assistantBrain === "openai" ? "assistant_brain_openai_v2" : assistantBrain === "gemini" ? "assistant_brain_gemini_v1" : "assistant_brain_local_v1",
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
