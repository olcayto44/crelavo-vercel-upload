import { requireAdminPermission } from "@/lib/admin-guard";
import { apiServiceGroups } from "@/lib/api-services";
import { normalizeApiServicesConfig, API_SERVICES_CONFIG_KEY } from "@/lib/api-services-loader";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function serviceSummary(groups: typeof apiServiceGroups) {
  const services = groups.flatMap((group) => group.services);
  return {
    groups: groups.length,
    services: services.length,
    imageCount: services.filter((service) => Boolean(service.image)).length
  };
}

export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["providers", "content"]);
  if (!access.ok) return access.response;

  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", API_SERVICES_CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;

    const normalized = normalizeApiServicesConfig(data?.value);
    return Response.json({
      apiServiceGroups: normalized,
      summary: serviceSummary(normalized),
      updated_at: data?.updated_at ?? null,
      fallback: !data
    });
  } catch (error) {
    return Response.json({ apiServiceGroups, summary: serviceSummary(apiServiceGroups), fallback: true, error: errorMessage(error, "Could not load API services") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireAdminPermission(request, ["providers", "content"], body);
    if (!access.ok) return access.response;
    const groups = normalizeApiServicesConfig(body.apiServiceGroups);

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: API_SERVICES_CONFIG_KEY,
        value: { groups },
        description: "Public API service cards managed from admin panel",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    const normalized = normalizeApiServicesConfig(data.value);
    return Response.json({ apiServiceGroups: normalized, summary: serviceSummary(normalized), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save API services") }, { status: 500 });
  }
}
