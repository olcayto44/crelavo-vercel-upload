"use client";
import { useWebsiteAssistant, WebsitePlanControls } from "./WebsiteAssistantPanel";
import { WebsiteBuilderForm } from "@/components/WebsiteBuilderForm";
import { WebsiteWorkspacePreview } from "./WebsiteWorkspacePreview";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
import { websiteWorkspaceStatus, translateWorkspaceText } from "@/lib/assistant-work/workspace-i18n";
import { workspaceChatIntent } from "@/lib/assistant-work/chat-intent";
import { normalizeWorkspaceMessages } from "@/lib/assistant-work/workspace-chat";
import { abortableDelay, createProductionPollingRegistry } from "@/lib/assistant-work/polling";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssistantPreProduction, type ProductionSelection } from "@/components/assistant/AssistantPreProduction";
import { CATEGORIES, GROUPS, getCategory } from "@/lib/crelavo/categoryCatalog";
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
type Shot = { id: number; label: string; title: string; body: string; status: string; mediaUrl: string | null; files: DeliveryFile[]; taskId?: string; productionId?: string; planPrompt?: string; planVersionId?: string; approvedPlanVersionId?: string; spokenScript?: string; mediaKind?: "video"|"image"|"audio"; estimatedCredits?: number; progress?: number; };
type ChatMessage = { role: "user" | "assistant"; content: string; };
export function CinemaRouteGuard() {
  useEffect(() => { window.onbeforeunload = null; }, []);
  return null;
}
function readQuery(search: string) {

  const q = new URLSearchParams(search);
  const type = q.get("type") || "General";
  const direct = q.get("category") || "";
  const map: Record<string, string> = { media: "video", video: "video", "AI Video": "video", drone: "drone_video", live_sales: "live_sales_agent", commerce: "campaign", app: "mobile_app", ecommerce: "website", avatar: "avatar", image: "image", documentary: "documentary", animation: "animation" };
  const raw = direct || type;
  const category = getCategory(raw)?.id || map[raw] || map[raw.toLowerCase()] || CATEGORIES.find(item=>item.type.toLowerCase()===raw.toLowerCase() || item.label.toLowerCase()===raw.toLowerCase())?.id || "";
  // Kategori secildiginde baslikta ham sorgu dizesi degil, gercek kategori adi gosterilir.
  const label: Record<string, string> = { video: "AI Video", drone_video: "Drone Video", campaign: "Campaign", mobile_app: "Mobile App", website: "Website", avatar: "Avatar", image: "Image", documentary: "Documentary", animation: "Animation", live_sales_agent: "Live Sales Agent" };
  const resolvedType = category ? (getCategory(category)?.type || label[category] || type) : type;
  return { type: resolvedType, category };
}
function isWebsiteType(type: string, category: string) { return /website/i.test(type) || /website/i.test(category); }
function categoryEnginePlan(type: string, category: string): string[] {
  if (category === "website") return ["[done] Request received: Website production selected", "[next] Site type, industry, and features", "[ ] Website builder foundation", "[ ] Page plan and credit estimate"];
  if (category === "video") return ["[done] Request received: AI video selected", "[next] Product, audience, and platform", "[ ] TikTok / Reels hook plan", "[ ] Video brief and credit estimate"];
  if (category) return [`[done] Request received: ${type} selected`, "[next] Identify category-specific requirements", "[ ] Select the right tools and production path", "[ ] Plan the task and calculate credits"];
  return ["[next] Waiting for your production request", "[ ] Choose web, video, app, or social production", "[ ] Activate the relevant category engine", "[ ] Plan the task and start production"];
}
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
function sceneSummary(prompt: string) {
  const normalized = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Scene plan ready for production.";
  const first = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  const compact = first.length > 180 ? `${first.slice(0, 177).trim()}...` : first;
  return compact;
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
const PLACEHOLDER_SCENE_TITLES = new Set([
  "Morning window, product on a pale oak shelf",
  "Hands enter the beam and turn the bottle",
  "Close-up: texture, pour, catch-light",
  "Hold on the shelf. One line. Cut.",
]);
/** Gercek uretim kaydi olmayan ornek kartlari gercek is gibi gostermez. */
function normalizeSceneStates(list: Shot[]): Shot[] {
  return list.map((shot) => {
    if (shot.productionId || shot.taskId || shot.mediaUrl || shot.files?.length) return shot;
    if (!PLACEHOLDER_SCENE_TITLES.has(shot.title)) return shot;
    return { ...shot, status: "PLANNED", label: "PLANNED" };
  });
}
function videoShots(): Shot[] {
  return [
    { id: 1, label: "PLANNED", status: "PLANNED", title: "Morning window, product on a pale oak shelf", body: "Soft sidelight. Dust in the beam. Hold, then a slow push.", mediaUrl: null, files: [] },
    { id: 2, label: "PLANNED", status: "PLANNED", title: "Hands enter the beam and turn the bottle", body: "Skin, glass, label. Keep the same window light.", mediaUrl: null, files: [] },
    { id: 3, label: "PLANNED", status: "PLANNED", title: "Close-up: texture, pour, catch-light", body: "Slow enough to read the grain. No extra cuts.", mediaUrl: null, files: [] },
    { id: 4, label: "PLANNED", status: "PLANNED", title: "Hold on the shelf. One line. Cut.", body: "Product still. Quiet end card. Same room.", mediaUrl: null, files: [] },
  ];
}
function categoryShots(id: string): Shot[] {
  const config = getCategory(id);
  if (!config) return [{ id:1, label:"PLANNED", status:"PLANNED", title:"Select a production category", body:"Choose a category to create a plan. No production has started.", mediaUrl:null, files:[] }];
  return config.features.map((feature,index) => ({ id:index+1, label:"PLANNED", status:"PLANNED", title:feature.label, body:`Plan ${feature.label.toLowerCase()} for your ${config.label} project. Review the scope and credit estimate before production.`, mediaUrl:null, files:[] }));
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
  const files = Array.isArray(root.files) ? root.files.flatMap((item): DeliveryFile[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : typeof record.path === "string" ? record.path : "";
    return name ? [{ name, mime: typeof record.mime === "string" ? record.mime : undefined, content: typeof record.content === "string" ? record.content : undefined }] : [];
  }) : shot.files;
  const ready = String(root.status || "").toLowerCase() === "ready";
  return { ...shot, title: title || shot.title, body: body || prompt || shot.body, mediaUrl: ready ? media || null : null, files, taskId: taskId || shot.taskId, productionId: productionId || shot.productionId, mediaKind: ["video","image","audio"].includes(String(mediaObject.kind)) ? mediaObject.kind as Shot["mediaKind"] : shot.mediaKind, status: ready ? "READY" : String(root.status || "draft").toUpperCase(), label: ready ? "READY" : String(root.status || "draft").toUpperCase() };
}
function safeDownloadName(name: string) { return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "crelavo-output.txt"; }
function downloadDeliveryFile(file: DeliveryFile) {
  if (!file.content) return;
  const content = /^data:[^;]+;base64,/.test(file.content) ? Uint8Array.from(atob(file.content.split(",")[1]),char=>char.charCodeAt(0)) : file.content;
  const blob = new Blob([content], { type: file.mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = safeDownloadName(file.name); document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function downloadMedia(url: string, kind?: Shot["mediaKind"]) {
  const response=await fetch(url,{credentials:"omit"});if(!response.ok)throw new Error("Media download unavailable.");
  const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
  const mime=blob.type,extension=mime.includes("jpeg")?"jpg":mime.includes("png")?"png":mime.includes("webp")?"webp":mime.includes("wav")?"wav":mime.includes("mpeg")?"mp3":mime.includes("webm")?"webm":kind==="audio"?"mp3":kind==="image"?"jpg":"mp4";
  try{const a=document.createElement("a");a.href=objectUrl;a.download="crelavo-output."+extension;document.body.appendChild(a);a.click();a.remove();}
  finally{window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);}
}

async function downloadDeliveryZip(files: DeliveryFile[]) {
  const response = await cinemaFetch("/api/assistant-work/package", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files }) });
  if (!response.ok) throw new Error("ZIP delivery failed.");
  const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "crelavo-delivery.zip"; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AssistantPage({ preProduction }: { preProduction?: ProductionSelection } = {}) {
  useWorkspaceLanguage();
  const t = useCallback((value: string, variables?: Record<string, string | number>) => translateWorkspaceText(value, "en", variables), []);
  const language = "en";
  const { openAuth, user: authUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeKey = searchParams.toString();
  const query = useMemo(() => readQuery(routeKey), [routeKey]);
  const [selectionRoute, setSelectionRoute] = useState(routeKey);
  const [selection, setSelection] = useState<ProductionSelection | null>(preProduction || null);
  const [setupOpen, setSetupOpen] = useState(false);
  const chosen = selectionRoute === routeKey ? selection || preProduction : preProduction;
  const type = chosen?.type || query.type;
  const websiteRequested = chosen?.categoryId === "website" || query.category === "website" || /website/i.test(type);
  const category = websiteRequested ? "website" : (chosen?.categoryId || query.category || "");
  const engineCategory = category || "general";
  const enginePlan = categoryEnginePlan(type, engineCategory);
  const website = isWebsiteType(type, category);
  const websiteFlow = useWebsiteAssistant({ enabled: website, selection: chosen || undefined, request: cinemaFetch });
  const categoryConfig = getCategory(engineCategory);
  const storageKey = "crelavo-aw-project-v5:" + (authUser?.id || "signed-out") + ":" + engineCategory;
  const restoredRef = useRef(false);
  const skipPersistRef = useRef(true);
  const resumedJobsRef = useRef(new Set<string>());
  const pollingRef = useRef(createProductionPollingRegistry());
  const contextRequestRef = useRef<AbortController | null>(null);
  useEffect(() => { resumedJobsRef.current.clear(); setSending(false); return () => { pollingRef.current.cancelAll(); contextRequestRef.current?.abort(); resumedJobsRef.current.clear(); }; }, [storageKey, routeKey]);
  const [mounted, setMounted] = useState(false);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState(0);
  const [shots, setShots] = useState<Shot[]>(() => (website ? websiteShots() : categoryShots(category)));
  const categoryResetRef = useRef(category);
  const [mediaProjectId,setMediaProjectId]=useState("");
  const [mergeOrder,setMergeOrder]=useState<string[]>([]);
  const [mergeBusy,setMergeBusy]=useState(false);
  const [mergeProductionId,setMergeProductionId]=useState("");
  const [mergedUrl,setMergedUrl]=useState("");
  const [mergeAspect,setMergeAspect]=useState("");
  const [mergeFit,setMergeFit]=useState("cover");
  const [mergeTransition,setMergeTransition]=useState("fade");
  const mergedVideoRef=useRef<HTMLVideoElement>(null);
  const [assistantOpen,setAssistantOpen]=useState(true);
  const [previewMode, setPreviewMode] = useState<"scene" | "merged">("scene");
  const [activeTool, setActiveTool] = useState("production");
  const [menuOpen, setMenuOpen] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(!category);
  const videoWorkspace = Boolean(categoryConfig && ["media", "special_video"].includes(categoryConfig.group));
  useEffect(() => { setActiveTool("production"); setCategorySearch(""); setCategoryPickerOpen(!category); setSetupOpen(false); }, [category]);
  useEffect(() => { if (window.innerWidth <= 760) setMenuOpen(false); }, []);
  function pickCategory(id: string) {
    const next = getCategory(id); if (!next) return;
    setCategorySearch(""); setCategoryPickerOpen(false); setSelection(null); setSetupOpen(false);
    router.push("?" + new URLSearchParams({ category: next.id, type: next.type }).toString());
  }
  const [uploadBusy,setUploadBusy]=useState(false);
  const [uploadNotice,setUploadNotice]=useState("");
  async function uploadVideos(files: File[]) {
    if(!projectLoaded||uploadBusy||mergeBusy||!mediaProjectId||!files.length)return;
    if(files.length+mergeOrder.length>12){setUploadNotice("Select no more than 12 videos.");return;}
    if(files.some(file=>!file.name.toLowerCase().endsWith(".mp4")||file.size===0||file.size>50*1024*1024)){
      setUploadNotice("Only MP4 files are supported, up to 50 MB per file.");return;
    }
    setUploadBusy(true);
    try {
      for(let i=0;i<files.length;i++){
        const file=files[i];setUploadNotice(`${i+1}/${files.length}: ${file.name} uploading...`);
        const prepared=await cinemaFetch("/api/assistant-work/merge/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"prepare",projectId:mediaProjectId,name:file.name,size:file.size})});
        const ticket=await prepared.json();if(!prepared.ok||!ticket.signedUrl)throw new Error(ticket.message||ticket.error||"Upload baslatilamadi.");
        const sent=await fetch(ticket.signedUrl,{method:"PUT",headers:{"Content-Type":"video/mp4","x-upsert":"false"},body:file,credentials:"omit"});
        if(!sent.ok)throw new Error("Upload failed. Check the connection and file size.");
        const completed=await cinemaFetch("/api/assistant-work/merge/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"complete",projectId:mediaProjectId,productionId:ticket.productionId})});
        const result=await completed.json();if(!completed.ok)throw new Error(result.message||result.error||"Upload dogrulanamadi.");
        setShots(cur=>[...cur,{id:Math.max(0,...cur.map(s=>s.id))+1,title:result.title,body:"Uploaded video",status:"READY",label:"READY",mediaUrl:result.mediaUrl,mediaKind:"video",productionId:result.productionId,files:[]}]);
        setMergeOrder(cur=>[...cur,result.productionId]);
      }
      setUploadNotice("Videos uploaded. Review the order before merging.");
    } catch(error){setUploadNotice(error instanceof Error?error.message:"Upload failed.");}
    finally{setUploadBusy(false);}
  }
  useEffect(()=>{if(!website&&!mediaProjectId)setMediaProjectId(crypto.randomUUID());},[website,mediaProjectId]);
  async function mergeScenes(){
    if(!projectLoaded||uploadBusy||mergeBusy||!mergeAspect||mergeOrder.length<2||mergeOrder.length>12)return;
    setMergeBusy(true);
    try{const r=await cinemaFetch("/api/assistant-work/merge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:mediaProjectId,productionIds:mergeOrder,options:{aspect:mergeAspect,fit:mergeFit,transition:mergeTransition}})});const d=await r.json();if(!r.ok||!d.productionId)throw new Error(d.message||"Merge could not start");setMergeProductionId(d.productionId);setNotice("SCENE MERGE QUEUED / MY PRODUCTIONS");}
    catch(e){setNotice(e instanceof Error?e.message:"Merge failed");setMergeBusy(false);}
  }
  useEffect(()=>{
    if(!mergeProductionId)return;let stopped=false;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    const poll=async()=>{try{const r=await cinemaFetch("/api/assistant-work/status",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({productionId:mergeProductionId})});const d=await r.json();if(stopped)return;if(r.ok&&d.status==="ready"&&d.mediaUrl){setMergedUrl(d.mediaUrl);setPreviewMode("merged");setMergeBusy(false);setMergeProductionId("");setNotice("MERGED VIDEO READY / MY PRODUCTIONS");return;}if(r.ok&&d.status==="failed"){setMergeBusy(false);setMergeProductionId("");setNotice("SCENE MERGE FAILED");return;}}catch{}if(!stopped)timer=setTimeout(poll,4000);};void poll();
    return()=>{stopped=true;controller.abort();clearTimeout(timer);};
  },[mergeProductionId]);
  const [draft, setDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [planApproved, setPlanApproved] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("REVISE THIS SCENE / PRODUCTION CONTINUES");
  const [credits, setCredits] = useState<CreditState>({ kind: "loading" });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatActivityRef = useRef(0);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ block: "nearest" }); }, [chatMessages, websiteFlow.project?.website.messages, websiteFlow.messages.length, websiteFlow.busy]);
  const currentExtras = { ...(chosen?.extras || {}), reference_url: referenceUrl.trim() };
  const planSnapshot = { category, packId: chosen?.packId || "", extras: currentExtras, referenceUrl: referenceUrl.trim() };
  const persistProject = useCallback(async (state: Record<string, unknown>) => { try { await cinemaFetch("/api/assistant-work/project", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Website project", state }) }); } catch { /* local session remains available */ } }, []);
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
    setPlanApproved(false);
    setNotice(`CATEGORY UPDATED / ${getCategory(category)?.label || type} MODE / PROJECT CONTEXT PRESERVED`);
  }, [category, website]);
  useEffect(() => {
    setMounted(true);
    if (website) return;
    let active = true; const restoreVersion = chatActivityRef.current;
    setChatMessages([]); setShots(categoryShots(category)); setSelected(0); setPlanApproved(false); setMaterialFiles([]); setReferenceUrl(""); setProjectLoaded(false); setMergeOrder([]); setMergeProductionId(""); setMergeBusy(false); setMergedUrl(""); setPreviewMode("scene"); setMergeAspect(""); setMergeFit("cover"); setMergeTransition("fade"); setMediaProjectId(crypto.randomUUID());
    function restore(raw: unknown) {
      if (!active || !raw || typeof raw !== "object") return;
      const state = raw as Record<string, unknown>;
      if (state.category !== engineCategory) return;
      if(typeof state.mergedUrl === "string")setMergedUrl(state.mergedUrl);
      if(state.mergeAspect === "16:9" || state.mergeAspect === "9:16")setMergeAspect(state.mergeAspect);
      if(state.mergeFit === "cover" || state.mergeFit === "contain")setMergeFit(state.mergeFit);
      if(state.mergeTransition === "fade" || state.mergeTransition === "cut")setMergeTransition(state.mergeTransition);
      if(typeof state.mediaProjectId==="string")setMediaProjectId(state.mediaProjectId);
      if(typeof state.mergeProductionId==="string"){setMergeProductionId(state.mergeProductionId);setMergeBusy(Boolean(state.mergeProductionId));}
      if(Array.isArray(state.mergeOrder))setMergeOrder(state.mergeOrder.filter((id):id is string=>typeof id==="string"));
      if (Array.isArray(state.shots) && state.shots.length) setShots(normalizeSceneStates(state.shots as Shot[]));
      if (Number.isInteger(state.selected)) setSelected(Math.max(0, Number(state.selected)));
      if (typeof state.notice === "string") setNotice(state.notice);
      if (typeof state.referenceUrl === "string") setReferenceUrl(state.referenceUrl);
      // Restored client flags are not server approval. The explicit button verifies the saved version.
      setChatMessages(normalizeWorkspaceMessages(state.chatMessages));
    }
    try { const saved = window.sessionStorage.getItem(storageKey); if (saved) restore(JSON.parse(saved)); } catch { /* ignore invalid session state */ }
    restoredRef.current = true; skipPersistRef.current = true;
    void cinemaFetch("/api/assistant-work/project", { method: "GET" }).then((response) => response.json()).then((data) => { if (chatActivityRef.current === restoreVersion) restore(data?.state); if (active) setProjectLoaded(true); }).catch(() => { if (active) setProjectLoaded(true); });
    return () => { active = false; };
  }, [storageKey, website]);
  useEffect(() => {
    if (website || !restoredRef.current || typeof window === "undefined") return;
    if (skipPersistRef.current) { skipPersistRef.current = false; return; }
    try { window.sessionStorage.setItem(storageKey, JSON.stringify({ mediaProjectId, mergeOrder, mergeProductionId, mergedUrl, mergeAspect, mergeFit, mergeTransition, category: engineCategory, shots, selected, notice, referenceUrl, planApproved, chatMessages, savedAt: Date.now() })); } catch { /* ignore storage limits */ }
  }, [mediaProjectId, mergeOrder, mergeProductionId, mergedUrl, mergeAspect, mergeFit, mergeTransition, shots, selected, notice, referenceUrl, planApproved, chatMessages, storageKey, website, engineCategory]);
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
  const [previewRevision, setPreviewRevision] = useState(0);
  const websitePhase = websiteFlow.project?.status || "draft";
  const websitePages = websiteFlow.runtimePlan?.pages.every(page => page.slug) && websiteFlow.runtimePlan.pages.length ? websiteFlow.runtimePlan.pages.map(page => ({ title: page.title, path: page.slug === "home" ? "index.html" : page.slug + ".html" })) : websiteFlow.project?.website.pageManifest?.length ? websiteFlow.project.website.pageManifest : (websitePhase === "ready" ? [{ title: "Home", path: "index.html" }] : (websiteFlow.brief.pages.length ? websiteFlow.brief.pages : websiteShots().map((item) => item.title)).map((title, index) => ({ title, path: index ? "page-" + (index + 1) + ".html" : "index.html" })));
  const displayShots: Shot[] = website ? websitePages.map((page, index) => ({ id: index + 1, title: page.title, label: websitePhase === "ready" ? "READY" : websitePhase === "generating" ? "RENDERING" : page.title.toUpperCase(), status: websitePhase, body: websiteFlow.brief.brief || websiteShots()[index]?.body || "Website page plan awaits approval.", mediaUrl: null, files: [], progress: websitePhase === "ready" ? 100 : undefined, productionId: websiteFlow.project?.productionId })) : shots;
  const activeIndex = Math.min(selected, Math.max(0, displayShots.length - 1));
  const shot = displayShots[activeIndex] || displayShots[0];
  const displayBusy = website ? websiteFlow.busy : sending;
  const effectiveApproved = website ? websiteFlow.approved : Boolean(shot.planVersionId && shot.approvedPlanVersionId === shot.planVersionId && planApproved);
  const workspaceNotice = website ? websiteWorkspaceStatus(websiteFlow.project, websiteFlow.dirty, websiteFlow.approved) : notice;
  const canRender = website ? websiteFlow.approved && !websiteFlow.busy && websitePhase !== "ready" && websitePhase !== "generating" : !sending && effectiveApproved && !shot.taskId && !["QUEUED","RENDERING","RECONCILE_REQUIRED"].includes(shot.status) && Boolean(shot.planPrompt?.trim());
  const kicker = website ? `${t("Page").toUpperCase()} ${String(shot.id).padStart(2, "0")} / ${shot.label}` : `${t("Scene").toUpperCase()} ${String(shot.id).padStart(2, "0")} / SELECTED`;
  const previewIsMerged = previewMode === "merged" && Boolean(mergedUrl);
  const previewUrl = previewIsMerged ? mergedUrl : shot.mediaUrl;
  const previewKind = previewIsMerged ? "video" : shot.mediaKind;
  const creditLabel = credits.kind === "loading" ? "..." : credits.kind === "signed_out" ? "SIGN IN" : credits.kind === "unknown" ? "--" : String(credits.value);
  const selectedPack = categoryConfig?.packs.find((pack) => pack.id === (website ? websiteFlow.packId : chosen?.packId));
  const estimatedCredits = website && !websiteFlow.dirty ? websiteFlow.project?.website.credits ?? 0 : shot.estimatedCredits ?? selectedPack?.credits ?? 0;
  async function pollQueuedJob(index: number, initialTaskId: string, productionId?: string) {
    if (!productionId) return;
    const key=productionId,registry=pollingRef.current,loop=registry.begin(key);
    if(!loop)return;
    const signal=loop.controller.signal;
    let taskId=initialTaskId;
    const active=()=>registry.current(key,loop.id);
    try {
      for(let attempt=0;attempt<36 && active();attempt++) {
        await abortableDelay(10000,signal);
        try {
          const response=await cinemaFetch("/api/assistant-work/status",{method:"POST",signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({productionId})});
          const data=await response.json().catch(()=>null);
          if(!active())return;
          if(!response.ok||!data?.ok){setNotice("STATUS TEMPORARILY UNAVAILABLE / PRODUCTION STATE UNCHANGED");continue;}
          if(data.taskId)taskId=String(data.taskId);
          if(data.status==="reconcile_required"||data.status==="failed") {
            setShots(cur=>cur.map(item=>item.productionId===productionId?{...item,status:String(data.status).toUpperCase(),label:String(data.status).toUpperCase(),taskId:undefined}:item));
            setNotice(data.status==="failed"?"PRODUCTION FAILED":"RECONCILIATION REQUIRED / NO AUTOMATIC RETRY OR REFUND");return;
          }
          if(data.status==="ready" && (data.mediaUrl||data.files?.length)) {
            setShots(cur=>cur.map(item=>item.productionId===productionId?{...item,mediaUrl:data.mediaUrl||null,mediaKind:data.mediaKind||data.media?.kind,files:data.files||item.files,status:"READY",label:"READY",progress:100,taskId:undefined}:item));
            setNotice("SCENE READY / DOWNLOAD AVAILABLE");void loadCredits();return;
          }
          setShots(cur=>cur.map(item=>item.productionId===productionId?{...item,taskId,status:"RENDERING",label:"RENDERING",progress:Math.min(95,5+Math.round(attempt/36*90))}:item));
        } catch { if(!active())return; setNotice("STATUS NETWORK ERROR / PRODUCTION STATE UNCHANGED"); }
      }
    } catch { /* Context cancellation is not a failed production. */ }
    finally { registry.finish(key,loop.id); }
  }
  useEffect(() => {
    if(!mounted||website)return;
    shots.forEach((item,index)=>{
      const key=item.productionId;
      if(item.taskId && key && !resumedJobsRef.current.has(key)) { resumedJobsRef.current.add(key); void pollQueuedJob(index,item.taskId,key); }
    });
  },[mounted,shots,website,category]);
  async function approveCurrentPlan(chatApproval?: string) {
    if (!shot.planVersionId || sending) { setNotice("UPDATE PLAN BEFORE APPROVAL"); return; }
    const controller=new AbortController();contextRequestRef.current=controller;setSending(true);
    try {
      const response=await cinemaFetch("/api/assistant-work",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"approve_plan",prompt:shot.planPrompt||shot.body,category,type,planVersionId:shot.planVersionId})});
      const data=await response.json();if(!response.ok||!data.ok||!data.approved)throw new Error(data.message||"SERVER PLAN APPROVAL FAILED");
      if(controller.signal.aborted)return;
      setShots(cur=>cur.map(item=>item.planVersionId===shot.planVersionId?{...item,approvedPlanVersionId:shot.planVersionId}:item));
      setPlanApproved(true);setNotice("PLAN APPROVED ON SERVER / FINAL PRODUCTION READY");
      if (chatApproval) {
        setDraft("");
        setChatMessages(cur=>[...cur,{role:"user",content:chatApproval},{role:"assistant",content:"Plan approved. Select Render final below to review the credit confirmation and start production. No credits have been spent."}]);
      }
    } catch(error) { if(!controller.signal.aborted)setNotice(error instanceof Error?error.message:"SERVER PLAN APPROVAL FAILED"); }
    finally { if(!controller.signal.aborted)setSending(false); }
  }
  async function renderFinalScene() {
    if (website) { if (websiteFlow.approved && await websiteFlow.perform("render")) await loadCredits(); return; }
    const currentPrompt = shot.planPrompt || shot.body;
    if (!currentPrompt.trim() || sending || !effectiveApproved) return;
    if (!window.confirm(`${estimatedCredits} credits - start production?`)) return;
    const controller=new AbortController();contextRequestRef.current=controller;
    setSending(true); setNotice("03 RENDERING / STARTING FINAL PROVIDER JOB");
    try {
      const response = await cinemaFetch("/api/assistant-work", { method: "POST", signal:controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "render", planVersionId: shot.planVersionId, render: true, skipQueue: websiteRequested, prompt: currentPrompt, type: websiteRequested ? "Website" : type, category, scene: selected + 1, categoryId: websiteRequested ? "website" : chosen?.categoryId, packId: chosen?.packId, features: chosen?.features, extras: currentExtras, planApproved, planSnapshot }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(readableMessage(data?.message || data?.error, "Final render did not start."));
      if(controller.signal.aborted)return;
      const next = applyPayload(shot, data, currentPrompt, website);
      const websiteReady = category === "website";
      setShots((cur) => cur.map((item, index) => index === selected ? { ...next, status: websiteReady ? "READY" : next.status, label: websiteReady ? "READY" : next.label, taskId: websiteReady ? undefined : next.taskId, progress: websiteReady ? 100 : next.progress, planPrompt: currentPrompt } : item));
      const hasDelivery = Boolean(next.mediaUrl || next.files.length);
      setNotice(websiteReady || data.status === "ready" ? (hasDelivery ? "SCENE READY / FILES AVAILABLE" : "SCENE READY / OUTPUT NOT ATTACHED") : "04 QUEUED / FINAL RENDER IN PROGRESS");
      // The shots effect owns the single polling loop for this production.
    } catch (error) { if(!controller.signal.aborted)setNotice(error instanceof Error ? error.message.toUpperCase() : "FINAL RENDER FAILED"); } finally { if(!controller.signal.aborted)setSending(false); }
  }
  async function onSend() {
    const prompt = draft.trim();
    if (!prompt || sending || (website && websiteFlow.busy)) return;
    if (!website && workspaceChatIntent(prompt) !== "revise" && materialFiles.length === 0) {
      if (!chosen?.packId) { setSetupOpen(true); setNotice("COMPLETE PACKAGE AND SETUP FIRST"); return; }
      if (!shot.planVersionId || !shot.planPrompt?.trim()) { setNotice("UPDATE PLAN BEFORE APPROVAL"); return; }
      if (workspaceChatIntent(prompt) === "render" && effectiveApproved) { await renderFinalScene(); return; }
      await approveCurrentPlan(prompt);
      return;
    }
    chatActivityRef.current++;
    if (materialFiles.some(file => file.size === 0 || file.size > 50 * 1024 * 1024)) { setNotice("Maximum 50 MB per file; empty files are not allowed."); return; }
    if (website) { const message = referenceUrl.trim() ? prompt + "\nReference URL supplied by user: " + referenceUrl.trim() : prompt; if (await websiteFlow.perform("revise", undefined, message)) setDraft(""); return; }
    const claims = readSessionClaims();
    if (!claims) { openAuth("login", { next: window.location.pathname + window.location.search }); return; }
    // Plan revisions are free and allowed before approval; credits are enforced only for final render.

    const controller=new AbortController();contextRequestRef.current=controller;
    const prev = shots[selected];
    setChatMessages((cur) => [...cur, { role: "user", content: prompt }]);
    setDraft("");
    setSending(true);
    setPlanApproved(false);
    setNotice("WAITING FOR ASSISTANT REPLY / NO PRODUCTION OR CREDIT SPEND");

    try {
      let sourceVideoUrl: string | undefined;
      const uploadedUrls:string[]=[];
      for (const material of materialFiles) {
        const form = new FormData(); form.set("user_id", claims.sub); form.set("file", material); form.set("purpose", "video_clipping_source");
        const uploadResponse = await cinemaFetch("/api/materials/upload", { method: "POST", signal:controller.signal, body: form });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !uploadData.material?.file_url) throw new Error(readableMessage(uploadData.error, "Source video upload failed."));
        const uploaded=String(uploadData.material.file_url);uploadedUrls.push(uploaded);
        if(category==="video_clipping" && !sourceVideoUrl)sourceVideoUrl=uploaded;
      }
      const response = await cinemaFetch("/api/assistant-work", {
        method: "POST",
        signal:controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", render: false, projectId:mediaProjectId, prompt:prompt+(uploadedUrls.length?"\nUser supplied references:\n"+uploadedUrls.join("\n"): ""), messages: chatMessages, type, category, scene: selected + 1, sourceVideoUrl, categoryId: chosen?.categoryId, packId: chosen?.packId, features: chosen?.features, extras: currentExtras, planApproved, planSnapshot }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || data.ok === false) {
        if (response.status === 402) await loadCredits();
        throw new Error(readableMessage(data?.message ?? data?.error, "Production did not start."));
      }
      if(controller.signal.aborted)return;
      if (data.website && data.productionId) {
        websiteFlow.acceptProject(data);
        setSelectionRoute(routeKey); setSelection({ categoryId: "website", type: "Website", packId: data.website.packId || "", features: [], extras: {} });
        if (window.history?.replaceState) { const params = new URLSearchParams(window.location.search); params.set("category", "website"); params.set("type", "Website"); window.history.replaceState({}, "", window.location.pathname + "?" + params.toString()); }
        setNotice("WEBSITE BRIEF UPDATED / REVIEW BEFORE PRODUCTION");
      } else {
        const reply = typeof data.reply === "string" ? data.reply.trim() : typeof data.body === "string" ? data.body.trim() : "";
        if (!reply || reply === prompt) throw new Error("The assistant did not return a valid answer. No production was submitted.");
        const conversation = [...chatMessages, { role: "user" as const, content: prompt }, { role: "assistant" as const, content: reply }];
        setChatMessages(conversation);
        setShots((cur) => cur.map((item, index) => index === selected ? { ...item, body:data.plan.visualDirection, planPrompt:data.plan.visualDirection, spokenScript:data.plan.spokenScript, planVersionId:data.planVersionId, approvedPlanVersionId:undefined, estimatedCredits:data.estimatedCredits, status:"DRAFT",label:"DRAFT" } : item));
        setNotice("ASSISTANT REPLIED / REVIEW PLAN BEFORE PRODUCTION");
        void persistProject({ mediaProjectId, mergeOrder, mergeProductionId, mergedUrl, mergeAspect, mergeFit, mergeTransition, category: engineCategory, type, shots: shots.map((item, index) => index === selected ? { ...item, body:data.plan.visualDirection, planPrompt:data.plan.visualDirection, planVersionId:data.planVersionId, approvedPlanVersionId:undefined, estimatedCredits:data.estimatedCredits } : item), selected, chatMessages: conversation, referenceUrl, planApproved: false, notice: "ASSISTANT REPLIED / REVIEW PLAN BEFORE PRODUCTION" });
      }
      setSending(false);
    } catch (error) {
      if(controller.signal.aborted)return;
      setShots((cur) => cur.map((item, index) => index === selected ? prev : item));
      const detail = error instanceof Error ? error.message : "The assistant request failed. No production was submitted.";
      setNotice(detail); setChatMessages((current) => [...current, { role: "assistant", content: "Request failed: " + detail }]);
      setSending(false);
    }
  }
  if (!mounted) return null;

  const shell = (
    <div id={THREAD} data-aw={AW} translate="yes" lang={language} dir="ltr" style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", overflow: "hidden", zIndex: 9999, display: "flex", flexDirection: "column", background: "#0b0c0e", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`#${THREAD}, #${THREAD} * { box-sizing: border-box; } #${THREAD} a { color: inherit; text-decoration: none; } #${THREAD} button, #${THREAD} input, #${THREAD} textarea { font-family: inherit; }`}</style>

      <style>{`
        #${THREAD} .aw-video-main { padding: 18px !important; }
        #${THREAD} .aw-video-main > div { gap: 12px !important; }
        #${THREAD} .aw-video-main header { order: -5; padding-bottom: 10px !important; gap: 10px !important; flex-wrap: wrap; }
        #${THREAD} .aw-video-main h1 { font-size: 19px !important; }
        #${THREAD} .aw-merge-panel { order: -4; background: #14171d; border-color: #2e333d !important; padding: 14px !important; }
        #${THREAD} .aw-preview { order: -3; min-height: 220px !important; height: clamp(220px,32vh,380px); }
        #${THREAD} .aw-video-main [aria-label="Page navigation"] { order: -2; display: flex !important; overflow-x: auto !important; }
        #${THREAD} .aw-video-main [aria-label="Page navigation"] button { flex: 0 0 170px; }
        #${THREAD} .aw-scene-summary { padding: 12px !important; }
        #${THREAD} .aw-video-main h2 { font-size: 16px !important; }
        #${THREAD} .aw-video-main button, #${THREAD} .aw-merge-panel input, #${THREAD} .aw-merge-panel select { font: 12px/1.4 Inter,system-ui,sans-serif !important; min-height: 32px !important; height: auto !important; max-width: 100%; width: auto; padding: 6px 10px !important; border: 1px solid #343b49; border-radius: 8px; background: #202530; color: #eef1f7; box-shadow: none; letter-spacing: normal; }
        #${THREAD} .aw-video-main button:disabled { opacity: .4; cursor: not-allowed; }
        #${THREAD} .aw-video-main button:not(:disabled):hover { border-color: #8794ac; background: #2a3140; }
        #${THREAD} .aw-merge-panel fieldset { grid-template-columns: repeat(3,minmax(0,1fr)); border: 0; padding: 0; margin: 12px 0 0 !important; gap: 10px !important; }
        #${THREAD} .aw-merge-panel legend { display: none; }
        #${THREAD} .aw-merge-panel fieldset label { display: grid; gap: 5px; font-size: 11px; color: #a8b1c0; min-width: 0; }
        #${THREAD} .aw-merge-panel select { width: 100%; }
        #${THREAD} .aw-merge-panel fieldset small { grid-column: 1 / -1; font-size: 11px; color: #8d98ab; }
        #${THREAD} .aw-merge-panel ol { max-height: 148px; overflow-y: auto; margin: 6px 0 12px; padding-left: 24px; }
        #${THREAD} .aw-merge-panel li { padding: 6px 0; font-size: 12px; overflow-wrap: anywhere; border-bottom: 1px solid #262d38; }
        #${THREAD} .aw-merge-panel li button { margin: 3px; }
        #${THREAD} .aw-merge-panel input::file-selector-button { padding: 6px 10px; border: 0; border-radius: 6px; background: #343f53; color: white; font: inherit; cursor: pointer; }
        #${THREAD} .aw-merge-panel video { max-height: 50vh; margin: 12px 0; }
        #${THREAD} video:fullscreen { width: 100vw !important; height: 100vh !important; max-height: none !important; object-fit: contain; background: black; }
        #${THREAD} .aw-assistant button { flex-shrink:0; white-space:nowrap; word-break:normal; overflow-wrap:normal; }
        #${THREAD} .aw-assistant button[type="submit"] { white-space:normal; }
        #${THREAD} .aw-setup-panel { min-width:0; overflow-x:hidden; color:#eef1f7; }
        #${THREAD} .aw-setup-panel > div:first-child { position:sticky; top:0; background:#111318; z-index:1; padding:8px 0; }
        #${THREAD} .aw-production-options { font:12px/1.5 Inter,system-ui,sans-serif; overflow-wrap:anywhere; }
        #${THREAD} .aw-production-options details { border:1px solid #343b49; border-radius:8px; margin:10px 0; background:#171a20; }
        #${THREAD} .aw-production-options summary { cursor:pointer; padding:11px; font-weight:600; }
        #${THREAD} .aw-options-list { display:grid; gap:8px; padding:0 10px 10px; }
        #${THREAD} .aw-production-options button { width:100%; text-align:left; display:grid; gap:3px; padding:9px 10px; background:#202530; color:#eef1f7; border:1px solid #343b49; border-radius:7px; white-space:normal; }
        #${THREAD} .aw-production-options button[aria-pressed="true"] { border-color:#f5c77a; background:#333022; }
        #${THREAD} .aw-options-list label { display:flex; align-items:center; gap:8px; min-width:0; }
        #${THREAD} .aw-options-list .aw-feature-choice { display:flex; align-items:flex-start; gap:8px; padding:8px 10px; border:1px solid #343b49; border-radius:6px; background:#202530; line-height:1.5; cursor:pointer; }
        #${THREAD} .aw-feature-choice input[type="checkbox"] { appearance:auto; flex:0 0 16px; width:16px; height:16px; min-width:16px; margin:1px 0 0; padding:0; accent-color:#f5c77a; }
        #${THREAD} .aw-feature-choice span { flex:1; min-width:0; }
        #${THREAD} .aw-options-list .aw-option-field { display:grid; gap:5px; }
        #${THREAD} .aw-option-field input, #${THREAD} .aw-option-field select { width:100%; min-width:0; padding:9px; border-radius:6px; border:1px solid #343b49; background:#202530; color:#eef1f7; }
        #${THREAD} .aw-options-kicker { color:#f5c77a; font-weight:600; }
        #${THREAD} .aw-toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; flex:0 0 auto; min-height:56px; padding:8px 12px; border-bottom:1px solid #2e333d; background:#111318; z-index:15; }
        #${THREAD} .aw-toolbar button, #${THREAD} .aw-toolbar a, #${THREAD} .aw-category-nav button { appearance:none; background:#202530; color:#eef1f7; border:1px solid #343b49; border-radius:8px; padding:9px 12px; font:12px/1.4 Inter,system-ui,sans-serif; white-space:normal; overflow-wrap:anywhere; cursor:pointer; min-height:36px; box-shadow:none; }
        #${THREAD} .aw-toolbar a { color:#f5c77a; }
        #${THREAD} .aw-toolbar button:focus-visible, #${THREAD} .aw-category-nav button:focus-visible, #${THREAD} .aw-toolbar a:focus-visible { outline:2px solid #f5c77a; outline-offset:2px; }
        #${THREAD} .aw-category-nav button { display:block; width:100%; text-align:left; margin:6px 0; }
        #${THREAD} .aw-category-nav button:hover { background:#2a3140; border-color:#8794ac; }
        #${THREAD} .aw-category-nav button[aria-pressed="true"], #${THREAD} .aw-category-nav button[aria-current="page"] { background:#333022; border-color:#f5c77a; color:#f5c77a; }
        #${THREAD} .aw-category-nav summary { cursor:pointer; padding:10px 0; overflow-wrap:anywhere; }
        #${THREAD} .aw-panels { display:flex; position:relative; flex:1 1 auto; min-height:0; min-width:0; overflow:hidden; }
        #${THREAD} .aw-category-nav, #${THREAD} .aw-assistant, #${THREAD} .aw-video-main { min-height:0; overflow-x:hidden; overscroll-behavior:contain; }
        #${THREAD} .aw-video-main, #${THREAD} .aw-assistant { overflow-wrap:anywhere; }
        #${THREAD} .aw-assistant > div, #${THREAD} .aw-assistant form { min-width:0; }
        #${THREAD} .aw-assistant textarea { max-height:160px; }
        #${THREAD} .aw-scene-summary > div > div { min-width:0; }
        @media(max-width: 1100px) { #${THREAD} .aw-assistant { position:absolute; right:0; top:0; bottom:0; z-index:12; flex:none !important; width:min(340px,100%) !important; box-shadow:-12px 0 40px #0009; } }
        @media(max-width: 760px) { #${THREAD} .aw-category-nav { position:absolute; left:0; top:0; bottom:0; z-index:13; width:min(280px,100%) !important; box-shadow:12px 0 40px #0009; } #${THREAD} .aw-merge-panel fieldset { grid-template-columns:1fr; } #${THREAD} .aw-video-main { padding:12px !important; } #${THREAD} .aw-toolbar { padding:8px; gap:6px; } #${THREAD} .aw-toolbar button, #${THREAD} .aw-toolbar a { padding:8px; } }
      `}</style>
      <header className="aw-toolbar" aria-label="Workspace navigation">
        <button type="button" aria-controls="aw-tools-panel" aria-expanded={menuOpen} onClick={()=>{setMenuOpen(!menuOpen);if(!menuOpen && window.innerWidth<=760)setAssistantOpen(false);}}>{menuOpen?"Close menu":"Open menu"}</button>
        <a href="/" aria-label="Home - main website">Home</a>
        <button type="button" aria-controls="aw-assistant-panel" aria-expanded={assistantOpen} onClick={()=>{setAssistantOpen(!assistantOpen);if(!assistantOpen && window.innerWidth<=760)setMenuOpen(false);}}>{assistantOpen?"Close assistant":"Open assistant"}</button>
      </header>
      <div className="aw-panels">
      <nav id="aw-tools-panel" className="aw-category-nav" hidden={!menuOpen} aria-label="Category navigation" style={{display:menuOpen?"block":"none",flex:"0 0 250px",width:250,minWidth:0,height:"100%",overflowY:"auto",background:"#111318",padding:16,borderRight:"1px solid #2e333d"}}>
        {menuOpen ? <>
          <h2 style={{fontSize:16,margin:"0 0 12px"}}>Crelavo Studio</h2>
          <strong style={{display:"block",margin:"14px 0 8px"}}>{categoryConfig?.label || "Choose category"}</strong>
          <button type="button" aria-expanded={categoryPickerOpen} onClick={()=>setCategoryPickerOpen(!categoryPickerOpen)}>{categoryPickerOpen?"Close category picker":"Change category"}</button>
          {categoryPickerOpen ? <section aria-label="Category picker">
            <input aria-label="Search categories" value={categorySearch} onChange={event=>setCategorySearch(event.target.value)} placeholder="Search categories..." style={{width:"100%",margin:"12px 0",padding:10,background:"#1c1f26",color:"white",border:"1px solid #343b49",borderRadius:8}} />
            {(GROUPS || []).map(group=>{const items=(CATEGORIES || []).filter(item=>item.group===group.id && (!categorySearch.trim() || (item.label+" "+item.features.map(f=>f.label).join(" ")).toLowerCase().includes(categorySearch.toLowerCase().trim())));return items.length?<details key={group.id} open={Boolean(categorySearch.trim())||group.id===categoryConfig?.group}><summary>{group.label}</summary>{items.map(item=><button type="button" key={item.id} aria-current={item.id===category?"page":undefined} onClick={()=>pickCategory(item.id)}>{item.label}</button>)}</details>:null;})}
            {categorySearch.trim() && !(CATEGORIES || []).some(item=>(item.label+" "+item.features.map(f=>f.label).join(" ")).toLowerCase().includes(categorySearch.toLowerCase().trim()))?<p>No matching categories.</p>:null}
          </section>:null}
          <section aria-label="Selected category features" style={{marginTop:16}}><h3 style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase"}}>Category scope</h3>{categoryConfig?.features.map(feature=><button type="button" key={feature.id} onClick={()=>{setActiveTool("production");setDraft("Help me plan "+feature.label+" for my "+categoryConfig.label+" project.");setAssistantOpen(true);}}>{feature.label}</button>)}</section>
          <section aria-label="Workspace tools" style={{marginTop:16}}><h3 style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase"}}>Workspace tools</h3>{[["production","Production settings"],...(videoWorkspace?[["upload","Upload clips"],["merge","Merge clips"]]:[]),...(!website&&categoryConfig?.group!=="build"?[["references","Sources / references"]]:[]),...(category==="music_video"?[["music","Music video / sound"]]:[])].map(([id,label])=><button type="button" key={id} aria-pressed={activeTool===id} onClick={()=>setActiveTool(id)}>{label}</button>)}</section>
          <a href="/dashboard/productions" style={{display:"block",marginTop:18}}>My productions</a>
        </>:null}
      </nav>
      <main className="aw-video-main" style={{ flex: "1 1 auto", minWidth: 0, height: "100%", overflowY: "auto", background: "#0f1115", borderRight: "1px solid #1f2229", padding: 24 }}>
        <div style={{ maxWidth: 1100, width: "100%", minHeight: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          <header style={{ flex: "0 0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, borderBottom: "1px solid #1f2229", paddingBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ fontSize: 11, color: "#f5c77a", letterSpacing: "0.16em", textTransform: "uppercase" }}>Crelavo AI Studio</div></div>
              <h1 style={{ fontSize: 24, lineHeight: 1.15, margin: "6px 0 0", letterSpacing: "-0.03em" }}>{website ? t("Website production workspace") : t("AI production workspace")}</h1>
              <p style={{ margin: "6px 0 0", color: "#9ca3af", fontSize: 13 }}>{type} / {category}</p>
            </div>
            <div style={{ flex: "0 0 auto", background: "#1a1d24", border: "1px solid #2e333d", padding: "10px 14px", borderRadius: 8, textAlign: "right" }}>
              <span style={{ display: "block", fontSize: 11, color: "#9ca3af" }}>{t("Available credits")}</span>
              <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: 15 }}>{t(creditLabel)}</strong>
            </div>
          </header>

          <section className="aw-scene-summary" style={{ flex: "0 0 auto", background: "#111318", border: "1px solid #1f2229", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: "1 1 420px" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>{kicker}</div>
                <h2 style={{ fontSize: 22, margin: "8px 0 0", lineHeight: 1.2 }}>{shot.title}</h2>
                <p style={{ margin: "8px 0 0", color: "#d1d5db", lineHeight: 1.5 }}>{sceneSummary(shot.body)}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSetupOpen(true)} style={{ border: "1px solid #2e333d", borderRadius: 8, padding: "9px 12px", background: "#1c1f26", color: "#fff", cursor: "pointer", fontSize: 12 }}>{t("Setup")}</button>
                <button type="button" onClick={renderFinalScene} disabled={!canRender} style={{ border: "1px solid #2e333d", borderRadius: 8, padding: "9px 12px", background: "#f8fbff", color: "#111", cursor: displayBusy ? "default" : "pointer", fontSize: 12, opacity: canRender ? 1 : 0.5 }}>{t("Render final")}</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 10, marginTop: 18 }}>
              <div style={{ background: "#1c1f26", border: "1px solid #2e333d", borderRadius: 8, padding: 13 }}><small style={{ display: "block", color: "#9ca3af", marginBottom: 6 }}>{t("Category")}</small><strong>{type}</strong></div>
              <div style={{ background: "#1c1f26", border: "1px solid #2e333d", borderRadius: 8, padding: 13 }}><small style={{ display: "block", color: "#9ca3af", marginBottom: 6 }}>{t("Scene / page")}</small><strong>{activeIndex + 1} / {displayShots.length}</strong></div>
              <div style={{ background: "#1c1f26", border: "1px solid #2e333d", borderRadius: 8, padding: 13 }}><small style={{ display: "block", color: "#9ca3af", marginBottom: 6 }}>{t("Status")}</small><strong>{displayBusy ? t("Processing") : t(workspaceNotice)}</strong>{shot.progress != null ? <div style={{ marginTop: 8 }}><div style={{ height: 5, borderRadius: 999, background: "#2e333d", overflow: "hidden" }}><div style={{ width: `${shot.progress}%`, height: "100%", background: "#34d399" }} /></div><small style={{ display: "block", marginTop: 4, color: "#9ca3af" }}>{shot.progress}{t("% completed")}</small></div> : null}</div>
            </div>
          </section>

          <section className="aw-preview" style={{ flex: "0 0 auto", minHeight: 320, position: "relative", overflow: "hidden", border: "1px solid #2e333d", borderRadius: 12, background: website ? "#171a20" : "#090b10" }}>
            {website && websiteFlow.project && (websiteFlow.project.status === "ready" || (websiteFlow.runtimePlan && !websiteFlow.runtimePlan.stale)) ? <WebsiteWorkspacePreview projectId={websiteFlow.project.productionId} page={websitePages[activeIndex] || websitePages[0]} pages={websitePages} revision={previewRevision} runtimeViews={!!websiteFlow.project.website.runtimeDevelopment} draft={websiteFlow.runtimePlan && websiteFlow.project.status !== "ready" ? { hash: websiteFlow.runtimePlan.hash, userId: websiteFlow.userId } : undefined} request={cinemaFetch} onPage={(path) => { const index = websitePages.findIndex((page) => page.path === path); if (index >= 0) setSelected(index); }} /> : <>
            {previewUrl ? (previewKind === "audio" ? <audio src={previewUrl} controls style={{width:"100%"}} /> : previewKind === "video" || (!previewKind && /\.(mp4|webm|mov)(\?|$)/i.test(previewUrl)) ? <video key={previewUrl} ref={mergedVideoRef} src={previewUrl} controls playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain",background:"black"}} /> : <img src={previewUrl} alt={shot.title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain"}} />) : <div style={{padding:22}}><p>{t("Output / preview area")}</p><strong>{shot.title}</strong><p>{t("Generated media output will appear here.")}</p></div>}

            </>}
          </section>

          {videoWorkspace ? <div className="aw-preview-controls"><button type="button" onClick={()=>setPreviewMode("scene")}>Selected scene</button><button type="button" disabled={!mergedUrl} onClick={()=>setPreviewMode("merged")}>Merged result</button>{previewUrl && previewKind==="video"?<button type="button" onClick={()=>void mergedVideoRef.current?.requestFullscreen?.().catch(()=>setNotice("Fullscreen is not supported."))}>Fullscreen</button>:null}</div>:null}
          <section aria-label={t("Page navigation")} style={{ flex: "0 0 auto", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", border: "1px solid #2e333d", borderRadius: 8, overflow: "hidden" }}>
           {displayShots.map((item, index) => <button key={item.id} type="button" onClick={() => { setSelected(index); setPreviewMode("scene"); }} style={{ minWidth: 0, border: "none", borderRight: index < displayShots.length - 1 ? "1px solid #2e333d" : "none", padding: "12px 8px", background: index === activeIndex ? "#1c1f26" : "#111318", color: "#fff", cursor: "pointer", textAlign: "left" }}><small style={{ display: "block", color: index === activeIndex ? "#f5c77a" : "#9ca3af", marginBottom: 4 }}>{String(item.id).padStart(2, "0")} / {item.label}</small><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{item.title}</strong></button>)}
          </section>

          {website && websiteFlow.project && !websiteFlow.reviewed ? <div role="status" style={{ fontSize: 12 }}>{t(workspaceNotice)}{websiteFlow.project.website.missing.length ? <p>{t("Missing")}: {websiteFlow.project.website.missing.map((field) => t(field)).join(", ")}</p> : null}<button type="button" onClick={() => setSetupOpen(true)}>{t("Review brief in Setup")}</button></div> : null}
          {website && websiteFlow.project?.status === "ready" ? <details><summary>{t("Revisions, history and ZIP delivery")}</summary><WebsiteBuilderForm key={websiteFlow.project.productionId} initialProjectId={websiteFlow.project.productionId} editorOnly onContentChange={() => setPreviewRevision((current) => current + 1)} /></details> : null}

          {["references", "music", "production"].includes(activeTool) ? <section className="aw-tool-panel">
            <h3>{activeTool === "references" ? "Character and references" : activeTool === "music" ? "Music video and sound" : "Production settings"}</h3>
            {activeTool === "production" ? <><p>{categoryConfig?.intake.greeting}</p><p>{estimatedCredits ? `${estimatedCredits} credits - server estimate` : "Select a package and create a plan first."}</p><button type="button" onClick={() => setSetupOpen(true)}>{t("Setup")}</button><p>Uploading never starts paid production. A current plan and explicit approval are required before credits can be spent.</p></> : <>
              <p>{activeTool === "music" ? "Music video is a video category, not independent music or song generation. This workspace does not generate music or mix a separate audio file into the video." : "Describe the character in the assistant. Consistent identity across multiple scenes is not guaranteed by this workspace."}</p>
              <p>{category === "lip_sync" ? "Lip sync requires a video and an audio source." : category === "localization" ? "Localization requires a source video." : category === "video_clipping" ? "Clipping requires a source video." : ["image", "visual_clone", "brand_kit", "avatar", "talking_video"].includes(category) ? "This category can pass one visual source to its production adapter when supported." : "In this category files are planning inputs only; direct reference transfer is not supported."}</p>
              <input aria-label="Reference files" type="file" multiple accept="image/*,audio/*,video/*" onChange={event => { setMaterialFiles(Array.from(event.currentTarget.files || [])); setPlanApproved(false); }} />
              <p>{materialFiles.length ? materialFiles.map(file => file.name).join(" / ") : "Maximum 50 MB per file. Use files you own or are authorized to use."}</p>
              <button type="button" onClick={() => { setAssistantOpen(true); setDraft(current => current || "Update the plan using my selected references and clearly state unsupported steps."); }}>Update plan with references</button>
              <p>Selecting a file never starts production. References are sent only when the plan is updated. Voice cloning from a reference is not supported by this workspace engine.</p>
            </>}
          </section> : null}
          {videoWorkspace && ["upload", "merge"].includes(activeTool) ? <section className="aw-merge-panel" aria-label={t("Scene merge order")} style={{padding:12,border:"1px solid #333",borderRadius:10}}>
            <strong>{activeTool === "upload" ? "Upload MP4 clips" : "Merge clips"}</strong>
            <fieldset hidden={activeTool !== "merge"} disabled={mergeBusy||uploadBusy} style={{display:"grid",gap:12,marginTop:12}}>
              <legend>Merge settings</legend>
              <label>Aspect ratio <select value={mergeAspect} onChange={e=>setMergeAspect(e.target.value)}><option value="">Select format</option><option value="16:9">Landscape - 1920 x 1080</option><option value="9:16">Portrait - 1080 x 1920</option></select></label>
              <label>Fit <select value={mergeFit} onChange={e=>setMergeFit(e.target.value)}><option value="cover">Fill (may crop edges)</option><option value="contain">Fit (may leave empty space)</option></select></label>
              <label>Transition <select value={mergeTransition} onChange={e=>setMergeTransition(e.target.value)}><option value="fade">Fade</option><option value="cut">Cut</option></select></label>
              <small>Fill may crop edges. Fit preserves the full image.</small>
            </fieldset>
            <div hidden={activeTool !== "upload"} style={{padding:"12px 0"}}>
              <input aria-label={"Upload video"} type="file" accept="video/mp4,.mp4" multiple disabled={!projectLoaded||uploadBusy||mergeBusy||!mediaProjectId} onChange={event=>{const files=Array.from(event.currentTarget.files||[]);event.currentTarget.value="";void uploadVideos(files);}} />
              <p style={{fontSize:12,color:"#9ca3af"}}>MP4 - 50 MB per file - 2 to 12 videos - no production credits charged</p>
              {uploadNotice?<p role="status">{uploadNotice}</p>:null}
            </div>
            <div hidden={activeTool !== "merge"} style={{display:"flex",gap:8,overflowX:"auto",padding:"10px 0"}}>{shots.filter(s=>s.status==="READY"&&s.mediaKind==="video"&&s.productionId).map(s=><button type="button" key={s.productionId} disabled={uploadBusy||mergeBusy||mergeOrder.length>=12} onClick={()=>setMergeOrder(cur=>[...cur,s.productionId!])}>{t("Add scene")} {s.id}</button>)}</div>
            <ol hidden={activeTool !== "merge"}>{mergeOrder.map((id,i)=><li key={i}>{shots.find(s=>s.productionId===id)?.title||id} <button type="button" disabled={uploadBusy||mergeBusy||i===0} onClick={()=>setMergeOrder(cur=>{const next=[...cur];[next[i-1],next[i]]=[next[i],next[i-1]];return next;})}>{t("Move left")}</button> <button type="button" disabled={uploadBusy||mergeBusy||i===mergeOrder.length-1} onClick={()=>setMergeOrder(cur=>{const next=[...cur];[next[i],next[i+1]]=[next[i+1],next[i]];return next;})}>{t("Move right")}</button> <button type="button" disabled={uploadBusy||mergeBusy} onClick={()=>setMergeOrder(cur=>cur.filter((_,j)=>i!==j))}>{t("Remove")}</button></li>)}</ol>
            <button hidden={activeTool !== "merge"} type="button" disabled={!projectLoaded||uploadBusy||mergeBusy||!mergeAspect||!mediaProjectId||mergeOrder.length<2||mergeOrder.length>12} onClick={()=>void mergeScenes()}>{t(mergeBusy?"Merging scenes":"Merge scenes")}</button>
             {mergedUrl ? <button type="button" onClick={()=>setPreviewMode("merged")}>Show merged result</button>:null}
          </section>:null}
          {(shot.status === "READY" && (shot.mediaUrl || shot.files.length > 0)) ? <section style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: 14, background: "#111318", border: "1px solid #1f2229", borderRadius: 10 }}><strong style={{ width: "100%", fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em" }}>{t("DELIVERY READY")}</strong>{shot.mediaUrl ? <button type="button" onClick={() => void downloadMedia(shot.mediaUrl!,shot.mediaKind).catch(()=>setNotice("MEDIA DOWNLOAD BLOCKED / OPEN THE PREVIEW SOURCE TO SAVE THE FILE"))} style={{ border: "1px solid #2e333d", borderRadius: 8, background: "#1c1f26", color: "#fff", padding: "8px 10px", fontSize: 11 }}>{t("DOWNLOAD MEDIA")}</button> : null}{shot.files.length > 0 ? <button type="button" onClick={() => void downloadDeliveryZip(shot.files)} style={{ border: "1px solid #2e333d", borderRadius: 8, background: "#1c1f26", color: "#fff", padding: "8px 10px", fontSize: 11 }}>{t("DOWNLOAD ZIP")}</button> : null}{shot.files.map((file) => <button key={file.name} type="button" onClick={() => downloadDeliveryFile(file)} style={{ border: "1px solid #2e333d", borderRadius: 8, background: "#1c1f26", color: "#fff", padding: "8px 10px", fontSize: 11 }}>{file.name}</button>)}</section> : null}
          <div style={{ flex: "0 0 auto", color: "#6b7280", fontSize: 10, lineHeight: 1.4 }}>{t("UPDATE PLAN saves your current production brief. Only RENDER FINAL starts credit-priced production; copy/layout/color-only revisions do not spend credits.")}</div>
        </div>
      </main>

      <aside id="aw-assistant-panel" className="aw-assistant" style={{ flex: "0 0 340px", width: 340, height: "100%", minWidth: 0, display: assistantOpen ? "flex" : "none", flexDirection: "column", background: "#111318", borderLeft: "1px solid #1f2229" }} aria-label={t("Crelavo AI Production Manager")}>
        <div style={{ flex: "0 0 auto", padding: 16, borderBottom: "1px solid #1f2229", background: "#14171d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><strong style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("Crelavo AI Production Manager")}</strong><button type="button" onClick={() => setSetupOpen(true)} style={{ border: "1px solid #2e333d", borderRadius: 7, padding: "6px 8px", background: "transparent", color: "#f5c77a", fontSize: 10, cursor: "pointer" }}>{t("SETUP")}</button></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: "#34d399", fontSize: 11 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />{t("Orchestrator & category engine active")}</div>
        </div>
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: 16 }}>
          <div style={{ background: "#1a1d24", border: "1px solid #2e333d", padding: 12, borderRadius: 8, marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#d1d5db", lineHeight: 1.5 }}>{categoryConfig?.intake.greeting || t("Assistant is ready. Describe what you want to create.")}</p>{!website && categoryConfig?.intake.defaults && Object.keys(categoryConfig.intake.defaults).length > 0 ? <small style={{ display: "block", marginTop: 8, color: "#9ca3af" }}>{t("Smart starting point:")}{Object.entries(categoryConfig.intake.defaults).map(([key, value]) => `${key.replace(/_/g, " ")}: ${value.replace(/_/g, " ")}`).join(" / ")}{t("(editable)")}</small> : null}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{(categoryConfig?.intake.quickChoices || []).map((choice) => <button key={choice} type="button" onClick={() => setDraft(choice)} style={{ border: "1px solid #2e333d", borderRadius: 999, padding: "7px 10px", background: "#1c1f26", color: "#d1d5db", cursor: "pointer", fontSize: 11 }}>{t(choice)}</button>)}</div>
          <div style={{ border: "1px solid #2e333d", borderRadius: 8, padding: 12, background: "#171a20", marginBottom: 14 }}><p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#f5c77a", textTransform: "uppercase" }}>{t("Plan and approval")}</p><div style={{ display: "grid", gap: 6, fontSize: 12, color: "#d1d5db" }}><div>{t("Category:")}<strong>{categoryConfig?.label || type}</strong></div><div>{t("Package:")}<strong>{selectedPack ? t(selectedPack.label) : t("Not selected yet")}</strong></div><div>{t("Estimated credits:")}<strong>{estimatedCredits ? `${estimatedCredits} credits` : t("No package selected")}</strong></div><div>{t("Delivery:")}<strong>{website ? t("Static website + preview + source ZIP") : chosen?.extras?.stack ? String(chosen.extras.stack).replace(/_/g, " ") : t("Setup incomplete")}</strong></div></div>{effectiveApproved ? <div style={{ marginTop: 10, color: "#34d399", fontSize: 11 }}>{website && websitePhase === "ready" ? t("Website ready") : t("Plan approved. Final production is ready to start.")}</div> : <button type="button" disabled={sending || (!website && !shot.planVersionId) || website && (!websiteFlow.reviewed || websiteFlow.busy || websiteFlow.project?.status === "generating" || websiteFlow.project?.status === "awaiting_payment")} onClick={() => { if (website) { if (!websiteFlow.reviewed) { void websiteFlow.perform("revise"); return; } void websiteFlow.perform("website_approve"); return; } if (!chosen?.packId) { setSetupOpen(true); setNotice("COMPLETE PACKAGE AND SETUP FIRST"); return; } void approveCurrentPlan(); }} style={{ marginTop: 10, width: "100%", border: "1px solid #f5c77a", borderRadius: 8, padding: "9px 10px", background: "#f5c77a", color: "#111", cursor: "pointer", fontSize: 11 }}>{t("Approve plan and continue to production")}</button>}{!website && effectiveApproved ? <button type="button" disabled={!canRender} onClick={()=>void renderFinalScene()} style={{marginTop:10,width:"100%",padding:"10px",background:"#f5c77a",color:"#111",borderRadius:8}}>{t("Render final")} / {estimatedCredits} {t("credits")}</button> : null}</div>
          <div style={{ border: "1px solid #1f2229", borderRadius: 8, padding: 12, background: "#0d0f12", marginBottom: 14 }}><p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{t("Active production plan")}</p><div style={{ display: "grid", gap: 8, fontSize: 12 }}>{(website ? [t("Website Brief"), t("Plan and approval"), t("Generating website"), t("Revisions, history and ZIP delivery")] : enginePlan).map((step) => <div key={step} style={{ color: step.startsWith("[next]") ? "#34d399" : step.startsWith("[next]") ? "#60a5fa" : "#6b7280", fontWeight: step.startsWith("[next]") ? 600 : 400 }}>{step}</div>)}</div></div>
          {displayShots.map((item, index) => <div key={`chat-shot-${item.id}`} style={{ borderBottom: "1px solid #1f2229", padding: "10px 0", color: index === activeIndex ? "#fff" : "#9ca3af", fontSize: 12 }}><strong>{index === activeIndex ? t("Active") : t("Ready")} A {item.label}</strong><div style={{ marginTop: 4, lineHeight: 1.4 }}>{item.title}</div></div>)}
          <div aria-label={t("Assistant conversation")} aria-live="polite" style={{ display: "grid", gap: 8, marginTop: 12 }}>{(website ? websiteFlow.messages : chatMessages).map((message, index) => <div key={index} style={{ padding: 10, borderRadius: 7, background: message.role === "assistant" ? "#1a2421" : "#222733", fontSize: 12, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}><strong>{message.role === "assistant" ? t("Assistant") : t("You")}:</strong> <span translate="no" data-no-translate="true" className="notranslate" dir="auto">{message.content}</span></div>)}{(website ? websiteFlow.busy : sending) ? <div role="status">{t("Waiting for assistant response...")}</div> : null}<div ref={chatEndRef} /></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void onSend(); }} style={{ flex: "0 0 auto", padding: 16, borderTop: "1px solid #1f2229", background: "#14171d" }}>
          <textarea translate="no" data-no-translate="true" className="notranslate" dir="auto" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Tell the assistant what you want to create...")} disabled={sending || (website && websiteFlow.busy)} style={{ display: "block", width: "100%", minHeight: 74, background: "#1c1f26", border: "1px solid #2e333d", borderRadius: 8, padding: 12, color: "#fff", outline: "none", resize: "vertical", fontSize: 13 }} />
          {website ? <input value={referenceUrl} onChange={(event) => { setReferenceUrl(event.target.value); websiteFlow.setDirty(true); }} placeholder={t("Optional product or reference URL (no file upload in MVP)")} disabled={websiteFlow.busy} style={{ display: "block", width: "100%", marginTop: 8, background: "#1c1f26", border: "1px solid #2e333d", borderRadius: 8, padding: "10px 12px", color: "#fff", outline: "none", fontSize: 12 }} /> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{!website ? <label title={t("Attach file")} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #2e333d", borderRadius: 8, padding: "9px 10px", background: "#1c1f26", color: "#fff", cursor: "pointer", fontSize: 11 }}><span>{t("FILE")}</span><input type="file" multiple accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(event) => { setMaterialFiles(Array.from(event.currentTarget.files || [])); setPlanApproved(false); }} style={{ display: "none" }} /></label> : null}<button type="submit" disabled={sending || (website && (websiteFlow.busy || websiteFlow.project?.status === "generating" || websiteFlow.project?.status === "awaiting_payment")) || !draft.trim()} style={{ flex: 1, border: "none", borderRadius: 8, padding: "10px 12px", background: "#ff4757", color: "#fff", cursor: sending || !draft.trim() ? "default" : "pointer", opacity: sending || !draft.trim() ? 0.5 : 1, fontSize: 12 }}>{sending || (website && websiteFlow.busy) ? t("Sending...") : t("UPDATE PLAN")}</button></div>
        </form>
      </aside>

      </div>
      {setupOpen ? <aside className="aw-setup-panel" aria-label={t("Production setup")} translate="yes" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(340px, 100vw)", zIndex: 20, overflow: "auto", padding: "18px 14px 42px", background: "rgba(7,6,5,0.98)", borderLeft: "1px solid rgba(245,199,122,0.35)", boxShadow: "-18px 0 48px rgba(0,0,0,0.4)" }}><div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><button type="button" onClick={() => setSetupOpen(false)} style={{ border: "1px solid rgba(244,238,230,0.35)", borderRadius: 999, padding: "6px 10px", background: "transparent", color: "inherit", fontSize: 10 }}>{t("CLOSE")}</button></div>{website ? <WebsitePlanControls controller={websiteFlow} /> : <AssistantPreProduction key={category} compact initialSelection={chosen} initialCategoryId={category} onConfirm={(next) => { setSelectionRoute(routeKey); setSelection(next); setPlanApproved(false); setShots(cur=>cur.map(item=>({...item,planVersionId:undefined,approvedPlanVersionId:undefined}))); setSetupOpen(false); }} />}</aside> : null}
    </div>
  );  return createPortal(shell, document.body);
}
