import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { defaultDeliveryCreditRatesConfig, normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "delivery_credit_rates";

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
    return Response.json({ config: normalizeDeliveryCreditRates(data?.value), updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ config: defaultDeliveryCreditRatesConfig, fallback: true, error: errorMessage(error, "Could not load delivery credit rates") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  try {
    const body = await request.json();
    const config = normalizeDeliveryCreditRates(body.config);
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: config,
        description: "Admin-managed delivery extra credit rates for preview, ZIP, source, 4K and file package options",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();
    if (error) throw error;
    return Response.json({ config: normalizeDeliveryCreditRates(data.value), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save delivery credit rates") }, { status: 500 });
  }
}
