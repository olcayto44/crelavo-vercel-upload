import { encryptConnectedToken, providerAccountTypes, safeAccountResponse } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("user_id") ?? "";
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const { data, error } = await supabaseAdmin()
      .from("connected_accounts")
      .select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, metadata, created_at, updated_at, access_token_encrypted, refresh_token_encrypted")
      .eq("user_id", userId)
      .eq("account_type", "commerce")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ stores: (data ?? []).map(safeAccountResponse) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load connected stores") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = clean(body.user_id);
    const platform = clean(body.platform).toLowerCase();
    const storeName = clean(body.store_name) || "Connected store";
    const storeUrl = clean(body.store_url);
    const externalStoreId = clean(body.external_store_id) || storeUrl || storeName;

    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    if (!["shopify", "woocommerce"].includes(platform)) {
      return Response.json({ error: "platform must be shopify or woocommerce for connected store upload automation." }, { status: 400 });
    }
    if (!storeUrl) return Response.json({ error: "store_url is required." }, { status: 400 });

    const accessToken = encryptConnectedToken(clean(body.access_token));
    const refreshToken = encryptConnectedToken(clean(body.refresh_token));
    const status = accessToken ? "connected" : "oauth_ready";

    const { data, error } = await supabaseAdmin()
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        provider: platform,
        account_type: providerAccountTypes[platform as "shopify" | "woocommerce"],
        display_name: storeName,
        external_account_id: externalStoreId,
        store_url: storeUrl,
        status,
        access_token_encrypted: accessToken,
        refresh_token_encrypted: refreshToken,
        scopes: ["store_media", "product_update", "draft_upload"],
        metadata: {
          connectionMode: accessToken ? "token_saved" : "oauth_ready_or_manual_setup",
          uploadTargets: ["product media", "product description", "metafields", "campaign assets"],
          guardrail: "No store product page changes without final user approval."
        },
        last_verified_at: accessToken ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,provider,external_account_id" })
      .select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, metadata, created_at, updated_at, access_token_encrypted, refresh_token_encrypted")
      .single();

    if (error) throw error;
    return Response.json({ store: safeAccountResponse(data) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not connect store") }, { status: 500 });
  }
}
