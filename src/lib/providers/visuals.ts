import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { optionalEnv, requireProviderEnv } from "./env";
import { uploadProviderAsset } from "./storage";
import { createMiniMaxH3VideoTask } from "./minimax";
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

async function createLocalFallbackVideo(input: { productionId: string; title: string; scenes: string[]; durationSeconds: number; aspectRatio?: string }) {
  const durationSeconds = Math.max(5, Number(input.durationSeconds) || 15);
  const ratio = String(input.aspectRatio || "9:16");
  const [width, height] = ratio.includes("16:9") ? [1920, 1080] : ratio.includes("1:1") ? [1080, 1080] : ratio.includes("4:5") ? [1080, 1350] : ratio.includes("3:4") ? [1080, 1440] : [1080, 1920];
  const directory = await mkdtemp(join(tmpdir(), "crelavo-local-video-"));
  const imagePath = join(directory, "poster.png");
  const videoPath = join(directory, "fallback.mp4");
  const title = input.title || "Crelavo video";
  const lines = [title, ...input.scenes.slice(0, 3)].map((line) => String(line).replace(/[<>&]/g, " ").trim()).filter(Boolean);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#06070b"/>
        <stop offset="45%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#040507"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
        <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <rect x="8%" y="10%" width="84%" height="80%" rx="36" fill="none" stroke="#f5f3ff" stroke-opacity="0.12" stroke-width="3"/>
    <rect x="12%" y="14%" width="76%" height="72%" rx="28" fill="none" stroke="#60a5fa" stroke-opacity="0.22" stroke-width="2"/>
    <text x="50%" y="32%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(width / 18)}" fill="#f8fafc" font-weight="700">CRELAVO</text>
    <text x="50%" y="40%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(width / 34)}" fill="#e2e8f0" font-weight="400">Premium video production fallback</text>
    ${lines.map((line, index) => `<text x="50%" y="${54 + index * 8}%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(width / 42)}" fill="#dbeafe" font-weight="500">${line}</text>`).join("\n")}
    <text x="50%" y="88%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(width / 50)}" fill="#f59e0b" font-weight="600">Audio-ready final delivery</text>
  </svg>`;
  try {
    await sharp(Buffer.from(svg)).png().toFile(imagePath);
    await new Promise<void>((resolve, reject) => {
      if (!ffmpegPath) {
        reject(new Error("ffmpeg-static binary is not available."));
        return;
      }
      execFile(ffmpegPath, ["-y", "-loop", "1", "-i", imagePath, "-t", String(durationSeconds), "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath], { timeout: 45000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve();
      });
    });
    const videoBytes = await readFile(videoPath);
    return uploadProviderAsset(`${input.productionId}/fallback-visual.mp4`, videoBytes, "video/mp4");
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
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
    return { provider: "minimax", id: result.task_id ?? result.request_id, status: "submitted", raw: { ...result, sourceImageUrl: input.imageUrl, resolution, ratio: miniMaxRatio(requestedRatio) } };
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

export async function createVisualVideo(input: { productionId: string; scenes: string[]; productImageUrls: string[]; durationSeconds: number; style?: string; provider?: string; aspectRatio?: string }): Promise<ProviderJob> {
  const requestedProvider = String(input.provider || optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "replicate").trim().toLowerCase();
  const provider = requestedProvider === "minimax" && !hasMiniMaxVideoEnv()
    ? (hasAnyEnv(["RUNWAY_API_KEY"]) ? "runway" : hasAnyEnv(["KLING_API_KEY", "KLING_AI_API_KEY", "KLINGAI_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY"]) ? "kling" : hasAnyEnv(["FAL_KEY", "FAL_API_KEY"]) ? "fal" : "replicate")
    : requestedProvider;
  const safeDuration = Math.min(15, Math.max(5, input.durationSeconds));
  const forceLocalVideoFallback = String(optionalEnv("FORCE_LOCAL_VIDEO_FALLBACK") ?? "true").toLowerCase() !== "false";
  const hasAnyVideoProviderConfigured = hasAnyEnv(["MINIMAX_API_KEY", "MINIMAX_KEY", "RUNWAY_API_KEY", "KLING_API_KEY", "KLING_AI_API_KEY", "KLINGAI_API_KEY", "KLING_ACCESS_KEY", "KLING_SECRET_KEY", "FAL_KEY", "FAL_API_KEY", "REPLICATE_API_TOKEN"]);
  if (forceLocalVideoFallback || !hasAnyVideoProviderConfigured) {
    const localVideoUrl = await createLocalFallbackVideo({ productionId: input.productionId, title: input.style || "Crelavo video", scenes: input.scenes, durationSeconds: safeDuration, aspectRatio: input.aspectRatio || "9:16" });
    return { provider: "local_visual", id: `local-visual-${input.productionId}`, status: "succeeded", url: localVideoUrl, raw: { sourceScenes: input.scenes, provider: "local_visual", fallbackReason: forceLocalVideoFallback ? "Local fallback is forced for stable production delivery." : "No external video provider was configured." } };
  }
  const requestedRatio = input.aspectRatio || "9:16";
  const runwayRatio = requestedRatio.includes("16:9") ? "1280:720" : requestedRatio.includes("1:1") ? "960:960" : "720:1280";
  const promptSignal = `${input.style ?? ""} ${input.scenes.join(" ")}`;
  const isDroneLocationVideo = /drone|satellite|aerial|flyover|kuşbakışı|kuş\s*bakışı|uydu|havadan|location\s*video|konum\s*videosu/i.test(promptSignal);
  const isCrelavoUiDemo = !isDroneLocationVideo && /crelavo|paste a link|get an ad|dashboard|link input|ai analysis|page analysis|linked page|product benefits|ad script|scene plan|mp4 preview|export buttons|tiktok|reels|shorts/i.test(promptSignal);
  const isNarrative = !isCrelavoUiDemo && !isDroneLocationVideo && /sahne|scene|animasyon|animation|çizgi film|cizgi film|character|karakter|dialogue|diyalog/i.test(promptSignal);
  const strictNoPeople = !isDroneLocationVideo && /no\s*people|no\s*presenter|without\s*(people|presenter|human)|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|insans[ıi]z|sunucusuz|no office|office\s*olmas[ıi]n|ofis\s*olmas[ıi]n/i.test(promptSignal);
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

  if (isCrelavoUiDemo && input.productImageUrls.length) {
    const imageReference = input.productImageUrls[0];
    return {
      provider: "website_screenshot_reference",
      id: `screenshot-${Date.now()}`,
      status: "succeeded",
      url: imageReference,
      raw: {
        sourceImageUrl: imageReference,
        assetType: "image",
        fallbackReason: "Crelavo/UI website demos use deterministic multi-scene Shotstack layout instead of I2V zoom output."
      }
    };
  }

  if (provider === "minimax") {
    const resolution = miniMaxResolution(`${input.style ?? ""} ${input.scenes.join(" ")}`);
    const result = await createMiniMaxH3VideoTask({
      content: [{ type: "text", text: prompt }],
      resolution,
      duration: safeDuration as 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
      ratio: miniMaxRatio(requestedRatio)
    });
    return { provider: "minimax", id: result.task_id ?? result.request_id, status: "submitted", raw: { ...result, resolution, ratio: miniMaxRatio(requestedRatio) } };
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
