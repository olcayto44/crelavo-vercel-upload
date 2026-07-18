import { computeCancellationCreditResolution } from "@/lib/credit-resolution";
import { supabaseAdmin } from "@/lib/supabase";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productionId = String(body.production_id ?? "").trim();
    const userId = String(body.user_id ?? "").trim();

    if (!productionId || !userId) {
      return Response.json({ error: "production_id and user_id are required." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: production, error: productionError } = await supabase
      .from("production_requests")
        .select("id, user_id, status, automation_status, reserved_credits, estimated_credits, output_json")

      .eq("id", productionId)
      .eq("user_id", userId)
      .single();

    if (productionError) throw productionError;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });

    if (["ready", "failed", "cancelled"].includes(production.status)) {
      return Response.json({ error: "This production is already closed." }, { status: 400 });
    }

    const reservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
    const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = Number(balanceRow?.balance ?? 0) || 0;
    const reserved = Number(balanceRow?.reserved ?? 0) || 0;
    const creditDecision = computeCancellationCreditResolution({ balance, reserved, reservedCredits, productionId });

    const { error: balanceUpdateError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: userId,
        balance: creditDecision.nextBalance,
        reserved: creditDecision.nextReserved,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (balanceUpdateError) throw balanceUpdateError;

    const events = creditDecision.events.map((event) => ({ user_id: userId, ...event }));

    if (events.length > 0) {
      const { error: eventError } = await supabase.from("credit_events").insert(events);
      if (eventError) throw eventError;
    }

    const { data, error } = await supabase
      .from("production_requests")
      .update({
        status: "cancelled",
        automation_status: "cancelled",
        generation_status: "cancelled_by_member",
        cancellation_fee_credits: creditDecision.cancellationFee,
        reserved_credits: 0,
        output_json: { ...outputJson, creditResolution: creditDecision.creditResolution },
        error_message: "Cancelled by member. 50% reserved credits charged according to automatic production policy.",
        updated_at: new Date().toISOString()
      })
      .eq("id", productionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({ production: data, cancellation_fee: creditDecision.cancellationFee, refund_amount: creditDecision.refundAmount });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not cancel production") }, { status: 500 });
  }
}
