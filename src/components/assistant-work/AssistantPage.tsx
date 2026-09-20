"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const JOB_KEY = "crelavo-aw-last-v2";
const OVERLAY_ID = "crelavo-aw-thread";
const CREDITS_HREF = "/pricing";

export function CinemaRouteGuard() {
  useEffect(() => {
    window.onbeforeunload = null;
  }, []);
  return null;
}

type SceneStatus = "READY" | "REVISING" | "RENDERING" | "QUEUED";
type Scene = { id: number; status: SceneStatus; title: string; shot: string; dock: string; gradient: string };
type CreditState = { status: "signed_in" | "signed_out"; balance: number | null };

const INITIAL_SCENES: Scene[] = [
  { id: 1, status: "READY", title: "Dawn storefront, glass door and neon OPEN", shot: "Hold wide. Pedestrians pass. Sign flickers once.", dock: "Keep the neon quiet. No extra extras in frame.", gradient: "radial-gradient(120% 80% at 50% 0%, #3a2a18 0%, #16110c 42%, #070605 100%)" },
  { id: 2, status: "REVISING", title: "Storefront at dusk, ceramic mug in warm tungsten", shot: "Slow push-in. Hands enter frame. Steam rises.", dock: "Warmer tungsten. Slower push-in. Less steam.", gradient: "radial-gradient(120% 80% at 50% 0%, #5a3a16 0%, #1a1208 46%, #070605 100%)" },
  { id: 3, status: "RENDERING", title: "Counter pour, milk ribbon into the mug", shot: "Top-down. Slow pour. Cream blooms in coffee.", dock: "Tighter on the ribbon. Cut before overflow.", gradient: "radial-gradient(120% 80% at 50% 0%, #4a2814 0%, #140e0a 48%, #070605 100%)" },
  { id: 4, status: "QUEUED", title: "Hero mug, steam and window rain", shot: "Macro. Rain streaks on glass. Soft rack focus.", dock: "Hold steam longer. Keep rain in the glass only.", gradient: "radial-gradient(120% 80% at 50% 0%, #243044 0%, #10141c 48%, #070605 100%)" },
];

function padScene(id: number) { return String(id).padStart(2, "0"); }
function parseJson(raw: string | null): unknown { if (!raw) return null; try { return JSON.parse(raw); } catch { return raw; } }
function tokenFromUnknown(value: unknown, depth = 0): string | null {
  if (value == null || depth > 6) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("eyJ") && trimmed.length > 40) return trimmed;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return tokenFromUnknown(parseJson(trimmed), depth + 1);
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = tokenFromUnknown(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const direct = o.access_token || o.accessToken || o.token;
    if (typeof direct === "string" && direct.length > 20) return direct;
    return tokenFromUnknown(o.currentSession, depth + 1) || tokenFromUnknown(o.session, depth + 1) || tokenFromUnknown(o.data, depth + 1) || tokenFromUnknown(o.user, depth + 1);
  }
  return null;
}
function isAuthKey(key: string) { return /sb-.*-auth-token|supabase|access_token|refresh_token|auth-token|crelavo.*auth|crelavo.*session|sb-access-token|sb-refresh-token/i.test(key); }
function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const stores: Storage[] = [];
  try { stores.push(window.localStorage); } catch { /* ignore */ }
  try { stores.push(window.sessionStorage); } catch { /* ignore */ }
  for (const store of stores) {
    try {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (!key || !isAuthKey(key)) continue;
        const found = tokenFromUnknown(store.getItem(key));
        if (found) return found;
      }
    } catch { /* ignore */ }
  }
  try {
    const map = new Map<string, string>();
    for (const part of document.cookie.split("; ")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      const key = part.slice(0, eq);
      let value = part.slice(eq + 1);
      try { value = decodeURIComponent(value); } catch { /* keep raw */ }
      map.set(key, value);
    }
    const bases = new Set<string>();
    for (const key of map.keys()) {
      const chunk = key.match(/^(.*-auth-token)(?:\.\d+)?$/);
      if (chunk) bases.add(chunk[1]);
      if (isAuthKey(key)) bases.add(key.replace(/\.\d+$/, ""));
    }
    for (const base of bases) {
      let combined = map.get(base) || "";
      if (!combined) { let i = 0; while (map.has(`${base}.${i}`)) { combined += map.get(`${base}.${i}`) || ""; i += 1; } }
      const found = tokenFromUnknown(combined);
      if (found) return found;
    }
  } catch { /* ignore */ }
  return null;
}
function writeCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const max = 3180;
  const encoded = encodeURIComponent(value);
  if (encoded.length <= max) { document.cookie = `${name}=${encoded}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`; return; }
  document.cookie = `${name}=; Path=/; Max-Age=0`;
  let i = 0;
  for (let offset = 0; offset < encoded.length; offset += max) { document.cookie = `${name}.${i}=${encoded.slice(offset, offset + max)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`; i += 1; }
}
function syncSessionToCookies() {
  if (typeof window === "undefined") return;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !isAuthKey(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw) writeCookie(key, raw);
    }
  } catch { /* ignore */ }
  const token = readAccessToken();
  if (token) writeCookie("sb-access-token", token);
}
function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = readAccessToken();
  if (token) { headers.Authorization = `Bearer ${token}`; headers["x-supabase-auth"] = token; }
  return headers;
}
function pickNumber(...vals: unknown[]): number | null {
  for (const value of vals) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") { const n = Number(value); if (Number.isFinite(n)) return n; }
  }
  return null;
}
function extractBalance(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, any>;
  const data = o.data && typeof o.data === "object" ? o.data : {};
  const user = o.user && typeof o.user === "object" ? o.user : {};
  const account = o.account && typeof o.account === "object" ? o.account : {};
  return pickNumber(o.balance, o.available, o.credits, o.remaining, data.balance, data.available, data.credits, data.remaining, user.credits, user.balance, account.credits, o.credit_balances?.balance);
}
function isExplicitSignInError(status: number, body: unknown, text: string) {
  if (status === 401) return true;
  const blob = `${text} ${JSON.stringify(body ?? {})}`.toLowerCase();
  if (blob.includes("user session is required")) return true;
  if (typeof body === "object" && body && (body as Record<string, unknown>).code === "sign_in") return true;
  return blob.includes("sign in to start") || blob.includes("sign_in");
}
function formatCredits(n: number) { return Math.round(n).toLocaleString("en-US"); }
function initialCredits(): CreditState {
  if (typeof window === "undefined") return { status: "signed_out", balance: null };
  return readAccessToken() ? { status: "signed_in", balance: null } : { status: "signed_out", balance: null };
}
function loadJobKey() {
  try {
    const raw = sessionStorage.getItem(JOB_KEY) || localStorage.getItem(JOB_KEY);
    if (raw) {
      if (raw.startsWith("{")) { const parsed = JSON.parse(raw) as { key?: string; id?: string }; return parsed.key || parsed.id || raw; }
      return raw;
    }
  } catch { /* ignore */ }
  const key = `aw_${Date.now().toString(36)}`;
  try { sessionStorage.setItem(JOB_KEY, key); localStorage.setItem(JOB_KEY, key); } catch { /* ignore */ }
  return key;
}
const NAV = [
  { href: "/", label: "HOME" }, { href: "/dashboard", label: "DASHBOARD" }, { href: CREDITS_HREF, label: "CREDITS" }, { href: "/dashboard/productions", label: "PRODUCTIONS" }, { href: "/pricing", label: "PRICING" },
];

export default function AssistantPage() {
  const [scenes, setScenes] = useState<Scene[]>(() => INITIAL_SCENES.map((scene) => ({ ...scene })));
  const [selectedId, setSelectedId] = useState(2);
  const [draft, setDraft] = useState("");
  const [goOpen, setGoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<CreditState>(initialCredits);
  const [jobKey] = useState(loadJobKey);
  const selected = useMemo(() => scenes.find((scene) => scene.id === selectedId) ?? scenes[0], [scenes, selectedId]);

  const refreshCredits = useCallback(async () => {
    syncSessionToCookies();
    const token = readAccessToken();
    let found: number | null = null;
    let sawExplicitSignIn = false;
    for (const url of ["/api/credits", "/api/credits/balance"]) {
      try {
        const res = await fetch(url, { method: "GET", credentials: "include", headers: authHeaders(), cache: "no-store" });
        const text = await res.text();
        let body: unknown = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = text; }
        const n = extractBalance(body);
        if (n != null) found = n;
        if (isExplicitSignInError(res.status, body, text)) sawExplicitSignIn = true;
      } catch { /* keep going */ }
    }
    if (found != null) { setCredits({ status: "signed_in", balance: found }); return; }
    if (token) { setCredits((prev) => ({ status: "signed_in", balance: prev.balance })); return; }
    if (sawExplicitSignIn) setCredits({ status: "signed_out", balance: null });
  }, []);

  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prevHtmlOverflow = html.style.overflow, prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden"; body.style.overflow = "hidden";
    return () => { html.style.overflow = prevHtmlOverflow; body.style.overflow = prevBodyOverflow; };
  }, []);
  useEffect(() => {
    void refreshCredits();
    const onFocus = () => void refreshCredits();
    const onStorage = (event: StorageEvent) => { if (!event.key || isAuthKey(event.key) || /credit|balance/i.test(event.key)) void refreshCredits(); };
    window.addEventListener("focus", onFocus); document.addEventListener("visibilitychange", onFocus); window.addEventListener("storage", onStorage);
    const timer = window.setInterval(() => void refreshCredits(), 12000);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); window.removeEventListener("storage", onStorage); window.clearInterval(timer); };
  }, [refreshCredits]);

  async function onSend() {
    const text = draft.trim();
    if (!text || busy) return;
    const applyLocal = () => { setScenes((prev) => prev.map((scene) => scene.id === selectedId ? { ...scene, dock: text, status: "REVISING" } : scene)); setDraft(""); };
    if (credits.balance === 0) { applyLocal(); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/assistant-work", { method: "POST", credentials: "include", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ action: "revise", scene: selectedId, prompt: text, job_key: jobKey }) });
      const raw = await res.text();
      let body: unknown = null;
      try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
      const next = extractBalance(body);
      if (next != null) setCredits({ status: "signed_in", balance: next });
      applyLocal(); void refreshCredits();
    } catch { applyLocal(); }
    finally { setBusy(false); }
  }

  return (
    <div id={OVERLAY_ID}>
      <style>{CSS}</style>
      <header className="aw-header">
        <div className="aw-left"><a className="aw-home" href="/">&lt; Home</a><a href="/">CRELAVO</a><nav className="aw-nav aw-hide-mobile"><a href="/dashboard">DASHBOARD</a><a href={CREDITS_HREF}>CREDITS</a><a href="/dashboard/productions">PRODUCTIONS</a></nav></div>
        <div className="aw-right">{credits.status === "signed_out" ? <a className="aw-pill" href="/?auth=login">SIGN IN</a> : <a className="aw-credits" href={CREDITS_HREF}>{credits.balance == null ? "--" : formatCredits(credits.balance)}</a>}<span className="aw-live aw-hide-mobile">LIVE</span><a className="aw-hide-mobile" href="/pricing">PRO $9.99/MO</a><button className="aw-go-btn" type="button" onClick={() => setGoOpen((open) => !open)}>GO</button></div>
      </header>
      {goOpen ? <div className="aw-sheet aw-show-mobile">{NAV.map((item) => <a key={item.href + item.label} href={item.href}>{item.label}</a>)}{credits.status === "signed_out" ? <a href="/?auth=login">SIGN IN</a> : null}<button type="button" onClick={() => setGoOpen(false)}>CLOSE</button></div> : null}
      <div className="aw-slot"><section className="aw-stage" style={{ background: selected.gradient }}><div className="aw-picture"><div className="aw-kicker">SCENE {padScene(selected.id)} / SELECTED</div><h1 className="aw-title">{selected.title}</h1><p className="aw-shot aw-hide-mobile">{selected.shot}</p></div><div className="aw-dock aw-hide-mobile"><small>REVISE THIS SCENE / PRODUCTION CONTINUES</small><div>{selected.dock}</div></div></section></div>
      <div className="aw-film">{scenes.map((scene) => <button key={scene.id} type="button" className={scene.id === selectedId ? "aw-scene is-on" : "aw-scene"} onClick={() => setSelectedId(scene.id)}>{padScene(scene.id)} {scene.status}</button>)}</div>
      <div className="aw-hint aw-hide-mobile">CLICK A SCENE TO REVISE IT WITHOUT RESTARTING THE JOB</div>
      <form className="aw-composer" onSubmit={(event) => { event.preventDefault(); void onSend(); }}><label><span>DIRECT THE SELECTED SCENE</span><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Make this part like this?" autoComplete="off" /></label><button className="aw-send" type="submit" disabled={busy}>SEND</button></form>
    </div>
  );
}

const CSS = `
#crelavo-aw-thread{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;overflow:hidden;background:#070605;color:#f4eee6;font-family:Inter,system-ui,sans-serif;box-sizing:border-box}#crelavo-aw-thread *,#crelavo-aw-thread *::before,#crelavo-aw-thread *::after{box-sizing:border-box}#crelavo-aw-thread a{color:inherit;text-decoration:none}.aw-header,.aw-film,.aw-composer,.aw-go{flex:0 0 auto}.aw-header{display:flex;align-items:center;justify-content:space-between;gap:10px;height:46px;padding:0 12px;border-bottom:1px solid rgba(196,165,116,.28);letter-spacing:.12em;font-size:11px}.aw-left,.aw-right,.aw-nav{display:flex;align-items:center;gap:12px;min-width:0}.aw-home,.aw-pill,.aw-go-btn,.aw-send{border:1px solid rgba(196,165,116,.45);background:transparent;color:#f4eee6;border-radius:999px;padding:6px 10px;font:inherit;letter-spacing:.12em;cursor:pointer}.aw-credits{border:1px solid rgba(196,165,116,.7);border-radius:999px;padding:6px 10px;min-width:64px;text-align:center}.aw-live{color:#d7b07a}.aw-slot{flex:1 1 auto;min-height:0;width:100%;padding:10px 14px 8px;display:flex}.aw-stage{flex:1 1 auto;min-height:0;width:100%;border:1px solid rgba(196,165,116,.7);display:flex;flex-direction:column;overflow:hidden}.aw-picture{flex:1 1 auto;min-height:0;padding:16px 18px;display:flex;flex-direction:column}.aw-kicker{letter-spacing:.16em;font-size:10px;color:rgba(244,238,230,.7)}.aw-title{font-family:Georgia,"Times New Roman",serif;font-size:clamp(18px,2.4vw,32px);line-height:1.2;margin:8px 0 6px;letter-spacing:0}.aw-shot{font-size:13px;color:rgba(244,238,230,.78);letter-spacing:.01em}.aw-dock{flex:0 0 auto;margin:10px;border:1px solid rgba(196,165,116,.35);padding:10px 12px}.aw-dock small{display:block;letter-spacing:.14em;font-size:10px;color:rgba(244,238,230,.6);margin-bottom:4px}.aw-film{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 14px 6px}.aw-scene{text-align:left;background:#0c0a08;color:#f4eee6;border:1px solid rgba(196,165,116,.28);padding:10px 12px;letter-spacing:.12em;font-size:11px;cursor:pointer}.aw-scene.is-on{border-color:rgba(215,176,122,.95);background:linear-gradient(180deg,#1a140c 0%,#0c0a08 100%)}.aw-hint{padding:0 14px 6px;font-size:10px;letter-spacing:.12em;color:rgba(244,238,230,.45)}.aw-composer{display:flex;align-items:stretch;gap:10px;margin:0 14px 12px;border:1px solid rgba(196,165,116,.45);padding:8px}.aw-composer label{display:flex;flex-direction:column;flex:1 1 auto;min-width:0;gap:4px}.aw-composer span{letter-spacing:.14em;font-size:10px;color:rgba(244,238,230,.6)}.aw-composer input{width:100%;border:0;outline:0;background:transparent;color:#f4eee6;font:inherit;font-size:14px;letter-spacing:0}.aw-send{align-self:flex-end;background:#e6d3b0;color:#1a140c;border-color:#e6d3b0;letter-spacing:.14em}.aw-send:disabled{opacity:.5;cursor:default}.aw-go-btn,.aw-show-mobile{display:none}.aw-sheet{position:absolute;inset:46px 10px auto;background:#0c0a08;border:1px solid rgba(196,165,116,.45);padding:10px;display:flex;flex-direction:column;gap:8px;z-index:2}.aw-sheet a,.aw-sheet button{letter-spacing:.14em;font-size:12px;padding:10px;border:1px solid rgba(196,165,116,.28);background:transparent;color:#f4eee6;text-align:left}@media(max-width:720px){.aw-hide-mobile{display:none!important}.aw-go-btn,.aw-show-mobile{display:inline-flex!important}.aw-title{font-size:18px}.aw-film{gap:6px;padding:0 10px 6px}.aw-scene{padding:8px 6px;font-size:10px}.aw-slot{padding:8px 10px}.aw-composer{margin:0 10px 10px}}
`;
