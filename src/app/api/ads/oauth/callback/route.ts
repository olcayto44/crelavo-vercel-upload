import { encryptConnectedToken, providerAccountTypes } from "@/lib/connected-accounts";
import { optionalEnv, optionalProviderEnv, requireEnv } from "@/lib/providers/env";
import { adOAuthAppUrl, adOAuthRedirectUri } from "@/lib/phase2/ads";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdPlatform } from "@/lib/phase2/types";

type MetaOAuthState = {
  userId?: string;
  platform?: AdPlatform;
  at?: number;
};

type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
};

type MetaAdAccount = {
  id: string;
  name?: string;
  account_status?: number;
};

type MetaPage = {
  id: string;
  name?: string;
  instagram_business_account?: { id: string; username?: string };
};

const supportedMetaPlatforms: AdPlatform[] = ["meta", "instagram"];
const supportedConnectedPlatforms: AdPlatform[] = ["meta", "instagram", "tiktok", "youtube"];

function appUrl() {
  return adOAuthAppUrl();
}

function metaGraphVersion() {
  return optionalEnv("META_GRAPH_API_VERSION") || "v20.0";
}

function decodeState(rawState: string): MetaOAuthState {
  try {
    return JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")) as MetaOAuthState;
  } catch {
    return {};
  }
}

function redirectWithStatus(path: string, params: Record<string, string>) {
  const url = new URL(path, appUrl());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return Response.redirect(url.toString(), 302);
}

async function fetchMetaJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error?.message === "string" ? data.error.message : "Meta Graph API request failed.";
    throw new Error(message);
  }
  return data as T;
}

async function exchangeCodeForToken(code: string, platform: AdPlatform) {
  const clientId = requireEnv("META_APP_ID");
  const clientSecret = requireEnv("META_APP_SECRET");
  const redirectUri = adOAuthRedirectUri();
  const url = new URL(`https://graph.facebook.com/${metaGraphVersion()}/oauth/access_token`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const token = await fetchMetaJson<MetaTokenResponse>(url.toString());
  if (!token.access_token) throw new Error(token.error?.message ?? "Meta access token was not returned.");
  return token.access_token;
}

async function exchangeConnectedCodeForToken(code: string, platform: AdPlatform) {
  if (platform === "meta" || platform === "instagram") return exchangeCodeForToken(code, platform);

  if (platform === "youtube") {
    const clientId = requireEnv("YOUTUBE_CLIENT_ID");
    const clientSecret = requireEnv("YOUTUBE_CLIENT_SECRET");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: adOAuthRedirectUri(),
        grant_type: "authorization_code"
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description ?? data.error ?? "YouTube OAuth token exchange failed.");
    return String(data.access_token);
  }

  if (platform === "tiktok") {
    const clientKey = optionalProviderEnv("tiktokClientKey") || requireEnv("TIKTOK_CLIENT_KEY");
    const clientSecret = optionalProviderEnv("tiktokClientSecret") || requireEnv("TIKTOK_CLIENT_SECRET");
    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: clientKey, secret: clientSecret, auth_code: code })
    });
    const data = await response.json().catch(() => ({}));
    const token = data?.data?.access_token || data?.access_token;
    if (!response.ok || !token) throw new Error(data?.message ?? "TikTok OAuth token exchange failed.");
    return String(token);
  }

  throw new Error("Unsupported OAuth platform.");
}

async function upsertConnectedAccount(input: { userId: string; platform: AdPlatform; name: string; externalId: string; token: string; scopes?: string[] }) {
  const provider = input.platform === "instagram" ? "instagram" : input.platform === "meta" ? "meta" : input.platform === "tiktok" ? "tiktok" : "youtube";
  const { error } = await supabaseAdmin().from("connected_accounts").upsert({
    user_id: input.userId,
    provider,
    account_type: providerAccountTypes[provider],
    display_name: input.name,
    external_account_id: input.externalId || input.name,
    status: "connected",
    access_token_encrypted: encryptConnectedToken(input.token),
    scopes: input.scopes ?? ["media_upload", "draft_create", "publish_after_approval"],
    last_verified_at: new Date().toISOString(),
    metadata: { source: "oauth_callback", publishGuard: "final_user_approval_required" },
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,provider,external_account_id" });
  if (error) throw error;
}

async function loadMetaConnections(platform: AdPlatform, accessToken: string) {
  if (platform === "instagram") {
    const url = new URL(`https://graph.facebook.com/${metaGraphVersion()}/me/accounts`);
    url.searchParams.set("fields", "id,name,instagram_business_account{id,username}");
    url.searchParams.set("access_token", accessToken);
    const pages = await fetchMetaJson<{ data?: MetaPage[] }>(url.toString());
    return (pages.data ?? [])
      .filter((page) => page.instagram_business_account?.id)
      .map((page) => ({
        accountName: page.instagram_business_account?.username || page.name || "Instagram business account",
        externalAccountId: page.instagram_business_account?.id || page.id
      }));
  }

  const adAccountsUrl = new URL(`https://graph.facebook.com/${metaGraphVersion()}/me/adaccounts`);
  adAccountsUrl.searchParams.set("fields", "id,name,account_status");
  adAccountsUrl.searchParams.set("access_token", accessToken);
  const adAccounts = await fetchMetaJson<{ data?: MetaAdAccount[] }>(adAccountsUrl.toString());
  const mappedAdAccounts = (adAccounts.data ?? []).map((account) => ({
    accountName: account.name || "Meta ad account",
    externalAccountId: account.id.replace(/^act_/, "")
  }));
  if (mappedAdAccounts.length) return mappedAdAccounts;

  const pagesUrl = new URL(`https://graph.facebook.com/${metaGraphVersion()}/me/accounts`);
  pagesUrl.searchParams.set("fields", "id,name");
  pagesUrl.searchParams.set("access_token", accessToken);
  const pages = await fetchMetaJson<{ data?: MetaPage[] }>(pagesUrl.toString());
  return (pages.data ?? []).map((page) => ({ accountName: page.name || "Facebook page", externalAccountId: page.id }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") ?? "");
  const rawState = String(url.searchParams.get("state") ?? "");
  const providerError = String(url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "");
  const state = decodeState(rawState);
  const platform = String(state.platform ?? url.searchParams.get("platform") ?? "meta") as AdPlatform;

  try {
    if (!supportedConnectedPlatforms.includes(platform)) throw new Error("Unsupported OAuth platform.");
    if (providerError) throw new Error(providerError);
    if (!code) throw new Error("OAuth code is missing.");

    const userId = String(state.userId ?? "").trim();
    if (!userId) throw new Error("OAuth state does not include user id.");

    const accessToken = await exchangeConnectedCodeForToken(code, platform);

    if (!supportedMetaPlatforms.includes(platform)) {
      await upsertConnectedAccount({
        userId,
        platform,
        name: platform === "youtube" ? "YouTube channel" : "TikTok account",
        externalId: `${platform}-${userId}`,
        token: accessToken
      });
      return redirectWithStatus("/dashboard/connections", { connected: platform, count: "1" });
    }

    const connections = await loadMetaConnections(platform, accessToken);
    if (!connections.length) throw new Error(platform === "instagram" ? "No Instagram business account was found for this Meta login." : "No Meta ad account or Facebook page was found for this Meta login.");

    const rows = connections.map((connection) => ({
      user_id: userId,
      platform,
      account_name: connection.accountName,
      external_account_id: connection.externalAccountId,
      access_token_encrypted: encryptConnectedToken(accessToken),
      status: "connected",
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin().from("connected_ad_accounts").insert(rows);
    if (error) console.warn("Legacy connected_ad_accounts insert skipped", error.message);

    await Promise.all(connections.map((connection) => upsertConnectedAccount({
      userId,
      platform,
      name: connection.accountName,
      externalId: connection.externalAccountId,
      token: accessToken
    })));

    return redirectWithStatus("/dashboard/connections", { connected: platform, count: String(rows.length) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta OAuth callback failed.";
    return redirectWithStatus("/dashboard/connections", { error: message });
  }
}
