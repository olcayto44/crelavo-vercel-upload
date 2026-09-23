import { createHash, randomBytes } from "crypto";
import type { SessionUser } from "./sessionCookie";
import { supabaseAdmin } from "@/lib/supabase";

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function newToken() { return randomBytes(32).toString("base64url"); }

async function profileUser(id: string, fallbackEmail?: string): Promise<SessionUser | null> {
  const supabase = supabaseAdmin();
  const { data: profile, error } = await supabase.from("profiles").select("id,email,full_name").eq("id", id).maybeSingle();
  if (error || !profile) return null;
  const { data: auth } = await supabase.auth.admin.getUserById(id);
  return {
    id: profile.id,
    email: profile.email || fallbackEmail || auth.user?.email || "",
    name: profile.full_name || (auth.user?.user_metadata?.full_name as string | undefined) || null,
    image: (auth.user?.user_metadata?.avatar_url as string | undefined) || (auth.user?.user_metadata?.picture as string | undefined) || null,
  };
}

export async function getUserByEmail(email: string): Promise<SessionUser | null> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabaseAdmin().from("profiles").select("id").eq("email", normalized).maybeSingle();
  if (error || !data?.id) return null;
  return profileUser(data.id, normalized);
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  return profileUser(id);
}

export async function createUser(input: { email: string; name?: string | null; image?: string | null; provider: "email" | "google" }): Promise<{ user: SessionUser; created: boolean }> {
  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);
  if (existing) return { user: existing, created: false };

  const admin = supabaseAdmin();
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: input.name ?? undefined, avatar_url: input.image ?? undefined, provider: input.provider } });
  if (created.error || !created.data.user) throw new Error(created.error?.message || "user_create_failed");
  const { error: profileError } = await admin.from("profiles").upsert({ id: created.data.user.id, email, full_name: input.name ?? null, role: "user" }, { onConflict: "id" });
  if (profileError) throw new Error(profileError.message);
  return { user: { id: created.data.user.id, email, name: input.name ?? null, image: input.image ?? null }, created: true };
}

export async function saveMagicToken(email: string, tokenHash: string, expiresAt: Date) {
  const { error } = await supabaseAdmin().from("magic_links").insert({ email: normalizeEmail(email), token_hash: tokenHash, expires_at: expiresAt.toISOString() });
  if (error) throw new Error(error.message);
}

export async function consumeMagicToken(tokenHash: string): Promise<{ email: string } | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("magic_links").select("id,email,expires_at").eq("token_hash", tokenHash).maybeSingle();
  if (error || !data || new Date(data.expires_at).getTime() < Date.now()) return null;
  const { error: deleteError } = await admin.from("magic_links").delete().eq("id", data.id);
  if (deleteError) return null;
  return { email: data.email };
}
