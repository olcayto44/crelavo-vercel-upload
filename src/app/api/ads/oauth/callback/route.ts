import { requireEnv, optionalEnv } from "@/lib/providers/env";
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

function appUrl() {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || "https://crelavo.com";
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
  const redirectUri = `${appUrl()}/api/ads/oauth/callback?platform=${platform}`;
  const url = new URL(`https://graph.facebook.com/${metaGraphVersion()}/oauth/access_token`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const token = await fetchMetaJson<MetaTokenResponse>(url.toString());
  if (!token.access_token) throw new Error(token.error?.message ?? "Meta access token was not returned.");
  return token.access_token;
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
  const platform = String(url.searchParams.get("platform") ?? "meta") as AdPlatform;
  const code = String(url.searchParams.get("code") ?? "");
  const rawState = String(url.searchParams.get("state") ?? "");
  const providerError = String(url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "");

  try {
    if (!supportedMetaPlatforms.includes(platform)) throw new Error("Unsupported Meta OAuth platform.");
    if (providerError) throw new Error(providerError);
    if (!code) throw new Error("Meta OAuth code is missing.");

    const state = decodeState(rawState);
    const userId = String(state.userId ?? "").trim();
    if (!userId) throw new Error("OAuth state does not include user id.");

    const accessToken = await exchangeCodeForToken(code, platform);
    const connections = await loadMetaConnections(platform, accessToken);
    if (!connections.length) throw new Error(platform === "instagram" ? "No Instagram business account was found for this Meta login." : "No Meta ad account or Facebook page was found for this Meta login.");

    const rows = connections.map((connection) => ({
      user_id: userId,
      platform,
      account_name: connection.accountName,
      external_account_id: connection.externalAccountId,
      access_token_encrypted: accessToken,
      status: "connected",
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin().from("connected_ad_accounts").insert(rows);
    if (error) throw error;

    return redirectWithStatus("/dashboard/connections", { connected: platform, count: String(rows.length) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta OAuth callback failed.";
    return redirectWithStatus("/dashboard/connections", { error: message });
  }
}
