"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const hiddenPrefixes = ["/admin", "/api", "/auth", "/checkout", "/dashboard/assistant-workspace"];
const defaultAgentId = process.env.NEXT_PUBLIC_LIVE_SALES_AGENT_ID || "agent_demo_live_sales_001";
const publicAgentEndpoint = "/api/live-sales-agents";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type PublicAgent = {
  agent_id?: string;
  availability?: string | null;
  metadata?: { avatarPreview?: { previewUrl?: string | null } } | null;
};

type AvatarVideo = {
  provider?: string | null;
  model?: string | null;
  status?: string | null;
  task_id?: string | null;
  request_id?: string | null;
  next?: string | null;
  error?: string | null;
  prompt?: string | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function canShow(pathname: string | null) {
  const path = pathname || "/";
  return !hiddenPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function browserSpeechLang() {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.languages?.[0] || navigator.language || "en-US";
}

function firstHttpsUrl(value: unknown): string {
  if (typeof value === "string") {
    const direct = value.trim();
    if (/^https?:\/\//i.test(direct)) return direct;
    return direct.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHttpsUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["captioned_video_url", "captionedVideoUrl", "video_url", "videoUrl", "download_url", "downloadUrl", "preview_url", "previewUrl", "url", "src", "file", "files", "output", "result", "data", "thumbnail_url", "thumbnailUrl"]) {
      const found = firstHttpsUrl(record[key]);
      if (found) return found;
    }
  }
  return "";
}

export function PreviewSupportBox() {
  const pathname = usePathname();
  const allowed = useMemo(() => canShow(pathname), [pathname]);
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("LIVE · always active");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I’m Crelavo’s 24/7 live sales avatar. Ask about categories, credits, campaigns, pricing logic, production flows, websites, apps, video, ecommerce, or any general AI question. I’ll reply in the same language you use."
    }
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const [avatarVideoFailed, setAvatarVideoFailed] = useState(false);
  const [listening, setListening] = useState(false);
  const [avatarVideo, setAvatarVideo] = useState<AvatarVideo | null>(null);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [avatarVideoLoading, setAvatarVideoLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const avatarVideoRef = useRef<HTMLVideoElement | null>(null);
  const avatarPollRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sessionIdRef = useRef<string>("");
  const agentId = defaultAgentId;

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, open, chatOpen]);

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
        setStatus(agent.availability ? `LIVE · ${agent.availability}` : "LIVE · always active");
      } catch {
        setStatus("LIVE · always active");
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

  useEffect(() => {
    setAvatarVideoFailed(false);
  }, [avatarVideoUrl]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      if (avatarPollRef.current) window.clearInterval(avatarPollRef.current);
    };
  }, []);

  if (!allowed) return null;

  function ensureSessionId() {
    if (!sessionIdRef.current) sessionIdRef.current = crypto.randomUUID();
    return sessionIdRef.current;
  }

  function clearAvatarPolling() {
    if (avatarPollRef.current) {
      window.clearInterval(avatarPollRef.current);
      avatarPollRef.current = null;
    }
  }

function setAvatarState(next: AvatarVideo | null, nextUrl = "") {
  setAvatarVideo(next);
  setAvatarVideoUrl(nextUrl);
}

  async function pollAvatarTask(taskUrl: string) {
    try {
      const response = await fetch(taskUrl, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      const result = data?.result ?? data;
      const task = result?.task ?? result?.data?.task ?? result?.data ?? result;
      const statusValue = String(task?.status || task?.state || data?.status || "").toLowerCase();
      const videoUrl = firstHttpsUrl(task) || firstHttpsUrl(result) || firstHttpsUrl(data);
      if (videoUrl) {
        clearAvatarPolling();
        setAvatarState({ ...avatarVideo, status: statusValue || "succeeded" }, videoUrl);
        setStatus("LIVE · avatar speaking");
        return;
      }
      if (/failed|cancelled|canceled/.test(statusValue)) {
        clearAvatarPolling();
        setStatus("LIVE · avatar generation failed");
      }
    } catch {
      // keep polling if the task endpoint is temporarily unavailable
    }
  }

  async function sendMessage(rawInput?: string) {
    const message = String(rawInput ?? input).trim();
    if (!message || loading) return;

    setInput("");
    setChatOpen(true);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    setAvatarVideoLoading(true);
    setAvatarVideoUrl("");
    clearAvatarPolling();
    setStatus("LIVE · thinking");

    const fallback = "The Crelavo live sales avatar is ready. Ask in any language about categories, credits, campaigns, production, websites, apps, video, or general AI questions.";

    try {
      const response = await fetch("/api/live-sales-agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          message,
          session_id: ensureSessionId(),
          avatar_video: true
        })
      });
      const data = await response.json().catch(() => ({}));
      const reply = String(data.reply || data.error || fallback).trim() || fallback;
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setStatus(String(data.agent?.availability ? `LIVE · ${data.agent.availability}` : "LIVE · always active"));

      const avatarVideoResult = data.avatar_video as AvatarVideo | null | undefined;
      if (avatarVideoResult?.status === "submitted" && avatarVideoResult.next) {
        setAvatarState(avatarVideoResult, "");
        clearAvatarPolling();
        avatarPollRef.current = window.setInterval(() => {
          void pollAvatarTask(avatarVideoResult.next as string);
        }, 3500);
        void pollAvatarTask(avatarVideoResult.next);
        setAvatarVideoLoading(true);
      } else {
        setAvatarVideoLoading(false);
      }
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: fallback }]);
      setStatus("LIVE · offline fallback");
      setAvatarVideoLoading(false);
    } finally {
      setLoading(false);
    }
  }

  function toggleSpeechInput() {
    if (typeof window === "undefined") return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setInput((current) => current || "Voice input is not supported in this browser. Please type your message.");
      setChatOpen(true);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = browserSpeechLang();
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) {
        setInput(transcript);
        void sendMessage(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setChatOpen(true);
    setListening(true);
    recognition.start();
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
              <h3 style={{ margin: "0 0 4px", fontSize: 16, lineHeight: 1.1 }}>24/7 Crelavo Live Sales Avatar</h3>
              <p style={{ margin: 0, color: "rgba(226,232,240,.76)", fontSize: 12, lineHeight: 1.45 }}>Ask about categories, credits, campaigns, production flows, or general AI questions.</p>
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
            <div style={{ position: "relative", aspectRatio: "4 / 5", width: "100%", minHeight: 210, background: "radial-gradient(circle at 50% 18%, rgba(56,189,248,.18), transparent 28%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.98))" }}>
              {avatarVideoUrl && !avatarVideoFailed ? (
                <video
                  ref={avatarVideoRef}
                  key={avatarVideoUrl}
                  src={avatarVideoUrl}
                  autoPlay
                  muted={false}
                  loop={false}
                  playsInline
                  preload="auto"
                  controlsList="nodownload noplaybackrate nofullscreen"
                  disablePictureInPicture
                  disableRemotePlayback
                  onContextMenu={(event) => event.preventDefault()}
          onLoadedData={() => { setAvatarVideoLoading(false); void avatarVideoRef.current?.play().catch(() => undefined); }}
          onCanPlay={() => { setAvatarVideoLoading(false); void avatarVideoRef.current?.play().catch(() => undefined); }}
          onEnded={() => {
            setAvatarVideoLoading(false);
            setAvatarVideoUrl("");
            clearAvatarPolling();
          }}
          onError={() => { setAvatarVideoLoading(false); setAvatarVideoFailed(true); }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", position: "relative", background: "radial-gradient(circle at 50% 18%, rgba(56,189,248,.24), transparent 26%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.98))", animation: avatarVideoLoading ? "avatarFloat 2.8s ease-in-out infinite" : "none", transformOrigin: "center bottom", display: "grid", placeItems: "center" }}>
                  <div style={{ display: "grid", justifyItems: "center", gap: 10, textAlign: "center", padding: 18 }}>
                    <div style={{ width: 84, height: 84, borderRadius: 28, background: "radial-gradient(circle at 30% 30%, rgba(34,211,238,.84), rgba(124,58,237,.72) 52%, rgba(15,23,42,.98) 100%)", border: "1px solid rgba(255,255,255,.18)", display: "grid", placeItems: "center", boxShadow: "0 18px 38px rgba(0,0,0,.28)", animation: "avatarPulse 2.2s ease-in-out infinite" }}>
                      <Sparkles size={28} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 18 }}>{avatarVideoLoading ? "MiniMax avatar preparing" : "Live avatar ready"}</strong>
                      <p style={{ margin: 0, color: "rgba(226,232,240,.76)", fontSize: 13, lineHeight: 1.45 }}>{avatarVideoLoading ? "The avatar is generating a spoken response video now." : "Ask a question and the avatar will speak the answer with motion."}</p>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 9%, rgba(125,211,252,.24), transparent 34%), linear-gradient(180deg, transparent 58%, rgba(2,6,23,.52))", animation: "avatarGlow 2.8s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: 14, bottom: 14, display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, border: "1px solid rgba(34,197,94,.32)", background: "rgba(2,6,23,.54)", color: "#dcfce7", padding: "8px 11px", fontSize: 12, fontWeight: 900, backdropFilter: "blur(10px)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 6px rgba(34,197,94,.14)", animation: "liveDot 1.4s ease-in-out infinite" }} />
                Live avatar
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setChatOpen((current) => !current)}
              style={{ borderRadius: 999, border: "1px solid rgba(125,211,252,.34)", background: chatOpen ? "rgba(59,130,246,.22)" : "rgba(125,211,252,.12)", color: "#fff", padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 900 }}
            >
              {chatOpen ? "Hide chat" : "Chat"}
            </button>
          </div>

          {chatOpen ? <div ref={chatRef} style={{ maxHeight: 150, overflow: "auto", display: "grid", gap: 10, paddingRight: 2, marginBottom: 10 }}>
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
              placeholder="Type or speak in any language..."
              rows={3}
              style={{ width: "100%", resize: "none", borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.05)", color: "#fff", padding: "10px 12px", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={toggleSpeechInput}
                style={{ width: 48, borderRadius: 14, border: listening ? "1px solid rgba(34,197,94,.55)" : "1px solid rgba(255,255,255,.14)", background: listening ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.08)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
              >
                <Mic size={17} />
              </button>
              <button
                className="primary-button"
                type="submit"
                style={{ flex: 1, minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px" }}
                disabled={loading}
              >
                <Send size={16} />
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>


        </div>
      </div>
      <style jsx>{`
        @keyframes avatarGlow {
          0%, 100% { opacity: .64; }
          50% { opacity: 1; }
        }
        @keyframes avatarFloat {
          0%, 100% { transform: scale(1.015) translateY(0); }
          50% { transform: scale(1.045) translateY(-4px); }
        }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,.18); }
          50% { box-shadow: 0 0 0 10px rgba(34,211,238,0); }
        }
        @keyframes liveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(.72); opacity: .58; }
        }
      `}</style>
    </div>
  );
}
