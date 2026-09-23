"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssistantPreProduction, type ProductionSelection } from "@/components/assistant/AssistantPreProduction";
import { createPortal } from "react-dom";
const AW = "aw6";
const THREAD = "crelavo-aw-thread";
const FORGET_KEYS = ["crelavo-aw-last-v2", "crelavo-aw-last", "crelavo-aw-scene", "crelavo-aw-selected"];
const PACKAGE_BY_CATEGORY: Record<string, string> = {
  campaign: "campaign_starter", ai_agent: "agent_brand_face", localization: "localization_video",
  ad_score_checker: "ad_score_basic", virtual_model_studio: "virtual_model_single",
  cultural_localization: "cultural_localization_brief", campaign_calendar: "campaign_calendar_brief",
  crelavo_academy: "academy_template_pack", community_showcase: "showcase_style_reuse",
  video: "video_draft", drama: "drama_short_series", talking_video: "talking_video_basic",
  documentary: "documentary_short", animation: "animation_explainer", anime_short_film: "anime_short_scene",
  animal_video: "animal_funny_short", nature_video: "nature_cinematic_short",
  planet_space_video: "planet_explainer_short", drone_video: "drone_location_video",
  live_sales_agent: "live_sales_agent_starter", studio: "studio_series_film",
  cinematic_video: "cinematic_video_pack", video_clipping: "video_clipping_shorts",
  avatar: "avatar_design", lip_sync: "lip_sync_video", voice_clone: "voice_clone_pack",
  visual_clone: "visual_clone_pack", video_tools: "video_tools_pack",
  stickman_animation: "stickman_short", music_video: "music_lyric_video",
  website: "website_landing", saas: "saas_dashboard", mobile_app: "mobile_ui",
  image: "image_single", brand_kit: "brand_full", document_pack: "document_pitch",
  admin_project: "admin_basic",
};
type CreditState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "unknown" }
  | { kind: "number"; value: number };
type DeliveryFile = { name: string; mime?: string; content?: string };
type Shot = { id: number; label: string; title: string; body: string; status: string; mediaUrl: string | null; files: DeliveryFile[]; taskId?: string; productionId?: string; planPrompt?: string; };
export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}
function readQuery() {
  if (typeof window === "undefined") return { type: "AI Video", category: "" };
  const q = new URLSearchParams(window.location.search);
  const type = q.get("type") || "AI Video";
  const direct = q.get("category") || "";
  const map: Record<string, string> = { media: "video", video: "video", "AI Video": "video", drone: "drone_video", live_sales: "live_sales_agent", commerce: "campaign", app: "mobile_app", ecommerce: "website", avatar: "avatar", image: "image", documentary: "documentary", animation: "animation" };
  return { type, category: direct || map[type] || map[type.toLowerCase()] || "" };
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
function readSessionClaims(): { sub: string; email: string } | null {
  const token = readAccessToken();
  if (!token) return null;
  try {
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(raw.padEnd(Math.ceil(raw.length / 4) * 4, "="))) as Record<string, unknown>;
    const sub = typeof claims.sub === "string" ? claims.sub : "";
    return sub ? { sub, email: typeof claims.email === "string" ? claims.email : "" } : null;
  } catch { return null; }
}
function isCopyOnlyPrompt(prompt: string) {
  const p = prompt.trim().toLowerCase();
  if (!p || p.length > 280 || /video|film|image|avatar|voice|clone|render|mp4|png|sahne|g\u00f6rsel|\u00fcret|produce|scene/.test(p)) return false;
  return /\b(copy|layout|color|colour|metin|yaz\u0131|renk|palette|typography|tipografi|headline|title|subtitle|spacing|padding|margin|font)\b/.test(p);
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
  for (const k of ["available", "balance", "credits", "credit_balance", "remaining"]) {
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
function readableMessage(value: unknown, fallback = "Production did not start."): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const key of ["message", "error", "detail", "status_msg", "description"]) {
      const nested = readableMessage(o[key], "");
      if (nested) return nested;
    }
    try { const json = JSON.stringify(value); if (json && json !== "{}") return json; } catch {}
  }
  return fallback;
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
    { id: 1, label: "READY", status: "READY", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", mediaUrl: null, files: [] },
    { id: 2, label: "REVISING", status: "REVISING", title: "Hands enter the beam and turn the bottle", body: "Skin, glass, label. Keep the same window light.", mediaUrl: null, files: [] },
    { id: 3, label: "RENDERING", status: "RENDERING", title: "Close-up: texture, pour, catch-light", body: "Slow enough to read the grain. No extra cuts.", mediaUrl: null, files: [] },
    { id: 4, label: "QUEUED", status: "QUEUED", title: "Hold on the shelf. One line. Cut.", body: "Product still. Quiet end card. Same room.", mediaUrl: null, files: [] },
  ];
}
function websiteShots(): Shot[] {
  return [
    { id: 1, label: "HOME", status: "HOME", title: "Home", body: "Hero, proof, and one clear start.", mediaUrl: null, files: [] },
    { id: 2, label: "CATALOG", status: "CATALOG", title: "Catalog", body: "Quiet grid. Product first, noise last.", mediaUrl: null, files: [] },
    { id: 3, label: "STORY", status: "STORY", title: "Story", body: "Why it exists, told in one screen.", mediaUrl: null, files: [] },
    { id: 4, label: "CHECKOUT", status: "CHECKOUT", title: "Checkout", body: "Buy path with no extra noise.", mediaUrl: null, files: [] },
  ];
}
function applyPayload(shot: Shot, data: unknown, prompt: string, website: boolean): Shot {
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const scene = root.scene && typeof root.scene === "object" ? (root.scene as Record<string, unknown>) : root;
  const title = pickStr(scene, ["title", "headline", "name"]);
  const body = pickStr(scene, ["body", "copy", "description", "subtitle"]);
  const mediaObject = root.media && typeof root.media === "object" ? root.media as Record<string, unknown> : {};
  const media = pickStr(mediaObject, ["url"]) || pickStr(scene, ["url", "media_url", "file_url", "video_url", "image_url", "output_url"]);
  const taskId = pickStr(root, ["taskId", "task_id"]);
  const productionId = pickStr(root, ["productionId", "production_id"]);
  const files = Array.isArray(root.files) ? root.files.filter((item): item is DeliveryFile => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).name === "string")) : shot.files;
  return { ...shot, title: title || shot.title, body: body || prompt || shot.body, mediaUrl: media || shot.mediaUrl, files, taskId: taskId || shot.taskId, productionId: productionId || shot.productionId, status: website ? shot.status : "READY", label: website ? shot.label : "READY" };
}
function safeDownloadName(name: string) { return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "crelavo-output.txt"; }
function downloadDeliveryFile(file: DeliveryFile) {
  if (!file.content) return;
  const blob = new Blob([file.content], { type: file.mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = safeDownloadName(file.name); document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadMedia(url: string) {
  const a = document.createElement("a"); a.href = url; a.download = "crelavo-output"; a.target = "_blank"; a.rel = "noreferrer"; document.body.appendChild(a); a.click(); a.remove();
}

async function downloadDeliveryZip(files: DeliveryFile[]) {
  const response = await cinemaFetch("/api/assistant-work/package", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files }) });
  if (!response.ok) throw new Error("ZIP delivery failed.");
  const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "crelavo-delivery.zip"; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AssistantPage({ preProduction }: { preProduction?: ProductionSelection } = {}) {
  const query = useMemo(() => readQuery(), []);
  const [selection, setSelection] = useState<ProductionSelection | null>(preProduction || null);
  const [setupOpen, setSetupOpen] = useState(false);
  const chosen = selection || preProduction;
  const type = chosen?.type || query.type;
  const category = chosen?.categoryId || query.category || "video";
  const website = isWebsiteType(type, category);
  const storageKey = `crelavo-aw-session-v3-${type}-${category}`;
  const restoredRef = useRef(false);
  const skipPersistRef = useRef(true);
  const resumedJobsRef = useRef(new Set<string>());
  const [mounted, setMounted] = useState(false);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(0);
  const [shots, setShots] = useState<Shot[]>(() => (website ? websiteShots() : videoShots()));
  const categoryResetRef = useRef(category);
  const [draft, setDraft] = useState("");
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("REVISE THIS SCENE / PRODUCTION CONTINUES");
  const [credits, setCredits] = useState<CreditState>({ kind: "loading" });
  const loadCredits = useCallback(async () => {
    const claims = readSessionClaims();
    if (!claims) { setCredits({ kind: "signed_out" }); return; }
    try {
      const response = await cinemaFetch(`/api/credits?user_id=${encodeURIComponent(claims.sub)}&t=${Date.now()}`, { method: "GET" });
      const data = await response.json().catch(() => null);
      if (isSessionError(data, response.status)) { setCredits({ kind: "signed_out" }); return; }
      const number = parseCredits(data);
      setCredits(number == null ? { kind: "unknown" } : { kind: "number", value: number });
    } catch { setCredits({ kind: "unknown" }); }
  }, []);
  useEffect(() => {
    if (categoryResetRef.current === category) return;
    categoryResetRef.current = category;
    setShots(website ? websiteShots() : videoShots());
    setSelected(0);
    setDraft("");
    setMaterialFiles([]);
    setNotice("SETUP UPDATED / READY FOR A NEW PRODUCTION");
  }, [category, website]);
  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { shots?: Shot[]; selected?: number; notice?: string };
        if (Array.isArray(parsed.shots) && parsed.shots.length > 0) setShots(parsed.shots);
        if (Number.isInteger(parsed.selected)) setSelected(Math.max(0, Math.min(3, Number(parsed.selected))));
        if (parsed.notice) setNotice(String(parsed.notice));
      }
    } catch { /* ignore invalid session state */ }
    restoredRef.current = true;
    skipPersistRef.current = true;
  }, [storageKey]);
  useEffect(() => {
    if (!restoredRef.current || typeof window === "undefined") return;
    if (skipPersistRef.current) { skipPersistRef.current = false; return; }
    try { window.sessionStorage.setItem(storageKey, JSON.stringify({ shots, selected, notice, savedAt: Date.now() })); } catch { /* ignore storage limits */ }
  }, [shots, selected, notice, storageKey]);
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
  async function pollQueuedJob(index: number, initialTaskId: string, productionId?: string) {
    let taskId = initialTaskId;
    for (let attempt = 0; attempt < 36; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 10000));
      try {
        const response = await cinemaFetch("/api/assistant-work/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, taskId, productionId: productionId || shots[index]?.productionId }) });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) { setNotice(readableMessage(data?.message, "PROVIDER STATUS CHECK FAILED").toUpperCase()); return; }
        if (data.taskId && String(data.taskId) !== taskId) { taskId = String(data.taskId); setShots((cur) => cur.map((item, shotIndex) => shotIndex === index ? { ...item, taskId } : item)); }
        if (data.status === "failed") { setNotice(readableMessage(data.message, "PRODUCTION FAILED").toUpperCase()); return; }
        if (data.status === "ready" && data.mediaUrl) { setShots((cur) => cur.map((item, shotIndex) => shotIndex === index ? { ...item, mediaUrl: String(data.mediaUrl), status: "READY", label: "READY", taskId: undefined } : item)); setNotice("SCENE READY / DOWNLOAD AVAILABLE"); return; }
      } catch { return; }
    }
  }
  useEffect(() => {
    if (!mounted) return;
    shots.forEach((item, index) => {
      if (item.taskId && !resumedJobsRef.current.has(item.taskId)) {
        resumedJobsRef.current.add(item.taskId);
        void pollQueuedJob(index, item.taskId, item.productionId);
      }
    });
  }, [mounted, shots, category]);
  async function renderFinalScene() {
    const currentPrompt = shot.planPrompt || shot.body;
    if (!currentPrompt.trim() || sending) return;
    setSending(true); setNotice("03 RENDERING / STARTING FINAL PROVIDER JOB");
    try {
      const response = await cinemaFetch("/api/assistant-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "render", render: true, prompt: currentPrompt, type, category, scene: selected + 1, categoryId: chosen?.categoryId, packId: chosen?.packId, features: chosen?.features, extras: chosen?.extras }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(readableMessage(data?.message || data?.error, "Final render did not start."));
      const next = applyPayload(shot, data, currentPrompt, website);
      setShots((cur) => cur.map((item, index) => index === selected ? { ...next, planPrompt: currentPrompt } : item));
      setNotice(data.status === "ready" ? "SCENE READY / DOWNLOAD AVAILABLE" : "04 QUEUED / FINAL RENDER IN PROGRESS");
      if (data.status === "queued" && data.taskId) void pollQueuedJob(selected, String(data.taskId), String(data.productionId || ""));
    } catch (error) { setNotice(error instanceof Error ? error.message.toUpperCase() : "FINAL RENDER FAILED"); } finally { setSending(false); }
  }
  async function onSend() {
    const prompt = draft.trim();
    if (!prompt || sending) return;
    const claims = readSessionClaims();
    if (!claims) { window.location.href = "/?auth=login"; return; }
    if (credits.kind === "number" && credits.value <= 0 && !isCopyOnlyPrompt(prompt)) {
      setNotice("NOT ENOUGH CREDITS / PRODUCTION STOPPED");
      return;
    }

    const prev = shots[selected];
    setDraft("");
    setSending(true);
    setNotice(isCopyOnlyPrompt(prompt) ? "UPDATING COPY / NO CREDIT SPEND" : "CREATING PRODUCTION / CONNECTING WORKER");
    setShots((cur) => cur.map((item, index) => index === selected ? { ...item, mediaUrl: null, files: [], taskId: undefined, status: website ? item.status : "REVISING", label: website ? item.label : "REVISING" } : item));

    try {
      let sourceVideoUrl: string | undefined;
      if (category === "video_clipping" && materialFiles[0]) {
        const form = new FormData(); form.set("user_id", claims.sub); form.set("file", materialFiles[0]); form.set("purpose", "video_clipping_source");
        const uploadResponse = await cinemaFetch("/api/materials/upload", { method: "POST", body: form });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !uploadData.material?.file_url) throw new Error(readableMessage(uploadData.error, "Source video upload failed."));
        sourceVideoUrl = String(uploadData.material.file_url);
      }
      const response = await cinemaFetch("/api/assistant-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", render: false, prompt, type, category, scene: selected + 1, sourceVideoUrl, categoryId: preProduction?.categoryId, packId: preProduction?.packId, features: preProduction?.features, extras: preProduction?.extras }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok === false) {
        if (response.status === 402) await loadCredits();
        throw new Error(readableMessage(data?.message ?? data?.error, "Production did not start."));
      }
      const next = applyPayload(prev, data, prompt, website);
      setShots((cur) => cur.map((item, index) => index === selected ? next : item));
      const nextBalance = parseCredits(data);
      if (nextBalance != null) setCredits({ kind: "number", value: nextBalance });
      setShots((cur) => cur.map((item, index) => index === selected ? { ...item, planPrompt: prompt } : item));
      setNotice("01 READY / SCENE PLAN UPDATED");
      if (data.status === "queued" && data.taskId) void pollQueuedJob(selected, String(data.taskId));
      setSending(false);
    } catch (error) {
      setShots((cur) => cur.map((item, index) => index === selected ? prev : item));
      setNotice(error instanceof Error ? error.message.toUpperCase() : "PRODUCTION DID NOT START / TRY AGAIN");
      setSending(false);
    }
  }
  if (!mounted) return null;
  const shell = (
    <div id={THREAD} data-aw={AW} translate="no" className="notranslate" style={{ position: "fixed", inset: 0, width: vp.w ? `${vp.w}px` : "100vw", height: vp.h ? `${vp.h}px` : "100dvh", overflow: "hidden", zIndex: 9999, display: "flex", flexDirection: "column", background: "#070605", color: "rgb(244, 238, 230)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`#${THREAD}, #${THREAD} * { box-sizing: border-box; } #${THREAD} a { color: inherit; text-decoration: none; } #${THREAD} button, #${THREAD} input { font-family: inherit; }`}</style>
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 18, padding: "10px 16px", background: "#070605" }}>
        <a href="/" style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>&lt; HOME</a><button type="button" onClick={() => setSetupOpen(true)} style={{ border: "1px solid rgba(245,199,122,0.65)", borderRadius: 999, padding: "6px 12px", fontSize: 10, letterSpacing: "0.12em", background: "transparent", color: "#f5c77a" }}>SETUP</button>
        <nav style={{ display: "flex", gap: 16, fontSize: 11, letterSpacing: "0.16em", opacity: 0.78, flex: 1, minWidth: 0, overflow: "hidden" }}><span style={{ color: "#f5c77a", whiteSpace: "nowrap" }}>PRODUCTION: {type} / {category}</span>
          <a href="/">CRELAVO</a><a href="/dashboard">DASHBOARD</a><a href="/pricing">CREDITS</a><a href="/dashboard/productions">PRODUCTIONS</a>
        </nav>
        {credits.kind === "signed_out" ? <a href="/?auth=login" style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>SIGN IN</a> : <div style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 12px", fontSize: 11, letterSpacing: "0.12em" }}>{creditLabel}</div>}
        <a href="/pricing" style={{ fontSize: 11, letterSpacing: "0.12em", opacity: 0.7 }}>LIVE &middot; PRO $9.99/MO</a>
      </header>
      {setupOpen ? <aside aria-label="Production setup" translate="no" className="notranslate" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(460px, 92vw)", zIndex: 20, overflow: "auto", padding: "18px 14px 42px", background: "rgba(7,6,5,0.98)", borderLeft: "1px solid rgba(245,199,122,0.35)", boxShadow: "-18px 0 48px rgba(0,0,0,0.4)" }}><div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><button type="button" onClick={() => setSetupOpen(false)} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 10px", background: "transparent", color: "inherit", fontSize: 10 }}>CLOSE</button></div><AssistantPreProduction initialCategoryId={chosen?.categoryId || query.category} onConfirm={(next) => { setSelection(next); setSetupOpen(false); }} /></aside> : null}
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
      {(["lip_sync", "voice_clone", "visual_clone", "localization", "video_tools", "video_clipping"].includes(category)) ? <div style={{ padding: "8px 12px 0", display: "grid", gap: 5 }}><label style={{ fontSize: 10, letterSpacing: "0.12em", opacity: 0.72 }}>{category === "lip_sync" ? "SOURCE VIDEO + AUDIO" : category === "voice_clone" ? "AUTHORIZED VOICE AUDIO" : category === "visual_clone" ? "AUTHORIZED REFERENCE IMAGE" : category === "localization" ? "SOURCE VIDEO" : category === "video_clipping" ? "SOURCE VIDEO" : "OPTIONAL SOURCE MEDIA"}</label><input type="file" multiple={category === "lip_sync" || category === "video_tools" || category === "video_clipping"} accept={category === "voice_clone" ? "audio/*" : category === "visual_clone" ? "image/*" : category === "localization" || category === "video_clipping" ? "video/*" : category === "lip_sync" ? "video/*,audio/*" : "video/*,image/*,audio/*"} onChange={(event) => setMaterialFiles(Array.from(event.currentTarget.files || []))} style={{ fontSize: 11 }} /><small style={{ opacity: 0.55 }}>{materialFiles.length ? materialFiles.map((file) => file.name).join(", ") : "Maximum 50 MB per file. Only use media you own or are authorized to use."}</small></div> : null}
             {(shot.mediaUrl || shot.files.length > 0) ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px 0" }}><span style={{ width: "100%", fontSize: 10, letterSpacing: "0.12em", opacity: 0.7 }}>DELIVERY READY</span>{shot.mediaUrl ? <button type="button" onClick={() => downloadMedia(shot.mediaUrl!)} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, background: "transparent", color: "inherit", padding: "7px 10px", fontSize: 10 }}>DOWNLOAD MEDIA</button> : null}{shot.files.length > 0 ? <button type="button" onClick={() => void downloadDeliveryZip(shot.files)} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, background: "transparent", color: "inherit", padding: "7px 10px", fontSize: 10 }}>DOWNLOAD ZIP</button> : null}{shot.files.map((file) => <button key={file.name} type="button" onClick={() => downloadDeliveryFile(file)} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, background: "transparent", color: "inherit", padding: "7px 10px", fontSize: 10 }}>{file.name}</button>)}</div> : null}
<div style={{ padding: "6px 14px 0", fontSize: 9, opacity: 0.55 }}>SEND confirms you own or have permission to use the submitted content and starts a credit-priced production unless the request is copy/layout/color only.</div>
      <form onSubmit={(e) => { e.preventDefault(); void onSend(); }} style={{ flex: "0 0 auto", display: "flex", gap: 10, padding: "10px 12px 12px" }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Make this part like this?" disabled={sending} style={{ flex: 1, minWidth: 0, background: "transparent", border: "1px solid rgba(244,238,230,0.22)", borderRadius: 999, color: "rgb(244,238,230)", padding: "12px 16px", fontSize: 14, outline: "none" }} />
        <button type="button" onClick={() => void renderFinalScene()} disabled={sending || !shot.body.trim()} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, background: "transparent", color: "inherit", padding: "0 14px", fontSize: 10 }}>RENDER FINAL VIDEO</button><button type="submit" disabled={sending || !draft.trim()} style={{ border: "none", borderRadius: 999, background: "rgb(248,251,255)", color: "#111", padding: "0 18px", fontSize: 11, letterSpacing: "0.14em", cursor: sending || !draft.trim() ? "default" : "pointer", opacity: sending || !draft.trim() ? 0.5 : 1 }}>SEND</button>
      </form>
    </div>
  );
  return createPortal(shell, document.body);
}
