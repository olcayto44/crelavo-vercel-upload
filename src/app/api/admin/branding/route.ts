import { requireAdminPermission } from "@/lib/admin-guard";
import { BRAND_CONFIG_KEY, defaultBrandConfig, validateBrandConfig } from "@/lib/brand-config";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const access = await requireAdminPermission(request, "content");
  if (!access.ok) return access.response;
  try {
    const { data, error } = await supabaseAdmin().from("platform_configs").select("value,updated_at").eq("key", BRAND_CONFIG_KEY).maybeSingle();
    if (error) throw error;
    return Response.json({ branding: data?.value ? validateBrandConfig(data.value) : defaultBrandConfig, updated_at: data?.updated_at ?? null });
  } catch { return Response.json({ error: "Logo ayarları yüklenemedi. Veritabanı bağlantısını kontrol edin." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 800000) return Response.json({ error: "Logo çok büyük." }, { status: 413 });
    const body = await request.json();
    const access = await requireAdminPermission(request, "content", body);
    if (!access.ok) return access.response;
    let branding;
    try { branding = validateBrandConfig(body.branding); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Geçersiz logo." }, { status: 400 }); }
    const { error } = await supabaseAdmin().from("platform_configs").upsert({ key: BRAND_CONFIG_KEY, value: branding, description: "Public site logo; managed from the branding panel", updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return Response.json({ branding });
  } catch { return Response.json({ error: "Logo kaydedilemedi. Yönetim oturumunu ve veritabanını kontrol edin." }, { status: 503 }); }
}
