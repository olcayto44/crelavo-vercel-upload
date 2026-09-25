import { NextResponse } from "next/server";
import { AFTER_SIGNIN_PATH } from "@/lib/crelavo/authConfig";
import { safeReturnPath, SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";
import { consumeMagicToken, createUser, hashToken } from "@/lib/crelavo/userStore";
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
  const token = url.searchParams.get("token") || "";
  const intent = url.searchParams.get("intent") || "login";
  const next = intent === "register" ? SIGNUP_DESTINATION : safeReturnPath(url.searchParams.get("next"));
  if (!token) return NextResponse.redirect(new URL("/join?error=missing_token", url.origin));
  const consumed = await consumeMagicToken(hashToken(token));
  if (!consumed) return NextResponse.redirect(new URL("/join?error=expired", url.origin));
  const { user, created } = await createUser({ email: consumed.email, provider: "email" });
  await setSessionUser(user);
  const dest = new URL(next.startsWith("/") ? next : AFTER_SIGNIN_PATH, url.origin);
  if (created || intent === "register") dest.searchParams.set("signup", "1");
  dest.searchParams.set("method", "email");
  return NextResponse.redirect(await supabaseBridge(consumed.email, dest.toString()));
}
