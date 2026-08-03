import { uploadProviderAsset } from "@/lib/providers/storage";

export type AnchorFrameRequest = {
  sourceVideoUrl: string;
  timestampSeconds?: number;
  sceneNumber?: number;
  anchorType?: string;
  status?: string;
  instruction?: string;
};

export type AnchorFrameResult = {
  status: "extracted" | "external_extractor_not_configured" | "failed" | "skipped";
  frameUrl?: string;
  sourceVideoUrl?: string;
  timestampSeconds?: number;
  sceneNumber?: number;
  anchorType?: string;
  provider?: string;
  error?: string;
  extractedAt?: string;
};

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], bytes: Uint8Array.from(Buffer.from(match[2], "base64")) };
}

function firstUrl(value: unknown): string {
  if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["frameUrl", "frame_url", "imageUrl", "image_url", "url", "publicUrl", "public_url"]) {
      const found = firstUrl(record[key]);
      if (found) return found;
    }
  }
  return "";
}

function firstDataUrl(value: unknown): string {
  if (typeof value === "string" && /^data:image\//i.test(value.trim())) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstDataUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["frameBase64", "frame_base64", "imageBase64", "image_base64", "dataUrl", "data_url"]) {
      const found = firstDataUrl(record[key]);
      if (found) return found;
    }
  }
  return "";
}

export async function extractAnchorFrame(input: { productionId: string; request: AnchorFrameRequest | null }): Promise<AnchorFrameResult> {
  const request = input.request;
  if (!request?.sourceVideoUrl) return { status: "skipped", error: "Missing source video URL." };
  const endpoint = process.env.ANCHOR_FRAME_EXTRACTOR_URL || process.env.FRAME_EXTRACTOR_URL || "";
  if (!endpoint) {
    return {
      status: "external_extractor_not_configured",
      sourceVideoUrl: request.sourceVideoUrl,
      timestampSeconds: request.timestampSeconds,
      sceneNumber: request.sceneNumber,
      anchorType: request.anchorType,
      error: "Set ANCHOR_FRAME_EXTRACTOR_URL to enable real video frame extraction."
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceVideoUrl: request.sourceVideoUrl,
        timestampSeconds: request.timestampSeconds ?? 0,
        sceneNumber: request.sceneNumber,
        anchorType: request.anchorType,
        productionId: input.productionId
      })
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Frame extractor failed: ${response.status} ${text}`);
    const data = text ? JSON.parse(text) : {};
    const directUrl = firstUrl(data);
    if (directUrl) {
      return {
        status: "extracted",
        frameUrl: directUrl,
        sourceVideoUrl: request.sourceVideoUrl,
        timestampSeconds: request.timestampSeconds,
        sceneNumber: request.sceneNumber,
        anchorType: request.anchorType,
        provider: "external_frame_extractor",
        extractedAt: new Date().toISOString()
      };
    }
    const dataUrl = firstDataUrl(data);
    const decoded = dataUrlToBytes(dataUrl);
    if (decoded) {
      const frameUrl = await uploadProviderAsset(`${input.productionId}/anchor-frame-${Date.now()}.png`, decoded.bytes, decoded.contentType);
      return {
        status: "extracted",
        frameUrl,
        sourceVideoUrl: request.sourceVideoUrl,
        timestampSeconds: request.timestampSeconds,
        sceneNumber: request.sceneNumber,
        anchorType: request.anchorType,
        provider: "external_frame_extractor_base64",
        extractedAt: new Date().toISOString()
      };
    }
    throw new Error("Frame extractor response did not include frameUrl or image base64 data.");
  } catch (error) {
    return {
      status: "failed",
      sourceVideoUrl: request.sourceVideoUrl,
      timestampSeconds: request.timestampSeconds,
      sceneNumber: request.sceneNumber,
      anchorType: request.anchorType,
      error: error instanceof Error ? error.message : "Anchor frame extraction failed."
    };
  }
}
