"use client";

import { useEffect, useRef, useState } from "react";
import { LiveAvatarSession, SessionEvent } from "@heygen/liveavatar-web-sdk";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type Props = {
  agentId: string;
  language?: string;
};

export function LiveAvatarPanel({ agentId, language = "en" }: Props) {
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Önizleme hazır");
  const [message, setMessage] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => () => {
    void sessionRef.current?.stop();
  }, []);

  async function startPreview() {
    if (busy || started) return;
    setBusy(true);
    setMessage("");
    setStatus("Oturum hazırlanıyor...");
    try {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) throw new Error(auth.message);
      const response = await fetch("/api/live-sales-agents/liveavatar/session", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({ user_id: auth.user.id, agent_id: agentId, language })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error || "Canlı avatar önizlemesi başlatılamadı."));

      const liveSession = new LiveAvatarSession(String(data.session_token), { voiceChat: true });
      sessionRef.current = liveSession;
      liveSession.on(SessionEvent.SESSION_STATE_CHANGED, (value) => setStatus(String(value)));
      liveSession.on(SessionEvent.SESSION_STREAM_READY, () => {
        setStatus("Canlı önizleme hazır");
        setStarted(true);
        if (videoRef.current) void liveSession.attach(videoRef.current);
      });
      await liveSession.start();
      setStarted(true);
      if (videoRef.current) void liveSession.attach(videoRef.current);
      setStatus("Canlı önizleme bağlandı");
    } catch (error) {
      sessionRef.current = null;
      setStarted(false);
      setStatus("Önizleme başlatılamadı");
      setMessage(error instanceof Error ? error.message : "Canlı avatar önizlemesi başlatılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function stopPreview() {
    try {
      await sessionRef.current?.stop();
    } finally {
      sessionRef.current = null;
      setStarted(false);
      setVoiceActive(false);
      setStatus("Önizleme durduruldu");
    }
  }

  async function sendText() {
    const text = input.trim();
    if (!text || !sessionRef.current) return;
    try {
      await sessionRef.current.message(text);
      setInput("");
      setMessage("Mesaj canlı avatara gönderildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mesaj gönderilemedi.");
    }
  }

  async function toggleVoice() {
    if (!sessionRef.current) return;
    try {
      if (voiceActive) {
        await sessionRef.current.voiceChat.stop();
        setVoiceActive(false);
        setStatus("Canlı önizleme açık, mikrofon kapalı");
      } else {
        await sessionRef.current.voiceChat.start();
        setVoiceActive(true);
        setStatus("Canlı önizleme açık, mikrofon aktif");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mikrofon başlatılamadı.");
    }
  }

  return (
    <div className="live-sales-avatar-video-frame" style={{ display: "grid", gap: 10 }}>
      <video ref={videoRef} autoPlay playsInline className="live-sales-avatar-video" style={{ background: "#07111f" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 10px" }}>
        {!started ? (
          <button className="btn" type="button" onClick={startPreview} disabled={busy}>
            {busy ? "Hazırlanıyor..." : "Canlı avatar önizlemesini başlat"}
          </button>
        ) : (
          <>
            <button className="btn secondary" type="button" onClick={toggleVoice}>{voiceActive ? "Mikrofonu kapat" : "Mikrofonu aç"}</button>
            <button className="btn secondary" type="button" onClick={stopPreview}>Önizlemeyi kapat</button>
          </>
        )}
      </div>
      {started ? (
        <div style={{ display: "flex", gap: 8, padding: "0 10px 10px" }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendText(); }} placeholder="Canlı avatara test mesajı yazın" />
          <button className="btn" type="button" onClick={sendText}>Gönder</button>
        </div>
      ) : null}
      <small style={{ padding: "0 10px 10px", color: "var(--muted)" }}>Durum: {status}</small>
      {message ? <small style={{ padding: "0 10px 10px", color: "var(--muted)" }}>{message}</small> : null}
    </div>
  );
}
