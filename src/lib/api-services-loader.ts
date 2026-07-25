import { normalizeApiServicesConfig, API_SERVICES_CONFIG_KEY, type ApiServicesPayload } from "@/lib/api-services-config";
import { apiServiceGroups } from "@/lib/api-services";
import { supabaseAdmin } from "@/lib/supabase";

export async function getConfiguredApiServiceGroups() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", API_SERVICES_CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    return normalizeApiServicesConfig(data?.value as ApiServicesPayload);
  } catch {
    return apiServiceGroups;
  }
}

export { API_SERVICES_CONFIG_KEY, normalizeApiServicesConfig };
