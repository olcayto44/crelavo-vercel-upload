import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("user_id") ?? "";
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from("connected_commerce_stores")
      .select("id, user_id, platform, store_name, store_url, external_store_id, status, metadata, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ stores: data ?? [] });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load connected stores") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const platform = String(body.platform ?? "").trim().toLowerCase();
    const storeName = String(body.store_name ?? "").trim() || "Connected store";
    const storeUrl = String(body.store_url ?? "").trim();
    const externalStoreId = String(body.external_store_id ?? "").trim() || storeUrl;

    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
    if (!["shopify", "amazon", "trendyol", "woocommerce", "custom"].includes(platform)) {
      return Response.json({ error: "platform must be shopify, amazon, trendyol, woocommerce or custom." }, { status: 400 });
    }
    if (!storeUrl) return Response.json({ error: "store_url is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from("connected_commerce_stores")
      .upsert({
        user_id: userId,
        platform,
        store_name: storeName,
        store_url: storeUrl,
        external_store_id: externalStoreId,
        status: "connected",
        access_token_encrypted: String(body.access_token ?? "") || null,
        refresh_token_encrypted: String(body.refresh_token ?? "") || null,
        metadata: {
          connectionMode: "manual_or_api_key",
          publishTargets: ["product page", "store media", "campaign asset", "ad export"],
          note: "Live OAuth/token exchange can replace manual credentials when provider apps are approved."
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,platform,external_store_id" })
      .select("id, user_id, platform, store_name, store_url, external_store_id, status, metadata, created_at, updated_at")
      .single();

    if (error) throw error;
    return Response.json({ store: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not connect store") }, { status: 500 });
  }
}
