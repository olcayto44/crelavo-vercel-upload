"use client";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
type AuthView = "signed_out" | "loading" | "unknown" | "number";
type Shot = { id: string; kicker: string; title: string; body: string; status: string };
const VIDEO_SHOTS: Shot[] = [
  { id: "01", kicker: "SCENE 01 / SELECTED", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", status: "READY" },
  { id: "02", kicker: "SCENE 02 / SELECTED", title: "Storefront at dusk, ceramic mug in warm tungsten", body: "Slow push-in. Hands enter frame. Steam rises.", status: "REVISING" },
  { id: "03", kicker: "SCENE 03 / SELECTED", title: "Hands wrap the mug, steam, quiet orbit", body: "Close. Knuckles and glaze. Steam as the only motion.", status: "RENDERING" },
  { id: "04", kicker: "SCENE 04 / SELECTED", title: "End card on black, mark holds", body: "Logo in, then still. No extra line.", status: "QUEUED" },
];
const WEB_SHOTS: Shot[] = [
  { id: "01", kicker: "PAGE 01 / HOME", title: "Home", body: "Hero, proof, and one clear start.", status: "HOME" },
  { id: "02", kicker: "PAGE 02 / CATALOG", title: "Catalog", body: "Grid of offers. Price stays on the card.", status: "CATALOG" },
  { id: "03", kicker: "PAGE 03 / STORY", title: "Story", body: "Why it exists. Short, specific, no slogan.", status: "STORY" },
  { id: "04", kicker: "PAGE 04 / CHECKOUT", title: "Checkout", body: "Order summary and pay. Nothing else on this page.", status: "CHECKOUT" },
];
export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}
function isWebsiteMode() {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const type = (q.get("type") || "").toLowerCase();
  const category = (q.get("category") || "").toLowerCase();
  return type.includes("website") || type.includes("web site") || category.includes("website") || category.includes("web");
}
function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const bags: Storage[] = [];
  try { bags.push(window.localStorage); } catch { /* ignore */ }
  try { bags.push(window.sessionStorage); } catch { /* ignore */ }
  const pickFromParsed = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const o = value as Record<string, unknown>;
    const direct = o.access_token;
    if (typeof direct === "string" && direct.length > 20) return direct;
    const nested = o.currentSession || o.session || o.data;
    if (nested && typeof nested === "object") {
      const token = (nested as Record<string, unknown>).access_token;
      if (typeof token === "string" && token.length > 20) return token;
    }
    return null;
  };
  for (const bag of bags) {
    for (let i = 0; i < bag.length; i += 1) {
      const key = bag.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      if (!lower.includes("auth-token") && !lower.includes("supabase") && !lower.includes("sb-")) continue;
      if (/\.\d+$/.test(key)) continue;
      try {
        const raw = bag.getItem(key);
        if (!raw) continue;
        if (raw.startsWith("eyJ") && raw.length > 20) return raw;
        const token = pickFromParsed(JSON.parse(raw));
        if (token) return token;
      } catch { /* try chunked next */ }
    }
  }
  for (const bag of bags) {
    const groups = new Map<string, string[]>();
    for (let i = 0; i < bag.length; i += 1) {
      const key = bag.key(i);
      if (!key) continue;
      const m = key.match(/^(.*)\.(\d+)$/);
      if (!m) continue;
      const raw = bag.getItem(key);
      if (!raw) continue;
      const list = groups.get(m[1]) || [];
      list[Number(m[2])] = raw;
      groups.set(m[1], list);
    }
    for (const parts of groups.values()) {
      try {
        const token = pickFromParsed(JSON.parse(parts.filter(Boolean).join("")));
        if (token) return token;
      } catch { /* ignore */ }
    }
  }
  return null;
}
function parseCredits(data: unknown): number | null {
  if (data == null || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.plans) || Array.isArray(o.packages) || o.catalog) return null;
  const pool: unknown[] = [o.balance, o.credits, o.available, o.remaining, o.amount];
  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    pool.push(d.balance, d.credits, d.available, d.remaining);
  }
  if (o.credit_balance && typeof o.credit_balance === "object") {
    const d = o.credit_balance as Record<string, unknown>;
    pool.push(d.balance, d.credits);
  }
  for (const item of pool) {
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (typeof item === "string" && item.trim() !== "") {
      const n = Number(item);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}
export default function AssistantPage() {
  const website = isWebsiteMode();
  const seed = website ? WEB_SHOTS : VIDEO_SHOTS;
  const [shots, setShots] = useState<Shot[]>(seed);
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState("");
  const [goOpen, setGoOpen] = useState(false);
  const [auth, setAuth] = useState<AuthView>("loading");
  const [credits, setCredits] = useState<number | null>(null);
  const [narrow, setNarrow] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageSlotRef = useRef<HTMLDivElement | null>(null);
  const [stageBox, setStageBox] = useState({ width: 0, height: 0 });
  const shot = shots[selected] || shots[0];
  const fitStage = useCallback(() => {
    const slot = stageSlotRef.current;
    if (!slot) return;
    const w = slot.clientWidth;
    const h = slot.clientHeight;
    const mobile = window.innerWidth < 720;
    if (mobile) { setStageBox({ width: w, height: h }); setNarrow(true); return; }
    setNarrow(false);
    if (w <= 0 || h <= 0) { setStageBox({ width: 0, height: 0 }); return; }
    const byWidth = { width: w, height: (w * 9) / 16 };
    if (byWidth.height <= h) { setStageBox(byWidth); return; }
    setStageBox({ width: (h * 16) / 9, height: h });
  }, []);
  useEffect(() => {
    fitStage();
    const slot = stageSlotRef.current;
    const ro = slot ? new ResizeObserver(() => fitStage()) : null;
    if (slot && ro) ro.observe(slot);
    const onResize = () => fitStage();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => { ro?.disconnect(); window.removeEventListener("resize", onResize); window.visualViewport?.removeEventListener("resize", onResize); };
  }, [fitStage]);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const token = readAccessToken();
      if (!token) {
        if (alive) { setAuth("signed_out"); setCredits(null); }
        return;
      }
      if (alive) setAuth("loading");
      const tryUrl = async (url: string) => {
        const res = await fetch(url, { method: "GET", credentials: "include", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
        if (!res.ok) return null;
        try { return parseCredits(await res.json()); } catch { return null; }
      };
      try {
        const first = await tryUrl("/api/credits/balance");
        const value = first ?? (await tryUrl("/api/credits"));
        if (!alive) return;
        if (value == null) { setAuth("unknown"); setCredits(null); return; }
        setAuth("number"); setCredits(value);
      } catch {
        if (!alive) return;
        setAuth("unknown"); setCredits(null);
      }
    };
    run();
    const onFocus = () => { run(); };
    window.addEventListener("focus", onFocus);
    return () => { alive = false; window.removeEventListener("focus", onFocus); };
  }, []);
  const creditLabel = useMemo(() => {
    if (auth === "signed_out") return "SIGN IN";
    if (auth === "loading") return "...";
    if (auth === "unknown") return "--";
    if (credits == null) return "--";
    return String(credits);
  }, [auth, credits]);
  const onSend = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setShots((prev) => prev.map((item, index) => index === selected ? { ...item, body: text } : item));
    setDraft("");
  };
  return (
    <div ref={shellRef} id="crelavo-aw-thread" style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#070605", color: "#f4eee6", zIndex: 80, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderBottom: "1px solid rgba(244,238,230,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <a href="/" style={{ border: "1px solid rgba(244,238,230,0.28)", borderRadius: 999, padding: "6px 10px", color: "#f4eee6", textDecoration: "none", fontSize: 12, whiteSpace: "nowrap" }}>{"< Home"}</a>
          {!narrow ? (
            <nav style={{ display: "flex", gap: 14, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.8 }}>
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>Crelavo</a>
              <a href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</a>
              <a href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Credits</a>
              <a href="/dashboard/productions" style={{ color: "inherit", textDecoration: "none" }}>Productions</a>
            </nav>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href={auth === "signed_out" ? "/?auth=login" : "/pricing"} style={{ border: "1px solid rgba(244,238,230,0.28)", borderRadius: 999, padding: "6px 10px", color: "#f4eee6", textDecoration: "none", fontSize: 11, letterSpacing: "0.08em" }}>{creditLabel}</a>
          {narrow ? (
            <button type="button" onClick={() => setGoOpen(true)} style={{ border: "1px solid rgba(244,238,230,0.28)", borderRadius: 999, padding: "6px 10px", background: "transparent", color: "#f4eee6", fontSize: 11, letterSpacing: "0.08em" }}>GO</button>
          ) : <span style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.7 }}>LIVE · PRO $9.99/MO</span>}
        </div>
      </header>
      <div ref={stageSlotRef} style={{ flex: "1 1 auto", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: narrow ? 0 : "12px 16px" }}>
        <section style={{ width: stageBox.width || "100%", height: stageBox.height || "100%", background: "radial-gradient(120% 90% at 50% 0%, #c4a36a 0%, #5a3a1c 42%, #1a100b 100%)", border: "1px solid rgba(196,163,106,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: narrow ? 16 : 22, boxSizing: "border-box" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", opacity: 0.75 }}>{shot.kicker}</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: narrow ? 22 : 28, fontWeight: 500, margin: "8px 0 6px", lineHeight: 1.2 }}>{shot.title}</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>{shot.body}</p>
        </section>
      </div>
      <div style={{ flex: "0 0 auto", borderTop: "1px solid rgba(244,238,230,0.12)", padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", opacity: 0.55, marginBottom: 6 }}>REVISE THIS SCENE / PRODUCTION CONTINUES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid rgba(244,238,230,0.2)", marginBottom: 10 }}>
          {shots.map((item, index) => (
            <button key={item.id} type="button" onClick={() => setSelected(index)} style={{ background: index === selected ? "rgba(244,238,230,0.08)" : "transparent", color: "#f4eee6", border: 0, borderRight: index === 3 ? "0" : "1px solid rgba(244,238,230,0.2)", padding: "10px 6px", fontSize: 11, letterSpacing: "0.08em", cursor: "pointer" }}>{item.id} {item.status}</button>
          ))}
        </div>
        <form onSubmit={onSend} style={{ display: "flex", gap: 8 }}>
          <label style={{ position: "absolute", left: -9999 }}>Direct the selected scene</label>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Make this part like this?" style={{ flex: 1, background: "transparent", border: "1px solid rgba(244,238,230,0.28)", borderRadius: 999, color: "#f4eee6", padding: "10px 14px", outline: "none" }} />
          <button type="submit" style={{ border: 0, borderRadius: 999, background: "#f4eee6", color: "#070605", padding: "10px 16px", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer" }}>SEND</button>
        </form>
      </div>
      {goOpen ? (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: "#11100e", borderTop: "1px solid rgba(244,238,230,0.2)", padding: 16, display: "grid", gap: 10 }}>
            <a href="/" style={{ color: "#f4eee6", textDecoration: "none" }}>Home</a>
            <a href="/dashboard" style={{ color: "#f4eee6", textDecoration: "none" }}>Dashboard</a>
            <a href="/pricing" style={{ color: "#f4eee6", textDecoration: "none" }}>Credits</a>
            <a href="/dashboard/productions" style={{ color: "#f4eee6", textDecoration: "none" }}>Productions</a>
            <button type="button" onClick={() => setGoOpen(false)} style={{ marginTop: 8, background: "transparent", color: "#f4eee6", border: "1px solid rgba(244,238,230,0.28)", borderRadius: 999, padding: "8px 12px" }}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
