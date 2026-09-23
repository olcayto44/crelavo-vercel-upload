import { supabaseAdmin } from "@/lib/supabase";
import { promises as fsPromises } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveFfmpegPath } from "@/lib/ffmpeg-runtime";
import { appUrl } from "./env";
const execFileAsync = promisify(execFile);

export async function uploadProviderAsset(path: string, body: Blob | ArrayBuffer | Uint8Array | string, contentType: string) {
  const bucket = process.env.SUPABASE_PROVIDER_ASSETS_BUCKET || "provider-assets";
  const supabase = supabaseAdmin();
  const bytes = typeof body === "string"
    ? new TextEncoder().encode(body)
    : body instanceof ArrayBuffer
      ? new Uint8Array(body)
      : new Uint8Array(body as Uint8Array);
  const payload = new Blob([bytes], { type: contentType });

  await supabase.storage.updateBucket(bucket, { public: true }).catch(() => undefined);

  let { error } = await supabase.storage
    .from(bucket)
    .upload(path, payload, { contentType, upsert: true });

  if (error && /bucket not found/i.test(error.message ?? "")) {
    const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
    if (createError && !/already exists/i.test(createError.message ?? "")) throw createError;
    const retry = await supabase.storage
      .from(bucket)
      .upload(path, payload, { contentType, upsert: true });
    error = retry.error;
  }

  if (error) throw error;

  await supabase.storage.updateBucket(bucket, { public: true }).catch(() => undefined);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (data.publicUrl) return data.publicUrl;

  return `${appUrl()}/api/provider-assets/${encodeURIComponent(path)}`;
}

function contentTypeFromResponse(response: Response, fallback: string) {
  const header = response.headers.get("content-type")?.split(";")[0]?.trim();
  return header || fallback;
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("quicktime")) return "mov";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("json")) return "json";
  return "bin";
}

export async function mirrorProviderAsset(input: { productionId: string; sourceUrl: string; filenameBase: string; fallbackContentType?: string }) {
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Provider asset download failed: ${response.status} ${await response.text()}`);
  const contentType = contentTypeFromResponse(response, input.fallbackContentType || "video/mp4");
  const extension = extensionFromContentType(contentType);
  const bytes = await response.arrayBuffer();
  return uploadProviderAsset(`${input.productionId}/${input.filenameBase}.${extension}`, bytes, contentType);
}

export async function mirrorProviderVideoVertical(input: { productionId: string; sourceUrl: string; filenameBase: string }) {
  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) return mirrorProviderAsset({ ...input, fallbackContentType: "video/mp4" });
  const id = crypto.randomUUID(); const inputPath = "/tmp/crelavo-in-" + id + ".mp4"; const outputPath = "/tmp/crelavo-out-" + id + ".mp4";
  try {
    const response = await fetch(input.sourceUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Provider video download failed: " + response.status);
    await fsPromises.writeFile(inputPath, new Uint8Array(await response.arrayBuffer()));
    await execFileAsync(ffmpeg, ["-y", "-i", inputPath, "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputPath], { timeout: 90000, maxBuffer: 20 * 1024 * 1024 });
    const bytes = await fsPromises.readFile(outputPath);
    return uploadProviderAsset(input.productionId + "/" + input.filenameBase + "-vertical.mp4", bytes, "video/mp4");
  } finally { await fsPromises.rm(inputPath, { force: true }).catch(() => undefined); await fsPromises.rm(outputPath, { force: true }).catch(() => undefined); }
}
