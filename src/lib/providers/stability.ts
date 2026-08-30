import { optionalEnv, requireProviderEnv } from "./env";
import { mirrorProviderAsset, uploadProviderAsset } from "./storage";

type ImageProviderResult = {
  provider: string;
  model: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
  fallback?: boolean;
  fallbackReason?: string;
  raw?: unknown;
};

type ConsistentImageInput = {
  productionId: string;
  prompt: string;
  filenameBase: string;
  aspectRatio?: string;
  referenceImageUrls?: string[];
};

function baseUrl() {
  return optionalEnv("STABILITY_BASE_URL") || "https://api.stability.ai";
}

function configured(name: string) {
  const value = optionalEnv(name);
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function firstConfigured(names: string[]) {
  return names.some(configured);
}

function isLikelyImageUrl(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return /https?:\/\//i.test(text) && /\.(png|jpe?g|webp)(\?|$)|fal\.media|replicate\.delivery|cloudfront|r2\.dev|supabase/i.test(text);
}

function findImageUrl(value: unknown): string {
  if (isLikelyImageUrl(value)) return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = findImageUrl(item);
      if (found) return found;
    }
  }
  return "";
}

function providerAspectRatio(aspectRatio: string) {
  return aspectRatio === "1584x396" ? "16:9" : aspectRatio;
}

function dataUrlToBytes(dataUrl: string) {
  const [, meta = "image/png", payload = ""] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) || [];
  const binary = Buffer.from(payload, "base64");
  return { bytes: binary, contentType: meta || "image/png" };
}

async function mirrorImageUrl(input: { productionId: string; sourceUrl: string; filenameBase: string }) {
  return mirrorProviderAsset({
    productionId: input.productionId,
    sourceUrl: input.sourceUrl,
    filenameBase: input.filenameBase,
    fallbackContentType: "image/png"
  });
}

export async function getStabilityBalance() {
  const apiKey = requireProviderEnv("stability");
  const response = await fetch(`${baseUrl()}/v1/user/balance`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Stability balance check failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function getStabilityEngines() {
  const apiKey = requireProviderEnv("stability");
  const response = await fetch(`${baseUrl()}/v1/engines/list`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  if (!response.ok) throw new Error(`Stability engines check failed: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function createStabilityImage(input: { productionId: string; prompt: string; filenameBase: string; aspectRatio?: string }): Promise<ImageProviderResult> {
  const apiKey = requireProviderEnv("stability");
  const model = optionalEnv("STABILITY_IMAGE_MODEL") || "core";
  const aspectRatio = input.aspectRatio || "9:16";
  const form = new FormData();
  form.append("prompt", input.prompt);
  form.append("aspect_ratio", providerAspectRatio(aspectRatio));
  form.append("output_format", "png");
  const response = await fetch(`${baseUrl()}/v2beta/stable-image/generate/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*"
    },
    body: form
  });
  if (response.ok) {
    const bytes = await response.arrayBuffer();
    const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, bytes, "image/png");
    return { provider: "stability", model, imageUrl, prompt: input.prompt, aspectRatio };
  }

  const v2Error = await response.text();
  const legacyRatio = providerAspectRatio(aspectRatio);
  const legacySize = legacyRatio === "16:9" ? { width: 1344, height: 768 } : legacyRatio === "1:1" ? { width: 1024, height: 1024 } : { width: 1024, height: 1536 };
  const legacyForm = new FormData();
  legacyForm.append("text_prompts[0][text]", input.prompt);
  legacyForm.append("width", String(legacySize.width));
  legacyForm.append("height", String(legacySize.height));
  legacyForm.append("steps", "30");
  legacyForm.append("samples", "1");
  legacyForm.append("output_format", "png");
  const legacyResponse = await fetch(`${baseUrl()}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    },
    body: legacyForm
  });
  if (!legacyResponse.ok) {
    const legacyError = await legacyResponse.text();
    throw new Error(`Stability image generation failed: v2=${response.status} ${v2Error.slice(0, 400)}; legacy=${legacyResponse.status} ${legacyError.slice(0, 400)}`);
  }
  const legacyData = await legacyResponse.json() as { artifacts?: Array<{ base64?: string }> };
  const artifact = legacyData.artifacts?.find((item) => item.base64)?.base64;
  if (!artifact) throw new Error(`Stability image generation returned no image artifact after v2 failure: ${v2Error.slice(0, 400)}`);
  const { bytes, contentType } = dataUrlToBytes(`data:image/png;base64,${artifact}`);
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, bytes, contentType);
  return { provider: "stability_legacy", model: "stable-diffusion-xl-1024-v1-0", imageUrl, prompt: input.prompt, aspectRatio, fallback: true, fallbackReason: `Modern Stability endpoint failed with ${response.status}; legacy endpoint succeeded.` };
}

async function createFalConsistentImage(input: ConsistentImageInput): Promise<ImageProviderResult> {
  const apiKey = requireProviderEnv("fal");
  const model = optionalEnv("FAL_SCENE_IMAGE_MODEL") || optionalEnv("FAL_IMAGE_MODEL") || "fal-ai/flux/dev";
  const aspectRatio = input.aspectRatio || "9:16";
  const body = {
    prompt: input.prompt,
    aspect_ratio: providerAspectRatio(aspectRatio),
    image_size: aspectRatio === "9:16" ? "portrait_16_9" : undefined,
    image_url: input.referenceImageUrls?.[0],
    image_urls: input.referenceImageUrls,
    reference_image_urls: input.referenceImageUrls,
    ip_adapter_image_urls: input.referenceImageUrls
  };
  const response = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`FAL scene image generation failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  let immediateUrl = findImageUrl(data);
  if (!immediateUrl) {
    const statusUrl = String(data.status_url ?? data.statusUrl ?? "").trim();
    const responseUrl = String(data.response_url ?? data.responseUrl ?? "").trim();
    for (let attempt = 0; attempt < 3 && (statusUrl || responseUrl); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const pollUrl = attempt < 2 && statusUrl ? statusUrl : responseUrl || statusUrl;
      const poll = await fetch(pollUrl, { headers: { Authorization: `Key ${apiKey}` } });
      if (poll.ok) {
        const pollData = await poll.json();
        immediateUrl = findImageUrl(pollData);
        if (immediateUrl) break;
      }
    }
  }
  if (immediateUrl) {
    const imageUrl = await mirrorImageUrl({ productionId: input.productionId, sourceUrl: immediateUrl, filenameBase: input.filenameBase });
    return { provider: "fal", model, imageUrl, prompt: input.prompt, aspectRatio, fallback: true, fallbackReason: "Stability scene image generation failed; FAL image fallback succeeded.", raw: data };
  }
  throw new Error(`FAL scene image request did not return a completed image URL. request_id=${String(data.request_id ?? data.id ?? "unknown")}`);
}

async function createReplicateConsistentImage(input: ConsistentImageInput): Promise<ImageProviderResult> {
  const apiKey = requireProviderEnv("replicate");
  const model = optionalEnv("REPLICATE_SCENE_IMAGE_MODEL") || optionalEnv("REPLICATE_IMAGE_MODEL") || "black-forest-labs/flux-dev";
  const aspectRatio = input.aspectRatio || "9:16";
  const payload = {
    prompt: input.prompt,
    aspect_ratio: providerAspectRatio(aspectRatio),
    image: input.referenceImageUrls?.[0],
    image_urls: input.referenceImageUrls,
    reference_image_urls: input.referenceImageUrls
  };
  let response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ input: payload })
  });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? 8) || 8;
    await new Promise((resolve) => setTimeout(resolve, Math.min(12, retryAfter + 1) * 1000));
    response = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({ input: payload })
    });
  }
  if (!response.ok) throw new Error(`Replicate scene image generation failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const outputUrl = findImageUrl(data.output ?? data);
  if (!outputUrl) throw new Error(`Replicate scene image request did not return an image URL. status=${String(data.status ?? "unknown")}`);
  const imageUrl = await mirrorImageUrl({ productionId: input.productionId, sourceUrl: outputUrl, filenameBase: input.filenameBase });
  return { provider: "replicate", model, imageUrl, prompt: input.prompt, aspectRatio, fallback: true, fallbackReason: "Earlier scene image providers failed; Replicate image fallback succeeded.", raw: data };
}

async function createOpenAiTextOnlyImage(input: ConsistentImageInput): Promise<ImageProviderResult> {
  const apiKey = requireProviderEnv("openai");
  const model = optionalEnv("OPENAI_IMAGE_MODEL") || "gpt-image-1";
  const aspectRatio = input.aspectRatio || "9:16";
  const size = aspectRatio === "9:16" ? "1024x1536" : aspectRatio === "1:1" ? "1024x1024" : "1536x1024";
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: input.prompt, size, n: 1 })
  });
  if (!response.ok) throw new Error(`OpenAI scene image generation failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const item = data.data?.[0] ?? {};
  if (item.b64_json) {
    const { bytes, contentType } = dataUrlToBytes(`data:image/png;base64,${item.b64_json}`);
    const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}-openai.png`, bytes, contentType);
    return { provider: "openai", model, imageUrl, prompt: input.prompt, aspectRatio, fallback: true, fallbackReason: "Reference-capable providers failed; OpenAI text-only fallback succeeded from character bible prompt.", raw: data };
  }
  const outputUrl = findImageUrl(item.url ?? data);
  if (!outputUrl) throw new Error("OpenAI scene image generation returned no image URL or base64 payload.");
  const imageUrl = await mirrorImageUrl({ productionId: input.productionId, sourceUrl: outputUrl, filenameBase: `${input.filenameBase}-openai` });
  return { provider: "openai", model, imageUrl, prompt: input.prompt, aspectRatio, fallback: true, fallbackReason: "Reference-capable providers failed; OpenAI text-only fallback succeeded from character bible prompt.", raw: data };
}

export async function createConsistentSceneImage(input: ConsistentImageInput): Promise<ImageProviderResult> {
  const errors: string[] = [];
  try {
    return await createStabilityImage(input);
  } catch (error) {
    errors.push(`stability: ${error instanceof Error ? error.message : String(error)}`);
  }

  const chain: Array<[string, () => Promise<ImageProviderResult>]> = [];
  if (firstConfigured(["FAL_KEY", "FAL_API_KEY"])) chain.push(["fal", () => createFalConsistentImage(input)]);
  if (firstConfigured(["REPLICATE_API_TOKEN", "REPLICATE_API_KEY"])) chain.push(["replicate", () => createReplicateConsistentImage(input)]);
  if (firstConfigured(["OPENAI_API_KEY"])) chain.push(["openai", () => createOpenAiTextOnlyImage(input)]);

  for (const [provider, generate] of chain) {
    try {
      return await generate();
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`QUALITY_BLOCKED: Scene images could not be generated; character consistency cannot be guaranteed. Provider chain failed: ${errors.join(" | ")}`);
}
