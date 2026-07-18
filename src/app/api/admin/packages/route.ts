import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { defaultPackageConfig, normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", PACKAGE_CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    return Response.json({ config: normalizePackageConfig(data?.value), updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ config: defaultPackageConfig(), fallback: true, error: errorMessage(error, "Could not load package config") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  try {
    const body = await request.json();
    const config = normalizePackageConfig({ ...body.config, updatedAt: new Date().toISOString() });
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: PACKAGE_CONFIG_KEY,
        value: config,
        description: "Admin-managed credit purchase packages and production package credit baselines",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();
    if (error) throw error;
    return Response.json({ config: normalizePackageConfig(data.value), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save package config") }, { status: 500 });
  }
}
