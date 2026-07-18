import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { defaultSiteContentConfig, normalizeSiteContentConfig } from "@/lib/site-content-config";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "site_content";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;

    return Response.json({
      siteContent: normalizeSiteContentConfig(data?.value),
      updated_at: data?.updated_at ?? null,
      fallback: !data
    });
  } catch (error) {
    return Response.json({ siteContent: defaultSiteContentConfig, fallback: true, error: errorMessage(error, "Could not load site content") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const siteContent = normalizeSiteContentConfig(body.siteContent);

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: siteContent,
        description: "Public navigation, blog, help content and social links; also manages homepage showcase slides",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    return Response.json({ siteContent: normalizeSiteContentConfig(data.value), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save site content") }, { status: 500 });
  }
}
