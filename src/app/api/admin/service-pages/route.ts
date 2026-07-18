import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { servicePages } from "@/lib/service-pages";
import { normalizeServicePagesConfig, SERVICE_PAGES_CONFIG_KEY } from "@/lib/service-pages-loader";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function publishSummary(pages: typeof servicePages) {
  return {
    total: pages.length,
    published: pages.filter((page) => (page.status ?? "published") === "published").length,
    noindex: pages.filter((page) => page.status === "noindex").length,
    draft: pages.filter((page) => page.status === "draft").length,
    sitemap: pages.filter((page) => page.includeInSitemap !== false && page.status !== "draft").length
  };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", SERVICE_PAGES_CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;

    const normalized = normalizeServicePagesConfig(data?.value);
    return Response.json({
      servicePages: normalized,
      summary: publishSummary(normalized),
      updated_at: data?.updated_at ?? null,
      fallback: !data
    });
  } catch (error) {
    return Response.json({ servicePages, summary: publishSummary(servicePages), fallback: true, error: errorMessage(error, "Could not load service pages") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const pages = normalizeServicePagesConfig(body.servicePages);

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: SERVICE_PAGES_CONFIG_KEY,
        value: { pages },
        description: "Public SEO/service pages managed from admin panel",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    const normalized = normalizeServicePagesConfig(data.value);
    return Response.json({ servicePages: normalized, summary: publishSummary(normalized), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save service pages") }, { status: 500 });
  }
}
