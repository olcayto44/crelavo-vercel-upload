import { NextResponse } from "next/server";
import { AFTER_SIGNIN_PATH } from "@/lib/crelavo/authConfig";
import { createUser } from "@/lib/crelavo/userStore";
import { setSessionUser } from "@/lib/crelavo/sessionCookie";

async function supabaseBridge(email: string, destination: string) {
  try {
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data } = await supabaseAdmin().auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: destination } });
    return data.properties?.action_link || destination;
  } catch { return destination; }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const appUrl = process.env.APP_URL || url.origin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;
  const rawState = (await (await import("next/headers")).cookies()).get("crelavo_oauth_state")?.value;
  (await (await import("next/headers")).cookies()).set("crelavo_oauth_state", "", { path: "/", maxAge: 0 });
  let next = AFTER_SIGNIN_PATH;
  try {
    const parsed = rawState ? JSON.parse(Buffer.from(rawState, "base64url").toString()) as { state: string; next?: string } : null;
    if (!parsed || parsed.state !== state || !code) return NextResponse.redirect(new URL("/join?error=google_state", appUrl));
    if (parsed.next?.startsWith("/")) next = parsed.next;
  } catch { return NextResponse.redirect(new URL("/join?error=google_state", appUrl)); }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  const tokenJson = await tokenRes.json() as { access_token?: string };
  if (!tokenJson.access_token) return NextResponse.redirect(new URL("/join?error=google_token", appUrl));
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
  const profile = await profileRes.json() as { email?: string; name?: string; picture?: string };
  if (!profile.email) return NextResponse.redirect(new URL("/join?error=google_email", appUrl));
  const { user, created } = await createUser({ email: profile.email, name: profile.name ?? null, image: profile.picture ?? null, provider: "google" });
  await setSessionUser(user);
  const dest = new URL(next, appUrl);
  if (created) { dest.searchParams.set("signup", "1"); dest.searchParams.set("method", "google"); }
  return NextResponse.redirect(await supabaseBridge(profile.email, dest.toString()));
}
