import { buildExportReadyPack, connectedAccountGuardrails, connectedProviderLabels, encryptConnectedToken, normalizeConnectedProvider, normalizeConnectedStatus, providerAccountTypes, safeAccountResponse } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = clean(url.searchParams.get("user_id"));
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const { data, error } = await supabaseAdmin()
      .from("connected_accounts")
      .select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, scopes, token_expires_at, last_verified_at, metadata, error_message, created_at, updated_at, access_token_encrypted, refresh_token_encrypted")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ accounts: (data ?? []).map(safeAccountResponse), guardrails: connectedAccountGuardrails });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load connected accounts.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = clean(body.user_id ?? body.userId);
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const provider = normalizeConnectedProvider(body.provider);
    if (!provider) return Response.json({ error: "provider must be one of: tiktok, youtube, instagram, meta, shopify, woocommerce." }, { status: 400 });

    const displayName = clean(body.display_name ?? body.displayName) || connectedProviderLabels[provider];
    const externalAccountId = clean(body.external_account_id ?? body.externalAccountId) || displayName;
    const storeUrl = clean(body.store_url ?? body.storeUrl) || null;
    const status = normalizeConnectedStatus(body.status || (clean(body.access_token ?? body.accessToken) ? "connected" : "oauth_ready"));
    const scopes = Array.isArray(body.scopes) ? body.scopes.map(clean).filter(Boolean) : [];
    const accountType = providerAccountTypes[provider];

    const accessToken = encryptConnectedToken(clean(body.access_token ?? body.accessToken));
    const refreshToken = encryptConnectedToken(clean(body.refresh_token ?? body.refreshToken));

    const { data, error } = await supabaseAdmin()
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        provider,
        account_type: accountType,
        display_name: displayName,
        external_account_id: externalAccountId,
        store_url: storeUrl,
        status,
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken,
        token_expires_at: clean(body.token_expires_at ?? body.tokenExpiresAt) || null,
        scopes,
        last_verified_at: status === "connected" ? new Date().toISOString() : null,
        metadata: {
          mode: body.mode ?? "manual_or_oauth_ready",
          exportReadyPack: buildExportReadyPack({ targetProviders: [provider] }),
          policy: "draft_upload_or_publish_requires_final_user_approval"
        },
        error_message: status === "error" ? clean(body.error_message ?? body.errorMessage) : null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,provider,external_account_id" })
      .select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, scopes, token_expires_at, last_verified_at, metadata, error_message, created_at, updated_at, access_token_encrypted, refresh_token_encrypted")
      .single();

    if (error) throw error;
    return Response.json({ account: safeAccountResponse(data), guardrails: connectedAccountGuardrails });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save connected account.") }, { status: 500 });
  }
}
