import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getProviderStatus } from "@/lib/providers/status";
import type { ProviderJob } from "@/lib/providers/types";
import { supabaseAdmin } from "@/lib/supabase";

function pickJob(value: unknown): ProviderJob | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = String(record.id ?? record.jobId ?? record.predictionId ?? "").trim();
  const provider = String(record.provider ?? "").trim();
  if (!id || !provider) return null;
  return record as unknown as ProviderJob;
}

function collectUrls(value: unknown, found = new Set<string>()) {
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
    for (const match of matches) found.add(match);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, found));
    return found;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectUrls(item, found));
  }
  return found;
}

function isRealVideoUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/api\.replicate\.com\/v1\/predictions|\/api\/productions\/.*\/delivery\?file=|manifest|readme|preview\.html|placeholder|generated_on_download/i.test(url)) return false;
  return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
}

function summarizeStatus(status: unknown) {
  if (!status || typeof status !== "object") return null;
  const record = status as Record<string, unknown>;
  return {
    provider: record.provider ?? null,
    id: record.id ?? null,
    status: record.status ?? null,
    outputUrl: record.outputUrl ?? null,
    error: record.error ?? null,
    rawUrls: Array.from(collectUrls(record.raw)).slice(0, 20),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const productionId = String(body.production_id ?? body.productionId ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

  const { data: production, error } = await supabaseAdmin()
    .from("production_requests")
    .select("*")
    .eq("id", productionId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!production) return Response.json({ error: "Production not found." }, { status: 404 });

  const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
  const visualJob = pickJob(outputJson.visualJob);
  const renderJob = pickJob(outputJson.renderJob);
  const characterDialoguePlan = outputJson.characterDialoguePlan && typeof outputJson.characterDialoguePlan === "object" ? outputJson.characterDialoguePlan as Record<string, unknown> : null;
  const characterDialogueProviderJobs = characterDialoguePlan && Array.isArray(characterDialoguePlan.providerJobs) ? characterDialoguePlan.providerJobs as Array<Record<string, unknown>> : [];
  const dedicatedJobSummary = characterDialogueProviderJobs.map((job) => ({
    id: job.id ?? null,
    stage: job.stage ?? null,
    provider: job.provider ?? null,
    status: job.status ?? null,
    providerStatus: job.providerStatus ?? null,
    providerJobId: job.providerJobId ?? null,
    inputRef: job.inputRef ?? null,
    hasImageUrl: Boolean(job.imageUrl),
    hasOutputUrl: Boolean(job.outputUrl),
    hasAudioUrl: Boolean(job.audioUrl),
    error: job.error ?? null,
  }));
  let liveVisualStatus = null;
  let liveRenderStatus = null;

  if (visualJob) {
    try {
      liveVisualStatus = summarizeStatus(await getProviderStatus(visualJob));
    } catch (err) {
      liveVisualStatus = { error: err instanceof Error ? err.message : "visual status poll failed" };
    }
  }

  if (renderJob) {
    try {
      liveRenderStatus = summarizeStatus(await getProviderStatus(renderJob));
    } catch (err) {
      liveRenderStatus = { error: err instanceof Error ? err.message : "render status poll failed" };
    }
  }

  const allUrls = Array.from(collectUrls({ production, outputJson, liveVisualStatus, liveRenderStatus }));
  const realVideoUrls = allUrls.filter(isRealVideoUrl);

  return Response.json({
    ok: true,
    production: {
      id: production.id,
      status: production.status,
      automation_status: production.automation_status,
      generation_status: production.generation_status,
      provider: production.provider ?? null,
      provider_job_id: production.provider_job_id ?? null,
      preview_url: production.preview_url ?? null,
      delivery_link: production.delivery_link ?? null,
      delivery_zip_url: production.delivery_zip_url ?? null,
      error_message: production.error_message ?? null,
      admin_notes: production.admin_notes ?? null,
      reserved_credits: production.reserved_credits ?? null,
      updated_at: production.updated_at ?? null,
    },
    output: {
      providerStatus: outputJson.providerStatus ?? null,
      releaseSource: outputJson.releaseSource ?? null,
      finalVideoUrl: outputJson.finalVideoUrl ?? null,
      providerFinalUrl: outputJson.providerFinalUrl ?? null,
      previewUrl: outputJson.previewUrl ?? null,
      rawVisualPreviewUrl: outputJson.rawVisualPreviewUrl ?? null,
      deliveryLink: outputJson.deliveryLink ?? null,
      voiceAudioUrl: outputJson.voiceAudioUrl ?? null,
      subtitleUrl: outputJson.subtitleUrl ?? null,
      renderError: outputJson.renderError ?? null,
      providerPreflight: outputJson.providerPreflight ?? null,
      visualJob,
      renderJob,
      visualStatus: summarizeStatus(outputJson.visualStatus),
      renderStatus: summarizeStatus(outputJson.renderStatus),
      liveVisualStatus,
      liveRenderStatus,
      characterDialogue: characterDialoguePlan ? {
        requiredPipeline: outputJson.requiredPipeline ?? null,
        providerStatus: outputJson.providerStatus ?? null,
        characterCount: Array.isArray(characterDialoguePlan.characterBible) ? characterDialoguePlan.characterBible.length : 0,
        sceneCount: Array.isArray(characterDialoguePlan.scenes) ? characterDialoguePlan.scenes.length : 0,
        dialogueCount: Array.isArray(characterDialoguePlan.dialogueTimeline) ? characterDialoguePlan.dialogueTimeline.length : 0,
        jobCount: dedicatedJobSummary.length,
        jobs: dedicatedJobSummary,
        imageToVideoPoll: outputJson.imageToVideoPoll ?? null,
        finalAssemblyRun: outputJson.finalAssemblyRun ?? null,
        finalAssemblyPoll: outputJson.finalAssemblyPoll ?? null,
      } : null,
    },
    diagnosis: {
      hasRealVideoUrl: realVideoUrls.length > 0,
      realVideoUrls,
      allUrls: allUrls.slice(0, 50),
      likelyProblem: realVideoUrls.length
        ? "A real video URL exists. If customer preview is blank, the UI field mapping or browser cache is the problem."
        : visualJob || renderJob
          ? "Provider jobs exist, but no real MP4/MOV/WEBM URL was found in stored or live status output."
          : "No provider job and no real video URL are attached to this production.",
    }
  });
}
