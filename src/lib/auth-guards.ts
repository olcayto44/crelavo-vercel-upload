import { supabaseBrowser } from "@/lib/supabase";

export function isEmailVerified(user: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null | undefined) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export async function requireVerifiedBrowserUser() {
  const supabase = supabaseBrowser();
  const [{ data, error }, sessionResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);
  const user = data.user;

  if (error || !user) {
    return { ok: false as const, message: "You must sign in before continuing.", redirect: "/auth/login" };
  }

  if (!isEmailVerified(user)) {
    return { ok: false as const, message: "You must confirm your email address before using the assistant or starting production. Please open the confirmation link sent to your inbox.", redirect: "/auth/login" };
  }

  const accessToken = sessionResult.data.session?.access_token ?? "";
  return { ok: true as const, user, accessToken };
}

export function authHeaders(accessToken: string, contentType = "application/json") {
  return {
    "Content-Type": contentType,
    "Authorization": `Bearer ${accessToken}`
  };
}
