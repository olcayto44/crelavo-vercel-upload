import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { buildAssistantKnowledgePrompt, buildAssistantRoutingRules } from "@/lib/assistant-knowledge";
import { buildAssistantUserContextPrompt, loadAssistantUserContext } from "@/lib/assistant-user-context";
import { validateProductionSafety } from "@/lib/content-safety";
import { normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { estimateProductionCost } from "@/lib/production";
import { packageIdFromSelection } from "@/lib/production-payload";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

type AgentAction = {
  name: string;
  intent: string;
  production_type: string;
  confirmation_required: boolean;
  credit_check_required: boolean;
  provider_route: string;
  state_before_confirmation: "draft_ready";
  next_backend_endpoint: string;
  args: Record<string, unknown>;
};

type OrchestratorJob = {
  id: string;
  type: string;
  title: string;
  brief: string;
  selected_style: string;
  selected_quality: string;
  selected_duration: string;
  selected_modules: string[];
  selected_features: string[];
  selected_platforms: string[];
  package_id: string;
  estimated_credits: number;
  deliverables: string[];
  required_materials: string[];
  agent_action: AgentAction;
  production_payload: Record<string, unknown>;
};

type DraftJob = Partial<Omit<OrchestratorJob, "id" | "package_id" | "estimated_credits" | "agent_action" | "production_payload">> & { type?: string };

type AiOrchestratorDraft = {
  intent?: string;
  workflow_stage?: string;
  next_user_action?: string;
  missing_fields?: string[];
  delivery_path?: string[];
  jobs?: DraftJob[];
};

function cleanArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 12);
  return items.length ? Array.from(new Set(items)) : fallback;
}

function slugify(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşöçıİ-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "job";
}

function isGrowthIntelligenceRequest(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  return /growth intelligence|rakip|competitor|pazar istihbarat|market intelligence|fiyat takibi|pricing changes|ad library|haftalık rapor|weekly report|public signal/.test(text);
}

function inferProductionType(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  if (isGrowthIntelligenceRequest(message)) return "document_pack";
  if (/müzik video|muzik video|müzik klip|muzik klip|\bklip\b|\bmv\b|şarkıma|sarkima|şarkı|sarki/.test(text)) return "music_video";
  if (/drone|dron|uydu|satellite|harita|map|rota|route|eyfel|eiffel|mekan tanıtım|mekan tanitim/.test(text)) return "drone_video";
  if (/canlı yayın|canli yayin|live sales|live commerce|satış ajan|satis ajan|yayın satış|yayin satis/.test(text)) return "live_sales_agent";
  if (/konuşmalı|konusmali|lip-sync|dudak|avatar|spokesperson|sunucu|kendi görüntümle konuş|kendi goruntumle konus/.test(text)) return "talking_video";
  if (/belgesel|documentary|sağlık|saglik|anlatımlı belgesel|anlatimli belgesel/.test(text)) return "video";
  if (/e-?ticaret|eticaret|mağaza|magaza|shopify|woocommerce|sepet|checkout/.test(text)) return "website";
  if (/web sitesi|website|landing|site kur|site yap|site yaptır|site yaptir/.test(text)) return "website";
  if (/saas|dashboard|panel|abonelik|billing/.test(text)) return "saas";
  if (/mobil uygulama|mobile app|ios|android|expo/.test(text)) return "mobile_app";
  if (/admin panel|yönetim panel|yonetim panel|crud/.test(text)) return "admin_project";
  if (/logo|brand kit|marka kiti|etiket|ambalaj|packaging|poster|afiş|afis|görsel|gorsel/.test(text)) return "image";
  if (/reklam|kampanya|tiktok|instagram|reels|shorts|ürün|urun|restoran|yemek|gıda|gida|kafe|cafe|menü|menu/.test(text)) return "campaign";
  if (/animasyon|animation|çizgi|cizgi/.test(text)) return "animation";
  return "video";
}

function inferJobTypes(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const types = new Set<string>();
  const wantsWebsite = /web sitesi|website|landing|site kur|site yap|site yaptır|site yaptir|e-?ticaret|eticaret|shopify|woocommerce|sepet|checkout/.test(text);
  const wantsVideo = /tanıtım videosu|tanitim videosu|video|reklam|promo|trailer|teaser/.test(text);
  if (wantsWebsite && wantsVideo) {
    types.add("website");
    types.add(/müzik video|muzik video|müzik klip|muzik klip|\bklip\b|\bmv\b/.test(text) ? "music_video" : "campaign");
  }
  if (isGrowthIntelligenceRequest(message)) types.add("document_pack");
  if (/web sitesi|website|landing|site kur|site yap|site yaptır|site yaptir|e-?ticaret|eticaret|shopify|woocommerce|sepet|checkout/.test(text)) types.add("website");
  if (/saas/.test(text)) types.add("saas");
  if (/mobil uygulama|mobile app|ios|android|expo/.test(text)) types.add("mobile_app");
  if (/admin panel|yönetim panel|yonetim panel|crud/.test(text)) types.add("admin_project");
  if (/müzik video|muzik video|müzik klip|muzik klip|\bklip\b|\bmv\b/.test(text)) types.add("music_video");
  if (/drone|dron|uydu|satellite|harita|map|eyfel|eiffel/.test(text)) types.add("drone_video");
  if (/canlı yayın|canli yayin|live sales|live commerce|satış ajan|satis ajan/.test(text)) types.add("live_sales_agent");
  if (/konuşmalı|konusmali|lip-sync|dudak|avatar|spokesperson/.test(text)) types.add("talking_video");
  if (/video|reklam|kampanya|tiktok|instagram|reels|shorts|belgesel|documentary|animasyon|animation/.test(text)) types.add(inferProductionType(message));
  if (/logo|brand kit|marka kiti|etiket|ambalaj|packaging|poster|afiş|afis|görsel|gorsel/.test(text)) types.add("image");
  if (!types.size) types.add(inferProductionType(message));
  return Array.from(types).slice(0, 4);
}

function actionNameForType(type: string) {
  if (["campaign", "video", "music_video", "animation", "drone_video"].includes(type)) return "create_ai_video";
  if (["image", "brand_kit"].includes(type)) return "generate_image";
  if (["talking_video", "live_sales_agent"].includes(type)) return "run_lip_sync";
  if (type === "website") return "create_website_project";
  if (type === "saas") return "create_saas_project";
  if (type === "mobile_app") return "create_mobile_app_project";
  if (type === "admin_project") return "create_admin_panel_project";
  if (type === "document_pack") return "create_document_pack";
  return "create_production";
}

function defaultsForType(type: string, message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const social = /tiktok|reels|shorts|instagram/.test(text);
  const ownMaterial = /kendi görünt|kendi gorunt|kendi ses|benim görünt|benim gorunt|fotoğrafım|fotografim/.test(text);
  const growthIntelligence = isGrowthIntelligenceRequest(message);
  const modulesByType: Record<string, string[]> = {
    website: ["Website", "Admin panel", "Source file delivery"],
    saas: ["SaaS screen", "Admin panel", "Auth flow", "Source file delivery"],
    mobile_app: ["Mobile app", "Source file delivery", "README"],
    admin_project: ["Admin panel", "Database schema", "Source file delivery"],
    music_video: ["AI video", "Music video/MV", "User audio upload"],
    drone_video: ["Drone-style aerial video", "Voice-over", "Subtitles"],
    live_sales_agent: ["AI Live Sales Agent", "Avatar design", "Voice-over"],
    talking_video: ["Advanced talking video", "Voice-to-video", "Lip-sync"],
    image: ["Visual/image pack", "Brand kit"],
    document_pack: growthIntelligence ? ["Growth Intelligence brief", "Competitor monitoring", "Weekly executive report", "Campaign response actions"] : ["PDF/document", "Report package"],
    campaign: ["AI video", "Product ad video", "Voice-over"],
    animation: ["Animation video", "Voice-over", "Subtitles"],
    video: ["AI video", "Voice-over", "Subtitles"]
  };
  const deliverablesByType: Record<string, string[]> = {
    website: ["preview_link", "source_zip", "readme", "deployment_guide"],
    saas: ["preview_link", "source_zip", "readme", "admin_notes"],
    mobile_app: ["source_zip", "readme", "setup_guide"],
    admin_project: ["source_zip", "database_schema", "readme"],
    image: ["image_files", "source_package"],
    document_pack: growthIntelligence ? ["dashboard_report_file", "weekly_pdf_report", "intelligence_brief", "monitoring_settings", "alert_channel_plan", "campaign_response_plan"] : ["pdf", "source_document", "delivery_package"],
    default: ["preview", "final_mp4", "subtitle_file", "delivery_package"]
  };
  const requiredMaterials = [
    ownMaterial ? "User image/video/audio material" : null,
    type === "music_video" ? "Song/audio or lyrics" : null,
    type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? "Brand/business details" : null,
    type === "drone_video" ? "Location, map route or real footage if exact place is required" : null,
    type === "image" ? "Brand name, product label text or visual reference if exact brand output is required" : null,
    growthIntelligence ? "Own website, competitor URLs, target market, public sources, report cadence and alert channels" : null
  ].filter(Boolean) as string[];

  return {
    selected_style: growthIntelligence ? "Growth Intelligence service" : /sinematik|cinematic/.test(text) ? "Cinematic" : type === "website" || type === "saas" ? "SaaS modern" : type === "image" ? "Premium brand" : "High-conversion social",
    selected_quality: growthIntelligence ? "Monthly service plan" : /4k|premium|yüksek kalite|yuksek kalite/.test(text) ? "4K / premium" : "1080p premium",
    selected_duration: growthIntelligence ? "Monthly monitoring" : type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? "Project based" : social ? "15 sec" : "30 sec",
    selected_modules: modulesByType[type] ?? modulesByType.video,
    selected_features: growthIntelligence ? ["Public-signal monitoring", "Weekly executive PDF", "Alert channel plan", "Campaign response actions"] : ["Production package", ...(type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? ["Source file delivery", "README"] : ["Subtitles", "Music", "Revision right"])],
    selected_platforms: growthIntelligence ? ["Growth Intelligence dashboard", "Email report", "Slack/email alerts"] : social ? ["TikTok", "Instagram Reels", "YouTube Shorts", "Dashboard delivery"] : ["Dashboard delivery"],
    deliverables: deliverablesByType[type] ?? deliverablesByType.default,
    required_materials: requiredMaterials
  };
}

async function aiDraft(message: string, history: { role: "user" | "assistant"; content: string }[], userContextPrompt = ""): Promise<AiOrchestratorDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are Crelavo's central orchestrator. Turn the user request into a turnkey delivery plan. Return JSON only: intent, workflow_stage, next_user_action, missing_fields, delivery_path, jobs. Each job: type, title, brief, selected_style, selected_quality, selected_duration, selected_modules, selected_features, selected_platforms, deliverables, required_materials. Do not hardcode examples as categories; infer dynamically.\n\n${buildAssistantRoutingRules()}\n\n${buildAssistantKnowledgePrompt()}\n\n${userContextPrompt}` },
        ...history.slice(-8),
        { role: "user", content: message }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content) as AiOrchestratorDraft;
  } catch {
    return null;
  }
}

function optionSummaryForJob(job: Omit<OrchestratorJob, "id" | "package_id" | "estimated_credits" | "agent_action" | "production_payload">) {
  return [
    `Style: ${job.selected_style}`,
    `Quality: ${job.selected_quality}`,
    `Duration: ${job.selected_duration}`,
    `Production modules: ${job.selected_modules.join(", ")}`,
    `Extra features: ${job.selected_features.join(", ")}`,
    `Delivery/platform: ${job.selected_platforms.join(", ")}`,
    `Deliverables: ${job.deliverables.join(", ")}`,
    `Required materials: ${job.required_materials.join(", ") || "None required to start draft"}`
  ].join("\n");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = String(body.user_id ?? "").trim();
  const userEmail = String(body.user_email ?? "").trim().toLowerCase();
  const message = String(body.message ?? body.idea ?? "").trim().slice(0, 3000);
  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.messages)
    ? body.messages.map((item: { role?: string; content?: string }) => ({ role: item.role === "assistant" ? "assistant" as const : "user" as const, content: String(item.content ?? "").slice(0, 1200) })).filter((item: { content: string }) => item.content.trim())
    : [];

  if (!userId || !userEmail) return Response.json({ error: "Please log in before using the AI orchestrator." }, { status: 401 });
  const guardConfig = apiCostGuardConfig();
  const routeBudget = enforceRouteBudget(request, { route: "assistant-orchestrate", userId, ipLimit: guardConfig.assistantPlanIpLimit, userLimit: guardConfig.assistantPlanUserLimit, windowMs: 15 * 60 * 1000 });
  if (!routeBudget.ok) return routeBudget.response;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  if (!message) return Response.json({ error: "Write what you want to build or produce first." }, { status: 400 });

  const safety = validateProductionSafety([message, ...history.map((item) => item.content)]);
  if (!safety.ok) return Response.json({ error: safety.message }, { status: 400 });

  const supabase = supabaseAdmin();
  const userContext = await loadAssistantUserContext(supabase, userId);
  const userContextPrompt = buildAssistantUserContextPrompt(userContext);
  const { data: deliveryRateRow } = await supabase.from("platform_configs").select("value").eq("key", "delivery_credit_rates").maybeSingle();
  const { data: packageConfigRow } = await supabase.from("platform_configs").select("value").eq("key", PACKAGE_CONFIG_KEY).maybeSingle();
  const deliveryCreditRates = normalizeDeliveryCreditRates(deliveryRateRow?.value);
  const packageConfig = normalizePackageConfig(packageConfigRow?.value);

  const draft = await aiDraft(message, history, userContextPrompt);
  const draftJobs: DraftJob[] = Array.isArray(draft?.jobs) && draft?.jobs?.length ? draft.jobs.slice(0, 4) : inferJobTypes(message).map((type) => ({ type }));

  const jobs: OrchestratorJob[] = draftJobs.map((draftJob, index) => {
    const type = String(draftJob.type ?? inferProductionType(message)).trim() || "video";
    const defaults = defaultsForType(type, message);
    const growthService = type === "document_pack" && isGrowthIntelligenceRequest(message);
    const baseJob = {
      type,
      title: String(draftJob.title ?? `${type.replaceAll("_", " ")} production`).trim(),
      brief: String(draftJob.brief ?? message).trim(),
      selected_style: growthService ? defaults.selected_style : String(draftJob.selected_style ?? defaults.selected_style),
      selected_quality: growthService ? defaults.selected_quality : String(draftJob.selected_quality ?? defaults.selected_quality),
      selected_duration: growthService ? defaults.selected_duration : String(draftJob.selected_duration ?? defaults.selected_duration),
      selected_modules: growthService ? defaults.selected_modules : cleanArray(draftJob.selected_modules, defaults.selected_modules),
      selected_features: growthService ? defaults.selected_features : cleanArray(draftJob.selected_features, defaults.selected_features),
      selected_platforms: growthService ? defaults.selected_platforms : cleanArray(draftJob.selected_platforms, defaults.selected_platforms),
      deliverables: growthService ? defaults.deliverables : cleanArray(draftJob.deliverables, defaults.deliverables),
      required_materials: growthService ? defaults.required_materials : cleanArray(draftJob.required_materials, defaults.required_materials)
    };
    const selection = {
      input: message,
      selectedStyle: baseJob.selected_style,
      selectedQuality: baseJob.selected_quality,
      selectedDuration: baseJob.selected_duration,
      selectedModules: baseJob.selected_modules,
      selectedFeatures: baseJob.selected_features,
      selectedPlatforms: baseJob.selected_platforms,
      quickProviderTest: false
    };
    const packageId = packageIdFromSelection(type, selection, packageConfig.productionPackages);
    const estimate = estimateProductionCost(packageId, {
      needsImages: /image|visual|logo|brand|poster|thumbnail|video|music_video|campaign|animation/.test(type),
      revisionBuffer: baseJob.selected_features.some((item) => /revision|revizyon/i.test(item)),
      outputCount: baseJob.selected_features.some((item) => /5/.test(item)) ? 5 : baseJob.selected_features.some((item) => /3/.test(item)) ? 3 : 1,
      quality: baseJob.selected_quality,
      durationSeconds: Number(baseJob.selected_duration.match(/\d+/)?.[0] ?? 0) || 0,
      features: baseJob.selected_features.join(", "),
      productionType: type,
      materialCount: baseJob.required_materials.length,
      deliveryRequirements: { requested: true, status: "pending", formats: baseJob.deliverables },
      deliveryCreditRates,
      packageCatalog: packageConfig.productionPackages
    });
    const optionSummary = optionSummaryForJob(baseJob);
    const agentAction: AgentAction = {
      name: actionNameForType(type),
      intent: growthService ? "route_service_brief" : "create_confirmed_production",
      production_type: type,
      confirmation_required: true,
      credit_check_required: !growthService,
      provider_route: "auto",
      state_before_confirmation: "draft_ready",
      next_backend_endpoint: growthService ? "/dashboard/growth-intelligence" : "/api/productions",
      args: {
        title: baseJob.title,
        brief: baseJob.brief,
        package_id: packageId,
        selected_style: baseJob.selected_style,
        selected_quality: baseJob.selected_quality,
        selected_duration: baseJob.selected_duration,
        selected_modules: baseJob.selected_modules,
        selected_features: baseJob.selected_features,
        selected_platforms: baseJob.selected_platforms,
        deliverables: baseJob.deliverables,
        required_materials: baseJob.required_materials,
        estimated_credits: growthService ? 0 : estimate.minimumSafeCredits
      }
    };
    const productionPayload = {
      user_id: userId,
      user_email: userEmail,
      production_type: type,
      package_id: packageId,
      title: baseJob.title,
      prompt: baseJob.brief,
      project_details: `${baseJob.brief}\n\nOrchestrator plan:\n${optionSummary}`,
      style: baseJob.selected_style,
      quality: baseJob.selected_quality,
      selected_quality: baseJob.selected_quality,
      features: baseJob.selected_features.join(", "),
      target_platform: baseJob.selected_platforms.join(", "),
      delivery_requirements: { requested: true, status: "pending", formats: baseJob.deliverables },
      workflow_mode: "assistant_orchestrated",
      agent_action: agentAction,
      legal_acceptance: false,
      orchestrator_note: "Prepared by Crelavo Orchestrator v1. Legal acceptance and final user confirmation are required before creating a production."
    };

    return {
      id: `${index + 1}-${slugify(baseJob.title)}`,
      ...baseJob,
      package_id: packageId,
      estimated_credits: growthService ? 0 : estimate.minimumSafeCredits,
      agent_action: agentAction,
      production_payload: growthService ? { ...productionPayload, service_route: "/dashboard/growth-intelligence", billing_policy: "service_or_credit_entitled_report_delivery", delivery_policy: "deliver_pdf_file_to_dashboard_when_user_has_active_entitlement_or_enough_credits", orchestrator_note: "Prepared as a Growth Intelligence service brief. Route the user to /dashboard/growth-intelligence for competitor URLs, monitoring cadence and report settings. The finished report is delivered as a dashboard file/PDF only for users with active service entitlement or enough credits." } : productionPayload
    };
  });

  const growthWorkflow = jobs.some((job) => job.production_payload?.billing_policy === "service_or_credit_entitled_report_delivery");
  const missingFields = cleanArray(draft?.missing_fields, jobs.flatMap((job) => job.required_materials).filter((item) => /own|song|audio|brand|location|exact|competitor|target|cadence|alert/i.test(item)).slice(0, 4));
  const deliveryPath = growthWorkflow
    ? ["Growth Intelligence dashboard", "Competitor URLs", "Public-signal settings", "Credit/entitlement check", "Report cadence", "Alert channels", "Dashboard PDF/file delivery"]
    : cleanArray(draft?.delivery_path, ["Brief", "Materials", "Production record", "Provider/API execution", "Preview", "Revision", "Final delivery"]);
  const totalEstimatedCredits = jobs.reduce((total, job) => total + job.estimated_credits, 0);

  return Response.json({
    orchestrator: "crelavo_orchestrator_v1",
    intent: growthWorkflow ? "growth_intelligence_service" : draft?.intent ?? (jobs.length > 1 ? "multi_production" : "single_production"),
    workflow_stage: growthWorkflow ? "route_to_growth_intelligence_dashboard" : draft?.workflow_stage ?? (missingFields.length ? "collect_critical_materials" : "ready_for_user_confirmation"),
    next_user_action: growthWorkflow ? "Open /dashboard/growth-intelligence, enter the monitoring brief, then deliver the finished PDF/report file in the dashboard after active entitlement or credit eligibility is confirmed." : draft?.next_user_action ?? (missingFields.length ? `Provide or skip: ${missingFields.join(", ")}` : "Review the plan, accept legal responsibility, then create the production."),
    missing_fields: missingFields,
    delivery_path: deliveryPath,
    jobs,
    total_estimated_credits: totalEstimatedCredits,
    api_gap_note: growthWorkflow ? "Growth Intelligence is a monthly service/dashboard brief workflow. It does not add normal credit balance, but the generated intelligence report should be delivered as a dashboard PDF/file only for users with active entitlement or enough credits." : "This endpoint plans and prepares production payloads. The next step is wiring confirmed jobs into /api/productions and /api/automation/start for real provider execution."
  });
}
