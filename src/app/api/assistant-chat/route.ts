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
  return /(peki|biz|insanlar|soyundan|geliyoruz|turkiye|dunya|ulke|araba|marka|kadin|erkek|askerlik|asker|ne kadar|suruyor|surer|kac|yasar|yilan|zehir|zehirli|zehirsiz|tavuk|yumurta|civciv|sehir|nufus|nerede|neresi|bolge|kredi|maliyet|fiyat|para|fotograf|gorsel|ses kaydi|sesim|dosya|materyal|yukleyecegim|gonderecegim|sort|tisort|gomlek|giyilir|giyinilir|kombin|renk)/.test(normalized);
}

function isCreditCostQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  return /(kredi|para|maliyet|ucret|fiyat|kac para|ne kadar tutar|ne kadar kredi)/.test(normalized);
}

function isMaterialUploadQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const asksHow = /(nasil|nereden|nereye|gonderecegim|yukleyecegim|atacagim|ekleyecegim|kac sny|kac saniye|ne konusmam|ne soylemem|kayit)/.test(normalized);
  const hasMaterial = /(fotograf|foto|gorsel|resim|ses|sesim|ses kaydi|voice|audio|video kaydi|dosya|materyal)/.test(normalized);
  return asksHow && hasMaterial;
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
  const isGeneralQuestion = /\?/.test(text) || isOutfitColorQuestion(message) || /(mi|mu|nedir|ne demek|neden|niye|nasil|ne yapabilirim|ne yapabiliriz|ne yapmali|ne iyi gelir|neler iyi gelir|iyi gelir|tavsiye|oneri|kac|kimdir|kim|hangisi|hangi|hngi|nerenin|nereli|nerede|nerde|neresi|neresinde|neresindedir|ne tarafinda|hangi tarafta|ne zaman|say|listele|bilgi almak|ogrenmek|anlatir misin|aciklar misin|bolgesinde|bolgesi|nufus|soyundan|geliyoruz|askerlik|suruyor|surer|ihtiyac|talep|indirecek|pesinden|ulke|araba mark|markalari|kadin|erkek|yapabilir misin|yapabilirmisin|istedigim|giyilir|giyinilir|ustune|kombin|what is|why|how|who|which|where|when|list|explain|learn|advice|recommend)/.test(normalized);
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

function fallbackReply(message: string, language: string) {
  if (isMaterialUploadQuestion(message)) return materialUploadFallbackReply(message, language);
  if (language === "tr" || hasTurkishQuestionWords(normalizeTurkishQuery(message))) {
    return "Bunu net cevaplayabilmem için bir cümle daha detay verir misin?";
  }
  if (language === "de") return "Bitte füge einen Satz mehr Kontext hinzu, damit ich dir genau antworten kann.";
  if (language === "es") return "Añade una frase más de contexto para poder responderte con precisión.";
  if (language === "fr") return "Ajoute une phrase de contexte pour que je puisse te répondre précisément.";
  if (language === "ar") return "أضف جملة توضيحية أخرى حتى أتمكن من الإجابة بدقة.";
  return "Please add one more sentence of context so I can answer accurately.";
}

async function generateChatReply(message: string, language: string, history: { role: "user" | "assistant"; content: string }[], userContextPrompt = "") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackReply(message, language);

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
          content: `You are Crelavo's conversational AI assistant inside a production and software workspace. Reply naturally like a helpful human assistant, not like a form bot. Use ${languageName(language)} only. Keep replies short, friendly and useful. Default to 4-5 short lines maximum; avoid long paragraphs, essays, or dense blocks. If the topic needs detail, give the first few bullets and ask if the user wants more. If the user greets you, greet back naturally. If the user asks how it works, explain briefly. If the user has a production idea, help clarify it but do not dump form fields. If the user asks how to send/upload photos, voice, video, files, or materials, NEVER say uploads are unavailable; tell them to use the workspace Upload material / Materials area. Mention supported media like JPG/PNG for photos, MP3/WAV/MP4/MOV/WEBM for audio/video, and say 20-60 seconds of clean voice is usually enough for a voice reference. If the user asks what to say in a voice sample, provide a short sample script. If the user asks a general information question such as geography, science, dates, definitions, 'why/how/what is', answer directly and briefly; do not turn it into a production flow. If the user asks about health or sensitive medical topics, recognize terms like kanser|kemoterapi|radyoterapi|ameliyat|onkoloji and answer cautiously: give general information, recommend a qualified doctor, and flag emergencies. For common first-aid questions like burnum|burun|nose bleeding, keep it practical; for example, in Turkish say: "Burun kanamasında genelde dik oturup başı hafif öne eğmek, burnun yumuşak kısmına 10-15 dakika bası yapmak ve kan yutmayı önlemek önerilir; kanama durmazsa veya ciddi travma varsa acile başvur." If the user asks about Crelavo categories, packages, credits, which tool to use, what a service does, or where to click, answer using the catalog context below. If the user asks about code, bugs, APIs, React, Next.js, Supabase, SQL, deployment, or implementation ideas, answer as a practical coding assistant: explain the likely cause, suggest a fix, mention risks, and propose the next step. Do not pretend you can see files unless the user provides code or context. Do not repeat the same sentence. Do not mention login, email verification or credits unless the user asks about payment/credits or existing delivery access.\n\n${buildAssistantKnowledgePrompt()}\n\n${userContextPrompt}`
        },
        ...history.slice(-8),
        { role: "user", content: message }
      ]
    })
  });

  if (!response.ok) return fallbackReply(message, language);
  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "").trim() || fallbackReply(message, language);
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
  const freeConversationalQuestion = false;
  const requiredCredits = freeConversationalQuestion ? 0 : CHAT_CREDITS[mode];

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
