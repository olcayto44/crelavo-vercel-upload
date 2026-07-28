import { decryptConnectedToken } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function safeProducts(products: any[]) {
  return products.slice(0, 50).map((item) => ({
    id: String(item.id ?? item.admin_graphql_api_id ?? item.slug ?? item.name ?? ""),
    title: String(item.title ?? item.name ?? "Untitled product"),
    status: String(item.status ?? "unknown"),
    handle: String(item.handle ?? item.slug ?? ""),
    image: item.image?.src ?? item.images?.[0]?.src ?? null
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = clean(url.searchParams.get("user_id"));
  const accountId = clean(url.searchParams.get("connected_account_id"));
  if (!userId || !accountId) return Response.json({ error: "user_id and connected_account_id are required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const { data: account, error } = await supabaseAdmin()
    .from("connected_accounts")
    .select("id, user_id, provider, store_url, access_token_encrypted, refresh_token_encrypted, status")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!account) return Response.json({ error: "Connected account not found." }, { status: 404 });
  if (!account.store_url) return Response.json({ error: "Connected account has no store_url." }, { status: 400 });

  try {
    if (account.provider === "shopify") {
      const token = decryptConnectedToken(account.access_token_encrypted);
      if (!token) return Response.json({ products: [], mode: "connection_ready", note: "Shopify token is not stored yet." });
      const response = await fetch(`${String(account.store_url).replace(/\/$/, "")}/admin/api/2024-07/products.json?limit=50`, {
        headers: { "X-Shopify-Access-Token": token },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.errors ? JSON.stringify(data.errors) : `Shopify products failed: ${response.status}`);
      return Response.json({ products: safeProducts(Array.isArray(data.products) ? data.products : []), provider: "shopify" });
    }

    if (account.provider === "woocommerce") {
      const key = decryptConnectedToken(account.access_token_encrypted);
      const secret = decryptConnectedToken(account.refresh_token_encrypted);
      if (!key || !secret) return Response.json({ products: [], mode: "connection_ready", note: "WooCommerce credentials are not stored yet." });
      const productUrl = new URL(`${String(account.store_url).replace(/\/$/, "")}/wp-json/wc/v3/products`);
      productUrl.searchParams.set("per_page", "50");
      productUrl.searchParams.set("consumer_key", key);
      productUrl.searchParams.set("consumer_secret", secret);
      const response = await fetch(productUrl.toString(), { cache: "no-store" });
      const data = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(`WooCommerce products failed: ${response.status}`);
      return Response.json({ products: safeProducts(Array.isArray(data) ? data : []), provider: "woocommerce" });
    }

    return Response.json({ error: "Provider must be shopify or woocommerce." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Products could not be loaded." }, { status: 500 });
  }
}
