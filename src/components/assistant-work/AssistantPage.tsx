"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const JOB_KEY = "crelavo-aw-last-v2";
const OVERLAY_ID = "crelavo-aw-thread";

type Scene = {
  id: string;
  status: string;
  label: string;
  title: string;
  shot: string;
  dock: string;
  gradient: string;
  kind?: string;
};

const VIDEO_SCENES: Scene[] = [
  { id: "01", status: "READY", label: "SCENE 01 / SELECTED", title: "Dawn street, neon pharmacy window", shot: "Locked-off wide. Rain on glass. A figure passes.", dock: "Cooler blue. Hold the wide. Keep the rain.", gradient: "radial-gradient(120% 80% at 50% 0%, #1a3a58 0%, #0b1016 42%, #070605 100%)" },
  { id: "02", status: "REVISING", label: "SCENE 02 / SELECTED", title: "Storefront at dusk, ceramic mug in warm tungsten", shot: "Slow push-in. Hands enter frame. Steam rises.", dock: "Warmer tungsten. Slower push-in. Less steam.", gradient: "radial-gradient(120% 80% at 50% 0%, #8a5a22 0%, #1a1008 42%, #070605 100%)" },
  { id: "03", status: "RENDERING", label: "SCENE 03 / SELECTED", title: "Overhead pass, packed shipping table", shot: "Top-down glide. Tape pulls. Labels land.", dock: "Tighter overhead. Faster hands. Less clutter.", gradient: "radial-gradient(120% 80% at 50% 0%, #3d4a38 0%, #10140e 42%, #070605 100%)" },
  { id: "04", status: "QUEUED", label: "SCENE 04 / SELECTED", title: "Night checkout, card tap on black counter", shot: "Macro insert. LED blinks. Receipt peeks.", dock: "Closer macro. Softer LED. Hold the tap.", gradient: "radial-gradient(120% 80% at 50% 0%, #2a3348 0%, #0c0e14 42%, #070605 100%)" },
];

const WEB_PAGES: Scene[] = [
  { id: "01", status: "READY", label: "PAGE 01 / SELECTED", title: "Home — hero, offer, start here", shot: "Full-width hero. Price in the first screen. One primary button.", dock: "Larger type. Shorter hero. Keep one button.", gradient: "radial-gradient(120% 80% at 50% 0%, #16324d 0%, #0b1220 50%, #070605 100%)", kind: "home" },
  { id: "02", status: "REVISING", label: "PAGE 02 / SELECTED", title: "Catalog — product grid and filters", shot: "Four-up grid. Price on the card. Filter row on top.", dock: "Three-up grid. Bigger cards. Filters stay.", gradient: "radial-gradient(120% 80% at 50% 0%, #1b3a36 0%, #0b1413 50%, #070605 100%)", kind: "shop" },
  { id: "03", status: "RENDERING", label: "PAGE 03 / SELECTED", title: "Story — proof, process, FAQ", shot: "Two-column story. Quotes. Short FAQ.", dock: "One column on mobile. Fewer quotes.", gradient: "radial-gradient(120% 80% at 50% 0%, #3a2a1b 0%, #14100c 50%, #070605 100%)", kind: "about" },
  { id: "04", status: "QUEUED", label: "PAGE 04 / SELECTED", title: "Checkout — order summary and pay", shot: "Summary left. Pay right. No extra steps.", dock: "Single column. Summary above pay.", gradient: "radial-gradient(120% 80% at 50% 0%, #2a2038 0%, #100c16 50%, #070605 100%)", kind: "checkout" },
];

const NAV = [
  { href: "/", label: "CRELAVO" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/pricing", label: "CREDITS" },
  { href: "/dashboard/productions", label: "PRODUCTIONS" },
];

export function CinemaRouteGuard() {
  useEffect(() => {
    window.onbeforeunload = null;
  }, []);
  return null;
}

function readQuery() {
  if (typeof window === "undefined") return { type: "", category: "" };
  const q = new URLSearchParams(window.location.search);
  return { type: q.get("type") || "", category: q.get("category") || "" };
}

function isWebsiteMode(type: string, category: string) {
  const n = `${type} ${category}`.toLowerCase();
  if (/video/.test(n) && !/website/.test(n)) return false;
  return /website|web\s*page|landing|\bsite\b/.test(n);
}

function isJwt(value: string) {
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

function pickToken(node: unknown, depth = 0): string | null {
  if (depth > 8 || node == null) return null;
  if (typeof node === "string") {
    const s = node.trim();
    if (isJwt(s)) return s;
    if (s.startsWith("{") || s.startsWith("[")) {
      try { return pickToken(JSON.parse(s), depth + 1); } catch { return null; }
    }
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) { const found = pickToken(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof node !== "object") return null;
  const rec = node as Record<string, unknown>;
  for (const key of ["access_token", "accessToken", "token"]) { const found = pickToken(rec[key], depth + 1); if (found) return found; }
  for (const key of ["currentSession", "session", "data", "user", "auth"]) { const found = pickToken(rec[key], depth + 1); if (found) return found; }
  for (const value of Object.values(rec)) { const found = pickToken(value, depth + 1); if (found) return found; }
  return null;
}

function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const stores: Storage[] = [];
  try { stores.push(window.localStorage); } catch { /* ignore */ }
  try { stores.push(window.sessionStorage); } catch { /* ignore */ }
  for (const store of stores) {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key) continue;
      let raw = "";
      try { raw = store.getItem(key) || ""; } catch { continue; }
      if (!raw) continue;
      if (isJwt(raw)) return raw.trim();
      try { const found = pickToken(JSON.parse(raw)); if (found) return found; } catch { /* ignore */ }
    }
  }
  const cookies = document.cookie.split(";").map((p) => p.trim());
  for (const part of cookies) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq);
    const value = decodeURIComponent(part.slice(eq + 1));
    if (/sb-access-token|access_token|auth-token/i.test(name)) {
      if (isJwt(value)) return value.trim();
      try { const found = pickToken(JSON.parse(value)); if (found) return found; } catch { /* ignore */ }
    }
  }
  return null;
}

function pickBalance(node: unknown, depth = 0): number | null {
  if (depth > 8 || node == null) return null;
  if (typeof node === "number" && Number.isFinite(node)) return node;
  if (typeof node === "string" && node.trim() !== "" && Number.isFinite(Number(node))) return Number(node);
  if (typeof node !== "object") return null;
  const rec = node as Record<string, unknown>;
  for (const key of ["balance", "credits", "amount", "credit_balance", "available", "remaining", "total"]) {
    if (key in rec) { const found = pickBalance(rec[key], depth + 1); if (found != null) return found; }
  }
  for (const key of ["data", "user", "account", "result", "payload"]) {
    if (key in rec) { const found = pickBalance(rec[key], depth + 1); if (found != null) return found; }
  }
  return null;
}

function isSignInError(node: unknown) {
  if (!node || typeof node !== "object") return false;
  const rec = node as Record<string, unknown>;
  const code = String(rec.code || rec.error || rec.message || "").toLowerCase();
  return /sign[_\s-]?in|unauth|session is required|not signed/.test(code);
}

async function loadCredits(token: string | null): Promise<{ amount: number | null; signIn: boolean }> {
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const opts: RequestInit = { method: "GET", headers, credentials: "include", cache: "no-store" };
  const urls = ["/api/credits", "/api/credits/balance"];
  let signIn = false;
  let amount: number | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, opts);
      const data = await res.json().catch(() => null);
      const found = pickBalance(data);
      if (found != null) amount = found;
      if (isSignInError(data) || res.status === 401) signIn = true;
    } catch { /* ignore */ }
  }
  return { amount, signIn };
}

function WebsiteMock({ scene }: { scene: Scene }) {
  const kind = scene.kind || "home";
  return (
    <div className="aw-browser">
      <div className="aw-browser-bar"><span className="aw-dot" /><span className="aw-dot" /><span className="aw-dot" /><div className="aw-url">crelavo.site / {kind}</div></div>
      <div className="aw-browser-body">
        <div className="aw-site-nav"><b>NORTH &amp; CO</b><span>Home</span><span>Shop</span><span>Story</span><span>Pay</span></div>
        {kind === "home" && <div className="aw-hero"><div className="aw-kicker">NEW DROP</div><div className="aw-hero-title">Ceramic tableware for slow mornings</div><div className="aw-hero-sub">One offer. One button. Price on the first screen.</div><div className="aw-cta">Start here</div></div>}
        {kind === "shop" && <div className="aw-grid">{["Mug", "Bowl", "Plate", "Set"].map((name) => <div key={name} className="aw-card"><div className="aw-swatch" /><div>{name}</div><div className="aw-price">$28</div></div>)}</div>}
        {kind === "about" && <div className="aw-story"><div><div className="aw-kicker">PROCESS</div><p>Thrown, fired, packed. Short proof next to the product, not a long about page.</p></div><div><div className="aw-kicker">FAQ</div><p>Shipping, returns, care. Three answers. No extra columns on mobile.</p></div></div>}
        {kind === "checkout" && <div className="aw-pay"><div className="aw-sum"><div>Mug × 1</div><div>Total $28</div></div><div className="aw-cta">Pay</div></div>}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [{ type, category }, setQuery] = useState(readQuery);
  const website = isWebsiteMode(type, category);
  const board = website ? WEB_PAGES : VIDEO_SCENES;
  const [selected, setSelected] = useState(website ? 0 : 1);
  const [draft, setDraft] = useState("");
  const [goOpen, setGoOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsKnown, setCreditsKnown] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const scene = board[Math.min(selected, board.length - 1)] || board[0];

  const lockViewport = useCallback(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, htmlHeight: html.style.height, bodyHeight: body.style.height, bodyOverscroll: body.style.overscrollBehavior };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";
    const sync = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      if (shellRef.current) { shellRef.current.style.height = `${Math.round(h)}px`; shellRef.current.style.width = `${window.innerWidth}px`; }
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.height = prev.htmlHeight;
      body.style.height = prev.bodyHeight;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    setQuery(readQuery());
    const q = readQuery();
    setSelected(isWebsiteMode(q.type, q.category) ? 0 : 1);
  }, []);

  useEffect(() => lockViewport(), [lockViewport]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB_KEY) || sessionStorage.getItem(JOB_KEY);
      if (!raw) {
        const payload = JSON.stringify({ type, category, selected, t: Date.now() });
        localStorage.setItem(JOB_KEY, payload);
        sessionStorage.setItem(JOB_KEY, payload);
      }
    } catch { /* ignore */ }
  }, [type, category, selected]);

  const refreshCredits = useCallback(async () => {
    const nextToken = readAccessToken();
    setToken(nextToken);
    const result = await loadCredits(nextToken);
    if (result.amount != null) { setCredits(result.amount); setCreditsKnown(true); return; }
    setCreditsKnown(true);
    if (!nextToken && result.signIn) setCredits(null);
  }, []);

  useEffect(() => {
    let alive = true;
    const run = () => { if (alive) refreshCredits(); };
    run();
    const id = window.setInterval(run, 20000);
    window.addEventListener("focus", run);
    window.addEventListener("crelavo-session", run);
    return () => { alive = false; window.clearInterval(id); window.removeEventListener("focus", run); window.removeEventListener("crelavo-session", run); };
  }, [refreshCredits]);

  const signedIn = Boolean(token);
  const creditLabel = !creditsKnown && signedIn ? "CREDITS …" : signedIn ? `CREDITS ${(credits ?? 0).toLocaleString("en-US")}` : "SIGN IN";

  const applyLocal = (text: string) => {
    const next = board.map((item, index) => index === selected ? { ...item, dock: text, status: "REVISING" } : item);
    board.splice(0, board.length, ...next);
  };

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;
    applyLocal(text);
    setDraft("");
    if ((credits ?? 0) === 0) return;
    try {
      const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);
      await fetch("/api/assistant-work", { method: "POST", headers, credentials: "include", body: JSON.stringify({ action: "revise", scene: scene.id, prompt: text, type: website ? "Website" : "AI Video" }) });
    } catch { /* local revise already applied; engine stays disconnected */ }
  };

  const goLinks = useMemo(() => NAV, []);

  return (
    <div id={OVERLAY_ID} ref={shellRef} className="aw-shell">
      <style>{`
        .aw-shell{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;width:100vw;height:100dvh;max-height:100dvh;overflow:hidden;background:#070605;color:#f4eee6;font-family:Inter,system-ui,sans-serif;overscroll-behavior:none;}
        .aw-shell *{box-sizing:border-box;}
        .aw-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 10px;min-height:48px;border-bottom:1px solid rgba(244,238,230,.12);}
        .aw-home{display:inline-flex;align-items:center;height:28px;padding:0 10px;border:1px solid rgba(244,238,230,.22);border-radius:999px;color:#f4eee6;text-decoration:none;font-size:11px;letter-spacing:.06em;}
        .aw-nav{display:flex;gap:14px;flex:1;min-width:0;}
        .aw-nav a{color:rgba(244,238,230,.72);text-decoration:none;font-size:11px;letter-spacing:.14em;}
        .aw-right{margin-left:auto;display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .aw-chip{display:inline-flex;align-items:center;height:28px;padding:0 10px;border:1px solid rgba(244,238,230,.22);border-radius:999px;color:#f4eee6;text-decoration:none;font-size:11px;letter-spacing:.08em;background:transparent;}
        .aw-live{font-size:10px;letter-spacing:.16em;color:rgba(244,238,230,.6);}
        .aw-pro{font-size:10px;letter-spacing:.14em;color:#d7b07a;}
        .aw-go{display:none;}
        .aw-stage{flex:1 1 auto;min-height:0;position:relative;margin:8px 10px 0;border:1px solid rgba(215,176,122,.28);overflow:hidden;}
        .aw-stage-bg{position:absolute;inset:0;}
        .aw-stage-copy{position:absolute;left:18px;right:18px;top:16px;z-index:1;}
        .aw-kicker{font-size:10px;letter-spacing:.16em;color:rgba(244,238,230,.55);margin-bottom:8px;}
        .aw-title{font-family:Georgia,serif;font-size:clamp(18px,2.4vw,28px);line-height:1.2;margin:0 0 8px;}
        .aw-shot{font-size:13px;color:rgba(244,238,230,.72);margin:0;}
        .aw-dock{flex:0 0 auto;margin:8px 10px 0;border:1px solid rgba(244,238,230,.16);padding:8px 10px;}
        .aw-dock-k{font-size:9px;letter-spacing:.14em;color:rgba(244,238,230,.45);margin-bottom:4px;}
        .aw-dock-t{font-size:13px;}
        .aw-strip{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 10px 0;}
        .aw-cell{height:36px;border:1px solid rgba(244,238,230,.16);background:#0c0a08;color:rgba(244,238,230,.7);font-size:10px;letter-spacing:.12em;cursor:pointer;}
        .aw-cell.on{border-color:#d7b07a;color:#f4eee6;}
        .aw-hint{display:none;margin:4px 10px 0;font-size:9px;letter-spacing:.12em;color:rgba(244,238,230,.4);}
        .aw-composer{flex:0 0 auto;display:flex;align-items:center;gap:8px;margin:8px 10px 10px;padding:18px 8px 8px;border:1px solid rgba(244,238,230,.16);position:relative;}
        .aw-composer[data-mode="web"]::before{content:"DIRECT THE SELECTED PAGE";}
        .aw-composer[data-mode="video"]::before{content:"DIRECT THE SELECTED SCENE";}
        .aw-composer::before{position:absolute;left:8px;top:4px;font-size:9px;letter-spacing:.12em;color:rgba(244,238,230,.45);}
        .aw-composer-k{position:absolute;width:1px;height:1px;overflow:hidden;}
        .aw-input{flex:1;min-width:0;height:36px;background:transparent;border:0;color:#f4eee6;font-size:16px;outline:none;}
        .aw-send{height:32px;padding:0 14px;border:0;border-radius:999px;background:#f4eee6;color:#070605;font-size:11px;letter-spacing:.12em;cursor:pointer;}
        .aw-sheet{position:absolute;inset:48px 10px auto;z-index:5;background:#0c0a08;border:1px solid rgba(244,238,230,.2);padding:10px;display:flex;flex-direction:column;gap:8px;}
        .aw-sheet a{color:#f4eee6;text-decoration:none;font-size:12px;letter-spacing:.12em;padding:8px 0;border-bottom:1px solid rgba(244,238,230,.08);}
        .aw-browser{position:absolute;inset:72px 16px 16px;display:flex;flex-direction:column;border:1px solid rgba(244,238,230,.18);background:rgba(7,6,5,.35);min-height:0;}
        .aw-browser-bar{display:flex;align-items:center;gap:6px;padding:8px;border-bottom:1px solid rgba(244,238,230,.12);}
        .aw-dot{width:8px;height:8px;border-radius:99px;background:rgba(244,238,230,.28);}
        .aw-url{margin-left:8px;font-size:11px;letter-spacing:.08em;color:rgba(244,238,230,.55);}
        .aw-browser-body{flex:1;min-height:0;overflow:hidden;padding:12px;}
        .aw-site-nav{display:flex;gap:12px;font-size:11px;letter-spacing:.12em;margin-bottom:12px;color:rgba(244,238,230,.7);}
        .aw-hero-title{font-family:Georgia,serif;font-size:22px;margin:6px 0;}
        .aw-hero-sub{font-size:12px;color:rgba(244,238,230,.65);margin-bottom:12px;}
        .aw-cta{display:inline-flex;align-items:center;height:28px;padding:0 12px;border:1px solid rgba(244,238,230,.3);font-size:11px;letter-spacing:.12em;}
        .aw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .aw-card{border:1px solid rgba(244,238,230,.14);padding:8px;font-size:12px;}
        .aw-swatch{height:44px;margin-bottom:8px;background:linear-gradient(180deg,rgba(244,238,230,.2),rgba(244,238,230,.04));}
        .aw-price{color:#d7b07a;margin-top:4px;}
        .aw-story{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;line-height:1.45;}
        .aw-pay{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:12px;}
        .aw-sum{font-size:13px;}
        @media (max-width: 820px){
          .aw-nav,.aw-live,.aw-pro,.aw-dock,.aw-shot,.aw-hint{display:none;}
          .aw-go{display:inline-flex;}
          .aw-title{font-size:18px;}
          .aw-grid{grid-template-columns:repeat(2,1fr);}
          .aw-story{grid-template-columns:1fr;}
          .aw-browser{inset:64px 10px 10px;}
          .aw-cell{height:32px;font-size:9px;letter-spacing:.08em;}
        }
      `}</style>

      <header className="aw-top">
        <a className="aw-home" href="/">&lt; Home</a>
        <nav className="aw-nav">{NAV.map((item) => <a key={item.href + item.label} href={item.href}>{item.label}</a>)}</nav>
        <div className="aw-right">
          {signedIn ? <a className="aw-chip" href="/pricing">{creditLabel}</a> : <a className="aw-chip" href="/?auth=login">SIGN IN</a>}
          <span className="aw-live">LIVE</span><span className="aw-pro">PRO $9.99/MO</span>
          <button type="button" className="aw-chip aw-go" onClick={() => setGoOpen((v) => !v)}>GO</button>
        </div>
      </header>

      {goOpen && <div className="aw-sheet">{goLinks.map((item) => <a key={item.href + item.label} href={item.href} onClick={() => setGoOpen(false)}>{item.label}</a>)}</div>}

      <section className="aw-stage">
        <div className="aw-stage-bg" style={{ background: scene.gradient }} />
        <div className="aw-stage-copy"><div className="aw-kicker">{scene.label}</div><h1 className="aw-title">{scene.title}</h1><p className="aw-shot">{scene.shot}</p></div>
        {website ? <WebsiteMock scene={scene} /> : null}
      </section>

      <div className="aw-dock"><div className="aw-dock-k">{website ? "REVISE THIS PAGE / PRODUCTION CONTINUES" : "REVISE THIS SCENE / PRODUCTION CONTINUES"}</div><div className="aw-dock-t">{scene.dock}</div></div>

      <div className="aw-strip">{board.map((item, index) => <button key={item.id} type="button" className={index === selected ? "aw-cell on" : "aw-cell"} onClick={() => setSelected(index)}>{item.id} {item.status}</button>)}</div>
      <div className="aw-hint">{website ? "CLICK A PAGE TO REVISE IT WITHOUT RESTARTING THE JOB" : "CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB"}</div>

      <form className="aw-composer" data-mode={website ? "web" : "video"} onSubmit={(e) => { e.preventDefault(); onSend(); }}>
        <label className="aw-composer-k" htmlFor="aw-dir">direction</label>
        <input id="aw-dir" className="aw-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={website ? "Make this page like this?" : "Make this part like this?"} autoComplete="off" />
        <button className="aw-send" type="submit">SEND</button>
      </form>
    </div>
  );
}
