import crypto from "crypto";
import { encryptConnectedToken } from "@/lib/connected-accounts";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

function secret() { return String(process.env.PINTEREST_CLIENT_SECRET || process.env.ADMIN_SESSION_SECRET || "").trim(); }
function decodeState(value: string) {
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !secret()) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; at?: number };
  if (!parsed.userId || !parsed.at || Date.now() - parsed.at > 10 * 60 * 1000) return null;
  return parsed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = decodeState(url.searchParams.get("state") || "");
  if (!state) redirect("/dashboard?connection=pinterest&status=invalid_state");
  const error = url.searchParams.get("error");
  if (error) redirect(`/dashboard?connection=pinterest&status=denied&error=${encodeURIComponent(error)}`);
  const code = url.searchParams.get("code");
  if (!code) redirect("/dashboard?connection=pinterest&status=missing_code");
  const clientId = String(process.env.PINTEREST_CLIENT_ID || "").trim();
  const clientSecret = secret();
  const redirectUri = "https://crelavo.com/api/pinterest/oauth/callback";
  try {
    const tokenResponse = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      cache: "no-store"
    });
    const token = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !token.access_token) throw new Error(String(token.message || token.error || "Pinterest token exchange failed."));
    const profileResponse = await fetch("https://api.pinterest.com/v5/user_account", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    const profile = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok) throw new Error(String(profile.message || "Pinterest account lookup failed."));
    const { error: saveError } = await supabaseAdmin().from("connected_accounts").upsert({
      user_id: state.userId,
      provider: "pinterest",
      account_type: "social",
      display_name: profile.username ? `Pinterest @${profile.username}` : "Pinterest",
      external_account_id: String(profile.id || profile.username || "pinterest"),
      store_url: profile.username ? `https://www.pinterest.com/${profile.username}/` : null,
      status: "connected",
      access_token_encrypted: encryptConnectedToken(String(token.access_token)),
      refresh_token_encrypted: encryptConnectedToken(String(token.refresh_token || "")),
      token_expires_at: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null,
      scopes: ["boards:read", "pins:read", "pins:write", "user_accounts:read"],
      last_verified_at: new Date().toISOString(),
      metadata: { source: "pinterest_oauth", pinterestProfile: { username: profile.username || null, accountType: profile.account_type || null } },
      error_message: null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,provider,external_account_id" });
    if (saveError) throw saveError;
    return new Response(null, { status: 302, headers: { Location: "/dashboard/connections?connection=pinterest&status=connected" } });
  } catch (caught) {
    redirect(`/dashboard/connections?connection=pinterest&status=error&message=${encodeURIComponent(caught instanceof Error ? caught.message : "Pinterest connection failed.")}`);
  }
}