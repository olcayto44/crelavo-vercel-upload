export type ProductionProgressInput = {
  status?: string | null;
  generationStatus?: string | null;
  automationStatus?: string | null;
  outputJson?: Record<string, any> | null;
};

export type ProductionProgressStep = {
  key: string;
  label: string;
  status: "done" | "running" | "waiting" | "blocked";
  detail: string;
};

function value(input: ProductionProgressInput) {
  const output = input.outputJson ?? {};
  return {
    status: String(input.status ?? ""),
    generationStatus: String(input.generationStatus ?? ""),
    automationStatus: String(input.automationStatus ?? output.automationStatus ?? ""),
    providerStatus: String(output.providerStatus ?? ""),
    script: String(output.script ?? ""),
    visualJob: output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : null,
    voiceAudioUrl: String(output.voiceAudioUrl ?? output.voice_audio_url ?? ""),
    subtitleUrl: String(output.subtitleUrl ?? output.subtitle_url ?? ""),
    renderJob: output.renderJob && typeof output.renderJob === "object" ? output.renderJob as Record<string, unknown> : null,
    finalUrl: String(output.finalVideoUrl ?? output.finalAssetMirror ?? output.providerFinalUrl ?? output.previewUrl ?? ""),
    waitingProvider: String(output.providerStatus ?? input.generationStatus ?? input.automationStatus ?? "").includes("waiting_provider_config"),
    failed: /failed|error|cancelled/i.test(`${input.status ?? ""} ${input.generationStatus ?? ""} ${input.automationStatus ?? ""} ${output.providerStatus ?? ""}`)
  };
}

function stepStatus(done: boolean, running: boolean, blocked: boolean): ProductionProgressStep["status"] {
  if (blocked) return "blocked";
  if (done) return "done";
  if (running) return "running";
  return "waiting";
}

export function productionProgressSteps(input: ProductionProgressInput): ProductionProgressStep[] {
  const data = value(input);
  const visualActive = Boolean(data.visualJob) || /visual|provider_visual|running|processing|render/i.test(`${data.providerStatus} ${data.generationStatus} ${data.automationStatus}`);
  const renderActive = Boolean(data.renderJob) || /render/i.test(`${data.providerStatus} ${data.generationStatus} ${data.automationStatus}`);
  return [
    {
      key: "script",
      label: "GPT script / brief",
      status: stepStatus(Boolean(data.script) || !data.waitingProvider, /analysis|brief|queued|production/i.test(`${data.automationStatus} ${data.generationStatus}`), data.failed),
      detail: Boolean(data.script) ? "Script or production brief is recorded." : "Planning and brief extraction are queued."
    },
    {
      key: "voice",
      label: "Voice generated",
      status: stepStatus(Boolean(data.voiceAudioUrl), !data.voiceAudioUrl && visualActive && !data.waitingProvider, data.failed),
      detail: data.voiceAudioUrl ? "Voice asset is attached to the job." : "Voice-over waits for provider readiness or selected voice option."
    },
    {
      key: "video",
      label: "Video provider job",
      status: stepStatus(Boolean(data.visualJob), visualActive && !data.visualJob, data.failed || data.waitingProvider),
      detail: data.visualJob ? `Provider: ${String(data.visualJob.provider ?? "video")}` : data.waitingProvider ? "Provider/API configuration is still required." : "Video job will start after queue and provider checks."
    },
    {
      key: "subtitles",
      label: "Subtitles",
      status: stepStatus(Boolean(data.subtitleUrl), Boolean(data.voiceAudioUrl) && !data.subtitleUrl, data.failed),
      detail: data.subtitleUrl ? "Subtitle file is ready." : "Subtitles are generated only when requested or needed for final render."
    },
    {
      key: "final_mp4",
      label: "Final MP4 / delivery",
      status: stepStatus(Boolean(data.finalUrl), renderActive && !data.finalUrl, data.failed),
      detail: data.finalUrl ? "Final output or preview URL is available in the dashboard." : "Final render waits for visual, voice/subtitle assets and delivery checks."
    }
  ];
}

export function productionProgressPercent(steps: ProductionProgressStep[]) {
  if (steps.length === 0) return 0;
  const score = steps.reduce((sum, step) => sum + (step.status === "done" ? 1 : step.status === "running" ? 0.5 : 0), 0);
  return Math.round((score / steps.length) * 100);
}
