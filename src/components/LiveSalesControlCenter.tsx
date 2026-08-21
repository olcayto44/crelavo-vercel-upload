"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { liveSalesServicePlans } from "@/lib/data";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type WorkspaceState = {
  planId: string;
  voice: string;
  language: string;
  tone: string;
  role: string;
  avatarSource: string;
  industry: string;
  platform: string;
  productInfo: string;
  shippingInfo: string;
  orderInfo: string;
  availability: string;
  customSchedule: string;
  draftMessage: string;
  chatMessages: ChatMessage[];
};

type AvatarPreviewRecord = {
  provider?: string;
  route?: string;
  status?: string;
  sessionId?: string;
  previewUrl?: string;
  requestedAt?: string;
  message?: string;
};

type LiveSalesAgentRecord = {
  agent_id: string;
  status?: string;
  plan_id?: string | null;
  platform?: string | null;
  industry?: string | null;
  avatar_source?: string | null;
  avatar_role?: string | null;
  language?: string | null;
  voice?: string | null;
  tone?: string | null;
  product_info?: string | null;
  shipping_info?: string | null;
  order_info?: string | null;
  availability?: string | null;
  custom_schedule?: string | null;
  metadata?: Record<string, unknown> & { avatarPreview?: AvatarPreviewRecord };
};

const storageKey = "clipora-live-sales-avatar-v3";

const voiceOptions = ["Natural Female", "Natural Male", "Brand Voice", "Own voice upload"];
const languageOptions = ["English", "Turkish", "German", "French", "Dutch", "Chinese", "Japanese", "Arabic", "Bilingual", "Multilingual"];
const toneOptions = ["Warm", "Professional", "Sales-driven", "Friendly", "Luxury", "Expert"];
const roleOptions = ["All-in-one host", "Sales assistant", "Product presenter", "Customer support", "Appointment assistant", "Course advisor", "Lead qualification", "Service consultant"];
const avatarSourceOptions = ["Ready avatar", "Create AI avatar", "Upload my photo", "Upload brand character", "Use real person video"];
const industryOptions = ["E-commerce / Retail", "Education / Courses", "Health / Clinic", "Tourism / Hotel", "Real estate / Construction", "Automotive", "Legal / Consulting", "Finance / Insurance", "SaaS / B2B", "Restaurant / Local business", "Custom industry"];
const platformGroups = [
  { title: "Website / store", options: ["Own website", "Shopify", "WooCommerce", "WordPress", "Wix", "Webflow", "Magento", "BigCommerce", "Custom embed"] },
  { title: "Marketplace promotion", options: ["Amazon promotion", "Trendyol", "Hepsiburada", "N11", "eBay", "Etsy", "AliExpress"] },
  { title: "B2B sales", options: ["Alibaba / B2B", "Made-in-China", "Global Sources"] },
  { title: "Social / messaging", options: ["TikTok Shop", "Instagram / YouTube", "LinkedIn", "X", "WhatsApp Business"] }
];
const platformOptions = platformGroups.flatMap((group) => group.options);
const availabilityOptions = ["Always active", "Business hours only", "Custom schedule", "Manual start / stop"];
const agentId = process.env.NEXT_PUBLIC_LIVE_SALES_AGENT_ID || "agent_demo_live_sales_001";
const publicChatEndpoint = "/api/live-sales-agent-chat";
const agentConfigEndpoint = "/api/live-sales-agents";
const avatarPreviewEndpoint = "/api/live-sales-agents/avatar-preview";


const starterMessages: ChatMessage[] = [
  { id: "m1", role: "assistant", text: "Hi, I can help you present products and answer customer questions." },
  { id: "m2", role: "user", text: "How fast can it ship?" },
  { id: "m3", role: "assistant", text: "Share the destination and I can answer with the right shipping estimate." }
];

function initialState(): WorkspaceState {
  return {
    planId: liveSalesServicePlans[0]?.id ?? "live_sales_agent_starter",
    voice: voiceOptions[0],
    language: languageOptions[0],
    tone: toneOptions[0],
    role: roleOptions[0],
    avatarSource: avatarSourceOptions[0],
    industry: industryOptions[0],
    platform: platformOptions[0],
    productInfo: "Product, price, campaign, target buyer, and main selling points.",
    shippingInfo: "Preparation time, cargo provider, average delivery time, regions, and return policy.",
    orderInfo: "Order number, email/phone verification, order status source, and tracking flow.",
    availability: availabilityOptions[0],
    customSchedule: "Monday-Friday 09:00-18:00",
    draftMessage: "",
    chatMessages: starterMessages
  };
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) || /video/i.test(url);
}

function platformGuide(platform: string) {
  if (["Own website", "Custom embed", "WordPress", "Wix", "Webflow"].includes(platform)) {
    return "Add the script to your site custom code area. The avatar appears as a floating assistant widget.";
  }
  if (["Shopify", "WooCommerce", "Magento", "BigCommerce"].includes(platform)) {
    return "Use the embed code now. Product, order and shipping API connection can be enabled as the next integration step.";
  }
  if (["Amazon promotion", "Trendyol", "Hepsiburada", "N11", "eBay", "Etsy", "AliExpress"].includes(platform)) {
    return "Most marketplace product pages do not allow custom live widgets. Use avatar ads, hosted landing pages and product videos that send traffic to your listing.";
  }
  if (["Alibaba / B2B", "Made-in-China", "Global Sources"].includes(platform)) {
    return "Use the avatar for B2B catalog presentation, inquiry response, quote collection and company profile lead generation.";
  }
  if (["TikTok Shop", "Instagram / YouTube", "LinkedIn", "X", "WhatsApp Business"].includes(platform)) {
    return "Use the avatar for live-selling scripts, short videos, customer responses and social selling flows. LinkedIn works well for B2B outreach and X works well for fast campaign updates, product launches and customer engagement. Direct API/live integration requires setup.";
  }
  return "Use the generated agent ID and connect it with the correct Crelavo publish method for this channel.";
}

function embedCode(platform: string, currentAgentId = agentId) {
  const safePlatform = platform.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `<script\n  src="https://www.crelavo.com/embed/live-sales-avatar.js"\n  data-agent-id="${currentAgentId}"\n  data-platform="${safePlatform}"\n  data-position="bottom-right"\n  data-theme="dark">\n</script>`;
}

function assistantReply(message: string) {
  const text = message.toLowerCase();
  const looksTurkish = /[ğüşöçıİ]/i.test(message) || ["kargo", "sipariş", "satış", "tanıtım", "ürün", "lazım", "iade"].some((word) => text.includes(word));

  if (["all", "hepsi", "tamamı", "tanıtım", "satış", "sipariş", "kargo"].filter((word) => text.includes(word)).length >= 2) {
    return looksTurkish
      ? "Yes, the best role is All-in-one host. One avatar can present products, guide sales, answer order questions, and explain shipping. Next we should connect product category, sales channel, and shipping/order data."
      : "Yes, the best role is All-in-one host. One avatar can present products, guide sales, answer order questions, and explain shipping. Next we should connect product catalog, sales channel, and shipping/order data.";
  }
  if (text.includes("kargo") || text.includes("ship") || text.includes("delivery") || text.includes("cargo")) {
    return looksTurkish
      ? "Kargo entegrasyonu bağlandığında avatar takip numarası, kargo firması ve tahmini teslimat bilgisini müşteriye açıklayabilir."
      : "Once shipping is connected, the avatar can explain carrier, tracking number, and estimated delivery timing.";
  }
  if (text.includes("sipariş") || text.includes("order")) {
    return looksTurkish
      ? "Sipariş sistemi bağlandığında avatar sipariş numarası, e-posta veya telefon doğrulamasıyla sipariş durumunu cevaplayabilir."
      : "Once order data is connected, the avatar can answer order status using order number, email, or phone verification.";
  }
  if (text.includes("satış") || text.includes("price") || text.includes("cost") || text.includes("discount") || text.includes("sales")) {
    return looksTurkish
      ? "The avatar can deliver a sales pitch, handle objections, and guide the buyer toward checkout."
      : "The avatar can deliver a sales pitch, handle objections, and guide the buyer toward checkout.";
  }
  if (text.includes("tanıtım") || text.includes("ürün") || text.includes("product") || text.includes("feature") || text.includes("promotion")) {
    return looksTurkish
      ? "The avatar can present your product, explain key benefits, and deliver the offer in your brand tone."
      : "The avatar can present your product, explain key benefits, and deliver the offer in your brand tone.";
  }
  return looksTurkish
    ? "I can help set up a live avatar for product promotion, sales, order support, and shipping questions. Tell me what you want it to do."
    : "I can help set up a live avatar for product promotion, sales, order support, and shipping questions. Tell me what you want it to do.";
}

export function LiveSalesControlCenter() {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [agentIdValue, setAgentIdValue] = useState(agentId);
  const [conversationId, setConversationId] = useState("");
  const [openPreference, setOpenPreference] = useState("Industry");
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreviewRecord | null>(null);
  const [previewingAvatar, setPreviewingAvatar] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<WorkspaceState> | null;
      if (parsed) {
        const normalizedMessages = Array.isArray(parsed.chatMessages) && parsed.chatMessages.length
          ? parsed.chatMessages.map((message) => ({
              id: String(message.id || `message-${Date.now()}`),
              role: message.role === "user" ? "user" as const : "assistant" as const,
              text: String(message.text || "")
            })).filter((message) => message.text.trim())
          : starterMessages;

        setState((current) => ({
          ...current,
          ...parsed,
          draftMessage: parsed.draftMessage || "",
          chatMessages: normalizedMessages
        }));
      }
    } catch {
      setState(initialState());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAgentSetup() {
      if (loadingAgent) return;
      setLoadingAgent(true);
      try {
        const auth = await requireVerifiedBrowserUser();
        if (!auth.ok) return;
        const response = await fetch(`${agentConfigEndpoint}?user_id=${encodeURIComponent(auth.user.id)}`, {
          headers: authHeaders(auth.accessToken)
        });
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        const agent = data.agent as LiveSalesAgentRecord | null | undefined;
        if (!agent || cancelled) return;
        setAgentIdValue(agent.agent_id || agentId);
        setAvatarPreview(agent.metadata?.avatarPreview ?? null);
        setState((current) => ({
          ...current,
          planId: agent.plan_id || current.planId,
          platform: agent.platform || current.platform,
          industry: agent.industry || current.industry,
          avatarSource: agent.avatar_source || current.avatarSource,
          role: agent.avatar_role || current.role,
          language: agent.language || current.language,
          voice: agent.voice || current.voice,
          tone: agent.tone || current.tone,
          productInfo: agent.product_info || current.productInfo,
          shippingInfo: agent.shipping_info || current.shippingInfo,
          orderInfo: agent.order_info || current.orderInfo,
          availability: agent.availability || current.availability,
          customSchedule: agent.custom_schedule || current.customSchedule
        }));
      } catch {
        // keep local defaults
      } finally {
        if (!cancelled) setLoadingAgent(false);
      }
    }
    void loadAgentSetup();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const activePlan = liveSalesServicePlans.find((plan) => plan.id === state.planId) ?? liveSalesServicePlans[0];
  const includedMinutes = (activePlan?.fairUseHours ?? 10) * 60;
  const usedMinutes = 0;
  const remainingMinutes = Math.max(0, includedMinutes - usedMinutes);

  useEffect(() => {
    chatWindowRef.current?.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: "smooth" });
  }, [state.chatMessages]);

  useEffect(() => {
    if (!avatarPreview?.sessionId) return;
    if (avatarPreview.previewUrl && String(avatarPreview.status || "").toLowerCase() === "completed") return;

    let cancelled = false;
    const poll = async () => {
      if (cancelled || previewingAvatar) return;
      await refreshAvatarPreviewStatus();
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [avatarPreview?.sessionId, avatarPreview?.previewUrl, avatarPreview?.status, agentIdValue, previewingAvatar]);

  const preferenceGroups = useMemo(() => [
    { label: "Voice", value: state.voice, options: voiceOptions, key: "voice" as const },
    { label: "Language", value: state.language, options: languageOptions, key: "language" as const },
    { label: "Tone", value: state.tone, options: toneOptions, key: "tone" as const },
    { label: "Industry", value: state.industry, options: industryOptions, key: "industry" as const },
    { label: "Avatar source", value: state.avatarSource, options: avatarSourceOptions, key: "avatarSource" as const },
    { label: "Role", value: state.role, options: roleOptions, key: "role" as const },
    { label: "Platform", value: state.platform, options: platformOptions, key: "platform" as const }
  ], [state.voice, state.language, state.tone, state.industry, state.avatarSource, state.role, state.platform]);

function setPreference(key: keyof Pick<WorkspaceState, "voice" | "language" | "tone" | "industry" | "avatarSource" | "role" | "platform">, value: string) {
  setState((current) => ({ ...current, [key]: value }));
}

function liveSalesContextPrompt() {
  return `Live Sales Avatar setup:\nPlatform: ${state.platform}\nIndustry / use case: ${state.industry}\nAvatar source: ${state.avatarSource}\nAvatar role: ${state.role}\nLanguage: ${state.language}\nVoice: ${state.voice}\nTone: ${state.tone}\nProduct/business info: ${state.productInfo}\nShipping/delivery policy: ${state.shippingInfo}\nOrder support flow: ${state.orderInfo}\nThe assistant should answer like a live sales avatar for the seller's customers. It should use product, shipping, delivery, order and return context when available. It should not invent real tracking numbers or order statuses; if order data is missing, ask for order number and verification or explain that integration is needed.`;
}

function detectLanguage(message: string) {
  const text = message.toLowerCase();
  return /[ğüşöçıİ]/i.test(message) || ["kargo", "sipariş", "satış", "tanıtım", "ürün", "lazım", "iade"].some((word) => text.includes(word)) ? "tr" : "en";
}

async function saveAvatarSetup() {
  if (saving) return;
  setSaving(true);
  setSaveMessage("");
  try {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setSaveMessage(auth.message);
      return;
    }
    const response = await fetch(agentConfigEndpoint, {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        user_id: auth.user.id,
        agent_id: agentIdValue,
        plan_id: state.planId,
        platform: state.platform,
        industry: state.industry,
        avatar_source: state.avatarSource,
        avatar_role: state.role,
        language: state.language,
        voice: state.voice,
        tone: state.tone,
        product_info: state.productInfo,
        shipping_info: state.shippingInfo,
        order_info: state.orderInfo,
        availability: state.availability,
        custom_schedule: state.customSchedule
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data.error || "Could not save avatar setup."));
    if (data.agent_id) setAgentIdValue(String(data.agent_id));
    setSaveMessage(data.saved ? "Avatar setup saved. Embed code is ready." : String(data.message || "Avatar setup draft is ready; database setup is pending."));
    if (data.agent?.agent_id) setAgentIdValue(String(data.agent.agent_id));
    if (data.agent?.metadata?.avatarPreview) setAvatarPreview(data.agent.metadata.avatarPreview as AvatarPreviewRecord);
  } catch (error) {
    setSaveMessage(error instanceof Error ? error.message : "Could not save avatar setup.");
  } finally {
    setSaving(false);
  }
}

async function generateAvatarPreview() {
  if (previewingAvatar) return;
  setPreviewingAvatar(true);
  setPreviewMessage("");
  try {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setPreviewMessage(auth.message);
      return;
    }

    const saveResponse = await fetch(agentConfigEndpoint, {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        user_id: auth.user.id,
        agent_id: agentIdValue,
        plan_id: state.planId,
        platform: state.platform,
        industry: state.industry,
        avatar_source: state.avatarSource,
        avatar_role: state.role,
        language: state.language,
        voice: state.voice,
        tone: state.tone,
        product_info: state.productInfo,
        shipping_info: state.shippingInfo,
        order_info: state.orderInfo,
        availability: state.availability,
        custom_schedule: state.customSchedule
      })
    });
    const saveData = await saveResponse.json().catch(() => ({}));
    if (!saveResponse.ok) throw new Error(String(saveData.error || "Could not save avatar setup before preview."));
    const currentAgentId = String(saveData.agent_id || saveData.agent?.agent_id || agentIdValue);
    if (currentAgentId) setAgentIdValue(currentAgentId);

    const response = await fetch(avatarPreviewEndpoint, {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ user_id: auth.user.id, agent_id: currentAgentId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data.error || "Could not start avatar preview."));
    const nextPreview = data.avatar_preview as AvatarPreviewRecord;
    setAvatarPreview(nextPreview);
    setPreviewMessage(nextPreview.message || `Avatar preview route started: ${nextPreview.provider || "provider"} / ${nextPreview.status || "queued"}.`);
  } catch (error) {
    setPreviewMessage(error instanceof Error ? error.message : "Could not start avatar preview.");
  } finally {
    setPreviewingAvatar(false);
  }
}

async function refreshAvatarPreviewStatus() {
  if (previewingAvatar) return;
  if (!avatarPreview?.sessionId) {
    setPreviewMessage("Start the avatar preview first.");
    return;
  }
  setPreviewingAvatar(true);
  setPreviewMessage("");
  try {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setPreviewMessage(auth.message);
      return;
    }
    const params = new URLSearchParams({ user_id: auth.user.id, agent_id: agentIdValue });
    const response = await fetch(`${avatarPreviewEndpoint}?${params.toString()}`, {
      headers: authHeaders(auth.accessToken)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data.error || "Could not refresh avatar preview status."));
    const nextPreview = data.avatar_preview as AvatarPreviewRecord;
    setAvatarPreview(nextPreview);
    setPreviewMessage(nextPreview.previewUrl ? "Avatar preview hazır. Link açılabilir." : `Avatar preview status: ${nextPreview.status || "generating"}.`);
  } catch (error) {
    setPreviewMessage(error instanceof Error ? error.message : "Could not refresh avatar preview status.");
  } finally {
    setPreviewingAvatar(false);
  }
}

async function sendMessage() {
  const message = state.draftMessage.trim();
  if (!message || sending) return;

  const timestamp = Date.now();
  const nextUserMessage: ChatMessage = { id: `user-${timestamp}`, role: "user", text: message };
  setState((current) => ({ ...current, draftMessage: "", chatMessages: [...current.chatMessages, nextUserMessage] }));
  setSending(true);

  const language = detectLanguage(message);
  const localFallback = assistantReply(message);

  try {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setState((current) => ({ ...current, chatMessages: [...current.chatMessages, { id: `assistant-${timestamp + 1}`, role: "assistant", text: localFallback }] }));
      return;
    }

    const response = await fetch(publicChatEndpoint, {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        user_id: auth.user.id,
        user_email: auth.user.email ?? "",
        message: `${liveSalesContextPrompt()}\n\nCustomer message: ${message}`,
        mode: "quick",
        language,
        conversation_id: conversationId || undefined,
        messages: state.chatMessages.slice(-8).map((item) => ({ role: item.role, content: item.text }))
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data.error || "Assistant chat failed"));
    if (data.conversation_id) setConversationId(String(data.conversation_id));
    const reply = String(data.reply || "").trim() || localFallback;
    setState((current) => ({ ...current, chatMessages: [...current.chatMessages, { id: `assistant-${Date.now()}`, role: "assistant", text: reply }] }));
  } catch {
    setState((current) => ({ ...current, chatMessages: [...current.chatMessages, { id: `assistant-${timestamp + 2}`, role: "assistant", text: localFallback }] }));
  } finally {
    setSending(false);
  }
}

  return (
    <div className="live-sales-control-stack live-sales-avatar-layout">
      <section className="card live-sales-avatar-stage">
        <div className="live-sales-avatar-frame">
            <div className="live-sales-avatar-visual">
              <div className="live-sales-avatar-live-pill">LIVE</div>
              {avatarPreview?.previewUrl ? (
                <div style={{ position: "absolute", inset: 0, borderRadius: 28, overflow: "hidden", background: "#050505" }}>
                  {isDirectVideoUrl(avatarPreview.previewUrl) ? (
                    <video src={avatarPreview.previewUrl} controls preload="metadata" playsInline style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                  ) : (
                    <iframe src={avatarPreview.previewUrl} title="Live sales avatar preview" allow="autoplay; fullscreen" style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
                  )}
                  <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 16, background: "rgba(0,0,0,.45)", color: "#fff", backdropFilter: "blur(8px)" }}>
                    <strong>{avatarPreview.provider || "provider"}</strong>
                    <span>{avatarPreview.status || "preview"}</span>
                  </div>
                </div>
              ) : (
                <div className="live-sales-avatar-face">Avatar</div>
              )}
              <div className="live-sales-plan-strip compact live-sales-avatar-plan-inline">
                <strong>{activePlan?.name}</strong>
                <span>{activePlan?.price}</span>
                <span>{formatMinutes(remainingMinutes)} remaining</span>
              </div>
              <div className="card selected-billing-card live-sales-preferences-card" style={{ marginTop: 14 }}>
                <span className="badge">Where to use</span>
                <h3 style={{ margin: "6px 0 0" }}>Avatar video targets</h3>
                <p style={{ color: "var(--muted)", margin: 0 }}>Add the avatar video or widget to websites, stores, marketplaces, or B2B lead pages. Alibaba / B2B works best for catalog presentation, inquiry capture, quote collection, and company profile leads.</p>
                <div className="social-chip-row" aria-label="Supported avatar destinations">
                  {[
                    "Own website",
                    "Shopify",
                    "WooCommerce",
                    "WordPress",
                    "Webflow",
                    "Wix",
                    "Magento",
                    "BigCommerce",
                    "eBay",
                    "Etsy",
                    "Amazon",
                    "Alibaba",
                    "Trendyol",
                    "Hepsiburada",
                    "N11",
                    "TikTok Shop",
                    "Instagram / YouTube",
                    "LinkedIn",
                    "X",
                    "WhatsApp Business"
                  ].map((platform) => <span key={platform}>{platform}</span>)}
                </div>
              </div>
            </div>


          <div className="live-sales-avatar-copy">
            <div className="card selected-billing-card live-sales-preferences-card">
              <span className="badge">Preferences</span>
              <div className="live-sales-accordion-list">
                {preferenceGroups.map((group) => {
                  const isOpen = openPreference === group.label;
                  return (
                    <div className="live-sales-accordion-item" key={group.label}>
                      <button className="live-sales-accordion-head" type="button" onClick={() => setOpenPreference(isOpen ? "" : group.label)}>
                        <span>{group.label}</span>
                        <strong>{group.value}</strong>
                      </button>
                      {isOpen ? (
                        <div className="live-sales-option-panel">
                          {group.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`live-sales-option-chip ${group.value === option ? "active" : ""}`}
                              onClick={() => setPreference(group.key, option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card selected-billing-card live-sales-preferences-card">
              <span className="badge">Business knowledge</span>
              <div className="live-sales-accordion-list">
                {[
                  { label: "Product / offer", value: state.productInfo, key: "productInfo" as const },
                  { label: "Shipping / delivery policy", value: state.shippingInfo, key: "shippingInfo" as const },
                  { label: "Order support flow", value: state.orderInfo, key: "orderInfo" as const }
                ].map((item) => {
                  const isOpen = openPreference === item.label;
                  return (
                    <div className="live-sales-accordion-item" key={item.label}>
                      <button className="live-sales-accordion-head" type="button" onClick={() => setOpenPreference(isOpen ? "" : item.label)}>
                        <span>{item.label}</span>
                      </button>
                      {isOpen ? (
                        <div className="live-sales-option-panel">
                          <textarea rows={3} value={item.value} onChange={(event) => setState((current) => ({ ...current, [item.key]: event.target.value }))} style={{ width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "inherit", padding: 12 }} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card selected-billing-card live-sales-preferences-card">
              <span className="badge">Publish / Integration</span>
              <button className="btn" type="button" onClick={saveAvatarSetup} disabled={saving} style={{ marginTop: 10, width: "100%" }}>{saving ? "Saving..." : "Save avatar setup"}</button>
              {saveMessage ? <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>{saveMessage}</p> : null}
              <button className="btn secondary" type="button" onClick={generateAvatarPreview} disabled={previewingAvatar} style={{ marginTop: 10, width: "100%" }}>{previewingAvatar ? "Starting preview..." : "Generate avatar preview"}</button>
              {previewMessage ? <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>{previewMessage}</p> : null}
              {avatarPreview ? (
                <div className="workspace-action-note" style={{ marginTop: 10 }}>
                  <strong>Avatar preview</strong>
                  <p>{avatarPreview.provider || "provider"} · {avatarPreview.status || "pending"}</p>
                  {avatarPreview.sessionId ? <small>Session: {avatarPreview.sessionId}</small> : null}
                  <button className="btn secondary" type="button" onClick={refreshAvatarPreviewStatus} disabled={previewingAvatar || !avatarPreview.sessionId} style={{ marginTop: 8 }}>{previewingAvatar ? "Checking..." : "Refresh preview status"}</button>
                  {avatarPreview.previewUrl ? <a className="btn secondary" href={avatarPreview.previewUrl} target="_blank" rel="noreferrer" style={{ marginTop: 8 }}>Open preview</a> : null}
                </div>
              ) : null}
              <div className="live-sales-accordion-list">
                <div className="live-sales-accordion-item">
                  <button className="live-sales-accordion-head" type="button" onClick={() => setOpenPreference(openPreference === "Availability" ? "" : "Availability")}>
                    <span>Availability</span>
                    <strong>{state.availability}</strong>
                  </button>
                  {openPreference === "Availability" ? (
                    <div className="live-sales-option-panel">
                      {availabilityOptions.map((option) => (
                        <button key={option} type="button" className={`live-sales-option-chip ${state.availability === option ? "active" : ""}`} onClick={() => setState((current) => ({ ...current, availability: option }))}>{option}</button>
                      ))}
                      {state.availability === "Custom schedule" ? <textarea rows={2} value={state.customSchedule} onChange={(event) => setState((current) => ({ ...current, customSchedule: event.target.value }))} style={{ width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "inherit", padding: 12 }} /> : null}
                    </div>
                  ) : null}
                </div>
                <div className="live-sales-accordion-item">
                  <button className="live-sales-accordion-head" type="button" onClick={() => setOpenPreference(openPreference === "Platform guide" ? "" : "Platform guide")}>
                    <span>Platform guide</span>
                    <strong>{state.platform}</strong>
                  </button>
                  {openPreference === "Platform guide" ? (
                    <div className="live-sales-option-panel">
                      <p style={{ color: "var(--muted)", margin: 0 }}>{platformGuide(state.platform)}</p>
                    </div>
                  ) : null}
                </div>
                <div className="live-sales-accordion-item">
                  <button className="live-sales-accordion-head" type="button" onClick={() => setOpenPreference(openPreference === "Embed code" ? "" : "Embed code")}>
                    <span>Embed code</span>
                    <strong>{agentIdValue}</strong>
                  </button>
                  {openPreference === "Embed code" ? (
                    <div className="live-sales-option-panel">
                      <pre className="live-sales-code-block">{embedCode(state.platform, agentIdValue)}</pre>
                      <button className="live-sales-option-chip active" type="button" onClick={() => navigator.clipboard?.writeText(embedCode(state.platform, agentIdValue))}>Copy code</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="card live-sales-assistant-rail">
        <span className="badge">Assistant</span>
        <h3>Live sales assistant</h3>
        <p style={{ color: "var(--muted)" }}>Type or speak as a customer and test the assistant response.</p>

        <div className="live-sales-chat-window" ref={chatWindowRef}>
          {state.chatMessages.map((message) => (
            <div className={`chat-bubble${message.role === "user" ? " user" : ""}`} key={message.id}>
              {message.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Ask about shipping", "Ask about price", "Ask about returns", "Ask about features"].map((label) => (
            <button
              key={label}
              type="button"
              className="btn secondary"
              style={{ padding: "8px 12px", fontSize: 12 }}
              onClick={() => setState((current) => ({ ...current, draftMessage: label }))}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <textarea
            value={state.draftMessage}
            onChange={(event) => setState((current) => ({ ...current, draftMessage: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask as a customer about product, price, order or shipping..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.04)",
              color: "inherit",
              padding: 14
            }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={sendMessage} disabled={sending}>{sending ? "Thinking..." : "Send"}</button>
            <button className="btn secondary" type="button">Microphone</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
