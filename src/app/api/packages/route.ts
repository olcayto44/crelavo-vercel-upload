import { defaultPackageConfig, normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", PACKAGE_CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    return Response.json({ config: normalizePackageConfig(data?.value), fallback: !data });
  } catch {
    return Response.json({ config: defaultPackageConfig(), fallback: true });
  }
}
