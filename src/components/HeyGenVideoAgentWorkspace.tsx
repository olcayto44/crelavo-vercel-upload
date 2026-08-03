"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Clapperboard, FileText, Loader2, PlayCircle, Send, Sparkles, Video } from "lucide-react";

type AgentArtifact = {
  id: string;
  providerResourceId?: string;
  type?: string;
  title?: string;
  status?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  description?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function collectArtifacts(payload: unknown): AgentArtifact[] {
  const seen = new Map<string, AgentArtifact>();
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(walk);
    const record = value as Record<string, unknown>;
    const id = String(record.resource_id ?? record.resourceId ?? record.video_id ?? record.videoId ?? record.asset_id ?? record.assetId ?? record.id ?? "").trim();
    const previewUrl = String(record.previewUrl ?? record.preview_url ?? record.video_url ?? record.videoUrl ?? record.captioned_video_url ?? record.captionedVideoUrl ?? record.url ?? "").trim();
    const thumbnailUrl = String(record.thumbnailUrl ?? record.thumbnail_url ?? record.coverUrl ?? record.cover_url ?? "").trim();
    const signal = `${id} ${String(record.type ?? record.kind ?? record.resource_type ?? "")} ${previewUrl}`.toLowerCase();
    const looksLikeArtifact = id && (/^(video|image|draft|audio|asset|resource)_/i.test(id) || /^https?:\/\//i.test(previewUrl) || /^https?:\/\//i.test(thumbnailUrl));
    if (looksLikeArtifact) {
      const type = /video|\.mp4|\.mov|\.webm/.test(signal) ? "video" : /image|\.png|\.jpe?g|\.webp/.test(signal) ? "image" : /draft|blueprint|plan|storyboard/.test(signal) ? "blueprint" : "artifact";
      seen.set(id, {
        id,
        providerResourceId: id,
        type,
        title: String(record.title ?? record.name ?? (type === "video" ? "Generated video" : type === "blueprint" ? "Blueprint" : "Agent artifact")),
        status: String(record.status ?? record.state ?? "available"),
        previewUrl: /^https?:\/\//i.test(previewUrl) ? previewUrl : undefined,
        thumbnailUrl: /^https?:\/\//i.test(thumbnailUrl) ? thumbnailUrl : undefined,
        description: String(record.description ?? record.text ?? record.content ?? "")
      });
    }
    Object.values(record).forEach(walk);
  };
  walk(payload);
  return Array.from(seen.values());
}

export function HeyGenVideoAgentWorkspace({ initialIdea = "" }: { initialIdea?: string }) {
  const [input, setInput] = useState(initialIdea);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Crelavo Video Agent hazır. İstediğin videoyu tek prompt ile yaz; presenter, ürün reklamı, UGC veya kampanya videosu için HeyGen Video Agent session açacağım." }]);
  const [sessionId, setSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [artifacts, setArtifacts] = useState<AgentArtifact[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const latestVideo = useMemo(() => artifacts.filter((artifact) => artifact.type === "video" && artifact.previewUrl).at(-1), [artifacts]);

  async function refreshSession(id = sessionId) {
    if (!id) return;
    const response = await fetch(`/api/heygen?action=video_agent_status&session_id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "HeyGen session status alınamadı.");
    const payload = data.result ?? data;
    const root = payload?.data && typeof payload.data === "object" ? payload.data : payload;
    setSessionStatus(String(root?.status ?? root?.state ?? "tracking"));
    const nextArtifacts = collectArtifacts(payload);
    if (nextArtifacts.length) setArtifacts(nextArtifacts);
  }

  useEffect(() => {
    if (!sessionId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => refreshSession(sessionId).catch((err) => setError(err instanceof Error ? err.message : "Session polling failed.")), 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isStarting) return;
    setInput("");
    setError("");
    setIsStarting(true);
    setMessages((current) => [...current, { role: "user", content: prompt }, { role: "assistant", content: "HeyGen Video Agent session başlatılıyor. Önce blueprint/plan, ardından görsel/video artifact çıktıları sağ panelde takip edilecek." }]);
    try {
      const response = await fetch("/api/heygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "video_agent", prompt, orientation: "portrait", incognito_mode: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "HeyGen Video Agent başlatılamadı.");
      const result = data.result ?? data;
      const root = result?.data && typeof result.data === "object" ? result.data : result;
      const id = String(root?.session_id ?? root?.sessionId ?? root?.id ?? "").trim();
      if (!id) throw new Error("HeyGen session_id dönmedi.");
      setSessionId(id);
      setSessionStatus(String(root?.status ?? "generating"));
      setArtifacts(collectArtifacts(result));
      setMessages((current) => [...current, { role: "assistant", content: `Session açıldı: ${id}. Sağ panelde HeyGen artifact/resource akışı izleniyor.` }]);
      await refreshSession(id).catch(() => null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "HeyGen Video Agent hatası.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <section className="heygen-agent-workspace" style={{ maxWidth: 1240, margin: "0 auto", padding: "24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <span className="badge"><Sparkles size={14} /> HeyGen Video Agent</span>
          <h1 style={{ marginTop: 10 }}>Crelavo Video Agent</h1>
          <p style={{ maxWidth: 720 }}>Tek prompt yaz. Crelavo, HeyGen Video Agent session açar; blueprint, görsel, video ve resource artifact çıktıları sağ panelde görünür.</p>
        </div>
        <a className="btn secondary" href="/dashboard/create?advanced=1">Advanced / eski work</a>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: 18 }}>
        <main className="production-studio-panel" style={{ minHeight: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Bot size={18} />
            <strong>Video Agent chat</strong>
          </div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`} style={{ maxWidth: "92%" }}>{message.content}</div>
            ))}
          </div>
          {error ? <p className="workspace-action-note error">{error}</p> : null}
          <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: "auto" }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Örnek: Crelavo için dışarıda hareketli bir kişinin anlattığı, güçlü hook ve FOMO içeren 10 saniyelik dikey tanıtım videosu yap." style={{ minHeight: 150 }} />
            <button className="btn" type="submit" disabled={isStarting || !input.trim()}>{isStarting ? <><Loader2 size={16} className="spin" /> HeyGen başlatılıyor</> : <><Send size={16} /> HeyGen Video Agent başlat</>}</button>
          </form>
        </main>

        <aside className="production-studio-panel" style={{ minHeight: 620 }}>
          <span className="badge"><Clapperboard size={14} /> Artifacts</span>
          <h3>HeyGen üretimleri</h3>
          <p>Session, blueprint ve video resource çıktıları burada takip edilir.</p>
          <div className="studio-preview-list" style={{ marginBottom: 14 }}>
            <div><small>Session</small><strong>{sessionId || "Henüz yok"}</strong></div>
            <div><small>Status</small><strong>{sessionStatus}</strong></div>
            <div><small>Artifacts</small><strong>{artifacts.length}</strong></div>
          </div>
          {latestVideo?.previewUrl ? (
            <video src={latestVideo.previewUrl} controls playsInline style={{ width: "100%", borderRadius: 16, marginBottom: 14 }} />
          ) : (
            <div className="studio-preview-frame" style={{ marginBottom: 14 }}><Video size={32} /><strong>Video bekleniyor</strong><span>HeyGen resource geldiğinde burada oynatılır.</span></div>
          )}
          <div style={{ display: "grid", gap: 10 }}>
            {artifacts.length ? artifacts.map((artifact) => (
              <div key={artifact.id} className="studio-estimate-trust-card">
                <strong>{artifact.title || artifact.type || "Artifact"}</strong>
                <span>{artifact.type || "artifact"} · {artifact.status || "available"}</span>
                {artifact.previewUrl && artifact.type !== "video" ? <a href={artifact.previewUrl} target="_blank" rel="noreferrer">Preview aç</a> : null}
              </div>
            )) : (
              <div className="studio-estimate-trust-card"><FileText size={18} /><strong>Blueprint bekleniyor</strong><span>Prompt gönderilince HeyGen agent çıktıları burada listelenir.</span></div>
            )}
          </div>
          <a className="btn secondary" href="/dashboard/productions" style={{ marginTop: 14 }}><PlayCircle size={16} /> My productions</a>
        </aside>
      </div>
    </section>
  );
}
