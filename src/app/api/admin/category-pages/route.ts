import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { defaultCategoryPages } from "@/lib/category-pages";
import { normalizeCategoryPagesConfig } from "@/lib/category-pages-loader";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "category_pages";

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
      categoryPages: normalizeCategoryPagesConfig(data?.value),
      updated_at: data?.updated_at ?? null,
      fallback: !data
    });
  } catch (error) {
    return Response.json({ categoryPages: defaultCategoryPages, fallback: true, error: errorMessage(error, "Could not load category pages") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const categoryPages = normalizeCategoryPagesConfig(body.categoryPages);

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: categoryPages,
        description: "SEO category pages managed from admin for programmatic landing pages and internal links",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    return Response.json({ categoryPages: normalizeCategoryPagesConfig(data.value), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save category pages") }, { status: 500 });
  }
}
