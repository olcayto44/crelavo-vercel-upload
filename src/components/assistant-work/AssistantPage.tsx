"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const AW = "aw5";
const THREAD_ID = "crelavo-aw-thread";
const FORGET_KEYS = ["crelavo-aw-last-v2", "crelavo-aw-last", "crelavo-aw-scene", "crelavo-aw-selected", "crelavo-aw-board"];

type CreditView =
  | { mode: "loading" }
  | { mode: "signin" }
  | { mode: "unknown" }
  | { mode: "number"; value: number };
type Shot = { kicker: string; title: string; body: string; cell: string };

const VIDEO_SHOTS: Shot[] = [
  { kicker: "SCENE 01 / SELECTED", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", cell: "01 READY" },
  { kicker: "SCENE 02 / SELECTED", title: "Hands lift the piece into frame", body: "Warm bounce. Turn the label to camera, then a slow orbit.", cell: "02 REVISING" },
  { kicker: "SCENE 03 / SELECTED", title: "Close on texture and a single drip", body: "Macro hold. Let the surface speak before the cut.", cell: "03 RENDERING" },
  { kicker: "SCENE 04 / SELECTED", title: "Pack shot, mark centered", body: "Soft falloff. End on the logo and hold.", cell: "04 QUEUED" },
];
const WEB_SHOTS: Shot[] = [
  { kicker: "PAGE 01 / HOME", title: "Home", body: "Hero, proof, and one clear start.", cell: "01 HOME" },
  { kicker: "PAGE 02 / CATALOG", title: "Catalog", body: "Products in a clean grid, price quiet.", cell: "02 CATALOG" },
  { kicker: "PAGE 03 / STORY", title: "Story", body: "Why it exists, in one scroll.", cell: "03 STORY" },
  { kicker: "PAGE 04 / CHECKOUT", title: "Checkout", body: "Price, trust, and one buy action.", cell: "04 CHECKOUT" },
];

export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}

function forgetStoredScene() {
  try {
    FORGET_KEYS.forEach((k) => {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    });
  } catch { /* ignore */ }
}
function boardKind(): "website" | "video" {
  if (typeof window === "undefined") return "video";
  const q = new URLSearchParams(window.location.search);
  const blob = `${q.get("type") || ""} ${q.get("category") || ""} ${window.location.pathname}`;
  return /website|web site|page/i.test(blob) ? "website" : "video";
}
function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
function tokenFromUnknown(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    if (t.startsWith("eyJ")) return t;
    return tokenFromUnknown(safeParse(t));
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.access_token === "string" && o.access_token.startsWith("eyJ")) return o.access_token;
    if (o.currentSession) return tokenFromUnknown(o.currentSession);
    if (o.session) return tokenFromUnknown(o.session);
    if (o.data) return tokenFromUnknown(o.data);
  }
  return null;
}
function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const scanStore = (store: Storage) => {
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i);
      if (!k || !/auth|supabase|sb-|token|session/i.test(k)) continue;
      const t = tokenFromUnknown(store.getItem(k));
      if (t) return t;
    }
    return null;
  };
  try { const a = scanStore(window.localStorage); if (a) return a; } catch { /* ignore */ }
  try { const b = scanStore(window.sessionStorage); if (b) return b; } catch { /* ignore */ }
  try {
    const map: Record<string, string> = {};
    (document.cookie || "").split(";").forEach((part) => {
      const idx = part.indexOf("=");
      if (idx < 0) return;
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      map[key] = val;
    });
    for (const [key, val] of Object.entries(map)) {
      if (/\.\d+$/.test(key)) continue;
      const t = tokenFromUnknown(val);
      if (t) return t;
    }
    const bases = new Set<string>();
    Object.keys(map).forEach((key) => {
      const m = key.match(/^(.*auth-token)\.(\d+)$/);
      if (m) bases.add(m[1]);
    });
    for (const base of bases) {
      let i = 0;
      let acc = "";
      while (map[`${base}.${i}`] != null) { acc += map[`${base}.${i}`]; i += 1; }
      const t = tokenFromUnknown(acc);
      if (t) return t;
    }
  } catch { /* ignore */ }
  return null;
}
function isCatalogPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.products) || Array.isArray(o.plans) || Array.isArray(o.packs)) return true;
  if (Array.isArray(o.prices) || Array.isArray(o.items) || Array.isArray(o.catalog)) return true;
  if (o.catalog && typeof o.catalog === "object") return true;
  return false;
}
function isAuthError(res: Response, data: unknown, text: string): boolean {
  if (res.status === 401 || res.status === 403) return true;
  const blob = `${text} ${typeof data === "object" && data ? JSON.stringify(data) : ""}`.toLowerCase();
  return blob.includes("user session is required") || blob.includes("sign_in") || blob.includes("not authenticated") || blob.includes("unauthorized");
}
function parseCredits(data: unknown): number | null {
  if (data == null) return null;
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (typeof data === "string" && data.trim() !== "" && Number.isFinite(Number(data))) return Number(data);
  if (typeof data !== "object" || isCatalogPayload(data)) return null;
  const o = data as Record<string, unknown>;
  const keys = ["balance", "credits", "credit_balance", "available", "remaining", "amount", "total"];
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  if (o.data && typeof o.data === "object") return parseCredits(o.data);
  if (o.user && typeof o.user === "object") return parseCredits(o.user);
  if (o.wallet && typeof o.wallet === "object") return parseCredits(o.wallet);
  return null;
}
async function fetchCreditsOnce(): Promise<CreditView> {
  const token = readAccessToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const urls = ["/api/credits/balance", "/api/credits"];
  let sawAuthError = false;
  let sawOther = false;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "GET", credentials: "include", headers, cache: "no-store" });
      const text = await res.text();
      let data: unknown = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (isAuthError(res, data, text)) { sawAuthError = true; continue; }
      const n = parseCredits(data);
      if (n != null) return { mode: "number", value: n };
      sawOther = true;
    } catch { sawOther = true; }
  }
  if (sawAuthError && !token) return { mode: "signin" };
  if (sawAuthError && token) return { mode: "unknown" };
  if (sawOther) return { mode: "unknown" };
  return token ? { mode: "unknown" } : { mode: "signin" };
}
function useViewport() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setSize({ w: Math.round(vv?.width ?? window.innerWidth), h: Math.round(vv?.height ?? window.innerHeight) });
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);
  return size;
}

export function AssistantPage() {
  const [mounted, setMounted] = useState(false);
  const [kind, setKind] = useState<"website" | "video">("video");
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState("");
  const [shots, setShots] = useState<Shot[]>(VIDEO_SHOTS);
  const [credits, setCredits] = useState<CreditView>({ mode: "loading" });
  const view = useViewport();
  useEffect(() => {
    forgetStoredScene();
    setKind(boardKind());
    setShots(boardKind() === "website" ? WEB_SHOTS.map((s) => ({ ...s })) : VIDEO_SHOTS.map((s) => ({ ...s })));
    setSelected(0);
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, htmlHeight: html.style.height, bodyHeight: body.style.height, htmlOverscroll: html.style.overscrollBehavior, bodyOverscroll: body.style.overscrollBehavior };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    const hidden: Array<{ el: HTMLElement; display: string }> = [];
    document.querySelectorAll("footer").forEach((node) => {
      const el = node as HTMLElement;
      hidden.push({ el, display: el.style.display });
      el.style.display = "none";
    });
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.height = prev.htmlHeight;
      body.style.height = prev.bodyHeight;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      hidden.forEach(({ el, display }) => { el.style.display = display; });
    };
  }, [mounted]);
  const loadCredits = useCallback(async () => { const next = await fetchCreditsOnce(); setCredits(next); }, []);
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => { const next = await fetchCreditsOnce(); if (!cancelled) setCredits(next); })();
    const onFocus = () => { loadCredits(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [mounted, loadCredits]);
  const shot = shots[selected] || shots[0];
  const onSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setShots((prev) => prev.map((item, i) => (i === selected ? { ...item, body: text } : item)));
    setDraft("");
  }, [draft, selected]);
  const creditLabel = useMemo(() => {
    if (credits.mode === "loading") return "\u2026";
    if (credits.mode === "number") return new Intl.NumberFormat("en-US").format(credits.value);
    if (credits.mode === "unknown") return "--";
    return null;
  }, [credits]);
  if (!mounted || typeof document === "undefined") return null;

  const ui = (
    <div id={THREAD_ID} data-aw={AW} style={{ position: "fixed", inset: 0, width: view.w ? `${view.w}px` : "100vw", height: view.h ? `${view.h}px` : "100dvh", zIndex: 2147483646, overflow: "hidden", background: "#070605", color: "#f4eee6", display: "flex", flexDirection: "column", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        #${THREAD_ID} * { box-sizing: border-box; }
        #${THREAD_ID} a { color: inherit; text-decoration: none; }
        #${THREAD_ID} button, #${THREAD_ID} input { font: inherit; }
        #${THREAD_ID} .aw-nav { display: flex; gap: 18px; align-items: center; letter-spacing: 0.14em; font-size: 11px; color: rgba(244,238,230,0.72); text-transform: uppercase; }
        #${THREAD_ID} .aw-pill { border: 1px solid rgba(244,238,230,0.35); border-radius: 999px; padding: 6px 12px; background: transparent; color: #f4eee6; cursor: pointer; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
        #${THREAD_ID} .aw-live { font-size: 10px; letter-spacing: 0.14em; color: rgba(244,238,230,0.7); text-transform: uppercase; white-space: nowrap; }
        #${THREAD_ID} .aw-desk { display: flex; }
        #${THREAD_ID} .aw-credits { min-width: 52px; text-align: center; font-variant-numeric: tabular-nums; }
        #${THREAD_ID} .aw-stage { flex: 1; min-height: 0; position: relative; background: linear-gradient(180deg, #c4a06a 0%, #7a4e28 42%, #140c08 100%); }
        #${THREAD_ID} .aw-caption { position: absolute; left: 22px; right: 22px; bottom: 18px; }
        #${THREAD_ID} .aw-kicker { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(244,238,230,0.7); margin-bottom: 8px; }
        #${THREAD_ID} .aw-title { font-family: Georgia, "Times New Roman", serif; font-size: 28px; line-height: 1.15; font-weight: 400; margin: 0 0 6px; }
        #${THREAD_ID} .aw-body { margin: 0; font-size: 13px; color: rgba(244,238,230,0.82); }
        #${THREAD_ID} .aw-dock { background: #070605; padding: 8px 12px 12px; flex: 0 0 auto; }
        #${THREAD_ID} .aw-revise { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(244,238,230,0.55); margin: 0 0 6px; }
        #${THREAD_ID} .aw-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid rgba(244,238,230,0.18); margin-bottom: 8px; }
        #${THREAD_ID} .aw-cell { background: transparent; color: rgba(244,238,230,0.55); border: 0; border-right: 1px solid rgba(244,238,230,0.18); padding: 10px 6px; cursor: pointer; letter-spacing: 0.16em; font-size: 10px; text-transform: uppercase; }
        #${THREAD_ID} .aw-cell:last-child { border-right: 0; }
        #${THREAD_ID} .aw-cell.on { background: rgba(244,238,230,0.12); color: #f4eee6; }
        #${THREAD_ID} .aw-row { display: flex; gap: 8px; align-items: center; }
        #${THREAD_ID} .aw-input { flex: 1; min-width: 0; background: transparent; color: #f4eee6; border: 1px solid rgba(244,238,230,0.22); border-radius: 999px; padding: 10px 16px; outline: none; }
        #${THREAD_ID} .aw-send { border: 0; border-radius: 999px; background: #f4eee6; color: #070605; padding: 10px 16px; cursor: pointer; letter-spacing: 0.12em; font-size: 11px; font-weight: 600; }
        @media (max-width: 720px) {
          #${THREAD_ID} .aw-desk { display: none; }
          #${THREAD_ID} .aw-title { font-size: 22px; }
          #${THREAD_ID} .aw-caption { left: 16px; right: 16px; bottom: 14px; }
          #${THREAD_ID} .aw-cell { letter-spacing: 0.08em; font-size: 9px; padding: 10px 2px; }
        }
      `}</style>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "#070605", flex: "0 0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <a className="aw-pill" href="/">&lt; HOME</a>
          <nav className="aw-nav aw-desk"><a href="/">Crelavo</a><a href="/dashboard">Dashboard</a><a href="/pricing">Credits</a><a href="/dashboard/productions">Productions</a></nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {creditLabel == null ? <a className="aw-pill" href="/?auth=login">Sign in</a> : <a className="aw-pill aw-credits" href="/pricing" title="Credits">{creditLabel}</a>}
          <a className="aw-live" href="/pricing">Live &middot; Pro $9.99/mo</a>
        </div>
      </header>
      <div className="aw-stage">
        <div className="aw-caption"><div className="aw-kicker">{shot.kicker}</div><h1 className="aw-title">{shot.title}</h1><p className="aw-body">{shot.body}</p></div>
      </div>
      <div className="aw-dock">
        <p className="aw-revise">Revise this scene / production continues</p>
        <div className="aw-strip">
          {shots.map((item, i) => <button key={item.cell} type="button" className={i === selected ? "aw-cell on" : "aw-cell"} onClick={() => setSelected(i)}>{item.cell}</button>)}
        </div>
        <form className="aw-row" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
          <input className="aw-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Make this part like this?" autoComplete="off" />
          <button className="aw-send" type="submit">SEND</button>
        </form>
      </div>
    </div>
  );
  return createPortal(ui, document.body);
}

export default AssistantPage;
