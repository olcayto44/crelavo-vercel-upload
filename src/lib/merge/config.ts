import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = process.env.PRODUCTION_ASSETS_BUCKET ?? "production-assets";
export const LEASE_SEC = Math.max(10,Math.min(300,Number(process.env.MERGE_LEASE_SEC) || 90));
export const HEARTBEAT_SEC = Math.min(LEASE_SEC / 5,Math.max(1,Number(process.env.MERGE_HEARTBEAT_SEC) || 15));
export const MAX_CLIP_BYTES = (Number(process.env.MERGE_MAX_CLIP_MB) || 500) * 1024 * 1024;
export const MAX_ACTIVE_JOBS_PER_USER = Number(process.env.MERGE_MAX_ACTIVE_PER_USER) || 2;
export const SIGNED_URL_TTL_SEC = 60 * 60;

export function allowedHosts(): string[] {
  const hosts = (process.env.MERGE_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  try {
    hosts.push(new URL(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname);
  } catch {
    /* env yok: sadece MERGE_ALLOWED_HOSTS geçerli */
  }
  return hosts;
}

let admin: SupabaseClient | undefined;
/** Service role istemcisi. SADECE sunucu/worker tarafında kullanın, tarayıcıya asla göndermeyin. */
export function getAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı");
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Yalnızca testler için: sahte istemci enjekte eder. */
export function __setAdminForTests(client: SupabaseClient | undefined): void {
  admin = client;
}
