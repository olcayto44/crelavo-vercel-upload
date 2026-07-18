import { createAutomationJobId } from "./automation.ts";

type DemoProductionInput = {
  id: string;
  title?: string | null;
  prompt?: string | null;
  production_type?: string | null;
  package_id?: string | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
  materials_json?: Array<Record<string, any>> | null;
};

function clean(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function productionLabel(type: string) {
  const labels: Record<string, string> = {
    campaign: "campaign / e-commerce",
    ai_agent: "AI agent",
    localization: "localization",
    video: "AI video",
    animation: "animation",
    studio: "studio / series-film",
    cinematic_video: "cinematic video",
    video_clipping: "video clipping",
    avatar: "avatar design / avatar video",
    lip_sync: "lip sync video",
    voice_clone: "voice cloning",
    visual_clone: "visual clone / style clone",
    video_tools: "video tools",
    stickman_animation: "stickman animation",
    music_video: "music video",
    website: "website",
    saas: "SaaS",
    mobile_app: "mobile app",
    image: "visual",
    brand_kit: "brand kit",
    document_pack: "document",
    admin_project: "admin panel"
  };
  return labels[type] ?? "general production";
}

function primaryParts(type: string, signal = "") {
  const text = signal.toLocaleLowerCase("tr-TR");
  if (["video", "campaign", "animation", "studio", "cinematic_video", "video_clipping", "avatar", "lip_sync", "voice_clone", "visual_clone", "video_tools", "music_video", "stickman_animation", "localization"].includes(type)) {
    return ["Script", "Scene plan", "Voiceover", "Subtitles", "Final video"];
  }
  if (type === "website" && /e-ticaret|ecommerce|e-commerce|shopify|woocommerce|marketplace|mağaza|magaza|sepet|checkout/.test(text)) {
    return ["E-commerce sitemap", "Product listing and product page", "Cart/checkout flow", "Store admin screens", "Source ZIP + README"];
  }
  if (type === "website") return ["Sitemap", "Landing/business pages", "Responsive UI preview", "Source ZIP", "README + final project"];
  if (type === "saas") return ["SaaS information architecture", "Auth and customer panel", "Admin/billing screens", "Reusable component plan", "Source ZIP + README"];
  if (type === "mobile_app") return ["Mobile screen map", "Navigation flow", "Core screen UI preview", "Expo source plan", "README + final app package"];
  if (type === "admin_project") return ["Admin module map", "CRUD screens", "Role/permission plan", "Database notes", "Source ZIP + README"];
  if (["image", "brand_kit"].includes(type)) return ["Visual direction", "Variations", "Brand colors", "Delivery package"];
  if (type === "document_pack") return ["Content plan", "Sections", "PDF draft", "Delivery file"];
  return ["Brief", "Alternatives", "Delivery"];
}

export function buildDemoAutomationOutput(production: DemoProductionInput, jobId = createAutomationJobId()) {
  const type = clean(production.production_type, "general");
  const metadata = production.request_metadata ?? {};
  const input = production.input_json ?? {};
  const prompt = clean(production.prompt, clean(input.projectDetails, "Production started by the user from Assistant Workspace."));
  const style = clean(metadata.style, clean(input.style, "Crelavo premium"));
  const features = clean(metadata.features, clean(input.features, "Standard delivery"));
  const targetPlatform = clean(metadata.targetPlatform, clean(input.targetPlatform, "Dashboard delivery"));
  const projectWorkflow = metadata.projectWorkflow && typeof metadata.projectWorkflow === "object" ? metadata.projectWorkflow as Record<string, unknown> : {};
  const commerceWorkflow = metadata.commerceWorkflow && typeof metadata.commerceWorkflow === "object" ? metadata.commerceWorkflow as Record<string, unknown> : {};
  const projectSignal = [prompt, style, features, targetPlatform, projectWorkflow.modules, projectWorkflow.technicalStack, commerceWorkflow.storePlatform, commerceWorkflow.storeAssetGoal].map((item) => clean(item)).join(" ");
  const outputPlan = metadata.outputPlan ?? input.outputPlan ?? {};
  const outputCount = Math.max(1, Number(outputPlan.outputCount ?? 3) || 3);
  const materials = Array.isArray(production.materials_json) ? production.materials_json : [];
  const label = productionLabel(type);
  const isSeriesFilm = /dizi|film|fragman|senaryo|sahne/i.test(`${style} ${features} ${prompt}`);
  const isLongClipping = /kesitleme|uzun film|uzun dizi|sahne tespiti|hook/i.test(`${style} ${features} ${prompt}`);
  const parts = isLongClipping
    ? ["Content analysis", "Scene detection", "Hook selection", "Shorts/Reels/TikTok cuts", "Subtitles", "Cover/caption package"]
    : isSeriesFilm
      ? ["Script brief", "Scene plan", "Character breakdown", "Series/film bible", "Trailer cut", "Voice/music/subtitles"]
      : primaryParts(type, projectSignal);

  const modeTitle = isLongClipping ? "LONG FILM/SERIES CLIPPING" : isSeriesFilm ? "SERIES/FILM STUDIO" : label.toUpperCase();
  const script = [
    `${modeTitle} demo automation brief`,
    `Goal: ${prompt}`,
    `Style: ${style}`,
    `Features: ${features}`,
    `Delivery/platform: ${targetPlatform}`,
    projectWorkflow.modules ? `Project modules: ${String(projectWorkflow.modules)}` : "",
    projectWorkflow.technicalStack ? `Technical structure: ${String(projectWorkflow.technicalStack)}` : "",
    projectWorkflow.sourceDelivery ? `Source delivery: ${String(projectWorkflow.sourceDelivery)}` : "",
    commerceWorkflow.storePlatform ? `Store platform: ${String(commerceWorkflow.storePlatform)}` : "",
    commerceWorkflow.storeAssetGoal ? `E-commerce goal: ${String(commerceWorkflow.storeAssetGoal)}` : "",
    materials.length ? `Crelavo materials used: ${materials.map((item) => item.title ?? item.id).join(", ")}` : "No Crelavo material selected."
  ].filter(Boolean).join("\n");

  const isProjectDelivery = ["website", "saas", "mobile_app", "admin_project"].includes(type);
  const scenePlan = parts.map((part, index) => ({
    id: `part-${index + 1}`,
    title: part,
    status: index < 2 ? "ready" : "queued",
    description: isLongClipping
      ? `Social cut extraction notes from long-form content are ready for ${part}.`
      : isSeriesFilm
        ? `Series/film production workspace notes are ready for ${part}.`
        : isProjectDelivery
          ? `Page/screen and delivery plan for ${part} is ready with ${clean(projectWorkflow.technicalStack, "source package")} direction.`
          : `Automatic production notes for ${part} are ready in the ${style} direction.`
  }));

  const alternatives = Array.from({ length: outputCount }, (_, index) => ({
    id: `alt-${index + 1}`,
    title: index === 0 ? "Main suggestion" : `Alternative ${index + 1}`,
    status: "preview_ready",
    description: index === 0
      ? isLongClipping
        ? "Main clipping suggestion: strongest hook and first short video package suited to the platform."
        : isSeriesFilm
          ? "Main series/film suggestion: script, scene and trailer direction are prepared together."
          : `${label} output with ${style} as the main direction.`
      : isLongClipping
        ? `Social cut variation ${index + 1} with a different hook or scene selection.`
        : isSeriesFilm
          ? `Variation ${index + 1} with a different scene, character focus or trailer tone.`
          : `Variation ${index + 1} for ${label} with a different hook, format, voice or visual direction.`,
    preview_url: `/dashboard/productions/${production.id}?preview=alt-${index + 1}`,
    notes: `Demo preview card prepared for ${targetPlatform}.`
  }));

  return {
    automationMode: "demo_runner_then_provider_ready",
    jobId,
    currentStep: "Demo automation output ready",
    pipelineType: isLongClipping ? "long_film_clipping_demo_pipeline" : isSeriesFilm ? "series_film_studio_demo_pipeline" : `${type}_demo_pipeline`,
    script,
    scenePlan,
    parts: scenePlan,
    alternatives,
    finalVideoUrl: `/dashboard/productions/${production.id}?final=demo`,
    delivery_url: `/dashboard/productions/${production.id}?delivery=demo`,
    deliveryZipUrl: `/dashboard/productions/${production.id}?zip=demo`,
    readmeUrl: `/dashboard/productions/${production.id}?readme=demo`,
    revisionActions: isLongClipping
      ? ["Change hook", "Change clip range", "Choose another scene", "Fix subtitles", "Refresh cover/caption"]
      : isSeriesFilm
        ? ["Change scene", "Change character focus", "Change trailer tone", "Change voice/music", "Expand episode plan"]
        : ["Change scene", "Change voice", "Generate another alternative", "Create Shorts", "Repackage final"],
    providerStatus: "provider_not_connected_demo_ready",
    note: "Demo automation output was generated so the workspace does not stay empty until the real provider integration is connected."
  };
}
