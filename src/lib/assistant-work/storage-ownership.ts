import type { SupabaseClient } from "@supabase/supabase-js";
export function parseAssistantStorageUrl(raw: string, base: string) {
  try {
    const url = new URL(raw); if (url.origin !== new URL(base).origin) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    const bucket = match[1], path = decodeURIComponent(match[2]);
    if (!path || path.split("/").some(part => !part || part === "." || part === "..") || /[\\\x00]/.test(path)) return null;
    return { bucket, path };
  } catch { return null; }
}
export async function requireAssistantStorageOwner(db: SupabaseClient, userId: string, url: string) {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const parsed = parseAssistantStorageUrl(url, base); if (!parsed || !userId) throw new Error("owned_material_required");
  const { data, error } = await db.rpc("verify_assistant_storage_owner", { p_user_id: userId, p_bucket: parsed.bucket, p_path: parsed.path });
  if (error || data !== true) throw new Error("material_ownership_unverified");
}
