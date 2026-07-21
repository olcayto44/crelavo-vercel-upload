"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Download, ExternalLink, Film, Globe2, ImageIcon, LibraryBig, Mic2, Music2, Pencil, PlayCircle, RefreshCcw, Share2, Subtitles, UploadCloud } from "lucide-react";
import { ProviderReadinessCard } from "@/components/ProviderReadinessCard";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

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

  function prepareSocialSharing() {
    setTargetPart("Social media sharing");
    setAction("Prepare social sharing");
    setMessage("Prepare caption, hashtags, platform format and posting plan for the final output.");
    setNotice("Social sharing request is ready below. Review it and send from the assistant intervention area.");
    window.setTimeout(() => document.getElementById("social-share-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }
  const [localRevisions, setLocalRevisions] = useState<RevisionRequest[]>([]);
  const [pollingNote, setPollingNote] = useState("");
  const [providerStartNote, setProviderStartNote] = useState("");
  const [approvalLoading, setApprovalLoading] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const type = String(production.production_type ?? "general");
  const isProjectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(type);
  const metadata = production.request_metadata ?? {};
  const outputJson = production.output_json ?? {};
  const audience = metadata.audienceContext ?? {};
  const materials = Array.isArray(production.materials_json) ? production.materials_json : [];
  const parts = partsForProduction(type);
  const persistedRevisions = useMemo(() => {
    const outputRevisions = Array.isArray(outputJson.revisionRequests) ? outputJson.revisionRequests : [];
    const metadataRevisions = Array.isArray(metadata.revisionRequests) ? metadata.revisionRequests : [];
    return [...outputRevisions, ...metadataRevisions] as RevisionRequest[];
  }, [metadata, outputJson]);
  const revisions = [...persistedRevisions, ...localRevisions];
  const previewUrl = production.preview_url || String(outputJson.previewUrl ?? outputJson.preview_url ?? "");
  const deliveryUrl = production.delivery_zip_url || production.delivery_link || String(outputJson.deliveryZipUrl ?? outputJson.delivery_url ?? "");
  const sourceUrl = production.source_files_url || String(outputJson.sourceFilesUrl ?? "");
  const readmeUrl = production.readme_url || String(outputJson.readmeUrl ?? "");
  const outputPlan = metadata.outputPlan ?? outputJson.outputPlan ?? {};
  const projectWorkflow = metadata.projectWorkflow && typeof metadata.projectWorkflow === "object" ? metadata.projectWorkflow as Record<string, unknown> : null;
  const commerceWorkflow = metadata.commerceWorkflow && typeof metadata.commerceWorkflow === "object" ? metadata.commerceWorkflow as Record<string, unknown> : null;
  const deliveryTargets = metadata.deliveryTargets && typeof metadata.deliveryTargets === "object" ? metadata.deliveryTargets as Record<string, unknown> : null;
  const deliveryPackage = (metadata.deliveryPackage && typeof metadata.deliveryPackage === "object" ? metadata.deliveryPackage : outputJson.deliveryPackage && typeof outputJson.deliveryPackage === "object" ? outputJson.deliveryPackage : null) as Record<string, unknown> | null;
  const deliveryRequirements = (metadata.deliveryRequirements && typeof metadata.deliveryRequirements === "object" ? metadata.deliveryRequirements : outputJson.deliveryRequirements && typeof outputJson.deliveryRequirements === "object" ? outputJson.deliveryRequirements : null) as Record<string, unknown> | null;
  const deliveryRequirementFormats = Array.isArray(deliveryRequirements?.formats) ? deliveryRequirements.formats.map(String) : [];
  const publishTargets = Array.isArray(deliveryTargets?.publishTargets) ? deliveryTargets.publishTargets.map(String) : [];
  const costNotes = Array.isArray(outputPlan.costNotes) ? outputPlan.costNotes : [];
  const automationScript = String(outputJson.script ?? "");
  const automationParts = Array.isArray(outputJson.parts) ? outputJson.parts : Array.isArray(outputJson.scenePlan) ? outputJson.scenePlan : [];
  const visualJob = outputJson.visualJob && typeof outputJson.visualJob === "object" ? outputJson.visualJob as Record<string, any> : null;
  const voiceAudioUrl = String(outputJson.voiceAudioUrl ?? outputJson.voice_audio_url ?? "");
  const voiceJobs = Array.isArray(outputJson.voiceJobs) ? outputJson.voiceJobs : [];
  const providerStatus = String(outputJson.providerStatus ?? "");
  const providerProgress = Number.isFinite(Number(outputJson.providerProgress)) ? Math.max(0, Math.min(100, Number(outputJson.providerProgress))) : null;
  const providerTestMode = Boolean(outputJson.providerTestMode ?? metadata.providerTestMode);
  const providerPreflight = outputJson.providerPreflight && typeof outputJson.providerPreflight === "object" ? outputJson.providerPreflight as Record<string, unknown> : null;
  const providerReadiness = outputJson.providerReadiness && typeof outputJson.providerReadiness === "object" ? outputJson.providerReadiness as Record<string, any> : null;
  const providerRequirements = Array.isArray(providerReadiness?.requirements) ? providerReadiness.requirements as Record<string, any>[] : [];
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
        description: index === 0 ? "The system's best single output appears here." : "A different hook, scene, voice, style, or format variation appears here.",
        preview_url: ""
      }));
  const hasAlternativeJobs = alternatives.some((alternative: Record<string, any>) => alternative?.visualJob && !["ready", "provider_failed"].includes(String(alternative.status ?? "")));
  const liveStatus = String(production.automation_status || production.generation_status || production.status || "queued");
  const hasPreview = Boolean(previewUrl || voiceAudioUrl || savedAlternatives.some((alternative: Record<string, any>) => alternative.preview_url || alternative.previewUrl || alternative.url));
  const hasDelivery = Boolean(deliveryUrl || sourceUrl || readmeUrl);
  const previewUrlLower = previewUrl.toLowerCase();
  const previewKind = previewUrlLower.match(/\.(mp4|webm|mov)(\?|$)/) ? "video" : previewUrlLower.match(/\.(png|jpe?g|webp|gif|avif)(\?|$)/) ? "image" : previewUrl ? "web" : "pending";
  const nextLiveStep = isWaitingProviderConfig
    ? "Production scope and delivery package are ready, but real provider/API configuration is still missing. Demo delivery can be downloaded until providers are connected."
    : isQueuedForRenderSlot
    ? "This production is safely queued for the next render slot. The page can be left open or closed; completion email is sent when ready."
    : hasDelivery
      ? "Final delivery is ready; the user can preview, download, share, or request a revision."
      : hasPreview
        ? "Preview is ready; the user can choose an alternative or request changes."
        : visualJob || hasAlternativeJobs
          ? "Provider generation is running; status is checked automatically and the page updates when ready."
          : "Production record is ready; provider job or project package can be started.";
  const liveSteps = [
    { label: "Request received", active: true },
    { label: "Provider / package", active: Boolean(visualJob || hasAlternativeJobs || providerPreflight || hasPreview || hasDelivery) },
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
    setProviderStartNote("Starting provider job...");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setProviderStartNote(auth.message);
      return;
    }
    const response = await fetch("/api/automation/start", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ production_id: production.id, user_id: auth.user.id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setProviderStartNote(data.error ?? "Provider job could not be started.");
      return;
    }
    setProviderStartNote(data.already_running ? "An active provider job already exists; no new paid job was opened." : data.demo ? "Demo output was updated or provider config is missing." : "Provider job started, refreshing page...");
    window.setTimeout(() => window.location.reload(), 900);
  }

  async function refreshProviderStatus(auto = false) {
    if (!visualJob && !hasAlternativeJobs) return;
    setPollingNote(auto ? "Refreshing provider status automatically…" : "Refreshing provider status…");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setPollingNote(auth.message);
      return;
    }
    const response = await fetch("/api/automation/status", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({ production_id: production.id, user_id: auth.user.id })
    });
    const data = await response.json().catch(() => ({}));
    const nextStatus = data.renderStatus?.status ?? data.visualStatus?.status ?? data.alternativeStatuses?.[0]?.status ?? "unknown";
    setPollingNote(nextStatus === "succeeded" ? "Provider output is ready, refreshing page..." : `Provider status: ${nextStatus}`);
    if (nextStatus === "succeeded" || nextStatus === "failed") {
      window.setTimeout(() => window.location.reload(), 800);
    }
  }

  useEffect(() => {
    if ((!visualJob && !hasAlternativeJobs) || ["ready", "failed"].includes(String(production.status))) return;
    const timer = window.setInterval(() => refreshProviderStatus(true), 12000);
    return () => window.clearInterval(timer);
  }, [production.id, production.status, visualJob?.id, hasAlternativeJobs]);

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
          <span className="badge">Live production workspace</span>
          <h1>{production.title || "Production workspace"}</h1>
          <p>{production.prompt || "Production parts, previews, revision decisions, downloads, and sharing steps appear here."}</p>
        </div>

        <div className="production-live-summary">
          <div>
            <span className="badge">Live status</span>
            <h2>{liveStatus}</h2>
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
          <section className="cost-safety-card production-decision-card">
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

        {costNotes.length > 0 || creditResolution ? (
          <section className="cost-safety-card">
            <span className="badge">Credit safety</span>
            <h3>{creditResolution ? creditResolutionTitle : "Reservation calculation"}</h3>
            {creditResolution ? <p className="workspace-action-note error">{String(creditResolution.instruction ?? "Provider failed; credit resolution is waiting for admin review.")}</p> : null}
            <div className="cost-note-list">{costNotes.map((note: unknown, index: number) => <span key={`${String(note)}-${index}`}>{String(note)}</span>)}</div>
          </section>
        ) : null}

        <section className="customer-preview-theater">
          <div className="customer-preview-screen">
            {previewKind === "video" ? (
              <video src={previewUrl} controls playsInline poster="" />
            ) : previewKind === "image" ? (
              <img src={previewUrl} alt="Production preview" />
            ) : previewKind === "web" ? (
              <iframe src={previewUrl} title="Production preview" loading="lazy" />
            ) : (
              <div className="customer-preview-placeholder">
                <PlayCircle size={44} />
                <span className="badge">Preview preparing</span>
                <h3>{isProjectProduction ? "Project preview will appear here" : "Generated preview will appear here"}</h3>
                <p>{isProjectProduction ? "Screens, website preview, source package or delivery links will be shown in this large customer viewing area when ready." : "Video, image, audio or final output preview will be shown in this large customer viewing area when ready."}</p>
              </div>
            )}
          </div>
          <aside className="customer-preview-control">
            <span className="badge">{isProjectProduction ? "Customer project preview" : "Customer preview / playback"}</span>
            <h3>{previewUrl ? "Preview is ready to review" : "Waiting for preview output"}</h3>
            <p>{nextLiveStep}</p>
            {providerProgress !== null ? (
              <div className="customer-progress-meter">
                <div><span>Provider progress</span><strong>{providerProgress}%</strong></div>
                <progress value={providerProgress} max={100} />
              </div>
            ) : null}
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
              {previewUrl ? <a className="btn" href={previewUrl} target="_blank"><PlayCircle size={15} /> Open preview</a> : <button className="btn" type="button" disabled><PlayCircle size={15} /> Preview pending</button>}
              {deliveryUrl ? <a className="btn secondary" href={deliveryUrl} target="_blank"><Download size={15} /> Download final ZIP</a> : <button className="btn secondary" type="button" disabled><Download size={15} /> Final ZIP waiting</button>}
              {sourceUrl ? <a className="btn secondary" href={sourceUrl} target="_blank"><ExternalLink size={15} /> Source files</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={15} /> Source pending</button>}
              {readmeUrl ? <a className="btn secondary" href={readmeUrl} target="_blank"><ExternalLink size={15} /> README / setup</a> : <button className="btn secondary" type="button" disabled><ExternalLink size={15} /> README pending</button>}
              {voiceAudioUrl ? <a className="btn secondary" href={voiceAudioUrl} target="_blank"><Mic2 size={15} /> Listen to voice</a> : null}
              <button className="btn secondary" type="button" onClick={() => { setTargetPart("Final delivery"); setAction("Request revision"); setMessage("I want to request a revision for the final delivery package."); setNotice("Revision request is ready below. Add details and send it."); }}>Request revision</button>
              {canCancel ? <button className="btn secondary" type="button" onClick={cancelProduction} disabled={cancelLoading}>{cancelLoading ? "Cancelling..." : "Cancel production"}</button> : null}
              {visualJob || hasAlternativeJobs ? <button className="btn secondary" type="button" onClick={() => refreshProviderStatus(false)}>Refresh provider status</button> : null}
              <button className="btn secondary" type="button" onClick={restartProviderJob}>{isProjectProduction ? "Prepare project package" : "Start real provider job"}</button>
            </div>
            {providerTestMode ? <p className="provider-poll-note">Quick provider test: 5 sec / 720p / single output.</p> : null}
            {providerPreflight ? <p className="provider-poll-note">Preflight: {isProjectProduction ? `${String(providerPreflight.provider)} · ${String(providerPreflight.model)} · ${String(providerPreflight.aspectRatio)}` : `${String(providerPreflight.provider)} · ${String(providerPreflight.model)} · ${String(providerPreflight.durationSeconds)} sec · ${String(providerPreflight.aspectRatio)}`}</p> : null}
            {visualJob ? <p className="provider-job-note">Provider job: {String(visualJob.provider)} · {String(visualJob.status)} · {String(visualJob.id ?? "waiting for id")} {providerStatus ? `· ${providerStatus}` : ""}</p> : null}
            {providerStartNote ? <p className="provider-poll-note">{providerStartNote}</p> : null}
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

        {providerReadiness ? (
          <section className="cost-safety-card">
            <span className="badge">Provider readiness</span>
            <h3>{String(providerReadiness.status ?? "provider status")}</h3>
            <p>{String(providerReadiness.userMessage ?? "Provider/API readiness is being checked before real production starts.")}</p>
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
            <h3>User alternatives appear here</h3>
            <p>As the engine generates different hooks, voices, scenes, colors, formats, or delivery variations, these cards fill with real preview links. The user can choose one or request revisions one by one.</p>
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
            <h3>Production by country, city, and culture</h3>
            <p>The assistant applies language, city, culture, tradition, location, clothing, music, subtitles, and target platform decisions to every production part. If the user says the environment, outfit, or music does not fit, the related part is revised.</p>
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

        <form className="workspace-assistant-card" onSubmit={submitRevision}>
          <Bot size={20} />
          <h2>Assistant intervention area</h2>
          <p>The user can ask for changes such as changing the music, regenerating scene 2, making subtitles smaller, removing an outfit, or choosing another voice. The system links the request to the relevant card.</p>
          <div className="revision-target-grid">
            <label><span>Target part</span><input value={targetPart} onChange={(event) => setTargetPart(event.target.value)} /></label>
            <label><span>Action</span><input value={action} onChange={(event) => setAction(event.target.value)} /></label>
          </div>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a revision request: This voice does not fit; use a deeper and more confident voice. Scene 2 is too dark; make it a brighter office." />
          <button className="btn" disabled={status === "loading"} type="submit"><Pencil size={15} /> {status === "loading" ? "Saving..." : "Send revision request"}</button>
          {notice ? <p className={`workspace-action-note ${status === "error" ? "error" : ""}`}>{notice}</p> : null}
        </form>

        <ProviderReadinessCard />

        <div className="revision-history-card">
          <h2>Revision history</h2>
          {revisions.length > 0 ? (
            <div className="revision-history-list">
              {revisions.slice(-5).reverse().map((revision, index) => (
                <div key={revision.id ?? `${revision.requestedAt}-${index}`}>
                  <strong>{revision.targetPart || "General production"}</strong>
                  <span>{revision.action || "Revision"} · {revision.status || "queued"}</span>
                  <p>{revision.message}</p>
                </div>
              ))}
            </div>
          ) : <p>No revision requests yet. Choose an action from the cards or type a direct command in the assistant area.</p>}
        </div>

        <div className="final-delivery-card">
          <h2>Final delivery</h2>
          <p>When production is complete, download, revision, and social sharing steps are managed here.</p>
          <div className="delivery-action-grid">
            {previewUrl ? <a className="btn secondary" href={previewUrl} target="_blank"><PlayCircle size={15} /> Preview</a> : <button className="btn secondary" type="button" disabled><PlayCircle size={15} /> Preview</button>}
            {deliveryUrl ? <a className="btn secondary" href={deliveryUrl} target="_blank"><Download size={15} /> Download</a> : <button className="btn secondary" type="button" disabled><Download size={15} /> Download</button>}
            <button className="btn secondary" type="button" onClick={() => { setTargetPart("Final delivery"); setAction("Revise"); setMessage("The part I want changed in the final output: "); }}><RefreshCcw size={15} /> Revise</button>
            {canCancel ? <button className="btn secondary" type="button" onClick={cancelProduction} disabled={cancelLoading}>{cancelLoading ? "Cancelling..." : "Cancel production"}</button> : null}
            <button className="btn" type="button" onClick={prepareSocialSharing}><Share2 size={15} /> Share on social media</button>
          </div>
        </div>

        <div className="social-share-card" id="social-share-panel">
          <h2>Social media sharing</h2>
          <p>When the final output is ready, caption, hashtags, platform format, and posting time are prepared here.</p>
          <div className="social-chip-row">
            {["Instagram", "TikTok", "YouTube Shorts", "LinkedIn", "Facebook", "X"].map((platform) => <span key={platform}>{platform}</span>)}
          </div>
          <div className="social-share-action-grid">
            <button className="btn" type="button" onClick={prepareSocialSharing}><Share2 size={15} /> Prepare share plan</button>
            <a className="btn secondary" href="/dashboard/social-export">Open social export pack</a>
            <a className="btn secondary" href="/dashboard/ads">Send to ads center</a>
            <a className="btn secondary" href="/dashboard/connections">Connect store/accounts</a>
          </div>
          {!deliveryUrl ? <p className="workspace-action-note warning">Final delivery is not ready yet. You can prepare the social plan now, then attach the final file when delivery opens.</p> : null}
        </div>
      </aside>
    </div>
  );
}
