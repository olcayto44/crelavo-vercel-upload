import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return Response.json({ error: "User session is required." }, { status: 401 });
  }

  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("credit_balances")
      .select("balance, reserved, current_subscription_credits, rolled_over_credits, topup_credits, bonus_credits, rollover_cap, subscription_status, billing_cycle_ends_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return Response.json({
      balance: data?.balance ?? 0,
      reserved: data?.reserved ?? 0,
      available: (data?.balance ?? 0) - (data?.reserved ?? 0),
      current_subscription_credits: data?.current_subscription_credits ?? 0,
      rolled_over_credits: data?.rolled_over_credits ?? 0,
      topup_credits: data?.topup_credits ?? 0,
      bonus_credits: data?.bonus_credits ?? 0,
      rollover_cap: data?.rollover_cap ?? 0,
      subscription_status: data?.subscription_status ?? "inactive",
      billing_cycle_ends_at: data?.billing_cycle_ends_at ?? null,
      updated_at: data?.updated_at ?? null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load credits";
    return Response.json({ error: message }, { status: 500 });
  }
}
