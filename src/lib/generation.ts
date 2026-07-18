export type GenerationRequest = {
  id: string;
  title: string;
  prompt: string;
  video_type?: string | null;
  target_platform?: string | null;
  style?: string | null;
  duration?: string | null;
  extra_notes?: string | null;
  quality?: string | null;
  preview_image_url?: string | null;
  premium_material_type?: string | null;
  premium_material_option?: string | null;
};

export type GenerationStartResult = {
  provider: string;
  jobId: string | null;
  status: "queued" | "provider_not_configured" | "failed";
  error?: string;
};

const durationSeconds: Record<string, number> = {
  "15 seconds": 15,
  "30 seconds": 30,
  "45 seconds": 45,
  "60 seconds": 60,
  "2 minutes": 120,
  "3 minutes": 180,
  "5 minutes": 300,
  "10 minutes": 600,
  "20 minutes": 1200,
  "40 minutes": 2400,
  "60 minutes": 3600,
  Custom: 60
};

function buildPrompt(request: GenerationRequest) {
  const parts = [
    request.prompt,
    request.style ? `Style: ${request.style}` : "",
    request.video_type ? `Video type: ${request.video_type}` : "",
    request.target_platform ? `Target platform: ${request.target_platform}` : "",
    request.premium_material_type && request.premium_material_type !== "No premium material" ? `Premium material: ${request.premium_material_type} - ${request.premium_material_option ?? ""}` : "",
    request.extra_notes ? `Extra notes: ${request.extra_notes}` : ""
  ];

  return parts.filter(Boolean).join("\n");
}

function falEndpointForRequest(request: GenerationRequest) {
  if (request.preview_image_url?.startsWith("http")) return "fal-ai/kling-video/v1/standard/image-to-video";
  return process.env.FAL_VIDEO_MODEL || "fal-ai/kling-video/v1/standard/text-to-video";
}

function selectedProvider() {
  return (process.env.GENERATION_PROVIDER || "replicate").toLowerCase();
}

function replicateVersion() {
  return process.env.REPLICATE_VIDEO_VERSION || "";
}

function replicateModel() {
  return process.env.REPLICATE_MODEL || "wan-video/wan-2.2-t2v-fast";
}

export async function startFalGeneration(request: GenerationRequest): Promise<GenerationStartResult> {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  const provider = "fal.ai";

  if (!falKey) {
    return {
      provider,
      jobId: null,
      status: "provider_not_configured",
      error: "FAL_KEY is missing. Request was queued but no provider job was started."
    };
  }

  const endpoint = falEndpointForRequest(request);
  const seconds = Math.min(durationSeconds[request.duration ?? ""] ?? 5, 10);
  const input: Record<string, unknown> = {
    prompt: buildPrompt(request),
    duration: `${seconds}s`
  };

  if (request.preview_image_url?.startsWith("http")) {
    input.image_url = request.preview_image_url;
  }

  const response = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      provider,
      jobId: null,
      status: "failed",
      error: typeof data?.detail === "string" ? data.detail : `Fal.ai request failed with status ${response.status}`
    };
  }

  return {
    provider,
    jobId: String(data.request_id ?? data.requestId ?? ""),
    status: "queued"
  };
}

export async function startReplicateGeneration(request: GenerationRequest): Promise<GenerationStartResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  const version = replicateVersion();
  const model = replicateModel();
  const provider = "replicate";

  if (!token) {
    return {
      provider,
      jobId: null,
      status: "provider_not_configured",
      error: "REPLICATE_API_TOKEN is missing. Request was queued but no provider job was started."
    };
  }

  const seconds = Math.min(durationSeconds[request.duration ?? ""] ?? 5, 10);
  const input: Record<string, unknown> = {
    prompt: buildPrompt(request),
    duration: seconds
  };

  if (request.preview_image_url?.startsWith("http")) {
    input.image = request.preview_image_url;
  }

  const modelPath = model.split("/");
  const useModelEndpoint = !version && modelPath.length === 2;
  const response = await fetch(
    useModelEndpoint ? `https://api.replicate.com/v1/models/${modelPath[0]}/${modelPath[1]}/predictions` : "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=0"
      },
      body: JSON.stringify(version ? { version, input } : { input })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      provider,
      jobId: null,
      status: "failed",
      error: typeof data?.detail === "string" ? data.detail : data?.error ?? `Replicate request failed with status ${response.status}`
    };
  }

  return {
    provider,
    jobId: String(data.id ?? ""),
    status: "queued"
  };
}

export async function getReplicateGenerationStatus(jobId: string) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return { status: "provider_not_configured", error: "REPLICATE_API_TOKEN is missing." };
  }

  const response = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { status: "failed", error: data?.detail ?? data?.error ?? `Replicate status failed with status ${response.status}` };
  }

  if (data.status === "succeeded") {
    const output = data.output;
    const videoUrl = Array.isArray(output) ? output[0] : typeof output === "string" ? output : output?.url ?? null;
    return { status: "completed", videoUrl, raw: data };
  }

  if (data.status === "failed" || data.status === "canceled") {
    return { status: "failed", error: data.error ?? `Replicate prediction ${data.status}`, raw: data };
  }

  return { status: String(data.status ?? "processing"), raw: data };
}

export async function startGeneration(request: GenerationRequest): Promise<GenerationStartResult> {
  return selectedProvider() === "fal" || selectedProvider() === "fal.ai"
    ? startFalGeneration(request)
    : startReplicateGeneration(request);
}

export async function getGenerationStatus(provider: string | null | undefined, jobId: string) {
  return provider === "fal.ai" || provider === "fal"
    ? getFalGenerationStatus(jobId)
    : getReplicateGenerationStatus(jobId);
}

export async function getFalGenerationStatus(jobId: string) {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  const endpoint = process.env.FAL_VIDEO_MODEL || "fal-ai/kling-video/v1/standard/text-to-video";

  if (!falKey) {
    return { status: "provider_not_configured", error: "FAL_KEY is missing." };
  }

  const statusResponse = await fetch(`https://queue.fal.run/${endpoint}/requests/${jobId}/status`, {
    headers: { Authorization: `Key ${falKey}` }
  });
  const statusData = await statusResponse.json().catch(() => ({}));

  if (!statusResponse.ok) {
    return { status: "failed", error: statusData?.detail ?? `Fal.ai status failed with status ${statusResponse.status}` };
  }

  if (statusData.status !== "COMPLETED") {
    return { status: String(statusData.status ?? "processing").toLowerCase(), raw: statusData };
  }

  const resultResponse = await fetch(`https://queue.fal.run/${endpoint}/requests/${jobId}`, {
    headers: { Authorization: `Key ${falKey}` }
  });
  const resultData = await resultResponse.json().catch(() => ({}));

  if (!resultResponse.ok) {
    return { status: "failed", error: resultData?.detail ?? `Fal.ai result failed with status ${resultResponse.status}` };
  }

  const videoUrl = resultData?.video?.url ?? resultData?.video_url ?? resultData?.url ?? null;
  return { status: "completed", videoUrl, raw: resultData };
}
