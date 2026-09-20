"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
type CreditState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "unknown" }
  | { kind: "number"; value: number };
type BoardItem = { n: string; status: string; kicker: string; title: string; body: string; tone: string };
const VIDEO_BOARD: BoardItem[] = [
  { n: "01", status: "READY", kicker: "SCENE 01 / SELECTED", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", tone: "linear-gradient(180deg,#c4a06a 0%,#6a4a28 42%,#1a120c 100%)" },
  { n: "02", status: "REVISING", kicker: "SCENE 02 / SELECTED", title: "Close-up turn, warm rim light on the label", body: "Product rotates. Glass catches a highlight. Hold on the mark.", tone: "linear-gradient(180deg,#d7b48a 0%,#8a5a32 40%,#140e0a 100%)" },
  { n: "03", status: "RENDERING", kicker: "SCENE 03 / SELECTED", title: "Hands sleeve the product in kraft paper", body: "Fingers fold. Tape press. Small pause before the lift.", tone: "linear-gradient(180deg,#b08968 0%,#5c3d2a 44%,#100c09 100%)" },
  { n: "04", status: "QUEUED", kicker: "SCENE 04 / SELECTED", title: "Night counter, one lamp, slow pullback", body: "Practical light only. Room falls off. End on the silhouette.", tone: "linear-gradient(180deg,#8a6a4a 0%,#3a281c 46%,#0b0907 100%)" },
];
const WEBSITE_BOARD: BoardItem[] = [
  { n: "01", status: "HOME", kicker: "PAGE 01 / HOME", title: "Home", body: "Hero, proof, and one clear start.", tone: "linear-gradient(180deg,#c4a06a 0%,#6a4a28 42%,#1a120c 100%)" },
  { n: "02", status: "CATALOG", kicker: "PAGE 02 / CATALOG", title: "Catalog", body: "Grid of products, price, one add action.", tone: "linear-gradient(180deg,#d7b48a 0%,#8a5a32 40%,#140e0a 100%)" },
  { n: "03", status: "STORY", kicker: "PAGE 03 / STORY", title: "Story", body: "Brand proof, materials, why it exists.", tone: "linear-gradient(180deg,#b08968 0%,#5c3d2a 44%,#100c09 100%)" },
  { n: "04", status: "CHECKOUT", kicker: "PAGE 04 / CHECKOUT", title: "Checkout", body: "Order summary, pay, confirmation.", tone: "linear-gradient(180deg,#8a6a4a 0%,#3a281c 46%,#0b0907 100%)" },
];
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
const BALANCE_KEYS = ["balance", "credits", "credit_balance", "available_credits", "remaining_credits", "available", "remaining"];
export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}
function isJwt(value: unknown): value is string { return typeof value === "string" && JWT_RE.test(value); }
function pickJwt(value: unknown): string | null {
  if (isJwt(value)) { const found = value.match(JWT_RE); return found ? found[0] : null; }
  return null;
}
function decodeMaybe(raw: string): string {
  let value = raw;
  try { value = decodeURIComponent(value); } catch { /* keep */ }
  if (value.startsWith("base64-")) { try { value = atob(value.slice(7)); } catch { /* keep */ } }
  return value;
}
function tokenFromUnknown(input: unknown, depth = 0): string | null {
  if (input == null || depth > 6) return null;
  const jwt = pickJwt(input);
  if (jwt) return jwt;
  if (typeof input === "string") {
    const trimmed = decodeMaybe(input).trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { return tokenFromUnknown(JSON.parse(trimmed), depth + 1); } catch { return pickJwt(trimmed); }
    }
    return pickJwt(trimmed);
  }
  if (Array.isArray(input)) {
    for (const item of input) { const found = tokenFromUnknown(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof input === "object") {
    const rec = input as Record<string, unknown>;
    for (const key of ["access_token", "accessToken", "token"]) {
      if (key in rec) { const found = tokenFromUnknown(rec[key], depth + 1); if (found) return found; }
    }
    if (rec.currentSession) { const found = tokenFromUnknown(rec.currentSession, depth + 1); if (found) return found; }
    if (rec.session) { const found = tokenFromUnknown(rec.session, depth + 1); if (found) return found; }
    for (const value of Object.values(rec)) { const found = tokenFromUnknown(value, depth + 1); if (found) return found; }
  }
  return null;
}
function readStorageStores(): Array<Storage | null> {
  try { return [window.localStorage, window.sessionStorage]; } catch { return []; }
}
function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const store of readStorageStores()) {
    if (!store) continue;
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key) continue;
      if (!/sb-.*auth|supabase|access.token|crelavo.*auth|auth-token/i.test(key) && !key.includes("auth-token")) {
        if (!key.startsWith("sb-")) continue;
      }
      try { const found = tokenFromUnknown(store.getItem(key)); if (found) return found; } catch { /* next */ }
    }
  }
  try {
    const cookieMap = new Map<string, string[]>();
    for (const part of document.cookie.split(";")) {
      const idx = part.indexOf("=");
      if (idx < 0) continue;
      const name = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!name) continue;
      const list = cookieMap.get(name) || [];
      list.push(value);
      cookieMap.set(name, list);
    }
    const names = Array.from(cookieMap.keys()).sort();
    const joined = new Map<string, string>();
    for (const name of names) {
      const chunk = name.match(/^(.*-auth-token)\.(\d+)$/);
      if (chunk) {
        const base = chunk[1];
        joined.set(base, (joined.get(base) || "") + (cookieMap.get(name)?.[0] || ""));
      }
    }
    for (const [name, values] of cookieMap) {
      if (!/sb-|supabase|auth-token|access/i.test(name)) continue;
      for (const value of values) { const found = tokenFromUnknown(value); if (found) return found; }
    }
    for (const value of joined.values()) { const found = tokenFromUnknown(value); if (found) return found; }
  } catch { /* ignore cookie parse */ }
  return null;
}
function isCatalogPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  if (Array.isArray(rec.plans) || Array.isArray(rec.products) || Array.isArray(rec.packs)) return true;
  if (Array.isArray(rec.prices) || rec.catalog || rec.pricing) return true;
  return false;
}
function isSignedOutPayload(data: unknown, status?: number): boolean {
  if (status === 401 || status === 403) return true;
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  const blob = `${rec.error || ""} ${rec.message || ""} ${rec.code || ""}`.toLowerCase();
  if (blob.includes("session") || blob.includes("sign_in") || blob.includes("sign in")) return true;
  if (blob.includes("unauthorized") || blob.includes("unauthenticated")) return true;
  if (rec.ok === false && String(rec.code) === "sign_in") return true;
  return false;
}
function pickBalance(data: unknown): number | null {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (typeof data === "string" && data.trim() !== "" && Number.isFinite(Number(data))) return Number(data);
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data) || isCatalogPayload(data)) return null;
  const rec = data as Record<string, unknown>;
  for (const key of BALANCE_KEYS) {
    if (!(key in rec)) continue;
    const value = rec[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}
function parseCredits(data: unknown, status?: number): CreditState {
  if (isSignedOutPayload(data, status)) return { kind: "signed_out" };
  if (isCatalogPayload(data)) return { kind: "unknown" };
  const roots = [data, data && typeof data === "object" ? (data as Record<string, unknown>).data : null, data && typeof data === "object" ? (data as Record<string, unknown>).result : null];
  for (const root of roots) { const n = pickBalance(root); if (n != null) return { kind: "number", value: n }; }
  return { kind: "unknown" };
}
function formatCredits(value: number): string { return new Intl.NumberFormat("en-US").format(value); }
function boardKindFromLocation(): "video" | "website" {
  if (typeof window === "undefined") return "video";
  const query = new URLSearchParams(window.location.search);
  const type = `${query.get("type") || ""} ${query.get("category") || ""}`.toLowerCase();
  if (type.includes("website") || type.includes("site")) return "website";
  return "video";
}
function forgetStoredSceneTwo() {
  for (const store of readStorageStores()) {
    if (!store) continue;
    for (const key of ["crelavo-aw-last-v2", "crelavo-aw-last", "crelavo-aw-selected"]) {
      try {
        const raw = store.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          delete parsed.selected;
          delete parsed.selectedIndex;
          delete parsed.scene;
          delete parsed.sceneIndex;
          store.setItem(key, JSON.stringify(parsed));
        }
      } catch { /* leave */ }
    }
  }
}
async function loadCredits(): Promise<CreditState> {
  const token = readAccessToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const urls = ["/api/credits/balance", "/api/credits"];
  let sawSignedOut = false;
  let sawUnknown = false;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "GET", credentials: "same-origin", headers, cache: "no-store" });
      let data: unknown = null;
      const text = await res.text();
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      const parsed = parseCredits(data, res.status);
      if (parsed.kind === "number") return parsed;
      if (parsed.kind === "signed_out") sawSignedOut = true;
      if (parsed.kind === "unknown") sawUnknown = true;
    } catch { sawUnknown = true; }
  }
  if (token && sawUnknown) return { kind: "unknown" };
  if (sawSignedOut && !token) return { kind: "signed_out" };
  if (sawSignedOut && token) return { kind: "unknown" };
  if (token) return { kind: "unknown" };
  return { kind: "signed_out" };
}
export default function AssistantPage() {
  const [kind, setKind] = useState<"video" | "website">("video");
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState("");
  const [credits, setCredits] = useState<CreditState>({ kind: "loading" });
  const [goOpen, setGoOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [frame, setFrame] = useState({ width: 0, height: 0, fill: false });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const board = kind === "website" ? WEBSITE_BOARD : VIDEO_BOARD;
  const item = board[selected] ?? board[0];
  const measure = useCallback(() => {
    const slot = slotRef.current;
    const width = typeof window !== "undefined" ? window.innerWidth : 1440;
    const isNarrow = width < 720;
    setNarrow(isNarrow);
    if (!slot) return;
    const sw = slot.clientWidth;
    const sh = slot.clientHeight;
    if (sw < 8 || sh < 8) return;
    if (isNarrow) { setFrame({ width: sw, height: sh, fill: true }); return; }
    const byWidth = sw;
    const byHeight = sh * (16 / 9);
    const frameW = Math.max(1, Math.min(byWidth, byHeight));
    const frameH = frameW * (9 / 16);
    setFrame({ width: frameW, height: Math.min(frameH, sh), fill: false });
  }, []);
  useEffect(() => { setKind(boardKindFromLocation()); setSelected(0); forgetStoredSceneTwo(); }, []);
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const hidden: Array<{ el: HTMLElement; v: string }> = [];
    document.querySelectorAll("footer").forEach((el) => {
      hidden.push({ el: el as HTMLElement, v: (el as HTMLElement).style.visibility });
      (el as HTMLElement).style.visibility = "hidden";
    });
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      hidden.forEach(({ el, v }) => { el.style.visibility = v; });
    };
  }, []);
  useEffect(() => {
    measure();
    const slot = slotRef.current;
    const ro = slot ? new ResizeObserver(() => measure()) : null;
    if (slot && ro) ro.observe(slot);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => { ro?.disconnect(); window.removeEventListener("resize", onResize); window.visualViewport?.removeEventListener("resize", onResize); };
  }, [measure]);
  useEffect(() => {
    let alive = true;
    const run = async () => { const next = await loadCredits(); if (alive) setCredits(next); };
    run();
    const id = window.setInterval(run, 15000);
    const onVis = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  const creditLabel = useMemo(() => {
    if (credits.kind === "loading") return "...";
    if (credits.kind === "signed_out") return "SIGN IN";
    if (credits.kind === "unknown") return "--";
    return formatCredits(credits.value);
  }, [credits]);
  const creditHref = credits.kind === "signed_out" ? "/?auth=login" : "/pricing";
  function onSend() {
    const text = draft.trim();
    if (!text) return;
    setNotes((prev) => ({ ...prev, [selected]: text }));
    setDraft("");
  }
  return (
    <div id="crelavo-aw-thread" ref={shellRef} style={S.shell}>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <a href="/" style={S.home}>&lt; Home</a>
          <a href="/" style={S.nav}>CRELAVO</a>
          <a href="/dashboard" style={S.nav}>DASHBOARD</a>
          <a href="/pricing" style={S.nav}>CREDITS</a>
          <a href="/dashboard/productions" style={S.nav}>PRODUCTIONS</a>
        </div>
        <div style={S.headerRight}>
          {narrow ? <button type="button" style={S.go} onClick={() => setGoOpen(true)}>GO</button> : null}
          <a href={creditHref} style={S.sign}>{creditLabel}</a>
          <span style={S.live}>LIVE · PRO $9.99/MO</span>
        </div>
      </header>
      <div ref={slotRef} style={S.slot}>
        <div key={`${kind}-${item.n}`} style={{ ...S.stage, width: frame.width || "100%", height: frame.height || "100%", background: item.tone, borderRadius: frame.fill ? 0 : 2 }}>
          <div style={S.stageCopy}>
            <div style={S.kicker}>{item.kicker}</div>
            <div style={S.title}>{item.title}</div>
            <div style={S.body}>{notes[selected] || item.body}</div>
          </div>
        </div>
      </div>
      <div style={S.dock}>
        <div style={S.reviseLabel}>REVISE THIS SCENE / PRODUCTION CONTINUES</div>
        <div style={S.strip}>
          {board.map((entry, index) => (
            <button key={entry.n} type="button" onClick={() => setSelected(index)} style={{ ...S.stripBtn, background: index === selected ? "#2a2a2a" : "transparent" }}>{entry.n} {entry.status}</button>
          ))}
        </div>
        <div style={S.composer}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSend(); }} placeholder="Make this part like this?" style={S.input} />
          <button type="button" onClick={onSend} style={S.send}>SEND</button>
        </div>
      </div>
      {goOpen ? (
        <div style={S.sheet} onClick={() => setGoOpen(false)}>
          <div style={S.sheetCard} onClick={(e) => e.stopPropagation()}>
            <a href="/" style={S.sheetLink}>Home</a>
            <a href="/dashboard" style={S.sheetLink}>Dashboard</a>
            <a href="/pricing" style={S.sheetLink}>Credits</a>
            <a href="/dashboard/productions" style={S.sheetLink}>Productions</a>
            <a href={creditHref} style={S.sheetLink}>{creditLabel}</a>
            <button type="button" style={S.sheetClose} onClick={() => setGoOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
const S: Record<string, React.CSSProperties> = {
  shell: { position: "fixed", inset: 0, zIndex: 2147483000, display: "flex", flexDirection: "column", background: "#070605", color: "#f4eee6", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" },
  header: { height: 52, flex: "0 0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid rgba(244,238,230,0.08)", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  home: { display: "inline-flex", alignItems: "center", height: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(244,238,230,0.14)", color: "#f4eee6", textDecoration: "none", fontSize: 12 },
  nav: { color: "rgba(244,238,230,0.72)", textDecoration: "none", fontSize: 11, letterSpacing: "0.12em" },
  sign: { display: "inline-flex", alignItems: "center", height: 28, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(244,238,230,0.18)", color: "#f4eee6", textDecoration: "none", fontSize: 11, letterSpacing: "0.08em" },
  live: { fontSize: 10, letterSpacing: "0.12em", color: "rgba(244,238,230,0.55)" },
  go: { height: 28, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(244,238,230,0.18)", background: "transparent", color: "#f4eee6", fontSize: 11, letterSpacing: "0.12em" },
  slot: { flex: "1 1 auto", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  stage: { position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(244,238,230,0.08)" },
  stageCopy: { position: "absolute", left: 24, right: 24, bottom: 24, color: "#f4eee6" },
  kicker: { fontSize: 11, letterSpacing: "0.18em", opacity: 0.7, marginBottom: 8 },
  title: { fontFamily: "Georgia, Times, serif", fontSize: 28, lineHeight: 1.15, marginBottom: 6 },
  body: { fontSize: 14, opacity: 0.82, maxWidth: 640 },
  dock: { flex: "0 0 auto", borderTop: "1px solid rgba(244,238,230,0.08)", padding: "8px 12px 12px" },
  reviseLabel: { fontSize: 10, letterSpacing: "0.16em", color: "rgba(244,238,230,0.45)", marginBottom: 8 },
  strip: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginBottom: 10 },
  stripBtn: { height: 36, border: "1px solid rgba(244,238,230,0.12)", color: "rgba(244,238,230,0.8)", fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" },
  composer: { display: "flex", gap: 8, alignItems: "center" },
  input: { flex: 1, height: 40, borderRadius: 999, border: "1px solid rgba(244,238,230,0.16)", background: "transparent", color: "#f4eee6", padding: "0 16px", fontSize: 14, outline: "none" },
  send: { height: 40, padding: "0 16px", borderRadius: 999, border: "none", background: "#f4eee6", color: "#140e0a", fontSize: 12, letterSpacing: "0.12em", cursor: "pointer" },
  sheet: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheetCard: { width: "100%", background: "#120e0c", padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  sheetLink: { color: "#f4eee6", textDecoration: "none", padding: "10px 4px", borderBottom: "1px solid rgba(244,238,230,0.08)" },
  sheetClose: { marginTop: 8, height: 40, borderRadius: 999, border: "1px solid rgba(244,238,230,0.18)", background: "transparent", color: "#f4eee6" },
};
