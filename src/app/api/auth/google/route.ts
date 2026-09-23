import { NextResponse } from "next/server";
import { AUTH_VERIFY } from "@/lib/crelavo/authConfig";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !secret) return NextResponse.json({ error: "google_not_configured" }, { status: 404 });
  const appUrl = process.env.APP_URL || url.origin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(new URL("https://accounts.google.com/o/oauth2/v2/auth"));
  const next = url.searchParams.get("next") || "";
  const statePayload = Buffer.from(JSON.stringify({ state, next })).toString("base64url");
  response.cookies.set("crelavo_oauth_state", statePayload, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", clientId);
  google.searchParams.set("redirect_uri", redirectUri);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(google, { headers: response.headers });
}
