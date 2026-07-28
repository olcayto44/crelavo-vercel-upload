import { evaluateConnectedAccountReadiness, normalizeTokenExpiry, tokenExpiryFromSeconds } from "@/lib/connected-account-automation";
import { markConnectedAccountError } from "@/lib/connected-account-errors";
import { decryptConnectedToken, encryptConnectedToken } from "@/lib/connected-accounts";
import { optionalEnv, optionalProviderEnv, requireEnv } from "@/lib/providers/env";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function appUrl() {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || "https://crelavo.com";
}

async function refreshProviderToken(account: Record<string, any>) {
  const provider = clean(account.provider);
  const refreshToken = decryptConnectedToken(account.refresh_token_encrypted);
  if (!refreshToken) throw new Error("Refresh token is missing; reconnect this account.");

  if (provider === "youtube") {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requireEnv("YOUTUBE_CLIENT_ID"),
        client_secret: requireEnv("YOUTUBE_CLIENT_SECRET"),
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description ?? data.error ?? "YouTube token refresh failed.");
    return {
      accessToken: String(data.access_token),
      refreshToken: data.refresh_token ? String(data.refresh_token) : refreshToken,
      tokenExpiresAt: tokenExpiryFromSeconds(data.expires_in)
    };
  }

  if (provider === "tiktok") {
    const clientKey = optionalProviderEnv("tiktokClientKey") || requireEnv("TIKTOK_CLIENT_KEY");
    const clientSecret = optionalProviderEnv("tiktokClientSecret") || requireEnv("TIKTOK_CLIENT_SECRET");
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: clientKey, secret: clientSecret, refresh_token: refreshToken })
    });
    const data = await response.json().catch(() => ({}));
    const token = data?.data?.access_token || data?.access_token;
    if (!response.ok || !token) throw new Error(data?.message ?? "TikTok token refresh failed.");
    return {
      accessToken: String(token),
      refreshToken: data?.data?.refresh_token ? String(data.data.refresh_token) : refreshToken,
      tokenExpiresAt: tokenExpiryFromSeconds(data?.data?.expires_in ?? data?.expires_in)
    };
  }

  if (provider === "meta" || provider === "instagram") {
    const appId = requireEnv("META_APP_ID");
    const appSecret = requireEnv("META_APP_SECRET");
    const response = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: refreshToken })}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error?.message ?? "Meta token refresh failed.");
    return {
      accessToken: String(data.access_token),
      refreshToken: String(data.access_token),
      tokenExpiresAt: tokenExpiryFromSeconds(data.expires_in)
    };
  }

  if (provider === "shopify" || provider === "woocommerce") {
    throw new Error(`${provider} does not use a generic OAuth refresh flow here; verify/reconnect the store credentials instead.`);
  }

  throw new Error("Unsupported connected account provider.");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  const accountId = clean(body.connected_account_id ?? body.connectedAccountId);
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  if (!accountId) return Response.json({ error: "connected_account_id is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const supabase = supabaseAdmin();
  const { data: account, error } = await supabase
    .from("connected_accounts")
    .select("id, user_id, provider, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!account) return Response.json({ error: "Connected account not found." }, { status: 404 });

  try {
    const refreshed = await refreshProviderToken(account);
    const tokenExpiresAt = normalizeTokenExpiry(refreshed.tokenExpiresAt) || account.token_expires_at || null;
    const { data: updated, error: updateError } = await supabase
      .from("connected_accounts")
      .update({
        status: "connected",
        access_token_encrypted: encryptConnectedToken(refreshed.accessToken),
        refresh_token_encrypted: encryptConnectedToken(refreshed.refreshToken),
        token_expires_at: tokenExpiresAt,
        last_verified_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", accountId)
      .eq("user_id", userId)
      .select("id, provider, display_name, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message")
      .single();

    if (updateError) throw updateError;
    return Response.json({ refreshed: true, readiness: evaluateConnectedAccountReadiness(updated) });
  } catch (refreshError) {
    const marked = await markConnectedAccountError({ supabase, accountId, userId, error: refreshError, fallback: "Token refresh failed." });
    return Response.json({ refreshed: false, ...marked.payload, account: marked.account, readiness: marked.readiness }, { status: 400 });
  }
}
