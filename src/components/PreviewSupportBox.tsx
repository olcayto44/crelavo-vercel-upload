"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles, Volume2 } from "lucide-react";
import { usePathname } from "next/navigation";

const hiddenPrefixes = ["/admin", "/api", "/auth", "/checkout", "/dashboard/assistant-workspace"];
const defaultAgentId = process.env.NEXT_PUBLIC_LIVE_SALES_AGENT_ID || "agent_demo_live_sales_001";
const publicAgentEndpoint = "/api/live-sales-agents";
const heygenBrandAvatarEmbedUrl = "https://app.heygen.com/embeds/b0578cda37b142c3bcc882bb97efec8d";
const heygenBrandAvatarPosterUrl = "https://dynamic.heygen.ai/aws_pacific/avatar_tmp/7d64cde279b94a299de0eb0a02ea72e4/v05da9514522743039a8c4e8b76c19522/b0578cda37b142c3bcc882bb97efec8d.jpeg";
const heygenBrandAvatarVideoUrl = "/api/heygen?action=brand_avatar_proxy";

type Lang = "tr" | "en";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type AvatarPreview = {
  provider?: string | null;
  status?: string | null;
  sessionId?: string | null;
  previewUrl?: string | null;
  route?: string | null;
  message?: string | null;
  checkedAt?: string | null;
};

type PublicAgent = {
  agent_id?: string;
  avatar_role?: string | null;
  platform?: string | null;
  industry?: string | null;
  availability?: string | null;
  metadata?: { avatarPreview?: AvatarPreview } | null;
};

const quickPromptsByLang: Record<Lang, string[]> = {
  tr: [
    "Crelavo kategorileri neler?",
    "Kredi ve paketler nasıl çalışır?",
    "7/24 canlı satış avatarı ne yapar?"
  ],
  en: [
    "What Crelavo categories are available?",
    "How do credits and plans work?",
    "What can the 24/7 live sales avatar do?"
  ]
};

const useCaseDetails = {
  website: {
    label: "Web sitesi",
    title: "Web sitene böyle gömülür",
    description: "Ziyaretçiyi karşılayan, ürün sorusuna cevap veren ve lead toplayan canlı bir avatar katmanı gibi çalışır.",
    bullets: ["Sabit sağ alt widget", "Canlı konuşan avatar görünümü", "Hızlı ürün ve destek soruları"]
  },
  ecommerce: {
    label: "E-ticaret",
    title: "E-ticaret satış vitrini",
    description: "Ürün faydasını anlatır, sipariş öncesi itirazları cevaplar ve kullanıcıyı satın almaya yönlendirir.",
    bullets: ["Ürün açıklama demo'su", "Satış odaklı yanıt akışı", "Sipariş / kargo desteği"]
  },
  social: {
    label: "Sosyal medya",
    title: "Sosyal medya anlatım modeli",
    description: "Reels, short video veya landing page demosu için markayı konuşan bir yüz gibi sunar.",
    bullets: ["Kısa ve hızlı cevaplar", "Marka tonu ile konuşma", "Dikkat çekici ilk izlenim"]
  },
  support: {
    label: "Destek",
    title: "Destek asistanı",
    description: "Kullanıcıyı yönlendirir, sık sorulan soruları yanıtlar ve gerektiğinde doğru sayfaya yollar.",
    bullets: ["Sık sorulan sorular", "Doğru sayfa yönlendirme", "İnsan desteğine geçiş"]
  }
} as const;

function normalize(text: string) {
  return text.toLowerCase().replace(/[ıİ]/g, "i").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c");
}

function detectLanguage(text: string, fallback: Lang = "en"): Lang {
  const clean = normalize(text);
  if (/[ğüşöçıİ]/i.test(text) || /\b(nedir|iptal|kredi|paket|fiyat|ucret|ödeme|odeme|yardim|yardım|evet|tamam|yonlendir|yönlendir)\b/.test(clean)) return "tr";
  return fallback;
}

function canShow(pathname: string | null) {
  const path = pathname || "/";
  return !hiddenPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isDirectPreviewUrl(url?: string | null) {
  return Boolean(url && (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) || url.includes("action=brand_avatar_proxy") || url.includes("action=brand_avatar_video")));
}

function pickPreferredVoice(lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;
  const wantsTurkish = lang === "tr";
  const preferredNames = wantsTurkish
    ? ["emel", "zira", "female", "woman", "han", "sibel", "elif", "ayse"]
    : ["samantha", "zira", "female", "woman", "ava", "nicky", "olivia", "maria", "karen"];
  const filtered = voices.filter((voice) => {
    const name = voice.name.toLowerCase();
    const langOk = wantsTurkish ? voice.lang.toLowerCase().startsWith("tr") : voice.lang.toLowerCase().startsWith("en") || voice.lang.toLowerCase().startsWith("en-");
    return langOk && preferredNames.some((token) => name.includes(token));
  });
  return filtered[0] || voices.find((voice) => wantsTurkish ? voice.lang.toLowerCase().startsWith("tr") : voice.lang.toLowerCase().startsWith("en")) || voices[0] || null;
}

function safeSpeech(text: string, voiceOn: boolean) {
  if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const lang = detectLanguage(text);
  utterance.lang = lang === "tr" ? "tr-TR" : "en-US";
  const preferredVoice = pickPreferredVoice(lang);
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.96;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function PreviewSupportBox() {
  const pathname = usePathname();
  const allowed = useMemo(() => canShow(pathname), [pathname]);
  const [open, setOpen] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [videoSoundOn, setVideoSoundOn] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("LIVE · 7/24 satış avatarı hazır");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Merhaba, ben Crelavo’nun 7/24 canlı satış avatarıyım. Kategoriler, krediler, kampanyalar, fiyat mantığı, üretim akışları, web sitesi, uygulama, video, e-ticaret ve genel sorularınız için canlı yardımcı olabilirim."
    }
  ]);
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreview | null>(null);
  const [publicAgent, setPublicAgent] = useState<PublicAgent | null>(null);
  const [useCase, setUseCase] = useState<keyof typeof useCaseDetails>("website");
  const [chatOpen, setChatOpen] = useState(false);
  const [avatarVideoFailed, setAvatarVideoFailed] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const avatarVideoRef = useRef<HTMLVideoElement | null>(null);
  const sessionIdRef = useRef<string>("");
  const agentId = defaultAgentId;

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;

    async function loadPublicAgent() {
      try {
        const response = await fetch(`${publicAgentEndpoint}?agent_id=${encodeURIComponent(agentId)}`);
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        const agent = data.agent as PublicAgent | null | undefined;
        if (cancelled || !agent) return;
        setPublicAgent(agent);
        const nextPreview = agent.metadata?.avatarPreview ?? null;
        setAvatarPreview(nextPreview);
      } catch {
        // Keep the local avatar demo visible even if public loading fails.
      }
    }

    void loadPublicAgent();
    const timer = window.setInterval(() => {
      void loadPublicAgent();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [allowed, agentId]);

  if (!allowed) return null;

  const activeAvatarUrl = heygenBrandAvatarVideoUrl;

  useEffect(() => {
    setAvatarVideoFailed(false);
  }, [activeAvatarUrl]);
  function ensureSessionId() {
    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID();
    return sessionIdRef.current;
  }

  async function sendMessage(rawInput?: string) {
    const message = String(rawInput ?? input).trim();
    if (!message || loading) return;

    setInput("");
    setChatOpen(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    setStatus("LIVE · thinking");

    const fallback = detectLanguage(message) === "tr"
      ? "Crelavo canlı satış avatarı hazır. Kategori, kredi, kampanya, üretim, web sitesi, uygulama, video veya genel bir soru yazabilirsiniz."
      : "The Crelavo live sales avatar is ready. Ask about categories, credits, campaigns, production, websites, apps, video, or general questions.";

    try {
      const response = await fetch("/api/live-sales-agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          message,
          session_id: ensureSessionId()
        })
      });
      const data = await response.json().catch(() => ({}));
      const reply = String(data.reply || data.error || fallback).trim() || fallback;
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setStatus(String(data.agent?.availability ? `LIVE · ${data.agent.availability}` : "LIVE · 7/24 satış avatarı hazır"));
      // Tarayıcı TTS kalitesi tutarsız olduğu için chat cevabı yazılı kalır; ses gerçek avatar videosundan gelir.
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: fallback }]);
      setStatus("LIVE · offline fallback");
      // Tarayıcı TTS kalitesi tutarsız olduğu için chat cevabı yazılı kalır; ses gerçek avatar videosundan gelir.
    } finally {
      setLoading(false);
    }
  }


  if (!open) {
    return (
      <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 70 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            border: "1px solid rgba(125,211,252,.28)",
            background: "radial-gradient(circle at 30% 30%, rgba(125,211,252,.38), transparent 36%), linear-gradient(135deg, #0f172a, #312e81)",
            color: "#fff",
            boxShadow: "0 20px 50px rgba(0,0,0,.32)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center"
          }}
          aria-label="Open Crelavo live avatar"
        >
          <span style={{ display: "grid", gap: 2, placeItems: "center" }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid rgba(255,255,255,.28)", display: "grid", placeItems: "center" }}>
              <Bot size={16} />
            </span>
            <small style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em" }}>LIVE</small>
          </span>
        </button>
      </div>
    );
  }

  return (
  <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 2147483647, width: "min(360px, calc(100vw - 24px))", maxHeight: "min(620px, calc(100vh - 28px))" }}>
    <div className="card" style={{ border: "1px solid rgba(255,255,255,.18)", boxShadow: "0 24px 60px rgba(0,0,0,.34)", background: "rgba(10, 14, 28, .96)", overflow: "hidden", padding: 12, color: "#fff", maxHeight: "min(620px, calc(100vh - 28px))", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 18, background: "radial-gradient(circle at 35% 35%, rgba(125,211,252,.72), transparent 38%), radial-gradient(circle at 65% 70%, rgba(167,139,250,.58), transparent 42%), linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(125,211,252,.22)", display: "grid", placeItems: "center", flex: "0 0 auto", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)" }}>
              <Bot size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, lineHeight: 1.1 }}>7/24 Crelavo Live Sales Avatar</h3>
                <p style={{ margin: 0, color: "rgba(226,232,240,.76)", fontSize: 12, lineHeight: 1.45 }}>Kategoriler, krediler, kampanyalar ve Crelavo üretim akışları için canlı satış asistanı.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close live avatar"
            onClick={() => setOpen(false)}
            style={{ border: 0, borderRadius: 999, width: 32, height: 32, cursor: "pointer", background: "rgba(255,255,255,.12)", color: "#fff", flex: "0 0 auto", fontSize: 20, lineHeight: "32px" }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 12, borderRadius: 22, padding: 14, background: "linear-gradient(180deg, rgba(15,23,42,.86), rgba(2,6,23,.96))", border: "1px solid rgba(125,211,252,.14)", overflowY: "auto", minHeight: 0 }}>
          <div style={{ borderRadius: 24, overflow: "hidden", background: "linear-gradient(180deg, rgba(8,15,28,.98), rgba(2,6,23,.98))", border: "1px solid rgba(125,211,252,.12)", marginBottom: 12 }}>
            {activeAvatarUrl ? (
              <div style={{ position: "relative", aspectRatio: "4 / 5", width: "100%", minHeight: 210 }}>
                {!avatarVideoFailed ? (
                  <video
                    ref={avatarVideoRef}
                    src={activeAvatarUrl}
                    poster={heygenBrandAvatarPosterUrl}
                    autoPlay
                    muted={!videoSoundOn}
                    loop
                    playsInline
                    preload="auto"
                    controlsList="nodownload noplaybackrate nofullscreen"
                    disablePictureInPicture
                    disableRemotePlayback
                    onContextMenu={(event) => event.preventDefault()}
                    onLoadedData={() => { void avatarVideoRef.current?.play().catch(() => undefined); }}
                    onCanPlay={() => { void avatarVideoRef.current?.play().catch(() => undefined); }}
                    onError={() => setAvatarVideoFailed(true)}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", position: "relative", backgroundImage: `url(${heygenBrandAvatarPosterUrl})`, backgroundSize: "cover", backgroundPosition: "center top" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,6,23,.08), rgba(2,6,23,.28))" }} />
                  </div>
                )}
                {isDirectPreviewUrl(activeAvatarUrl) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextSoundState = !videoSoundOn;
                      setVideoSoundOn(nextSoundState);
                      window.setTimeout(() => {
                        if (!avatarVideoRef.current) return;
                        avatarVideoRef.current.muted = !nextSoundState;
                        if (nextSoundState) {
                          avatarVideoRef.current.currentTime = 0;
                          void avatarVideoRef.current.play().catch(() => undefined);
                        }
                      }, 0);
                    }}
                    style={{ position: "absolute", right: 14, bottom: 14, borderRadius: 999, border: "1px solid rgba(255,255,255,.2)", background: videoSoundOn ? "rgba(34,197,94,.32)" : "rgba(0,0,0,.48)", color: "#fff", padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 900, backdropFilter: "blur(10px)" }}
                  >
                    {videoSoundOn ? "Ses açık" : "Ses aç"}
                  </button>
                ) : null}
              </div>
            ) : (
                <div style={{ minHeight: 220, padding: 16, display: "grid", gap: 10, alignContent: "space-between", background: "radial-gradient(circle at 30% 18%, rgba(34,211,238,.18), transparent 28%), radial-gradient(circle at 78% 20%, rgba(167,139,250,.16), transparent 24%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96))" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <span className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
                      Canlı demo
                    </span>
                    <span style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.76)", padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Volume2 size={14} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Video sesi</span>
                    </span>
                  </div>
                  <div style={{ display: "grid", placeItems: "center", minHeight: 130, textAlign: "center", gap: 8 }}>
                    <div style={{ width: 78, height: 78, borderRadius: 28, background: "radial-gradient(circle at 30% 30%, rgba(34,211,238,.84), rgba(124,58,237,.72) 52%, rgba(15,23,42,.98) 100%)", border: "1px solid rgba(255,255,255,.18)", display: "grid", placeItems: "center", boxShadow: "0 18px 38px rgba(0,0,0,.28)", animation: "pulse 2.2s ease-in-out infinite" }}>
                      <Sparkles size={28} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 18 }}>7/24 Canlı Satış Avatarı</strong>
                      <p style={{ margin: 0, color: "rgba(226,232,240,.76)", fontSize: 13, lineHeight: 1.45 }}>Crelavo hakkında konuşan, ürün ve hizmet sorularını cevaplayan canlı avatar demo görünümü.</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", color: "#cbd5e1", fontSize: 12 }}>
                    <span>Kategoriler</span>
                    <span>Krediler</span>
                    <span>Kampanyalar</span>
                  </div>
                </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 50, height: 50, borderRadius: 999, background: "radial-gradient(circle at 30% 30%, rgba(34,211,238,.84), rgba(124,58,237,.72) 52%, rgba(15,23,42,.98) 100%)", border: "1px solid rgba(255,255,255,.18)", display: "grid", placeItems: "center" }}>
                <Sparkles size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: 14 }}>Canlı avatar sohbeti</strong>
                <small style={{ color: "#bae6fd", fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase" }}>{status}</small>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setChatOpen((current) => !current)}
                style={{ borderRadius: 999, border: "1px solid rgba(125,211,252,.34)", background: chatOpen ? "rgba(59,130,246,.22)" : "rgba(125,211,252,.12)", color: "#fff", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 900, boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}
              >
                {chatOpen ? "Sohbeti gizle" : "Canlı avatara sor"}
              </button>
              <span style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.76)", padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
                <Volume2 size={14} />
                AI cevap
              </span>
            </div>
          </div>

          {chatOpen ? <div ref={chatRef} style={{ maxHeight: 150, overflow: "auto", display: "grid", gap: 10, paddingRight: 2 }}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  marginLeft: message.role === "user" ? "auto" : 0,
                  maxWidth: "88%",
                  borderRadius: 16,
                  padding: "10px 12px",
                  background: message.role === "user" ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "rgba(255,255,255,.08)",
                  color: "#fff",
                  lineHeight: 1.45,
                  fontSize: 13,
                  whiteSpace: "pre-wrap"
                }}
              >
                {message.content}
              </div>
            ))}
              {loading ? (
                <div style={{ maxWidth: "88%", borderRadius: 16, padding: "10px 12px", background: "rgba(255,255,255,.08)", color: "#fff", lineHeight: 1.45, fontSize: 13 }}>
                  Avatar is thinking...
                </div>
              ) : null}
            </div> : null}

            <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void sendMessage();
            }}
            style={{ display: "grid", gap: 8, marginTop: 12 }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Kategori, kredi, kampanya, fiyat, üretim veya genel sorunuzu yazın..."
              rows={3}
              style={{ width: "100%", resize: "none", borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.05)", color: "#fff", padding: "10px 12px", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="primary-button"
                type="submit"
                style={{ flex: 1, minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px" }}
                disabled={loading}
              >
                <Send size={16} />
                {loading ? "Gönderiliyor..." : "Avatarla konuş"}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  );
}
