"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Download, ExternalLink, Film, Globe2, ImageIcon, LibraryBig, Mic2, Music2, Pencil, PlayCircle, RefreshCcw, Share2, Subtitles, UploadCloud } from "lucide-react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { ConnectedAccountsPanel } from "@/components/ConnectedAccountsPanel";
import { productionProgressPercent, productionProgressSteps } from "@/lib/production-progress";

type ProductionWorkspaceProps = {
  production: {
    id: string;
    user_id?: string | null;
    title?: string | null;
    prompt?: string | null;
    production_type?: string | null;
    package_id?: string | null;
    status?: string | null;
    generation_status?: string | null;
    automation_status?: string | null;
    estimated_credits?: number | null;
    preview_url?: string | null;
    delivery_zip_url?: string | null;
    source_files_url?: string | null;
    readme_url?: string | null;
    delivery_link?: string | null;
    output_json?: Record<string, any> | null;
    input_json?: Record<string, any> | null;
    request_metadata?: Record<string, any> | null;
    materials_json?: Array<Record<string, any>> | null;
    approval_question?: string | null;
    approval_options?: Array<{ label: string; description?: string; extraCredits?: number }> | null;
    approval_status?: string | null;
    error_message?: string | null;
    reserved_credits?: number | null;
  };
};

type AssetPart = {
  title: string;
  type: "video" | "image" | "audio" | "voice" | "subtitle" | "context" | "file" | "final";
  status: string;
  description: string;
  actions: string[];
};

type RevisionRequest = {
  id?: string;
  targetPart?: string;
  action?: string;
  message?: string;
  status?: string;
  requestedAt?: string;
};

type WorkflowAction = {
  key?: string;
  label?: string;
  status?: string;
  reason?: string;
};

type WorkflowState = Record<string, unknown> & {
  stage?: string;
  reservedCredits?: number;
  estimatedCredits?: number;
  hasReservedCredits?: boolean;
  activeProviderJob?: boolean;
  deliveryReady?: boolean;
  providerReadiness?: Record<string, unknown>;
  actions?: WorkflowAction[];
};

const iconMap = {
  video: Film,
  image: ImageIcon,
  audio: Music2,
  voice: Mic2,
  subtitle: Subtitles,
  context: Globe2,
  file: UploadCloud,
  final: CheckCircle2
};

function partsForProduction(type: string): AssetPart[] {
  if (["video", "campaign", "music_video", "stickman_animation", "localization"].includes(type)) {
    return [
      { title: "Scene / video parts", type: "video", status: "Preview pending", description: "Scene-by-scene video previews, duration, format, and revision decisions appear here.", actions: ["Watch", "Change scene", "Regenerate"] },
      { title: "Music", type: "audio", status: "Listening pending", description: "Background music, rhythm, local style, and energy level can be reviewed and changed here.", actions: ["Listen", "Change music", "Make it more energetic"] },
      { title: "Voice-over", type: "voice", status: "Voice selection", description: "Voice gender, language, tone, speed, and naturalness are controlled here.", actions: ["Listen", "Change voice tone", "Choose another voice"] },
      { title: "Subtitles / language", type: "subtitle", status: "Text review", description: "Subtitles, dubbing language, text size, and embedded subtitle decisions are managed here.", actions: ["Preview", "Fix text", "Change language"] },
      { title: "Long film/series clips", type: "video", status: "Clip selection pending", description: "Scene detection, hook extraction, subtitles, covers, and Shorts/Reels/TikTok cuts are prepared from long videos or episodes.", actions: ["Create Shorts", "Change clip range", "Choose another hook"] },
      { title: "Final video", type: "final", status: "Final pending", description: "After approved parts are assembled, the final video is available here for playback and download.", actions: ["Watch final", "Download", "Request revision"] }
    ];
  }

  if (["website", "saas", "mobile_app", "admin_project"].includes(type)) {
    return [
      { title: "Screen / page plan", type: "file", status: "Planning", description: "Pages, screens, modules, auth, billing, and admin structure are tracked here.", actions: ["View", "Change module", "Add new screen"] },
      { title: "UI preview", type: "image", status: "Preview pending", description: "Desktop and mobile screen previews can be checked part by part.", actions: ["Preview", "Change colors", "Adjust layout"] },
      { title: "Source delivery", type: "file", status: "ZIP preparing", description: "ZIP source, README, setup notes, and delivery packages appear here.", actions: ["View files", "Request README", "Download"] },
      { title: "Final project", type: "final", status: "Final pending", description: "Approved screens turn into the final delivery package.", actions: ["Open final", "Download", "Request revision"] }
    ];
  }

  if (["brand_kit", "image", "document_pack"].includes(type)) {
    return [
      { title: "Visual variations", type: "image", status: "Alternatives pending", description: "Logo, visual, mockup, cover, or page preview alternatives appear here.", actions: ["View", "Generate alternative", "Do not use this"] },
      { title: "Style / local context", type: "context", status: "Review pending", description: "Country, city, culture, audience, color, and brand tone are clarified here.", actions: ["Edit", "Change country/city", "Add cultural note"] },
      { title: "Delivery files", type: "file", status: "Package pending", description: "PDF, PNG, ZIP, source files, or brand guide deliveries are listed here.", actions: ["View files", "Download", "Request revision"] }
    ];
  }

  return [
    { title: "Production plan", type: "context", status: "Planning", description: "Category, target, local context, and delivery format are tracked here.", actions: ["Edit", "Approve", "Revise"] },
    { title: "Preview", type: "image", status: "Preview pending", description: "Intermediate generated outputs appear here.", actions: ["View", "Change", "Approve"] },
    { title: "Final delivery", type: "final", status: "Final pending", description: "The final output becomes downloadable and shareable here.", actions: ["Download", "Share", "Request revision"] }
  ];
}

function actionPrompt(part: AssetPart, action: string) {
  if (action.includes("Listen")) return `I want to listen to the ${part.title} part.`;
  if (action.includes("Watch") || action.includes("Preview") || action.includes("View")) return `I want to see the ${part.title} preview.`;
  if (action.includes("Download")) return `I want to download the ${part.title} output.`;
  if (action.includes("Change") || action.includes("Fix") || action.includes("voice") || action.includes("language")) return `I want to ${action.toLowerCase()} for ${part.title}.`;
  if (action.includes("Regenerate") || action.includes("alternative")) return `${part.title} should be regenerated as a new alternative instead of the current version.`;
  return `${part.title}: ${action}`;
}

function productionCardsFromRecord(production: ProductionWorkspaceProps["production"], outputJson: Record<string, any>) {
  const extra = production as Record<string, any>;
  const text = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.title ?? ""} ${production.prompt ?? ""} ${extra.features ?? ""} ${extra.project_details ?? ""} ${JSON.stringify(outputJson.projectPackage ?? {})}`.toLowerCase();
  const type = String(production.production_type ?? "").toLowerCase();
  if (["animation", "anime_short_film", "stickman_animation"].includes(type) || /animation|animasyon|anime/.test(text)) return ["Production brief", "Scene plan", "Animation video", "Voice-over", "Subtitles", "Music", "Final MP4", "Revision path"];
  if (type === "drone_video" || /drone|satellite|flyover/.test(text)) return ["Production brief", "Route / camera plan", "AI drone video", "Location labels", "Narration", "Final MP4", "Thumbnail", "Revision path"];
  const isPromoVideo = type === "video" && /saas\s*promo|promo\s*video|commercial|ad\s*video|video\s*ad|ready-to-post\s*video|product\s*link|paste\s*(a|any)?\s*link|get\s*an\s*ad|crelavo/.test(text);
  if (isPromoVideo) return ["Production brief", "Script / scene plan", "Visual video", "Voice-over", "Subtitles", "Music", "Final MP4", "Revision path"];
  if (type === "video_clipping" || /video_clipping|long_film_clipping|clip\s*selection|source\s*analysis|clip\s*çıkar|clip\s*cikar|kırp|kirp|extract\s*clips|best\s*moments/.test(text)) return ["Source analysis", "Clip selection", "Captions", "Audio cleanup", "Final clips", "ZIP package", "Revision path"];
  if (["talking_video", "avatar", "lip_sync", "voice_clone"].includes(type)) return ["Script", "Avatar / face", "Voice", "Lip-sync", "Subtitles", "Final MP4", "Voice settings", "Revision path"];
  if (type === "mobile_app" || /mobile_app|mobile|expo|react native|mobil uygulama/.test(text)) return ["Home screen", "Login flow", "User dashboard", "Settings", "Admin/control screen", "Expo source ZIP", "README / setup"];
  if (type === "saas" || /saas|subscription|billing/.test(text)) return ["Landing page", "Auth", "Dashboard", "Billing", "Admin panel", "Database schema", "Source ZIP", "README / setup"];
  if (type === "admin_project" || /admin_project|admin dashboard|admin panel|crud/.test(text)) return ["Admin dashboard", "User management", "CRUD records", "Roles", "Activity log", "Source ZIP", "README / setup"];
  if (/ecommerce|commerce|store|shop|product|checkout|cart|storefront/.test(text)) return ["Storefront", "Product catalog", "Cart", "Checkout", "Admin product manager", "Orders dashboard", "Source ZIP", "README / setup"];
  if (/seo|document_pack|keywords|metadata/.test(text)) return ["Keywords", "Metadata", "Content outline", "Page copy", "Implementation checklist"];
  if (/campaign|marketplace|social export/.test(text)) return ["Campaign copy", "Social export plan", "Marketplace export", "Creative brief", "ZIP package"];
  if (/image|visual|brand kit/.test(text)) return ["Final image", "Prompt pack", "Export specs", "Usage notes"];
  if (/voice|dubbing|voice_clone/.test(text)) return ["Voice script", "Voice settings", "Audio export spec", "Usage notes"];
  if (/video|talking|avatar|drama|documentary/.test(text)) return ["Production brief", "Scene plan", "Captions", "Export specs", "Final delivery"];
  return [];
}

function productionWaitingRoomCopy(production: ProductionWorkspaceProps["production"], cards: string[], outputJson: Record<string, any>) {
  const text = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.title ?? ""} ${production.prompt ?? ""} ${cards.join(" ")}`.toLowerCase();
  const hasVoice = /voice|voice-over|narration|dubbing|seslendirme/.test(text);
  const hasSubtitles = /subtitle|caption|altyaz/.test(text);
  const hasSource = /source|zip|readme|website|app|saas|admin|store|ecommerce/.test(text);
  const isImage = /image|visual|brand kit|logo|poster/.test(text);
  const isAudio = /voice|dubbing|music|audio/.test(text) && !/video|mp4|animation|film/.test(text);
  const isProject = hasSource && !/final mp4|video|animation|film|drone|clip|avatar|lip-sync/.test(text);
  const isVideo = /video|animation|film|mp4|drone|clip|avatar|lip-sync|documentary/.test(text);
  const isDedicatedCharacterDialogue = String(outputJson.requiredPipeline ?? "") === "character_consistent_dialogue_animation" || Boolean(outputJson.characterDialoguePlan);
  if (isDedicatedCharacterDialogue) {
    return {
      headline: "Dedicated character-dialogue pipeline required",
      description: "This brief needs locked character sheets, per-character voices, lip-sync, and scene-by-scene continuity. Generic prompt-to-video is paused so Crelavo does not deliver another inconsistent animation.",
      estimated: "provider setup required",
      stages: ["Brief saved", "Character bible", "Character sheets", "Scene storyboard", "Lip-sync pipeline", "Final assembly"],
      hasVoice,
      hasSubtitles,
      statusHint: "dedicated pipeline required"
    };
  }
  const estimated = isProject ? "10–20 minutes" : isVideo && (hasVoice || hasSubtitles) ? "5–7 minutes" : isVideo ? "3–5 minutes" : isImage ? "2–4 minutes" : isAudio ? "2–5 minutes" : "a few minutes";
  const headline = isProject ? "Project production room is active" : isImage ? "Creative production room is active" : isAudio ? "Audio production room is active" : "Production room is active";
  const description = isProject
    ? "Your project package is moving through the Crelavo production pipeline. Screens, modules, source delivery and setup materials will appear here when ready."
    : isImage
      ? "Your creative asset is moving through the Crelavo production pipeline. Visual generation, export preparation and delivery packaging will be completed before the preview is delivered here."
      : isAudio
        ? "Your audio asset is moving through the Crelavo production pipeline. Script, voice processing and export preparation will be completed before the preview is delivered here."
        : "Your production is moving through the Crelavo pipeline. Visual scenes, voice-over, subtitle synchronization and final delivery rendering will be completed before the preview is delivered here.";
  const stages = isProject
    ? ["Brief locked", "Structure and screens", "Source package", "README / setup", "Dashboard delivery", "Completion email"]
    : isImage
      ? ["Brief locked", "Visual generation", "Export formatting", "Preview delivery", "Revision options", "Completion email"]
      : isAudio
        ? ["Brief locked", hasVoice ? "Voice generation" : "Audio processing", "Timing check", "Audio export", "Revision options", "Completion email"]
        : ["Brief locked", "Visual scenes", hasVoice ? "Voice-over generation" : "Audio not selected", hasSubtitles ? "Subtitle synchronization" : "Subtitles not selected", "Final render", "Completion email"];
  return { headline, description, estimated, stages, hasVoice, hasSubtitles, statusHint: String(outputJson.providerStatus ?? production.generation_status ?? production.automation_status ?? "processing").replaceAll("_", " ") };
}

function workflowStageLabel(stage?: string) {
  const map: Record<string, string> = {
    queued: "Queued",
    waiting_provider_config: "Waiting provider config",
    provider_ready: "Provider ready",
    in_production: "Production running",
    qa_review: "QA / approval",
    ready: "Delivery ready",
    failed: "Failed",
    cancelled: "Cancelled"
  };
  return stage ? map[stage] ?? stage.replaceAll("_", " ") : "Workflow pending";
}

function workflowActionTone(status?: string) {
  if (status === "done") return "ready";
  if (status === "available") return "active";
  if (status === "blocked") return "failed";
  return "unknown";
}

function creativeLiveCards(input: { metadata: Record<string, any>; inputJson: Record<string, any>; outputJson: Record<string, any>; type: string }) {
  const text = `${String(input.metadata.creativeBrief ?? input.inputJson.creativeBrief ?? input.outputJson.creativeBrief ?? "")} ${String(input.metadata.creativePreset ?? input.inputJson.creativePreset ?? "")} ${String(input.metadata.providerPrompt ?? input.inputJson.providerPrompt ?? "")} ${String(input.outputJson.providerStatus ?? "")}`.toLocaleLowerCase("tr-TR");
  const isPresenter = ["talking_video", "avatar", "lip_sync"].includes(input.type) || /presenter|avatar|heygen|ugc/.test(text);
  if (!isPresenter) return [];
  const providerStatus = String(input.outputJson.providerStatus ?? input.outputJson.visualJob?.status ?? input.outputJson.heygenVideoAgent?.status ?? "working").replaceAll("_", " ");
  const cards = [
    { title: "Creative blueprint", status: input.metadata.creativePreset ?? input.inputJson.creativePreset ?? "Creator presenter", description: "Assistant is turning the user request into a directed video concept instead of sending a raw prompt." },
    { title: /outdoor|dışarı|disari|sokak|şehir|sehir|city/.test(text) ? "Outdoor UGC direction" : "Presenter direction", status: /outdoor|dışarı|disari|sokak|şehir|sehir|city/.test(text) ? "Outdoor / city" : "Single presenter", description: /outdoor|dışarı|disari|sokak|şehir|sehir|city/.test(text) ? "One moving presenter in a modern outside/city environment, with natural gestures and direct eye contact." : "One realistic presenter only, no group, no office panel, no background people." },
    { title: /hook|kanca|kapak|fomo|kaçır|kacir/.test(text) ? "Hook + FOMO" : "Hook design", status: /hook|kanca|kapak|fomo|kaçır|kacir/.test(text) ? "Strong hook" : "Opening hook", description: /hook|kanca|kapak|fomo|kaçır|kacir/.test(text) ? "First seconds focus on a cover-style hook, urgency, FOMO, and brand recall." : "The first seconds are structured to explain the pain and catch attention quickly." },
    { title: "A-roll scene", status: providerStatus, description: "Presenter speaking directly to camera with energetic delivery and clear Crelavo brand mention." },
    { title: "B-roll / UI overlays", status: providerStatus, description: "Product proof cards, app UI overlays, kinetic captions, fast cuts, and result moments support the presenter." },
    { title: "Provider job", status: String(input.outputJson.heygenProviderProof?.provider ?? input.outputJson.visualJob?.provider ?? input.outputJson.providerProof ?? "heygen_video_agent"), description: `Live provider status: ${providerStatus}` }
  ];
  return cards;
}

export function ProductionWorkspace({ production }: ProductionWorkspaceProps) {
  useEffect(() => {
    let shouldForceTop = true;
    try {
      window.history.scrollRestoration = "manual";
      shouldForceTop = window.sessionStorage.getItem("clipora-scroll-top-next") === "1" || window.scrollY > 0;
      window.sessionStorage.removeItem("clipora-scroll-top-next");
    } catch {
      shouldForceTop = true;
    }
    if (!shouldForceTop) return;
    const forceTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    forceTop();
    requestAnimationFrame(forceTop);
    const timers = [50, 200, 600].map((delay) => window.setTimeout(forceTop, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [production.id]);

  const [message, setMessage] = useState("");
  const [targetPart, setTargetPart] = useState("General production");
  const [action, setAction] = useState("Request revision");
const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
const [notice, setNotice] = useState("");

  async function prepareSocialSharing() {
    setTargetPart("Social media sharing");
    setAction("Prepare social sharing");
    setMessage(`Prepare export-ready delivery using this caption/product description: ${deliveryCaption}\nHashtags/product tags: ${deliveryHashtags}\nStore product ID: ${deliveryProductId || "not selected"}`);
    setNotice("Saving social/store delivery preferences...");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setNotice(auth.message);
      window.setTimeout(() => document.getElementById("social-share-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    const response = await fetch(`/api/productions/${production.id}/delivery-preferences`, {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ caption: deliveryCaption, hashtags: deliveryHashtags, product_id: deliveryProductId })
    });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Social/store delivery preferences saved into the export-ready pack. Review it and send from the assistant intervention area." : (data.error ?? "Delivery preferences could not be saved."));
    window.setTimeout(() => document.getElementById("social-share-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }
  const [localRevisions, setLocalRevisions] = useState<RevisionRequest[]>([]);
  const [pollingNote, setPollingNote] = useState("");
  const [providerStartNote, setProviderStartNote] = useState("");
  const [providerStarting, setProviderStarting] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"normal" | "compact" | "shorts">("normal");
  const [deliveryCaption, setDeliveryCaption] = useState(String(production.prompt ?? "Review this caption before publishing."));
  const [deliveryHashtags, setDeliveryHashtags] = useState("#ai #videomarketing #ecommerce");
  const [deliveryProductId, setDeliveryProductId] = useState("");

  const type = String(production.production_type ?? "general");
  const isProjectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(type);
  const previewToolbarTitle = isProjectProduction
    ? previewMode === "shorts" ? "Mobile preview" : previewMode === "compact" ? "Tablet preview" : "Desktop preview"
    : previewMode === "shorts" ? "Shorts vertical" : previewMode === "compact" ? "Compact view" : "Full theater";
  const previewModeLabels: Record<"normal" | "compact" | "shorts", string> = isProjectProduction
    ? { normal: "Desktop", compact: "Tablet", shorts: "Mobile" }
    : { normal: "Normal", compact: "Small", shorts: "Shorts" };
  const revisionIntro = isProjectProduction
    ? "The user can request project changes such as updating the homepage layout, adding movie categories, changing the admin panel, adding subscription pages, or revising the source package. The system links the request to the relevant project card."
    : "The user can ask for changes such as changing the music, regenerating scene 2, making subtitles smaller, removing an outfit, or choosing another voice. The system links the request to the relevant card.";
  const revisionPlaceholder = isProjectProduction
    ? "Write a project revision request: Add subscription plans, improve the movie detail page, add admin moderation tools, or change the dashboard layout."
    : "Write a revision request: This voice does not fit; use a deeper and more confident voice. Scene 2 is too dark; make it a brighter office.";
  const metadata = production.request_metadata ?? {};
  const outputJson = production.output_json ?? {};
  const rowInputJson = production.input_json && typeof production.input_json === "object" ? production.input_json as Record<string, any> : {};
  const embeddedInputJson = outputJson.inputJson && typeof outputJson.inputJson === "object" ? outputJson.inputJson as Record<string, any> : {};
  const inputJson = { ...rowInputJson, ...embeddedInputJson };
  const creativeActivityCards = creativeLiveCards({ metadata, inputJson, outputJson, type });
  const metadataProductionCards = Array.isArray(metadata.productionCards) ? metadata.productionCards.map(String) : Array.isArray(metadata.selectedOptions) ? metadata.selectedOptions.map(String) : Array.isArray(inputJson.productionCards) ? inputJson.productionCards.map(String) : [];
  const typeLockedProductionCards = productionCardsFromRecord(production, outputJson);
  const waitingRoom = productionWaitingRoomCopy(production, typeLockedProductionCards, outputJson);
  const productionControlText = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.title ?? ""} ${production.prompt ?? ""} ${JSON.stringify(metadata)} ${JSON.stringify(inputJson)} ${JSON.stringify(outputJson)}`.toLowerCase();
  const noVoiceRequested = /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|voice-?over\s*(off|none)|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(productionControlText);
  const noSubtitlesRequested = /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|subtitles?\s*(off|none)|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(productionControlText);
  const noMusicRequested = /no\s*music|without\s*music|music\s*(off|none)|müzik\s*olmasın|muzik\s*olmasın|müzik\s*yok|muzik\s*yok|sessiz/.test(productionControlText);
  const isLockedVideoProduction = type === "video" || String(production.package_id ?? "").toLowerCase() === "video_premium";
  const metadataHasProjectSourceCards = metadataProductionCards.some((card) => /home screen|login flow|user dashboard|settings|admin\/control screen|expo source zip|readme\s*\/\s*setup|source zip|database schema|billing|admin panel/i.test(card));
  const metadataLooksCrossRouted = (isLockedVideoProduction && metadataHasProjectSourceCards) || ["mobile_app", "animation", "anime_short_film", "stickman_animation", "drone_video", "video_clipping", "talking_video", "avatar", "lip_sync"].includes(type) && metadataProductionCards.some((card) => /storefront|checkout|cart|orders dashboard|product catalog/i.test(card));
  const liveProductionCards = (metadataProductionCards.length && !metadataLooksCrossRouted ? metadataProductionCards : typeLockedProductionCards).filter((card) => {
    const item = String(card).toLowerCase();
    if (noVoiceRequested && /voice|narration|seslendirme/.test(item)) return false;
    if (noSubtitlesRequested && /subtitle|caption|altyaz/.test(item)) return false;
    if (noMusicRequested && /music|müzik|muzik/.test(item)) return false;
    return true;
  });
  const workflowState = outputJson.workflowState && typeof outputJson.workflowState === "object" && !Array.isArray(outputJson.workflowState) ? outputJson.workflowState as WorkflowState : null;
  const workflowActions = Array.isArray(workflowState?.actions) ? workflowState.actions : [];
  const workflowProviderReadiness = workflowState?.providerReadiness && typeof workflowState.providerReadiness === "object" ? workflowState.providerReadiness : null;
  const audience = metadata.audienceContext ?? {};
  const materials = Array.isArray(production.materials_json) ? production.materials_json : [];
  const parts = partsForProduction(type);
  const persistedRevisions = useMemo(() => {
    const outputRevisions = Array.isArray(outputJson.revisionRequests) ? outputJson.revisionRequests : [];
    const metadataRevisions = Array.isArray(metadata.revisionRequests) ? metadata.revisionRequests : [];
    return [...outputRevisions, ...metadataRevisions] as RevisionRequest[];
  }, [metadata, outputJson]);
  const revisions = useMemo(() => {
    const normalizeRevisionText = (value: unknown) => String(value ?? "")
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, " ")
      .replace(/[·•,.;:!?`'"“”‘’()\[\]{}_-]+/g, "")
      .trim();
    const byKey = new Map<string, RevisionRequest>();
    [...persistedRevisions, ...localRevisions].forEach((revision) => {
      const key = normalizeRevisionText(revision.targetPart || "Final MP4");
      const previous = byKey.get(key);
      if (!previous) {
        byKey.set(key, revision);
        return;
      }
      const previousStatus = String(previous.status ?? "queued");
      const currentStatus = String(revision.status ?? "queued");
      const statusRank = (status: string) => status.includes("provider_job_created") ? 6 : status.includes("provider_failed") ? 5 : status.includes("payment_or_credit_required") ? 4 : status.includes("queued") ? 3 : status.includes("ready") ? 2 : status.includes("already_running") ? 1 : 0;
      if (statusRank(currentStatus) >= statusRank(previousStatus)) byKey.set(key, revision);
    });
    return Array.from(byKey.values());
  }, [persistedRevisions, localRevisions]);
  const safeAssetUrl = (value: unknown) => {
    const url = String(value ?? "").trim();
    if (!url || url === "#") return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;
    return "";
  };
  const safePlayableMediaUrl = (value: unknown) => {
    const url = safeAssetUrl(value);
    if (!url) return "";
    if (/\/api\/productions\/.*\/delivery\?file=/i.test(url)) return "";
    if (/preview\.html|manifest|readme|placeholder|generated_on_download/i.test(url)) return "";
    return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url) ? url : "";
  };
  const mediaDetectionText = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.title ?? ""} ${production.prompt ?? ""} ${JSON.stringify(metadata)} ${JSON.stringify(inputJson)} ${JSON.stringify(outputJson)} ${metadataProductionCards.join(" ")} ${typeLockedProductionCards.join(" ")}`.toLowerCase();
  const hasVideoProductionCard = liveProductionCards.some((card) => /video|mp4|scene|animation|voice|subtitle|music/i.test(String(card)));
  const legacyAnimationRecord = /animasyon|animation|animation video|final mp4|scene plan/.test(mediaDetectionText) && !outputJson.visualJob && !outputJson.renderJob && !outputJson.finalVideoUrl && !production.preview_url && !production.delivery_link;
  const isMediaProduction = legacyAnimationRecord || hasVideoProductionCard || ["video", "campaign", "music_video", "cinematic_video", "animation", "anime_short_film", "avatar", "lip_sync", "talking_video", "live_sales_agent", "studio", "drama", "video_tools", "video_clipping", "drone_video", "stickman_animation", "documentary", "animal_video", "nature_video", "planet_space_video"].includes(String(production.production_type ?? "")) || /video|animation|animasyon|anime|mp4|voice-over|subtitles|music|drone|film|scene plan|final mp4/.test(mediaDetectionText);
  const recoveryStatusText = `${production.automation_status ?? ""} ${production.generation_status ?? ""} ${String(outputJson.automationStatus ?? "")} ${String(outputJson.providerStatus ?? "")}`.toLowerCase();
  const lostOutputRecoveryNeeded = isMediaProduction && /lost_output_recovery|output_deleted_regenerate|output_deleted/.test(recoveryStatusText) && !outputJson.visualJob && !outputJson.renderJob && !outputJson.finalVideoUrl && !production.preview_url && !production.delivery_link;
  const primaryAlternative = Array.isArray(outputJson.alternatives) && outputJson.alternatives[0] && typeof outputJson.alternatives[0] === "object" ? outputJson.alternatives[0] as Record<string, any> : null;
  const rawPreviewUrl = safePlayableMediaUrl(
    outputJson.finalVideoUrl
    || outputJson.providerFinalUrl
    || outputJson.previewUrl
    || outputJson.preview_url
    || outputJson.rawVisualPreviewUrl
    || outputJson.deliveryLink
    || outputJson.delivery_link
    || primaryAlternative?.preview_url
    || primaryAlternative?.previewUrl
    || primaryAlternative?.url
    || production.preview_url
    || production.delivery_link
  );
  const rawDeliveryUrl = safePlayableMediaUrl(
    outputJson.finalVideoUrl
    || outputJson.providerFinalUrl
    || production.delivery_link
    || production.delivery_zip_url
    || outputJson.deliveryLink
    || outputJson.delivery_link
    || outputJson.deliveryZipUrl
    || outputJson.delivery_url
    || primaryAlternative?.url
    || rawPreviewUrl
  );
const mediaReadySignal = `${production.automation_status ?? ""} ${production.generation_status ?? ""} ${String(outputJson.providerStatus ?? "")} ${String(outputJson.finalVideoUrl ?? "")} ${String(outputJson.providerFinalUrl ?? "")} ${String(outputJson.releaseSource ?? "")}`;
const hasPlayableMediaUrl = Boolean(rawPreviewUrl || rawDeliveryUrl);
const mediaOutputReleased = hasPlayableMediaUrl || /final_video_ready|provider_succeeded|completed|admin_force_ready/i.test(mediaReadySignal);
const previewUrl = isMediaProduction && !mediaOutputReleased ? "" : rawPreviewUrl;
const deliveryUrl = isMediaProduction && !mediaOutputReleased ? "" : rawDeliveryUrl;
  const mediaDownloadUrl = isMediaProduction && deliveryUrl ? `/api/productions/${production.id}/delivery?file=video` : deliveryUrl;
  const playbackUrl = previewUrl || (isMediaProduction ? deliveryUrl : "");
  const sourceUrl = safeAssetUrl(production.source_files_url || outputJson.sourceFilesUrl);
  const readmeUrl = safeAssetUrl(production.readme_url || outputJson.readmeUrl);
  const outputPlan = metadata.outputPlan ?? outputJson.outputPlan ?? {};
  const agentAction = (metadata.agentAction && typeof metadata.agentAction === "object" ? metadata.agentAction : outputJson.agentAction && typeof outputJson.agentAction === "object" ? outputJson.agentAction : null) as Record<string, unknown> | null;
  const agentProviderRoutePlan = (metadata.agentProviderRoutePlan && typeof metadata.agentProviderRoutePlan === "object" ? metadata.agentProviderRoutePlan : outputJson.agentProviderRoutePlan && typeof outputJson.agentProviderRoutePlan === "object" ? outputJson.agentProviderRoutePlan : null) as Record<string, unknown> | null;
  const projectWorkflow = metadata.projectWorkflow && typeof metadata.projectWorkflow === "object" ? metadata.projectWorkflow as Record<string, unknown> : null;
  const commerceWorkflow = metadata.commerceWorkflow && typeof metadata.commerceWorkflow === "object" ? metadata.commerceWorkflow as Record<string, unknown> : null;
  const deliveryTargets = metadata.deliveryTargets && typeof metadata.deliveryTargets === "object" ? metadata.deliveryTargets as Record<string, unknown> : null;
  const deliveryPackage = (metadata.deliveryPackage && typeof metadata.deliveryPackage === "object" ? metadata.deliveryPackage : outputJson.deliveryPackage && typeof outputJson.deliveryPackage === "object" ? outputJson.deliveryPackage : null) as Record<string, unknown> | null;
  const projectPackage = (outputJson.projectPackage && typeof outputJson.projectPackage === "object" ? outputJson.projectPackage : null) as Record<string, any> | null;
  const projectImplementationStatus = String(projectPackage?.implementationStatus ?? "working_source_package_ready").replace("starter_source_package_ready", "working_source_package_ready");
  const deliveryRequirements = (metadata.deliveryRequirements && typeof metadata.deliveryRequirements === "object" ? metadata.deliveryRequirements : outputJson.deliveryRequirements && typeof outputJson.deliveryRequirements === "object" ? outputJson.deliveryRequirements : null) as Record<string, unknown> | null;
  const deliveryRequirementFormats = Array.isArray(deliveryRequirements?.formats) ? deliveryRequirements.formats.map(String) : [];
  const publishTargets = Array.isArray(deliveryTargets?.publishTargets) ? deliveryTargets.publishTargets.map(String) : [];
  const costNotes = Array.isArray(outputPlan.costNotes) ? outputPlan.costNotes : [];
  const automationScript = String(outputJson.script ?? "");
  const automationParts = Array.isArray(outputJson.parts) ? outputJson.parts : Array.isArray(outputJson.scenePlan) ? outputJson.scenePlan : [];
  const visualJob = outputJson.visualJob && typeof outputJson.visualJob === "object" ? outputJson.visualJob as Record<string, any> : null;
  const heygenProviderProof = outputJson.heygenProviderProof && typeof outputJson.heygenProviderProof === "object" ? outputJson.heygenProviderProof as Record<string, any> : null;
const heygenSessionId = String(outputJson.heygenSessionId ?? heygenProviderProof?.sessionId ?? "").trim();
const heygenVideoId = String(outputJson.heygenVideoId ?? heygenProviderProof?.videoId ?? "").trim();
const providerProofProvider = String(visualJob?.provider ?? outputJson.provider ?? "").trim();
const providerProofStatus = String(visualJob?.status ?? outputJson.providerStatus ?? production.generation_status ?? production.automation_status ?? "").trim();
  const visualJobs = Array.isArray(outputJson.visualJobs) ? outputJson.visualJobs as Record<string, any>[] : visualJob ? [visualJob] : [];
  const voiceAudioUrl = String(outputJson.voiceAudioUrl ?? outputJson.voice_audio_url ?? "");
  const voiceJobs = Array.isArray(outputJson.voiceJobs) ? outputJson.voiceJobs : [];
  const providerStatus = String(outputJson.providerStatus ?? "");
  const realtimeProgressSteps = productionProgressSteps({ status: production.status, generationStatus: production.generation_status, automationStatus: production.automation_status, outputJson });
  const inferredProgress = productionProgressPercent(realtimeProgressSteps);
  const providerProgress = Number.isFinite(Number(outputJson.providerProgress)) ? Math.max(0, Math.min(100, Number(outputJson.providerProgress))) : inferredProgress;
  const providerTestMode = Boolean(outputJson.providerTestMode ?? metadata.providerTestMode);
  const providerPreflight = outputJson.providerPreflight && typeof outputJson.providerPreflight === "object" ? outputJson.providerPreflight as Record<string, unknown> : null;
  const providerReadiness = outputJson.providerReadiness && typeof outputJson.providerReadiness === "object" ? outputJson.providerReadiness as Record<string, any> : null;
  const providerRequirements = Array.isArray(providerReadiness?.requirements) ? providerReadiness.requirements as Record<string, any>[] : [];
  const characterDialoguePlan = outputJson.characterDialoguePlan && typeof outputJson.characterDialoguePlan === "object" ? outputJson.characterDialoguePlan as Record<string, any> : null;
  const characterDialogueCharacters = Array.isArray(characterDialoguePlan?.characterBible) ? characterDialoguePlan.characterBible as Record<string, any>[] : [];
  const characterDialogueScenes = Array.isArray(characterDialoguePlan?.scenes) ? characterDialoguePlan.scenes as Record<string, any>[] : [];
  const characterDialogueTimeline = Array.isArray(characterDialoguePlan?.dialogueTimeline) ? characterDialoguePlan.dialogueTimeline as Record<string, any>[] : [];
const characterDialogueCapabilities = Array.isArray(characterDialoguePlan?.requiredProviderCapabilities) ? characterDialoguePlan.requiredProviderCapabilities as string[] : [];
const characterDialogueProviderJobs = Array.isArray(characterDialoguePlan?.providerJobs) ? characterDialoguePlan.providerJobs as Record<string, any>[] : [];
const dedicatedCharacterDialogueRequired = String(outputJson.requiredPipeline ?? "") === "character_consistent_dialogue_animation" || Boolean(characterDialoguePlan);
const readyCharacterSheets = characterDialogueProviderJobs.filter((job) => job.stage === "character_sheet" && job.imageUrl);
const readySceneImages = characterDialogueProviderJobs.filter((job) => job.stage === "scene_image" && job.imageUrl);
const startedI2vJobs = characterDialogueProviderJobs.filter((job) => job.stage === "image_to_video" && (job.providerJobId || job.raw || job.providerStatus));
const readySceneClips = characterDialogueProviderJobs.filter((job) => job.stage === "image_to_video" && job.outputUrl);
const readyVoiceSegments = characterDialogueProviderJobs.filter((job) => job.stage === "voice_segment" && job.audioUrl);
const finalAssemblyJobs = characterDialogueProviderJobs.filter((job) => job.stage === "final_assembly");
const readyFinalAssemblyJobs = finalAssemblyJobs.filter((job) => job.outputUrl || job.status === "ready");
const failedCharacterDialogueJobs = characterDialogueProviderJobs.filter((job) => String(job.status ?? "").includes("failed") || String(job.error ?? "").trim());
const characterSheetTotal = characterDialogueProviderJobs.filter((job) => job.stage === "character_sheet").length || characterDialogueCharacters.length;
const sceneImageTotal = characterDialogueProviderJobs.filter((job) => job.stage === "scene_image").length || characterDialogueScenes.length;
const i2vTotal = characterDialogueProviderJobs.filter((job) => job.stage === "image_to_video").length || characterDialogueScenes.length;
const voiceSegmentTotal = characterDialogueProviderJobs.filter((job) => job.stage === "voice_segment").length || characterDialogueTimeline.length;
const dedicatedProgressItems = dedicatedCharacterDialogueRequired ? [
  { label: "Character sheets", ready: readyCharacterSheets.length, total: characterSheetTotal },
  { label: "Scene images", ready: readySceneImages.length, total: sceneImageTotal },
  { label: "Image-to-video clips", ready: readySceneClips.length, total: i2vTotal, note: startedI2vJobs.length && readySceneClips.length < i2vTotal ? `${startedI2vJobs.length}/${i2vTotal || "?"} started` : "" },
  { label: "Voice segments", ready: readyVoiceSegments.length, total: voiceSegmentTotal },
  { label: "Final assembly", ready: readyFinalAssemblyJobs.length, total: finalAssemblyJobs.length || 1 }
] : [];
const hasDedicatedCharacterDialogueJobs = characterDialogueProviderJobs.length > 0;
  const outputRegistry = Array.isArray(outputJson.outputRegistry) ? outputJson.outputRegistry as Record<string, any>[] : [];
  const renderQueuePolicy = (metadata.renderQueuePolicy && typeof metadata.renderQueuePolicy === "object" ? metadata.renderQueuePolicy : outputJson.renderQueuePolicy && typeof outputJson.renderQueuePolicy === "object" ? outputJson.renderQueuePolicy : null) as Record<string, unknown> | null;
  const capacityPolicy = (metadata.capacityPolicy && typeof metadata.capacityPolicy === "object" ? metadata.capacityPolicy : outputJson.capacityPolicy && typeof outputJson.capacityPolicy === "object" ? outputJson.capacityPolicy : null) as Record<string, unknown> | null;
  const queueStatus = String(outputJson.queueStatus ?? "");
  const queueUserMessage = String(outputJson.userMessage ?? "");
  const activeVideoJobs = outputJson.activeVideoJobs !== undefined ? Number(outputJson.activeVideoJobs) : undefined;
  const activeJobLimit = outputJson.activeJobLimit !== undefined ? Number(outputJson.activeJobLimit) : undefined;
  const isQueuedForRenderSlot = production.status === "queued" || production.automation_status === "queued" || production.generation_status === "queued_for_render_slot" || queueStatus === "waiting_for_video_provider_slot";
  const isWaitingProviderConfig = production.generation_status === "waiting_provider_config" || production.automation_status === "waiting_provider_config" || providerStatus === "waiting_provider_config";
  const creditResolution = outputJson.creditResolution && typeof outputJson.creditResolution === "object" ? outputJson.creditResolution as Record<string, unknown> : null;
  const creditResolutionStatus = String(creditResolution?.status ?? "");
  const creditResolutionTitle = creditResolutionStatus === "spent_reserved" ? "Reserved credits converted to spend" : creditResolutionStatus === "cancelled_half_spent" ? "Cancellation charge applied" : creditResolutionStatus === "refunded_reserved" ? "Reserved credits refunded" : "Credit resolution is under admin review";
  const selectedAlternative = String(outputJson.selectedAlternative ?? "");
  const pendingOutputActions = Array.isArray(outputJson.pendingOutputActions) ? outputJson.pendingOutputActions : [];
  const expectedAlternativeCount = Math.max(1, Number(outputPlan.outputCount ?? 3) || 3);
  const savedAlternatives = Array.isArray(outputJson.alternatives) ? outputJson.alternatives : [];
  const alternatives = savedAlternatives.length > 0
    ? savedAlternatives
    : Array.from({ length: expectedAlternativeCount }, (_, index) => ({
        id: `planned-${index + 1}`,
        title: `Alternative ${index + 1}`,
        status: index === 0 ? "Primary recommendation preparing" : "Variation pending",
        description: isProjectProduction
          ? (index === 0 ? "The recommended project package appears here." : "A different page layout, module set, dashboard flow, or source package variation appears here.")
          : (index === 0 ? "The system's best single output appears here." : "A different hook, scene, voice, style, or format variation appears here."),
        preview_url: ""
      }));
  const hasAlternativeJobs = alternatives.some((alternative: Record<string, any>) => alternative?.visualJob && !["ready", "provider_failed"].includes(String(alternative.status ?? "")));
  const liveStatus = String(production.automation_status || production.generation_status || production.status || "queued");
  const productionIdShort = production.id.length > 10 ? `${production.id.slice(0, 8)}...${production.id.slice(-4)}` : production.id;
  const mediaFinalReady = !isMediaProduction || mediaOutputReleased;
  const hasPreview = Boolean(previewUrl || (!isMediaProduction && voiceAudioUrl) || (mediaFinalReady && savedAlternatives.some((alternative: Record<string, any>) => alternative.preview_url || alternative.previewUrl || alternative.url)));
  const hasDelivery = Boolean(deliveryUrl || (!isMediaProduction && (sourceUrl || readmeUrl)));
const automationWarningText = `${production.generation_status ?? ""} ${production.automation_status ?? ""} ${String(outputJson.providerStatus ?? "")} ${String(production.error_message ?? "")}`;
const hasAutomationWarning = !hasPlayableMediaUrl && /warning|schema|does not exist|42703|error/i.test(automationWarningText);
const isFailed = production.status === "failed" || production.automation_status === "failed" || liveStatus.includes("failed") || hasAutomationWarning;
  const isReady = isMediaProduction ? (mediaFinalReady && (hasDelivery || production.status === "ready" || production.automation_status === "completed")) : (production.status === "ready" || production.automation_status === "completed" || hasDelivery);
  const projectPackageReady = isProjectProduction && isReady;
  const isDedicatedPipelineRunning = dedicatedCharacterDialogueRequired && !isReady;
  const startButtonLabel = isReady ? "Ready" : providerStarting ? "Starting..." : projectPackageReady ? "Package Ready" : isDedicatedPipelineRunning ? "Auto tracking" : isProjectProduction ? "Prepare Package" : "Start Production";
  const startButtonDisabled = isReady || providerStarting || projectPackageReady || isDedicatedPipelineRunning;
  const providerJobMissingWhileRunning = isMediaProduction && !visualJob && !hasAlternativeJobs && !hasDedicatedCharacterDialogueJobs && !mediaFinalReady && !hasPreview && !hasDelivery && (
    hasVideoProductionCard
    || /running|in_production|strategy_running|provider_start_failed/.test(liveStatus)
    || production.status === "in_production"
    || /running|in_production|strategy_running|provider_start_failed/.test(`${production.status ?? ""} ${production.generation_status ?? ""} ${production.automation_status ?? ""} ${String(outputJson.automationStatus ?? "")} ${providerStatus}`)
  );
  const isProviderRunning = !providerJobMissingWhileRunning && !hasAutomationWarning && (/provider_started|automation_started|in_progress|processing|running/.test(liveStatus) || Boolean(visualJob || hasAlternativeJobs));
  const liveStatusLabel = isFailed ? "Needs attention" : isReady ? "Ready" : hasPreview ? "Preview ready" : isDedicatedPipelineRunning ? "Production running" : lostOutputRecoveryNeeded ? "Output deleted — regenerate" : providerJobMissingWhileRunning ? "Provider job not attached" : isProviderRunning ? "Production running" : isQueuedForRenderSlot ? "Queued" : "Record created";
  const statusTone = isFailed ? "failed" : isReady ? "ready" : hasPreview ? "preview" : "processing";
  const creditAmountText = production.reserved_credits ? `${production.reserved_credits.toLocaleString()} credits` : production.estimated_credits ? `${production.estimated_credits.toLocaleString()} est.` : "Not recorded";
  const reservedCreditsText = projectPackageReady && production.reserved_credits ? `${production.reserved_credits.toLocaleString()} credits included` : creditAmountText;
  const creditLabel = projectPackageReady ? "Package credits" : production.reserved_credits ? "Reserved" : production.estimated_credits ? "Estimate" : "Credits";
const previewUrlLower = playbackUrl.toLowerCase();
const previewKind = isMediaProduction && mediaFinalReady && playbackUrl ? "video" : previewUrlLower.match(/\.(mp4|webm|mov)(\?|$)/) ? "video" : previewUrlLower.match(/\.(png|jpe?g|webp|gif|avif)(\?|$)/) ? "image" : playbackUrl ? "web" : "pending";
  const nextLiveStep = hasAutomationWarning
    ? "Automation needs attention. Provider generation has not started yet; check provider/schema setup before treating this as running."
    : isDedicatedPipelineRunning
    ? "Dedicated character-dialogue pipeline is running. The preview theater stays open while character sheets, scene images, I2V clips, voice segments and final assembly complete."
    : providerJobMissingWhileRunning
    ? "Production is marked running, but no provider job is attached. Press Start Production once to attach the real video provider job."
    : isWaitingProviderConfig
    ? "Production scope and delivery package are ready. Demo delivery can be downloaded while the final production handoff is prepared."
    : isQueuedForRenderSlot
    ? "This production is safely queued for the next render slot. The page can be left open or closed; completion email is sent when ready."
    : hasDelivery
      ? "Final delivery is ready; the user can preview, download, share, or request a revision."
      : hasPreview
        ? "Preview is ready; the user can choose an alternative or request changes."
        : isProviderRunning
          ? "Production has started. Provider generation/automation is running; status is checked automatically and preview will appear here when ready."
          : "Production record is ready; provider job or project package can be started.";
  const liveSteps = [
    { label: "Request received", active: true },
    { label: "Provider / package", active: Boolean(isProviderRunning || providerPreflight || hasPreview || hasDelivery) },
    { label: "Preview", active: hasPreview },
    { label: "Final delivery", active: hasDelivery }
  ];
  const deliveryRequiredItems = Array.isArray(deliveryPackage?.requiredItems) ? deliveryPackage.requiredItems.map(String) : [];
  const deliveryOptionalItems = Array.isArray(deliveryPackage?.optionalItems) ? deliveryPackage.optionalItems.map(String) : [];
  const deliveryFormats = Array.isArray(deliveryPackage?.fileFormats) ? deliveryPackage.fileFormats.map(String) : [];
  const approvalOptions = Array.isArray(production.approval_options) ? production.approval_options : [];
  const needsApproval = production.approval_status === "waiting" && Boolean(production.approval_question);
  const canCancel = !["ready", "failed", "cancelled"].includes(String(production.status ?? ""));

  async function submitApproval(option: { label: string; description?: string; extraCredits?: number }) {
    if (!production.user_id) {
      setNotice("User session could not be verified for this decision.");
      setStatus("error");
      return;
    }

    setApprovalLoading(option.label);
    setNotice("");
    const response = await fetch("/api/productions/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        production_id: production.id,
        user_id: production.user_id,
        selected_option: option.label,
        extra_credits: option.extraCredits ?? 0
      })
    });

    const data = await response.json().catch(() => ({}));
    setApprovalLoading("");

    if (!response.ok) {
      setStatus("error");
      setNotice(data.error ?? "Approval decision could not be saved.");
      if (data.redirect) window.location.href = data.redirect;
      return;
    }

    setStatus("success");
    setNotice("Your choice has been saved. Automation will continue with this decision.");
    window.setTimeout(() => window.location.reload(), 900);
  }

  async function cancelProduction() {
    if (!canCancel) return;
    const confirmed = window.confirm("If you cancel this automatic production, 50% of the reserved credits will be charged and the remaining 50% will be released. Continue?");
    if (!confirmed) return;
    if (!production.user_id) {
      setNotice("User session could not be verified for cancellation.");
      setStatus("error");
      return;
    }

    setCancelLoading(true);
    setNotice("");
    const response = await fetch("/api/productions/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ production_id: production.id, user_id: production.user_id })
    });
    const data = await response.json().catch(() => ({}));
    setCancelLoading(false);

    if (!response.ok) {
      setStatus("error");
      setNotice(data.error ?? "Production could not be cancelled.");
      return;
    }

    setStatus("success");
    setNotice(`Production cancelled. Charged: ${data.cancellation_fee ?? 0} credits, released: ${data.refund_amount ?? 0} credits.`);
    window.setTimeout(() => window.location.reload(), 900);
  }

  async function restartProviderJob() {
    if (providerStarting) return;
    setProviderStarting(true);
    setProviderStartNote(isProjectProduction ? "Preparing project package..." : "Sending production start request...");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setProviderStarting(false);
      setProviderStartNote(auth.message || "Session could not be verified. Please sign in again.");
      if (auth.redirect) window.location.href = auth.redirect;
      return;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 75000);
    const response = await fetch("/api/automation/start", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      signal: controller.signal,
      body: JSON.stringify({ production_id: production.id, user_id: auth.user.id, legal_acceptance: true, force_start: true })
    }).catch((error) => ({ aborted: error instanceof DOMException && error.name === "AbortError" }));
    window.clearTimeout(timeoutId);
    if (!response || "aborted" in response) {
      setProviderStarting(false);
      setProviderStartNote(response && "aborted" in response && response.aborted ? "The start request did not respond within 75 seconds. The server or provider may be stuck; please try again shortly or check the provider configuration." : "Network error: the start request did not reach the server. You can try again without refreshing the page.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setProviderStarting(false);
      if (data.requiredPipeline === "character_consistent_dialogue_animation") {
        setProviderStartNote("This request needs a dedicated character-dialogue animation pipeline: locked character sheets, per-character voices, lip-sync, and scene-by-scene continuity. Generic prompt-to-video was blocked to avoid another inconsistent delivery.");
      } else {
        const message = data.error ?? data.message ?? "Provider job could not be started.";
        setProviderStartNote(`Start error: ${message}`);
      }
      if (data.redirect) window.location.href = data.redirect;
      return;
    }
    if (data.waiting_provider_config) {
      setProviderStarting(false);
      const readinessMessage = data.provider_readiness?.userMessage || data.production?.admin_notes || data.production?.output_json?.providerErrors?.visual_generation || "The video provider did not return a real job. Check the provider error and try again after fixing provider routing.";
      setProviderStartNote(`Could not start: ${readinessMessage}`);
      return;
    }
    const message = data.already_ready
      ? "Project package is already ready, refreshing page..."
      : data.project_delivery_ready
        ? "Project package is ready, refreshing page..."
        : data.dedicated_started
          ? "Dedicated character-dialogue pipeline started, refreshing page..."
          : data.queued
            ? "Production was added to the safe provider queue, refreshing page..."
            : data.already_running
              ? "An active provider job already exists, refreshing page..."
              : data.demo
                ? "Demo/manual delivery status updated, refreshing page..."
                : "Provider job started, refreshing page...";
    setProviderStartNote(message);
    window.setTimeout(() => window.location.reload(), 900);
  }

  async function refreshProviderStatus(auto = false) {
    if (!visualJob && !hasAlternativeJobs && !dedicatedCharacterDialogueRequired) return;
    setPollingNote(auto ? "Refreshing provider status automatically…" : "Refreshing provider status…");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setPollingNote(auth.message);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), isDedicatedPipelineRunning ? 90000 : auto ? 18000 : 30000);
const response = await fetch("/api/automation/status", {
  method: "POST",
  headers: authHeaders(auth.accessToken),
  signal: controller.signal,
  body: JSON.stringify({ production_id: production.id, user_id: auth.user.id, auto })
}).catch(() => null).finally(() => window.clearTimeout(timeout));
if (!response) {
  setPollingNote(auto ? "Automatic status refresh is still waiting for provider response." : "Status refresh timed out. Try Track status again in a moment.");
  return;
}
const data = await response.json().catch(() => ({}));
    const nextStatus = data.renderStatus?.status ?? data.visualStatus?.status ?? data.alternativeStatuses?.[0]?.status ?? "unknown";
    const productionStatus = String(data.production?.status ?? "");
    const generationStatus = String(data.production?.generation_status ?? "");
    const dedicatedI2vStatus = String(data.imageToVideoPoll?.imageToVideoPollStatus ?? data.production?.output_json?.imageToVideoPoll?.imageToVideoPollStatus ?? "");
    const dedicatedI2vReady = Number(data.imageToVideoPoll?.imageToVideoReady ?? data.production?.output_json?.imageToVideoPoll?.imageToVideoReady ?? 0) || 0;
    const dedicatedI2vTotal = Number(data.imageToVideoPoll?.imageToVideoTotal ?? data.production?.output_json?.imageToVideoPoll?.imageToVideoTotal ?? 0) || 0;
    const dedicatedI2vError = String(data.imageToVideoPoll?.imageToVideoErrorSummary ?? data.production?.output_json?.imageToVideoPoll?.imageToVideoErrorSummary ?? "").trim();
    const dedicatedFinalStatus = String(data.finalAssemblyPoll?.finalAssemblyPollStatus ?? data.production?.output_json?.finalAssemblyPoll?.finalAssemblyPollStatus ?? "");
    const finalVideoReady = Boolean(data.finalVideoUrl || data.production?.delivery_link) && productionStatus === "ready";
    const rawVisualPreviewUrl = String(data.rawVisualPreviewUrl ?? data.production?.output_json?.rawVisualPreviewUrl ?? "").trim();
    const finalRenderPending = Boolean(data.renderPending || rawVisualPreviewUrl || /final_render_(pending|started|waiting)|character_dialogue_final_render/.test(generationStatus));

    if (finalVideoReady) {
      setPollingNote("Final video is ready, refreshing page...");
      window.setTimeout(() => window.location.reload(), 800);
      return;
    }

    if (productionStatus === "failed" || nextStatus === "failed" || dedicatedFinalStatus === "failed") {
      setPollingNote("Provider failed, refreshing page...");
      window.setTimeout(() => window.location.reload(), 800);
      return;
    }

    if (dedicatedCharacterDialogueRequired) {
      const dedicatedMessage = dedicatedI2vTotal <= 0
        ? "Dedicated character-dialogue pipeline has not attached stage jobs yet. Press Start Production once to create the character sheets, scene images, voice segments and final assembly plan."
        : dedicatedFinalStatus === "waiting"
          ? "Final assembly is rendering. Status refreshed just now."
          : dedicatedFinalStatus === "missing" && dedicatedI2vStatus === "ready"
            ? "Scene clips are ready. Final assembly will start on the next status refresh."
            : dedicatedI2vStatus === "failed" && dedicatedI2vError
              ? `Image-to-video failed: ${dedicatedI2vError.slice(0, 220)}`
              : dedicatedI2vStatus
                ? `Dedicated pipeline status refreshed: image-to-video ${dedicatedI2vReady}/${dedicatedI2vTotal} scene clips ready (${dedicatedI2vStatus}). Check the live progress counters below for character sheets, scene images, voice segments and final assembly.`
                : "Dedicated pipeline status refreshed. Check the live progress counters below for character sheets, scene images, image-to-video, voice segments and final assembly.";
      setPollingNote(dedicatedMessage);
      if (!auto || dedicatedI2vReady > 0 || dedicatedFinalStatus === "waiting" || dedicatedI2vStatus === "ready") window.setTimeout(() => window.location.reload(), 900);
      return;
    }

    setPollingNote(finalRenderPending
      ? "Visual video is ready. Final voice/subtitle render is still preparing…"
      : `Provider status: ${nextStatus}`);
  }

  useEffect(() => {
    if ((!visualJob && !hasAlternativeJobs && !dedicatedCharacterDialogueRequired) || ["ready", "failed"].includes(String(production.status))) return;
  const firstTimer = window.setTimeout(() => refreshProviderStatus(true), isDedicatedPipelineRunning ? 1000 : 12000);
  const timer = window.setInterval(() => refreshProviderStatus(true), isDedicatedPipelineRunning ? 15000 : 12000);
  return () => { window.clearTimeout(firstTimer); window.clearInterval(timer); };
  }, [production.id, production.status, visualJob?.id, hasAlternativeJobs, dedicatedCharacterDialogueRequired]);

  function primeRevision(part: AssetPart, selectedAction: string) {
    setTargetPart(part.title);
    setAction(selectedAction);
    setMessage(actionPrompt(part, selectedAction));
    setNotice("You can edit and send this revision request.");
  }

  async function submitRevision(event?: React.FormEvent) {
    event?.preventDefault();
    setStatus("loading");
    setNotice("");

    const trimmed = message.trim();
    if (!trimmed) {
      setStatus("error");
      setNotice("Revision request cannot be empty.");
      return;
    }

    const response = await fetch("/api/productions/revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        production_id: production.id,
        user_id: production.user_id,
        target_part: targetPart,
        action,
        message: trimmed
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setNotice(data.error ?? "Revision request could not be saved.");
      return;
    }

    setLocalRevisions((current) => [...current, data.revision]);
    setStatus("success");
    setNotice("Revision request was added to the production queue.");
    setMessage("");
  }

  return (
    <div className="production-workspace-shell">
      <section className="production-workspace-main">
        <div className="production-workspace-head">
          <h1>{production.title || "Production workspace"}</h1>
          <div className="production-top-credit-pill" title={projectPackageReady ? "Credits included in the ready project package" : "Production credit reserve"}>
            <span>{creditLabel}</span>
            <strong>{reservedCreditsText}</strong>
          </div>
        </div>

        <div className={`production-truth-strip ${statusTone}`}>
          <div>
            <small>Production ID</small>
            <strong title={production.id}>{productionIdShort}</strong>
          </div>
          <div>
            <small>Real state</small>
            <strong>{liveStatusLabel}</strong>
          </div>
          <div>
            <small>{creditLabel}</small>
            <strong>{reservedCreditsText}</strong>
          </div>
          <div>
            <small>Preview</small>
            <strong>{hasPreview ? "Available" : "Pending"}</strong>
          </div>
          <div>
            <small>Delivery</small>
            <strong>{hasDelivery ? "Ready" : "Waiting"}</strong>
          </div>
        </div>

        <div className="production-truth-strip" style={{ marginTop: 10 }}>
          <div>
            <small>Provider proof</small>
            <strong>{providerProofProvider || "Missing"}</strong>
          </div>
          <div>
            <small>Provider status</small>
            <strong>{providerProofStatus || "Unknown"}</strong>
          </div>
          <div>
            <small>HeyGen session</small>
            <strong title={heygenSessionId || undefined}>{heygenSessionId ? `${heygenSessionId.slice(0, 8)}...${heygenSessionId.slice(-4)}` : "Not attached"}</strong>
          </div>
          <div>
            <small>HeyGen video</small>
            <strong title={heygenVideoId || undefined}>{heygenVideoId ? `${heygenVideoId.slice(0, 8)}...${heygenVideoId.slice(-4)}` : "Not attached"}</strong>
          </div>
        </div>

        <section className="dynamic-brief-panel" style={{ marginTop: 14 }}>
          <span className="badge">Workflow state</span>
          <h3>{workflowStageLabel(workflowState?.stage ?? liveStatus)}</h3>
          <p>{workflowActions.find((action) => String(action.status) === "available")?.label ?? workflowActions.find((action) => String(action.status) === "blocked")?.reason ?? nextLiveStep}</p>
          <div className="production-context-grid">
            <div><span>{projectPackageReady ? "Package credits" : "Credit reserve"}</span><strong>{Number(workflowState?.reservedCredits ?? production.reserved_credits ?? production.estimated_credits ?? 0).toLocaleString()}</strong><small>{projectPackageReady ? "Included in ready package" : workflowState?.hasReservedCredits ? "Reserved" : "Not fully reserved"}</small></div>
            <div><span>Provider</span><strong>{workflowState?.activeProviderJob ? "Active job" : String((workflowProviderReadiness?.status ?? workflowProviderReadiness?.readinessStatus ?? providerStatus) || "Pending")}</strong><small>{production.automation_status ?? production.generation_status ?? "Waiting for automation"}</small></div>
            <div><span>Delivery</span><strong>{workflowState?.deliveryReady || hasDelivery ? "Ready" : "Waiting"}</strong><small>{deliveryRequirementFormats.length ? deliveryRequirementFormats.join(", ") : "Dashboard delivery"}</small></div>
            <div><span>Revision flow</span><strong>{workflowActions.find((action) => action.key === "revision_flow")?.status ?? (isReady ? "available" : "pending")}</strong><small>{revisions.length ? `${revisions.length} request(s)` : "No revision request"}</small></div>
          </div>
          {workflowActions.length > 0 ? (
            <div className="provider-job-list" style={{ marginTop: 10 }}>
              {workflowActions.map((action) => (
                <div className={`provider-job-chip ${workflowActionTone(action.status)}`} key={`${production.id}-workflow-${String(action.key ?? action.label)}`}>
                  <strong>{String(action.label ?? action.key ?? "Workflow action")}</strong>
                  <span>{String(action.status ?? "pending")}</span>
                  {action.reason ? <small>{action.reason}</small> : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {liveProductionCards.length ? (
          <section className="live-production-card-panel">
            <div>
              <span className="badge">Live production cards</span>
              <h3>Selected features before production start</h3>
              <p>These are the options the user selected before starting production. They are carried into preview, delivery ZIP, README and revision flow.</p>
            </div>
            <div className="live-production-card-grid">
              {liveProductionCards.map((card) => <article key={card}><strong>{`${card} — ${projectPackageReady ? "Ready" : dedicatedCharacterDialogueRequired && !hasDedicatedCharacterDialogueJobs ? "Dedicated pipeline not started" : providerJobMissingWhileRunning ? "Provider job missing" : hasDedicatedCharacterDialogueJobs ? "Dedicated pipeline running" : isProviderRunning ? "Producing" : "Queued"}`}</strong></article>)}
            </div>
          </section>
        ) : null}

        {isFailed ? <div className="production-error-banner"><strong>Production needs attention.</strong><span>{production.error_message || String(outputJson.providerError ?? "Provider or automation failed. Admin review is required before final delivery or credit resolution.")}</span></div> : null}

        {agentAction ? (
          <div className="production-agent-action-card">
            <div>
              <span className="badge">Agent action</span>
              <h3>{String(agentAction.name ?? "create_production")}</h3>
              <p>This record was created from a confirmed assistant action. The assistant prepared the action first; real production started only after confirmation and credit checks.</p>
            </div>
            <div className="production-agent-action-grid">
              <span><small>Intent</small><strong>{String(agentAction.intent ?? "confirmed_production")}</strong></span>
              <span><small>Type</small><strong>{String(agentAction.production_type ?? production.production_type ?? "production")}</strong></span>
              <span><small>Provider route</small><strong>{String(agentAction.provider_route ?? agentProviderRoutePlan?.providerRoute ?? "auto")}</strong></span>
              <span><small>Provider category</small><strong>{String(agentProviderRoutePlan?.providerCategory ?? "general")}</strong></span>
              <span><small>Readiness</small><strong>{String(agentProviderRoutePlan?.readinessStatus ?? "pending")}</strong></span>
              <span><small>Endpoint</small><strong>{String(agentAction.next_backend_endpoint ?? "/api/productions")}</strong></span>
            </div>
          </div>
        ) : null}

        <div className="production-live-summary">
          <div>
            <span className="badge">Live status</span>
            <h2>{liveStatusLabel}</h2>
            <p>{nextLiveStep}</p>
          </div>
          <div className="production-live-steps">
            {liveSteps.map((step, index) => (
              <span className={step.active ? "active" : ""} key={step.label}><b>{index + 1}</b>{step.label}</span>
            ))}
          </div>
        </div>

        <div className="production-context-grid">
          <div><span>Production type</span><strong>{type}</strong></div>
          <div><span>Status</span><strong>{liveStatus}</strong></div>
          <div><span>Credits</span><strong>{production.estimated_credits?.toLocaleString() ?? "-"}</strong></div>
          <div><span>Provider risk</span><strong>{String(outputPlan.providerRiskLevel ?? "low")}</strong></div>
          <div><span>Country / city</span><strong>{[audience.targetCountry, audience.targetCity].filter(Boolean).join(" / ") || "To be defined"}</strong></div>
        </div>

        {needsApproval ? (
          <section className="cost-safety-card production-decision-card production-approval-card">
            <span className="badge">Member decision required</span>
            <h3>Choose how this production should continue</h3>
            <p>{production.approval_question}</p>
            <div className="production-decision-options">
              {approvalOptions.map((option) => (
                <button className="btn secondary" type="button" key={option.label} onClick={() => submitApproval(option)} disabled={approvalLoading === option.label}>
                  <strong>{approvalLoading === option.label ? "Saving..." : option.label}</strong>
                  {option.description ? <span>{option.description}</span> : null}
                  {option.extraCredits ? <small>+{option.extraCredits.toLocaleString()} credits reserved</small> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {isQueuedForRenderSlot ? (
          <section className="cost-safety-card">
            <span className="badge">Render queue</span>
            <h3>Queued for the next safe provider slot</h3>
            <p>{queueUserMessage || "Your production is waiting for an available video provider slot. You can leave this page; we will email you when it is ready."}</p>
            <div className="cost-note-list">
              {renderQueuePolicy?.label ? <span>Queue tier: {String(renderQueuePolicy.label)}</span> : null}
              {renderQueuePolicy?.userBenefit ? <span>Benefit: {String(renderQueuePolicy.userBenefit)}</span> : null}
              {queueStatus ? <span>Queue status: {queueStatus}</span> : null}
              {Number.isFinite(activeVideoJobs) && Number.isFinite(activeJobLimit) ? <span>Active video jobs: {activeVideoJobs} / {activeJobLimit}</span> : null}
              {capacityPolicy?.activeVideoJobs ? <span>{String(capacityPolicy.activeVideoJobs)}</span> : null}
            </div>
          </section>
        ) : null}

        {projectWorkflow || commerceWorkflow || publishTargets.length > 0 ? (
          <section className="cost-safety-card">
            <span className="badge">Project delivery plan</span>
            <h3>Web, app, and store production details</h3>
            <div className="cost-note-list">
              {projectWorkflow?.modules ? <span>Modules: {String(projectWorkflow.modules)}</span> : null}
              {projectWorkflow?.technicalStack ? <span>Technical stack: {String(projectWorkflow.technicalStack)}</span> : null}
              {projectWorkflow?.sourceDelivery ? <span>Source delivery: {String(projectWorkflow.sourceDelivery)}</span> : null}
              {commerceWorkflow?.storePlatform ? <span>Store platform: {String(commerceWorkflow.storePlatform)}</span> : null}
              {commerceWorkflow?.storeAssetGoal ? <span>E-commerce goal: {String(commerceWorkflow.storeAssetGoal)}</span> : null}
              {commerceWorkflow?.connectedStoreTargets ? <span>Connected store target: {String(commerceWorkflow.connectedStoreTargets)}</span> : null}
              {publishTargets.length > 0 ? <span>Delivery/platform: {publishTargets.join(", ")}</span> : null}
            </div>
          </section>
        ) : null}

        {dedicatedCharacterDialogueRequired ? (
          <section className="cost-safety-card provider-missing-card">
            <span className="badge">Dedicated pipeline required</span>
            <h3>Character-dialogue animation needs a controlled production pipeline</h3>
            <p>{String(outputJson.blockedReason ?? "This request needs locked character sheets, per-character voices, lip-sync, and scene-by-scene continuity before a reliable final MP4 can be produced.")}</p>
            <div className="manual-delivery-path">
              <strong>Generic prompt-to-video was intentionally blocked.</strong>
              <span>This prevents inconsistent characters, mismatched styles, broken lip-sync, and cut-off dialogue from being delivered again.</span>
              <span>The production brief is saved. The next step is to connect the dedicated character-dialogue pipeline providers.</span>
            </div>
            <div className="production-waiting-stage-grid" aria-label="Dedicated character-dialogue pipeline stages">
              {["Character bible", "Character sheets", "Scene storyboard", "Per-character voices", "Lip-sync", "Final assembly"].map((stage, index) => (
                <span key={`character-dialogue-stage-${stage}`} className={index === 0 ? "ready" : index <= 2 ? "active" : "pending"}>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <b>{stage}</b>
                </span>
              ))}
            </div>
            {characterDialogueCharacters.length ? (
              <div className="workflow-step-grid">
                {characterDialogueCharacters.slice(0, 8).map((character) => <span key={`character-${String(character.id)}`}><small>{String(character.role ?? "character")}</small><strong>{String(character.name ?? character.id)}</strong></span>)}
              </div>
            ) : null}
            {characterDialogueScenes.length ? <p className="provider-poll-note">Planned storyboard: {characterDialogueScenes.length} scenes · Dialogue cues: {characterDialogueTimeline.length}</p> : null}
            {dedicatedProgressItems.length ? (
              <div className="workflow-step-grid" aria-label="Live dedicated pipeline progress">
                {dedicatedProgressItems.map((item) => (
                  <span key={`dedicated-progress-${item.label}`} className={item.total > 0 && item.ready >= item.total ? "ready" : item.ready > 0 ? "active" : "pending"}>
                    <small>{item.ready}/{item.total || "?"}</small>
                    <strong>{item.label}</strong>
                    {item.note ? <small>{item.note}</small> : null}
                  </span>
                ))}
              </div>
            ) : null}
            {failedCharacterDialogueJobs.length ? <p className="provider-poll-note provider-start-note">Dedicated pipeline needs attention: {failedCharacterDialogueJobs.slice(0, 2).map((job) => String(job.error ?? job.providerStatus ?? job.inputRef ?? job.id)).join(" | ")}</p> : null}
            {readyCharacterSheets.length ? (
              <div className="cost-note-list">
                {readyCharacterSheets.map((job) => <a href={String(job.imageUrl)} target="_blank" key={`ready-sheet-${String(job.id)}`}>Open {String(job.inputRef)} character sheet</a>)}
              </div>
            ) : null}
            {readySceneImages.length ? (
              <div className="cost-note-list">
                {readySceneImages.map((job) => <a href={String(job.imageUrl)} target="_blank" key={`ready-scene-${String(job.id)}`}>Open {String(job.inputRef)} scene image</a>)}
              </div>
            ) : null}
            {startedI2vJobs.length ? <p className="provider-poll-note">Image-to-video jobs started: {startedI2vJobs.length}. Use provider status refresh after the external video jobs complete.</p> : null}
            {readySceneClips.length ? (
              <div className="cost-note-list">
                {readySceneClips.map((job) => <a href={String(job.outputUrl)} target="_blank" key={`ready-clip-${String(job.id)}`}>Open {String(job.inputRef)} video clip</a>)}
              </div>
            ) : null}
            {readyVoiceSegments.length ? (
              <div className="cost-note-list">
                {readyVoiceSegments.map((job) => <a href={String(job.audioUrl)} target="_blank" key={`ready-voice-${String(job.id)}`}>Listen {String(job.speaker ?? job.inputRef)} voice segment</a>)}
              </div>
            ) : null}
            {characterDialogueProviderJobs.length ? (
              <div className="provider-job-list realtime-production-timeline" aria-label="Dedicated provider job plan">
                {characterDialogueProviderJobs.slice(0, 12).map((job) => (
                  <div className={`provider-job-chip ${String(job.status) === "planned" ? "unknown" : String(job.status) === "waiting_provider" ? "active" : String(job.status)}`} key={`character-dialogue-job-${String(job.id)}`}>
                    <strong>{String(job.stage ?? "pipeline step").replaceAll("_", " ")}</strong>
                    <span>{String(job.provider ?? "provider pending")}</span>
                    <small>{String(job.description ?? job.outputRole ?? "Planned pipeline job")}</small>
                  </div>
                ))}
              </div>
            ) : null}
            {characterDialogueCapabilities.length ? <div className="cost-note-list">{characterDialogueCapabilities.map((capability) => <span key={`capability-${capability}`}>{capability.replaceAll("_", " ")}</span>)}</div> : null}
          </section>
        ) : null}

        {costNotes.length > 0 || creditResolution ? (
          <section className="cost-safety-card">
            <span className="badge">Credit safety</span>
            <h3>{creditResolution ? creditResolutionTitle : "Reservation calculation"}</h3>
            {creditResolution ? <p className="workspace-action-note error">{String(creditResolution.instruction ?? "Provider failed; credit resolution is waiting for admin review.")}</p> : null}
            <div className="cost-note-list">{costNotes.map((note: unknown, index: number) => <span key={`${String(note)}-${index}`}>{String(note)}</span>)}</div>
          </section>
        ) : null}

        <section className={`customer-preview-theater preview-mode-${previewMode}`}>
          <div className="customer-preview-toolbar">
            <div>
              <span className="badge">{isProjectProduction ? "Preview device" : "Preview size"}</span>
              <strong>{previewToolbarTitle}</strong>
            </div>
            <div className="customer-preview-mode-actions" aria-label="Preview size controls">
              {(["normal", "compact", "shorts"] as const).map((mode) => (
                <button className={previewMode === mode ? "active" : ""} type="button" key={mode} onClick={() => setPreviewMode(mode)}>
                  {previewModeLabels[mode]}
                </button>
              ))}
            </div>
            <div className="customer-preview-top-actions" aria-label="Preview delivery actions">
              {playbackUrl ? <a className="btn" href={playbackUrl} target="_blank"><PlayCircle size={14} /> {isProjectProduction ? "Open preview" : "Open final video"}</a> : <button className="btn" type="button" disabled><PlayCircle size={14} /> Preview</button>}
              {deliveryUrl ? <a className="btn secondary" href={mediaDownloadUrl} download><Download size={14} /> {isProjectProduction ? "Manifest" : "Download MP4"}</a> : <button className="btn secondary" type="button" disabled><Download size={14} /> ZIP</button>}
              {sourceUrl ? <a className="btn secondary" href={sourceUrl} target="_blank"><ExternalLink size={14} /> Source</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={14} /> Source</button>}
              {readmeUrl ? <a className="btn secondary" href={readmeUrl} target="_blank"><ExternalLink size={14} /> Setup</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={14} /> Setup</button>}
              <button className="btn secondary" type="button" onClick={() => { setTargetPart("Final delivery"); setAction("Request revision"); setMessage("I want to request a revision for the final delivery package."); setNotice("Revision request is ready below. Add details and send it."); }}>Revision</button>
              {canCancel ? <button className="btn secondary" type="button" onClick={cancelProduction} disabled={cancelLoading}>{cancelLoading ? "Cancelling..." : "Cancel"}</button> : null}
              <button className="btn" style={{ fontWeight: 800 }} type="button" onClick={() => isDedicatedPipelineRunning ? (setPollingNote("Checking dedicated pipeline status..."), refreshProviderStatus(false)) : restartProviderJob()} disabled={startButtonDisabled}>{startButtonLabel}</button>
            </div>
          </div>
          {(!isReady && (isDedicatedPipelineRunning || providerStartNote || pollingNote)) ? <div className="customer-preview-status-strip">{isDedicatedPipelineRunning ? "Production is running automatically. The video player will unlock here when the final MP4 is ready." : pollingNote || providerStartNote}</div> : null}
          <div className="customer-preview-screen">
            {previewKind === "video" ? (
              <video src={playbackUrl} controls playsInline poster="" />
            ) : previewKind === "image" ? (
              <img src={previewUrl} alt={isProjectProduction ? "Crelavo customer project preview image" : "Crelavo generated production preview image"} />
            ) : previewKind === "web" && isProjectProduction ? (
              <div className="customer-preview-placeholder project-preview-safe-card">
                <div className="customer-preview-brand-mark"><span>C</span><strong>Crelavo</strong></div>
                <Globe2 size={38} />
                <span className="badge">Project package preview</span>
                <h3>{String(projectPackage?.title ?? production.title ?? "Website / app package")}</h3>
                <p>{String(projectPackage?.brief ?? production.prompt ?? "Project brief and delivery package are ready for review.")}</p>
                <div className="project-package-summary-list">
                  <p>{`Stack: ${String(projectPackage?.stack ?? "Next.js / app source package")}`}</p>
                  <p>{`Modules: ${String(projectPackage?.modules ?? "Pages, screens and delivery guide")}`}</p>
                  <p>{`Status: ${String(projectPackage?.deliveryStatus ?? "ready_for_customer_review")}`}</p>
                  <p>{`Package type: ${projectImplementationStatus}`}</p>
                </div>
              </div>
            ) : previewKind === "web" ? (
              <iframe src={previewUrl} title="Production preview" loading="lazy" />
            ) : (
              <div className={`customer-preview-placeholder production-waiting-room${isDedicatedPipelineRunning ? " video-player-waiting" : ""}`}>
                {isDedicatedPipelineRunning ? <div className="video-player-waiting-frame">
                  <div className="video-player-waiting-spinner" />
                  <PlayCircle size={54} />
                  <h3>Video is being generated</h3>
                  <p>The final MP4 will start playing here automatically when it is ready.</p>
                  <span>Character sheets → scene images → image-to-video → voices → subtitles → final MP4</span>
                </div> : <>
                <div className="customer-preview-brand-mark"><span>C</span><strong>Crelavo</strong></div>
                <PlayCircle size={44} />
                <span className="badge">{waitingRoom.statusHint}</span>
                <h3>{waitingRoom.headline}</h3>
                <p>{waitingRoom.description}</p>
                <div className="production-waiting-meta">
                  <strong>Estimated delivery window</strong>
                  <span>{waitingRoom.estimated}</span>
                </div>
                <div className="production-waiting-stage-grid" aria-label="Production pipeline stages">
                  {waitingRoom.stages.map((stage, index) => (
                    <span key={`waiting-stage-${stage}-${index}`} className={index === 0 ? "ready" : index <= 3 ? "active" : "pending"}>
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <b>{stage}</b>
                    </span>
                  ))}
                </div>
                <p className="production-waiting-assurance">You can safely leave or refresh this page. Production will continue in the background. When the output is ready, we will send a completion email to your account and unlock download and revision options automatically.</p>
                </>}
              </div>
            )}
          </div>
          <aside className="customer-preview-control">
            <span className="badge">{isProjectProduction ? "Customer project preview" : "Customer preview / playback"}</span>
            <h3>{previewUrl ? "Preview is ready to review" : "Waiting for preview output"}</h3>
            <p>{nextLiveStep}</p>
            {providerProgress !== null ? (
              <div className="customer-progress-meter">
                <div><span>Realtime production progress</span><strong>{providerProgress}%</strong></div>
                <progress value={providerProgress} max={100} />
              </div>
            ) : null}
            <div className="provider-job-list realtime-production-timeline" aria-label="Realtime production timeline">
              {realtimeProgressSteps.map((step) => (
                <div className={`provider-job-chip ${step.status === "done" ? "ready" : step.status === "running" ? "active" : step.status === "blocked" ? "failed" : "unknown"}`} key={`progress-${step.key}`}>
                  <strong>{step.label}</strong>
                  <span>{step.status}</span>
                  <small>{step.detail}</small>
                </div>
              ))}
            </div>
            {providerStatus ? <p className="provider-poll-note">Provider status: {providerStatus}</p> : null}
            <div className="customer-delivery-files delivery-command-center">
              <div className="delivery-command-head">
                <div>
                  <span className="badge">Delivery command center</span>
                  <strong>Final package readiness</strong>
                </div>
                <small>{hasDelivery ? "Ready for customer handoff" : hasPreview ? "Preview ready, final package pending" : "Preparing preview and delivery"}</small>
              </div>
              <div className="delivery-readiness-grid">
                <span className={previewUrl ? "ready" : "pending"}>Preview link <b>{previewUrl ? "Ready" : "Pending"}</b></span>
                <span className={deliveryUrl ? "ready" : "pending"}>Final ZIP / delivery <b>{deliveryUrl ? "Ready" : "Waiting"}</b></span>
                <span className={sourceUrl ? "ready" : deliveryRequirementFormats.includes("source_code") ? "requested" : "pending"}>Source files <b>{sourceUrl ? "Ready" : deliveryRequirementFormats.includes("source_code") ? "Requested" : "Optional"}</b></span>
                <span className={readmeUrl ? "ready" : deliveryRequirementFormats.includes("readme") ? "requested" : "pending"}>README / setup <b>{readmeUrl ? "Ready" : deliveryRequirementFormats.includes("readme") ? "Requested" : "Optional"}</b></span>
                <span className={deliveryRequirementFormats.length ? "requested" : "pending"}>Export formats <b>{deliveryRequirementFormats.length ? deliveryRequirementFormats.join(", ") : "Standard"}</b></span>
                <span className={revisions.length ? "requested" : "pending"}>Revision path <b>{revisions.length ? `${revisions.length} request${revisions.length > 1 ? "s" : ""}` : "Available"}</b></span>
              </div>
            </div>
            <div className="customer-preview-actions delivery-action-grid">
              {playbackUrl ? <a className="btn" href={playbackUrl} target="_blank"><PlayCircle size={15} /> {isProjectProduction ? "Open preview" : "Open final video"}</a> : <button className="btn" type="button" disabled><PlayCircle size={15} /> Preview pending</button>}
              {deliveryUrl ? <a className="btn secondary" href={mediaDownloadUrl} download><Download size={15} /> {isProjectProduction ? "Manifest / package" : "Download MP4"}</a> : <button className="btn secondary" type="button" disabled><Download size={15} /> Final ZIP waiting</button>}
              {sourceUrl ? <a className="btn secondary" href={sourceUrl} target="_blank"><ExternalLink size={15} /> Source files</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={15} /> Source pending</button>}
              {readmeUrl ? <a className="btn secondary" href={readmeUrl} target="_blank"><ExternalLink size={15} /> README / setup</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={15} /> README pending</button>}
              {voiceAudioUrl ? <a className="btn secondary" href={voiceAudioUrl} target="_blank"><Mic2 size={15} /> Listen to voice</a> : null}
              <button className="btn secondary" type="button" onClick={() => { setTargetPart("Final delivery"); setAction("Request revision"); setMessage("I want to request a revision for the final delivery package."); setNotice("Revision request is ready below. Add details and send it."); }}>Request revision</button>
              {canCancel ? <button className="btn secondary" type="button" onClick={cancelProduction} disabled={cancelLoading}>{cancelLoading ? "Cancelling..." : "Cancel production"}</button> : null}
              {visualJob || hasAlternativeJobs || dedicatedCharacterDialogueRequired ? <button className="btn secondary" type="button" onClick={() => { setPollingNote("Checking provider status..."); refreshProviderStatus(false); }}>Refresh provider status</button> : null}
              <button className="btn" style={{ fontWeight: 800 }} type="button" onClick={() => isDedicatedPipelineRunning ? (setPollingNote("Checking dedicated pipeline status..."), refreshProviderStatus(false)) : restartProviderJob()} disabled={startButtonDisabled}>{startButtonLabel}</button>
            </div>
            {providerTestMode ? <p className="provider-poll-note">Quick provider test: 5 sec / 720p / single output.</p> : null}
{providerPreflight ? <p className="provider-poll-note">Preflight: {isProjectProduction ? `${String(providerPreflight.provider)} · ${String(providerPreflight.model)} · ${String(providerPreflight.aspectRatio)}` : `${String(providerPreflight.provider)} · ${String(providerPreflight.model)} · ${String(providerPreflight.durationSeconds)} sec · ${String(providerPreflight.aspectRatio)}`}</p> : null}
{visualJobs.length ? <div className="workflow-step-grid">{visualJobs.map((job, index) => <span key={`${String(job.id ?? index)}`}><small>Scene {index + 1}</small><strong>{String(job.status ?? "queued")}</strong></span>)}</div> : null}
{visualJob ? <p className="provider-job-note">Provider job: {String(visualJob.provider)} · {String(visualJob.status)} · {String(visualJob.id ?? "waiting for id")} {providerStatus ? `· ${providerStatus}` : ""}</p> : null}
{heygenSessionId || heygenVideoId ? <p className="provider-job-note">HeyGen proof: session {heygenSessionId || "pending"}{heygenVideoId ? ` · video ${heygenVideoId}` : ""}</p> : null}
{providerJobMissingWhileRunning ? <p className="provider-poll-note provider-start-note">Production is marked running, but no provider job is attached yet. Press Start Production once to attach the video provider job.</p> : null}
            {providerStartNote ? <p className="provider-poll-note provider-start-note">{providerStartNote}</p> : null}
            {pollingNote ? <p className="provider-poll-note">{pollingNote}</p> : null}
          </aside>
        </section>

        {outputRegistry.length > 0 ? (
          <section className="cost-safety-card">
            <span className="badge">Output registry</span>
            <h3>Expected and generated delivery files</h3>
            <p>Each requested output is tracked with a delivery role, status and download route when available.</p>
            <div className="cost-note-list">
              {outputRegistry.map((item) => <span key={`output-${String(item.id)}`}>{String(item.filename)}: {String(item.status)}</span>)}
            </div>
          </section>
        ) : null}

        {creativeActivityCards.length > 0 ? (
          <section className="automation-brief-card">
            <span className="badge">Creative director live board</span>
            <h3>Assistant is shaping the video like a creative director</h3>
            <p>These cards mirror the right-side live activity style: concept, presenter direction, hook, A-roll, B-roll and provider status.</p>
            <div className="automation-part-list">
              {creativeActivityCards.map((card, index) => (
                <div key={`${card.title}-${index}`}>
                  <strong>{card.title}</strong>
                  <small>{String(card.status)}</small>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {providerReadiness ? (
          <section className={`cost-safety-card ${String(providerReadiness.status) === "waiting_provider_config" ? "provider-missing-card" : ""}`}>
            <span className="badge">Provider readiness</span>
            <h3>{String(providerReadiness.status ?? "provider status")}</h3>
            <p>{String(providerReadiness.userMessage ?? "Provider/API readiness is being checked before real production starts.")}</p>
            {String(providerReadiness.status) === "waiting_provider_config" ? (
              <div className="manual-delivery-path">
                <strong>Production record is saved. Real provider execution is paused.</strong>
                <span>Nothing is lost: the brief, credits, package settings and delivery requirements are stored in this workspace.</span>
                <span>Until provider keys are connected, admin can prepare demo/manual delivery files and attach preview, ZIP, source files or README links here.</span>
                <span>When provider keys are ready, use “Start real provider job” to continue from this same production record.</span>
              </div>
            ) : null}
            <div className="cost-note-list">
              {providerRequirements.map((item) => <span key={`provider-${String(item.key)}`}>{String(item.label)}: {String(item.status)}</span>)}
            </div>
          </section>
        ) : null}

        {deliveryRequirements ? (
          <section className="cost-safety-card">
            <span className="badge">Requested delivery requirements</span>
            <h3>Customer-selected files and package outputs</h3>
            <p>These requirements came from the Assistant Workspace wizard and should be satisfied by the final delivery package.</p>
            <div className="cost-note-list">
              <span>Status: {String(deliveryRequirements.status ?? "pending")}</span>
              {deliveryRequirementFormats.map((format) => <span key={`delivery-format-${format}`}>Requested: {format}</span>)}
              {deliveryRequirements.wantsAdminPanel ? <span>Admin panel required</span> : null}
              {deliveryRequirements.wantsSourceCode ? <span>Source code required</span> : null}
              {deliveryRequirements.wantsZip ? <span>ZIP package required</span> : null}
              {deliveryRequirements.wantsReadme ? <span>README required</span> : null}
              {deliveryRequirements.wantsFinalVideo ? <span>Final video required</span> : null}
              {deliveryRequirements.wantsPdf ? <span>PDF required</span> : null}
            </div>
          </section>
        ) : null}

        {deliveryPackage ? (
          <section className="cost-safety-card">
            <span className="badge">Final delivery package</span>
            <h3>{String(deliveryPackage.standard ?? "Delivery standard")}</h3>
            <p>{String(deliveryPackage.userPromise ?? "Final files will be delivered through the dashboard.")}</p>
            <div className="cost-note-list">
              {deliveryRequiredItems.map((item) => <span key={`required-${item}`}>Required: {item}</span>)}
              {deliveryOptionalItems.slice(0, 6).map((item) => <span key={`optional-${item}`}>Optional: {item}</span>)}
              {deliveryFormats.length > 0 ? <span>Formats: {deliveryFormats.join(", ")}</span> : null}
            </div>
          </section>
        ) : null}

        {automationScript || automationParts.length > 0 ? (
          <section className="automation-brief-card">
            <span className="badge">Automation output</span>
            <h3>Script, part plan, and production direction are ready</h3>
            {automationScript ? <pre>{automationScript}</pre> : null}
            {automationParts.length > 0 ? (
              <div className="automation-part-list">
                {automationParts.map((part: Record<string, any>, index: number) => (
                  <div key={String(part.id ?? index)}>
                    <strong>{String(part.title ?? `Part ${index + 1}`)}</strong>
                    <small>{String(part.status ?? "queued")}</small>
                    <p>{String(part.description ?? "Automation part has been prepared.")}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {voiceJobs.length > 0 ? (
          <section className="voice-job-card">
            <span className="badge">Voice-over revisions</span>
            <h3>Recordings generated with approved Crelavo voices</h3>
            <div className="voice-job-list">
              {voiceJobs.slice(-4).reverse().map((job: Record<string, any>, index: number) => {
                const audioUrl = String(job.audioUrl ?? "");
                const voice = job.voice && typeof job.voice === "object" ? job.voice as Record<string, any> : null;
                return (
                  <div key={String(job.id ?? index)}>
                    <strong>{voice ? String(voice.title ?? "Crelavo voice") : "Crelavo voice"}</strong>
                    <small>{String(job.status ?? "queued")}</small>
                    <p>{String(job.message ?? "Voice revision requested.")}</p>
                    {audioUrl ? <a className="btn secondary" href={audioUrl} target="_blank"><Mic2 size={15} /> Listen</a> : null}
                    {job.providerError ? <p className="workspace-action-note error">{String(job.providerError)}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="workspace-alternatives-card">
          <div>
            <span className="badge">Options and alternatives</span>
            <h3>{isProjectProduction ? "Project alternatives appear here" : "User alternatives appear here"}</h3>
            <p>{isProjectProduction ? "As the engine prepares page layouts, modules, dashboard variants, and source package options, these cards fill with real preview links. The user can choose one or request revisions." : "As the engine generates different hooks, voices, scenes, colors, formats, or delivery variations, these cards fill with real preview links. The user can choose one or request revisions one by one."}</p>
            {selectedAlternative ? <p className="selected-alternative-note">Selected alternative: {selectedAlternative}</p> : null}
          </div>
          {pendingOutputActions.length > 0 ? (
            <div className="pending-output-actions">
              {pendingOutputActions.slice(-4).map((item: Record<string, any>, index: number) => (
                <span key={String(item.id ?? index)}>{String(item.targetPart ?? "Production")} · {String(item.action ?? "Revision")} · {String(item.status ?? "queued")}</span>
              ))}
            </div>
          ) : null}
          <div className="workspace-alternative-grid">
            {alternatives.map((alternative: Record<string, any>, index: number) => {
              const altTitle = String(alternative.title ?? alternative.name ?? `Alternative ${index + 1}`);
              const altStatus = String(alternative.status ?? "Preparing");
              const altDescription = String(alternative.description ?? alternative.notes ?? "Preview and selection actions become active when this variation is ready.");
              const altPreview = String(alternative.preview_url ?? alternative.previewUrl ?? alternative.url ?? "");
              return (
                <article className={alternative.selected ? "workspace-alternative-card selected" : "workspace-alternative-card"} key={String(alternative.id ?? altTitle)}>
                  <div className="alternative-preview-box">
                    <PlayCircle size={24} />
                    <span>{altPreview ? "Preview ready" : "Preview pending"}</span>
                  </div>
                  <div>
                    <small>{altStatus}</small>
                    <h4>{altTitle}</h4>
                    <p>{altDescription}</p>
                    {alternative.visualJob ? <p className="provider-job-note">Revision provider job: {String(alternative.visualJob.provider)} · {String(alternative.visualJob.status)} · {String(alternative.visualJob.id ?? "waiting for id")}</p> : null}
                    {alternative.providerNote ? <p className="provider-poll-note">{String(alternative.providerNote)}</p> : null}
                    {alternative.providerError ? <p className="workspace-action-note error">{String(alternative.providerError)}</p> : null}
                    <div className="production-part-actions">
                      {altPreview ? <a className="btn secondary" href={altPreview} target="_blank">Preview</a> : <button className="btn secondary" type="button" disabled>Pending</button>}
                      <button className="btn secondary" type="button" onClick={() => { setTargetPart(altTitle); setAction("Select this alternative"); setMessage(`${altTitle} should be selected and used as the final production direction.`); }}>Select this</button>
                      <button className="btn secondary" type="button" onClick={() => { setTargetPart(altTitle); setAction("Revise alternative"); setMessage(`What I want to change in ${altTitle}: `); }}>Revise</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="local-context-card">
          <Globe2 size={20} />
          <div>
            <h3>{isProjectProduction ? "Project localization and product context" : "Production by country, city, and culture"}</h3>
            <p>{isProjectProduction ? "The assistant applies business context, language, project modules, user roles, admin permissions, content structure, and delivery requirements to the project package." : "The assistant applies language, city, culture, tradition, location, clothing, music, subtitles, and target platform decisions to every production part. If the user says the environment, outfit, or music does not fit, the related part is revised."}</p>
          </div>
        </section>

        <section className="workspace-material-card">
          <LibraryBig size={20} />
          <div>
            <span className="badge">Crelavo material products</span>
            <h3>No external material, only the platform library</h3>
            <p>User uploads are not used in this production. Selected products, scenes, templates, or brand assets come from the safe material catalog provided by Crelavo/admin.</p>
            {materials.length > 0 ? (
              <div className="workspace-material-list">
                {materials.map((material) => (
                  <div key={String(material.id ?? material.title)}>
                    <strong>{String(material.title ?? "Crelavo material")}</strong>
                    <small>{String(material.category ?? "Platform material")}</small>
                  </div>
                ))}
              </div>
            ) : <p className="workspace-empty-note">No Crelavo material has been selected for this request yet. Use the revision area to ask for a product from the Crelavo library.</p>}
          </div>
        </section>

        <div className="production-part-grid">
          {parts.map((part) => {
            const Icon = iconMap[part.type];
            return (
              <article className="production-part-card" key={part.title}>
                <div className="production-part-preview">
                  <Icon size={30} />
                  <span>{part.type === "audio" || part.type === "voice" ? "Audio player" : part.type === "video" || part.type === "final" ? "Video preview" : "Asset preview"}</span>
                </div>
                <div className="production-part-body">
                  <span className="badge">{part.status}</span>
                  <h3>{part.title}</h3>
                  <p>{part.description}</p>
                  <div className="production-part-actions">
                    {part.actions.map((partAction) => <button className="btn secondary" type="button" key={partAction} onClick={() => primeRevision(part, partAction)}>{partAction}</button>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="production-workspace-side">
        <div className="production-job-overview-card">
          <span className="badge">Job control</span>
          <h2>Production status</h2>
          <div className="production-job-status-list">
            <span><small>Status</small><strong>{liveStatus}</strong></span>
            <span><small>Credits reserved</small><strong>{production.estimated_credits?.toLocaleString() ?? "-"}</strong></span>
            <span><small>Provider</small><strong>{providerStatus || (isWaitingProviderConfig ? "Provider pending" : "Auto routing")}</strong></span>
            <span><small>Delivery</small><strong>{hasDelivery ? "Final ready" : hasPreview ? "Preview ready" : "Preparing"}</strong></span>
          </div>
          <p>{hasDelivery ? "Final files are ready for customer handoff." : hasPreview ? "Preview is ready; final delivery is still being prepared." : "Production is active or waiting for provider output."}</p>
        </div>

        <div className="revision-history-card">
          <form className="revision-inline-form" onSubmit={submitRevision}>
            <h2>Revizyon isteği yaz</h2>
            <p>Bu kutu her zaman görünür. Videoda ne değişsin istiyorsan buraya yaz.</p>
            <div className="revision-target-grid">
              <label className="revision-field"><span>Hedef bölüm</span><input aria-label="Hedef bölüm" placeholder="Final MP4" value={targetPart} onChange={(event) => setTargetPart(event.target.value)} /></label>
              <label className="revision-field"><span>İşlem başlığı</span><input aria-label="İşlem başlığı" placeholder="Sesi düzelt ve ofis insanlarını kaldır" value={action} onChange={(event) => setAction(event.target.value)} /></label>
            </div>
            <label className="revision-message-field">
              <span>Revizyon isteği</span>
              <textarea aria-label="Revizyon isteği" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Revizyon isteğini buraya yaz..." />
            </label>
            <button className="btn" disabled={status === "loading"} type="submit"><Pencil size={15} /> {status === "loading" ? "Kaydediliyor..." : "Revizyon isteğini gönder"}</button>
            {notice ? <p className={`workspace-action-note ${status === "error" ? "error" : ""}`}>{notice}</p> : null}
          </form>
          <h2>{isReady || hasPreview ? "Revizyon geçmişi" : "Üretim aktivitesi"}</h2>
          {revisions.length > 0 ? (
            <div className="revision-history-list">
              {revisions.slice(-5).reverse().map((revision, index) => (
                <div key={revision.id ?? `${revision.requestedAt}-${index}`}>
                  <strong>{revision.targetPart || "General production"}</strong>
                  <span>{String(revision.action || "Revision").replace(/\s*·\s*(queued|already_running|payment_or_credit_required|provider_failed|provider_job_created)\b/gi, "")} · {String(revision.status ?? "queued").includes("provider_job_created") ? "provider_job_created" : String(revision.status ?? "queued").includes("provider_failed") ? "provider_failed" : String(revision.status ?? "queued").includes("payment_or_credit_required") ? "payment_or_credit_required" : String(revision.status ?? "queued").includes("queued") ? "queued" : String(revision.status ?? "queued").includes("already_running") ? "already_running" : "queued"}</span>
                  <p>{String(revision.message ?? "").length > 260 ? `${String(revision.message ?? "").slice(0, 260)}…` : revision.message}</p>
                </div>
              ))}
            </div>
          ) : <p>{isReady || hasPreview ? "No revision requests yet. Choose an action from the cards or type a direct command in the assistant area." : dedicatedCharacterDialogueRequired && !hasDedicatedCharacterDialogueJobs ? "Dedicated character-dialogue pipeline has not attached stage jobs yet. Press Start Production once to create the character sheets, scene images, voice segments and final assembly plan." : providerJobMissingWhileRunning ? "Production is marked running, but no real provider job is attached yet. Press Start Production once to attach the video provider job." : hasDedicatedCharacterDialogueJobs ? "Dedicated character-dialogue pipeline is running. Character sheets, scene images, voice segments and image-to-video jobs are tracked before final assembly." : "Production has started. Provider/automation status is being tracked; revision actions unlock after a preview or delivery is available."}</p>}
        </div>

        <div className="final-delivery-card">
          <h2>{isProjectProduction ? "Project delivery" : "Final delivery"}</h2>
          <p>{isProjectProduction ? "When the package is ready, preview, source files, README, and revision steps are managed here." : "When production is complete, download, revision, and social sharing steps are managed here."}</p>
          <div className="delivery-action-grid">
            {previewUrl ? <a className="btn secondary" href={previewUrl} target="_blank"><PlayCircle size={15} /> Preview</a> : <button className="btn secondary" type="button" disabled><PlayCircle size={15} /> Preview</button>}
            {deliveryUrl ? <a className="btn secondary" href={mediaDownloadUrl} download><Download size={15} /> Download</a> : <button className="btn secondary" type="button" disabled><Download size={15} /> Download</button>}
            <button className="btn secondary" type="button" onClick={() => { setTargetPart("Final delivery"); setAction("Revise"); setMessage("The part I want changed in the final output: "); }}><RefreshCcw size={15} /> Revise</button>
            {canCancel ? <button className="btn secondary" type="button" onClick={cancelProduction} disabled={cancelLoading}>{cancelLoading ? "Cancelling..." : "Cancel production"}</button> : null}
            {!isProjectProduction ? <button className="btn" type="button" onClick={prepareSocialSharing}><Share2 size={15} /> Share on social media</button> : null}
          </div>
        </div>

        {!isProjectProduction ? <div className="social-share-card" id="social-share-panel">
          <h2>Social media sharing</h2>
          <p>When the final output is ready, caption, hashtags, platform format, and posting time are prepared here.</p>
          <div className="social-chip-row">
            {["Instagram", "TikTok", "YouTube Shorts", "LinkedIn", "Facebook", "X"].map((platform) => <span key={platform}>{platform}</span>)}
          </div>
          <div className="revision-target-grid">
            <label><span>Caption / product description</span><textarea value={deliveryCaption} onChange={(event) => setDeliveryCaption(event.target.value)} /></label>
            <label><span>Hashtags / product tags</span><input value={deliveryHashtags} onChange={(event) => setDeliveryHashtags(event.target.value)} /></label>
            <label><span>Store product ID</span><input value={deliveryProductId} onChange={(event) => setDeliveryProductId(event.target.value)} placeholder="Select from connected store or paste product id" /></label>
          </div>
          <div className="social-share-action-grid">
            <button className="btn" type="button" onClick={prepareSocialSharing}><Share2 size={15} /> Prepare share plan</button>
            <a className="btn secondary" href="/dashboard/social-export">Open social export pack</a>
            <a className="btn secondary" href="/dashboard/ads">Send to ads center</a>
            <a className="btn secondary" href="/dashboard/connections">Connect store/accounts</a>
          </div>
          {!deliveryUrl ? <p className="workspace-action-note warning">Final delivery is not ready yet. You can prepare the social plan now, then attach the final file when delivery opens.</p> : null}
        </div> : null}

        <div className="social-share-card">
          <h2>Connected store/product selector</h2>
          <p>Use this to load connected Shopify/WooCommerce products and create approval-gated upload jobs from the production workspace.</p>
          <ConnectedAccountsPanel />
        </div>
      </aside>
    </div>
  );
}
