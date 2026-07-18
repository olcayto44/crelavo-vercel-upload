import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { normalizeFaqItems } from "@/lib/faq-config";
import { defaultFaqItems, type FaqItem } from "@/lib/site-content";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "faq_items";

type ConfigPayload = {
  faqs?: FaqItem[];
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

    const payload = data?.value as ConfigPayload | null;
    const faqs = normalizeFaqItems(payload?.faqs);
    return Response.json({ faqs, updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ faqs: defaultFaqItems, fallback: true, error: errorMessage(error, "Could not load FAQs") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const faqs = normalizeFaqItems(body.faqs);
    if (!faqs.length) return Response.json({ error: "At least one valid FAQ is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: { faqs },
        description: "Public FAQ section metadata",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    const payload = data.value as ConfigPayload;
    return Response.json({ faqs: normalizeFaqItems(payload.faqs), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save FAQs") }, { status: 500 });
  }
}
