"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const STORE_KEY = "crelavo-aw-last-v2";

export function CinemaRouteGuard() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    window.onbeforeunload = null;
    const htmlBg = document.documentElement.style.background;
    const bodyBg = document.body.style.background;
    const overflow = document.body.style.overflow;
    document.documentElement.style.background = "#0b0a09";
    document.body.style.background = "#0b0a09";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.background = htmlBg;
      document.body.style.background = bodyBg;
      document.body.style.overflow = overflow;
    };
  }, []);
  return null;
}

type SceneStatus = "ready" | "revising" | "rendering" | "queued";
type Scene = { id: string; status: SceneStatus; title: string; action: string; note: string };

const INITIAL: Scene[] = [
  { id: "01", status: "ready", title: "Morning tabletop, soft window light", action: "Hold. Product centered. No hands yet.", note: "" },
  { id: "02", status: "revising", title: "Storefront at dusk, ceramic mug in warm tungsten", action: "Slow push-in. Hands enter frame. Steam rises.", note: "Warmer tungsten. Slower push-in. Less steam." },
  { id: "03", status: "rendering", title: "Close-up pour, steam and glaze", action: "Macro pour. Catch the highlight on ceramic.", note: "" },
  { id: "04", status: "queued", title: "End card, quiet shelf", action: "Hold logo. Fade the room tone.", note: "" },
];

const STATUS_LABEL: Record<SceneStatus, string> = { ready: "READY", revising: "REVISING", rendering: "RENDERING", queued: "QUEUED" };

function pickBalance(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of ["balance", "credits", "credit_balance", "available"]) {
    const value = o[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  if (o.data && typeof o.data === "object") return pickBalance(o.data);
  return null;
}

export default function AssistantPage() {
  const [scenes, setScenes] = useState<Scene[]>(INITIAL);
  const [selectedId, setSelectedId] = useState("02");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsReady, setCreditsReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const creditsRef = useRef<number | null>(null);
  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[1];

  const applyCredits = useCallback((next: number | null) => {
    if (next == null) return;
    const prev = creditsRef.current;
    creditsRef.current = next;
    setCredits(next);
    if (prev != null && next < prev) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 900);
    }
  }, []);

  const readCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "balance" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      applyCredits(pickBalance(data));
    } catch {
      /* engine may be disconnected; do not spend */
    } finally {
      setCreditsReady(true);
    }
  }, [applyCredits]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
    };
  }, []);

  useEffect(() => {
    void readCredits();
    const onFocus = () => void readCredits();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [readCredits]);

  async function sendRevise() {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setNotice("");
    const applyLocal = () => {
      setScenes((prev) => prev.map((scene) => scene.id === selectedId ? { ...scene, status: "revising", note: prompt } : scene));
      setDraft("");
    };
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", sceneId: selectedId, prompt }),
      });
      const data = await res.json().catch(() => null);
      const next = pickBalance(data);
      if (next != null) applyCredits(next);
      if (data && typeof data === "object" && (data as { error?: string }).error === "insufficient") {
        setNotice("Not enough credits to run the engine.");
        setBusy(false);
        return;
      }
      applyLocal();
    } catch {
      applyLocal();
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function selectScene(id: string) {
    setSelectedId(id);
    setNavOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const creditLabel = !creditsReady ? "..." : credits == null ? "--" : String(credits);

  return (
    <div className="aw-shell">
      <style>{CSS}</style>
      <header className="aw-bar">
        <div className="aw-left">
          <Link href="/" className="aw-home">&lt; Home</Link>
          <Link href="/" className="aw-brand">CRELAVO</Link>
          <nav className="aw-desk-nav" aria-label="Studio">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/credits">Credits</Link>
            <Link href="/dashboard/productions">Productions</Link>
          </nav>
        </div>
        <div className="aw-right">
          <Link href="/dashboard/credits" className={"aw-credits" + (flash ? " drop" : "")}>CREDITS <b>{creditLabel}</b></Link>
          <span className="aw-live"><i />LIVE</span>
          <Link href="/pricing" className="aw-pro">Pro $9.99/mo</Link>
          <button type="button" className="aw-go" onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen}>Go</button>
        </div>
      </header>

      {navOpen ? (
        <div className="aw-sheet" role="dialog" aria-label="Go to">
          <Link href="/" onClick={() => setNavOpen(false)}>Home</Link>
          <Link href="/dashboard" onClick={() => setNavOpen(false)}>Dashboard</Link>
          <Link href="/dashboard/credits" onClick={() => setNavOpen(false)}>Credits</Link>
          <Link href="/dashboard/productions" onClick={() => setNavOpen(false)}>Productions</Link>
          <Link href="/pricing" onClick={() => setNavOpen(false)}>Pricing</Link>
          <button type="button" onClick={() => setNavOpen(false)}>Close</button>
        </div>
      ) : null}

      <div className="aw-stage-wrap">
        <div className="aw-stage">
          <div className="aw-meta">SCENE {selected.id} / SELECTED</div>
          <h1 className="aw-title">{selected.title}</h1>
          <p className="aw-action">{selected.action}</p>
          <div className="aw-dock">
            <div>REVISE THIS SCENE / PRODUCTION CONTINUES</div>
            {selected.note ? <p>{selected.note}</p> : null}
          </div>
        </div>
      </div>

      <div className="aw-strip">
        {scenes.map((scene) => (
          <button key={scene.id} type="button" className={"aw-thumb" + (scene.id === selectedId ? " on" : "") + (scene.status === "rendering" ? " rendering" : "") + (scene.status === "queued" ? " queued" : "")} onClick={() => selectScene(scene.id)}>
            {scene.status === "rendering" ? <span className="aw-thumb-status">RENDERING</span> : null}
            <span className="aw-cap">{scene.id} {STATUS_LABEL[scene.status]}</span>
          </button>
        ))}
      </div>

      <p className="aw-hint">CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB</p>

      <form className="aw-composer" onSubmit={(e) => { e.preventDefault(); void sendRevise(); }}>
        <label className="aw-direct" htmlFor="aw-draft">DIRECT THE SELECTED SCENE</label>
        <div className="aw-row">
          <textarea id="aw-draft" ref={inputRef} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Make this part like this?" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendRevise(); } }} />
          <button type="submit" disabled={busy || !draft.trim()}>SEND</button>
        </div>
        {notice ? <p className="aw-notice">{notice}</p> : null}
      </form>
    </div>
  );
}

const CSS = `
.aw-shell{position:fixed;inset:0;z-index:2147483001;height:100dvh;height:100svh;display:flex;flex-direction:column;background:#0b0a09;color:#f4eee6;overflow:hidden;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
.aw-bar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;padding-top:max(8px,env(safe-area-inset-top));border-bottom:1px solid #2a2118;min-height:48px}
.aw-left,.aw-right{display:flex;align-items:center;gap:10px;min-width:0}.aw-home{flex:0 0 auto;font-size:11px;letter-spacing:.08em;color:#d7b07a;text-decoration:none;border:1px solid #5a4630;border-radius:999px;padding:5px 10px}.aw-brand{font-size:11px;letter-spacing:.28em;color:#e8dcc8;text-decoration:none}.aw-desk-nav{display:flex;gap:12px}.aw-desk-nav a{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#b9aea0;text-decoration:none}
.aw-credits{display:inline-flex;align-items:center;gap:8px;border:1px solid #d7b07a;background:#1a140c;color:#f4eee6;border-radius:999px;padding:5px 11px;font-size:10px;letter-spacing:.14em;text-decoration:none}.aw-credits b{color:#d7b07a;font-weight:600;font-variant-numeric:tabular-nums}.aw-credits.drop{animation:aw-flash .85s ease}@keyframes aw-flash{0%{box-shadow:0 0 0 0 rgba(215,176,122,.55)}100%{box-shadow:0 0 0 14px rgba(215,176,122,0)}}
.aw-live{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;border:1px solid #3a2e22;border-radius:999px;padding:4px 8px;color:#e8dcc8}.aw-live i{width:6px;height:6px;border-radius:99px;background:#c04545;display:block}.aw-pro{background:#e6d3b0;color:#1a140c;border-radius:999px;padding:5px 10px;font-size:10px;font-weight:600;text-decoration:none}.aw-go{display:none;background:transparent;color:#d7b07a;border:1px solid #5a4630;border-radius:999px;padding:5px 10px;font-size:11px;letter-spacing:.12em;cursor:pointer}
.aw-sheet{position:absolute;top:48px;right:10px;z-index:3;display:flex;flex-direction:column;min-width:180px;background:#14110c;border:1px solid #3a2e22;padding:8px;gap:4px}.aw-sheet a,.aw-sheet button{color:#e8dcc8;text-decoration:none;background:transparent;border:0;text-align:left;padding:8px 10px;font-size:13px;cursor:pointer}
.aw-stage-wrap{flex:1 1 0%;min-height:0;container-type:size;position:relative;margin:8px 16px 0}.aw-stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100cqw,calc(100cqh * 16 / 9));height:min(100cqh,calc(100cqw * 9 / 16));border:1px solid #d7b07a;background:linear-gradient(180deg,#3a2414 0%,#1a100a 62%,#0d0b09 100%);overflow:hidden;display:flex;flex-direction:column;padding:14px 16px 12px}.aw-meta{flex:0 0 auto;font-size:10px;letter-spacing:.2em;color:#d7b07a}.aw-title{flex:0 0 auto;margin:10px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(16px,2.4cqw,28px);font-weight:400;line-height:1.2}.aw-action{flex:1 1 auto;min-height:0;margin:6px 0 0;font-size:13px;color:#cbbba8}.aw-dock{flex:0 0 auto;margin-top:8px;background:rgba(10,8,6,.72);border:1px solid #3a2e22;padding:8px 10px;font-size:9px;letter-spacing:.16em;color:#d7b07a}.aw-dock p{margin:4px 0 0;letter-spacing:0;font-size:12px;color:#e8dcc8;text-transform:none}
.aw-strip{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(1100px,calc(100% - 32px));margin:8px auto 0}.aw-thumb{position:relative;height:56px;border:1px solid #3a2e22;background:#16110c;color:#b9aea0;cursor:pointer;padding:0}.aw-thumb.on{border-color:#d7b07a;background:linear-gradient(180deg,#5a3a20,#2a1810)}.aw-thumb.rendering{background:#12100e}.aw-thumb.queued{background:#0d0c0b;border-style:dashed}.aw-thumb-status{position:absolute;inset:0 0 16px;display:flex;align-items:center;justify-content:center;font-size:9px;letter-spacing:.16em;color:#d7b07a}.aw-cap{position:absolute;left:6px;bottom:5px;font-size:9px;letter-spacing:.1em}.aw-hint{flex:0 0 auto;margin:6px 16px 0;text-align:center;font-size:9px;letter-spacing:.16em;color:#7d7368}
.aw-composer{flex:0 0 auto;width:min(1100px,calc(100% - 32px));margin:6px auto 0;margin-bottom:calc(10px + env(safe-area-inset-bottom));border:1px solid #3a2e22;background:#14110c;padding:8px 10px 10px}.aw-direct{display:block;font-size:9px;letter-spacing:.18em;color:#d7b07a;margin-bottom:6px}.aw-row{display:flex;align-items:center;gap:10px}.aw-row textarea{flex:1 1 auto;min-width:0;resize:none;height:36px;background:transparent;border:0;outline:none;color:#f4eee6;font-family:Georgia,"Times New Roman",serif;font-size:16px;line-height:36px;padding:0}.aw-row button{flex:0 0 auto;background:#e6d3b0;color:#1a140c;border:0;padding:8px 14px;font-size:11px;letter-spacing:.16em;font-weight:600;cursor:pointer}.aw-row button:disabled{opacity:.45;cursor:default}.aw-notice{margin:6px 0 0;font-size:12px;color:#d7b07a}
@media(max-width:860px){.aw-desk-nav,.aw-live,.aw-pro{display:none}.aw-go{display:inline-flex}.aw-thumb{height:44px}.aw-title{font-size:16px}.aw-action{display:none}}@media(max-height:700px){.aw-hint{display:none}.aw-thumb{height:40px}.aw-action{display:none}}
`;
