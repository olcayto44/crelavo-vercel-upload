"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORE_KEY = "crelavo-aw-last-v2";
const GOLD = "#d7b07a";
const BG = "#0b0a09";
const INK = "#f4eee6";

type SceneStatus = "queued" | "rendering" | "ready" | "revising";
type Scene = { id: string; index: number; title: string; direction: string; status: SceneStatus };
type WorkResponse = {
  error?: string;
  message?: string;
  scenes?: Array<{ id?: string; index?: number; status?: string; title?: string; direction?: string; prompt?: string }>;
  result?: { scenes?: WorkResponse["scenes"] };
};

export function CinemaRouteGuard() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    window.onbeforeunload = null;
    const block = (event: BeforeUnloadEvent) => {
      event.stopImmediatePropagation();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", block, true);
    const htmlBg = document.documentElement.style.background;
    const bodyBg = document.body.style.background;
    const overflow = document.body.style.overflow;
    document.documentElement.style.background = BG;
    document.body.style.background = BG;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("beforeunload", block, true);
      document.documentElement.style.background = htmlBg;
      document.body.style.background = bodyBg;
      document.body.style.overflow = overflow;
    };
  }, []);
  return null;
}

function stubScenes(brief: string): Scene[] {
  const line = brief.trim() || "Untitled film";
  return [
    { id: "scene-1", index: 1, title: "Open", direction: `${line}. Establishing wide at dusk.`, status: "ready" },
    { id: "scene-2", index: 2, title: "Hero", direction: `${line}. Product in warm tungsten. Slow push-in.`, status: "ready" },
    { id: "scene-3", index: 3, title: "Detail", direction: `${line}. Hands enter frame. Steam rises.`, status: "rendering" },
    { id: "scene-4", index: 4, title: "Close", direction: `${line}. Hold on the mark. Soft fade.`, status: "queued" },
  ];
}

function normalizeScenes(raw: WorkResponse["scenes"], brief: string): Scene[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.slice(0, 4).map((item, i) => {
    const statusRaw = String(item.status || "");
    const status: SceneStatus = statusRaw === "queued" || statusRaw === "rendering" || statusRaw === "ready" || statusRaw === "revising"
      ? statusRaw
      : i === 2 ? "rendering" : i === 3 ? "queued" : "ready";
    return {
      id: String(item.id || `scene-${i + 1}`),
      index: Number(item.index || i + 1),
      title: item.title || `Scene ${String(i + 1).padStart(2, "0")}`,
      direction: item.direction || item.prompt || brief,
      status,
    };
  });
}

async function postWork(payload: Record<string, unknown>): Promise<WorkResponse> {
  const res = await fetch("/api/assistant-work", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as WorkResponse;
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

function statusLabel(status: SceneStatus) {
  if (status === "ready") return "READY";
  if (status === "revising") return "REVISING";
  if (status === "rendering") return "IN PROGRESS";
  return "QUEUED";
}

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "AI Video";
  const category = searchParams.get("category") || "video";
  const [draft, setDraft] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobBrief, setJobBrief] = useState("");

  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    window.onbeforeunload = null;
  }, []);

  const selected = useMemo(() => scenes.find((scene) => scene.id === selectedId) || null, [scenes, selectedId]);
  const shown = selected || scenes.find((scene) => scene.status === "revising") || scenes.find((scene) => scene.status === "rendering") || scenes[0] || null;

  async function onSend() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (scenes.length === 0) {
        const data = await postWork({ action: "produce", brief: text, prompt: text, type, category });
        const next = normalizeScenes(data.scenes || data.result?.scenes, text) || stubScenes(text);
        setJobBrief(text);
        setScenes(next);
        setSelectedId(next[1]?.id || next[0]?.id || null);
        setDraft("");
        return;
      }
      const target = selected || shown;
      if (!target) return;
      setScenes((prev) => prev.map((scene) => scene.id === target.id ? { ...scene, status: "revising" } : scene));
      const data = await postWork({ action: "revise", brief: text, prompt: text, instruction: text, scene_id: target.id, sceneId: target.id, index: target.index, type, category });
      const updated = normalizeScenes(data.scenes || data.result?.scenes, jobBrief || text);
      if (updated) setScenes(updated);
      else setScenes((prev) => prev.map((scene) => scene.id === target.id ? { ...scene, direction: text, status: "ready" } : scene));
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Production could not start.");
    } finally {
      setBusy(false);
    }
  }

  const empty = scenes.length === 0;
  const composerLabel = empty ? "DESCRIBE THE FILM" : "DIRECT THE SELECTED SCENE";
  const composerPlaceholder = empty ? "A 15s product film for a ceramic mug at dusk?" : "Make this part like this?";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: BG, color: INK, fontFamily: "Georgia, 'Iowan Old Style', Palatino, serif", overflow: "auto" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "22px 28px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ letterSpacing: "0.42em", fontSize: 11, color: GOLD, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>CRELAVO</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(215,176,122,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 10, letterSpacing: "0.18em", color: GOLD }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e23d3d", display: "inline-block" }} />LIVE
            </span>
            <a href="/pricing" style={{ borderRadius: 999, padding: "6px 12px", fontSize: 11, background: GOLD, color: "#1a140c", fontWeight: 600, textDecoration: "none" }}>Pro $9.99/mo</a>
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(215,176,122,0.45), transparent)", marginBottom: 28 }} />

        <div style={{ aspectRatio: "16 / 9", background: empty ? "#050403" : "#120e0a", border: empty ? "1px solid rgba(215,176,122,0.22)" : `1px solid ${GOLD}`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "#000" }} />
          {empty ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(215,176,122,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <div style={{ width: 0, height: 0, borderLeft: "14px solid #d7b07a", borderTop: "9px solid transparent", borderBottom: "9px solid transparent", marginLeft: 4 }} />
              </div>
              <div style={{ fontSize: 28 }}>The stage is empty</div>
              <div style={{ marginTop: 8, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 13, color: "#b9aea0" }}>Send a brief. Production starts on send, not on download.</div>
              {error ? <div style={{ marginTop: 12, color: "#e8b4b4", fontSize: 14 }}>{error}</div> : null}
            </div>
          ) : (
            <>
              <div style={{ position: "absolute", inset: "26px 0", background: "linear-gradient(135deg,#3a2414 0%,#1a120c 42%,#6a3a1c 100%)" }} />
              <div style={{ position: "absolute", left: 28, top: 42, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.24em", color: GOLD }}>SCENE {String(shown?.index || 1).padStart(2, "0")} ? SELECTED</div>
              <div style={{ position: "absolute", left: 28, right: 28, top: 88 }}>
                <div style={{ fontSize: 30, lineHeight: 1.15 }}>{shown?.direction}</div>
                <div style={{ marginTop: 8, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 12, color: "#cbb9a4" }}>{shown?.title}. Click another scene to revise it without restarting.</div>
                {error ? <div style={{ marginTop: 10, color: "#e8b4b4", fontSize: 14 }}>{error}</div> : null}
              </div>
              <div style={{ position: "absolute", left: 20, right: 20, bottom: 36, background: "rgba(11,10,9,0.88)", border: "1px solid rgba(215,176,122,0.35)", padding: "12px 14px" }}>
                <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.2em", color: GOLD, marginBottom: 6 }}>REVISE THIS SCENE ? PRODUCTION CONTINUES</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 16, color: draft.trim() ? INK : "#7d746a" }}>{draft.trim() || "Warmer tungsten. Slower push-in. Less steam."}</div>
                  <button type="button" onClick={onSend} disabled={busy || !draft.trim()} style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 11, letterSpacing: "0.14em", background: GOLD, color: "#1a140c", padding: "8px 14px", fontWeight: 700, border: 0, cursor: busy ? "wait" : "pointer" }}>APPLY</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {(empty ? [0, 1, 2, 3] : scenes).map((item) => {
            if (typeof item === "number") return <div key={item} style={{ flex: 1, height: 72, background: "#161310", border: "1px dashed rgba(215,176,122,0.18)" }} />;
            const active = item.id === (selected?.id || shown?.id);
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} style={{ flex: 1, textAlign: "left", background: active ? "#1a140c" : "#161310", border: active ? `1px solid ${GOLD}` : "1px solid rgba(244,238,230,0.12)", padding: 8, color: INK, cursor: "pointer", opacity: item.status === "queued" ? 0.7 : 1 }}>
                <div style={{ height: 52, background: item.status === "rendering" ? "#0f0d0b" : "linear-gradient(135deg,#3a2414,#6a3a1c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 9, letterSpacing: "0.18em", color: GOLD }}>{item.status === "rendering" ? "RENDERING" : ""}</div>
                <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 9, letterSpacing: "0.16em", color: active ? GOLD : "#b9aea0", marginTop: 6 }}>{String(item.index).padStart(2, "0")} ? {statusLabel(item.status)}</div>
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#8a7f72", textAlign: "center", marginBottom: 22 }}>{empty ? "TIMELINE ? SCENES APPEAR HERE" : "CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB"}</div>

        <div style={{ background: "#14110e", border: "1px solid rgba(215,176,122,0.2)", padding: "16px 18px" }}>
          <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: GOLD, marginBottom: 8 }}>{composerLabel}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void onSend(); } }} placeholder={composerPlaceholder} disabled={busy} style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: INK, fontSize: 18, fontFamily: "Georgia, Palatino, serif" }} />
            <button type="button" onClick={onSend} disabled={busy || !draft.trim()} style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 12, letterSpacing: "0.16em", background: GOLD, color: "#1a140c", padding: "10px 16px", fontWeight: 700, border: 0, cursor: busy ? "wait" : "pointer" }}>{busy ? "WORKING" : "SEND"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
