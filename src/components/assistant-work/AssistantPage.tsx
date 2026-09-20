"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORE_KEY = "crelavo-aw-last-v2";

export function CinemaRouteGuard() {
  useEffect(() => {
    try { sessionStorage.removeItem(STORE_KEY); localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    window.onbeforeunload = null;
    return undefined;
  }, []);
  return null;
}

type SceneStatus = "READY" | "REVISING" | "RENDERING" | "QUEUED";
type Scene = { id: number; status: SceneStatus; title: string; shot: string; note: string };
type CreditState = { amount: number | null; signedOut: boolean };

const INITIAL_SCENES: Scene[] = [
  { id: 1, status: "READY", title: "Black open. Gold dust. Brand lockup.", shot: "Hold 2s. Soft flare from top left.", note: "" },
  { id: 2, status: "REVISING", title: "Storefront at dusk, ceramic mug in warm tungsten", shot: "Slow push-in. Hands enter frame. Steam rises.", note: "Warmer tungsten. Slower push-in. Less steam." },
  { id: 3, status: "RENDERING", title: "Hands wrap the mug. Steam. Slow orbit.", shot: "Macro. Catchlight in glaze. No cut.", note: "" },
  { id: 4, status: "QUEUED", title: "End card. Product name. Warm fade.", shot: "Hold 3s. Soft gold type.", note: "" },
];
const CREDIT_GETS = ["/api/credits", "/api/credits/balance"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  }
  return null;
}
function signedOutFrom(data: Record<string, unknown>, httpStatus: number) {
  if (httpStatus === 401 || httpStatus === 403) return true;
  const blob = [data.error, data.message, data.code, data.reason].filter((v) => typeof v === "string").join(" ").toLowerCase();
  return blob.includes("session") || blob.includes("sign_in") || blob.includes("sign in") || blob.includes("unauthorized") || blob.includes("unauthenticated");
}
function pickBalance(data: unknown, httpStatus: number): CreditState {
  const root = asRecord(data);
  if (!root) return { amount: null, signedOut: httpStatus === 401 || httpStatus === 403 };
  if (signedOutFrom(root, httpStatus)) return { amount: null, signedOut: true };
  const bags = [root, asRecord(root.data), asRecord(root.user), asRecord(root.account), asRecord(root.credits), asRecord(root.balance)];
  const keys = ["available", "available_credits", "credits_remaining", "credit_balance", "creditBalance", "balance", "credits", "remaining", "current", "amount", "value", "total"];
  for (const bag of bags) {
    if (!bag) continue;
    for (const key of keys) {
      const n = asFiniteNumber(bag[key]);
      if (n !== null) {
        const reserved = asFiniteNumber(bag.reserved);
        if (key === "balance" && reserved !== null && bag.available == null) return { amount: Math.max(0, n - reserved), signedOut: false };
        return { amount: n, signedOut: false };
      }
    }
  }
  const direct = asFiniteNumber(root.credits) ?? asFiniteNumber(root.balance);
  return direct !== null ? { amount: direct, signedOut: false } : { amount: null, signedOut: false };
}
function padScene(id: number) { return String(id).padStart(2, "0"); }
function formatCredits(n: number) { return n.toLocaleString("en-US"); }

export default function AssistantPage() {
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [selectedId, setSelectedId] = useState(2);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [goOpen, setGoOpen] = useState(false);
  const [credits, setCredits] = useState<CreditState>({ amount: null, signedOut: false });
  const [flash, setFlash] = useState(false);
  const prevCredits = useRef<number | null>(null);
  const mounted = useRef(true);
  const selected = useMemo(() => scenes.find((s) => s.id === selectedId) ?? scenes[1], [scenes, selectedId]);

  const applyCredits = useCallback((next: CreditState) => {
    if (!mounted.current) return;
    setCredits((cur) => {
      if (next.amount !== null && prevCredits.current !== null && next.amount < prevCredits.current) {
        setFlash(true);
        window.setTimeout(() => { if (mounted.current) setFlash(false); }, 900);
      }
      if (next.amount !== null) prevCredits.current = next.amount;
      return next.amount === null && cur.amount !== null && !next.signedOut ? cur : next;
    });
  }, []);

  const loadCredits = useCallback(async () => {
    for (const url of CREDIT_GETS) {
      try {
        const res = await fetch(url, { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" } });
        const type = res.headers.get("content-type") || "";
        if (!type.includes("json")) continue;
        const data: unknown = await res.json();
        const parsed = pickBalance(data, res.status);
        if (parsed.signedOut || parsed.amount !== null) { applyCredits(parsed); return; }
      } catch { /* try next */ }
    }
  }, [applyCredits]);

  useEffect(() => {
    mounted.current = true;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    void loadCredits();
    const onFocus = () => void loadCredits();
    const onVis = () => { if (document.visibilityState === "visible") void loadCredits(); };
    const onCreditsEvent = (ev: Event) => {
      const detail = asRecord((ev as CustomEvent).detail);
      if (!detail) return;
      const parsed = pickBalance(detail, 200);
      if (parsed.amount !== null || parsed.signedOut) applyCredits(parsed);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("crelavo:credits", onCreditsEvent as EventListener);
    window.addEventListener("credits", onCreditsEvent as EventListener);
    const tick = window.setInterval(() => { if (document.visibilityState === "visible") void loadCredits(); }, 20000);
    return () => {
      mounted.current = false;
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("crelavo:credits", onCreditsEvent as EventListener);
      window.removeEventListener("credits", onCreditsEvent as EventListener);
      window.clearInterval(tick);
    };
  }, [applyCredits, loadCredits]);

  function applyLocalRevise(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setScenes((list) => list.map((scene) => scene.id === selectedId ? { ...scene, status: "REVISING", note: trimmed } : scene));
    setDraft("");
  }

  async function onSend() {
    const text = draft.trim();
    if (!text || busy) return;
    setNotice("");
    if (credits.amount === 0) {
      setNotice("Production is stopped at 0 credits. Board edits stay local.");
      applyLocalRevise(text);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "revise", scene: selectedId, prompt: text }),
      });
      const type = res.headers.get("content-type") || "";
      const data = type.includes("json") ? await res.json() : null;
      const rec = asRecord(data);
      if (rec) {
        const parsed = pickBalance(rec, res.status);
        if (parsed.amount !== null || parsed.signedOut) applyCredits(parsed);
        const blob = [rec.code, rec.error, rec.message].filter((v) => typeof v === "string").join(" ").toLowerCase();
        if (blob.includes("insufficient") || rec.code === "insufficient") {
          setNotice("Not enough credits for engine work. Board updated locally.");
          applyLocalRevise(text);
          return;
        }
      }
      applyLocalRevise(text);
      if (res.ok && rec) void loadCredits();
    } catch { applyLocalRevise(text); }
    finally { if (mounted.current) setBusy(false); }
  }

  const creditLabel = credits.signedOut ? "Sign in" : credits.amount === null ? "..." : formatCredits(credits.amount);

  return (
    <div id="crelavo-aw-thread" className="aw">
      <style>{CSS}</style>
      <header className="aw-head">
        <div className="aw-left">
          <a className="aw-pill" href="/">{"< Home"}</a>
          <a className="aw-brand" href="/">CRELAVO</a>
          <nav className="aw-desk"><a href="/dashboard">DASHBOARD</a><a href="/dashboard/credits">CREDITS</a><a href="/dashboard/productions">PRODUCTIONS</a></nav>
        </div>
        <div className="aw-right">
          <a className={"aw-credits" + (flash ? " is-flash" : "")} href={credits.signedOut ? "/?auth=login" : "/dashboard/credits"}><span className="k">CREDITS</span><span className="n">{creditLabel}</span></a>
          <span className="aw-live"><i />LIVE</span>
          <a className="aw-pro" href="/pricing">Pro $9.99/mo</a>
          <button type="button" className="aw-go" onClick={() => setGoOpen((v) => !v)}>Go</button>
        </div>
      </header>

      {goOpen ? <div className="aw-sheet" onClick={() => setGoOpen(false)}><div className="aw-sheet-in" onClick={(e) => e.stopPropagation()}><a href="/">Home</a><a href="/dashboard">Dashboard</a><a href="/dashboard/credits">Credits</a><a href="/dashboard/productions">Productions</a><a href="/dashboard/billing">Billing</a><a href="/pricing">Pricing</a></div></div> : null}

      <section className="aw-stage-wrap">
        <div className="aw-stage">
          <div className="aw-stage-top"><div className="kicker">SCENE {padScene(selected.id)} / SELECTED</div><h1>{selected.title}</h1><p className="shot">{selected.shot}</p></div>
          {selected.note ? <div className="aw-dock"><div className="kicker">REVISE THIS SCENE / PRODUCTION CONTINUES</div><p>{selected.note}</p></div> : null}
        </div>
      </section>

      <footer className="aw-bottom">
        <div className="aw-strip">
          {scenes.map((scene) => <button key={scene.id} type="button" className={"aw-cell" + (scene.id === selectedId ? " is-on" : "") + (scene.status === "RENDERING" ? " is-run" : "") + (scene.status === "QUEUED" ? " is-queued" : "")} onClick={() => setSelectedId(scene.id)}><span>{padScene(scene.id)} {scene.status}</span></button>)}
        </div>
        <p className="aw-hint">CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB</p>
        {notice ? <p className="aw-notice">{notice}</p> : null}
        <div className="aw-comp">
          <label className="kicker" htmlFor="aw-direct">DIRECT THE SELECTED SCENE</label>
          <div className="aw-row"><textarea id="aw-direct" rows={2} value={draft} placeholder="Make this part like this?" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void onSend(); } }} /><button type="button" className="aw-send" onClick={() => void onSend()} disabled={busy}>SEND</button></div>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.aw{position:fixed;inset:0;z-index:2147483001;display:grid;grid-template-rows:44px minmax(0,1fr) auto;height:100dvh;height:100svh;max-height:100dvh;overflow:hidden;background:#0b0a09;color:#f4eee6;font-family:Inter,Helvetica,sans-serif}.aw a{color:inherit;text-decoration:none}.kicker{font-size:9px;letter-spacing:.16em;color:#d7b07a;font-weight:500}
.aw-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;border-bottom:1px solid rgba(215,176,122,.16)}.aw-left,.aw-right{display:flex;align-items:center;gap:10px;min-width:0}.aw-pill,.aw-go{border:1px solid rgba(215,176,122,.35);border-radius:999px;padding:5px 10px;font-size:10px;letter-spacing:.08em;color:#e6d3b0;background:transparent}.aw-brand{letter-spacing:.28em;font-size:11px;color:#f4eee6}.aw-desk{display:flex;gap:14px}.aw-desk a{font-size:10px;letter-spacing:.14em;color:#b9aea0}
.aw-credits{display:flex;align-items:baseline;gap:8px;border:1px solid rgba(215,176,122,.55);background:rgba(215,176,122,.08);border-radius:999px;padding:4px 12px;flex-shrink:0}.aw-credits .k{font-size:9px;letter-spacing:.16em;color:#b9aea0}.aw-credits .n{font-family:Georgia,serif;font-size:16px;line-height:1;color:#e8dcc8}.aw-credits.is-flash{box-shadow:0 0 0 1px #d7b07a;background:rgba(215,176,122,.22)}.aw-live{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;color:#e6d3b0}.aw-live i{width:6px;height:6px;border-radius:99px;background:#c45a4a;display:block}.aw-pro{background:#e8dcc8;color:#1a140c;border-radius:999px;padding:5px 10px;font-size:10px;white-space:nowrap}.aw-go{display:none}
.aw-sheet{position:absolute;inset:44px 0 0;background:rgba(11,10,9,.72);z-index:2}.aw-sheet-in{margin:10px;border:1px solid rgba(215,176,122,.28);background:#120e0b;display:flex;flex-direction:column}.aw-sheet-in a{padding:12px 14px;border-bottom:1px solid rgba(215,176,122,.12);font-size:13px}
.aw-stage-wrap{min-height:0;display:flex;align-items:stretch;justify-content:center;padding:8px 16px 0}.aw-stage{width:min(1120px,100%);margin:0 auto;aspect-ratio:16/9;max-height:100%;height:auto;border:1px solid rgba(215,176,122,.35);background:linear-gradient(180deg,#3a2412 0%,#120e0b 100%);position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:0}.aw-stage-top{padding:14px 16px 8px}.aw-stage h1{font-family:Georgia,serif;font-size:clamp(16px,2.1vw,28px);font-weight:500;margin:6px 0 0;line-height:1.2}.shot{margin:6px 0 0;font-size:12px;color:#b9aea0}.aw-dock{margin:0 12px 12px;border:1px solid rgba(215,176,122,.22);padding:8px 10px;background:rgba(11,10,9,.55)}.aw-dock p{margin:2px 0 0;font-size:12px}
.aw-bottom{padding:8px 16px calc(10px + env(safe-area-inset-bottom))}.aw-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;max-width:1120px;margin:0 auto}.aw-cell{height:52px;border:1px solid rgba(215,176,122,.2);background:#16110c;color:#b9aea0;display:flex;align-items:flex-end;padding:6px 8px;font-size:9px;letter-spacing:.12em;text-align:left;cursor:pointer}.aw-cell.is-on{border-color:#d7b07a;background:linear-gradient(180deg,#6a4a28,#1a140c);color:#f4eee6}.aw-cell.is-run{opacity:.9}.aw-cell.is-queued{border-style:dashed;background:transparent}.aw-hint{text-align:center;font-size:8px;letter-spacing:.14em;color:#8a8074;margin:6px 0 4px}.aw-notice{text-align:center;font-size:11px;color:#d7b07a;margin:0 0 6px}
.aw-comp{max-width:1120px;margin:0 auto;border:1px solid rgba(215,176,122,.22);padding:8px 10px;background:#120e0b}.aw-row{display:flex;gap:10px;align-items:flex-end;margin-top:6px}.aw-row textarea{flex:1;min-height:44px;max-height:72px;resize:none;background:transparent;border:0;color:#f4eee6;font:inherit;outline:none}.aw-send{background:#cfc3b0;color:#1a140c;border:0;padding:8px 14px;font-size:10px;letter-spacing:.14em;cursor:pointer}.aw-send:disabled{opacity:.5}
@media(max-width:900px){.aw-desk,.aw-live,.aw-pro{display:none}.aw-go{display:inline-flex}.aw-credits .k{display:none}.aw-stage{aspect-ratio:16/9;width:100%}.aw-dock{display:none}.shot{display:none}.aw-cell{height:36px;font-size:8px}.aw-stage h1{font-size:16px}}
`;
