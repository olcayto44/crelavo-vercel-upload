import { optionalEnv, requireEnv } from "@/lib/providers/env";
import { requireVerifiedRequestUser } from "@/lib/supabase";

function appUrl() {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || "https://www.crelavo.com";
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeShop(raw: string) {
  const value = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();
  if (!value) return "";
  return value.endsWith(".myshopify.com") ? value : `${value}.myshopify.com`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  const shop = normalizeShop(clean(body.shop ?? body.store_url ?? body.storeUrl));
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  if (!shop) return Response.json({ error: "Shopify store domain is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const clientId = requireEnv("SHOPIFY_CLIENT_ID");
  const redirectUri = `${appUrl()}/api/commerce/shopify/oauth/callback`;
  const state = Buffer.from(JSON.stringify({ userId, shop, at: Date.now() })).toString("base64url");
  const scopes = ["read_products", "write_products", "read_files", "write_files", "read_orders"].join(",");
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return Response.json({ url: url.toString(), shop, scopes });
}
