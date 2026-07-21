"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { estimateCredits } from "@/lib/credits";
import { addOns, premiumMaterialOptionsByType, premiumMaterialTypes, qualityOptions } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase";
import { getStoredLanguage } from "@/lib/i18n";

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

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const durationOptions = ["Project based", "15 seconds", "30 seconds", "45 seconds", "60 seconds", "2 minutes", "3 minutes"];
const assistantStyleOptions = ["Premium SaaS", "Global Campaign", "Agentic Marketing", "Luxury Brand", "Startup Clean", "Bold Social", "Minimal Corporate", "Mobile App Modern", "E-commerce Product", "Editorial Document", "Cinematic Video"];
const assistantQualityOptions = ["Premium", ...qualityOptions];
const assistantAddOnOptions = addOns.filter((item) => ["Voice-over", "Voice clone", "Basic subtitles", "Styled subtitles", "Multi-language subtitles", "Script writing", "Background music", "Sound effects", "Fast delivery", "Extra revision", "Custom outfit", "Custom location", "AI presenter setup"].includes(item));

function modeForSuggestion(category: string, idea: string) {
  const text = `${category} ${idea}`.toLowerCase();
  if (["shopify", "amazon", "trendyol", "woocommerce", "ecommerce", "e-commerce", "e-ticaret", "ürün linki", "product link"].some((item) => text.includes(item))) return "commerce";
  if (["tiktok", "instagram", "reels", "youtube shorts", "linkedin", "x/twitter", "sosyal medya", "social", "campaign", "kampanya"].some((item) => text.includes(item))) return "social";
  if (["saas", "website", "web sitesi", "mobile", "mobil", "admin panel", "dashboard", "portal"].some((item) => text.includes(item))) return "project";
  if (["document", "doküman", "pdf", "deck", "proposal", "teklif"].some((item) => text.includes(item))) return "document";
  if (["brand kit", "marka kiti", "logo"].some((item) => text.includes(item))) return "brand";
  if (["video", "görsel", "image", "visual", "music", "müzik"].some((item) => text.includes(item))) return "media";
  return "general";
}

const fallbackSuggestion: AssistantSuggestion = {
  category: "Website",
  style: "Premium SaaS",
  duration: "Project based",
  quality: "Premium",
  premiumMaterialType: "No premium material",
  premiumMaterialOption: "None",
  suggestedPrompt: "I want a premium website, mobile app or SaaS screen for an AI production platform.",
  note: "Write what you want to do; the assistant chooses the right automatic next step for production, credits, delivery, payment, account and operations flow.",
  assistantReply: "Hello, you can describe any site action in a normal sentence: start production, buy credits, open delivery, create a Shopify campaign, AI agent, global localization, payment or account task. I will route you to the right fully automatic action.",
  action: "start_automatic_production",
  route: "/dashboard/assistant-workspace",
  automationLevel: "full_auto",
  nextStep: "Start the fully automatic production request"
};

function normalizeTurkishText(text: string) {
  return text
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

function isTurkishText(text: string, activeLanguage = "") {
  if (activeLanguage === "tr") return true;
  const normalized = normalizeTurkishText(text);
  return /[çğıöşüÇĞİÖŞÜ]/.test(text) || /\b(merhaba|selam|naber|nasilsin|iyimisin|iyi misin|kimsin|nerenin|turkce|ben|bana|sen|sana|istiyorum|istedigim|soru|cevap|yorum|fikir|oneri|tavsiye|anlat|acikla|nedir|neden|nasil|hangi|kim|yap|olsun|gorsel|urun|reklam|kredi|asistan|sesli|konus|devam|tamam)\b/i.test(normalized);
}

function isGeneralChatMessage(text: string) {
  const normalized = normalizeTurkishText(text);
  const hasQuestionSignal = /\?/.test(text) || /(selam|merhaba|naber|nasilsin|iyimisin|iyi misin|kimsin|nerenin|neden|nasil|nedir|ne demek|hangi|kim|nerede|kac|yorum|fikir|oneri|tavsiye|anlat|acikla|what|why|how|who|which|where|when|advice|recommend)/.test(normalized);
  const hasProductionSignal = /(uret|olustur|tasarla|video|reklam|kampanya|website|web sitesi|site|saas|uygulama|app|avatar|gorsel|logo|brand|document|pdf|shopify|amazon|trendyol)/.test(normalized);
  return hasQuestionSignal && !hasProductionSignal;
}

function localGeneralReply(text: string, activeLanguage = "") {
  const normalized = normalizeTurkishText(text);
  if (isTurkishText(text, activeLanguage)) {
    if (/^(selam|merhaba|sa|slm|hey)\b/.test(normalized)) return "Selam, buradayım. Genel soru, fikir, kod, site işi veya üretim isteği yazabilirsin.";
    if (/^(nasilsin|iyimisin|iyi misin|naber|ne haber)\b/.test(normalized)) return "İyiyim, buradayım. Ne konuşmak veya üretmek istiyorsun?";
    if (/(kimsin|nerenin)/.test(normalized)) return "Ben Crelavo içindeki yapay zekâ asistanıyım; ama sadece site formu değil, genel sohbet, fikir, yorum, kod ve üretim akışlarında da yardımcı olurum.";
    return "Sorunu aldım. Bunu üretim formuna zorlamadan normal asistan gibi cevaplayacağım; üretim komutuysa tek prompt veya sesli komutla çalışma alanına taşıyacağım.";
  }
  if (/hello|hi|hey/i.test(text)) return "Hi, I’m here. You can ask general questions, discuss ideas, debug code, or start production with one prompt or voice command.";
  return "I’m here. I’ll answer this as a normal assistant instead of forcing it into a production form; if it is a production request, I’ll route it into the workspace.";
}

function buildReply(suggestion: AssistantSuggestion, userText: string, activeLanguage = "") {
  if (suggestion.assistantReply?.trim()) return suggestion.assistantReply;
  if (isGeneralChatMessage(userText)) return localGeneralReply(userText, activeLanguage);
  return isTurkishText(userText, activeLanguage)
    ? `${suggestion.category} için ${suggestion.style} stil ve ${suggestion.duration} kapsam öneriyorum. ${suggestion.note}`
    : `I recommend ${suggestion.category} with a ${suggestion.style} style and ${suggestion.duration} duration. ${suggestion.note}`;
}

export function AiAssistantBox() {
  const router = useRouter();
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const voiceTranscriptReceivedRef = useRef(false);
  const voiceTimeoutRef = useRef<number | null>(null);
  const [input, setInput] = useState("I want a fully automatic campaign from a Shopify product link.");
  const [activeLanguage, setActiveLanguage] = useState(() => getStoredLanguage());
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const language = getStoredLanguage();
    return [{ role: "assistant", content: language === "tr" ? "Selam, buradayım. Genel soru, fikir, kod, site işi veya tek prompt/sesli üretim komutu yazabilirsin." : (fallbackSuggestion.assistantReply ?? "Hello, write what you want to produce.") }];
  });
  const [status, setStatus] = useState(() => getStoredLanguage() === "tr" ? "Yazılı veya sesli tek komut ver: soruysa cevaplarım, üretimse doğru çalışma alanına taşırım." : "Write or speak one command: if it is a question I answer it; if it is production I route it to the right workspace.");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AssistantSuggestion>(fallbackSuggestion);
  const [chargedCredits, setChargedCredits] = useState<number | null>(null);
  const [activityItems, setActivityItems] = useState<string[]>([
    "Assistant ready. Waiting for a prompt or voice request."
  ]);
  const [selectedQuality, setSelectedQuality] = useState("720p");
  const [selectedDuration, setSelectedDuration] = useState(fallbackSuggestion.duration);
  const [selectedStyle, setSelectedStyle] = useState(fallbackSuggestion.style);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedMaterialType, setSelectedMaterialType] = useState("No premium material");
  const [selectedMaterialOption, setSelectedMaterialOption] = useState("None");
  const [requestStatus, setRequestStatus] = useState("");
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  useEffect(() => {
    setActiveLanguage(getStoredLanguage());
    const handleLanguageChange = () => {
      setActiveLanguage(getStoredLanguage());
    };
    window.addEventListener("clipora-language-change", handleLanguageChange);
    return () => window.removeEventListener("clipora-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;

    requestAnimationFrame(() => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
  }, [messages, isLoading]);

  const estimatedRequestCredits = estimateCredits({
    toolCategory: suggestion.category,
    videoType: suggestion.requestType || "Metinden Video",
    duration: selectedDuration,
    style: selectedStyle,
    quality: selectedQuality,
    addOns: selectedAddOns,
    premiumMaterialType: selectedMaterialType,
    premiumMaterialOption: selectedMaterialOption
  });

  function toggleAddOn(addOn: string) {
    setSelectedAddOns((current) => current.includes(addOn) ? current.filter((item) => item !== addOn) : [...current, addOn]);
  }

  function updateMaterialType(materialType: string) {
    setSelectedMaterialType(materialType);
    setSelectedMaterialOption(premiumMaterialOptionsByType[materialType]?.[0] ?? "None");
  }

  async function sendMessage(mode: "quick" | "voice", forcedText?: string) {
    const cleanInput = (forcedText ?? input).trim();
    if (!cleanInput) {
      setStatus("Write a message first.");
      return;
    }

    const prefersTurkish = isTurkishText(cleanInput, activeLanguage);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: cleanInput }];
    setMessages(nextMessages);
      setActivityItems(prefersTurkish ? [
        mode === "voice" ? "Sesli komut alındı." : "Yazılı komut alındı.",
        "Asistan bunun sohbet mi üretim isteği mi olduğunu ayırıyor.",
        "Üretimse tek komutla doğru çalışma alanına taşıyacak."
      ] : [
        mode === "voice" ? "Voice request received." : "Written request received.",
        "The assistant is identifying whether this is chat or production.",
        "If it is production, one command routes it to the right workspace."
      ]);

    setInput("");
    setIsLoading(true);
    setStatus(prefersTurkish ? (isGeneralChatMessage(cleanInput) ? "Asistan normal sohbet cevabı hazırlıyor." : "Asistan tek komutla üretim yolunu hazırlıyor.") : (isGeneralChatMessage(cleanInput) ? "Assistant is preparing a normal chat answer." : "Assistant is preparing the one-command production route."));

    try {
      const { data: userData, error: userError } = await supabaseBrowser().auth.getUser();
      if (userError || !userData.user) {
        setIsLoading(false);
        setMessages([...nextMessages, { role: "assistant", content: "Please log in first so I can use your assistant credits safely." }]);
        setStatus("Login is required. Redirecting to login...");
        setTimeout(() => { window.location.href = "/auth/login"; }, 1200);
        return;
      }

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user.id,
          user_email: userData.user.email ?? "",
          idea: cleanInput,
          messages: nextMessages,
          mode
        })
      });

      const data = await response.json().catch(() => ({}));
      setIsLoading(false);

      if (!response.ok) {
        const errorMessage = data.redirect
          ? `${data.error} You need assistant trial credits or paid credits.`
          : (data.error ?? `AI Assistant could not run. Server status: ${response.status}.`);
        setMessages([...nextMessages, { role: "assistant", content: errorMessage }]);
        setStatus(data.redirect ? "Redirecting to credits page..." : "Assistant request failed.");
        if (data.redirect) setTimeout(() => { window.location.href = data.redirect; }, 2200);
        return;
      }

      const nextSuggestion = data.suggestion ?? fallbackSuggestion;
      const reply = buildReply(nextSuggestion, cleanInput, activeLanguage);
      setSuggestion(nextSuggestion);
      setSelectedStyle(nextSuggestion.style || "Cinematic");
      setSelectedDuration(nextSuggestion.duration || "30 seconds");
      setSelectedQuality(nextSuggestion.quality || "720p");
      setSelectedMaterialType(nextSuggestion.premiumMaterialType || "No premium material");
      setSelectedMaterialOption(nextSuggestion.premiumMaterialOption || "None");
      setChargedCredits(data.chargedCredits ?? null);
      setActivityItems([
        mode === "voice" ? "Voice request processed." : "Written request processed.",
        `Smart decision: ${nextSuggestion.action ?? "start_automatic_production"}`,
        `Next step: ${nextSuggestion.nextStep ?? "Start the fully automatic flow"}`,
        `Route: ${nextSuggestion.route ?? "/dashboard/assistant-workspace"}`
      ]);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      setStatus(data.chargeSource === "assistant_trial"
        ? `Assistant answered. ${data.chargedCredits ?? 0} free AI Assistant credits spent. Remaining free AI Assistant credits: ${data.assistantBalance ?? 0}.`
        : `Assistant answered. ${data.chargedCredits ?? 0} production credits spent.`);
    } catch (error) {
      setIsLoading(false);
      const errorText = error instanceof Error ? error.message : "request failed";
      setMessages([...nextMessages, { role: "assistant", content: `AI Assistant error: ${errorText}` }]);
      setStatus("Assistant request failed.");
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage("quick");
    }
  }

  function focusPromptInput() {
    const promptInput = document.getElementById("assistant-prompt-input") as HTMLTextAreaElement | null;
    promptInput?.focus();
    promptInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("Prompt field is ready. Write the product link or automation you want to create.");
  }

  function openSetupOptions() {
    document.getElementById("assistant-setup-options")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("You can edit style, duration, quality and extra credit options from Smart settings.");
  }

  function openProductionRequest() {
    const idea = suggestion.suggestedPrompt || input || messages.filter((message) => message.role === "user").at(-1)?.content || "";
    const params = new URLSearchParams({
      category: suggestion.category,
      mode: modeForSuggestion(suggestion.category, idea),
      style: selectedStyle,
      duration: selectedDuration,
      idea
    });
    if (suggestion.requestType) params.set("requestType", suggestion.requestType);
    router.push(`/dashboard/assistant-workspace?${params.toString()}`);
  }

  function showAllAutomations() {
    document.getElementById("production-categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("All automation categories are listed in the catalog section below.");
  }

  function focusAssistantPrompt(message: string) {
    const promptInput = document.getElementById("assistant-prompt-input") as HTMLTextAreaElement | null;
    promptInput?.focus();
    promptInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    setIsListening(false);
    setStatus(message);
  }

function clearAssistantVoiceTimeout() {
  if (voiceTimeoutRef.current) {
    window.clearTimeout(voiceTimeoutRef.current);
    voiceTimeoutRef.current = null;
  }
}

function handleAssistantVoiceNoTranscript() {
  clearAssistantVoiceTimeout();
  voiceTranscriptReceivedRef.current = false;
  setIsListening(false);
  focusAssistantPrompt("Audio was captured but could not be converted to text. Please try again or type your command.");
}

async function requestAssistantMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) return true;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
  return true;
}

async function startAssistantRawMicrophoneFallback() {
  if (!navigator.mediaDevices?.getUserMedia) {
    focusAssistantPrompt("This browser does not support microphone capture. Try Chrome or Edge.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setIsListening(true);
    setStatus("Microphone is active. Speech recognition is unavailable; use Chrome/Edge to turn speech into text.");
    window.setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
      setIsListening(false);
    }, 3500);
  } catch (error: any) {
    focusAssistantPrompt(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "Microphone permission was not granted. Allow microphone access from the browser address bar." : "Microphone could not start. Check browser microphone permission.");
  }
}

async function startVoiceCommand() {
    focusAssistantPrompt("Requesting microphone permission...");
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      await startAssistantRawMicrophoneFallback();
      return;
    }

    try {
      await requestAssistantMicrophonePermission();
      const recognition = new Recognition();
      recognition.lang = activeLanguage === "tr" ? "tr-TR" : activeLanguage === "de" ? "de-DE" : activeLanguage === "es" ? "es-ES" : activeLanguage === "fr" ? "fr-FR" : activeLanguage === "ar" ? "ar-SA" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      voiceTranscriptReceivedRef.current = false;
      clearAssistantVoiceTimeout();
      (recognition as any).onstart = () => {
        setIsListening(true);
        voiceTimeoutRef.current = window.setTimeout(() => {
          if (!voiceTranscriptReceivedRef.current) handleAssistantVoiceNoTranscript();
        }, 8000);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
        clearAssistantVoiceTimeout();
        setIsListening(false);
        if (transcript) {
          voiceTranscriptReceivedRef.current = true;
          setStatus(isTurkishText(transcript, activeLanguage) ? `Algılanan metin: ${transcript}` : `Detected text: ${transcript}`);
          sendMessage("voice", transcript);
        } else {
          handleAssistantVoiceNoTranscript();
        }
      };
      (recognition as any).onerror = (event: any) => {
        clearAssistantVoiceTimeout();
        focusAssistantPrompt(event?.error === "not-allowed" || event?.error === "service-not-allowed" ? "Microphone permission was not granted. Allow microphone access from the browser address bar." : event?.error === "no-speech" ? "No speech was detected; press again and speak." : "Microphone could not start. Check browser microphone permission.");
      };
      recognition.onend = () => {
        setIsListening(false);
        if (!voiceTranscriptReceivedRef.current && voiceTimeoutRef.current) handleAssistantVoiceNoTranscript();
      };
      setIsListening(true);
      setStatus("Listening... speak now.");
      recognition.start();
    } catch (error: any) {
      focusAssistantPrompt(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "Microphone permission was not granted. Allow microphone access from the browser address bar." : "Microphone could not start. Check browser microphone permission.");
    }
  }

  async function createRequestDirectly() {
    if (isCreatingRequest) return;

    setIsCreatingRequest(true);
    setRequestStatus("Creating request...");
    setActivityItems([
      "Calculating selected extra materials and quality settings.",
      `Estimated credits: ${estimatedRequestCredits}`,
      "Creating request record."
    ]);

    try {
      const { data: userData, error: userError } = await supabaseBrowser().auth.getUser();
      if (userError || !userData.user) {
        setRequestStatus("Login is required to create a request. Redirecting to login.");
        setActivityItems(["Not logged in.", "A user account is required to create a request."]);
        setTimeout(() => { window.location.href = "/auth/login"; }, 1200);
        return;
      }

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user.id,
          user_email: userData.user.email ?? "",
          title: `${suggestion.category} request from AI Assistant`,
          prompt: suggestion.suggestedPrompt || messages.filter((message) => message.role === "user").at(-1)?.content || "AI Assistant request",
          tool_category: suggestion.category,
          video_type: suggestion.requestType || "Text to Video",
          target_platform: "Internal business use",
          style: selectedStyle,
          duration: selectedDuration,
          quality: selectedQuality,
          add_ons: selectedAddOns,
          premium_material_type: selectedMaterialType,
          premium_material_option: selectedMaterialOption,
          language_notes: "Created from AI Assistant",
          extra_notes: `Created from AI Assistant. Estimated credits shown before submit: ${estimatedRequestCredits}.`
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = data.error ?? "Request could not be created.";
        setRequestStatus(errorMessage);
        setActivityItems([
          "Request could not be created.",
          errorMessage,
          data.redirect ? "Insufficient credits. The user can be redirected to the credits page." : "We can use this message for correction."
        ]);
        if (data.redirect) setTimeout(() => { window.location.href = data.redirect; }, 2200);
        return;
      }

      setRequestStatus(`Request created. Status: ${data.request?.status ?? "pending"}.`);
      setActivityItems([
        "Request created.",
        `${data.request?.estimated_credits ?? estimatedRequestCredits} credits reserved.`,
        "Production status can be tracked in Dashboard / My Productions."
      ]);
      setTimeout(() => { router.push("/dashboard/videos"); }, 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request could not be created.";
      setRequestStatus(`Request could not be created: ${message}`);
      setActivityItems(["Request could not be created.", message]);
    } finally {
      setIsCreatingRequest(false);
    }
  }

  function runAssistantAction() {
    const actionRoute = suggestion.route || "/dashboard/assistant-workspace";
    setActivityItems([
      `Action running: ${suggestion.action ?? "start_automatic_production"}`,
      `Next step: ${suggestion.nextStep ?? "Start the fully automatic production flow"}`,
      `Opening page: ${actionRoute}`
    ]);

    if (suggestion.action && suggestion.action !== "start_automatic_production") {
      router.push(actionRoute);
      return;
    }

    const actionIdea = suggestion.suggestedPrompt || messages.filter((message) => message.role === "user").at(-1)?.content || "";
    const params = new URLSearchParams({
      category: suggestion.category,
      mode: modeForSuggestion(suggestion.category, actionIdea),
      style: selectedStyle,
      duration: selectedDuration,
      idea: actionIdea
    });

    params.set("quality", selectedQuality);
    params.set("premiumMaterialType", selectedMaterialType);
    params.set("premiumMaterialOption", selectedMaterialOption);
    if (suggestion.requestType) params.set("requestType", suggestion.requestType);

    router.push(actionRoute.includes("?") ? actionRoute : `/dashboard/assistant-workspace?${params.toString()}`);
  }

  return (
    <div className="assistant-box">
        <div className="assistant-command-panel">
          <span className="assistant-badge"><Bot size={16} /> Smart Production Assistant</span>
          <h2>Crelavo Smart Assistant</h2>
          <p>Write a campaign from a product link, AI agent, global localization, website, iOS/Android app, SaaS, video, visual, brand kit, document or admin panel request. The assistant prepares the right production path.</p>
          <div className="assistant-signal-row">
            <button type="button" onClick={focusPromptInput}>Prompt</button>
            <button type="button" onClick={openSetupOptions}>Setup</button>
            <button type="button" onClick={() => router.push("/dashboard/credits")}>Credits</button>
            <button type="button" onClick={openProductionRequest}>Request</button>
          </div>
          <div className="assistant-status" data-no-translate="true">{status}</div>
        </div>
      <div className="assistant-input-card">
        <div className="assistant-chat-flow-head">
          <strong>{activeLanguage === "tr" ? "Chat akışı" : "Chat flow"}</strong>
          <span>{activeLanguage === "tr" ? "Soruysa normal cevap, üretimse tek komutla workspace akışı." : "General questions get normal answers; production commands route to workspace."}</span>
        </div>
        <div className="assistant-chat-window" ref={chatWindowRef}>
          {messages.map((message, index) => (
            <div className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}>
              <strong>{message.role === "user" ? "User request" : "Assistant answer"}</strong>
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading ? <div className="assistant-message assistant"><strong>Assistant answer</strong><p>Assistant is thinking...</p></div> : null}
        </div>

        <label>Written prompt or voice request</label>
        <textarea
          id="assistant-prompt-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Example: I want a campaign that creates a TikTok video, Instagram post, email newsletter and Google ad copy from my product link."
        />
        <div className="assistant-actions">
          <button className="assistant-send" type="button" onClick={() => sendMessage("quick")} disabled={isLoading}><Send size={16} /> {isLoading ? "Sending..." : "Send text"}</button>
          <button className="assistant-voice" type="button" onClick={startVoiceCommand} disabled={isListening} data-no-translate="true"><Mic size={16} /> {isListening ? "Listening..." : "Speak"}</button>
        </div>

        <div className="assistant-upgrades" id="assistant-setup-options">
          <strong>Smart settings</strong>
          <details open>
            <summary>Basic settings</summary>
            <div className="assistant-upgrade-grid">
              <label>Style<select value={selectedStyle} onChange={(event) => setSelectedStyle(event.target.value)}>{assistantStyleOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Duration<select value={selectedDuration} onChange={(event) => setSelectedDuration(event.target.value)}>{durationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Quality<select value={selectedQuality} onChange={(event) => setSelectedQuality(event.target.value)}>{assistantQualityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </details>
          <details>
            <summary>Extra credit options</summary>
            <div className="assistant-upgrade-grid">
              <label>Premium material<select value={selectedMaterialType} onChange={(event) => updateMaterialType(event.target.value)}>{premiumMaterialTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              {selectedMaterialType !== "No premium material" ? <label>Material detail<select value={selectedMaterialOption} onChange={(event) => setSelectedMaterialOption(event.target.value)}>{(premiumMaterialOptionsByType[selectedMaterialType] ?? ["None"]).map((item) => <option key={item}>{item}</option>)}</select></label> : null}
            </div>
            <div className="assistant-addon-list">
              {assistantAddOnOptions.map((item) => <button className={selectedAddOns.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggleAddOn(item)}>{item}</button>)}
            </div>
          </details>
          <div className="assistant-credit-preview">Estimated production credits: <strong>{estimatedRequestCredits}</strong></div>
        </div>

        <div className="assistant-activity">
          <strong>Live process</strong>
          <ul>
            {activityItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="assistant-result">
          <strong><Sparkles size={16} /> Production summary</strong>
          <div className="assistant-pills">
            <span>{suggestion.category}</span>
            <span>{selectedStyle}</span>
            <span>{selectedDuration}</span>
            <span>{selectedQuality}</span>
            <span>{estimatedRequestCredits} production credits</span>
            {chargedCredits ? <span>{chargedCredits} credits spent</span> : null}
          </div>
          <p>The credit estimate increases or decreases as options change. If you create directly, credits are reserved and the request is tracked in Dashboard / My Productions.</p>
          {requestStatus ? <p>{requestStatus}</p> : null}
        </div>
        <button className="assistant-primary" type="button" onClick={runAssistantAction}>{suggestion.nextStep ?? "Start the fully automatic action"}</button>
        <button className="assistant-secondary" type="button" onClick={showAllAutomations}>View all automations</button>
      </div>
    </div>
  );
}
