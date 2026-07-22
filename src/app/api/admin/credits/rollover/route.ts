import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { creditRolloverSummaryRows, topupRolloverSummaryRows } from "@/lib/credit-rollover";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("credit_balances")
      .select("user_id, balance, reserved, current_subscription_credits, rolled_over_credits, topup_credits, bonus_credits, rollover_cap, subscription_status, billing_cycle_ends_at, active_subscription_package, active_subscription_billing, last_rollover_at, topup_expires_at, updated_at, profiles(email)")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({
      rows: data ?? [],
      monthlyPolicy: creditRolloverSummaryRows(),
      topupPolicy: topupRolloverSummaryRows()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load rollover data.";
    return Response.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
