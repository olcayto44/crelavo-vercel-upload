"use client";

import { supabaseBrowser } from "@/lib/supabase";
import { AUTH_GOOGLE_START, AUTH_GOOGLE_STATUS, AUTH_MAGIC_LINK, AUTH_SESSION, AUTH_SIGNOUT, SIGNUP_DISABLED } from "./authConfig";
import type { SessionUser } from "./sessionCookie";
export type { SessionUser };

function mapUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): SessionUser | null {
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email, name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") || null, image: String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "") || null };
}

export async function fetchSession(): Promise<SessionUser | null> {
  const { data } = await supabaseBrowser().auth.getUser();
  if (data.user) return mapUser(data.user);
  const res = await fetch(AUTH_SESSION, { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  return ((await res.json()) as { user: SessionUser | null }).user ?? null;
}

export async function requestMagicLink(email: string, intent: "login" | "register", next?: string) {
  if (SIGNUP_DISABLED && intent === "register") throw new Error("signup_disabled");
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("invalid_email");
  const res = await fetch(AUTH_MAGIC_LINK, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalized, intent, next }) });
  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  if (!res.ok) throw new Error(data.error || "magic_link_failed");
  return data;
}

export async function probeGoogleAuth(): Promise<boolean> {
  try { const res = await fetch(AUTH_GOOGLE_STATUS, { cache: "no-store" }); return res.ok && ((await res.json()) as { ready?: boolean }).ready === true; } catch { return false; }
}

export function googleStartUrl(next?: string) {
  const url = new URL(AUTH_GOOGLE_START, window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export async function signOut() { await supabaseBrowser().auth.signOut(); await fetch(AUTH_SIGNOUT, { method: "POST", credentials: "include" }); }
