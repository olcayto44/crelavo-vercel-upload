"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORE_KEY = "crelavo-aw-last-v2";
const GOLD = "#d7b07a";
const BG = "#0b0a09";
const INK = "#f4eee6";

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

type SceneStatus = "queued" | "rendering" | "ready" | "revising";
type Scene = { id: string; index: number; headline: string; sub: string; status: SceneStatus };
type WorkResponse = {
  error?: string;
  message?: string;
  scenes?: Array<{ id?: string; index?: number; status?: string; title?: string; headline?: string; direction?: string; prompt?: string; sub?: string }>;
  result?: { scenes?: WorkResponse["scenes"] };
};

const INITIAL_SCENES: Scene[] = [
  { id: "scene-1", index: 1, headline: "Wide on the street at dusk", sub: "Storefront lights warm up.", status: "ready" },
  { id: "scene-2", index: 2, headline: "Storefront at dusk, ceramic mug in warm tungsten", sub: "Slow push-in. Hands enter frame. Steam rises.", status: "revising" },
  { id: "scene-3", index: 3, headline: "Hands enter frame", sub: "Steam rises. Keep the tungsten.", status: "rendering" },
  { id: "scene-4", index: 4, headline: "Hold on the mark", sub: "Soft fade. End on the mug.", status: "queued" },
];

function statusLabel(status: SceneStatus) {
  if (status === "ready") return "READY";
  if (status === "revising") return "REVISING";
  if (status === "rendering") return "IN PROGRESS";
  return "QUEUED";
}

function normalizeScenes(raw: WorkResponse["scenes"], fallback: Scene[]): Scene[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.slice(0, 4).map((item, i) => {
    const statusRaw = String(item.status || "");
    const status: SceneStatus = statusRaw === "queued" || statusRaw === "rendering" || statusRaw === "ready" || statusRaw === "revising" ? statusRaw : fallback[i]?.status || "ready";
    return {
      id: String(item.id || `scene-${i + 1}`),
      index: Number(item.index || i + 1),
      headline: item.headline || item.title || item.direction || fallback[i]?.headline || `Scene ${i + 1}`,
      sub: item.sub || item.prompt || fallback[i]?.sub || "",
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

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "AI Video";
  const category = searchParams.get("category") || "video";
  const [draft, setDraft] = useState("");
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [selectedId, setSelectedId] = useState("scene-2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    window.onbeforeunload = null;
  }, []);

  const selected = useMemo(() => scenes.find((scene) => scene.id === selectedId) || scenes[1] || scenes[0], [scenes, selectedId]);

  async function onSend() {
    const text = draft.trim();
    if (!text || busy || !selected) return;
    setBusy(true);
    setError(null);
    setScenes((prev) => prev.map((scene) => scene.id === selected.id ? { ...scene, status: "revising" } : scene));
    try {
      const data = await postWork({ action: "revise", brief: text, prompt: text, instruction: text, scene_id: selected.id, sceneId: selected.id, index: selected.index, type, category });
      const updated = normalizeScenes(data.scenes || data.result?.scenes, scenes);
      if (updated) setScenes(updated);
      else setScenes((prev) => prev.map((scene) => scene.id === selected.id ? { ...scene, headline: text, sub: "Revised in place. Production continues.", status: "ready" } : scene));
      setDraft("");
    } catch (err) {
      setScenes((prev) => prev.map((scene) => scene.id === selected.id ? { ...scene, headline: text, sub: "Revised in place. Production continues.", status: "ready" } : scene));
      setDraft("");
      setError(err instanceof Error ? err.message : null);
    } finally {
      setBusy(false);
    }
  }

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

        <div style={{ aspectRatio: "16 / 9", background: "#120e0a", border: `1px solid ${GOLD}`, position: "relative", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "#000" }} />
          <div style={{ position: "absolute", inset: "26px 0", background: "linear-gradient(135deg,#3a2414 0%,#1a120c 42%,#6a3a1c 100%)" }} />
          <div style={{ position: "absolute", left: 28, top: 42, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.24em", color: GOLD }}>SCENE {String(selected?.index || 2).padStart(2, "0")} ? SELECTED</div>
          <div style={{ position: "absolute", left: 28, right: 28, top: 88 }}>
            <div style={{ fontSize: 30, lineHeight: 1.15 }}>{selected?.headline}</div>
            <div style={{ marginTop: 8, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 12, color: "#cbb9a4" }}>{selected?.sub}</div>
            {error ? <div style={{ marginTop: 10, color: "#e8b4b4", fontSize: 14 }}>{error}</div> : null}
          </div>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 36, background: "rgba(11,10,9,0.88)", border: "1px solid rgba(215,176,122,0.35)", padding: "12px 14px" }}>
            <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.2em", color: GOLD, marginBottom: 6 }}>REVISE THIS SCENE ? PRODUCTION CONTINUES</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 16, color: draft.trim() ? INK : "#7d746a" }}>{draft.trim() || "Warmer tungsten. Slower push-in. Less steam."}</div>
              <button type="button" onClick={onSend} disabled={busy || !draft.trim()} style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 11, letterSpacing: "0.14em", background: GOLD, color: "#1a140c", padding: "8px 14px", fontWeight: 700, border: 0, cursor: busy ? "wait" : "pointer" }}>APPLY</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {scenes.map((item) => {
            const active = item.id === selected?.id;
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} style={{ flex: 1, textAlign: "left", background: active ? "#1a140c" : "#161310", border: active ? `1px solid ${GOLD}` : item.status === "queued" ? "1px dashed rgba(215,176,122,0.16)" : "1px solid rgba(244,238,230,0.12)", padding: 8, color: INK, cursor: "pointer", opacity: item.status === "queued" ? 0.7 : 1 }}>
                <div style={{ height: 52, background: item.status === "rendering" || item.status === "queued" ? "#0f0d0b" : "linear-gradient(135deg,#3a2414,#6a3a1c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 9, letterSpacing: "0.18em", color: GOLD }}>{item.status === "rendering" ? "RENDERING" : ""}</div>
                <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 9, letterSpacing: "0.16em", color: active ? GOLD : "#b9aea0", marginTop: 6 }}>{String(item.index).padStart(2, "0")} ? {statusLabel(item.status)}</div>
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#8a7f72", textAlign: "center", marginBottom: 22 }}>CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB</div>

        <div style={{ background: "#14110e", border: "1px solid rgba(215,176,122,0.2)", padding: "16px 18px" }}>
          <div style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: GOLD, marginBottom: 8 }}>DIRECT THE SELECTED SCENE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void onSend(); } }} placeholder="Make this part like this?" disabled={busy} style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: INK, fontSize: 18, fontFamily: "Georgia, Palatino, serif" }} />
            <button type="button" onClick={onSend} disabled={busy || !draft.trim()} style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 12, letterSpacing: "0.16em", background: GOLD, color: "#1a140c", padding: "10px 16px", fontWeight: 700, border: 0, cursor: busy ? "wait" : "pointer" }}>{busy ? "WORKING" : "SEND"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
