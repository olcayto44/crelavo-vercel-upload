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
