import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { automaticDeliveryLinks } from "@/lib/automatic-delivery-builder";
import { createAutomationJobId, ecommerceAdPipeline, runningAutomationSteps, runningEcommerceAdAutomationSteps } from "@/lib/automation";
import { buildProviderPreflight } from "@/lib/automation-preflight";
import { buildDemoAutomationOutput } from "@/lib/demo-automation";
import { runEcommerceAdPipeline } from "@/lib/providers/ecommerce-ad";
import { genericVideoProviderChain, runGenericVideoPipeline } from "@/lib/providers/generic-video";
import { ProviderConfigError } from "@/lib/providers/types";
import { buildProjectDeliveryOutput, isAutomaticProjectDelivery } from "@/lib/project-delivery";
import { buildOutputRegistry } from "@/lib/output-registry";
import { isActiveProviderJob, providerLifecycleFromJobs } from "@/lib/provider-jobs";
import { providerReadinessSummary } from "@/lib/provider-readiness";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { isVideoLikeProductionType, launchCapacityPolicy, renderQueuePolicyForPackage, safeActiveVideoJobLimit } from "@/lib/queue-policy";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function ecommerceContextFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const context = record.ecommerceContext;
  if (!context || typeof context !== "object") return null;
  return context as Record<string, unknown>;
}

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

async function requireAutomationAccess(request: Request, body: Record<string, unknown>, production: { user_id?: string | null }) {
  if (isAdminRequest(request, body)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  const userId = String(body.user_id ?? productionUserId).trim();
  if (!productionUserId || !userId || userId !== productionUserId) return { ok: false as const, response: adminRequiredResponse() };
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

async function selectProductionForAutomation(supabase: ReturnType<typeof supabaseAdmin>, productionId: string) {
  const result = await supabase
    .from("production_requests")
    .select("id, user_id, title, prompt, production_type, package_id, output_json")
    .eq("id", productionId)
    .single();

  return {
    data: result.data ? { ...result.data, output_json: result.data.output_json ?? {} } : null,
    error: result.error
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const productionId = String(body.production_id ?? "").trim();
    const guardConfig = apiCostGuardConfig();
    const routeBudget = enforceRouteBudget(request, { route: "automation:start", userId: String(body.user_id ?? ""), ipLimit: guardConfig.automationStartIpLimit, userLimit: guardConfig.automationStartUserLimit, windowMs: 15 * 60 * 1000 });
    if (!routeBudget.ok) return routeBudget.response;

    if (!productionId) {
      return Response.json({ error: "production_id is required." }, { status: 400 });
    }

    const jobId = createAutomationJobId();
    const now = new Date().toISOString();
    const supabase = supabaseAdmin();

    const { data: currentProduction, error: currentError } = await selectProductionForAutomation(supabase, productionId);

    if (currentError) throw currentError;
    if (!currentProduction) throw new Error("Production not found");
    const access = await requireAutomationAccess(request, body, currentProduction);
    if (!access.ok) return access.response;

    const existingOutput = currentProduction.output_json && typeof currentProduction.output_json === "object" ? currentProduction.output_json as Record<string, unknown> : {};
    const existingCreditResolution = existingOutput.creditResolution && typeof existingOutput.creditResolution === "object" ? existingOutput.creditResolution as Record<string, unknown> : null;
    if (existingCreditResolution?.status === "refunded_reserved") {
      return Response.json({ error: "Reserved credits were already refunded for this failed production. Create a new production before starting another provider job." }, { status: 409 });
    }
    const requestMetadata = existingOutput.requestMetadata && typeof existingOutput.requestMetadata === "object" ? existingOutput.requestMetadata as Record<string, unknown> : {};
    const inputJson = requestMetadata.inputJson && typeof requestMetadata.inputJson === "object"
      ? requestMetadata.inputJson as Record<string, unknown>
      : existingOutput.inputJson && typeof existingOutput.inputJson === "object"
        ? existingOutput.inputJson as Record<string, unknown>
        : {};
    const productionType = String(currentProduction?.production_type ?? "");
    const packageId = String(currentProduction?.package_id ?? "");
    const renderQueuePolicy = renderQueuePolicyForPackage(packageId);
    const capacityPolicy = launchCapacityPolicy();
    const deliveryLinks = automaticDeliveryLinks(productionId);
    const outputRegistryBase = {
      ...currentProduction,
      delivery_link: deliveryLinks.deliveryLink,
      delivery_zip_url: deliveryLinks.deliveryZipUrl,
      source_files_url: deliveryLinks.sourceFilesUrl,
      readme_url: deliveryLinks.readmeUrl,
      preview_url: deliveryLinks.previewUrl
    };
    const providerPreflight = buildProviderPreflight({
      productionType,
      requestMetadata,
      inputJson,
      videoProvider: process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "replicate",
      replicateModel: process.env.REPLICATE_MODEL
    });
    const providerReadiness = providerReadinessSummary(productionType, packageId);
    if (isActiveProviderJob(existingOutput.visualJob) || isActiveProviderJob(existingOutput.renderJob)) {
      return Response.json({
        job_id: existingOutput.jobId ?? null,
        production: currentProduction,
        already_running: true,
        message: "An active provider job already exists for this production; no new job was opened."
      });
    }

    if (!providerReadiness.canStartRealProvider) {
      const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
      const waitingLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: existingOutput }, {});
      const waitingOutput = {
        ...demoOutput,
        providerPreflight,
        providerReadiness,
        providerStatus: "waiting_provider_config",
        providerLifecycle: { visual: waitingLifecycle.visual, render: waitingLifecycle.render },
        automaticDeliveryLinks: deliveryLinks,
        outputRegistry: waitingLifecycle.outputRegistry,
        currentStep: "Waiting for provider/API configuration",
        userMessage: providerReadiness.userMessage,
        workflowState: buildProductionWorkflowState({ ...currentProduction, status: "queued", automation_status: "waiting_provider_config", generation_status: "waiting_provider_config", output_json: { ...demoOutput, providerReadiness } })
      };
        const { data: waitingProduction, error: waitingError } = await supabase
          .from("production_requests")
          .update({
            status: "queued",
            generation_status: "waiting_provider_config",
            output_json: waitingOutput,
            admin_notes: providerReadiness.userMessage,
            updated_at: now
          })
        .eq("id", productionId)
        .select("*")
        .single();
      if (waitingError) throw waitingError;
      return Response.json({ job_id: jobId, production: waitingProduction, provider_readiness: providerReadiness, waiting_provider_config: true });
    }

    const activeJobLimit = safeActiveVideoJobLimit();
    if (isVideoLikeProductionType(productionType)) {
        const { count: activeVideoJobs, error: activeVideoJobsError } = await supabase
          .from("production_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["queued", "in_production"])
          .in("production_type", ["video", "campaign", "music_video", "stickman_animation", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "studio", "drama", "cinematic_video", "video_tools", "video_clipping", "avatar", "lip_sync", "localization", "cultural_localization"]);
        if (activeVideoJobsError) throw activeVideoJobsError;
      if ((activeVideoJobs ?? 0) >= activeJobLimit) {
        const queuedOutput = {
          ...existingOutput,
          automationMode: "fully_automatic",
          jobId: existingOutput.jobId ?? null,
          queueStatus: "waiting_for_video_provider_slot",
          currentStep: "Queued for render slot",
          renderQueuePolicy,
          capacityPolicy,
          activeVideoJobs,
          activeJobLimit,
          userMessage: renderQueuePolicy.userMessage,
          workflowState: buildProductionWorkflowState({ ...currentProduction, status: "queued", automation_status: "queued", generation_status: "queued_for_render_slot", output_json: existingOutput })
        };
        const { data: queuedProduction, error: queueError } = await supabase
          .from("production_requests")
          .update({
            status: "queued",
            generation_status: "queued_for_render_slot",
            output_json: queuedOutput,
            admin_notes: `Queued by ${renderQueuePolicy.label}. Active video provider jobs: ${activeVideoJobs}/${activeJobLimit}.`,
            updated_at: now
          })
          .eq("id", productionId)
          .select("*")
          .single();
        if (queueError) throw queueError;
        return Response.json({
          queued: true,
          production: queuedProduction,
          render_queue_policy: renderQueuePolicy,
          active_video_jobs: activeVideoJobs,
          active_job_limit: activeJobLimit,
          message: renderQueuePolicy.userMessage
        });
      }
    }

    const isProjectDelivery = isAutomaticProjectDelivery(productionType, packageId);
    const isProductAdVideo = currentProduction?.package_id === "campaign_product_ad_video" || currentProduction?.production_type === "campaign";
    if (isProjectDelivery && !isProductAdVideo) {
      const projectOutput = buildProjectDeliveryOutput(currentProduction, jobId);
      const { data: projectProduction, error: projectError } = await supabase
        .from("production_requests")
        .update({
          status: "ready",
          automation_status: "ready",
          generation_status: "project_delivery_ready",
          preview_url: projectOutput.previewUrl,
          delivery_link: projectOutput.deliveryLink,
          delivery_zip_url: projectOutput.deliveryZipUrl,
          source_files_url: projectOutput.sourceFilesUrl,
          output_json: projectOutput,
          admin_notes: "Automatic project/source delivery package generated. This item is no longer a semi-manual backlog task.",
          updated_at: now
        })
        .eq("id", productionId)
        .select("*")
        .single();
      if (projectError) throw projectError;
      return Response.json({ job_id: jobId, production: projectProduction, project_delivery_ready: true });
    }

    const pipeline = isProductAdVideo ? ecommerceAdPipeline() : null;
    const steps = isProductAdVideo ? runningEcommerceAdAutomationSteps() : runningAutomationSteps();
    const updatePayload: Record<string, unknown> = {
      status: "in_production",
      generation_status: isProductAdVideo ? "scrape_analyze_running" : "strategy_running",
      output_json: {
        automationMode: "fully_automatic",
        jobId,
        currentStep: isProductAdVideo ? "Product scraping and GPT-4o ad analysis" : "AI strategy and brief analysis",
        pipelineType: isProductAdVideo ? "ecommerce_product_ad_video" : "general_production",
        providerPipeline: pipeline,
        providerPreflight,
        renderQueuePolicy,
        capacityPolicy,
        activeJobLimit,
        automationStatus: "running",
        automationSteps: steps,
        chain: pipeline?.chain ?? null,
          note: isProductAdVideo
            ? "Backend orchestration will scrape the product link, create a GPT-4o ad script, generate visuals, create ElevenLabs voice-over, time subtitles with Whisper and render the final MP4 with Shotstack/Remotion."
            : "Provider pipeline will generate strategy, assets, package and delivery link automatically.",
          workflowState: buildProductionWorkflowState({ ...currentProduction, status: "in_production", automation_status: "running", generation_status: isProductAdVideo ? "scrape_analyze_running" : "strategy_running", output_json: existingOutput })
        },

      updated_at: now,
      admin_notes: isProductAdVideo
        ? "Product ad automation started. Admin monitors provider failures, payments, support emails and unusual requests only."
        : "Automatic workflow started. Admin monitors failed jobs, payments, support emails and unusual requests only."
    };

    if (isProductAdVideo) {
      updatePayload.approval_status = "waiting";
      updatePayload.approval_question = "Which creative direction should automation use before starting ad production?";
      updatePayload.approval_options = [
        { label: "Best-selling ad formula", description: "Hook, problem, solution, proof and CTA structure.", extraCredits: 0 },
        { label: "Premium brand tone", description: "More upscale visual language and a trust-building voice tone.", extraCredits: 800 },
        { label: "Aggressive TikTok sales angle", description: "Strong first-three-seconds hook and fast editing rhythm.", extraCredits: 600 }
      ];
      updatePayload.extra_credit_required = 0;
    }

    const { data, error } = await supabase
      .from("production_requests")
      .update(updatePayload)
      .eq("id", productionId)
      .select("*")
      .single();

    if (error) throw error;

    if (isProductAdVideo) {
      const ecommerceContext = ecommerceContextFrom(requestMetadata) ?? ecommerceContextFrom(inputJson) ?? ecommerceContextFrom(existingOutput);
      const productUrl = String(ecommerceContext?.productUrl ?? "").trim();

      if (!productUrl) {
        const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
          .update({
            status: "in_production",
            generation_status: "preview_ready",
            output_json: {
              ...demoOutput,
              automationStatus: "demo_ready",
              automaticDeliveryLinks: deliveryLinks,
              outputRegistry: buildOutputRegistry({ ...outputRegistryBase, output_json: demoOutput }),
              previewUrl: deliveryLinks.previewUrl,
              deliveryLink: deliveryLinks.deliveryLink,
              deliveryZipUrl: deliveryLinks.deliveryZipUrl,
              sourceFilesUrl: deliveryLinks.sourceFilesUrl,
              readmeUrl: deliveryLinks.readmeUrl
            },
            admin_notes: "Demo automation filled workspace because no external product URL/provider input was supplied.",
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();
        if (demoError) throw demoError;
        return Response.json({ job_id: jobId, production: demoProduction, demo: true });
      }

      try {
        const result = await runEcommerceAdPipeline({
          productionId,
          jobId,
          productUrl,
          campaignGoal: String(ecommerceContext?.campaignGoal ?? "Sales conversion"),
          channels: String(ecommerceContext?.channels ?? "TikTok, Instagram Reels, Meta Ads"),
          targetDurationSeconds: Number(ecommerceContext?.targetDurationSeconds ?? 30) || 30,
          voiceDirection: String(ecommerceContext?.voiceDirection ?? "Energetic, trustworthy social ad voice"),
          subtitleStyle: String(ecommerceContext?.subtitleStyle ?? "Animated social captions"),
          style: typeof ecommerceContext?.style === "string" ? ecommerceContext.style : undefined,
          targetCountry: undefined,
          targetCity: undefined,
          culture: undefined
        });

        const providerOutput = {
          automationMode: "fully_automatic",
          automationStatus: "running",
          jobId,
          currentStep: "Visual/video provider job created",
          pipelineType: "ecommerce_product_ad_video",
          providerPipeline: pipeline,
          product: result.product,
          brain: result.brain,
          visualJob: result.visualJob,
          voiceAudioUrl: result.voiceAudioUrl,
          subtitleUrl: result.subtitleUrl,
          renderJob: result.renderJob ?? null,
          renderStatus: result.renderJob ? "render_job_created" : "waiting_for_visual_output",
          revisionActions: ["Change subtitle color", "Switch voice", "Change CTA", "Regenerate hook"],
          exportTargets: ["TikTok", "Meta Ads", "Instagram Reels"],
          finalVideoUrl: null
        };
        const providerLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: providerOutput }, { visualJob: result.visualJob, renderJob: result.renderJob });

        const { data: completedProduction, error: completeError } = await supabase
          .from("production_requests")
          .update({
            generation_status: result.renderJob ? "render_job_created" : "provider_visual_job_created",
            output_json: {
              ...providerOutput,
              providerLifecycle: { visual: providerLifecycle.visual, render: providerLifecycle.render },
              outputRegistry: providerLifecycle.outputRegistry,
              automaticDeliveryLinks: deliveryLinks,
              previewUrl: null
            },
            admin_notes: result.renderJob ? "Provider chain executed. Render job is created; poll provider status before marking ready." : "Provider chain executed. Visual/video job is created; render will start automatically after visual output is ready.",
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();

        if (completeError) throw completeError;
        return Response.json({ job_id: jobId, production: completedProduction, provider_result: result });
      } catch (providerError) {
        const message = errorMessage(providerError, "Provider pipeline failed");
        const providerNote = `Provider pipeline unavailable, demo output is active: ${message}`;
        const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
          .update({
            status: "in_production",
            generation_status: "preview_ready",
            output_json: {
              ...demoOutput,
              automationStatus: "demo_ready",
              providerStatus: "waiting_provider_config",
              providerPreflight,
              renderQueuePolicy,
              capacityPolicy,
              activeJobLimit,
              automaticDeliveryLinks: deliveryLinks,
              outputRegistry: buildOutputRegistry({ ...outputRegistryBase, output_json: demoOutput })
            },
            admin_notes: providerNote,
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();

        if (demoError) throw demoError;
        return Response.json({ job_id: jobId, production: demoProduction, demo: true, provider_warning: message });
      }
    }

    const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
    const requestedDuration = Number(providerPreflight.durationSeconds) || 8;
    const providerTestMode = Boolean(providerPreflight.testMode);
    const selectedOptions = providerPreflight.selectedOptions && typeof providerPreflight.selectedOptions === "object" ? providerPreflight.selectedOptions as Record<string, unknown> : {};
    const isGenericVideoType = ["video", "music_video", "stickman_animation", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "studio", "drama", "cinematic_video", "video_tools", "video_clipping", "localization", "cultural_localization", "avatar", "lip_sync", "talking_video"].includes(String(currentProduction.production_type));
    const genericRun = isGenericVideoType
      ? await runGenericVideoPipeline({
        productionId,
        title: currentProduction.title,
        prompt: currentProduction.prompt,
        requestMetadata,
        inputJson,
        providerPreflight: providerPreflight as Record<string, unknown>,
        selectedOptions
      })
      : null;
    const visualJob = genericRun?.visualJob ?? null;
    const renderJob = genericRun?.renderJob ?? null;
    const aiVideoProviderChain = genericRun
      ? genericVideoProviderChain({ selectedOptions, provider: genericRun.plan.provider, visualJob, voiceAudioUrl: genericRun.voiceAudioUrl, subtitleUrl: genericRun.subtitleUrl, renderJob })
      : genericVideoProviderChain({ selectedOptions, provider: String(providerPreflight.provider ?? "") });
    const providerNote = genericRun
      ? genericRun.chainStatus === "waiting_provider_config"
        ? `Generic video pipeline planned but provider chain is waiting for configuration: ${genericRun.missingProviders.join(", ") || "video provider"}.`
        : genericRun.chainStatus === "provider_chain_started"
          ? "Generic video provider chain started: script plan, visual job, voice/subtitle assets or final render were prepared where selected. Poll /api/automation/status to update final output."
          : "Generic video visual provider job created. Voice/subtitle/final render routing is tracked in the provider chain. Poll /api/automation/status to update final output."
      : "Demo automation generated script, parts, alternatives and delivery placeholders. Connect providers next for real output URLs.";
    const outputJson: Record<string, unknown> = {
      ...demoOutput,
      providerTestMode,
      providerPreflight,
      aiVideoProviderChain,
      genericVideoPlan: genericRun?.plan ?? null,
      voiceAudioUrl: genericRun?.voiceAudioUrl ?? null,
      subtitleUrl: genericRun?.subtitleUrl ?? null,
      renderJob,
      visualJob,
      providerStatus: genericRun?.chainStatus ?? "demo_ready",
      requestedDurationSeconds: requestedDuration,
      automaticDeliveryLinks: deliveryLinks
    };
    const providerLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: outputJson }, { visualJob, renderJob });
    outputJson.providerLifecycle = { visual: providerLifecycle.visual, render: providerLifecycle.render };
    outputJson.outputRegistry = providerLifecycle.outputRegistry;
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
          .update({
            status: "in_production",
            generation_status: visualJob ? renderJob ? "render_job_created" : "provider_visual_job_created" : genericRun ? "waiting_provider_config" : "preview_ready",
            output_json: { ...outputJson, automationStatus: visualJob || renderJob ? "running" : genericRun ? "waiting_provider_config" : "demo_ready" },
            admin_notes: providerNote,
            updated_at: new Date().toISOString()
          })
      .eq("id", productionId)
      .select("*")
      .single();

    if (demoError) throw demoError;
    return Response.json({ job_id: jobId, production: demoProduction, demo: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not start automation job") }, { status: 500 });
  }
}
