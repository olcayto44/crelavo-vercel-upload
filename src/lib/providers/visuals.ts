import { optionalEnv, requireProviderEnv } from "./env";
import type { ProviderJob } from "./types";

function falApiKey() {
  return requireProviderEnv("fal");
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => Boolean(optionalEnv(name)));
}

function selectedI2vProvider(requested?: string) {
  const allowFalI2v = String(optionalEnv("ALLOW_FAL_I2V") || "").toLowerCase() === "true";
  const candidate = String(requested || optionalEnv("I2V_PROVIDER") || optionalEnv("IMAGE_TO_VIDEO_PROVIDER") || "").trim().toLowerCase();
  if (["runway", "runwayml", "runway_ml", "runway_first"].includes(candidate)) return "runway";
  if (["kling", "klingai", "kling_ai"].includes(candidate)) return "kling";
  if (candidate === "fal" && allowFalI2v) return "fal";
  const videoProvider = String(optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "").trim().toLowerCase();
  if (["runway", "runwayml", "runway_ml"].includes(videoProvider)) return "runway";
  if (["kling", "klingai", "kling_ai"].includes(videoProvider)) return "kling";
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

  if (provider === "runway") {
    const apiKey = requireProviderEnv("runway");
    const runwayModel = optionalEnv("RUNWAY_I2V_MODEL") || "gen4_turbo";
    const promptText = `${input.prompt}\nNegative: ${negativePrompt}`.slice(0, 1000);
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: asciiHeaderValue(`Bearer ${apiKey}`),
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06"
      },
      body: JSON.stringify({
        model: runwayModel,
        promptText,
        promptImage: input.imageUrl,
        duration: Math.round(safeDuration),
        ratio: runwayRatio
      })
    });
    if (!response.ok) throw new Error(`Runway image-to-video failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "runway", id: data.id, status: data.status ?? "starting", raw: { ...data, model: runwayModel, sourceImageUrl: input.imageUrl } };
  }

  if (provider === "kling") {
    const apiKey = requireProviderEnv("kling");
    const response = await fetch(process.env.KLING_I2V_API_URL || process.env.KLING_API_URL || "https://api.klingai.com/v1/videos/image2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: input.prompt, negative_prompt: negativePrompt, image: input.imageUrl, image_url: input.imageUrl, duration: safeDuration, aspect_ratio: requestedRatio, motion_strength: motionStrength, motion_speed: "low" })
    });
    if (!response.ok) throw new Error(`Kling image-to-video failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    const taskId = data.id ?? data.task_id ?? data.data?.task_id ?? data.data?.id;
    const taskStatus = data.status ?? data.task_status ?? data.data?.task_status ?? "starting";
    return { provider: "kling", id: taskId, status: taskStatus, raw: { ...data, sourceImageUrl: input.imageUrl } };
  }

  if (provider === "fal") {
    const apiKey = falApiKey();
    const model = optionalEnv("FAL_I2V_MODEL") || optionalEnv("FAL_VIDEO_MODEL") || "fal-ai/kling-video/v2.1/standard/image-to-video";
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: input.prompt, negative_prompt: negativePrompt, image_url: input.imageUrl, duration: safeDuration, aspect_ratio: requestedRatio, motion_strength: motionStrength, motion_bucket_id: 40 })
    });
    if (!response.ok) throw new Error(`FAL image-to-video failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "fal", id: data.request_id ?? data.id, status: data.status ?? "queued", raw: { ...data, model, statusUrl: data.status_url, responseUrl: data.response_url, sourceImageUrl: input.imageUrl } };
  }

  throw new Error("QUALITY_BLOCKED: No stable image-to-video provider is configured for character-consistent animation. Configure RUNWAY_API_KEY or KLING_API_KEY, or explicitly set I2V_PROVIDER=fal only after the FAL image-to-video endpoint is verified.");
}

export async function createVisualVideo(input: { scenes: string[]; productImageUrls: string[]; durationSeconds: number; style?: string; provider?: string; aspectRatio?: string }): Promise<ProviderJob> {
  const provider = input.provider || optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "replicate";
  const safeDuration = Math.min(15, Math.max(5, input.durationSeconds));
  const requestedRatio = input.aspectRatio || "9:16";
  const runwayRatio = requestedRatio.includes("16:9") ? "1280:720" : requestedRatio.includes("1:1") ? "960:960" : "720:1280";
  const promptSignal = `${input.style ?? ""} ${input.scenes.join(" ")}`;
  const isCrelavoUiDemo = /crelavo|paste a link|get an ad|dashboard|link input|ai analysis|page analysis|linked page|product benefits|ad script|scene plan|mp4 preview|export buttons|tiktok|reels|shorts/i.test(promptSignal);
  const isNarrative = !isCrelavoUiDemo && /sahne|scene|animasyon|animation|çizgi film|cizgi film|character|karakter|dialogue|diyalog/i.test(promptSignal);
  const strictNoPeople = /no\s*people|no\s*presenter|without\s*(people|presenter|human)|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|insans[ıi]z|sunucusuz|no office|office\s*olmas[ıi]n|ofis\s*olmas[ıi]n/i.test(promptSignal);
  const prompt = [
    isCrelavoUiDemo
      ? "Create a premium high-fidelity realistic SaaS product UI demo video, suitable for 4K delivery. Show only polished software dashboard screens, crisp browser UI, Crelavo brand/interface, cursor-like interface motion, clean product panels, timeline blocks, export controls and brand-safe motion graphics. No office, no people, no presenter, no children, no characters, no split-screen humans, no cartoon, no semi-cartoon, no lip-sync, no talking head, no stock footage, no low-cost test-video look."
      : isNarrative
        ? "Create a coherent narrative animation/video clip for this exact scene. Keep character count, roles, costumes, setting and action consistent with the scene description. Do not turn it into an e-commerce ad or provider test."
        : "Create a polished realistic product ad video with premium composition and high visual fidelity.",
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
