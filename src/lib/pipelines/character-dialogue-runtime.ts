import { createVoiceoverSegments } from "@/lib/providers/elevenlabs";
import { createShotstackRender } from "@/lib/providers/shotstack";
import { createConsistentSceneImage } from "@/lib/providers/stability";
import { getProviderStatus } from "@/lib/providers/status";
import { createImageToVideoClip } from "@/lib/providers/visuals";
import type { CharacterBibleEntry, CharacterDialogueAnimationPlan, CharacterDialogueProviderJob, SceneStoryboardEntry } from "./character-dialogue-pipeline";

function characterSheetPrompt(character: CharacterBibleEntry) {
  return [
    `Create a locked 2D cartoon character reference sheet for ${character.name}.`,
    `Character traits: ${character.lockedTraits.join(", ")}.`,
    "STRICT STYLE LOCK: warm family-friendly clean 2D cartoon only. Same cartoon rendering for every character, including elderly adults and children: flat illustrated shapes, consistent line thickness, simplified faces, no semi-realistic grandfather, no photorealistic skin, no realistic film look, no 3D.",
    "Layout: full body front view, three-quarter view, side view, and face close-up on a clean neutral background.",
    "Purpose: this image will be used as the fixed identity reference for all animation scenes. Keep age, outfit, face, hair, moustache/beard and colors stable."
  ].join(" ");
}

function jobWithResult(job: CharacterDialogueProviderJob, result: Record<string, unknown>): CharacterDialogueProviderJob & Record<string, unknown> {
  return { ...job, status: "ready", ...result };
}

function jobWithError(job: CharacterDialogueProviderJob, error: unknown): CharacterDialogueProviderJob & Record<string, unknown> {
  return { ...job, status: "failed", error: error instanceof Error ? error.message : String(error) };
}

export async function runCharacterSheetGeneration(input: { productionId: string; plan: CharacterDialogueAnimationPlan }) {
  const characterSheetJobs = input.plan.providerJobs.filter((job) => job.stage === "character_sheet");
  const charactersById = new Map(input.plan.characterBible.map((character) => [character.id, character]));
  const results: Array<CharacterDialogueProviderJob & Record<string, unknown>> = [];

  for (const job of characterSheetJobs) {
    const character = charactersById.get(job.inputRef);
    if (!character) {
      results.push(jobWithError(job, `Character not found for ${job.inputRef}`));
      continue;
    }
    try {
      const prompt = characterSheetPrompt(character);
      const image = await createConsistentSceneImage({
        productionId: input.productionId,
        prompt,
        filenameBase: `character-dialogue/character-sheets/${character.id}`,
        aspectRatio: "1:1"
      });
      results.push(jobWithResult(job, { imageUrl: image.imageUrl, model: image.model, provider: image.provider, prompt, fallback: image.fallback, fallbackReason: image.fallbackReason, raw: image.raw }));
    } catch (error) {
      results.push(jobWithError(job, error));
    }
  }

  const completed = results.filter((job) => job.status === "ready").length;
  return {
    characterSheetJobs: results,
    characterSheetStatus: completed === results.length && results.length > 0 ? "ready" : completed > 0 ? "partial" : "failed",
    characterSheetCompleted: completed,
    characterSheetTotal: results.length
  };
}

function sceneImagePrompt(scene: SceneStoryboardEntry, characterSheets: Array<Record<string, unknown>>, characterBible: CharacterBibleEntry[]) {
  const visibleCharacterIds = scene.visibleCharacters.length ? scene.visibleCharacters : characterBible.map((character) => character.id);
  const references = characterSheets
    .filter((job) => visibleCharacterIds.includes(String(job.inputRef)) && typeof job.imageUrl === "string")
    .map((job) => `${String(job.inputRef)} reference: ${String(job.imageUrl)}`)
    .join(" | ");
  const visibleCharacters = characterBible.filter((character) => visibleCharacterIds.includes(character.id));
  const characterDescriptions = visibleCharacters
    .map((character) => `${character.name} (${character.id}): ${character.lockedTraits.join(", ")}`)
    .join(" | ");
  const exactCastLock = visibleCharacters.length
    ? `EXACT CAST LOCK: show exactly ${visibleCharacters.length} human character(s): ${visibleCharacters.map((character) => `one ${character.name}`).join(" and ")}. Do not omit any listed character. Do not duplicate any listed character. No second Dede, no extra grandfather, no replacement child, no lookalike copy.`
    : "";
  return [
    `Create a locked keyframe / scene still for ${scene.title}.`,
    `Location: ${scene.location}.`,
    `Visible character IDs: ${visibleCharacterIds.join(", ") || "as required by the action"}.`,
    exactCastLock,
    characterDescriptions ? `Character bible identity locks: ${characterDescriptions}.` : "Use the character bible traits for identity locking.",
    `Action: ${scene.action}.`,
    scene.dialogue.length ? `Dialogue moment to stage visually: ${scene.dialogue.map((line) => `${line.speaker}: ${line.text}`).join(" / ")}.` : "No dialogue in this exact keyframe.",
    "STRICT STYLE LOCK: all visible characters must share the exact same simple 2D cartoon rendering. Dede must NOT become realistic or semi-realistic; render him as the same flat illustrated cartoon style as the child. No photorealism, no realistic skin, no 3D, no film look, no style drift, no modern outfit changes.",
    "Composition: one clear animation keyframe, medium distance or wide shot staging so dialogue works without close-up lip-sync; characters keep the same age, outfit, face, hair, moustache/beard and proportions as their reference sheets.",
    references ? `Character reference URLs for identity locking: ${references}.` : "Use the written character bible only because no character reference URLs were available."
  ].join(" ");
}

function sceneReferenceUrls(scene: SceneStoryboardEntry, characterSheets: Array<Record<string, unknown>>) {
  const visible = new Set(scene.visibleCharacters);
  return characterSheets
    .filter((job) => (!visible.size || visible.has(String(job.inputRef))) && typeof job.imageUrl === "string")
    .map((job) => String(job.imageUrl));
}

export async function runSceneImageGeneration(input: { productionId: string; plan: CharacterDialogueAnimationPlan; characterSheetJobs: Array<Record<string, unknown>> }) {
  const sceneImageJobs = input.plan.providerJobs.filter((job) => job.stage === "scene_image");
  const scenesById = new Map(input.plan.scenes.map((scene) => [scene.id, scene]));
  const results: Array<CharacterDialogueProviderJob & Record<string, unknown>> = [];

  for (const job of sceneImageJobs) {
    const scene = scenesById.get(job.inputRef);
    if (!scene) {
      results.push(jobWithError(job, `Scene not found for ${job.inputRef}`));
      continue;
    }
    try {
      const prompt = sceneImagePrompt(scene, input.characterSheetJobs, input.plan.characterBible);
      const image = await createConsistentSceneImage({
        productionId: input.productionId,
        prompt,
        filenameBase: `character-dialogue/scene-images/${scene.id}`,
        aspectRatio: "9:16",
        referenceImageUrls: sceneReferenceUrls(scene, input.characterSheetJobs)
      });
      results.push(jobWithResult(job, { imageUrl: image.imageUrl, model: image.model, provider: image.provider, prompt, fallback: image.fallback, fallbackReason: image.fallbackReason, raw: image.raw }));
    } catch (error) {
      results.push(jobWithError(job, error));
    }
  }

  const completed = results.filter((job) => job.status === "ready").length;
  return {
    sceneImageJobs: results,
    sceneImageStatus: completed === results.length && results.length > 0 ? "ready" : completed > 0 ? "partial" : "failed",
    sceneImageCompleted: completed,
    sceneImageTotal: results.length
  };
}

function i2vPrompt(scene: SceneStoryboardEntry) {
  return [
    `Animate ${scene.title} strictly as a warm clean 2D cartoon animation scene.`,
    "STYLE LOCK: 2D cartoon only, flat illustrated family animation, consistent cartoon village look from the source image. Absolutely no live action, no cinematic realistic footage, no photorealistic people, no documentary/film look, no mixed realistic-cartoon transition.",
    `Action: ${scene.action}.`,
    "CAST CONTINUITY LOCK: preserve the exact family cast visible in the source scene image: one elderly grandfather and one young grandchild. Keep both family characters present when both are visible in the source image. Keep the small lamb as a background animal only. Preserve identities without adding extra human characters.",
    scene.dialogue.length ? `Characters are in a natural conversation moment: ${scene.dialogue.map((line) => `${line.speaker}: ${line.text}`).join(" / ")}. Do not create presenter-style camera-facing narration.` : "Natural character movement only.",
    "Camera work: medium distance or wide shot, gentle stable motion, avoid tight close-ups until lip-sync is available.",
    "Keep all character identities, ages, outfits, faces and proportions locked to the source image. Low motion intensity, natural village motion, no style shift, no photorealism. Animals move naturally and do not speak.",
    "Negative: live action, realistic film, photorealism, cinematic realism, style shift, mixed media, changing clothes, facial morphing, changing character age, close-up talking head, extra human characters, identity swap."
  ].join(" ");
}

export async function runImageToVideoGeneration(input: { productionId: string; plan: CharacterDialogueAnimationPlan; sceneImageJobs: Array<Record<string, unknown>> }) {
  const i2vJobs = input.plan.providerJobs.filter((job) => job.stage === "image_to_video");
  const scenesById = new Map(input.plan.scenes.map((scene) => [scene.id, scene]));
  const sceneImagesByJobId = new Map(input.sceneImageJobs.map((job) => [String(job.id), job]));
  const results: Array<CharacterDialogueProviderJob & Record<string, unknown>> = [];
  let submittedNewClip = false;
  const isRetryableI2vJob = (record: CharacterDialogueProviderJob & Record<string, unknown>) => {
    const status = String(record.status ?? "").toLowerCase();
    const providerStatus = String(record.providerStatus ?? "").toLowerCase();
    const error = String(record.error ?? "").toLowerCase();
    const provider = String(record.provider ?? "").toLowerCase();
    const rawRecord = record.raw && typeof record.raw === "object" ? record.raw as Record<string, unknown> : {};
    const createdAtMs = Date.parse(String(rawRecord.createdAt ?? rawRecord.created_at ?? record.createdAt ?? ""));
    const runningTooLong = provider === "runway" && Boolean(record.providerJobId || record.raw) && !String(record.outputUrl ?? "").trim() && Number.isFinite(createdAtMs) && Date.now() - createdAtMs > 4 * 60 * 1000;
    const hasOutput = Boolean(String(record.outputUrl ?? "").trim());
    return runningTooLong
      || status.includes("failed")
      || providerStatus.includes("failed")
      || providerStatus.includes("deleted")
      || providerStatus.includes("lost")
      || providerStatus.includes("retry_failed")
      || error.includes("output_deleted")
      || error.includes("lost_output")
      || error.includes("parallel task over resource pack limit");
  };
  const hasActiveSubmittedClip = i2vJobs.some((job) => {
    const record = job as CharacterDialogueProviderJob & Record<string, unknown>;
    return !String(record.outputUrl ?? "").trim() && Boolean(record.providerJobId || record.raw) && !isRetryableI2vJob(record);
  });

  for (const job of i2vJobs) {
    const existingOutputUrl = String((job as CharacterDialogueProviderJob & Record<string, unknown>).outputUrl ?? "").trim();
    if (existingOutputUrl) {
      results.push({ ...job, status: "ready", outputUrl: existingOutputUrl });
      continue;
    }
    const jobRecord = job as CharacterDialogueProviderJob & Record<string, unknown>;
    const existingProviderJobId = String(jobRecord.providerJobId ?? "").trim();
    const existingRaw = jobRecord.raw;
    const retryableExistingJob = isRetryableI2vJob(jobRecord);
    if ((existingProviderJobId || existingRaw) && !retryableExistingJob) {
      const rawRecord = existingRaw && typeof existingRaw === "object" ? existingRaw as Record<string, unknown> : {};
      const inferredProvider = String(job.provider ?? "").includes("stable_i2v") && (rawRecord.code !== undefined || rawRecord.data) ? "kling" : job.provider;
      results.push({ ...job, provider: inferredProvider, status: "waiting_provider", providerStatus: jobRecord.providerStatus ?? "submitted" });
      continue;
    }
    if (hasActiveSubmittedClip || submittedNewClip) {
      results.push(job);
      continue;
    }
    const sceneImageJob = sceneImagesByJobId.get(job.inputRef);
    const sceneId = String(job.inputRef).replace(/^scene-image-/, "");
    const scene = scenesById.get(sceneId);
    const imageUrl = String(sceneImageJob?.imageUrl ?? "").trim();
    if (!scene) {
      results.push(jobWithError(job, `Scene not found for ${job.inputRef}`));
      continue;
    }
    try {
      const prompt = i2vPrompt(scene);
      if (!imageUrl) {
        results.push(jobWithError(job, `QUALITY_BLOCKED: Scene image not ready for ${job.inputRef}; character consistency cannot be guaranteed. Image-to-video will not start without a locked scene image.`));
        continue;
      }
      const videoJob = await createImageToVideoClip({
        imageUrl,
        prompt,
        durationSeconds: Math.min(5, Math.max(5, scene.durationSeconds)),
        aspectRatio: "9:16",
        provider: "runway_first"
      });
      submittedNewClip = true;
      const cleanedJob = { ...job } as CharacterDialogueProviderJob & Record<string, unknown>;
      delete cleanedJob.error;
      delete cleanedJob.outputUrl;
      results.push({ ...cleanedJob, status: "waiting_provider", providerJobId: videoJob.id, providerStatus: videoJob.status, raw: videoJob.raw, provider: videoJob.provider, prompt, sourceImageUrl: imageUrl, desiredSceneDurationSeconds: scene.durationSeconds });
    } catch (error) {
      const failedJob = jobWithError(job, error) as CharacterDialogueProviderJob & Record<string, unknown>;
      delete failedJob.providerJobId;
      delete failedJob.raw;
      failedJob.provider = "stable_i2v_provider_required";
      failedJob.providerStatus = "retry_failed_provider_selection_or_submit";
      results.push(failedJob);
    }
  }

  const started = results.filter((job) => job.status === "ready" || job.providerJobId || job.raw).length;
  return {
    imageToVideoJobs: results,
    imageToVideoStatus: started === results.length && results.length > 0 ? "started" : started > 0 ? "partial" : "failed",
    imageToVideoStarted: started,
    imageToVideoTotal: results.length
  };
}

export async function runVoiceSegmentGeneration(input: { productionId: string; plan: CharacterDialogueAnimationPlan }) {
  const voiceJobs = input.plan.providerJobs.filter((job) => job.stage === "voice_segment");
  const segments = input.plan.dialogueTimeline.map((cue) => ({
    speaker: cue.speaker,
    text: cue.text,
    start: cue.startSeconds,
    length: cue.durationSeconds
  }));
  if (!segments.length) {
    return { voiceSegmentJobs: [], voiceSegmentStatus: "skipped", voiceSegmentCompleted: 0, voiceSegmentTotal: 0 };
  }
  try {
    const audioSegments = await createVoiceoverSegments({
      productionId: input.productionId,
      segments,
      voiceDirection: "Turkish 2D cartoon character dialogue, expressive but natural, each speaker should feel like a different character."
    });
    const results = voiceJobs.map((job, index) => {
      const segment = audioSegments[index];
      return segment
        ? jobWithResult(job, { audioUrl: segment.audioUrl, speaker: segment.speaker, text: segment.text, start: segment.start, length: segment.length, voiceId: segment.voiceId })
        : jobWithError(job, "Voice segment was not generated");
    });
    const completed = results.filter((job) => job.status === "ready").length;
    return {
      voiceSegmentJobs: results,
      voiceSegmentStatus: completed === results.length && results.length > 0 ? "ready" : completed > 0 ? "partial" : "failed",
      voiceSegmentCompleted: completed,
      voiceSegmentTotal: results.length
    };
  } catch (error) {
    const results = voiceJobs.map((job) => jobWithError(job, error));
    return { voiceSegmentJobs: results, voiceSegmentStatus: "failed", voiceSegmentCompleted: 0, voiceSegmentTotal: results.length };
  }
}

export async function runDedicatedFinalAssembly(input: { title: string; durationSeconds: number; providerJobs: Array<Record<string, unknown>>; subtitleLines?: string[] }) {
  const readyI2vJobs = input.providerJobs.filter((job) => job.stage === "image_to_video" && job.outputUrl);
  const sceneClipUrls = readyI2vJobs.map((job) => String(job.outputUrl));
  const videoDurations = readyI2vJobs.map((job) => {
    const sceneId = String(job.inputRef ?? "").replace(/^scene-image-/, "");
    const scenes = (input.providerJobs.find((item) => item.stage === "final_assembly") as Record<string, unknown> | undefined)?.scenes as Array<Record<string, unknown>> | undefined;
    const scene = scenes?.find((item) => String(item.id) === sceneId);
    return Number(job.desiredSceneDurationSeconds ?? scene?.durationSeconds ?? 5) || 5;
  });
  const audioSegments = input.providerJobs
    .filter((job) => job.stage === "voice_segment" && job.audioUrl)
    .map((job) => ({
      audioUrl: String(job.audioUrl),
      start: Number(job.start ?? 0),
      length: Number(job.length ?? 2)
    }));
  const finalJob = input.providerJobs.find((job) => job.stage === "final_assembly") ?? {
    id: "final-assembly",
    stage: "final_assembly",
    provider: "shotstack",
    inputRef: "dedicated-character-dialogue-assets",
    status: "planned",
    prompt: "Assemble dedicated character-dialogue animation clips, per-character voices and bottom subtitles into the final MP4."
  };
  if (!sceneClipUrls.length) return { finalAssemblyJob: jobWithError(finalJob as CharacterDialogueProviderJob, "No ready scene clips for final assembly"), finalAssemblyStatus: "waiting_scene_clips" };
  try {
    const renderJob = await createShotstackRender({
      title: input.title,
      videoUrls: sceneClipUrls,
      videoDurations,
      audioSegments,
      subtitleLines: input.subtitleLines,
      durationSeconds: input.durationSeconds
    });
    return {
      finalAssemblyJob: jobWithResult(finalJob as CharacterDialogueProviderJob, { provider: renderJob.provider, providerJobId: renderJob.id, providerStatus: renderJob.status, raw: renderJob.raw }),
      finalAssemblyStatus: "started"
    };
  } catch (error) {
    return { finalAssemblyJob: jobWithError(finalJob as CharacterDialogueProviderJob, error), finalAssemblyStatus: "failed" };
  }
}

export async function pollImageToVideoJobs(input: { providerJobs: Array<Record<string, unknown>> }) {
  const allI2vJobs = input.providerJobs.filter((job) => job.stage === "image_to_video");
  const i2vJobs = allI2vJobs.filter((job) => (job.providerJobId && job.provider) || (job.raw && job.provider) || job.outputUrl);
  const missingProviderJobs = allI2vJobs.filter((job) => !job.outputUrl && !job.raw && (!job.providerJobId || !job.provider));
  const results: Array<Record<string, unknown>> = [];
  for (const job of i2vJobs) {
    if (job.outputUrl && !job.providerJobId) {
      results.push({ ...job, status: "ready", providerStatus: job.providerStatus ?? "succeeded" });
      continue;
    }
    if (String(job.provider ?? "").toLowerCase() === "fal") {
      results.push({
        ...job,
        status: "failed",
        providerStatus: "needs_retry_with_stable_i2v_provider",
        error: "FAL image-to-video polling is disabled for character-consistent animation because this workspace returned HTTP 405. Retry with Runway or Kling."
      });
      continue;
    }
    try {
      const rawJob = job.raw && typeof job.raw === "object" ? job.raw as Record<string, unknown> : {};
      const rawData = rawJob.data && typeof rawJob.data === "object" ? rawJob.data as Record<string, unknown> : {};
      const providerJobId = String(job.providerJobId ?? rawJob.task_id ?? rawJob.id ?? rawData.task_id ?? rawData.id ?? "").trim();
      const status = await getProviderStatus({
        provider: String(job.provider),
        id: providerJobId,
        status: String(job.providerStatus ?? rawJob.task_status ?? rawData.task_status ?? "running"),
        raw: job.raw as Record<string, unknown> | undefined
      });
      const nextStatus = status.status === "succeeded" && status.outputUrl ? "ready" : status.status === "failed" ? "failed" : "waiting_provider";
      const nextJob: Record<string, unknown> = {
        ...job,
        providerStatus: status.status,
        outputUrl: status.outputUrl ?? job.outputUrl,
        width: status.width,
        height: status.height,
        durationSeconds: status.durationSeconds,
        hasAudio: status.hasAudio,
        raw: status.raw ?? job.raw,
        status: nextStatus
      };
      if (nextStatus === "failed") nextJob.error = status.error ?? job.error;
      else delete nextJob.error;
      results.push(nextJob);
    } catch (error) {
      results.push({ ...job, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }
  const ready = results.filter((job) => job.status === "ready" && job.outputUrl).length;
  const failed = [...results, ...missingProviderJobs].filter((job) => String(job.status ?? "").includes("failed")).length;
  const polledJobs = [...results, ...missingProviderJobs];
  const errors = polledJobs
    .map((job) => String(job.error ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    imageToVideoPolledJobs: polledJobs,
    readySceneClipUrls: results.map((job) => String(job.outputUrl ?? "")).filter(Boolean),
    imageToVideoPollStatus: ready === allI2vJobs.length && allI2vJobs.length > 0 ? "ready" : ready > 0 ? "partial" : failed === allI2vJobs.length && allI2vJobs.length > 0 ? "failed" : "waiting",
    imageToVideoReady: ready,
    imageToVideoStarted: i2vJobs.length,
    imageToVideoMissingProvider: missingProviderJobs.length,
    imageToVideoTotal: allI2vJobs.length,
    imageToVideoErrors: errors,
    imageToVideoErrorSummary: errors[0] ?? ""
  };
}

export async function pollDedicatedFinalAssembly(input: { providerJobs: Array<Record<string, unknown>> }) {
  const finalJob = input.providerJobs.find((job) => job.stage === "final_assembly" && job.providerJobId && job.provider);
  if (!finalJob) {
    return {
      finalAssemblyPolledJob: null,
      finalAssemblyPollStatus: "missing" as const,
      finalVideoUrl: ""
    };
  }

  try {
    const status = await getProviderStatus({
      provider: String(finalJob.provider),
      id: String(finalJob.providerJobId),
      status: String(finalJob.providerStatus ?? "running"),
      raw: finalJob.raw as Record<string, unknown> | undefined
    });
    const finalAssemblyPolledJob = {
      ...finalJob,
      providerStatus: status.status,
      outputUrl: status.outputUrl ?? finalJob.outputUrl,
      width: status.width,
      height: status.height,
      durationSeconds: status.durationSeconds,
      hasAudio: status.hasAudio,
      error: status.error ?? finalJob.error,
      raw: status.raw ?? finalJob.raw,
      status: status.status === "succeeded" && status.outputUrl ? "ready" : status.status === "failed" ? "failed" : "waiting_provider"
    };
    return {
      finalAssemblyPolledJob,
      finalAssemblyPollStatus: finalAssemblyPolledJob.status === "ready" ? "ready" as const : finalAssemblyPolledJob.status === "failed" ? "failed" as const : "waiting" as const,
      finalVideoUrl: String(finalAssemblyPolledJob.outputUrl ?? "")
    };
  } catch (error) {
    return {
      finalAssemblyPolledJob: { ...finalJob, status: "failed", error: error instanceof Error ? error.message : String(error) },
      finalAssemblyPollStatus: "failed" as const,
      finalVideoUrl: ""
    };
  }
}
