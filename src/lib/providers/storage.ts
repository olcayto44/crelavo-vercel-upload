import { supabaseAdmin } from "@/lib/supabase";
import { appUrl } from "./env";

export async function uploadProviderAsset(path: string, body: Blob | ArrayBuffer | Uint8Array | string, contentType: string) {
  const bucket = process.env.SUPABASE_PROVIDER_ASSETS_BUCKET || "provider-assets";
  const supabase = supabaseAdmin();
  const payload = typeof body === "string" ? new Blob([body], { type: contentType }) : body;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, payload, { contentType, upsert: true });

  if (error) throw error;

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
