import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { buildAssistantKnowledgePrompt } from "@/lib/assistant-knowledge";
import { buildAssistantUserContextPrompt, loadAssistantUserContext } from "@/lib/assistant-user-context";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { validateProductionSafety } from "@/lib/content-safety";
import { getClientIp, grantWelcomeAssistantCreditsOnce } from "@/lib/welcome-assistant-credits";

const CHAT_CREDITS = {
  quick: 100,
  voice: 150
} as const;

type ChatMode = keyof typeof CHAT_CREDITS;

function modeFromBody(value: unknown): ChatMode {
  return value === "voice" ? "voice" : "quick";
}

function normalizeTurkishQuery(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTurkishQuestionWords(normalized: string) {
  return /(selam|merhaba|naber|nasilsin|iyimisin|iyi misin|ne haber|kimsin|nerenin|turkce|yazmiyorsun|peki|biz|insanlar|soyundan|geliyoruz|turkiye|dunya|ulke|araba|marka|kadin|erkek|askerlik|asker|ne kadar|suruyor|surer|kac|yasar|yilan|zehir|zehirli|zehirsiz|tavuk|yumurta|civciv|sehir|nufus|nerede|neresi|bolge|bursa|bursanin|meshur|meshurdur|neyi meshur|takipci|izlenim|izlenme|kredi|maliyet|fiyat|para|fotograf|gorsel|ses kaydi|sesim|dosya|materyal|yukleyecegim|gonderecegim|sort|tisort|gomlek|giyilir|giyinilir|kombin|renk|soru|cevap|yorum|fikir|oneri|onerirsin|onerirsiniz|tavsiye|anlat|acikla|nedir|neden|nasil|hangi|hangisi|kim|ne zaman)/.test(normalized);
}

function isCreditCostQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  return /(kredi|para|maliyet|ucret|fiyat|kac para|ne kadar tutar|ne kadar kredi)/.test(normalized);
}

function isMaterialUploadQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const isPlainChat = /^(selam|merhaba|sa|slm|hey|nasilsin|iyimisin|iyi misin|naber|ne haber|kimsin|nesin|ben sana baska bir sey sormak istiyorum|baska bir sey soracagim|sana bir sey soracagim|soru soracagim|soru sormak istiyorum)\b/.test(normalized);
  if (isPlainChat) return false;
  const asksHow = /(nasil|nereden|nereye|gonderecegim|yukleyecegim|atacagim|ekleyecegim|kac sny|kac saniye|ne konusmam|ne soylemem|kayit|gonderebilir miyim|yukleyebilir miyim|atabilir miyim)/.test(normalized);
  const hasMaterial = /(fotograf|foto|gorsel|resim|ses|sesim|ses kaydi|voice|audio|video kaydi|dosya|materyal)/.test(normalized);
  return (asksHow && hasMaterial) || (hasMaterial && /gonder|yukle|at|ekle/.test(normalized));
}

function materialUploadFallbackReply(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message);
  if (language !== "tr" && !hasTurkishQuestionWords(normalized)) return "Yes, use the workspace ‘Upload material’ area.\nYou can add photo, voice, or video files.\nFor voice, 20-60 seconds of clean audio is enough.";
  return "Evet, gönderebilirsin.\nFotoğraf, ses veya videoyu ‘Upload material / Materyal yükle’ alanından ekle.\nFotoğraf JPG/PNG, ses için 20-60 saniye temiz kayıt yeterli.\nKendi görüntün olacaksa kısa MP4/MOV video da yükleyebilirsin.";
}

function isAppIdeaDemandQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const asksForIdea = /(uygulama|app|mobil|site|platform|fikir|oneri|onerirsin|aklima bir sey gelmiyor)/.test(normalized);
  const wantsHighDemand = /(ihtiyac|talep|pesinden kos|deli gibi|indirecek|kullanacak|para kazan|hizli para|problem|cozum)/.test(normalized);
  return asksForIdea && (wantsHighDemand || /aklima bir sey gelmiyor/.test(normalized));
}

function isOutfitColorQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const hasClothing = /(sort|tisort|t-shirt|gomlek|ustune|ust|giyilir|giyinilir|kombin|renk)/.test(normalized);
  const hasColor = /(limon|sari|yesil|mavi|beyaz|siyah|bej|krem|gri|lacivert|renk)/.test(normalized);
  return hasClothing && hasColor;
}

function creditCostFallbackReply(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message).replace(/1o/g, "10").replace(/lo/g, "10");
  if (language !== "tr" && !hasTurkishQuestionWords(normalized)) return "For a cinematic educational animation, 1 minute is roughly 5,500-6,500 credits; 10 minutes is roughly 29,000-32,000 credits, depending on quality, voice-over, subtitles and scene count.";
  if ((normalized.includes("1 dakika") || normalized.includes("60")) && (normalized.includes("10 dakika") || normalized.includes("10 dk"))) return "Yaklaşık hesapla: 1 dakikalık sinematik/eğitici animasyon video 5.500-6.500 kredi bandına, 10 dakikalık versiyon ise 29.000-32.000 kredi bandına yaklaşır. Net rakam kalite, sahne sayısı, seslendirme, altyazı ve kaç alternatif istediğine göre değişir.";
  return "Bu tarz sinematik/eğitici animasyon videoda maliyet süreye göre artar. Kaba hesapla 1 dakika genelde 5.500-6.500 kredi bandı, 10 dakika ise 29.000-32.000 kredi bandı gibi düşünülmeli; net rakam seçtiğin kalite, seslendirme, altyazı ve sahne sayısına göre hesaplanır.";
}

function isFreeConversationalQuestion(message: string) {
  const text = message.toLocaleLowerCase("tr-TR").trim();
  const normalized = normalizeTurkishQuery(message);
  const asksCapability = /(yapabilir misin|yapabilirmisin|istedigim seyleri|istedigim seyler|benim istedigim)/.test(normalized);
  const hasProductionAction = /\b(yap|yapar misin|uret|olustur|hazirla|tasarla|kur|build|create|generate|make|produce)\b/.test(normalized) && !asksCapability;
  const isCodeSupport = /(kod|code|bug|hata|debug|api|component|react|next|supabase|veritabani|sql|cozebilir misin|yardimci olur musun|bakabilir misin|duzeltir misin|sikinti|problem|calismazsa)/.test(normalized);
  const isGeneralQuestion = /\?/.test(text) || isOutfitColorQuestion(message) || /(mi|mu|nedir|ne demek|neden|niye|nasil|ne yapabilirim|ne yapabiliriz|ne yapmali|ne iyi gelir|neler iyi gelir|iyi gelir|tavsiye|oneri|onerirsin|onerirsiniz|sen ne onerirsin|kac|kimdir|kim|hangisi|hangi|hngi|nerenin|nereli|nerede|nerde|neresi|neresinde|neresindedir|ne tarafinda|hangi tarafta|ne zaman|neyle meshur|neyi meshur|meshur|meshurdur|say|listele|bilgi almak|ogrenmek|anlatir misin|aciklar misin|bolgesinde|bolgesi|nufus|soyundan|geliyoruz|askerlik|suruyor|surer|ihtiyac|talep|indirecek|pesinden|ulke|araba mark|markalari|kadin|erkek|yapabilir misin|yapabilirmisin|istedigim|giyilir|giyinilir|ustune|kombin|what is|why|how|who|which|where|when|list|explain|learn|advice|recommend)/.test(normalized);
  return isCodeSupport || isAppIdeaDemandQuestion(message) || (isGeneralQuestion && !hasProductionAction);
}

function conversationTitle(message: string) {
  const clean = message.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, 80) : "Assistant conversation";
}

async function ensureAssistantConversation(supabase: ReturnType<typeof supabaseAdmin>, input: { conversationId?: string; userId: string; userEmail: string; firstMessage: string }) {
  if (input.conversationId) {
    const { data } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", input.conversationId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  const { data, error } = await supabase
    .from("assistant_conversations")
    .insert({
      user_id: input.userId,
      user_email: input.userEmail,
      title: conversationTitle(input.firstMessage),
      channel: "assistant_workspace"
    })
    .select("id")
    .single();
  if (error) throw error;
  return String(data.id);
}

function languageName(code: string) {
  if (code === "tr") return "Turkish";
  if (code === "de") return "German";
  if (code === "es") return "Spanish";
  if (code === "fr") return "French";
  if (code === "ar") return "Arabic";
  return "English";
}

function detectReplyLanguage(message: string, preferred = "") {
  const normalized = normalizeTurkishQuery(message);
  if (/[\u0600-\u06ff]/.test(message)) return "ar";
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message) || hasTurkishQuestionWords(normalized)) return "tr";
  if (/\b(hallo|guten|danke|bitte|warum|wie|was|wer|welche|empfiehlst)\b/i.test(message)) return "de";
  if (/\b(hola|gracias|por que|porque|como|qué|que|recomiendas)\b/i.test(message)) return "es";
  if (/\b(bonjour|merci|pourquoi|comment|quoi|recommandes)\b/i.test(message)) return "fr";
  return preferred || "en";
}

function fallbackReply(message: string, language: string) {
  if (isMaterialUploadQuestion(message)) return materialUploadFallbackReply(message, language);
  const normalized = normalizeTurkishQuery(message);
  const text = message.toLocaleLowerCase("tr-TR").trim();
  const replyLanguage = language === "tr" || hasTurkishQuestionWords(normalized) || /[çğıöşü]/i.test(message) ? "tr" : language;

  if (replyLanguage === "tr") {
    if (/^(selam|merhaba|sa|slm|hey)\b/.test(text)) return "Selam, buradayım. Ne yapmak istediğini yaz ya da sesli söyle; ben kısa ve net yardımcı olayım.";
    if (/^(nasılsın|nasilsin|naber|ne haber|iyimisin|iyi misin)\b/.test(text)) return "İyiyim, buradayım. Sen ne yapmak istiyorsun?";
    if (/neden\s+türkçe\s+yazmıyorsun|neden\s+turkce\s+yazmiyorsun/.test(normalized)) return "Haklısın, Türkçe devam edeceğim. Sen Türkçe yazdığında veya konuştuğunda ben de Türkçe cevap vereceğim.";
    if (/sen\s+nerenin\s+asistanısın|sen\s+nerenin\s+asistanisin|kimsin|nesin/.test(normalized)) return "Ben Crelavo çalışma alanındaki yapay zekâ asistanıyım. Site, üretim, API, video, reklam, kredi, dashboard ve proje işleri için sana adım adım yardımcı olurum.";
    if (/canim\s+sikkin|moralim\s+bozuk|keyfim\s+yok/.test(normalized)) return "Üzüldüm. İstersen biraz anlat; dinlerim. Hemen çözüm üretmek zorunda değiliz, önce neyin canını sıktığını beraber netleştirebiliriz.";
    if (/api.*(nasil|nereden|alinir|alabilirim|basvur|olustur)|nasil.*api.*(alinir|alabilirim|olusturulur)/.test(normalized)) return "API almak için genelde developer hesabı açılır, yeni app/project oluşturulur, gerekli izinler seçilir, domain/callback doğrulaması yapılır ve sonra API key veya client secret alınır. Hangi API olduğunu söylersen adımları tek tek yazarım.";
    if (/istanbul.*deprem.*(ne zaman|en son)|en son.*istanbul.*deprem/.test(normalized)) return "Canlı deprem verisine bağlı olmadan kesin ‘en son’ bilgisini garanti edemem. Güncel kontrol için Kandilli Rasathanesi veya AFAD son depremler sayfasına bakmak gerekir.";
    if (/bursa.*(neyi|neyle).*(meshur|meshurdur)|bursanin.*(neyi|neyle).*(meshur|meshurdur)/.test(normalized)) return "Bursa en çok İskender kebabı, kestane şekeri, pideli köfte, İnegöl köftesi, şeftalisi, Uludağ’ı, Cumalıkızık köyü ve Osmanlı mirasıyla meşhur. Kısa cevap: İskender ve kestane şekeri ilk akla gelenler.";
    if (/(takipci|izlenim|izlenme|sen ne onerirsin|ne onerirsin|tavsiyen ne|senin tavsiyen)/.test(normalized)) return "Ben olsam hedefi takipçi + izlenme olarak kurarım. TikTok’ta ilk aşamada satış videosu değil, seri içerik daha iyi çalışır: 3 saniyelik güçlü hook, tek konu, hızlı tempo, altyazı ve net CTA. İlk deneme için 5 video fikri çıkarıp en güçlüsünü üretime çevirebiliriz.";
    if (/yardım|yardim|ne yapabilirsin|nasıl çalış|nasil calis/.test(normalized)) return "Bana normal cümleyle yazman veya sesli söylemen yeterli. Üretim fikrini, site sorununu veya API adımını anlayıp seni doğru adıma götürürüm.";
    if (/devam|tamam|olur|evet|başla|basla/.test(normalized) && normalized.split(/\s+/).length <= 4) return "Tamam, devam ediyorum. Son hedefe göre kısa ve net ilerleyeceğim.";
    return "Buradayım. Sorunu ya da yapmak istediğin işi yaz; üretimse akışa çeviririm, soruysa doğrudan cevaplarım.";
  }
  if (replyLanguage === "de") return "Ich bin hier. Schreib oder sprich kurz, was du brauchst; ich helfe dir Schritt für Schritt.";
  if (replyLanguage === "es") return "Estoy aquí. Escribe o di lo que necesitas y te guiaré paso a paso.";
  if (replyLanguage === "fr") return "Je suis là. Écris ou dis ce dont tu as besoin et je te guide simplement.";
  if (replyLanguage === "ar") return "أنا هنا. اكتب أو قل ما تحتاجه وسأساعدك خطوة بخطوة.";
  if (/hello|hi|hey/.test(text)) return "Hi, I’m here. Tell me what you want to create or fix, and I’ll guide you clearly.";
  if (/how are you/.test(text)) return "I’m good, I’m here and ready to help. What would you like to do next?";
  return "I’m here. Tell me what you want to create, fix, or understand, and I’ll guide you clearly.";
}

async function generateChatReply(message: string, language: string, history: { role: "user" | "assistant"; content: string }[], userContextPrompt = "") {
  const replyLanguage = detectReplyLanguage(message, language);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured for assistant chat.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Crelavo's built-in AI assistant, but you must behave like ChatGPT or Gemini: a general-purpose conversational assistant that can also help with Crelavo production work. Use ${languageName(replyLanguage)} only. Answer the user's actual latest message directly and use recent conversation as context. Do not behave like a category menu, form bot, or production wizard unless the user explicitly asks to start or plan a production. Crelavo can build SaaS sites, websites, apps, admin panels, AI sales agents, videos, ads and campaigns as managed productions with dashboard delivery, source/package delivery when applicable, AI + human QA and API/provider setup guidance. If the user asks “will you build this for me?” answer yes in Crelavo terms; never say you cannot build it. If the user asks to inspect or discuss crelavo.com, summarize Crelavo from known platform context instead of claiming you cannot access external sites. For non-Crelavo external sites, ask for pasted content/screenshots if live browsing is unavailable. If the user gives a TikTok/video request with duration, English voice-over, subtitles, music, cinematic style, hook, cover image or 3-word cover text, turn it into a concise production brief and next step instead of generic advice. General questions, personal chat, advice requests, geography, dates, APIs, business ideas, recommendations, and follow-up questions must receive normal helpful answers. If the user says “what do you recommend?” or “sen ne önerirsin?”, infer what they are referring to from the conversation and give a concrete recommendation. If the user wants a TikTok/video/marketing idea, advise like a practical creator/marketer first; only then offer to turn it into a production brief. If the user greets you, greet back naturally. If the user asks how it works, explain briefly. If the user has a production idea, help clarify it but do not dump form fields. If the user asks how to send/upload photos, voice, video, files, or materials, NEVER say uploads are unavailable; tell them to use the workspace Upload material / Materials area. Mention supported media like JPG/PNG for photos, MP3/WAV/MP4/MOV/WEBM for audio/video, and say 20-60 seconds of clean voice is usually enough for a voice reference. If the user asks what to say in a voice sample, provide a short sample script. If the user asks a general information question such as geography, science, dates, definitions, 'why/how/what is', answer directly and briefly; do not turn it into a production flow. If the user asks about health or sensitive medical topics, recognize terms like kanser|kemoterapi|radyoterapi|ameliyat|onkoloji and answer cautiously: give general information, recommend a qualified doctor, and flag emergencies. For common first-aid questions like burnum|burun|nose bleeding, keep it practical; for example, in Turkish say: "Burun kanamasında genelde dik oturup başı hafif öne eğmek, burnun yumuşak kısmına 10-15 dakika bası yapmak ve kan yutmayı önlemek önerilir; kanama durmazsa veya ciddi travma varsa acile başvur." If the user asks about Crelavo categories, packages, credits, which tool to use, what a service does, or where to click, answer using the catalog context below. If the user asks about code, bugs, APIs, React, Next.js, Supabase, SQL, deployment, or implementation ideas, answer as a practical coding assistant: explain the likely cause, suggest a fix, mention risks, and propose the next step. Do not pretend you can see files unless the user provides code or context. Do not repeat the same sentence. Do not mention login, email verification or credits unless the user asks about payment/credits or existing delivery access.\n\n${buildAssistantKnowledgePrompt()}\n\n${userContextPrompt}`
        },
        ...history.slice(-8),
        { role: "user", content: message }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Assistant AI request failed: ${response.status} ${detail.slice(0, 300)}`);
  }
  const data = await response.json();
  const reply = String(data.choices?.[0]?.message?.content ?? "").trim();
  if (!reply) throw new Error("Assistant AI returned an empty reply.");
  return reply;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = String(searchParams.get("user_id") ?? "").trim();
    if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });

    const verified = await requireVerifiedRequestUser(request, userId);
    if (!verified.ok) return verified.response;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return Response.json({ conversation: null, messages: [], mode: "mock" });
    }

    const supabase = supabaseAdmin();
    const { data: conversation, error: conversationError } = await supabase
      .from("assistant_conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation?.id) return Response.json({ conversation: null, messages: [] });

    const { data: messages, error: messagesError } = await supabase
      .from("assistant_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversation.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (messagesError) throw messagesError;

    return Response.json({ conversation, messages: messages ?? [] });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Assistant conversation could not be loaded.";
    return Response.json({ error: messageText }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const userEmail = String(body.user_email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim().slice(0, 2000);
  const language = String(body.language ?? "en").trim() || "en";
  const mode = modeFromBody(body.mode);
  const conversationId = String(body.conversation_id ?? "").trim();
  const localReply = String(body.local_reply ?? "").trim().slice(0, 2000);
  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.messages)
    ? body.messages.map((item: { role?: string; content?: string }) => ({ role: item.role === "assistant" ? "assistant" as const : "user" as const, content: String(item.content ?? "").slice(0, 1200) })).filter((item: { content: string }) => item.content.trim())
    : [];
  const freeConversationalQuestion = true;
  const requiredCredits = 0;

  if (!userId || !userEmail) return Response.json({ error: "Please log in before using the AI Assistant." }, { status: 401 });
  const guardConfig = apiCostGuardConfig();
  const routeBudget = enforceRouteBudget(request, { route: "assistant-chat", userId, ipLimit: guardConfig.assistantChatIpLimit, userLimit: guardConfig.assistantChatUserLimit, windowMs: 15 * 60 * 1000 });
  if (!routeBudget.ok) return routeBudget.response;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  if (!message) return Response.json({ error: "Write a message first." }, { status: 400 });

  const safety = validateProductionSafety([message, ...history.map((item) => item.content)]);
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

    if (requiredCredits === 0) {
      chargeSource = "production";
    } else if (available >= requiredCredits) {
      chargeSource = "production";
      nextBalance = balance - requiredCredits;
    } else if (assistantBalance >= requiredCredits) {
      chargeSource = "assistant_trial";
      nextAssistantBalance = assistantBalance - requiredCredits;
    } else {
      let savedConversationId = "";
      if (localReply) {
        savedConversationId = await ensureAssistantConversation(supabase, { conversationId, userId, userEmail, firstMessage: message });
        const now = new Date().toISOString();
        const { error: localMessageError } = await supabase.from("assistant_messages").insert([
          { conversation_id: savedConversationId, user_id: userId, role: "user", content: message, mode, language, metadata: { source: "assistant-chat", savedDuringCreditBlock: true } },
          { conversation_id: savedConversationId, user_id: userId, role: "assistant", content: localReply, mode, language, metadata: { source: "assistant-chat-local", savedDuringCreditBlock: true } }
        ]);
        if (localMessageError) throw localMessageError;
        await supabase.from("assistant_conversations").update({ updated_at: now, user_email: userEmail }).eq("id", savedConversationId).eq("user_id", userId);
      }
      return Response.json({ error: `AI Assistant credits required. Required credits: ${requiredCredits}.`, requiredCredits, assistantAvailable: assistantBalance, available, redirect: "/dashboard/credits", conversation_id: savedConversationId || undefined }, { status: 402 });
    }

    const userContext = await loadAssistantUserContext(supabase, userId);
    const userContextPrompt = buildAssistantUserContextPrompt(userContext);
    const reply = await generateChatReply(message, language, history, userContextPrompt);
    const activeConversationId = await ensureAssistantConversation(supabase, { conversationId, userId, userEmail, firstMessage: message });
    const now = new Date().toISOString();
    const { error: messageInsertError } = await supabase.from("assistant_messages").insert([
      { conversation_id: activeConversationId, user_id: userId, role: "user", content: message, mode, language, metadata: { source: "assistant-chat" } },
      { conversation_id: activeConversationId, user_id: userId, role: "assistant", content: reply, mode, language, metadata: { source: "assistant-chat", chargeSource, chargedCredits: requiredCredits } }
    ]);
    if (messageInsertError) throw messageInsertError;
    const { error: conversationUpdateError } = await supabase
      .from("assistant_conversations")
      .update({ updated_at: now, user_email: userEmail })
      .eq("id", activeConversationId)
      .eq("user_id", userId);
    if (conversationUpdateError) throw conversationUpdateError;

    if (requiredCredits > 0) {
      if (chargeSource === "assistant_trial") {
        const { error } = await supabase.from("assistant_credit_balances").upsert({ user_id: userId, balance: nextAssistantBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("credit_balances").upsert({ user_id: userId, balance: nextBalance, reserved, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        if (error) throw error;
      }

      const { error: eventError } = await supabase.from("credit_events").insert({ user_id: userId, type: "spend", amount: requiredCredits, note: chargeSource === "assistant_trial" ? `AI Assistant ${mode} chat (trial credits)` : `AI Assistant ${mode} chat (production credits)` });
      if (eventError) throw eventError;
    }

    return Response.json({
      reply,
      chargedCredits: requiredCredits,
      chargeSource,
      assistantBalance: chargeSource === "assistant_trial" ? nextAssistantBalance : assistantBalance,
      balance: chargeSource === "production" ? nextBalance : balance,
      available: chargeSource === "production" ? nextBalance - reserved : available,
      lowAssistantCredits: chargeSource === "assistant_trial" && nextAssistantBalance > 0 && nextAssistantBalance < 300,
      lowProductionCredits: chargeSource === "production" && nextBalance > 0 && nextBalance < 500,
      conversation_id: activeConversationId
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "AI Assistant chat could not run.";
    return Response.json({ error: messageText }, { status: 500 });
  }
}
