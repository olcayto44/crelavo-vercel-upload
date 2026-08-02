import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/DashboardShell";
import { ProductionWorkspace } from "@/components/ProductionWorkspace";
import { buildCharacterDialogueAnimationPlan } from "@/lib/pipelines/character-dialogue-pipeline";
import { extractProductionId } from "@/lib/production-url";
import { pollDedicatedFinalAssembly, runCharacterSheetGeneration, runDedicatedFinalAssembly, runSceneImageGeneration, runVoiceSegmentGeneration } from "@/lib/pipelines/character-dialogue-runtime";
import { productionReadyGate } from "@/lib/production-ready-gate";
import { mirrorProviderAsset } from "@/lib/providers/storage";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Production workspace | Crelavo",
  robots: { index: false, follow: false }
};

function safeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function forceDedicatedInitialStagesIfNeeded(production: Record<string, any>) {
  const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, any> : {};
  const plan = outputJson.characterDialoguePlan && typeof outputJson.characterDialoguePlan === "object" ? outputJson.characterDialoguePlan as Record<string, any> : null;
  if (!plan) return production;
  let jobs = Array.isArray(plan.providerJobs) ? plan.providerJobs as Record<string, any>[] : [];
  if (!jobs.length) return production;
  const brokenPlan = jobs.filter((job) => job.stage === "scene_image").length === 0 || jobs.filter((job) => job.stage === "image_to_video").length === 0 || jobs.filter((job) => job.stage === "voice_segment").length === 0;
  let workingPlan = plan;
  if (brokenPlan) {
    const repairedPlan = buildCharacterDialogueAnimationPlan(String(production.prompt ?? ""), Number(outputJson.providerPreflight?.durationSeconds ?? 10) || 10) as any;
    workingPlan = repairedPlan;
    jobs = repairedPlan.providerJobs as Record<string, any>[];
    const repairedOutput = { ...outputJson, providerStatus: "character_dialogue_plan_repaired", characterDialoguePlan: repairedPlan, planRepair: { status: "page_repaired_missing_scene_i2v_voice_jobs", repairedAt: new Date().toISOString() } };
    await supabaseAdmin()
      .from("production_requests")
      .update({ output_json: repairedOutput, generation_status: "character_dialogue_plan_repaired", admin_notes: "Production page repaired broken dedicated character-dialogue plan from prompt.", updated_at: new Date().toISOString() })
      .eq("id", production.id);
    production = { ...production, output_json: repairedOutput, generation_status: "character_dialogue_plan_repaired" };
  }
  const characterSheetJobs = jobs.filter((job) => job.stage === "character_sheet");
  const sceneImageJobs = jobs.filter((job) => job.stage === "scene_image");
  const voiceJobs = jobs.filter((job) => job.stage === "voice_segment");
  const readyCharacterSheets = characterSheetJobs.filter((job) => job.imageUrl).length;
  const readySceneImages = sceneImageJobs.filter((job) => job.imageUrl).length;
  const readyVoiceSegments = voiceJobs.filter((job) => job.audioUrl).length;
  const isPlanCreated = String(outputJson.providerStatus ?? "") === "character_dialogue_plan_created"
    || String(plan.status ?? "") === "character_dialogue_plan_created"
    || String(production.generation_status ?? "") === "character_dialogue_i2v_started";
  if (!isPlanCreated && (readyCharacterSheets || readySceneImages || readyVoiceSegments)) return production;
  if (readyCharacterSheets >= characterSheetJobs.length && readySceneImages >= sceneImageJobs.length && readyVoiceSegments >= voiceJobs.length) return production;

  let providerJobs = jobs;
  const runningPlan = { ...workingPlan, status: "running", characterSheetsStatus: "running", sceneImagesStatus: "running", voiceSegmentsStatus: "running", startedAt: workingPlan.startedAt ?? new Date().toISOString() };
  const starterOutput = { ...outputJson, providerStatus: "character_dialogue_initial_stages_running", characterDialoguePlan: runningPlan };
  await supabaseAdmin()
    .from("production_requests")
    .update({
      status: "in_production",
      automation_status: "running",
      generation_status: "character_dialogue_initial_stages_running",
      output_json: starterOutput,
      admin_notes: "Server-side recovery started dedicated initial stages from plan_created state.",
      updated_at: new Date().toISOString()
    })
    .eq("id", production.id);

  if (characterSheetJobs.length && readyCharacterSheets < characterSheetJobs.length) {
    const sheetRun = await runCharacterSheetGeneration({ productionId: production.id, plan: runningPlan as any });
    providerJobs = providerJobs.map((job) => sheetRun.characterSheetJobs.find((sheetJob) => sheetJob.id === job.id) ?? job);
  }
  if (sceneImageJobs.length && providerJobs.filter((job) => job.stage === "scene_image" && job.imageUrl).length < sceneImageJobs.length) {
    const sceneRun = await runSceneImageGeneration({ productionId: production.id, plan: { ...runningPlan, providerJobs } as any, characterSheetJobs: providerJobs.filter((job) => job.stage === "character_sheet") });
    providerJobs = providerJobs.map((job) => sceneRun.sceneImageJobs.find((sceneJob) => sceneJob.id === job.id) ?? job);
  }
  if (voiceJobs.length && providerJobs.filter((job) => job.stage === "voice_segment" && job.audioUrl).length < voiceJobs.length) {
    const voiceRun = await runVoiceSegmentGeneration({ productionId: production.id, plan: { ...runningPlan, providerJobs } as any });
    providerJobs = providerJobs.map((job) => voiceRun.voiceSegmentJobs.find((voiceJob) => voiceJob.id === job.id) ?? job);
  }

  const updatedOutput = { ...starterOutput, providerStatus: "character_dialogue_initial_stages_started", characterDialoguePlan: { ...runningPlan, providerJobs } };
  const { data } = await supabaseAdmin()
    .from("production_requests")
    .update({
      status: "in_production",
      automation_status: "running",
      generation_status: "character_dialogue_initial_stages_started",
      output_json: updatedOutput,
      admin_notes: "Dedicated character sheets, scene images and voice segments were triggered by server-side recovery.",
      updated_at: new Date().toISOString()
    })
    .eq("id", production.id)
    .select("*")
    .maybeSingle();
  return data ?? { ...production, output_json: updatedOutput };
}

async function forceDedicatedFinalAssemblyIfReady(production: Record<string, any>) {
  const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, any> : {};
  const plan = outputJson.characterDialoguePlan && typeof outputJson.characterDialoguePlan === "object" ? outputJson.characterDialoguePlan as Record<string, any> : null;
  if (!plan) return production;
  const jobs = Array.isArray(plan.providerJobs) ? plan.providerJobs as Record<string, any>[] : [];
  if (!jobs.length) return production;
  const i2vJobs = jobs.filter((job) => job.stage === "image_to_video");
  const voiceJobs = jobs.filter((job) => job.stage === "voice_segment");
  const readyI2v = i2vJobs.filter((job) => job.outputUrl).length;
  const readyVoice = voiceJobs.filter((job) => job.audioUrl).length;
  const hasFinalVideo = Boolean(outputJson.finalVideoUrl || production.preview_url || production.delivery_link);
  if (hasFinalVideo || readyI2v < i2vJobs.length || readyVoice < voiceJobs.length || !i2vJobs.length || !voiceJobs.length) return production;

  const existingFinalJob = jobs.find((job) => job.stage === "final_assembly" && job.providerJobId && job.provider);
  let providerJobs = jobs;
  let finalAssemblyRun: Record<string, any> | null = null;
  if (!existingFinalJob) {
    const scenes = Array.isArray(plan.scenes) ? plan.scenes as Record<string, any>[] : [];
    const dialogueTimeline = Array.isArray(plan.dialogueTimeline) ? plan.dialogueTimeline as Record<string, any>[] : [];
    const subtitleLines = dialogueTimeline.map((cue) => `${String(cue.speaker ?? "Character")}: ${String(cue.text ?? "")}`).filter(Boolean);
    finalAssemblyRun = await runDedicatedFinalAssembly({
      title: String(production.title ?? "Character dialogue animation"),
      durationSeconds: Number(scenes.reduce((sum, scene) => sum + Number(scene.durationSeconds ?? 0), 0)) || 15,
      providerJobs: jobs,
      subtitleLines
    }) as Record<string, any>;
    const startedJob = finalAssemblyRun.finalAssemblyJob as Record<string, any> | null | undefined;
    if (startedJob) {
      providerJobs = jobs.some((job) => job.id === startedJob.id) ? jobs.map((job) => job.id === startedJob.id ? startedJob : job) : [...jobs, startedJob];
      const updatedOutput = {
        ...outputJson,
        characterDialoguePlan: { ...plan, providerJobs },
        finalAssemblyRun,
        providerStatus: "character_dialogue_final_render_started"
      };
      const { data } = await supabaseAdmin()
        .from("production_requests")
        .update({
          status: "in_production",
          automation_status: "running",
          generation_status: "character_dialogue_final_render_started",
          output_json: updatedOutput,
          admin_notes: "Server-side recovery started dedicated final Shotstack assembly from ready scene clips and voice segments.",
          updated_at: new Date().toISOString()
        })
        .eq("id", production.id)
        .select("*")
        .maybeSingle();
      if (data) production = data;
    }
  }

  const freshOutput = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, any> : outputJson;
  const freshPlan = freshOutput.characterDialoguePlan && typeof freshOutput.characterDialoguePlan === "object" ? freshOutput.characterDialoguePlan as Record<string, any> : plan;
  const freshJobs = Array.isArray(freshPlan.providerJobs) ? freshPlan.providerJobs as Record<string, any>[] : providerJobs;
  const finalAssemblyPoll = await pollDedicatedFinalAssembly({ providerJobs: freshJobs });
  const polledFinalJob = finalAssemblyPoll.finalAssemblyPolledJob as Record<string, any> | null | undefined;
  const jobsWithFinal = polledFinalJob
    ? freshJobs.some((job) => job.id === polledFinalJob.id)
      ? freshJobs.map((job) => job.id === polledFinalJob.id ? polledFinalJob : job)
      : [...freshJobs, polledFinalJob]
    : freshJobs;

  if (finalAssemblyPoll.finalAssemblyPollStatus === "ready" && finalAssemblyPoll.finalVideoUrl) {
    const finalUrl = String(finalAssemblyPoll.finalVideoUrl);
    let finalAssetMirror: Record<string, any> = { status: "not_attempted" };
    try {
      const storedUrl = await mirrorProviderAsset({ productionId: production.id, sourceUrl: finalUrl, filenameBase: "character-dialogue-final-render", fallbackContentType: "video/mp4" });
      finalAssetMirror = { status: "mirrored_provider_url_primary", providerUrl: finalUrl, storedUrl };
    } catch (mirrorError) {
      finalAssetMirror = { status: "fallback_provider_url", providerUrl: finalUrl, error: safeError(mirrorError, "Dedicated final render could not be mirrored") };
    }
    const readyOutput = {
      ...freshOutput,
      characterDialoguePlan: { ...freshPlan, providerJobs: jobsWithFinal },
      finalAssemblyRun: finalAssemblyRun ?? freshOutput.finalAssemblyRun,
      finalAssemblyPoll,
      finalVideoUrl: finalUrl,
      providerFinalUrl: finalUrl,
      finalAssetMirror,
      providerStatus: "shotstack_succeeded",
      finalRenderFixVersion: "subtitle-audio-v2"
    };
    const readyGate = productionReadyGate({ ...production, preview_url: finalUrl, delivery_link: finalUrl, delivery_zip_url: finalUrl, output_json: readyOutput }, readyOutput);
    const { data } = await supabaseAdmin()
      .from("production_requests")
      .update({
        status: "ready",
        automation_status: "completed",
        generation_status: "final_video_ready",
        preview_url: finalUrl,
        delivery_link: finalUrl,
        delivery_zip_url: finalUrl,
        output_json: { ...readyOutput, readyGate },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_notes: "Dedicated character-dialogue final MP4 is ready via server-side recovery."
      })
      .eq("id", production.id)
      .select("*")
      .maybeSingle();
    return data ?? production;
  }

  const waitingOutput = {
    ...freshOutput,
    characterDialoguePlan: { ...freshPlan, providerJobs: jobsWithFinal },
    finalAssemblyRun: finalAssemblyRun ?? freshOutput.finalAssemblyRun,
    finalAssemblyPoll,
    providerStatus: finalAssemblyPoll.finalAssemblyPollStatus === "waiting" ? "character_dialogue_final_render_polling" : freshOutput.providerStatus
  };
  const { data } = await supabaseAdmin()
    .from("production_requests")
    .update({
      status: "in_production",
      automation_status: "running",
      generation_status: finalAssemblyPoll.finalAssemblyPollStatus === "waiting" ? "character_dialogue_final_render_polling" : "character_dialogue_scene_clips_ready",
      output_json: waitingOutput,
      updated_at: new Date().toISOString()
    })
    .eq("id", production.id)
    .select("*")
    .maybeSingle();
  return data ?? production;
}

export default async function ProductionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  noStore();
  const { id } = await params;
  const productionId = extractProductionId(id);
  let production = null;
  let errorMessage = "";

  try {
    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .select("*")
      .eq("id", productionId)
      .maybeSingle();

    if (error) throw error;
    production = data;

    const outputJson = production?.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, any> : {};
    const recordText = `${production?.production_type ?? ""} ${production?.package_id ?? ""} ${production?.title ?? ""} ${production?.prompt ?? ""} ${JSON.stringify(production?.request_metadata ?? {})} ${JSON.stringify(production?.input_json ?? {})} ${JSON.stringify(outputJson)}`.toLowerCase();
    const looksLikeVideo = /animasyon|animation|video|final mp4|scene plan|voice-over|subtitles|music/.test(recordText);
    const primaryAlternative = Array.isArray(outputJson.alternatives) && outputJson.alternatives[0] && typeof outputJson.alternatives[0] === "object" ? outputJson.alternatives[0] as Record<string, any> : null;
    const realVideoUrl = String(
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
      || production?.preview_url
      || production?.delivery_link
      || ""
    ).trim();
    const hasRealOutput = Boolean(outputJson.visualJob || outputJson.renderJob || (/^https?:\/\//i.test(realVideoUrl) && !/delivery\?file=|zip|readme|source|placeholder|demo|preview\.html|manifest/i.test(realVideoUrl)));
    const isDedicatedCharacterDialogue = String(outputJson.requiredPipeline ?? "") === "character_consistent_dialogue_animation" || Boolean(outputJson.characterDialoguePlan);
    const stuckRunningWithoutOutput = production && !isDedicatedCharacterDialogue && looksLikeVideo && !hasRealOutput && /running|in_production|strategy_running|output_deleted_regenerate|lost_output_recovery/.test(`${production.status ?? ""} ${production.automation_status ?? ""} ${production.generation_status ?? ""}`.toLowerCase());

    if (stuckRunningWithoutOutput) {
      const repairedOutput = {
        ...outputJson,
        automationStatus: "lost_output_recovery",
        providerStatus: "output_deleted_regenerate",
        recoveryReason: "The previous generated output was deleted, so this production must be regenerated.",
        visualJob: null,
        renderJob: null,
        finalVideoUrl: null,
        previewUrl: null,
        deliveryZipUrl: null
      };
      const { data: repaired, error: repairError } = await supabaseAdmin()
        .from("production_requests")
        .update({
          status: "queued",
          automation_status: "lost_output_recovery",
          generation_status: "output_deleted_regenerate",
          output_json: repairedOutput,
          preview_url: null,
          delivery_link: null,
          delivery_zip_url: null,
          admin_notes: "Previous output was deleted. Press Start Production to regenerate this video.",
          updated_at: new Date().toISOString()
        })
        .eq("id", productionId)
        .select("*")
        .maybeSingle();
      if (!repairError && repaired) production = repaired;
    }

    if (production) {
      production = await forceDedicatedInitialStagesIfNeeded(production as Record<string, any>);
      production = await forceDedicatedFinalAssemblyIfReady(production as Record<string, any>);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Production record could not be read.";
  }

  return (
    <DashboardShell className="dashboard-postlaunch-shell production-detail-shell">
      {!production ? (
        <div className="card">
          <span className="badge">Production workspace</span>
          <h2>Production not found</h2>
          <p style={{ color: "var(--muted)" }}>{errorMessage || "This production record could not be found or is not accessible yet."}</p>
          <Link className="btn" href="/dashboard/productions">Back to my productions</Link>
        </div>
      ) : (
        <ProductionWorkspace production={production} />
      )}
    </DashboardShell>
  );
}
