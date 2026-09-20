"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORE_KEY = "crelavo-aw-last-v2";

export function CinemaRouteGuard() {
  useEffect(() => {
    try { sessionStorage.removeItem(STORE_KEY); localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    window.onbeforeunload = null;
  }, []);
  return null;
}

type SceneStatus = "ready" | "revising" | "rendering" | "queued";
type Scene = { id: number; status: SceneStatus; title: string; shot: string; revise: string };

const INITIAL: Scene[] = [
  { id: 1, status: "ready", title: "Dawn street, closed shutters, first light", shot: "Wide hold. A cyclist crosses. Lights flicker on.", revise: "" },
  { id: 2, status: "revising", title: "Storefront at dusk, ceramic mug in warm tungsten", shot: "Slow push-in. Hands enter frame. Steam rises.", revise: "Warmer tungsten. Slower push-in. Less steam." },
  { id: 3, status: "rendering", title: "Steam close-up, mug rim, slow tilt", shot: "Macro. Beads of water. Heat shimmer.", revise: "" },
  { id: 4, status: "queued", title: "Hands place the mug, mark fade", shot: "Over-shoulder. Soft rack focus. Hold.", revise: "" },
];

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}
function parseCredits(data: unknown, depth = 0): number | null {
  if (data == null || typeof data !== "object" || depth > 2) return null;
  const rec = data as Record<string, unknown>;
  const reserved = asNum(rec.reserved) ?? 0;
  for (const k of ["available", "available_credits", "credits_remaining", "credit_balance", "credits", "balance"]) {
    const n = asNum(rec[k]);
    if (n != null) return k === "balance" || k === "credit_balance" ? Math.max(0, n - reserved) : n;
  }
  if (depth === 0) {
    for (const nest of [rec.data, rec.user, rec.wallet, rec.result]) {
      const n = parseCredits(nest, depth + 1);
      if (n != null) return n;
    }
  }
  return null;
}
function statusLabel(status: SceneStatus, selected: boolean) {
  if (selected) return status === "revising" ? "REVISING" : "SELECTED";
  if (status === "ready") return "READY";
  if (status === "revising") return "REVISING";
  if (status === "rendering") return "RENDERING";
  return "QUEUED";
}

export default function AssistantPage() {
  const [scenes, setScenes] = useState<Scene[]>(INITIAL);
  const [selectedId, setSelectedId] = useState(2);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [flash, setFlash] = useState(false);
  const [goOpen, setGoOpen] = useState(false);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const slotRef = useRef<HTMLDivElement | null>(null);
  const prevCredits = useRef<number | null>(null);
  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[1];

  const loadCredits = useCallback(async () => {
    for (const url of ["/api/credits", "/api/credits/balance"]) {
      try {
        const res = await fetch(url, { credentials: "include", cache: "no-store" });
        const text = await res.text();
        let data: unknown = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = null; }
        const rec = data && typeof data === "object" ? data as Record<string, unknown> : null;
        const msg = rec && typeof rec.error === "string" ? rec.error : "";
        const code = rec && typeof rec.code === "string" ? rec.code : "";
        if (res.status === 401 || res.status === 403 || /session|sign in|sign_in|unauthorized/i.test(`${msg} ${code}`)) {
          setSignedOut(true); setCredits(null); return;
        }
        if (!res.ok) continue;
        const n = parseCredits(data);
        if (n == null) continue;
        setSignedOut(false); setCredits(n);
        const prev = prevCredits.current;
        if (prev != null && n < prev) { setFlash(true); window.setTimeout(() => setFlash(false), 700); }
        prevCredits.current = n;
        return;
      } catch { /* try next */ }
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prev = { htmlO: html.style.overflow, bodyO: body.style.overflow, htmlH: html.style.height, bodyH: body.style.height, htmlOs: html.style.overscrollBehavior, bodyOs: body.style.overscrollBehavior };
    html.style.overflow = "hidden"; body.style.overflow = "hidden"; html.style.height = "100%"; body.style.height = "100%"; html.style.overscrollBehavior = "none"; body.style.overscrollBehavior = "none";
    return () => { html.style.overflow = prev.htmlO; body.style.overflow = prev.bodyO; html.style.height = prev.htmlH; body.style.height = prev.bodyH; html.style.overscrollBehavior = prev.htmlOs; body.style.overscrollBehavior = prev.bodyOs; };
  }, []);

  useEffect(() => {
    void loadCredits();
    const onFocus = () => void loadCredits();
    const onVis = () => { if (document.visibilityState === "visible") void loadCredits(); };
    const onEvt = () => void loadCredits();
    window.addEventListener("focus", onFocus); document.addEventListener("visibilitychange", onVis); window.addEventListener("crelavo:credits", onEvt); window.addEventListener("credits", onEvt);
    const t = window.setInterval(() => void loadCredits(), 20000);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("crelavo:credits", onEvt); window.removeEventListener("credits", onEvt); window.clearInterval(t); };
  }, [loadCredits]);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w < 2 || h < 2) return;
      const ratio = 16 / 9;
      setFrame(w / h > ratio ? { w: Math.floor(h * ratio), h: Math.floor(h) } : { w: Math.floor(w), h: Math.floor(w / ratio) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el); window.addEventListener("resize", fit); window.addEventListener("orientationchange", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); window.removeEventListener("orientationchange", fit); };
  }, []);

  function applyLocal(text: string) {
    setScenes((prev) => prev.map((s) => s.id === selectedId ? { ...s, revise: text, status: s.status === "queued" || s.status === "rendering" ? s.status : "revising" } : s));
  }
  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    if (credits === 0) { setNotice("Production stopped. Credits are at 0."); return; }
    setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/assistant-work", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revise", scene_id: selectedId, prompt: text }) });
      applyLocal(text); setDraft("");
      if (!res.ok) setNotice("Engine offline. Board updated locally. Production continues.");
      void loadCredits();
    } catch { applyLocal(text); setDraft(""); setNotice("Engine offline. Board updated locally. Production continues."); }
    finally { setBusy(false); }
  }

  const creditLabel = signedOut ? null : credits == null ? "..." : credits.toLocaleString("en-US");

  return (
    <div id="crelavo-aw-thread" className="caw-shell">
      <style>{CSS}</style>
      <header className="caw-head">
        <div className="caw-left"><a className="caw-home" href="/">&lt; Home</a><a className="caw-brand" href="/">CRELAVO</a><nav className="caw-nav"><a href="/dashboard">DASHBOARD</a><a href="/dashboard/credits">CREDITS</a><a href="/dashboard/productions">PRODUCTIONS</a></nav></div>
        <div className="caw-right">
          {signedOut ? <a className="caw-pill" href="/?auth=login">Sign in</a> : <a className={"caw-pill" + (flash ? " caw-flash" : "")} href="/dashboard/credits">CREDITS {creditLabel}</a>}
          <span className="caw-live">LIVE</span><a className="caw-pro" href="/pricing">Pro $9.99/mo</a><button className="caw-go" type="button" onClick={() => setGoOpen(true)}>Go</button>
        </div>
      </header>

      <div className="caw-body">
        <div className="caw-slot" ref={slotRef}>
          <div className="caw-frame" style={frame.w > 0 ? { width: frame.w, height: frame.h, maxWidth: "100%", maxHeight: "100%", aspectRatio: "auto" } : undefined}>
            <div className="caw-meta"><div className="caw-kicker">SCENE {String(selected.id).padStart(2, "0")} / SELECTED</div><h1 className="caw-title">{selected.title}</h1><p className="caw-shot">{selected.shot}</p></div>
            {selected.revise ? <div className="caw-dock"><div className="caw-kicker">REVISE THIS SCENE / PRODUCTION CONTINUES</div><p>{selected.revise}</p></div> : null}
          </div>
        </div>
        <div className="caw-strip">{scenes.map((s) => { const on = s.id === selectedId; return <button key={s.id} type="button" className={"caw-cell" + (on ? " on" : "")} onClick={() => setSelectedId(s.id)}>{String(s.id).padStart(2, "0")} {statusLabel(s.status, on)}</button>; })}</div>
        <div className="caw-hint">CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB</div>
        {notice ? <div className="caw-notice">{notice}</div> : null}
        <div className="caw-composer"><form onSubmit={(e) => { e.preventDefault(); void send(); }}><div className="caw-field"><label htmlFor="caw-draft">DIRECT THE SELECTED SCENE</label><textarea id="caw-draft" rows={1} value={draft} placeholder="Make this part like this?" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} /></div><button className="caw-send" type="submit" disabled={busy}>SEND</button></form></div>
      </div>

      {goOpen ? <div className="caw-sheet"><button type="button" onClick={() => setGoOpen(false)}>Close</button><a href="/" onClick={() => setGoOpen(false)}>Home</a><a href="/dashboard" onClick={() => setGoOpen(false)}>Dashboard</a><a href="/dashboard/credits" onClick={() => setGoOpen(false)}>Credits</a><a href="/dashboard/productions" onClick={() => setGoOpen(false)}>Productions</a><a href="/pricing" onClick={() => setGoOpen(false)}>Pro $9.99/mo</a></div> : null}
    </div>
  );
}

const CSS = `
#crelavo-aw-thread,#crelavo-aw-thread *{box-sizing:border-box}.caw-shell{position:fixed;inset:0;width:100%;max-width:100%;height:100svh;max-height:100dvh;overflow:hidden;z-index:2147483001;display:flex;flex-direction:column;min-width:0;min-height:0;background:#07080c;color:#f4eee6;font-family:Inter,system-ui,sans-serif;overscroll-behavior:none;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.caw-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;width:100%;height:48px;padding:0 12px;border-bottom:1px solid #2a2118}.caw-left,.caw-right{display:flex;align-items:center;gap:12px;min-width:0}.caw-right{flex:0 0 auto}.caw-left{flex:1 1 auto;overflow:hidden}.caw-brand,.caw-nav a,.caw-pill,.caw-go,.caw-live,.caw-pro{font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:#d8cfc3;white-space:nowrap}.caw-home,.caw-pill,.caw-go{border:1px solid #5a4a38;border-radius:999px;padding:5px 10px;color:#d8cfc3;text-decoration:none;font-size:11px;letter-spacing:.12em}.caw-nav{display:flex;gap:14px;align-items:center}.caw-live{color:#d7b07a}.caw-pill{color:#e6d3b0}.caw-pill.caw-flash{animation:cawFlash .7s ease}@keyframes cawFlash{0%{background:rgba(215,176,122,.35)}100%{background:transparent}}.caw-go{display:none;background:transparent;cursor:pointer}
.caw-body{flex:1 1 auto;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden;padding:8px 12px 0}.caw-slot{flex:1 1 auto;min-height:0;min-width:0;width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden}.caw-frame{position:relative;width:100%;max-width:100%;max-height:100%;aspect-ratio:16/9;overflow:hidden;border:1px solid #c4a06a;background:linear-gradient(180deg,#3d2814 0%,#16110c 62%,#0e0c0a 100%)}.caw-meta{padding:12px 14px 0;max-width:100%}.caw-kicker{font-size:10px;letter-spacing:.16em;color:#d7b07a}.caw-title{font-family:Georgia,"Times New Roman",serif;font-size:clamp(16px,2.2vw,28px);line-height:1.25;margin:6px 0 0;padding-right:8px;overflow:hidden}.caw-shot{font-size:12px;color:#cbbba8;margin-top:6px}.caw-dock{position:absolute;left:10px;right:10px;bottom:10px;border:1px solid #c4a06a;background:rgba(12,10,8,.78);padding:8px 10px}.caw-dock .caw-kicker{font-size:9px}.caw-dock p{margin:4px 0 0;font-size:13px}
.caw-strip{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;max-width:100%;min-width:0;margin-top:8px}.caw-cell{min-width:0;border:1px solid #3a2e22;background:#100e0c;color:#b9aea0;padding:10px 8px;text-align:left;font-size:10px;letter-spacing:.12em;cursor:pointer;overflow:hidden}.caw-cell.on{border-color:#c4a06a;color:#e6d3b0;background:#1a140e}.caw-hint{flex:0 0 auto;font-size:9px;letter-spacing:.14em;color:#8a7d70;margin:6px 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.caw-composer{flex:0 0 auto;width:100%;max-width:100%;border:1px solid #c4a06a;padding:8px 10px;margin-bottom:calc(8px + env(safe-area-inset-bottom));display:flex;align-items:flex-end;gap:10px;min-width:0}.caw-composer form{display:flex;width:100%;gap:10px;align-items:flex-end;min-width:0}.caw-field{flex:1 1 auto;min-width:0}.caw-field label{display:block;font-size:9px;letter-spacing:.14em;color:#d7b07a;margin-bottom:4px}.caw-field textarea{width:100%;max-width:100%;resize:none;border:0;outline:none;background:transparent;color:#f4eee6;font:14px/1.4 Inter,system-ui,sans-serif;min-height:24px;max-height:64px}.caw-send{flex:0 0 auto;border:0;background:#d7b07a;color:#1a120c;letter-spacing:.14em;font-size:11px;padding:10px 14px;cursor:pointer}.caw-send:disabled{opacity:.5;cursor:default}.caw-notice{flex:0 0 auto;font-size:12px;color:#d7b07a;margin:0 0 6px}
.caw-sheet{position:absolute;inset:0;background:rgba(7,8,12,.96);z-index:5;display:flex;flex-direction:column;padding:18px 16px;gap:14px}.caw-sheet a,.caw-sheet button{color:#f4eee6;text-decoration:none;background:none;border:0;text-align:left;font-size:14px;letter-spacing:.12em;text-transform:uppercase;padding:8px 0;cursor:pointer}@media(max-width:860px){.caw-nav,.caw-live,.caw-pro,.caw-shot,.caw-dock{display:none}.caw-go{display:inline-flex}.caw-title{font-size:16px}.caw-cell{padding:8px 4px;font-size:9px;letter-spacing:.08em}.caw-hint{display:none}}
`;
