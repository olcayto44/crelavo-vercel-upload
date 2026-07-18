import { adminRequiredResponse, getAdminEmail, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceDailyProductionBudget, enforceRouteBudget } from "@/lib/api-cost-guard";
import { createAutomationJobId, ecommerceAdAutomationSteps, ecommerceAdPipeline, initialAutomationSteps } from "@/lib/automation";
import { normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { validateProductionSafety } from "@/lib/content-safety";
import { legalAcceptanceSnapshot, productionResponsibilityText, rightsWarrantyText, LEGAL_ACCEPTANCE_VERSION } from "@/lib/legal";
import { platformMaterialsByIds } from "@/lib/platform-materials";
import { deliveryPackageForProduction } from "@/lib/delivery-package";
import { findConfiguredProductionPackage, normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { estimateProductionCost, getProductionPackage } from "@/lib/production";
import { estimateProductionProfit } from "@/lib/production-profit";
import { qualityProfileForProduction } from "@/lib/production-quality";
import { launchCapacityPolicy, renderQueuePolicyForPackage } from "@/lib/queue-policy";
import { customerEmailForProduction, sendProductionCompletionEmail } from "@/lib/production-email";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const adminEmail = searchParams.get("admin_email") ?? request.headers.get("x-admin-email");

    const supabase = supabaseAdmin();
    let query = supabase
      .from("production_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (adminEmail) {
      if (!isAdminRequest(request)) return adminRequiredResponse();
    } else {
      if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
      const verified = await requireVerifiedRequestUser(request, userId);
      if (!verified.ok) return verified.response;
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ productions: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load productions") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const adminEmail = getAdminEmail(request, body);
    const id = String(body.id ?? "").trim();

    if (!isAdminRequest(request, body)) return adminRequiredResponse();
    if (!id) return Response.json({ error: "Production id is required." }, { status: 400 });

    const allowedStatuses = ["pending", "queued", "waiting_provider_config", "in_production", "ready", "failed", "cancelled"];
    const status = String(body.status ?? "").trim();
    const generationStatus = String(body.generation_status ?? "").trim();
    const automationStatus = String(body.automation_status ?? "").trim();
    const previewUrl = String(body.preview_url ?? "").trim();
    const deliveryLink = String(body.delivery_link ?? "").trim();
    const deliveryZipUrl = String(body.delivery_zip_url ?? "").trim();
    const sourceFilesUrl = String(body.source_files_url ?? "").trim();
    const readmeUrl = String(body.readme_url ?? "").trim();
    const providerStatus = String(body.provider_status ?? "").trim();
    const providerProgressRaw = body.provider_progress === "" || body.provider_progress === undefined || body.provider_progress === null ? null : Number(body.provider_progress);
    const providerProgress = Number.isFinite(providerProgressRaw) ? Math.max(0, Math.min(100, Number(providerProgressRaw))) : null;

    const { data: existing, error: existingError } = await supabaseAdmin()
      .from("production_requests")
      .select("output_json")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    const existingOutput = existing?.output_json && typeof existing.output_json === "object" ? existing.output_json as Record<string, unknown> : {};

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      generation_status: generationStatus || (providerStatus ? providerStatus : "operations_update"),
      automation_status: automationStatus || (status === "ready" ? "completed" : status === "in_production" ? "running" : undefined),
      preview_url: previewUrl || null,
      delivery_link: deliveryLink || deliveryZipUrl || previewUrl || null,
      delivery_zip_url: deliveryZipUrl || deliveryLink || null,
      source_files_url: sourceFilesUrl || null,
      readme_url: readmeUrl || null,
      admin_notes: String(body.admin_notes ?? "").trim() || null,
      output_json: {
        ...existingOutput,
        updatedBy: adminEmail,
        updatedAt: new Date().toISOString(),
        deliveryReady: status === "ready" || Boolean(deliveryLink || deliveryZipUrl),
        previewUrl,
        preview_url: previewUrl,
        deliveryUrl: deliveryLink || deliveryZipUrl,
        delivery_url: deliveryLink || deliveryZipUrl,
        deliveryZipUrl,
        delivery_zip_url: deliveryZipUrl,
        sourceFilesUrl,
        source_files_url: sourceFilesUrl,
        readmeUrl,
        readme_url: readmeUrl,
        providerStatus: providerStatus || existingOutput.providerStatus,
        providerProgress: providerProgress ?? existingOutput.providerProgress,
        currentStep: providerStatus || existingOutput.currentStep || generationStatus || status || "operations_update"
      }
    };
    Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined ? delete updatePayload[key] : undefined);

    if (allowedStatuses.includes(status)) updatePayload.status = status;

    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    let completionEmailResult: unknown = null;
    if (data?.status === "ready") {
      completionEmailResult = { skipped: true, reason: "Production update did not return a user id." };
      try {
        if (data.user_id) {
          const customerEmail = await customerEmailForProduction(String(data.user_id));
          completionEmailResult = await sendProductionCompletionEmail({
            to: customerEmail,
            title: String(data.title ?? data.id ?? "Production"),
            productionId: String(data.id),
            deliveryUrl: data.delivery_link ?? data.delivery_zip_url ?? data.preview_url ?? null,
            previewUrl: data.preview_url ?? null,
            sourceFilesUrl: data.source_files_url ?? null,
            readmeUrl: data.readme_url ?? null
          });
        }
      } catch (emailError) {
        completionEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send production completion email") };
      }
    }

    if (data?.id && completionEmailResult) {
      await supabaseAdmin()
        .from("production_requests")
        .update({ output_json: { ...(data.output_json ?? {}), completionEmailResult } })
        .eq("id", data.id);
    }

    return Response.json({ production: data && completionEmailResult ? { ...data, output_json: { ...(data.output_json ?? {}), completionEmailResult } } : data, completionEmailResult });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not update production request") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `production:create:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const prompt = String(body.prompt ?? "").trim();
  const productionType = String(body.production_type ?? "").trim();
  const packageId = String(body.package_id ?? "").trim();
  const needsImages = Boolean(body.needs_images);
  const revisionBuffer = Boolean(body.revision_buffer);
  const requestedOutputCount = Number(body.output_count ?? 1);
  const outputCount = [1, 3, 5].includes(requestedOutputCount) ? requestedOutputCount : 1;
  let selectedPackage = getProductionPackage(packageId);

  if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
  const routeBudget = enforceRouteBudget(request, { route: "production:create", userId, ipLimit: 20, userLimit: 10, windowMs: 15 * 60 * 1000 });
  if (!routeBudget.ok) return routeBudget.response;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  if (!title || !prompt || !productionType || !packageId) {
    return Response.json({ error: "Production type, package, title and prompt are required." }, { status: 400 });
  }
  const suspicious = rejectSuspiciousText([title, prompt, body.project_details, body.features, body.material_links, body.song_audio_link, body.music_reference_links, body.voiceover_reference_link]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
  if (!Boolean(body.legal_acceptance)) {
    return Response.json({ error: "You must accept the copyright, brand, face, voice and content responsibility agreement before starting production." }, { status: 400 });
  }

  const safety = validateProductionSafety([
    title,
    prompt,
    body.project_details,
    body.features,
    body.material_links,
    body.song_audio_link,
    body.music_reference_links,
    body.voiceover_reference_link
  ]);
  if (!safety.ok) {
    return Response.json({ error: safety.message }, { status: 400 });
  }

  const uploadedMaterialsSource: unknown[] = Array.isArray(body.uploaded_materials) ? body.uploaded_materials : [];
  const uploadedMaterials = uploadedMaterialsSource
    .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      type: "user_upload",
      reference_type: String(item.reference_type ?? "user_material"),
      title: String(item.title ?? "Uploaded material"),
      file_url: String(item.file_url ?? ""),
      storage_bucket: String(item.storage_bucket ?? ""),
      storage_path: String(item.storage_path ?? ""),
      content_type: String(item.content_type ?? ""),
      size_bytes: Number(item.size_bytes ?? 0) || 0,
      kind: String(item.kind ?? "file"),
      rights_confirmed: Boolean(item.rights_confirmed ?? body.legal_acceptance),
      usage_tags: Array.isArray(item.usage_tags) ? item.usage_tags.map(String) : ["user-upload"]
    }))
    .filter((item) => item.file_url.length > 0);
  const musicVideoMaterialGroups = Boolean(body.music_video_material_groups) && typeof body.music_video_material_groups === "object"
    ? body.music_video_material_groups as Record<string, unknown>
    : {};
  const dramaDetails = Boolean(body.drama_details) && typeof body.drama_details === "object"
    ? body.drama_details as Record<string, unknown>
    : {};
  const droneDetails = Boolean(body.drone_details) && typeof body.drone_details === "object"
    ? body.drone_details as Record<string, unknown>
    : {};
  const liveSalesAgentDetails = Boolean(body.live_sales_agent_details) && typeof body.live_sales_agent_details === "object"
    ? body.live_sales_agent_details as Record<string, unknown>
    : {};
  const userReferenceMaterials = [
    { type: "user_material_links", label: "User material links", value: String(body.material_links ?? "").trim() },
    { type: "user_song_audio", label: "User song/audio link", value: String(body.song_audio_link ?? "").trim() },
    { type: "user_music_reference", label: "User music reference links", value: String(body.music_reference_links ?? "").trim() },
    { type: "user_voiceover_reference", label: "User voice-over reference", value: String(body.voiceover_reference_link ?? "").trim() }
  ].filter((item) => item.value.length > 0).map((item) => ({
    type: "user_reference",
    reference_type: item.type,
    title: item.label,
    file_url: item.value,
    rights_confirmed: Boolean(body.legal_acceptance),
    usage_tags: ["user-provided", "rights-confirmed"]
  }));

  const legalSnapshot = legalAcceptanceSnapshot({ productionType, packageId, title, userEmail: String(body.user_email ?? "") });
  const selectedMaterialIds = Array.isArray(body.selected_material_ids) ? body.selected_material_ids.map(String) : [];
  const selectedMaterials = platformMaterialsByIds(selectedMaterialIds);
  if (selectedMaterials.length !== selectedMaterialIds.length) {
    return Response.json({ error: "Only active materials provided by Crelavo can be selected." }, { status: 400 });
  }
  const materials = [
    ...selectedMaterials.map((material) => ({
      type: "platform_material",
      id: material.id,
      title: material.title,
      category: material.category,
      file_url: material.fileUrl,
      preview_url: material.previewUrl,
      usage_tags: material.usageTags
    })),
    ...uploadedMaterials,
    ...userReferenceMaterials
  ];
  const materialBytes = materials.reduce((total, material) => total + (Number("size_bytes" in material ? material.size_bytes : 0) || 0), 0);
  const providerTestMode = Boolean(body.provider_test_mode);
  const deliveryLevel = String(body.delivery_level ?? "").trim() || (String(body.features ?? "").toLowerCase().includes("working source") ? "working_source_package" : "production_package");
  const deliveryRequirements = body.delivery_requirements && typeof body.delivery_requirements === "object" ? body.delivery_requirements : {
    requested: false,
    status: "pending",
    formats: ["dashboard_delivery"]
  };
  const { data: deliveryRateRow } = await supabaseAdmin()
    .from("platform_configs")
    .select("value")
    .eq("key", "delivery_credit_rates")
    .maybeSingle();
  const { data: packageConfigRow } = await supabaseAdmin()
    .from("platform_configs")
    .select("value")
    .eq("key", PACKAGE_CONFIG_KEY)
    .maybeSingle();
  const deliveryCreditRates = normalizeDeliveryCreditRates(deliveryRateRow?.value);
  const packageConfig = normalizePackageConfig(packageConfigRow?.value);
  const configuredProductionPackage = findConfiguredProductionPackage(packageConfig, packageId);
  if (packageConfigRow?.value && !configuredProductionPackage) return Response.json({ error: "Selected package is not active in admin package config." }, { status: 400 });
  selectedPackage = configuredProductionPackage ?? selectedPackage;
  if (!selectedPackage) return Response.json({ error: "Selected package was not found." }, { status: 400 });
  const costEstimate = estimateProductionCost(packageId, {
    needsImages,
    revisionBuffer,
    outputCount,
    quality: String(body.quality ?? body.selected_quality ?? ""),
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    features: String(body.features ?? ""),
    productionType,
    materialCount: materials.length,
    materialBytes,
    deliveryRequirements,
    deliveryCreditRates,
    packageCatalog: packageConfig.productionPackages
  });
  const singleOutputCredits = costEstimate.singleOutputCredits;
  const estimatedCredits = costEstimate.minimumSafeCredits;
  const profitEstimate = estimateProductionProfit({
    packageId,
    productionType,
    reservedCredits: estimatedCredits,
    outputCount,
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    quality: String(body.quality ?? body.selected_quality ?? ""),
    features: String(body.features ?? ""),
    materialCount: materials.length,
    materialBytes,
    providerTestMode
  });
  const automationJobId = createAutomationJobId();
  const workflowMode = String(body.workflow_mode ?? "").trim() || "general";
  const isProductAdVideo = packageId === "campaign_product_ad_video";
  const pipeline = isProductAdVideo ? ecommerceAdPipeline() : null;
  const automationSteps = isProductAdVideo ? ecommerceAdAutomationSteps() : initialAutomationSteps();
  const productUrl = "";
  const ecommerceContext = isProductAdVideo ? {
    productUrl,
    campaignGoal: body.campaign_goal ?? "Sales conversion",
    channels: body.campaign_channels ?? "TikTok, Instagram Reels, Meta Ads",
    publishingPlan: body.publishing_plan ?? "Preview first, then one-click export",
    abTestFocus: body.ab_test_focus ?? "Hook, CTA, subtitle style and first 3 seconds",
    adFormula: "Hook + Problem + Solution + Proof + Offer + CTA",
    targetDurationSeconds: Number(body.output_duration_seconds ?? 30) || 30,
    voiceDirection: body.voice_direction ?? "Energetic, trustworthy social ad voice",
    subtitleStyle: body.subtitle_style ?? "Animated social captions",
    revisionActions: ["Change subtitle color", "Switch to male voice", "Switch to female voice", "Change CTA", "Regenerate hook"],
    exportTargets: ["TikTok", "Instagram Reels", "Facebook/Meta Ads", "YouTube Shorts", "LinkedIn", "X/Twitter", "Shopify", "Amazon", "Trendyol", "WooCommerce"],
    providerPipeline: pipeline
  } : null;
  const deliveryPackage = deliveryPackageForProduction({
    productionType,
    packageId,
    features: String(body.features ?? ""),
    storePlatform: String(body.store_platform ?? ""),
    sourceDelivery: String(body.source_delivery ?? "")
  });
  const productionQuality = qualityProfileForProduction(productionType, packageId);
  const referenceLinkSafety = "Shared links, competitor websites, product pages, marketplace listings and reference designs are used only for analysis, brief extraction, structure understanding and inspiration. Crelavo does not reproduce or clone third-party websites, stores, applications, layouts, text, branding, UI, code, product pages or creative assets one-to-one. Final outputs must be original, adapted to the user's own brand, content and declared production scope.";
  const publishTargets = Array.isArray(body.publish_targets) ? body.publish_targets.map(String) : [];
  const renderQueuePolicy = renderQueuePolicyForPackage(packageId);
  const capacityPolicy = launchCapacityPolicy();
  const deliveryTargets = {
    publishTargets: publishTargets.length > 0 ? publishTargets : ["dashboard_delivery"],
    connectedAccountTargets: String(body.connected_account_targets ?? "").trim(),
    connectedStoreTargets: String(body.connected_store_targets ?? "").trim(),
    adminInProductionLoop: false,
    userCanPublishAfterReady: true
  };

  const costGuardConfig = apiCostGuardConfig();
  const outputPlan = {
    outputCount,
    singleOutputCredits,
    totalReservedCredits: estimatedCredits,
    packageCredits: costEstimate.packageCredits,
    providerRiskLevel: costEstimate.providerRiskLevel,
    costNotes: costEstimate.costNotes,
    profitEstimate,
    costGuard: {
      singleProductionCreditLimit: costGuardConfig.singleProductionCreditLimit,
      dailyProductionCreditLimit: costGuardConfig.dailyProductionCreditLimit,
      dailyProductionCountLimit: costGuardConfig.dailyProductionCountLimit
    },
    variationStrategy: outputCount === 1 ? "single_best_output" : "multi_variant_hooks_styles_scenes"
  };

  const socialWorkflow = {
    platforms: String(body.social_platforms ?? "").trim(),
    publishType: String(body.social_publish_type ?? "").trim(),
    captionPlan: String(body.social_caption_plan ?? "").trim(),
    connectedAccountTargets: String(body.connected_account_targets ?? "").trim()
  };

  const commerceWorkflow = {
    storePlatform: String(body.store_platform ?? "").trim(),
    storeAssetGoal: String(body.store_asset_goal ?? "").trim(),
    productPageNotes: String(body.product_page_notes ?? "").trim(),
    connectedStoreTargets: String(body.connected_store_targets ?? "").trim()
  };

  const projectWorkflow = {
    modules: String(body.project_modules ?? "").trim(),
    technicalStack: String(body.technical_stack ?? "").trim(),
    sourceDelivery: String(body.source_delivery ?? "").trim(),
    deliveryLevel
  };

  const isPreviewOnlyProduction = body.preview_only === true || body.previewOnly === true || String(body.access_mode ?? "").toLowerCase() === "preview";
  const previewAccess = {
    previewOnly: isPreviewOnlyProduction,
    downloadAccess: isPreviewOnlyProduction ? "closed" : "open",
    previewVideoSeconds: isPreviewOnlyProduction ? 10 : null,
    watermarkRequired: isPreviewOnlyProduction,
    note: isPreviewOnlyProduction ? "24-hour preview access: downloads closed until the selected subscription starts." : "Full delivery access follows payment, credit and package eligibility."
  };

  const requestMetadata = {
    productionType,
    packageId,
    packageName: selectedPackage.name,
    workflowMode,
    deliveryLevel,
    style: body.style ?? "",
    targetPlatform: body.target_platform ?? "",
    features: body.features ?? "",
    projectDetails: body.project_details ?? "",
    ecommerceContext,
    socialWorkflow,
    commerceWorkflow,
    projectWorkflow,
    musicVideoMaterialGroups,
    dramaDetails,
    droneDetails,
    liveSalesAgentDetails,
    audienceContext: {
      targetCountry: body.target_country ?? "",
      targetCity: body.target_city ?? "",
      environmentPreset: body.environment_preset ?? "",
      environment: body.target_environment ?? "",
      culture: body.cultural_context ?? "",
      beliefContext: body.belief_context ?? ""
    },
    materialCount: materials.length,
    materialBytes,
    outputPlan,
    deliveryTargets,
    deliveryPackage,
    deliveryRequirements,
    previewAccess,
    productionQuality,
    referenceLinkSafety,
    renderQueuePolicy,
    capacityPolicy,
    automationMode: "fully_automatic",
    providerTestMode,
    providerTestTarget: providerTestMode ? "low_cost_5s_720p_single_output" : null
  };
  const inputJson = {
    packageName: selectedPackage.name,
    packageDescription: selectedPackage.description,
    deliverables: selectedPackage.deliverables,
    needsImages,
    revisionBuffer,
    projectDetails: body.project_details ?? "",
    targetPlatform: body.target_platform ?? "",
    style: body.style ?? "",
    features: body.features ?? "",
    adminPanel: body.admin_panel ?? false,
    workflowMode,
    ecommerceContext,
    socialWorkflow,
    commerceWorkflow,
    projectWorkflow,
    musicVideoMaterialGroups,
    dramaDetails,
    droneDetails,
    liveSalesAgentDetails,
    automationMode: "fully_automatic",
    providerTestMode,
    providerTestTarget: providerTestMode ? "low_cost_5s_720p_single_output" : null,
    automationPipeline: pipeline,
    outputPlan,
    deliveryTargets,
    deliveryPackage,
    deliveryRequirements,
    previewAccess,
    productionQuality,
    referenceLinkSafety,
    renderQueuePolicy,
    capacityPolicy,
    deliveryStandard: "Ready-to-use outputs are prepared and delivered through the customer dashboard. Social posts, ad copy, videos, files or source packages should be usable without admin production work; manual export is available now, while direct connected publishing to accounts/stores remains post-launch/API dependent.",
    customerCanSee: ["request brief", "submitted materials", "automation status", "generated outputs", "final delivery link", "revision buttons", "multi-platform social and store export actions"]
  };


  try {
    const supabase = supabaseAdmin();
    const dailyBudget = await enforceDailyProductionBudget(supabase, { userId, estimatedCredits });
    if (!dailyBudget.ok) return dailyBudget.response;

    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUser.user) {
      return Response.json({ error: "User could not be verified. Please sign in again." }, { status: 401 });
    }
    if (!authUser.user.email_confirmed_at && !authUser.user.confirmed_at) {
      return Response.json({ error: "Production cannot start before email confirmation. Please open the confirmation link sent to your inbox." }, { status: 403 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: String(body.user_email ?? ""), full_name: String(authUser.user.user_metadata?.full_name ?? "") || null, role: "user" }, { onConflict: "id" });

    if (profileError) throw profileError;

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;
    const available = balance - reserved;

    if (available < estimatedCredits) {
      return Response.json({
        error: `Not enough credits. Required: ${estimatedCredits}, available: ${available}.`,
        redirect: "/dashboard/credits"
      }, { status: 402 });
    }

    const { error: reserveError } = await supabase
      .from("credit_balances")
      .upsert({ user_id: userId, balance, reserved: reserved + estimatedCredits, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    if (reserveError) throw reserveError;

    const { error: reserveEventError } = await supabase
      .from("credit_events")
      .insert({ user_id: userId, type: "reserve", amount: estimatedCredits, note: `Reserved for ${selectedPackage.name}: ${title}` });

    if (reserveEventError) throw reserveEventError;

    const { data, error } = await supabase
      .from("production_requests")
      .insert({
        user_id: userId,
        production_type: productionType,
        package_id: packageId,
        title,
        prompt,
        status: "queued",
        generation_status: "automation_queued",
        automation_status: "queued",
        automation_job_id: automationJobId,
        automation_steps: automationSteps,
        request_metadata: requestMetadata,
        materials_json: materials,
        estimated_credits: estimatedCredits,
        reserved_credits: estimatedCredits,
        input_json: inputJson,
        legal_acceptance_snapshot: legalSnapshot,
        output_json: {
          automationMode: "fully_automatic",
          jobId: automationJobId,
          currentStep: isProductAdVideo ? "Product ad video queued" : "Request queued",
          steps: automationSteps,
          pipelineType: isProductAdVideo ? "ecommerce_product_ad_video" : "general_production",
          providerPipeline: pipeline,
          expectedDeliverySeconds: isProductAdVideo ? "45-60" : null,
          deliveryPackage
        },
        admin_notes: "Automatic production queued. Admin monitors payments, failed jobs, support emails and unusual requests only."
      })
      .select("*")
      .single();

    if (error) throw error;

    const { data: legalAcceptance, error: legalError } = await supabase
      .from("legal_acceptances")
      .insert({
        user_id: userId,
        production_id: data.id,
        acceptance_type: "production_liability",
        version: LEGAL_ACCEPTANCE_VERSION,
        accepted: true,
        ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
        production_type: productionType,
        package_id: packageId,
        title,
        responsibility_text: productionResponsibilityText,
        rights_warranty_text: rightsWarrantyText,
        metadata: legalSnapshot
      })
      .select("id")
      .single();

    if (legalError) throw legalError;

    const { data: productionWithLegal, error: legalUpdateError } = await supabase
      .from("production_requests")
      .update({ legal_acceptance_id: legalAcceptance.id })
      .eq("id", data.id)
      .select("*")
      .single();

    if (legalUpdateError) throw legalUpdateError;

    return Response.json({ production: productionWithLegal, automation_job_id: automationJobId, automation_status: "queued" });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not create production request") }, { status: 500 });
  }
}
