import { defaultSiteContentConfig, normalizeSiteContentConfig, type SiteContentConfig } from "@/lib/site-content-config";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "site_content";

type SiteContentPayload = Partial<SiteContentConfig> | null;

export async function getConfiguredSiteContentConfig(): Promise<SiteContentConfig> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;
    return normalizeSiteContentConfig(data?.value as SiteContentPayload);
  } catch {
    return defaultSiteContentConfig;
  }
}
