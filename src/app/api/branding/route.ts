import { BRAND_CONFIG_KEY, defaultBrandConfig, validateBrandConfig } from "@/lib/brand-config";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  let branding = defaultBrandConfig;
  try {
    const { data, error } = await supabaseAdmin().from("platform_configs").select("value").eq("key", BRAND_CONFIG_KEY).maybeSingle();
    if (!error && data?.value) branding = validateBrandConfig(data.value);
  } catch { /* Yayın görseli, yapılandırma servisi olmadığında da kullanılabilir. */ }
  return Response.json({ branding }, { headers: { "Cache-Control": "no-store" } });
}
