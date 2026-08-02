type ProductionForReadyGate = {
  production_type?: string | null;
  package_id?: string | null;
  preview_url?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  request_metadata?: unknown;
  input_json?: unknown;
  output_json?: unknown;
};

type ReadyGateResult = {
  passed: boolean;
  required: string[];
  missing: string[];
  warnings: string[];
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function textBlob(...values: unknown[]) {
  return values.map((value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(" ");
    if (value && typeof value === "object") return JSON.stringify(value);
    return "";
  }).join(" ").toLowerCase();
}

function hasUrl(...values: unknown[]) {
  return values.some((value) => typeof value === "string" && /^https?:\/\//i.test(value.trim())) || values.some((value) => typeof value === "string" && value.trim().startsWith("/api/"));
}

function hasPlayableVideoUrl(...values: unknown[]) {
  return values.some((value) => {
    const url = String(value ?? "").trim();
    if (!/^https?:\/\//i.test(url)) return false;
    if (/preview\.html|manifest|readme|placeholder|generated_on_download|\/api\/productions\/.*\/delivery\?file=/i.test(url)) return false;
    return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
  });
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function mediaStatusValue(output: Record<string, unknown>, key: string) {
  const renderStatus = objectValue(output.renderStatus);
  const visualStatus = objectValue(output.visualStatus);
  return output[key] ?? renderStatus[key] ?? visualStatus[key];
}

function requestedDurationSeconds(signal: string, production: ProductionForReadyGate, metadata: Record<string, unknown>, input: Record<string, unknown>) {
  const explicit = numberValue((metadata as Record<string, unknown>).output_duration_seconds, (input as Record<string, unknown>).output_duration_seconds, objectValue(metadata.plan).selected_duration, objectValue(input.plan).selected_duration);
  if (explicit) return explicit;
  const minuteMatch = signal.match(/(\d+)\s*(min|minute|dk)/i);
  if (minuteMatch) return Number(minuteMatch[1]) * 60;
  const secondMatch = signal.match(/(\d+)\s*(sec|second|sn)/i);
  if (secondMatch) return Number(secondMatch[1]);
  return numberValue((production as Record<string, unknown>).output_duration_seconds);
}

function minResolution(signal: string) {
  if (/4k/.test(signal)) return { shortSide: 2160, label: "4k" };
  if (/1080p/.test(signal)) return { shortSide: 1080, label: "1080p" };
  if (/720p/.test(signal)) return { shortSide: 720, label: "720p" };
  if (/480p/.test(signal)) return { shortSide: 480, label: "480p" };
  return null;
}

export function productionReadyGate(production: ProductionForReadyGate, outputOverride?: Record<string, unknown>): ReadyGateResult {
  const metadata = objectValue(production.request_metadata);
  const input = objectValue(production.input_json);
  const output = outputOverride ?? objectValue(production.output_json);
  const setup = objectValue(metadata.productionSetup ?? input.productionSetup ?? output.productionSetup);
  const selectedOptions = [
    ...arrayStrings(metadata.selectedOptions),
    ...arrayStrings(metadata.productionCards),
    ...arrayStrings(input.selectedOptions),
    ...arrayStrings(input.productionCards),
    ...Object.values(setup).flatMap(arrayStrings)
  ];
  const type = String(production.production_type ?? "").toLowerCase();
  const isProject = ["website", "saas", "mobile_app", "admin_project"].includes(type);
  const signal = textBlob(type, production.package_id, metadata, input, output, selectedOptions);
  const required = new Set<string>();
  const missing: string[] = [];
  const warnings: string[] = [];

  if (isProject) {
    required.add("preview");
    required.add("source_code");
    required.add("readme");
    required.add("delivery_zip");
  } else {
    required.add("preview");
    const voiceExplicitlyDisabled = /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|voice-?over\s*(off|none)|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(signal);
    const subtitlesExplicitlyDisabled = /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|subtitles?\s*(off|none)|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(signal);
    if (/mp4|video|final mp4|talking|avatar|lip.?sync|drone|animation|clip|music video/.test(signal)) required.add("final_video");
    if (/zip|final zip|production package/.test(signal)) required.add("delivery_zip");
    if (!voiceExplicitlyDisabled && /voice|voice-over|seslendirme|dubbing|audio|own voice|ai voice|male voice|female voice|child voice|senior voice/.test(signal)) required.add("voice_audio_or_final_render");
    if (!subtitlesExplicitlyDisabled && /subtitle|subtitles|altyaz|caption|captions/.test(signal)) required.add("subtitle_or_burned_render");
    if (/thumbnail|cover visual/.test(signal)) required.add("thumbnail");
    if (/png|jpg|jpeg|image|visual|poster|brand kit/.test(signal) && !/video/.test(type)) required.add("final_image");
    if (/pdf|document|seo|report|csv|keywords/.test(signal)) required.add("document_delivery");
  }

  const previewUrl = output.previewUrl ?? output.preview_url ?? production.preview_url;
  const finalVideoUrl = output.finalVideoUrl ?? output.final_video_url ?? output.providerFinalUrl ?? output.playbackUrl;
  const voiceAudioUrl = output.voiceAudioUrl ?? output.voice_audio_url;
  const subtitleUrl = output.subtitleUrl ?? output.subtitle_url;
  const thumbnailUrl = output.thumbnailUrl ?? output.thumbnail_url;
  const imageUrl = output.finalImageUrl ?? output.imageUrl ?? output.final_image_url ?? output.previewUrl ?? production.preview_url;
  const documentUrl = output.documentUrl ?? output.pdfUrl ?? output.reportUrl ?? output.deliveryLink ?? production.delivery_link;
  const deliveryZipUrl = output.deliveryZipUrl ?? output.delivery_zip_url ?? production.delivery_zip_url ?? production.delivery_link;
  const sourceUrl = output.sourceFilesUrl ?? output.source_files_url ?? production.source_files_url;
  const readmeUrl = output.readmeUrl ?? output.readme_url ?? production.readme_url;

  const dedicatedRequired = String(output.requiredPipeline ?? "") === "character_consistent_dialogue_animation" || Boolean(output.characterDialoguePlan);
  if (dedicatedRequired) {
    const plan = objectValue(output.characterDialoguePlan);
    const jobs = Array.isArray(plan.providerJobs) ? plan.providerJobs as Array<Record<string, unknown>> : [];
    const count = (stage: string) => jobs.filter((job) => job.stage === stage).length;
    const readyCount = (stage: string, key: string) => jobs.filter((job) => job.stage === stage && String(job[key] ?? "").trim()).length;
    const characterSheetTotal = count("character_sheet");
    const sceneImageTotal = count("scene_image");
    const i2vTotal = count("image_to_video");
    const voiceTotal = count("voice_segment");
    const finalAssemblyReady = jobs.some((job) => job.stage === "final_assembly" && hasPlayableVideoUrl(job.outputUrl));
    required.add("character_sheets_complete");
    required.add("scene_images_complete");
    required.add("i2v_clips_complete");
    required.add("voice_segments_complete");
    required.add("subtitle_timing_complete");
    required.add("final_assembly_complete");
    required.add("playable_final_video");
    if (!characterSheetTotal || readyCount("character_sheet", "imageUrl") < characterSheetTotal) missing.push("character_sheets_complete");
    if (!sceneImageTotal || readyCount("scene_image", "imageUrl") < sceneImageTotal) missing.push("scene_images_complete");
    if (!i2vTotal || readyCount("image_to_video", "outputUrl") < i2vTotal) missing.push("i2v_clips_complete");
    if (!voiceTotal || readyCount("voice_segment", "audioUrl") < voiceTotal) missing.push("voice_segments_complete");
    if (!hasUrl(output.subtitleUrl, output.subtitle_url, finalVideoUrl)) missing.push("subtitle_timing_complete");
    if (!finalAssemblyReady && !hasPlayableVideoUrl(finalVideoUrl)) missing.push("final_assembly_complete");
    if (!hasPlayableVideoUrl(finalVideoUrl)) missing.push("playable_final_video");
  }

  if (required.has("preview") && !hasUrl(previewUrl, finalVideoUrl, imageUrl, documentUrl)) missing.push("preview");
  if (required.has("final_video") && !hasUrl(finalVideoUrl, production.delivery_link)) missing.push("final_video");
  if (required.has("voice_audio_or_final_render") && !hasUrl(voiceAudioUrl, finalVideoUrl)) missing.push("voice_audio_or_final_render");
  if (required.has("subtitle_or_burned_render") && !hasUrl(subtitleUrl, finalVideoUrl)) missing.push("subtitle_or_burned_render");
  if (required.has("thumbnail") && !hasUrl(thumbnailUrl)) {
    if (hasUrl(finalVideoUrl, production.delivery_link)) warnings.push("thumbnail_missing");
    else missing.push("thumbnail");
  }
  if (required.has("final_image") && !hasUrl(imageUrl)) missing.push("final_image");
  if (required.has("document_delivery") && !hasUrl(documentUrl, deliveryZipUrl)) missing.push("document_delivery");
  if (required.has("delivery_zip") && !hasUrl(deliveryZipUrl)) missing.push("delivery_zip");
  if (required.has("source_code") && !hasUrl(sourceUrl)) missing.push("source_code");
  if (required.has("readme") && !hasUrl(readmeUrl)) missing.push("readme");

  const requestedResolution = minResolution(signal);
  const width = numberValue(mediaStatusValue(output, "width"));
  const height = numberValue(mediaStatusValue(output, "height"));
  const duration = numberValue(mediaStatusValue(output, "durationSeconds"));
  const hasAudio = mediaStatusValue(output, "hasAudio");
  const requestedDuration = requestedDurationSeconds(signal, production, metadata, input);

  const hasFinalVideoUrl = hasUrl(finalVideoUrl, production.delivery_link);

  if (required.has("final_video") && requestedResolution) {
    if (!width || !height) {
      if (hasFinalVideoUrl) warnings.push(`media_probe_${requestedResolution.label}_missing`);
      else missing.push(`media_probe_${requestedResolution.label}`);
    } else if (Math.min(width, height) < requestedResolution.shortSide) {
      if (hasFinalVideoUrl) warnings.push(`resolution_below_${requestedResolution.label}`);
      else missing.push(`resolution_below_${requestedResolution.label}`);
    }
  }

  if (required.has("final_video") && requestedDuration >= 5) {
    if (!duration) {
      if (hasFinalVideoUrl) warnings.push("duration_probe_missing");
      else missing.push("duration_probe_missing");
    } else {
      const lower = requestedDuration * 0.75;
      const upper = requestedDuration * 1.35;
      if (duration < lower || duration > upper) missing.push("duration_out_of_range");
    }
  }

  if (required.has("voice_audio_or_final_render")) {
    if (hasAudio === false) missing.push("final_video_audio_track_missing");
    if (hasAudio === undefined && !hasUrl(voiceAudioUrl)) missing.push("audio_probe_missing");
  }

  if (/lip.?sync|dudak/.test(signal)) {
    const providerStatus = String(output.providerStatus ?? "").toLowerCase();
    const lipSyncQuality = output.lipSyncQuality && typeof output.lipSyncQuality === "object" ? output.lipSyncQuality as Record<string, unknown> : null;
    if (!/heygen|lip|sync|succeeded|completed/.test(providerStatus) && !lipSyncQuality) missing.push("lipsync_provider_quality_missing");
    else if (lipSyncQuality && lipSyncQuality.status && String(lipSyncQuality.status).toLowerCase() !== "passed") missing.push("lipsync_quality_failed");
  }

  return { passed: missing.length === 0, required: Array.from(required), missing: Array.from(new Set(missing)), warnings };
}
