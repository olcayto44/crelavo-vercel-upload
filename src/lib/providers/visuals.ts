import { optionalEnv, requireProviderEnv } from "./env";
import { createMiniMaxH3VideoTask, hasMiniMaxVideoConfig, miniMaxTaskRecord } from "./minimax";
import { assertFfmpegAvailable } from "@/lib/ffmpeg-runtime";
import { miniMaxProductionSettings, miniMaxSegmentDurations } from "./minimax-production-settings";
import type { ProviderJob } from "./types";

function falApiKey() {
  return requireProviderEnv("fal");
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => Boolean(optionalEnv(name)));
}

function hasMiniMaxVideoEnv() {
  return hasAnyEnv(["MINIMAX_API_KEY", "MINIMAX_KEY"]) && hasAnyEnv(["MINIMAX_GROUP_ID", "MINIMAX_GID", "MINIMAX_GROUPID"]);
}

function miniMaxRatio(value: string) {
  return (["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const).includes(value as never) ? value as "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" : "9:16";
}

function miniMaxResolution(signal = "") {
  return /2k|cinematic|sinematik|drone|satellite|premium|luxury|4k/i.test(signal) ? "2K" as const : "768P" as const;
}


function selectedI2vProvider(requested?: string) {
  const allowFalI2v = String(optionalEnv("ALLOW_FAL_I2V") || "").toLowerCase() === "true";
  const candidate = String(requested || optionalEnv("I2V_PROVIDER") || optionalEnv("IMAGE_TO_VIDEO_PROVIDER") || "").trim().toLowerCase();
  if (["minimax", "minimax_h3", "minimax-h3"].includes(candidate)) return "minimax";
  if (["runway", "runwayml", "runway_ml", "runway_first"].includes(candidate)) return "runway";
  if (["kling", "klingai", "kling_ai"].includes(candidate)) return "kling";
  if (candidate === "fal" && allowFalI2v) return "fal";
  const videoProvider = String(optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "").trim().toLowerCase();
  if (["minimax", "minimax_h3", "minimax-h3"].includes(videoProvider)) return "minimax";
  if (["runway", "runwayml", "runway_ml"].includes(videoProvider)) return "runway";
  if (["kling", "klingai", "kling_ai"].includes(videoProvider)) return "kling";
  if (hasMiniMaxVideoEnv()) return "minimax";
  if (hasAnyEnv(["RUNWAY_API_KEY"])) return "runway";
  if (hasAnyEnv(["KLING_API_KEY", "KLING_AI_API_KEY", "KLINGAI_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY"])) return "kling";
  return "unavailable";
}

function asciiHeaderValue(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/[^\x20-\x7E]/g, "").trim() || fallback;
}

function i2vProviderOrder(requested?: string) {
  const primary = selectedI2vProvider(requested);
  const order: string[] = [];
  if (primary !== "unavailable") order.push(primary);
  if (hasMiniMaxVideoEnv() && !order.includes("minimax")) order.push("minimax");
  if (hasAnyEnv(["RUNWAY_API_KEY"]) && !order.includes("runway")) order.push("runway");
  if (hasAnyEnv(["KLING_API_KEY", "KLING_AI_API_KEY", "KLINGAI_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY"]) && !order.includes("kling")) order.push("kling");
  if (String(optionalEnv("ALLOW_FAL_I2V") || "").toLowerCase() === "true" && !order.includes("fal")) order.push("fal");
  return order;
}

export async function createImageToVideoClip(input: { imageUrl: string; prompt: string; durationSeconds: number; provider?: string; aspectRatio?: string }): Promise<ProviderJob> {
  const requestedProvider = String(input.provider || "").trim().toLowerCase();
  if (requestedProvider === "runway_first") {
    const order = ["runway", "kling", ...(String(optionalEnv("ALLOW_FAL_I2V") || "").toLowerCase() === "true" ? ["fal"] : [])];
    const errors: string[] = [];
    for (const candidate of order) {
      try {
        return await createImageToVideoClip({ ...input, provider: candidate });
      } catch (error) {
        errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`QUALITY_BLOCKED: No image-to-video provider completed after Runway-first fallback. ${errors.join(" | ")}`);
  }
  const provider = selectedI2vProvider(input.provider);
  const safeDuration = Math.min(10, Math.max(5, input.durationSeconds));
  const requestedRatio = input.aspectRatio || "9:16";
  const runwayRatio = requestedRatio.includes("16:9") ? "1280:720" : requestedRatio.includes("1:1") ? "960:960" : "720:1280";
  const negativePrompt = "shaking style, changing clothes, facial morphing, morphing face, realistic style transition, changing character age, close-up talking head";
  const motionStrength = 0.35;

  if (!input.provider) {
    const providers = i2vProviderOrder();
    const errors: string[] = [];
    for (const candidate of providers) {
      try {
        return await createImageToVideoClip({ ...input, provider: candidate });
      } catch (error) {
        errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`QUALITY_BLOCKED: No stable image-to-video provider completed for character-consistent animation. ${errors.join(" | ") || "Configure RUNWAY_API_KEY or KLING_API_KEY."}`);
  }

  if (provider === "minimax") {
    const resolution = miniMaxResolution(`${input.prompt} ${input.aspectRatio ?? ""}`);
    const result = await createMiniMaxH3VideoTask({
      content: [
        { type: "text", text: input.prompt },
        { type: "image_url", image_url: { url: input.imageUrl }, role: "first_frame" }
      ],
      resolution,
      duration: safeDuration as 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
      ratio: miniMaxRatio(requestedRatio)
    });
    const task = miniMaxTaskRecord(result);
    if (!task.taskId) throw new Error(`MiniMax did not return a task id: ${JSON.stringify(result).slice(0, 500)}`);
    return { provider: "minimax", id: task.taskId, status: task.status, raw: { ...result, sourceImageUrl: input.imageUrl, resolution, ratio: miniMaxRatio(requestedRatio) } };
  }

  if (provider === "runway") {
    const apiKey = requireProviderEnv("runway");

    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: asciiHeaderValue(`Bearer ${apiKey}`),
        "Content-Type": "application/json",
        "X-Runway-Version": asciiHeaderValue(process.env.RUNWAY_API_VERSION, "2024-11-06")
      },
      body: JSON.stringify({ promptText: prompt, duration: safeDuration, ratio: runwayRatio })
    });

    if (!response.ok) throw new Error(`Runway video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "runway", id: data.id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "kling") {
    const apiKey = requireProviderEnv("kling");
    const response = await fetch(process.env.KLING_API_URL || "https://api.klingai.com/v1/videos/text2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: requestedRatio })
    });

    if (!response.ok) throw new Error(`Kling video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "kling", id: data.id ?? data.task_id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "fal") {
    const apiKey = falApiKey();
    const model = optionalEnv("FAL_VIDEO_MODEL") || "fal-ai/wan/v2.2-a14b/text-to-video/turbo";
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: requestedRatio })
    });

    if (!response.ok) throw new Error(`FAL video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "fal", id: data.request_id ?? data.id, status: data.status ?? "queued", raw: { ...data, model } };
  }

  throw new Error(`Unsupported VIDEO_PROVIDER: ${provider}`);
}

export async function createVisualVideoSegments(input: { productionId: string; scenes: string[]; productImageUrls: string[]; durationSeconds: number; style?: string; provider?: string; aspectRatio?: string; providerPrompt?: string; quality?: string; testMode?: boolean }): Promise<ProviderJob[]> {
  const provider = String(input.provider || optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "replicate").trim().toLowerCase();
  const segmentDurations = provider === "minimax" ? miniMaxSegmentDurations(input.durationSeconds) : [input.durationSeconds];
  if (provider === "minimax" && input.durationSeconds > 15) assertFfmpegAvailable();
  if (segmentDurations.length === 1) return [await createVisualVideo(input)];
  const jobs: ProviderJob[] = [];
  for (let index = 0; index < segmentDurations.length; index += 1) {
    const durationSeconds = segmentDurations[index];
    const job = await createVisualVideo({
      ...input,
      durationSeconds,
      providerPrompt: `${input.providerPrompt ?? input.scenes.join(" | ")}\nSegment ${index + 1}/${segmentDurations.length}: create a distinct consecutive 15-second beat that continues the overall production without repeating the previous beat.`
    });
    jobs.push({ ...job, segmentIndex: index + 1, order: index + 1, requestedDurationSeconds: durationSeconds });
  }
  return jobs;
}

export async function createVisualVideo(input: { productionId: string; scenes: string[]; productImageUrls: string[]; durationSeconds: number; style?: string; provider?: string; aspectRatio?: string; providerPrompt?: string; quality?: string; testMode?: boolean }): Promise<ProviderJob> {
  const requestedProvider = String(input.provider || optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "replicate").trim().toLowerCase();
  const provider = requestedProvider;
  if (provider === "minimax" && !hasMiniMaxVideoConfig()) {
    throw new Error("MiniMax video provider requires MINIMAX_API_KEY (or MINIMAX_KEY) and MINIMAX_GROUP_ID (or MINIMAX_GID/MINIMAX_GROUPID).");
  }
  const safeDuration = Math.min(15, Math.max(5, input.durationSeconds));
  const hasAnyVideoProviderConfigured = hasAnyEnv(["MINIMAX_API_KEY", "MINIMAX_KEY", "RUNWAY_API_KEY", "KLING_API_KEY", "KLING_AI_API_KEY", "KLINGAI_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY", "FAL_KEY", "FAL_API_KEY", "REPLICATE_API_TOKEN"]);
  if (!hasAnyVideoProviderConfigured) {
    throw new Error("provider_required: no real video provider is configured for this campaign. Configure MiniMax, Replicate, FAL, Runway or Kling before starting production.");
  }
  const requestedRatio = input.aspectRatio || "9:16";
  const runwayRatio = requestedRatio.includes("16:9") ? "1280:720" : requestedRatio.includes("1:1") ? "960:960" : "720:1280";
  const promptSignal = `${input.style ?? ""} ${input.scenes.join(" ")}`;
  const isDroneLocationVideo = /drone|satellite|aerial|flyover|kuşbakışı|kuş\s*bakışı|uydu|havadan|location\s*video|konum\s*videosu/i.test(promptSignal);
  const isCrelavoUiDemo = !isDroneLocationVideo && /crelavo|paste a link|get an ad|dashboard|link input|ai analysis|page analysis|linked page|product benefits|ad script|scene plan|mp4 preview|export buttons|tiktok|reels|shorts/i.test(promptSignal);
  const isNarrative = !isCrelavoUiDemo && !isDroneLocationVideo && /sahne|scene|animasyon|animation|çizgi film|cizgi film|character|karakter|dialogue|diyalog/i.test(promptSignal);
  const strictNoPeople = !isDroneLocationVideo && /no\s*people|without\s*(people|human)|do\s+not\s+include\s+(?:any\s+)?(?:people|humans)|insan\s*olmas[ıi]n|kişi\s*olmas[ıi]n|kisi\s*olmas[ıi]n|insans[ıi]z|no office|office\s*olmas[ıi]n|ofis\s*olmas[ıi]n/i.test(promptSignal);
  const prompt = [
    isDroneLocationVideo
      ? "Create a geographically focused AI drone / satellite-style location flyover for the exact requested place. Use only aerial views of the supplied location and reference imagery, nearby roads, property layout and surrounding area. No presenter, no people, no office, no SaaS dashboard, no split-screen collage, no product advertisement, no Crelavo promotional content, and no generic business stock footage. Do not invent a different city or neighborhood."
      : isCrelavoUiDemo
        ? "Create a premium high-fidelity realistic SaaS product UI demo video, suitable for 4K delivery. Show only polished software dashboard screens, crisp browser UI, Crelavo brand/interface, cursor-like interface motion, clean product panels, timeline blocks, export controls and brand-safe motion graphics. No office, no people, no presenter, no children, no characters, no split-screen humans, no cartoon, no semi-cartoon, no lip-sync, no talking head, no stock footage, no cheap test-video look."
        : isNarrative
          ? "Create a coherent narrative animation/video clip for this exact scene. Keep character count, roles, costumes, setting and action consistent with the scene description. Do not turn it into an e-commerce ad or provider test."
          : "Create a polished realistic product ad video with premium composition and high visual fidelity.",
    isDroneLocationVideo ? "ABSOLUTE DRONE NEGATIVE: no humans, no faces, no presenters, no office workers, no meeting rooms, no dashboards, no UI panels, no split-screen layout, no stock footage, no fake logos, no embedded text, no fake map labels, no misspelled typography. Keep the frame clean for post-production overlays." : "",
    strictNoPeople ? "ABSOLUTE NEGATIVE: no office, no workplace, no meeting room, no employees, no humans, no faces, no presenters, no people walking, no people typing, no people talking, no stock business footage. Only Crelavo software UI screens, animated interface panels, motion graphics, text cards, charts, export screens and product dashboard visuals." : "",
    input.style ? `Style: ${input.style}.` : "",
    `Target duration: ${safeDuration} seconds.`,
    `Scenes: ${input.scenes.join(" | ")}`,
    input.productImageUrls.length ? `Product references: ${input.productImageUrls.join(", ")}` : ""
  ].filter(Boolean).join("\n");

  if (provider === "minimax") {
    const settings = miniMaxProductionSettings({ durationSeconds: safeDuration, aspectRatio: requestedRatio, quality: input.quality, prompt: input.providerPrompt ?? prompt, testMode: input.testMode });
    const result = await createMiniMaxH3VideoTask({
      content: [{ type: "text", text: settings.providerPrompt }],
      resolution: settings.resolution,
      duration: settings.duration,
      ratio: settings.ratio
    });
    const task = miniMaxTaskRecord(result);
    if (!task.taskId) throw new Error(`MiniMax did not return a task id: ${JSON.stringify(result).slice(0, 500)}`);
    return { provider: "minimax", id: task.taskId, task_id: task.taskId, status: task.status, raw: { ...result, resolution: settings.resolution, ratio: settings.ratio, providerPrompt: settings.providerPrompt } };
  }

  if (provider === "replicate") {
    const apiKey = requireProviderEnv("replicate");
    const version = optionalEnv("REPLICATE_VIDEO_VERSION");
    const model = optionalEnv("REPLICATE_MODEL") || "wan-video/wan-2.2-t2v-fast";
    const inputPayload = {
      prompt,
      duration: safeDuration,
      aspect_ratio: requestedRatio
    };
    const endpoint = version ? "https://api.replicate.com/v1/predictions" : `https://api.replicate.com/v1/models/${model}/predictions`;
    const body = version ? { version, input: inputPayload } : { input: inputPayload };
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 10) || 10;
      await new Promise((resolve) => setTimeout(resolve, Math.min(20, retryAfter + 1) * 1000));
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    if (!response.ok) throw new Error(`Replicate video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "replicate", id: data.id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "runway") {
    const apiKey = requireProviderEnv("runway");
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: asciiHeaderValue(`Bearer ${apiKey}`),
        "Content-Type": "application/json",
        "X-Runway-Version": asciiHeaderValue(process.env.RUNWAY_API_VERSION, "2024-11-06")
      },
      body: JSON.stringify({ promptText: prompt, duration: safeDuration, ratio: runwayRatio })
    });

    if (!response.ok) throw new Error(`Runway video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "runway", id: data.id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "kling") {
    const apiKey = requireProviderEnv("kling");
    const response = await fetch(process.env.KLING_API_URL || "https://api.klingai.com/v1/videos/text2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: requestedRatio })
    });

    if (!response.ok) throw new Error(`Kling video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "kling", id: data.id ?? data.task_id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "fal") {
    const apiKey = falApiKey();
    const model = optionalEnv("FAL_VIDEO_MODEL") || "fal-ai/wan/v2.2-a14b/text-to-video/turbo";
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: requestedRatio })
    });

    if (!response.ok) throw new Error(`FAL video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "fal", id: data.request_id ?? data.id, status: data.status ?? "queued", raw: { ...data, model } };
  }

  throw new Error(`Unsupported VIDEO_PROVIDER: ${provider}`);
}
