import { optionalEnv, requireEnv } from "./env";
import type { ProviderJob } from "./types";

function falApiKey() {
  return optionalEnv("FAL_KEY") || optionalEnv("FAL_API_KEY") || requireEnv("FAL_KEY");
}

export async function createVisualVideo(input: { scenes: string[]; productImageUrls: string[]; durationSeconds: number; style?: string }): Promise<ProviderJob> {
  const provider = optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "replicate";
  const safeDuration = Math.min(10, Math.max(5, input.durationSeconds));
  const prompt = [
    safeDuration === 5 ? "Create a short low-cost provider test video. Keep it simple, clean and suitable for technical verification." : "Create a polished e-commerce product ad video.",
    input.style ? `Style: ${input.style}.` : "",
    `Target duration: ${safeDuration} seconds.`,
    `Scenes: ${input.scenes.join(" | ")}`,
    input.productImageUrls.length ? `Product references: ${input.productImageUrls.join(", ")}` : ""
  ].filter(Boolean).join("\n");

  if (provider === "replicate") {
    const apiKey = requireEnv("REPLICATE_API_TOKEN");
    const version = optionalEnv("REPLICATE_VIDEO_VERSION");
    const model = optionalEnv("REPLICATE_MODEL") || "wan-video/wan-2.2-t2v-fast";
    const inputPayload = {
      prompt,
      duration: safeDuration,
      aspect_ratio: "9:16"
    };
    const endpoint = version ? "https://api.replicate.com/v1/predictions" : `https://api.replicate.com/v1/models/${model}/predictions`;
    const body = version ? { version, input: inputPayload } : { input: inputPayload };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Replicate video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "replicate", id: data.id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "runway") {
    const apiKey = requireEnv("RUNWAY_API_KEY");
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": process.env.RUNWAY_API_VERSION || "2024-11-06"
      },
      body: JSON.stringify({ promptText: prompt, duration: safeDuration, ratio: "720:1280" })
    });

    if (!response.ok) throw new Error(`Runway video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "runway", id: data.id, status: data.status ?? "starting", raw: data };
  }

  if (provider === "kling") {
    const apiKey = requireEnv("KLING_API_KEY");
    const response = await fetch(process.env.KLING_API_URL || "https://api.klingai.com/v1/videos/text2video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: "9:16" })
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
      body: JSON.stringify({ prompt, duration: safeDuration, aspect_ratio: "9:16" })
    });

    if (!response.ok) throw new Error(`FAL video generation failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { provider: "fal", id: data.request_id ?? data.id, status: data.status ?? "queued", raw: { ...data, model } };
  }

  throw new Error(`Unsupported VIDEO_PROVIDER: ${provider}`);
}
