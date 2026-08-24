import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { computeProviderSuccessSpend } from "@/lib/credit-resolution";
import { creativeActivityItem, mergeCreativeActivityLog } from "@/lib/creative-director";
import { spendCreditBuckets } from "@/lib/credit-rollover";
import { buildCharacterDialogueAnimationPlan } from "@/lib/pipelines/character-dialogue-pipeline";
import { pollDedicatedFinalAssembly, pollImageToVideoJobs, runCharacterSheetGeneration, runDedicatedFinalAssembly, runImageToVideoGeneration, runSceneImageGeneration, runVoiceSegmentGeneration } from "@/lib/pipelines/character-dialogue-runtime";
import { customerEmailForProduction, sendProductionCompletionEmail } from "@/lib/production-email";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { providerJobFromValue, runProviderJobLifecycle } from "@/lib/provider-jobs";
import { productionReadyGate } from "@/lib/production-ready-gate";
import { createVoiceover, createVoiceoverSegments } from "@/lib/providers/elevenlabs";
import { createAmbientMusicBed } from "@/lib/providers/generic-video";
import { getHeyGenV3Video } from "@/lib/providers/heygen";
import { isAllowedMinimaxPresenterProvider, shouldForceMinimaxPresenterProvider } from "@/lib/heygen-routing";
import { createShotstackRender } from "@/lib/providers/shotstack";
import { getProviderStatus } from "@/lib/providers/status";
import { mirrorProviderAsset, uploadProviderAsset } from "@/lib/providers/storage";
import type { NormalizedProviderStatus, ProviderJob } from "@/lib/providers/types";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function stripPostgresUnsafeText(value: string) {
  return value
    .replace(/\\+u0000/gi, "")
    .replace(/\u0000/g, "");
}

function postgresSafe<T>(value: T): T {
  if (typeof value === "string") return stripPostgresUnsafeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => postgresSafe(item)) as T;
  if (value && typeof value === "object") {
    const shallowCleaned = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, postgresSafe(item)]));
    try {
      return JSON.parse(stripPostgresUnsafeText(JSON.stringify(shallowCleaned))) as T;
    } catch {
      return shallowCleaned as T;
    }
  }
  return value;
}

function safeUpdate<T extends Record<string, unknown>>(payload: T): T {
  return postgresSafe(payload);
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return stripPostgresUnsafeText(error.message);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => stripPostgresUnsafeText(value));
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function firstUrl(value: unknown): string {
  if (typeof value === "string") {
    const direct = value.trim();
    if (/^https?:\/\//i.test(direct)) return direct;
    return direct.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["outputUrl", "output", "url", "video", "video_url", "result", "src", "preview_url", "download_url", "file", "files"]) {
      const found = firstUrl(record[key]);
      if (found) return found;
    }
    for (const nested of Object.values(record)) {
      const found = firstUrl(nested);
      if (found) return found;
    }
  }
  return "";
}

function isRealVideoUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/api\.replicate\.com\/v1\/predictions|\/api\/productions\/.*\/delivery\?file=|manifest|readme|preview\.html|placeholder|generated_on_download/i.test(url)) return false;
  return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|heygen\.ai|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
}

function urlValue(...values: unknown[]) {
  for (const value of values) {
    const url = firstUrl(value);
    if (url && isRealVideoUrl(url)) return url;
  }
  return "";
}

function isRealImageUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/manifest|readme|preview\.html|placeholder|generated_on_download/i.test(url)) return false;
  return /\.(png|jpe?g|webp|avif)(\?|$)|heygen\.ai|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
}

function imageUrlValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string") {
      const url = value.trim();
      if (isRealImageUrl(url)) return url;
      continue;
    }
    if (Array.isArray(value)) {
      const found = imageUrlValue(...value);
      if (found) return found;
      continue;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["thumbnailUrl", "thumbnail_url", "coverUrl", "cover_url", "posterUrl", "poster_url", "thumbnailImageUrl", "thumbnail_image_url", "previewImageUrl", "preview_image_url", "imageUrl", "image_url", "cover", "poster", "thumbnail", "preview_image", "image"]) {
        const found = imageUrlValue(record[key]);
        if (found) return found;
      }
      for (const nested of Object.values(record)) {
        const found = imageUrlValue(nested);
        if (found) return found;
      }
    }
  }
  return "";
}

function textValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

async function heygenVideoAgentCompletionOverride(output: Record<string, any>, visualStatus: NormalizedProviderStatus | null, outputVisualJobProvider: string): Promise<NormalizedProviderStatus | null> {
  const proof = output.heygenProviderProof && typeof output.heygenProviderProof === "object" ? output.heygenProviderProof as Record<string, unknown> : {};
  const visualJob = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : {};
  const isHeyGen = String(visualStatus?.provider ?? outputVisualJobProvider ?? proof.provider ?? visualJob.provider ?? "").toLowerCase() === "heygen_video_agent";
  if (!isHeyGen) return null;
  const latestArtifact = output.latestHeyGenVideoArtifact && typeof output.latestHeyGenVideoArtifact === "object" ? output.latestHeyGenVideoArtifact as Record<string, unknown> : {};
  const latestResourceId = textValue(output.heygenLatestVideoResourceId, latestArtifact.providerResourceId, latestArtifact.id);
  const unresolvedNewResource = /^video_/i.test(latestResourceId) && !urlValue(visualStatus?.outputUrl, latestArtifact.previewUrl);
  const directUrl = unresolvedNewResource ? "" : urlValue(visualStatus?.outputUrl, output.finalVideoUrl, output.providerFinalUrl, output.latestHeyGenVideoArtifact, output.visualStatus, visualJob.raw);
  if (directUrl) return { provider: "heygen_video_agent", id: textValue(visualJob.id, proof.sessionId, visualStatus?.id), status: "succeeded", outputUrl: directUrl, raw: { source: "direct_output_bridge", visualStatus, output } };
  const videoId = textValue(output.heygenLatestVideoResourceId, output.heygenVideoId, proof.videoId, visualJob.videoId, visualJob.raw && typeof visualJob.raw === "object" ? (visualJob.raw as Record<string, unknown>).video_id : "");
  if (!videoId) return null;
  try {
    const video = await getHeyGenV3Video(videoId);
    const finalUrl = urlValue(video);
    const record = video && typeof video === "object" ? video as Record<string, unknown> : {};
    const nested = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
    const status = String(nested.status ?? record.status ?? "").toLowerCase();
    if (finalUrl && /complete|completed|success|succeeded|ready|done/.test(status)) {
      return { provider: "heygen_video_agent", id: textValue(visualJob.id, proof.sessionId, visualStatus?.id), status: "succeeded", outputUrl: finalUrl, durationSeconds: Number(nested.duration ?? 0) || visualStatus?.durationSeconds, raw: { source: "v3_video_completion_bridge", video, visualStatus } };
    }
  } catch {
    return null;
  }
  return null;
}

async function requireAutomationStatusAccess(request: Request, body: Record<string, unknown>, production: { user_id?: string | null }) {
  if (isAdminRequest(request, body)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  const userId = String(body.user_id ?? productionUserId).trim();
  if (!productionUserId || !userId || userId !== productionUserId) return { ok: false as const, response: adminRequiredResponse() };
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

async function pollAlternativeJobs(alternatives: unknown[]) {
  const statuses: NormalizedProviderStatus[] = [];
  const updatedAlternatives = await Promise.all(alternatives.map(async (item) => {
    if (!item || typeof item !== "object") return item;
    const record = item as Record<string, unknown>;
    const job = providerJobFromValue(record.visualJob);
    if (!job) return item;
    try {
      const status = await getProviderStatus(job);
      statuses.push(status);
      if (status.status === "succeeded" && status.outputUrl) {
        return { ...record, status: "ready", preview_url: status.outputUrl, url: status.outputUrl, providerStatus: `${status.provider}_succeeded`, visualStatus: status };
      }
      if (status.status === "failed") {
        return { ...record, status: "provider_failed", providerError: status.error ?? "Provider job failed.", providerStatus: `${status.provider}_failed`, visualStatus: status };
      }
      return { ...record, status: `provider_${status.status}`, providerStatus: `${status.provider}_${status.status}`, visualStatus: status };
    } catch (error) {
      return { ...record, providerError: errorMessage(error, "Alternative provider polling failed") };
    }
  }));
  return { updatedAlternatives, statuses };
}

function updatedSteps(steps: unknown, finalStatus: NormalizedProviderStatus) {
  if (!Array.isArray(steps)) return steps;
  return steps.map((step) => {
    if (!step || typeof step !== "object") return step;
    const record = step as Record<string, unknown>;
    if (record.key === "edit_render") {
      return { ...record, status: finalStatus.status === "succeeded" ? "done" : finalStatus.status === "failed" ? "failed" : "running" };
    }
    if (record.key === "delivery" && finalStatus.status === "succeeded") return { ...record, status: "done" };
    return record;
  });
}

function outputWithWorkflow(production: Record<string, unknown>, output: Record<string, unknown>, patch: Record<string, unknown>) {
  const nextOutput = postgresSafe({ ...output, ...patch });
  return postgresSafe({
    ...nextOutput,
    workflowState: buildProductionWorkflowState({ ...postgresSafe(production), output_json: nextOutput })
  });
}

function heygenV3Metadata(status: NormalizedProviderStatus | null) {
  const raw = status?.raw && typeof status.raw === "object" ? status.raw as Record<string, unknown> : {};
  const videoEnvelope = raw.video && typeof raw.video === "object" ? raw.video as Record<string, unknown> : raw;
  const data = videoEnvelope.data && typeof videoEnvelope.data === "object" ? videoEnvelope.data as Record<string, unknown> : videoEnvelope;
  const captionedVideoUrl = String(data.captioned_video_url ?? data.captionedVideoUrl ?? "").trim();
  const subtitleUrl = String(data.subtitle_url ?? data.subtitleUrl ?? "").trim();
  const videoPageUrl = String(data.video_page_url ?? data.videoPageUrl ?? "").trim();
  const thumbnailUrl = imageUrlValue(data, videoEnvelope, raw);
  return { captionedVideoUrl, subtitleUrl, videoPageUrl, thumbnailUrl };
}

function heygenAgentArtifactsFromStatus(status: NormalizedProviderStatus | null) {
  const raw = status?.raw && typeof status.raw === "object" ? status.raw as Record<string, unknown> : {};
  const artifacts = Array.isArray(raw.heygenAgentArtifacts) ? raw.heygenAgentArtifacts : [];
  const latestVideoArtifact = raw.latestVideoArtifact && typeof raw.latestVideoArtifact === "object" ? raw.latestVideoArtifact as Record<string, unknown> : null;
  const latestVideoUrl = String(latestVideoArtifact?.previewUrl ?? status?.outputUrl ?? "").trim();
  const latestVideoResourceId = String(latestVideoArtifact?.providerResourceId ?? "").trim();
  const thumbnailUrl = imageUrlValue(latestVideoArtifact, artifacts, raw);
  return { artifacts, latestVideoArtifact, latestVideoUrl, latestVideoResourceId, thumbnailUrl };
}

function existingRenderJob(output: Record<string, unknown>) {
  return providerJobFromValue(output.renderJob);
}

async function maybeCreateVoiceoverAsset(productionId: string, output: Record<string, unknown>) {
  const selectedOptions = output.providerPreflight && typeof output.providerPreflight === "object" && (output.providerPreflight as Record<string, unknown>).selectedOptions && typeof (output.providerPreflight as Record<string, unknown>).selectedOptions === "object" ? (output.providerPreflight as Record<string, Record<string, unknown>>).selectedOptions : {};
  const wantsVoice = Boolean(selectedOptions.voiceOver || selectedOptions.voiceConsistency);
  if (!wantsVoice || String(output.voiceAudioUrl ?? "").trim()) return output;
  const genericPlan = output.genericVideoPlan && typeof output.genericVideoPlan === "object" ? output.genericVideoPlan as Record<string, unknown> : {};
  const script = String(genericPlan.script ?? output.script ?? "Crelavo helps brands turn ideas into premium short videos faster. Ready to create your next campaign with Crelavo.");
  const voiceDirection = String(genericPlan.voiceDirection ?? "Premium ad voice, clear and confident");
  const dialogueSegments = Array.isArray(genericPlan.dialogueSegments) ? genericPlan.dialogueSegments as Array<{ speaker: string; text: string; start: number; length: number }> : [];
  if (dialogueSegments.length >= 2) {
    const voiceAudioSegments = await createVoiceoverSegments({ productionId, segments: dialogueSegments, voiceDirection });
    return { ...output, voiceAudioUrl: voiceAudioSegments[0]?.audioUrl ?? null, voiceAudioSegments, voiceRetry: { status: "created_segments", provider: "elevenlabs", createdAt: new Date().toISOString() } };
  }
  const voiceAudioUrl = await createVoiceover({ productionId, script, voiceDirection });
  return { ...output, voiceAudioUrl, voiceRetry: { status: "created", provider: "elevenlabs", createdAt: new Date().toISOString() } };
}

async function localFinalMux(input: { productionId: string; videoUrl: string; audioUrl?: string | null; durationSeconds: number; title: string }) {
  const response = await fetch(input.videoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Final visual download failed: ${response.status} ${await response.text()}`);
  const directory = await mkdtemp(join(tmpdir(), "crelavo-final-"));
  const videoPath = join(directory, "input.mp4");
  const outputPath = join(directory, "final.mp4");
  try {
    await writeFile(videoPath, Buffer.from(await response.arrayBuffer()));
    if (input.audioUrl) {
      const audioResponse = await fetch(input.audioUrl, { cache: "no-store" });
      if (!audioResponse.ok) throw new Error(`Final audio download failed: ${audioResponse.status} ${await audioResponse.text()}`);
      const audioPath = join(directory, "audio.m4a");
      await writeFile(audioPath, Buffer.from(await audioResponse.arrayBuffer()));
      await new Promise<void>((resolve, reject) => {
        if (!ffmpegPath) {
          reject(new Error("ffmpeg-static binary is not available."));
          return;
        }
        execFile(ffmpegPath, ["-y", "-i", videoPath, "-i", audioPath, "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", outputPath], { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve();
        });
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        if (!ffmpegPath) {
          reject(new Error("ffmpeg-static binary is not available."));
          return;
        }
        execFile(ffmpegPath, ["-y", "-i", videoPath, "-c:v", "copy", "-movflags", "+faststart", outputPath], { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve();
        });
      });
    }
    const finalBytes = await readFile(outputPath);
    const storedUrl = await uploadProviderAsset(`${input.productionId}/local-final-render.mp4`, finalBytes, "video/mp4");
    return { provider: "local_final", id: `local-final-${input.productionId}`, status: "succeeded", url: storedUrl, raw: { sourceVideoUrl: input.videoUrl, audioUrl: input.audioUrl ?? null, title: input.title } };
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function maybeCreateRenderAfterVisualReady(productionId: string, output: Record<string, unknown>, visualStatus: NormalizedProviderStatus | null, visualStatuses: NormalizedProviderStatus[] = []): Promise<{ renderJob: ProviderJob | null; renderStarted: boolean; renderError?: string; mirroredVisualUrls?: string[] }> {
  const currentRenderJob = existingRenderJob(output);
  if (currentRenderJob) return { renderJob: currentRenderJob, renderStarted: false };
  const readyVisualUrls = visualStatuses.length ? visualStatuses.filter((status) => status.status === "succeeded" && status.outputUrl).map((status) => String(status.outputUrl)) : [];
  if (visualStatuses.length && readyVisualUrls.length !== visualStatuses.length) return { renderJob: null, renderStarted: false };
  if (!visualStatuses.length && (!visualStatus || visualStatus.status !== "succeeded" || !visualStatus.outputUrl)) return { renderJob: null, renderStarted: false };
  const pipelineType = String(output.pipelineType ?? "");
  const hasGenericVideoPlan = Boolean(output.genericVideoPlan && typeof output.genericVideoPlan === "object");
  const hasVideoClippingRun = Boolean(output.videoClippingRun && typeof output.videoClippingRun === "object");
  if (pipelineType !== "ecommerce_product_ad_video" && !hasGenericVideoPlan && !hasVideoClippingRun) return { renderJob: null, renderStarted: false };

  const selectedOptions = output.providerPreflight && typeof output.providerPreflight === "object" && (output.providerPreflight as Record<string, unknown>).selectedOptions && typeof (output.providerPreflight as Record<string, unknown>).selectedOptions === "object" ? (output.providerPreflight as Record<string, Record<string, unknown>>).selectedOptions : {};
  const genericPlanForRender = output.genericVideoPlan && typeof output.genericVideoPlan === "object" ? output.genericVideoPlan as Record<string, unknown> : {};
  const isDroneRender = /drone|satellite|flyover|aerial/i.test(`${String(genericPlanForRender.title ?? "")} ${String(output.pipelineType ?? "")} ${String(output.providerPreflight && typeof output.providerPreflight === "object" ? (output.providerPreflight as Record<string, unknown>).productionType ?? "" : "")}`);
  const wantsVoice = !isDroneRender && Boolean(selectedOptions.voiceOver || selectedOptions.voiceConsistency);
  const wantsSubtitles = Boolean(selectedOptions.subtitles);
  const voiceAudioUrl = String(output.voiceAudioUrl ?? "").trim();
  const voiceAudioSegments = Array.isArray(output.voiceAudioSegments) ? output.voiceAudioSegments as Array<{ audioUrl: string; start: number; length: number }> : [];
  const hasVoiceAudio = Boolean(voiceAudioUrl || voiceAudioSegments.length);
  const subtitleUrl = String(output.subtitleUrl ?? "").trim();
  if (wantsVoice && !hasVoiceAudio) return { renderJob: null, renderStarted: false, renderError: "Voice-over was selected but no voice audio was created; final render is blocked to avoid silent delivery." };
  if (wantsSubtitles && !subtitleUrl) return { renderJob: null, renderStarted: false, renderError: "Subtitles were selected but no subtitle file was created; final render is blocked." };
  if (!isDroneRender && !hasVoiceAudio && !subtitleUrl && !Boolean(selectedOptions.music)) return { renderJob: null, renderStarted: false, renderError: "Voice/subtitle/music asset is missing; render cannot start." };

  const brain = output.brain && typeof output.brain === "object" ? output.brain as Record<string, unknown> : {};
  const requestedDurationSeconds = Number(output.requestedDurationSeconds ?? output.targetDurationSeconds ?? 30) || 30;
  try {
    const genericPlan = output.genericVideoPlan && typeof output.genericVideoPlan === "object" ? output.genericVideoPlan as Record<string, unknown> : {};
    const subtitleLines = Array.isArray(genericPlan.subtitleLines) ? genericPlan.subtitleLines.map(String) : [];
    const sourceVisualUrls = readyVisualUrls.length ? readyVisualUrls : visualStatus?.outputUrl ? [String(visualStatus.outputUrl)] : [];
    const mirroredVisualUrls: string[] = [];
    for (let index = 0; index < sourceVisualUrls.length; index += 1) {
      const sourceUrl = sourceVisualUrls[index];
      if (/supabase|provider-assets/i.test(sourceUrl)) mirroredVisualUrls.push(sourceUrl);
      else mirroredVisualUrls.push(await mirrorProviderAsset({ productionId, sourceUrl, filenameBase: `raw-visual-${index + 1}`, fallbackContentType: "video/mp4" }));
    }
    try {
      const renderJob = await createShotstackRender({
        title: String(brain.productName ?? genericPlan.title ?? "Crelavo product ad"),
        videoUrl: mirroredVisualUrls[0] || sourceVisualUrls[0],
        videoUrls: mirroredVisualUrls.length ? mirroredVisualUrls : undefined,
        audioUrl: voiceAudioSegments.length ? null : voiceAudioUrl,
        audioSegments: voiceAudioSegments,
        subtitleUrl,
        subtitleLines,
        durationSeconds: Math.min(60, Math.max(5, requestedDurationSeconds))
      });
      return { renderJob, renderStarted: true, mirroredVisualUrls };
    } catch (error) {
      const fallbackAudioUrl = voiceAudioSegments.length ? null : (voiceAudioUrl || (Boolean(selectedOptions.music) ? await createAmbientMusicBed({ productionId, durationSeconds: Math.min(60, Math.max(5, requestedDurationSeconds)), filenameBase: "final-render-music", profile: String(selectedOptions.musicProfile ?? genericPlan.title ?? "") }) : null));
      try {
        const localFinalJob = await localFinalMux({ productionId, videoUrl: mirroredVisualUrls[0] || sourceVisualUrls[0], audioUrl: fallbackAudioUrl, durationSeconds: Math.min(60, Math.max(5, requestedDurationSeconds)), title: String(brain.productName ?? genericPlan.title ?? "Crelavo product ad") });
        return { renderJob: localFinalJob, renderStarted: true, mirroredVisualUrls };
      } catch (localError) {
        return { renderJob: null, renderStarted: false, renderError: errorMessage(localError ?? error, "Render job could not be started after visual output became ready.") };
      }
    }
  } catch (error) {
    return { renderJob: null, renderStarted: false, renderError: errorMessage(error, "Render job could not be started after visual output became ready.") };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const productionId = String(body.production_id ?? "").trim();
    const manualStatusRefresh = body.auto !== true;
    const guardConfig = apiCostGuardConfig();
    const routeBudget = enforceRouteBudget(request, { route: "automation:status", userId: String(body.user_id ?? ""), ipLimit: guardConfig.automationStatusIpLimit, userLimit: guardConfig.automationStatusUserLimit, windowMs: 15 * 60 * 1000 });
    if (!routeBudget.ok) return routeBudget.response;
    if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: production, error } = await supabase
      .from("production_requests")
      .select("*")
      .eq("id", productionId)
      .single();

    if (error) throw error;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });
    const access = await requireAutomationStatusAccess(request, body, production);
    if (!access.ok) return access.response;

    const baseOutput = production.output_json && typeof production.output_json === "object"
      ? production.output_json as Record<string, unknown>
      : {};
    let output = baseOutput;
    try {
      output = await maybeCreateVoiceoverAsset(productionId, baseOutput);
    } catch (voiceError) {
      output = { ...baseOutput, providerErrors: { ...(baseOutput.providerErrors && typeof baseOutput.providerErrors === "object" ? baseOutput.providerErrors as Record<string, unknown> : {}), voice_over: errorMessage(voiceError, "Voice-over could not be created") } };
    }
    const visualLifecycle = await runProviderJobLifecycle(production, output.visualJob);
    const visualStatus = visualLifecycle.normalizedStatus;
    const visualJobs = Array.isArray(output.visualJobs) ? output.visualJobs : [];
    const visualStatuses = (await Promise.all(visualJobs.map((job) => runProviderJobLifecycle(production, job)))).map((life) => life.normalizedStatus).filter(Boolean) as NonNullable<typeof visualStatus>[];
    const renderBridge = await maybeCreateRenderAfterVisualReady(productionId, output, visualStatus, visualStatuses);
let outputWithRenderJob = renderBridge.renderJob
  ? { ...output, renderJob: renderBridge.renderJob, renderStatus: renderBridge.renderStarted ? "render_job_created" : output.renderStatus, renderError: null, mirroredVisualUrls: renderBridge.mirroredVisualUrls ?? output.mirroredVisualUrls }
  : renderBridge.renderError
    ? { ...output, renderStatus: "render_start_failed", renderError: renderBridge.renderError, mirroredVisualUrls: renderBridge.mirroredVisualUrls ?? output.mirroredVisualUrls }
    : output;
    const renderLifecycle = await runProviderJobLifecycle(production, outputWithRenderJob.renderJob);
    const renderStatus = renderLifecycle.normalizedStatus;
    const existingAlternatives = Array.isArray(outputWithRenderJob.alternatives) ? outputWithRenderJob.alternatives : [];
    const { updatedAlternatives: polledAlternatives, statuses: alternativeStatuses } = await pollAlternativeJobs(existingAlternatives);
    const terminalStatus = renderStatus ?? visualStatus;
    let characterDialoguePlan = outputWithRenderJob.characterDialoguePlan && typeof outputWithRenderJob.characterDialoguePlan === "object" ? outputWithRenderJob.characterDialoguePlan as Record<string, unknown> : null;
    let characterDialogueJobs = characterDialoguePlan && Array.isArray((characterDialoguePlan as Record<string, unknown>).providerJobs) ? (characterDialoguePlan as Record<string, unknown>).providerJobs as Array<Record<string, unknown>> : [];
    const hasBrokenDedicatedPlan = Boolean(characterDialoguePlan) && (characterDialogueJobs.filter((job) => job.stage === "scene_image").length === 0 || characterDialogueJobs.filter((job) => job.stage === "image_to_video").length === 0 || characterDialogueJobs.filter((job) => job.stage === "voice_segment").length === 0);
    if (hasBrokenDedicatedPlan) {
      const repairedPlan = buildCharacterDialogueAnimationPlan(String(production.prompt ?? ""), Number((outputWithRenderJob.providerPreflight as Record<string, unknown> | undefined)?.durationSeconds ?? 10) || 10);
      outputWithRenderJob = {
        ...outputWithRenderJob,
        providerStatus: "character_dialogue_plan_repaired",
        characterDialoguePlan: repairedPlan,
        planRepair: { status: "repaired_missing_scene_i2v_voice_jobs", repairedAt: new Date().toISOString() }
      };
      characterDialoguePlan = repairedPlan as unknown as Record<string, unknown>;
      characterDialogueJobs = repairedPlan.providerJobs as unknown as Array<Record<string, unknown>>;
      await supabase
        .from("production_requests")
        .update(safeUpdate({ output_json: outputWithRenderJob, generation_status: "character_dialogue_plan_repaired", admin_notes: "Dedicated character-dialogue plan repaired from prompt because scene/I2V/voice jobs were missing.", updated_at: new Date().toISOString() }))
        .eq("id", productionId);
    }
    const dedicatedPlanCreated = characterDialoguePlan && (String(outputWithRenderJob.providerStatus ?? "") === "character_dialogue_plan_created" || String(outputWithRenderJob.providerStatus ?? "") === "character_dialogue_plan_repaired" || String((characterDialoguePlan as Record<string, unknown>).status ?? "") === "character_dialogue_plan_created" || String(production.generation_status ?? "") === "character_dialogue_i2v_started" || String(production.generation_status ?? "") === "character_dialogue_plan_repaired");
    if (dedicatedPlanCreated && characterDialogueJobs.length) {
      const runningPlan = {
        ...(characterDialoguePlan as Record<string, unknown>),
        status: "running",
        characterSheetsStatus: "running",
        sceneImagesStatus: "running",
        voiceSegmentsStatus: "running",
        startedAt: (characterDialoguePlan as Record<string, unknown>).startedAt ?? new Date().toISOString()
      };
      const starterOutput = outputWithWorkflow(production, {
        ...outputWithRenderJob,
        providerStatus: "character_dialogue_initial_stages_running",
        characterDialoguePlan: runningPlan
      }, { stage: "provider_started", activeProviderJob: null });
      await supabase
        .from("production_requests")
        .update(safeUpdate({
          status: "in_production",
          automation_status: "running",
          generation_status: "character_dialogue_initial_stages_running",
          output_json: starterOutput,
          admin_notes: "Dedicated character-dialogue initial stages triggered by automation/status.",
          updated_at: new Date().toISOString()
        }))
        .eq("id", productionId);
      output = starterOutput;
      Object.assign(outputWithRenderJob, starterOutput);
      Object.assign(characterDialoguePlan as Record<string, unknown>, runningPlan);
    }
    if (characterDialogueJobs.length) {
      let jobsForPolling = characterDialogueJobs;
      let characterSheetRun: Awaited<ReturnType<typeof runCharacterSheetGeneration>> | null = null;
      let sceneImageRecoveryRun: Awaited<ReturnType<typeof runSceneImageGeneration>> | null = null;
      let imageToVideoRecoveryRun: Awaited<ReturnType<typeof runImageToVideoGeneration>> | null = null;
      let voiceSegmentRun: Awaited<ReturnType<typeof runVoiceSegmentGeneration>> | null = null;

      const expectedCharacterSheetJobs = jobsForPolling.filter((job) => job.stage === "character_sheet");
      const readyCharacterSheetCount = expectedCharacterSheetJobs.filter((job) => job.imageUrl).length;
      if (expectedCharacterSheetJobs.length > 0 && readyCharacterSheetCount < expectedCharacterSheetJobs.length) {
        characterSheetRun = await runCharacterSheetGeneration({
          productionId,
          plan: characterDialoguePlan as any
        });
        jobsForPolling = jobsForPolling.map((job) => characterSheetRun?.characterSheetJobs.find((sheetJob) => sheetJob.id === job.id) ?? job);
      }

      const expectedSceneImageJobs = jobsForPolling.filter((job) => job.stage === "scene_image");
      const readySceneImageCount = expectedSceneImageJobs.filter((job) => job.imageUrl).length;
      if (expectedSceneImageJobs.length > 0 && readySceneImageCount < expectedSceneImageJobs.length) {
        sceneImageRecoveryRun = await runSceneImageGeneration({
          productionId,
          plan: characterDialoguePlan as any,
          characterSheetJobs: jobsForPolling.filter((job) => job.stage === "character_sheet")
        });
        jobsForPolling = jobsForPolling.map((job) => sceneImageRecoveryRun?.sceneImageJobs.find((sceneJob) => sceneJob.id === job.id) ?? job);
      }

      const expectedVoiceJobs = jobsForPolling.filter((job) => job.stage === "voice_segment");
      const readyVoiceCount = expectedVoiceJobs.filter((job) => job.audioUrl).length;
      if (expectedVoiceJobs.length > 0 && readyVoiceCount < expectedVoiceJobs.length) {
        voiceSegmentRun = await runVoiceSegmentGeneration({
          productionId,
          plan: characterDialoguePlan as any
        });
        jobsForPolling = jobsForPolling.map((job) => voiceSegmentRun?.voiceSegmentJobs.find((voiceJob) => voiceJob.id === job.id) ?? job);
      }

      const missingI2vJobs = jobsForPolling.filter((job) => {
        if (job.stage !== "image_to_video" || job.outputUrl) return false;
        const provider = String(job.provider ?? "").toLowerCase();
        const status = String(job.status ?? "").toLowerCase();
        const providerStatus = String(job.providerStatus ?? "").toLowerCase();
        const error = String(job.error ?? "").toLowerCase();
        return !job.providerJobId
          || !job.provider
          || provider === "fal"
          || status.includes("failed")
          || providerStatus.includes("failed")
          || providerStatus.includes("deleted")
          || providerStatus.includes("lost")
          || providerStatus.includes("retry_failed")
          || error.includes("output_deleted")
          || error.includes("lost_output")
          || error.includes("parallel task over resource pack limit");
      });
      const readySceneImageJobs = jobsForPolling.filter((job) => job.stage === "scene_image" && job.imageUrl);
      const expectedI2vJobs = jobsForPolling.filter((job) => job.stage === "image_to_video");
      if (missingI2vJobs.length > 0 && expectedI2vJobs.length > 0) {
        imageToVideoRecoveryRun = await runImageToVideoGeneration({
          productionId,
          plan: characterDialoguePlan as any,
          sceneImageJobs: readySceneImageJobs
        });
        jobsForPolling = jobsForPolling.map((job) => {
          const startedJob = imageToVideoRecoveryRun?.imageToVideoJobs.find((candidate) => candidate.id === job.id);
          return startedJob ? { ...job, ...startedJob, outputUrl: startedJob.outputUrl ?? job.outputUrl, providerJobId: startedJob.providerJobId ?? job.providerJobId, raw: startedJob.raw ?? job.raw } : job;
        });
      }
      const i2vPoll = await pollImageToVideoJobs({ providerJobs: jobsForPolling });
      const mergedJobs = jobsForPolling.map((job) => i2vPoll.imageToVideoPolledJobs.find((polled) => polled.id === job.id) ?? job);
      const existingFinalAssembly = mergedJobs.find((job) => job.stage === "final_assembly" && (job.providerJobId || job.status === "ready" || job.status === "waiting_provider"));
      const needsFinalAssemblyFixRerender = manualStatusRefresh && i2vPoll.imageToVideoPollStatus === "ready" && String(outputWithRenderJob.finalRenderFixVersion ?? "") !== "subtitle-audio-v2";
      const shouldStartFinalAssembly = i2vPoll.imageToVideoPollStatus === "ready" && (!existingFinalAssembly || needsFinalAssemblyFixRerender);
      const subtitleLines = Array.isArray((characterDialoguePlan as Record<string, unknown>).dialogueTimeline)
        ? ((characterDialoguePlan as Record<string, unknown>).dialogueTimeline as Array<Record<string, unknown>>).map((cue) => `${String(cue.speaker ?? "Character")}: ${String(cue.text ?? "")}`).filter(Boolean)
        : [];
      const finalAssemblyRun = shouldStartFinalAssembly
        ? await runDedicatedFinalAssembly({
            title: String(production.title ?? "Character dialogue animation"),
            durationSeconds: Number((characterDialoguePlan as Record<string, unknown>).scenes && Array.isArray((characterDialoguePlan as Record<string, unknown>).scenes) ? ((characterDialoguePlan as Record<string, unknown>).scenes as Array<Record<string, unknown>>).reduce((sum, scene) => sum + Number(scene.durationSeconds ?? 0), 0) : 30) || 30,
            providerJobs: mergedJobs,
            subtitleLines
          })
        : null;
      const startedFinalJob = finalAssemblyRun?.finalAssemblyJob as Record<string, unknown> | null | undefined;
      const jobsWithStartedFinal = startedFinalJob
        ? mergedJobs.some((job) => job.id === startedFinalJob.id)
          ? mergedJobs.map((job) => job.id === startedFinalJob.id ? startedFinalJob : job)
          : [...mergedJobs, startedFinalJob]
        : mergedJobs;
      const finalAssemblyPoll = await pollDedicatedFinalAssembly({ providerJobs: jobsWithStartedFinal });
      const polledFinalJob = finalAssemblyPoll.finalAssemblyPolledJob as Record<string, unknown> | null | undefined;
      const jobsWithFinal = polledFinalJob
        ? jobsWithStartedFinal.some((job) => job.id === polledFinalJob.id)
          ? jobsWithStartedFinal.map((job) => job.id === polledFinalJob.id ? polledFinalJob : job)
          : [...jobsWithStartedFinal, polledFinalJob]
        : jobsWithStartedFinal;
      const updatedCharacterDialoguePlan = { ...characterDialoguePlan, providerJobs: jobsWithFinal };

      if (finalAssemblyPoll.finalAssemblyPollStatus === "ready" && finalAssemblyPoll.finalVideoUrl) {
        const providerFinalUrl = finalAssemblyPoll.finalVideoUrl;
        let finalUrl = providerFinalUrl;
        let finalAssetMirror: Record<string, unknown> = { status: "not_attempted" };
        try {
          const storedUrl = await mirrorProviderAsset({
            productionId,
            sourceUrl: providerFinalUrl,
            filenameBase: "character-dialogue-final-render",
            fallbackContentType: "video/mp4"
          });
          finalAssetMirror = { status: "mirrored_provider_url_primary", providerUrl: providerFinalUrl, storedUrl };
        } catch (mirrorError) {
          finalAssetMirror = { status: "fallback_provider_url", providerUrl: providerFinalUrl, error: errorMessage(mirrorError, "Dedicated final render could not be mirrored to storage") };
        }

        const usedSceneImageProviderFallback = jobsWithFinal.some((job) => job.stage === "scene_image" && job.fallback === true);
        const dedicatedReadyOutputCandidate = {
          ...outputWithRenderJob,
          characterDialoguePlan: updatedCharacterDialoguePlan,
          qualityWarning: usedSceneImageProviderFallback ? "Scene image provider fallback was used, but the reference-image path was preserved for character consistency." : outputWithRenderJob.qualityWarning,
          finalRenderFixVersion: "subtitle-audio-v2",
          imageToVideoPoll: i2vPoll,
          characterSheetRun,
          sceneImageRecoveryRun,
          imageToVideoRecoveryRun,
          voiceSegmentRun,
          finalAssemblyRun,
          finalAssemblyPoll,
          finalVideoUrl: finalUrl,
          providerFinalUrl,
          finalAssetMirror,
          providerStatus: "shotstack_succeeded",
          readySceneClipUrls: i2vPoll.readySceneClipUrls
        };
        const readyGate = productionReadyGate({ ...production, preview_url: finalUrl, delivery_link: finalUrl, delivery_zip_url: finalUrl, output_json: dedicatedReadyOutputCandidate }, dedicatedReadyOutputCandidate);
        const existingCreditResolution = output.creditResolution && typeof output.creditResolution === "object" ? output.creditResolution as Record<string, unknown> : null;
        let creditResolution = existingCreditResolution;
        let finalizedReservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
        if (existingCreditResolution?.status !== "spent_reserved" && finalizedReservedCredits > 0) {
          const { data: balanceRow, error: balanceReadError } = await supabase
            .from("credit_balances")
            .select("balance, reserved, current_subscription_credits, rolled_over_credits, topup_credits, bonus_credits")
            .eq("user_id", production.user_id)
            .maybeSingle();
          if (balanceReadError) throw balanceReadError;
          const creditDecision = computeProviderSuccessSpend({
            balance: Number(balanceRow?.balance ?? 0) || 0,
            reserved: Number(balanceRow?.reserved ?? 0) || 0,
            reservedCredits: finalizedReservedCredits,
            productionTitle: production.title ?? production.id
          });
          const bucketSpend = spendCreditBuckets({ row: balanceRow, amount: creditDecision.spendAmount });
          const { error: balanceUpdateError } = await supabase
            .from("credit_balances")
            .upsert({ user_id: production.user_id, ...bucketSpend, reserved: creditDecision.nextReserved }, { onConflict: "user_id" });
          if (balanceUpdateError) throw balanceUpdateError;
          if (creditDecision.event) {
            const { error: creditEventError } = await supabase
              .from("credit_events")
              .insert({ user_id: production.user_id, ...creditDecision.event });
            if (creditEventError) throw creditEventError;
          }
          creditResolution = creditDecision.creditResolution;
          finalizedReservedCredits = creditDecision.finalizedReservedCredits;
        } else if (existingCreditResolution?.status === "spent_reserved") {
          finalizedReservedCredits = Number(output.finalizedReservedCredits ?? production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
        }

        const finalProductionState = {
          ...production,
          status: "ready",
          automation_status: "completed",
          generation_status: "final_video_ready",
          preview_url: finalUrl,
          delivery_link: finalUrl,
          delivery_zip_url: finalUrl,
          reserved_credits: 0
        };
        const finalOutput = outputWithWorkflow(finalProductionState, dedicatedReadyOutputCandidate, {
          readyGate,
          qualityGate: { status: readyGate.passed ? "passed" : "soft_passed_dedicated_final_render", checkedAt: new Date().toISOString(), required: readyGate.required, missing: readyGate.passed ? [] : readyGate.missing, warnings: readyGate.warnings },
          creditResolution,
          finalizedReservedCredits
        });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "ready",
            automation_status: "completed",
            generation_status: "final_video_ready",
            preview_url: finalUrl,
            delivery_link: finalUrl,
            delivery_zip_url: finalUrl,
            reserved_credits: 0,
            output_json: finalOutput,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_notes: "Dedicated character-dialogue animation final render is ready. Customer can preview and download."
          }))
          .eq("id", productionId)
          .select("*")
          .single();

        let completionEmailResult: unknown = { skipped: true, reason: "Production update did not return a user id." };
        try {
          if (data?.user_id) {
            const customerEmail = await customerEmailForProduction(String(data.user_id));
            completionEmailResult = await sendProductionCompletionEmail({
              to: customerEmail,
              title: String(data.title ?? data.id ?? "Production"),
              productionId: String(data.id),
              deliveryUrl: data.delivery_link ?? finalUrl,
              previewUrl: data.preview_url ?? finalUrl,
              sourceFilesUrl: data.source_files_url ?? null,
              readmeUrl: data.readme_url ?? null
            });
          }
        } catch (emailError) {
          completionEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send production completion email") };
        }
        if (data?.id) {
          await supabase
            .from("production_requests")
            .update(safeUpdate({ output_json: { ...(data.output_json ?? {}), completionEmailResult } }))
            .eq("id", data.id);
        }
        return Response.json({ production: data ? { ...data, output_json: { ...(data.output_json ?? {}), completionEmailResult } } : data, imageToVideoPoll: i2vPoll, finalAssemblyPoll, finalVideoUrl: finalUrl, completionEmailResult });
      }

      if (finalAssemblyPoll.finalAssemblyPollStatus === "failed") {
        const failureMessage = String((finalAssemblyPoll.finalAssemblyPolledJob as Record<string, unknown> | null)?.error ?? "Dedicated Shotstack final render failed.");
        const dedicatedFailedOutput = outputWithWorkflow(production, outputWithRenderJob, {
          characterDialoguePlan: updatedCharacterDialoguePlan,
          imageToVideoPoll: i2vPoll,
          sceneImageRecoveryRun,
          imageToVideoRecoveryRun,
          finalAssemblyRun,
          finalAssemblyPoll,
          providerStatus: "character_dialogue_final_render_failed",
          readySceneClipUrls: i2vPoll.readySceneClipUrls
        });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "failed",
            automation_status: "failed",
            generation_status: "character_dialogue_final_render_failed",
            error_message: failureMessage,
            output_json: dedicatedFailedOutput,
            admin_notes: `Dedicated final Shotstack render failed: ${failureMessage}`,
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, imageToVideoPoll: i2vPoll, finalAssemblyPoll });
      }

      const dedicatedProviderStatus = finalAssemblyRun?.finalAssemblyStatus === "started"
        ? "character_dialogue_final_render_started"
        : finalAssemblyPoll.finalAssemblyPollStatus === "waiting"
          ? "character_dialogue_final_render_polling"
          : i2vPoll.imageToVideoPollStatus === "ready"
            ? "character_dialogue_scene_clips_ready"
            : "character_dialogue_i2v_polling";
      const dedicatedOutput = outputWithWorkflow(production, outputWithRenderJob, {
        characterDialoguePlan: updatedCharacterDialoguePlan,
        imageToVideoPoll: i2vPoll,
        characterSheetRun,
        sceneImageRecoveryRun,
        imageToVideoRecoveryRun,
        voiceSegmentRun,
        finalAssemblyRun,
        finalAssemblyPoll,
        providerStatus: dedicatedProviderStatus,
        finalRenderFixVersion: finalAssemblyRun?.finalAssemblyStatus === "started" ? "subtitle-audio-v2" : outputWithRenderJob.finalRenderFixVersion,
        readySceneClipUrls: i2vPoll.readySceneClipUrls
      });
      const { data } = await supabase
        .from("production_requests")
        .update(safeUpdate({
          generation_status: dedicatedProviderStatus,
          output_json: dedicatedOutput,
          updated_at: new Date().toISOString()
        }))
        .eq("id", productionId)
        .select("*")
        .single();
      return Response.json({ production: data, imageToVideoPoll: i2vPoll, finalAssemblyPoll });
    }

    if (!terminalStatus) {
      if (alternativeStatuses.length > 0) {
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            generation_status: "alternative_provider_polling",
            output_json: outputWithWorkflow(production, outputWithRenderJob, { alternatives: polledAlternatives, alternativeStatuses, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry }),
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, alternativeStatuses });
      }
      return Response.json({ production, visualStatus, renderStatus, message: "No provider jobs found yet." });
    }

    if (terminalStatus.status === "failed") {
      const failureMessage = terminalStatus.error ?? "Provider job failed.";
      const creditResolution = {
        status: "admin_review_required",
        reason: "provider_failed",
        reservedCredits: production.reserved_credits ?? production.estimated_credits ?? null,
        instruction: "Provider failed. Admin must choose whether to refund credits, restart the job or deliver manually. No automatic refund was applied."
      };
      const { data } = await supabase
        .from("production_requests")
        .update(safeUpdate({
          status: "failed",
          automation_status: "failed",
          generation_status: `${terminalStatus.provider}_failed`,
          error_message: failureMessage,
            output_json: outputWithWorkflow(production, outputWithRenderJob, { visualStatus, renderStatus, alternatives: polledAlternatives, alternativeStatuses, providerStatus: terminalStatus ? `${terminalStatus.provider}_${terminalStatus.status}` : output.providerStatus, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry, creditResolution }),
          automation_steps: updatedSteps(production.automation_steps, terminalStatus),
          admin_notes: `Provider failed: ${failureMessage}. Credit resolution requires admin review; no automatic refund was applied.`,
          updated_at: new Date().toISOString()
        }))
        .eq("id", productionId)
        .select("*")
        .single();

      return Response.json({ production: data, visualStatus, renderStatus });
    }

    const selectedOptions = output.providerPreflight && typeof output.providerPreflight === "object" && (output.providerPreflight as Record<string, unknown>).selectedOptions && typeof (output.providerPreflight as Record<string, unknown>).selectedOptions === "object" ? (output.providerPreflight as Record<string, Record<string, unknown>>).selectedOptions : {};
    const renderSignal = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.prompt ?? ""} ${JSON.stringify(production.request_metadata ?? {})} ${JSON.stringify(production.input_json ?? {})} ${JSON.stringify(output)}`.toLowerCase();
    const explicitNoVoiceForRender = /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(renderSignal);
    const explicitNoSubtitlesForRender = /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(renderSignal);
    const explicitNoMusicForRender = /no\s*music|without\s*music|music\s*(off|none)|müzik\s*olmasın|muzik\s*olmasın|müzik\s*yok|muzik\s*yok|sessiz/.test(renderSignal);
const visualJobForUrl = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, any> : {};
const renderJobForUrl = output.renderJob && typeof output.renderJob === "object" ? output.renderJob as Record<string, any> : {};
const outputVisualJobProvider = outputWithRenderJob.visualJob && typeof outputWithRenderJob.visualJob === "object" ? String((outputWithRenderJob.visualJob as Record<string, unknown>).provider ?? "") : "";
const isHeyGenVideoAgentProvider = outputVisualJobProvider.toLowerCase() === "heygen_video_agent" || String(visualStatus?.provider ?? "").toLowerCase() === "heygen_video_agent";
    const wantsVoiceRender = !explicitNoVoiceForRender && Boolean(selectedOptions.voiceOver || output.voiceAudioUrl);
    const wantsSubtitleRender = !explicitNoSubtitlesForRender && Boolean(selectedOptions.subtitles || output.subtitleUrl);
    const wantsMusicRender = !explicitNoMusicForRender && Boolean(selectedOptions.music);
    const isDroneProduction = String(production.production_type ?? "") === "drone_video";
    const requiresFinalRender = !isHeyGenVideoAgentProvider && (isDroneProduction || Boolean(wantsVoiceRender || wantsSubtitleRender || wantsMusicRender || (selectedOptions.finalRender && (wantsVoiceRender || wantsSubtitleRender || wantsMusicRender))));
const fallbackVisualUrl = String(visualStatus?.outputUrl || visualJobForUrl.url || visualJobForUrl.preview_url || visualJobForUrl.raw?.url || visualJobForUrl.raw?.output || visualJobForUrl.raw?.video || visualJobForUrl.raw?.result || "").trim();
const fallbackRenderUrl = String(renderStatus?.outputUrl || renderJobForUrl.url || renderJobForUrl.raw?.url || renderJobForUrl.raw?.output || renderJobForUrl.raw?.video || renderJobForUrl.raw?.result || "").trim();
    const normalizedVisualStatus = visualStatus && visualStatus.status === "succeeded" && !visualStatus.outputUrl && /^https?:\/\//i.test(fallbackVisualUrl) ? { ...visualStatus, outputUrl: fallbackVisualUrl } : visualStatus;
    const normalizedRenderStatus = renderStatus && renderStatus.status === "succeeded" && !renderStatus.outputUrl && /^https?:\/\//i.test(fallbackRenderUrl) ? { ...renderStatus, outputUrl: fallbackRenderUrl } : renderStatus;
    const isShotstackUiMotion = String(outputVisualJobProvider || visualJobForUrl.provider || visualStatus?.provider || "").toLowerCase() === "shotstack_ui_motion";
    if (isShotstackUiMotion) {
      const blockedOutput = outputWithWorkflow(production, outputWithRenderJob, {
        visualStatus,
        renderStatus,
        providerStatus: "waiting_real_video_provider",
        providerErrors: { ...(output.providerErrors && typeof output.providerErrors === "object" ? output.providerErrors as Record<string, unknown> : {}), visual_generation: "shotstack_ui_motion fallback is disabled. A real video provider job is required." },
        providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }
      });
      const { data } = await supabase
        .from("production_requests")
        .update(safeUpdate({
          status: "queued",
          automation_status: "waiting_provider_config",
          generation_status: "waiting_real_video_provider",
          output_json: blockedOutput,
          admin_notes: "shotstack_ui_motion fallback blocked; waiting for a real video provider job.",
          updated_at: new Date().toISOString()
        }))
        .eq("id", productionId)
        .select("*")
        .single();
      return Response.json({ production: data, visualStatus, renderStatus, waiting_provider_config: true, blockedProvider: "shotstack_ui_motion" });
    }
    const heygenAgentBridge = String(normalizedVisualStatus?.provider ?? outputVisualJobProvider ?? "").toLowerCase() === "heygen_video_agent" ? heygenAgentArtifactsFromStatus(normalizedVisualStatus) : { artifacts: [], latestVideoArtifact: null, latestVideoUrl: "", latestVideoResourceId: "", thumbnailUrl: "" };
    const heygenVideoAgentVisualReady = normalizedVisualStatus?.status === "succeeded" && (normalizedVisualStatus.outputUrl || heygenAgentBridge.latestVideoUrl) && String(normalizedVisualStatus.provider ?? outputVisualJobProvider ?? "").toLowerCase() === "heygen_video_agent";
    const heygenCompletionStatus = await heygenVideoAgentCompletionOverride(outputWithRenderJob, normalizedVisualStatus, outputVisualJobProvider);
    const successfulStatus = normalizedRenderStatus?.status === "succeeded" && normalizedRenderStatus.outputUrl
      ? normalizedRenderStatus
      : heygenCompletionStatus
        ? heygenCompletionStatus
        : heygenVideoAgentVisualReady
          ? normalizedVisualStatus
          : !requiresFinalRender && normalizedVisualStatus?.status === "succeeded" && normalizedVisualStatus.outputUrl
            ? normalizedVisualStatus
            : null;
    if (visualStatus?.status === "succeeded" && visualStatus.outputUrl && requiresFinalRender && !successfulStatus) {
      const rawVisualPreviewUrl = urlValue(visualStatus.outputUrl, visualLifecycle.outputRegistry, outputWithRenderJob.visualJob, outputWithRenderJob.visualStatus, outputWithRenderJob);
      const fallbackPatch = rawVisualPreviewUrl
        ? {
            preview_url: rawVisualPreviewUrl,
            delivery_link: production.delivery_link ?? null,
            delivery_zip_url: production.delivery_zip_url ?? null,
            admin_notes: renderBridge.renderError
              ? `Raw visual preview is available, but final audio/subtitle render is waiting: ${renderBridge.renderError}`
              : "Raw visual preview is available. Final audio/subtitle render is pending.",
          }
        : {
            admin_notes: renderBridge.renderError ? `Visual video is ready, but final audio/subtitle render is waiting: ${renderBridge.renderError}` : "Visual video is ready. Final audio/subtitle render is pending."
          };
      const { data } = await supabase
        .from("production_requests")
        .update(safeUpdate({
          generation_status: renderBridge.renderError ? "final_render_waiting_provider_config" : renderBridge.renderStarted ? "final_render_started" : "final_render_pending",
          output_json: outputWithWorkflow(production, outputWithRenderJob, { visualStatus, renderStatus, alternatives: polledAlternatives, alternativeStatuses, providerStatus: renderBridge.renderError ? "final_render_waiting_provider_config" : "visual_ready_final_render_pending", rawVisualPreviewUrl: rawVisualPreviewUrl || null, previewFallback: rawVisualPreviewUrl ? { status: "raw_visual_available", reason: "Final voice/subtitle render is not ready yet; showing raw provider video as preview only.", url: rawVisualPreviewUrl, updatedAt: new Date().toISOString() } : null, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry }),
          updated_at: new Date().toISOString(),
          ...fallbackPatch
        }))
        .eq("id", productionId)
        .select("*")
        .single();
      return Response.json({ production: data, visualStatus, renderStatus, renderPending: true, rawVisualPreviewUrl: rawVisualPreviewUrl || null, renderError: renderBridge.renderError ?? null });
    }
    if (successfulStatus) {
      const providerFinalUrl = heygenAgentBridge.latestVideoUrl || (successfulStatus.outputUrl ?? "");
      const isDroneProductionForReady = String(production.production_type ?? "") === "drone_video";
      const successfulProviderName = String(successfulStatus.provider ?? "").toLowerCase();
      if (isDroneProductionForReady && successfulProviderName !== "shotstack") {
        const rawVisualPreviewUrl = urlValue(providerFinalUrl, visualLifecycle.outputRegistry, outputWithRenderJob.visualJob, outputWithRenderJob.visualStatus, outputWithRenderJob);
        const blockedOutput = outputWithWorkflow(production, outputWithRenderJob, {
          visualStatus,
          renderStatus,
          providerStatus: "raw_drone_visual_ready_final_render_required",
          rawVisualPreviewUrl: rawVisualPreviewUrl || providerFinalUrl || null,
          previewFallback: rawVisualPreviewUrl || providerFinalUrl ? { status: "raw_visual_available", reason: "Drone raw provider clip is available, but final 35-second render is still required before delivery.", url: rawVisualPreviewUrl || providerFinalUrl, updatedAt: new Date().toISOString() } : null,
          providerLifecycle: { visual: visualLifecycle, render: renderLifecycle },
          outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry,
          qualityGate: { status: "blocked", checkedAt: new Date().toISOString(), required: ["shotstack_final_render"], missing: ["shotstack_final_render"], warnings: ["raw_replicate_drone_clip_not_customer_delivery"] }
        });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "in_production",
            automation_status: "running",
            generation_status: "final_render_pending",
            preview_url: rawVisualPreviewUrl || providerFinalUrl || production.preview_url || null,
            delivery_link: null,
            delivery_zip_url: null,
            output_json: blockedOutput,
            admin_notes: "Drone raw visual clip is available, but final Shotstack render is required before customer delivery.",
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, renderPending: true, rawVisualPreviewUrl: rawVisualPreviewUrl || providerFinalUrl || null, quality_blocked: true, reason: "raw_drone_visual_not_final_delivery" });
      }
      const heygenMeta = heygenV3Metadata(successfulStatus);
      const presenterRouteSignal = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.title ?? ""} ${production.prompt ?? ""} ${JSON.stringify(production.request_metadata ?? {})} ${JSON.stringify(production.input_json ?? {})} ${JSON.stringify(outputWithRenderJob)}`.toLowerCase();
      const expectsMinimaxPresenterProvider = shouldForceMinimaxPresenterProvider({ productionType: String(production.production_type ?? ""), routeSignal: presenterRouteSignal });
      if (expectsMinimaxPresenterProvider && !isAllowedMinimaxPresenterProvider(successfulProviderName)) {
        const blockedOutput = outputWithWorkflow(production, outputWithRenderJob, {
          visualStatus,
          renderStatus,
          rawGenericProviderUrl: providerFinalUrl,
          providerStatus: "quality_gate_blocked_wrong_presenter_provider",
          qualityGate: {
            status: "blocked",
            checkedAt: new Date().toISOString(),
            required: ["heygen_presenter_provider"],
            missing: ["heygen_presenter_provider"],
            warnings: [`wrong_provider_for_presenter:${successfulProviderName || "unknown"}`]
          },
          providerLifecycle: { visual: visualLifecycle, render: renderLifecycle },
          outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry
        });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "in_production",
            automation_status: "quality_blocked",
            generation_status: "quality_gate_blocked",
            output_json: blockedOutput,
            admin_notes: `Generic provider output rejected: presenter/UGC/talking video requires HeyGen, but ${successfulProviderName || "unknown"} returned the clip.`,
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, finalVideoUrl: providerFinalUrl, quality_blocked: true, reason: "wrong_provider_for_presenter_video" });
      }
      const dedicatedRequired = String(outputWithRenderJob.requiredPipeline ?? "") === "character_consistent_dialogue_animation" || Boolean(outputWithRenderJob.characterDialoguePlan);
      const dedicatedShotstackReady = String(successfulStatus.provider ?? "") === "shotstack" && String(outputWithRenderJob.providerStatus ?? "").includes("shotstack");
      if (dedicatedRequired && !dedicatedShotstackReady) {
        const blockedOutput = outputWithWorkflow(production, outputWithRenderJob, {
          visualStatus,
          renderStatus,
          rawGenericProviderUrl: providerFinalUrl,
          providerStatus: "quality_gate_blocked_generic_provider_for_character_dialogue",
          qualityGate: {
            status: "blocked",
            checkedAt: new Date().toISOString(),
            required: ["dedicated_character_sheets", "dedicated_scene_images", "dedicated_i2v_clips", "dedicated_voice_segments", "dedicated_final_assembly"],
            missing: ["dedicated_final_assembly"],
            warnings: ["generic_provider_output_rejected_for_character_consistency"]
          },
          providerLifecycle: { visual: visualLifecycle, render: renderLifecycle },
          outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry
        });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "in_production",
            automation_status: "quality_blocked",
            generation_status: "quality_gate_blocked",
            output_json: blockedOutput,
            admin_notes: "Generic provider video was rejected because this production requires the dedicated character-consistent dialogue animation pipeline.",
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, finalVideoUrl: providerFinalUrl, quality_blocked: true, reason: "generic_provider_output_rejected_for_character_consistency" });
      }
      const completedCreativeActivityLog = mergeCreativeActivityLog(outputWithRenderJob.creativeActivityLog, [
  creativeActivityItem("provider-job", "Provider job", "completed", `Provider completed successfully: ${successfulStatus.provider}.`, successfulStatus.provider),
  creativeActivityItem("a-roll", "A-roll scene", "completed", "Presenter A-roll video is ready.", successfulStatus.provider),
  creativeActivityItem("b-roll", "B-roll / UI overlays", "completed", "Supporting overlays, captions and motion elements are ready.", successfulStatus.provider),
  creativeActivityItem("final-video", "Final video", "ready", "Final provider video is ready for preview and delivery.", successfulStatus.provider)
]);
const qualityOutputCandidate = { ...outputWithRenderJob, visualStatus, renderStatus, finalVideoUrl: providerFinalUrl, providerFinalUrl, thumbnailUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.thumbnailUrl || undefined, posterUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.posterUrl || undefined, coverUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.coverUrl || undefined, captionedVideoUrl: heygenMeta.captionedVideoUrl || undefined, subtitleUrl: heygenMeta.subtitleUrl || outputWithRenderJob.subtitleUrl, heygenVideoPageUrl: heygenMeta.videoPageUrl || undefined, heygenAgentArtifacts: heygenAgentBridge.artifacts, latestHeyGenVideoArtifact: heygenAgentBridge.latestVideoArtifact, heygenLatestVideoResourceId: heygenAgentBridge.latestVideoResourceId || outputWithRenderJob.heygenVideoId, providerStatus: `${successfulStatus.provider}_succeeded`, creativeActivityLog: completedCreativeActivityLog, alternatives: polledAlternatives, alternativeStatuses };
      const readyGate = productionReadyGate({ ...production, preview_url: providerFinalUrl, delivery_link: providerFinalUrl, delivery_zip_url: providerFinalUrl, output_json: qualityOutputCandidate }, qualityOutputCandidate);
      const readinessSignal = `${production.production_type ?? ""} ${production.package_id ?? ""} ${production.prompt ?? ""} ${JSON.stringify(production.request_metadata ?? {})} ${JSON.stringify(production.input_json ?? {})} ${JSON.stringify(outputWithRenderJob)}`.toLowerCase();
      const explicitNoVoice = /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(readinessSignal);
      const explicitNoSubtitles = /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(readinessSignal);
      const softPassMissing = new Set(["voice_audio_or_final_render", "subtitle_or_burned_render", "audio_probe_missing", "duration_probe_missing", "media_probe_480p"]);
      const successfulProviderKey = String(successfulStatus.provider ?? "").toLowerCase();
      const isHeyGenSuccessfulVideo = successfulProviderKey === "heygen_video_agent";
      const isMiniMaxSuccessfulVideo = successfulProviderKey === "minimax";
      const canSoftPassProviderVideo = Boolean(providerFinalUrl) && (isHeyGenVideoAgentProvider || isHeyGenSuccessfulVideo || isMiniMaxSuccessfulVideo || (explicitNoVoice && explicitNoSubtitles)) && readyGate.missing.every((item) => softPassMissing.has(item) || item.startsWith("media_probe_") || item.startsWith("duration_probe"));
      const forcePassProviderVideo = Boolean(providerFinalUrl) && (isHeyGenVideoAgentProvider || isHeyGenSuccessfulVideo || isMiniMaxSuccessfulVideo);
      if (!readyGate.passed && !canSoftPassProviderVideo && !forcePassProviderVideo) {
        const blockedOutput = outputWithWorkflow(production, outputWithRenderJob, { visualStatus, renderStatus, finalVideoUrl: providerFinalUrl, providerFinalUrl, alternatives: polledAlternatives, alternativeStatuses, providerStatus: "quality_gate_blocked", providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry, readyGate, qualityGate: { status: "blocked", checkedAt: new Date().toISOString(), required: readyGate.required, missing: readyGate.missing, warnings: readyGate.warnings } });
        const { data } = await supabase
          .from("production_requests")
          .update(safeUpdate({
            status: "in_production",
            automation_status: "quality_blocked",
            generation_status: "quality_gate_blocked",
            output_json: blockedOutput,
            admin_notes: `Provider output exists but customer-ready gate blocked delivery. Missing: ${readyGate.missing.join(", ")}`,
            updated_at: new Date().toISOString()
          }))
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, finalVideoUrl: providerFinalUrl, ready_gate: readyGate, quality_blocked: true });
      }
      const existingCreditResolution = output.creditResolution && typeof output.creditResolution === "object" ? output.creditResolution as Record<string, unknown> : null;
      let creditResolution = existingCreditResolution;
      let finalizedReservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;

      if (existingCreditResolution?.status !== "spent_reserved" && finalizedReservedCredits > 0) {
        const { data: balanceRow, error: balanceReadError } = await supabase
          .from("credit_balances")
          .select("balance, reserved, current_subscription_credits, rolled_over_credits, topup_credits, bonus_credits")
          .eq("user_id", production.user_id)
          .maybeSingle();

        if (balanceReadError) throw balanceReadError;

        const balance = Number(balanceRow?.balance ?? 0) || 0;
        const reserved = Number(balanceRow?.reserved ?? 0) || 0;
        const creditDecision = computeProviderSuccessSpend({ balance, reserved, reservedCredits: finalizedReservedCredits, productionTitle: production.title ?? production.id });
        const bucketSpend = spendCreditBuckets({ row: balanceRow, amount: creditDecision.spendAmount });

        const { error: balanceUpdateError } = await supabase
          .from("credit_balances")
          .upsert({
            user_id: production.user_id,
            ...bucketSpend,
            reserved: creditDecision.nextReserved
          }, { onConflict: "user_id" });

        if (balanceUpdateError) throw balanceUpdateError;

        if (creditDecision.event) {
          const { error: creditEventError } = await supabase
            .from("credit_events")
            .insert({ user_id: production.user_id, ...creditDecision.event });

          if (creditEventError) throw creditEventError;
        }

        creditResolution = creditDecision.creditResolution;
        finalizedReservedCredits = creditDecision.finalizedReservedCredits;
      } else if (existingCreditResolution?.status === "spent_reserved") {
        finalizedReservedCredits = Number(output.finalizedReservedCredits ?? production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
      }

      const effectiveReadyGate = readyGate.passed ? readyGate : (canSoftPassProviderVideo || forcePassProviderVideo) ? { ...readyGate, passed: true, warnings: [...readyGate.warnings, `${isMiniMaxSuccessfulVideo ? "minimax_completion_bridge" : isHeyGenSuccessfulVideo ? "heygen_video_agent_completion_bridge" : "soft_pass_missing"}:${readyGate.missing.join(",")}`], missing: [] } : readyGate;
      let finalUrl = providerFinalUrl;
      let finalAssetMirror: Record<string, unknown> = { status: "not_attempted" };
      try {
        const storedUrl = await mirrorProviderAsset({
          productionId,
          sourceUrl: providerFinalUrl,
          filenameBase: successfulStatus.provider === "shotstack" ? "final-render" : "provider-visual",
          fallbackContentType: "video/mp4"
        });
        finalUrl = providerFinalUrl;
        finalAssetMirror = { status: "mirrored_provider_url_primary", providerUrl: providerFinalUrl, storedUrl };
      } catch (mirrorError) {
        finalUrl = providerFinalUrl;
        finalAssetMirror = { status: "fallback_provider_url", providerUrl: providerFinalUrl, error: errorMessage(mirrorError, "Provider asset could not be mirrored to storage") };
      }
      const updatedAlternatives = polledAlternatives.length > 0
        ? polledAlternatives.map((item, index) => index === 0 && item && typeof item === "object" ? { ...(item as Record<string, unknown>), status: "ready", preview_url: finalUrl, url: finalUrl, description: "Real output generated by the provider is ready." } : item)
        : [{ id: "provider-output-1", title: "Provider output", status: "ready", description: "Real output generated by the provider is ready.", preview_url: finalUrl, url: finalUrl }];
      const finalProductionState = {
        ...production,
        status: "ready",
        automation_status: "completed",
        generation_status: "final_video_ready",
        preview_url: finalUrl,
        delivery_link: finalUrl,
        delivery_zip_url: finalUrl,
        reserved_credits: 0
      };
      const { data } = await supabase
        .from("production_requests")
        .update(safeUpdate({
          status: "ready",
          automation_status: "completed",
          generation_status: "final_video_ready",
          preview_url: finalUrl,
          delivery_link: finalUrl,
          delivery_zip_url: finalUrl,
          reserved_credits: 0,
          output_json: outputWithWorkflow(finalProductionState, outputWithRenderJob, { visualStatus, renderStatus, finalVideoUrl: finalUrl, providerFinalUrl, thumbnailUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.thumbnailUrl || undefined, posterUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.posterUrl || undefined, coverUrl: heygenMeta.thumbnailUrl || heygenAgentBridge.thumbnailUrl || outputWithRenderJob.coverUrl || undefined, captionedVideoUrl: heygenMeta.captionedVideoUrl || undefined, subtitleUrl: heygenMeta.subtitleUrl || outputWithRenderJob.subtitleUrl, heygenVideoPageUrl: heygenMeta.videoPageUrl || undefined, heygenAgentArtifacts: heygenAgentBridge.artifacts, latestHeyGenVideoArtifact: heygenAgentBridge.latestVideoArtifact, heygenLatestVideoResourceId: heygenAgentBridge.latestVideoResourceId || outputWithRenderJob.heygenVideoId, finalAssetMirror, alternatives: updatedAlternatives, alternativeStatuses, providerStatus: `${successfulStatus.provider}_succeeded`, creativeActivityLog: completedCreativeActivityLog, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry, readyGate: effectiveReadyGate, qualityGate: { status: "passed", checkedAt: new Date().toISOString(), required: effectiveReadyGate.required, missing: [], warnings: effectiveReadyGate.warnings }, creditResolution, finalizedReservedCredits }),
          automation_steps: updatedSteps(production.automation_steps, successfulStatus),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          admin_notes: "Final ad video is ready. Customer can preview, download or export."
        }))
        .eq("id", productionId)
        .select("*")
        .single();

      let completionEmailResult: unknown = { skipped: true, reason: "Production update did not return a user id." };
      try {
        if (data?.user_id) {
          const customerEmail = await customerEmailForProduction(String(data.user_id));
          completionEmailResult = await sendProductionCompletionEmail({
            to: customerEmail,
            title: String(data.title ?? data.id ?? "Production"),
            productionId: String(data.id),
            deliveryUrl: data.delivery_link ?? finalUrl,
            previewUrl: data.preview_url ?? finalUrl,
            sourceFilesUrl: data.source_files_url ?? null,
            readmeUrl: data.readme_url ?? null
          });
        }
      } catch (emailError) {
        completionEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send production completion email") };
      }

      if (data?.id) {
        await supabase
          .from("production_requests")
          .update(safeUpdate({ output_json: { ...(data.output_json ?? {}), completionEmailResult } }))
          .eq("id", data.id);
      }

      return Response.json({ production: data ? { ...data, output_json: { ...(data.output_json ?? {}), completionEmailResult } } : data, visualStatus, renderStatus, finalVideoUrl: finalUrl, completionEmailResult });
    }

    const { data } = await supabase
      .from("production_requests")
      .update(safeUpdate({
        generation_status: renderStatus ? `shotstack_${renderStatus.status}` : visualStatus ? `${visualStatus.provider}_${visualStatus.status}` : "provider_polling",
        output_json: outputWithWorkflow(production, outputWithRenderJob, { visualStatus, renderStatus, heygenAgentArtifacts: heygenAgentBridge.artifacts, latestHeyGenVideoArtifact: heygenAgentBridge.latestVideoArtifact, heygenLatestVideoResourceId: heygenAgentBridge.latestVideoResourceId || outputWithRenderJob.heygenVideoId, alternatives: polledAlternatives, alternativeStatuses, providerStatus: terminalStatus ? `${terminalStatus.provider}_${terminalStatus.status}` : output.providerStatus, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry }),
        automation_steps: updatedSteps(production.automation_steps, terminalStatus),
        updated_at: new Date().toISOString()
      }))
      .eq("id", productionId)
      .select("*")
      .single();

    return Response.json({ production: data, visualStatus, renderStatus });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not poll automation status") }, { status: 500 });
  }
}
