"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Mode = "video" | "website";
type CreditState = { signedIn: boolean; credits: number | null; loading: boolean };

const JOB_KEY = "crelavo-aw-last-v2";
const INK = "#f4eee6";
const MUTED = "#aeb8cc";
const LINE = "rgba(244,238,230,0.16)";

const VIDEO_SCENES = [
  { id: 1, status: "READY", title: "Dawn street, storefront lights warming up", shot: "Wide hold. Pedestrians pass. Sign flickers.", note: "Keep the street quiet. Let the sign come on last.", wash: "radial-gradient(120% 80% at 50% 0%, #3a2a18 0%, #070605 62%)" },
  { id: 2, status: "REVISING", title: "Storefront at dusk, ceramic mug in warm tungsten", shot: "Slow push-in. Hands enter frame. Steam rises.", note: "Warmer tungsten. Slower push-in. Less steam.", wash: "radial-gradient(120% 80% at 50% 0%, #8a5a22 0%, #1a0e06 58%)" },
  { id: 3, status: "RENDERING", title: "Close-up of glaze, steam in sidelight", shot: "Macro drift. Condensation on ceramic.", note: "Less shine on the rim. Hold steam in the left third.", wash: "radial-gradient(120% 80% at 40% 20%, #6a3a16 0%, #0b0704 64%)" },
  { id: 4, status: "QUEUED", title: "Hands wrapping the mug, dusk window", shot: "Over-shoulder. Pack, leave frame.", note: "Keep the window in the background. Do not cut the hands.", wash: "radial-gradient(120% 80% at 70% 10%, #2a3344 0%, #070605 60%)" },
];

const WEB_PAGES = [
  { id: 1, status: "READY", title: "Home — hero, offer, start here", shot: "Full-width hero. Price in the first screen. One primary button.", note: "Larger type. Shorter hero. Keep one button.", path: "crelavo.site / home" },
  { id: 2, status: "REVISING", title: "Catalog — product grid, price on cards", shot: "Four products. Price on every card. One filter row.", note: "Fewer products. Bigger price. Keep the grid.", path: "crelavo.site / catalog" },
  { id: 3, status: "RENDERING", title: "Story — brand, materials, slow mornings", shot: "One photo. Short copy. No extra sections.", note: "Cut the second paragraph. Keep the photo full width.", path: "crelavo.site / story" },
  { id: 4, status: "QUEUED", title: "Checkout — one offer, pay, confirm", shot: "One line item. Total visible. One pay button.", note: "Show the total above the button. No extra fields.", path: "crelavo.site / checkout" },
];

export function CinemaRouteGuard() {
  useEffect(() => {
    window.onbeforeunload = null;
  }, []);
  return null;
}

function isJwt(s: string) {
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(s);
}

function walkToken(v: unknown, depth = 0): string | null {
  if (v == null || depth > 8) return null;
  if (typeof v === "string") {
    if (isJwt(v)) return v;
    if (v.startsWith("{") || v.startsWith("[")) {
      try { return walkToken(JSON.parse(v), depth + 1); } catch { return null; }
    }
    return null;
  }
  if (Array.isArray(v)) {
    for (const item of v) { const found = walkToken(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["access_token", "accessToken"]) {
      if (typeof o[k] === "string" && isJwt(o[k] as string)) return o[k] as string;
    }
    for (const val of Object.values(o)) { const found = walkToken(val, depth + 1); if (found) return found; }
  }
  return null;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (!key) continue;
        const raw = store.getItem(key);
        if (!raw) continue;
        let parsed: unknown = raw;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        const found = walkToken(parsed);
        if (found) return found;
      }
    }
    for (const part of document.cookie.split(";")) {
      const raw = decodeURIComponent(part.split("=").slice(1).join("=").trim());
      const found = walkToken(raw.startsWith("{") || raw.startsWith("[") ? JSON.parse(raw) : raw);
      if (found) return found;
    }
  } catch { return null; }
  return null;
}

function asInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^-?\d+(\.0+)?$/.test(v.trim())) return parseInt(v.trim(), 10);
  return null;
}

function looksCatalog(o: Record<string, unknown>) {
  return Boolean(o.plans || o.packages || o.catalog || o.products || o.pricing || (Array.isArray(o.data) && o.data.length > 0 && typeof o.data[0] === "object" && o.data[0] !== null && "price" in (o.data[0] as object)));
}

function isSignInPayload(o: Record<string, unknown>) {
  const blob = `${o.error || ""} ${o.message || ""} ${o.code || ""}`;
  return /session is required|sign[_\s-]?in|unauthori[sz]ed|unauthenticated|not authenticated/i.test(blob);
}

function parseCredits(payload: unknown): "signed_out" | "unknown" | { value: number } {
  if (payload == null) return "unknown";
  if (typeof payload === "number" && Number.isFinite(payload)) return { value: Math.trunc(payload) };
  if (typeof payload !== "object") return "unknown";
  const o = payload as Record<string, unknown>;
  if (isSignInPayload(o)) return "signed_out";
  if (looksCatalog(o)) return "unknown";
  const reserved = asInt(o.reserved);
  const keys = ["available_credits", "availableCredits", "remaining_credits", "remainingCredits", "credits_available", "credit_balance", "creditBalance", "current_credits", "credits", "available", "remaining", "balance"];
  for (const k of keys) {
    if (!(k in o)) continue;
    const n = asInt(o[k]);
    if (n == null) continue;
    if (k === "balance" && reserved != null) return { value: Math.max(0, n - reserved) };
    return { value: n };
  }
  for (const nest of [o.data, o.result, o.payload, o.user]) {
    if (nest && typeof nest === "object" && nest !== o) {
      const inner = parseCredits(nest);
      if (inner !== "unknown") return inner;
    }
  }
  return "unknown";
}

function readMode(): Mode {
  if (typeof window === "undefined") return "video";
  const t = (new URLSearchParams(window.location.search).get("type") || "").toLowerCase();
  if (t.includes("website") || t.includes("site") || t === "web") return "website";
  return "video";
}

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }

export default function AssistantPage() {
  const [mode] = useState<Mode>(readMode);
  const items = mode === "website" ? WEB_PAGES : VIDEO_SCENES;
  const [selected, setSelected] = useState(mode === "website" ? 1 : 2);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [go, setGo] = useState(false);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const [vw, setVw] = useState(1440);
  const [vh, setVh] = useState(900);
  const [credit, setCredit] = useState<CreditState>({ signedIn: false, credits: null, loading: true });
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [slot, setSlot] = useState({ w: 0, h: 0 });
  const current = items.find((s) => s.id === selected) || items[0];

  useEffect(() => {
    let host = document.getElementById("crelavo-aw-thread");
    if (!host) {
      host = document.createElement("div");
      host.id = "crelavo-aw-thread";
      document.body.appendChild(host);
    }
    setPortal(host);
    const html = document.documentElement;
    const prevH = html.style.overflow;
    const prevB = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => { html.style.overflow = prevH; document.body.style.overflow = prevB; };
  }, []);

  useEffect(() => {
    const sync = () => {
      const vv = window.visualViewport;
      setVw(Math.round(vv?.width ?? window.innerWidth));
      setVh(Math.round(vv?.height ?? window.innerHeight));
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.addEventListener("resize", sync);
    return () => { window.visualViewport?.removeEventListener("resize", sync); window.removeEventListener("resize", sync); };
  }, []);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSlot({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSlot({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [portal, vw, vh]);

  const loadCredits = useCallback(async (signal?: AbortSignal) => {
    const token = getAccessToken();
    if (!token) { setCredit({ signedIn: false, credits: null, loading: false }); return; }
    setCredit((prev) => ({ ...prev, signedIn: true, loading: prev.credits == null }));
    const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };
    let value: number | null = null;
    for (const url of ["/api/credits/balance", "/api/credits"]) {
      try {
        const res = await fetch(url, { method: "GET", headers, credentials: "include", cache: "no-store", signal });
        const text = await res.text();
        let json: unknown = text;
        try { json = JSON.parse(text); } catch { json = text; }
        const parsed = parseCredits(json);
        if (typeof parsed === "object") { value = parsed.value; break; }
      } catch { /* next */ }
    }
    setCredit({ signedIn: true, credits: value, loading: false });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadCredits(ac.signal);
    const onSession = () => loadCredits();
    const onVis = () => { if (document.visibilityState === "visible") loadCredits(); };
    window.addEventListener("crelavo-session", onSession);
    document.addEventListener("visibilitychange", onVis);
    const t = window.setInterval(() => loadCredits(), 20000);
    return () => { ac.abort(); window.removeEventListener("crelavo-session", onSession); document.removeEventListener("visibilitychange", onVis); window.clearInterval(t); };
  }, [loadCredits]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB_KEY) || sessionStorage.getItem(JOB_KEY);
      if (!raw) {
        const seed = JSON.stringify({ mode, selected, at: Date.now() });
        localStorage.setItem(JOB_KEY, seed);
        sessionStorage.setItem(JOB_KEY, seed);
      }
    } catch { /* ignore */ }
  }, [mode, selected]);

  const mobile = vw < 720;
  const frame = useMemo(() => {
    const maxW = Math.max(0, slot.w);
    const maxH = Math.max(0, slot.h);
    if (mobile) return { w: maxW, h: maxH };
    let w = maxW;
    let h = (w * 9) / 16;
    if (h > maxH) { h = maxH; w = (h * 16) / 9; }
    return { w, h };
  }, [slot, mobile]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setNotes((prev) => ({ ...prev, [selected]: text }));
    setDraft("");
    if (credit.credits === 0 || credit.credits == null) return;
  };

  const creditLabel = !credit.signedIn ? "SIGN IN" : credit.loading && credit.credits == null ? "..." : credit.credits == null ? "--" : credit.credits.toLocaleString("en-US");
  const nav = [
    { href: "/", label: "CRELAVO" },
    { href: "/dashboard", label: "DASHBOARD" },
    { href: "/pricing", label: "CREDITS" },
    { href: "/dashboard/productions", label: "PRODUCTIONS" },
  ];

  const shell = (
    <div style={{ position: "fixed", inset: 0, width: vw, height: vh, background: "#070605", color: INK, overflow: "hidden", zIndex: 2147483000, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: mobile ? "8px 10px" : "8px 16px", borderBottom: `1px solid ${LINE}`, flex: "0 0 auto" }}>
        <a href="/" style={pill()}>{"< Home"}</a>
        {!mobile && nav.map((n) => <a key={n.href} href={n.href} style={navLink()}>{n.label}</a>)}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <a href={credit.signedIn ? "/pricing" : "/?auth=login"} style={pill()}>{creditLabel}</a>
          {!mobile && <span style={tiny()}>LIVE</span>}
          {!mobile && <span style={tiny()}>PRO $9.99/MO</span>}
          {mobile && <button type="button" onClick={() => setGo(true)} style={pillBtn()}>GO</button>}
        </div>
      </header>

      <div ref={slotRef} style={{ flex: "1 1 auto", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? 8 : 12 }}>
        <div style={{ width: frame.w, height: frame.h, border: `1px solid ${LINE}`, position: "relative", overflow: "hidden", background: mode === "video" ? (current as (typeof VIDEO_SCENES)[number]).wash : "linear-gradient(180deg, #12344d 0%, #070605 55%)" }}>
          <div style={{ position: "absolute", inset: 16, pointerEvents: "none" }}>
            <div style={{ ...tiny(), letterSpacing: "0.12em" }}>{mode === "website" ? "PAGE" : "SCENE"} {pad(current.id)} / SELECTED</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: mobile ? 22 : 32, fontWeight: 500, margin: "8px 0 6px", color: INK }}>{current.title}</h1>
            {!mobile && <p style={{ margin: 0, color: MUTED, fontSize: 13 }}>{current.shot}</p>}
            {mode === "website" && (
              <div style={{ marginTop: 18, pointerEvents: "none" }}>
                <div style={{ ...tiny(), letterSpacing: "0.14em" }}>{(current as (typeof WEB_PAGES)[number]).path}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: MUTED }}><b style={{ color: INK, letterSpacing: "0.08em" }}>NORTH & CO</b><span>Home</span><span>Shop</span><span>Story</span><span>Pay</span></div>
                <div style={{ ...tiny(), marginTop: 16 }}>NEW DROP</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: mobile ? 22 : 28, marginTop: 6 }}>Ceramic tableware for slow mornings</div>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>One offer. One button. Price on the first screen.</div>
                <div style={{ marginTop: 14, display: "inline-block", border: `1px solid ${LINE}`, padding: "8px 12px", fontSize: 12 }}>Start here</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!mobile && (
        <div style={{ padding: "6px 12px 0", borderTop: `1px solid ${LINE}` }}>
          <div style={{ ...tiny(), letterSpacing: "0.12em" }}>REVISE THIS {mode === "website" ? "PAGE" : "SCENE"} / PRODUCTION CONTINUES</div>
          <div style={{ fontSize: 13, margin: "4px 0 8px" }}>{notes[selected] || current.note}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 0, padding: "0 8px", flex: "0 0 auto" }}>
        {items.map((s) => {
          const on = s.id === selected;
          return <button key={s.id} type="button" onClick={() => setSelected(s.id)} style={{ flex: 1, background: "transparent", color: on ? INK : MUTED, border: `1px solid ${on ? INK : LINE}`, padding: mobile ? "8px 4px" : "10px 8px", fontSize: 11, letterSpacing: "0.08em", cursor: "pointer" }}>{pad(s.id)} {s.status}</button>;
        })}
      </div>

      <form onSubmit={send} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, flex: "0 0 auto" }}>
        <label style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...tiny(), display: "block", marginBottom: 4 }}>DIRECT THE SELECTED {mode === "website" ? "PAGE" : "SCENE"}</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mode === "website" ? "Make this page like this?" : "Make this part like this?"} style={{ width: "100%", background: "transparent", border: `1px solid ${LINE}`, color: INK, padding: "10px 12px", outline: "none", fontSize: 14 }} />
        </label>
        <button type="submit" style={{ ...pillBtn(), background: INK, color: "#070605" }}>SEND</button>
      </form>

      {go && mobile && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(7,6,5,0.92)", zIndex: 2, padding: 24 }}>
          <button type="button" onClick={() => setGo(false)} style={pillBtn()}>CLOSE</button>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
            {nav.map((n) => <a key={n.href} href={n.href} style={{ color: INK, textDecoration: "none", letterSpacing: "0.08em" }}>{n.label}</a>)}
            <a href="/?auth=login" style={{ color: INK, textDecoration: "none", letterSpacing: "0.08em" }}>SIGN IN</a>
          </div>
        </div>
      )}
    </div>
  );

  if (!portal) return null;
  return createPortal(shell, portal);
}

function pill(): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 999, padding: "6px 12px", color: INK, textDecoration: "none", fontSize: 11, letterSpacing: "0.08em" };
}

function pillBtn(): React.CSSProperties {
  return { ...pill(), background: "transparent", cursor: "pointer" };
}

function navLink(): React.CSSProperties {
  return { color: MUTED, textDecoration: "none", fontSize: 11, letterSpacing: "0.12em" };
}

function tiny(): React.CSSProperties {
  return { color: MUTED, fontSize: 10, letterSpacing: "0.14em" };
}
