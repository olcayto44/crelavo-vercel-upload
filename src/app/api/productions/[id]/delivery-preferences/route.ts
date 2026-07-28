import { isAdminRequest } from "@/lib/admin-guard";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function requireProductionAccess(request: Request, production: { user_id?: string | null }) {
  if (isAdminRequest(request)) return { ok: true as const };
  const productionUserId = clean(production.user_id);
  if (!productionUserId) return { ok: false as const, response: Response.json({ error: "Production owner is missing." }, { status: 403 }) };
  const verified = await requireVerifiedRequestUser(request, productionUserId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const supabase = supabaseAdmin();
  const { data: production, error } = await supabase
    .from("production_requests")
    .select("id, user_id, output_json")
    .eq("id", id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!production) return Response.json({ error: "Production not found." }, { status: 404 });

  const access = await requireProductionAccess(request, production);
  if (!access.ok) return access.response;

  const hashtagsRaw = clean(body.hashtags ?? body.product_tags ?? body.productTags);
  const preferences = {
    caption: clean(body.caption ?? body.product_description ?? body.productDescription),
    hashtags: hashtagsRaw.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean).map((item) => item.startsWith("#") ? item : `#${item}`),
    productId: clean(body.product_id ?? body.productId),
    productTags: hashtagsRaw.split(/[\s,]+/).map((item) => item.replace(/^#/, "").trim()).filter(Boolean),
    updatedAt: new Date().toISOString(),
    policy: "Stored for export-ready delivery pack; live social/store mutation still requires final approval."
  };

  const outputJson = objectValue(production.output_json);
  const nextOutput = {
    ...outputJson,
    deliveryPreferences: preferences,
    socialStoreDelivery: {
      ...objectValue(outputJson.socialStoreDelivery),
      caption: preferences.caption,
      hashtags: preferences.hashtags,
      productId: preferences.productId,
      productTags: preferences.productTags,
      updatedAt: preferences.updatedAt
    }
  };

  const { data: updated, error: updateError } = await supabase
    .from("production_requests")
    .update({ output_json: nextOutput })
    .eq("id", id)
    .select("id, output_json")
    .single();

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ saved: true, deliveryPreferences: preferences, production: updated });
}
