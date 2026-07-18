import { defaultDeliveryCreditRatesConfig, normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", "delivery_credit_rates")
      .maybeSingle();
    if (error) throw error;
    return Response.json({ config: normalizeDeliveryCreditRates(data?.value), fallback: !data });
  } catch {
    return Response.json({ config: defaultDeliveryCreditRatesConfig, fallback: true });
  }
}
