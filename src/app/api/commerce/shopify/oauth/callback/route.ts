import { encryptConnectedToken, providerAccountTypes } from "@/lib/connected-accounts";
import { optionalEnv, requireEnv } from "@/lib/providers/env";
import { supabaseAdmin } from "@/lib/supabase";

function appUrl() {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || optionalEnv("APP_URL") || "https://www.crelavo.com";
}

function decodeState(rawState: string) {
  try {
    return JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")) as { userId?: string; shop?: string; at?: number };
  } catch {
    return {};
  }
}

function redirectWithStatus(params: Record<string, string>) {
  const url = new URL("/dashboard/connections", appUrl());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return Response.redirect(url.toString(), 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") ?? "");
  const shop = String(url.searchParams.get("shop") ?? "").trim().toLowerCase();
  const state = decodeState(String(url.searchParams.get("state") ?? ""));
  const userId = String(state.userId ?? "").trim();

  try {
    if (!userId) throw new Error("Shopify OAuth state does not include user id.");
    if (!shop || !code) throw new Error("Shopify shop and code are required.");

    const clientId = requireEnv("SHOPIFY_CLIENT_ID");
    const clientSecret = requireEnv("SHOPIFY_CLIENT_SECRET");
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description ?? data.error ?? "Shopify OAuth token exchange failed.");

    const { error } = await supabaseAdmin().from("connected_accounts").upsert({
      user_id: userId,
      provider: "shopify",
      account_type: providerAccountTypes.shopify,
      display_name: shop,
      external_account_id: shop,
      store_url: `https://${shop}`,
      status: "connected",
      access_token_encrypted: encryptConnectedToken(String(data.access_token)),
      scopes: String(data.scope ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      last_verified_at: new Date().toISOString(),
      metadata: { source: "shopify_oauth_callback", storeMutationGuard: "final_user_approval_required" },
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,provider,external_account_id" });

    if (error) throw error;
    return redirectWithStatus({ connected: "shopify", shop });
  } catch (error) {
    return redirectWithStatus({ error: error instanceof Error ? error.message : "Shopify OAuth callback failed." });
  }
}
