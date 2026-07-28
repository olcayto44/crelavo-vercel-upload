import { encryptConnectedToken, providerAccountTypes, safeAccountResponse } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  const storeUrl = clean(body.store_url ?? body.storeUrl).replace(/\/$/, "");
  const consumerKey = clean(body.consumer_key ?? body.consumerKey);
  const consumerSecret = clean(body.consumer_secret ?? body.consumerSecret);

  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;
  if (!storeUrl || !consumerKey || !consumerSecret) return Response.json({ error: "store_url, consumer_key and consumer_secret are required." }, { status: 400 });

  let verified = false;
  let errorMessage = "";
  try {
    const verifyUrl = new URL(`${storeUrl}/wp-json/wc/v3/products`);
    verifyUrl.searchParams.set("per_page", "1");
    verifyUrl.searchParams.set("consumer_key", consumerKey);
    verifyUrl.searchParams.set("consumer_secret", consumerSecret);
    const response = await fetch(verifyUrl.toString(), { cache: "no-store" });
    verified = response.ok;
    if (!response.ok) errorMessage = `WooCommerce verification failed: ${response.status}`;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "WooCommerce verification failed.";
  }

  const { data, error } = await supabaseAdmin().from("connected_accounts").upsert({
    user_id: userId,
    provider: "woocommerce",
    account_type: providerAccountTypes.woocommerce,
    display_name: clean(body.display_name ?? body.displayName) || storeUrl,
    external_account_id: storeUrl,
    store_url: storeUrl,
    status: verified ? "connected" : "permission_limited",
    access_token_encrypted: encryptConnectedToken(consumerKey),
    refresh_token_encrypted: encryptConnectedToken(consumerSecret),
    scopes: ["products_read", "media_upload", "product_update"],
    last_verified_at: verified ? new Date().toISOString() : null,
    metadata: { source: "woocommerce_rest_verify", storeMutationGuard: "final_user_approval_required" },
    error_message: errorMessage || null,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,provider,external_account_id" })
    .select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, metadata, error_message, created_at, updated_at, access_token_encrypted, refresh_token_encrypted")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ account: safeAccountResponse(data), verified, error: errorMessage || null });
}
