import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getProviderStatus } from "@/lib/providers/status";
import type { ProviderJob } from "@/lib/providers/types";
import { supabaseAdmin } from "@/lib/supabase";

function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message.replace(/\\+u0000/gi, "").replace(/\u0000/g, "");
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => value.replace(/\\+u0000/gi, "").replace(/\u0000/g, ""));
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function summarizeColumnValue(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") return { type: "string", length: value.length, preview: value.slice(0, 120) };
  if (Array.isArray(value)) return { type: "array", length: value.length };
  if (typeof value === "object") return { type: "object", keys: Object.keys(value as Record<string, unknown>).slice(0, 20) };
  return { type: typeof value, value };
}

async function diagnoseProductionColumns(supabase: ReturnType<typeof supabaseAdmin>, productionId: string) {
  const columns = [
    "id", "user_id", "title", "prompt", "status", "automation_status", "generation_status", "production_type", "package_id",
    "reserved_credits", "estimated_credits", "request_metadata", "input_json", "output_json", "preview_url", "delivery_link",
    "delivery_zip_url", "source_files_url", "error_message", "admin_notes", "created_at", "updated_at"
  ];
  const results: Array<Record<string, unknown>> = [];
  for (const column of columns) {
    const { data, error } = await supabase.from("production_requests").select(column).eq("id", productionId).maybeSingle();
    const row = data as unknown as Record<string, unknown> | null;
    results.push({ column, ok: !error, error: error ? safeErrorMessage(error, "Column select failed") : null, sample: row ? summarizeColumnValue(row[column]) : null });
  }
  return results;
}

async function repairCorruptProductionJson(supabase: ReturnType<typeof supabaseAdmin>, productionId: string, reason: string) {
  const now = new Date().toISOString();
  const { data: production } = await supabase.from("production_requests").select("production_type").eq("id", productionId).maybeSingle();
  const productionType = String((production as Record<string, unknown> | null)?.production_type ?? "").toLowerCase();
  const preferredProvider = ["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(productionType) ? "minimax" : "heygen_video_agent";
  return supabase
    .from("production_requests")
    .update({
      request_metadata: { preferredProvider, repairedAt: now, repairReason: reason },
      input_json: { preferredProvider, repairedAt: now },
      output_json: { preferredProvider, providerRecovery: { mode: "admin_corrupt_json_repair", reason, repairedAt: now } },
      automation_status: "queued",
      generation_status: "admin_corrupt_json_repaired",
      admin_notes: `Admin repaired corrupt production JSON/text payload. Previous provider start error: ${reason}`,
      error_message: null,
      updated_at: now
    })
    .eq("id", productionId)
    .select("id,status,automation_status,generation_status,reserved_credits,updated_at")
    .maybeSingle();
}

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

  const supabase = supabaseAdmin();
  if (body.repair_corrupt_json === true || body.repairCorruptJson === true) {
    const reason = String(body.reason ?? "22P05 corrupt JSON/text payload").trim();
    const { data, error } = await repairCorruptProductionJson(supabase, productionId, reason);
    if (error) return Response.json({ error: safeErrorMessage(error, "Repair failed"), diagnostics: await diagnoseProductionColumns(supabase, productionId) }, { status: 500 });
    return Response.json({ ok: true, repaired: true, production: data, diagnostics: await diagnoseProductionColumns(supabase, productionId) });
  }

  const { data: production, error } = await supabase
    .from("production_requests")
    .select("*")
    .eq("id", productionId)
    .maybeSingle();

  if (error) return Response.json({ error: safeErrorMessage(error, "Production debug select failed"), diagnostics: await diagnoseProductionColumns(supabase, productionId) }, { status: 500 });
  if (!production) return Response.json({ error: "Production not found.", diagnostics: await diagnoseProductionColumns(supabase, productionId) }, { status: 404 });

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
