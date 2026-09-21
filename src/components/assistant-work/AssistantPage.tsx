"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
const AW = "aw6";
const THREAD = "crelavo-aw-thread";
const FORGET_KEYS = ["crelavo-aw-last-v2", "crelavo-aw-last", "crelavo-aw-scene", "crelavo-aw-selected"];
type CreditState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "unknown" }
  | { kind: "number"; value: number };
type Shot = { id: number; label: string; title: string; body: string; status: string; mediaUrl: string | null };
export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}
function readQuery() {
  if (typeof window === "undefined") return { type: "AI Video", category: "video" };
  const q = new URLSearchParams(window.location.search);
  return { type: q.get("type") || "AI Video", category: q.get("category") || "video" };
}
function isWebsiteType(type: string, category: string) { return /website/i.test(type) || /website/i.test(category); }
function fromAuthJson(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const v = JSON.parse(trimmed);
    if (typeof v === "string" && v.split(".").length === 3) return v;
    if (v && typeof v === "object") {
      const rec = v as Record<string, unknown>;
      if (typeof rec.access_token === "string") return rec.access_token;
      const session = rec.currentSession;
      if (session && typeof session === "object" && typeof (session as Record<string, unknown>).access_token === "string") return (session as Record<string, unknown>).access_token as string;
    }
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].split(".").length === 3) return v[0];
  } catch { if (trimmed.split(".").length === 3) return trimmed; }
  return null;
}
function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const stores = [window.localStorage, window.sessionStorage];
  for (const store of stores) {
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i);
      if (!k || !/auth-token|access_token|sb-.*token/i.test(k)) continue;
      const t = fromAuthJson(store.getItem(k));
      if (t) return t;
    }
  }
  const cookies = document.cookie.split(";").map((s) => s.trim());
  const chunks: Record<string, string[]> = {};
  for (const c of cookies) {
    const eq = c.indexOf("=");
    if (eq < 0) continue;
    const name = c.slice(0, eq);
    let val = c.slice(eq + 1);
    try { val = decodeURIComponent(val); } catch { /* keep raw */ }
    const m = name.match(/^(sb-.*-auth-token)(?:\.(\d+))?$/);
    if (m) {
      const idx = m[2] ? Number(m[2]) : 0;
      if (!chunks[m[1]]) chunks[m[1]] = [];
      chunks[m[1]][idx] = val;
    }
    const t = fromAuthJson(val);
    if (t) return t;
  }
  for (const parts of Object.values(chunks)) {
    const t = fromAuthJson(parts.filter(Boolean).join(""));
    if (t) return t;
  }
  return null;
}
function looksLikeCatalog(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.plans) || Array.isArray(o.packages) || Array.isArray(o.products)) return true;
  if (o.pricing || o.pro_credits || o.catalog) return true;
  return false;
}
function asInt(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return Math.trunc(n);
  if (typeof n === "string" && n.trim() && Number.isFinite(Number(n))) return Math.trunc(Number(n));
  return null;
}
function parseCredits(data: unknown): number | null {
  if (!data || typeof data !== "object" || looksLikeCatalog(data)) return null;
  const o = data as Record<string, unknown>;
  for (const k of ["balance", "credits", "credit_balance", "available", "remaining"]) {
    const n = asInt(o[k]);
    if (n != null) return n;
  }
  if (o.data && typeof o.data === "object") return parseCredits(o.data);
  return null;
}
function isSessionError(data: unknown, status: number): boolean {
  if (status === 401) return true;
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  const code = String(o.code || "");
  const err = String(o.error || o.message || "");
  if (code === "sign_in") return true;
  return /session is required|sign in/i.test(err);
}
function isInsufficient(data: unknown, status: number): boolean {
  if (status === 402) return true;
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  const code = String(o.code || "");
  const err = String(o.error || o.message || "");
  if (/insufficient|no_credits|empty_balance|zero_balance/i.test(code)) return true;
  return /not enough credit|insufficient credit|no credits/i.test(err);
}
function pickStr(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
async function cinemaFetch(url: string, init: RequestInit): Promise<Response> {
  const token = readAccessToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, credentials: "include", cache: "no-store" });
}
function videoShots(): Shot[] {
  return [
    { id: 1, label: "READY", status: "READY", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", mediaUrl: null },
    { id: 2, label: "REVISING", status: "REVISING", title: "Hands enter the beam and turn the bottle", body: "Skin, glass, label. Keep the same window light.", mediaUrl: null },
    { id: 3, label: "RENDERING", status: "RENDERING", title: "Close-up: texture, pour, catch-light", body: "Slow enough to read the grain. No extra cuts.", mediaUrl: null },
    { id: 4, label: "QUEUED", status: "QUEUED", title: "Hold on the shelf. One line. Cut.", body: "Product still. Quiet end card. Same room.", mediaUrl: null },
  ];
}
function websiteShots(): Shot[] {
  return [
    { id: 1, label: "HOME", status: "HOME", title: "Home", body: "Hero, proof, and one clear start.", mediaUrl: null },
    { id: 2, label: "CATALOG", status: "CATALOG", title: "Catalog", body: "Quiet grid. Product first, noise last.", mediaUrl: null },
    { id: 3, label: "STORY", status: "STORY", title: "Story", body: "Why it exists, told in one screen.", mediaUrl: null },
    { id: 4, label: "CHECKOUT", status: "CHECKOUT", title: "Checkout", body: "Buy path with no extra noise.", mediaUrl: null },
  ];
}
function applyPayload(shot: Shot, data: unknown, prompt: string, website: boolean): Shot {
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const scene = root.scene && typeof root.scene === "object" ? (root.scene as Record<string, unknown>) : root;
  const title = pickStr(scene, ["title", "headline", "name"]);
  const body = pickStr(scene, ["body", "copy", "description", "subtitle"]);
  const media = pickStr(scene, ["url", "media_url", "file_url", "video_url", "image_url", "output_url"]);
  return { ...shot, title: title || shot.title, body: body || prompt || shot.body, mediaUrl: media || shot.mediaUrl, status: website ? shot.status : "READY", label: website ? shot.label : "READY" };
}
export default function AssistantPage() {
  const { type, category } = useMemo(() => readQuery(), []);
  const website = isWebsiteType(type, category);
  const [mounted, setMounted] = useState(false);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(0);
  const [shots, setShots] = useState<Shot[]>(() => (website ? websiteShots() : videoShots()));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("REVISE THIS SCENE / PRODUCTION CONTINUES");
  const [credits, setCredits] = useState<CreditState>({ kind: "loading" });
  const loadCredits = useCallback(async () => {
    const token = readAccessToken();
    let number: number | null = null;
    let hadPayload = false;
    let networkError = false;
    for (const url of ["/api/credits/balance", "/api/credits"]) {
      try {
        const res = await cinemaFetch(url, { method: "GET" });
        const data = await res.json().catch(() => null);
        if (isSessionError(data, res.status)) continue;
        hadPayload = true;
        const n = parseCredits(data);
        if (n != null) { number = n; break; }
      } catch { networkError = true; }
    }
    if (number != null) { setCredits({ kind: "number", value: number }); return; }
    if (token || hadPayload || networkError) { setCredits({ kind: "unknown" }); return; }
    setCredits({ kind: "signed_out" });
  }, []);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const k of FORGET_KEYS) {
      try { window.localStorage.removeItem(k); window.sessionStorage.removeItem(k); } catch { /* ignore */ }
    }
  }, []);
  useEffect(() => {
    const read = () => {
      const vv = window.visualViewport;
      setVp({ w: Math.round(vv?.width ?? window.innerWidth), h: Math.round(vv?.height ?? window.innerHeight) });
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
    };
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const footers = Array.from(document.querySelectorAll("footer"));
    const prevDisplay = footers.map((f) => (f as HTMLElement).style.display);
    footers.forEach((f) => { (f as HTMLElement).style.display = "none"; });
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      footers.forEach((f, i) => { (f as HTMLElement).style.display = prevDisplay[i] || ""; });
    };
  }, [mounted]);
  useEffect(() => { if (mounted) void loadCredits(); }, [mounted, loadCredits]);
  const shot = shots[selected] || shots[0];
  const kicker = website ? `PAGE ${String(shot.id).padStart(2, "0")} / ${shot.label}` : `SCENE ${String(shot.id).padStart(2, "0")} / SELECTED`;
  const creditLabel = credits.kind === "loading" ? "..." : credits.kind === "signed_out" ? "SIGN IN" : credits.kind === "unknown" ? "--" : String(credits.value);
  async function onSend() {
    const prompt = draft.trim();
    if (!prompt || sending) return;
    if (credits.kind === "signed_out") { window.location.href = "/?auth=login"; return; }
    if (credits.kind === "number" && credits.value <= 0) { setNotice("NOT ENOUGH CREDITS / PRODUCTION STOPPED"); return; }
    const prev = shots[selected];
    setSending(true);
    setNotice("REVISING THIS SCENE / PRODUCTION CONTINUES");
    setShots((cur) => cur.map((s, i) => i === selected ? { ...s, status: website ? s.status : "REVISING", label: website ? s.label : "REVISING" } : s));
    try {
      const res = await cinemaFetch("/api/assistant-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", prompt, type, category, scene: selected + 1 }),
      });
      const data = await res.json().catch(() => null);
      if (isSessionError(data, res.status)) {
        setShots((cur) => cur.map((s, i) => (i === selected ? prev : s)));
        setCredits({ kind: "signed_out" });
        setNotice("SIGN IN TO START PRODUCTION");
        setSending(false);
        return;
      }
      if (isInsufficient(data, res.status)) {
        setShots((cur) => cur.map((s, i) => (i === selected ? prev : s)));
        setNotice("NOT ENOUGH CREDITS / PRODUCTION STOPPED");
        await loadCredits();
        setSending(false);
        return;
      }
      if (!res.ok || !data || data.ok === false) {
        setShots((cur) => cur.map((s, i) => (i === selected ? prev : s)));
        const msg = data && typeof data === "object" ? String((data as Record<string, unknown>).message || (data as Record<string, unknown>).error || "") : "";
        setNotice(msg.trim() ? msg.trim().toUpperCase() : "PRODUCTION DID NOT START / TRY AGAIN");
        setSending(false);
        return;
      }
      const next = applyPayload(prev, data, prompt, website);
      setShots((cur) => cur.map((s, i) => (i === selected ? next : s)));
      setDraft("");
      setNotice("REVISE THIS SCENE / PRODUCTION CONTINUES");
      const maybeBal = parseCredits(data);
      if (maybeBal != null) setCredits({ kind: "number", value: maybeBal });
      else await loadCredits();
    } catch {
      setShots((cur) => cur.map((s, i) => (i === selected ? prev : s)));
      setNotice("PRODUCTION DID NOT START / TRY AGAIN");
      setCredits((cur) => (cur.kind === "signed_out" ? cur : { kind: "unknown" }));
    }
    setSending(false);
  }
  if (!mounted) return null;
  const shell = (
    <div id={THREAD} data-aw={AW} style={{ position: "fixed", inset: 0, width: vp.w ? `${vp.w}px` : "100vw", height: vp.h ? `${vp.h}px` : "100dvh", overflow: "hidden", zIndex: 9999, display: "flex", flexDirection: "column", background: "#070605", color: "rgb(244, 238, 230)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`#${THREAD}, #${THREAD} * { box-sizing: border-box; } #${THREAD} a { color: inherit; text-decoration: none; } #${THREAD} button, #${THREAD} input { font-family: inherit; }`}</style>
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 18, padding: "10px 16px", background: "#070605" }}>
        <a href="/" style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>&lt; HOME</a>
        <nav style={{ display: "flex", gap: 16, fontSize: 11, letterSpacing: "0.16em", opacity: 0.78, flex: 1, minWidth: 0, overflow: "hidden" }}>
          <a href="/">CRELAVO</a><a href="/dashboard">DASHBOARD</a><a href="/pricing">CREDITS</a><a href="/dashboard/productions">PRODUCTIONS</a>
        </nav>
        {credits.kind === "signed_out" ? <a href="/?auth=login" style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>SIGN IN</a> : <div style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>{creditLabel}</div>}
        <a href="/pricing" style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.7 }}>LIVE &middot; PRO $9.99/MO</a>
      </header>
      <section style={{ flex: "1 1 auto", minHeight: 0, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #d7b07a 0%, #9a5a28 42%, #3a1c0e 78%, #070605 100%)" }}>
        {shot.mediaUrl ? (/\.(mp4|webm|mov)(\?|$)/i.test(shot.mediaUrl) || /video/i.test(shot.mediaUrl) ? <video src={shot.mediaUrl} muted playsInline autoPlay loop style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={shot.mediaUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />) : null}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "24px 20px 18px", background: "linear-gradient(180deg, transparent, rgba(7,6,5,0.88))" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.7 }}>{kicker}</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, marginTop: 6, lineHeight: 1.15 }}>{shot.title}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{shot.body}</div>
        </div>
      </section>
      <div style={{ flex: "0 0 auto", padding: "8px 12px 0", fontSize: 10, letterSpacing: "0.16em", opacity: 0.7 }}>{notice}</div>
      <div style={{ flex: "0 0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, margin: "8px 12px 0", border: "1px solid rgba(244,238,230,0.18)" }}>
        {shots.map((s, i) => <button key={s.id} type="button" onClick={() => setSelected(i)} style={{ background: i === selected ? "rgba(244,238,230,0.14)" : "transparent", color: "rgb(244,238,230)", border: "none", borderRight: i < 3 ? "1px solid rgba(244,238,230,0.18)" : "none", padding: "10px 6px", fontSize: 11, letterSpacing: "0.14em", cursor: "pointer" }}>{String(s.id).padStart(2, "0")} {s.label}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void onSend(); }} style={{ flex: "0 0 auto", display: "flex", gap: 10, padding: "10px 12px 12px" }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Make this part like this?" disabled={sending} style={{ flex: 1, minWidth: 0, background: "transparent", border: "1px solid rgba(244,238,230,0.22)", borderRadius: 999, color: "rgb(244,238,230)", padding: "12px 16px", fontSize: 14, outline: "none" }} />
        <button type="submit" disabled={sending || !draft.trim()} style={{ border: "none", borderRadius: 999, background: "rgb(248,251,255)", color: "#111", padding: "0 18px", fontSize: 11, letterSpacing: "0.14em", cursor: sending || !draft.trim() ? "default" : "pointer", opacity: sending || !draft.trim() ? 0.5 : 1 }}>SEND</button>
      </form>
    </div>
  );
  return createPortal(shell, document.body);
}
