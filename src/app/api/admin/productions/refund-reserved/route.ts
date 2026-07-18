import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { computeAdminReservedRefund } from "@/lib/credit-resolution";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  try {
    const productionId = String(body.production_id ?? "").trim();
    if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: production, error: productionError } = await supabase
      .from("production_requests")
      .select("id, user_id, title, status, reserved_credits, estimated_credits, output_json")
      .eq("id", productionId)
      .single();

    if (productionError) throw productionError;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });
    if (production.status !== "failed") return Response.json({ error: "Only failed productions can be refunded from this endpoint." }, { status: 409 });

    const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
    const creditResolution = outputJson.creditResolution && typeof outputJson.creditResolution === "object" ? outputJson.creditResolution as Record<string, unknown> : null;
    if (!creditResolution || creditResolution.status !== "admin_review_required") {
      return Response.json({ error: "Production does not have a pending admin credit review." }, { status: 409 });
    }

    const reservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
    if (reservedCredits <= 0) return Response.json({ error: "No reserved credits to refund." }, { status: 409 });

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", production.user_id)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = Number(balanceRow?.balance ?? 0) || 0;
    const reserved = Number(balanceRow?.reserved ?? 0) || 0;
    const creditDecision = computeAdminReservedRefund({
      balance,
      reserved,
      reservedCredits,
      productionTitle: production.title ?? production.id,
      existingResolution: creditResolution
    });

    const { data: nextBalance, error: updateBalanceError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: production.user_id,
        balance: creditDecision.nextBalance,
        reserved: creditDecision.nextReserved,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .select("balance, reserved, updated_at")
      .single();

    if (updateBalanceError) throw updateBalanceError;

    const resolvedCredit = creditDecision.creditResolution;

    const { data: updatedProduction, error: updateProductionError } = await supabase
      .from("production_requests")
      .update({
        reserved_credits: 0,
        output_json: { ...outputJson, creditResolution: resolvedCredit },
        admin_notes: `Reserved credits refunded by admin: ${creditDecision.refundAmount}. Provider failure remains recorded for production ${production.id}.`,
        updated_at: new Date().toISOString()
      })
      .eq("id", production.id)
      .select("*")
      .single();

    if (updateProductionError) throw updateProductionError;

    if (creditDecision.event) {
      const { error: eventError } = await supabase
        .from("credit_events")
        .insert({ user_id: production.user_id, ...creditDecision.event });

      if (eventError) throw eventError;
    }

    return Response.json({ production: updatedProduction, balance: nextBalance, refunded_credits: creditDecision.refundAmount });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not refund reserved credits") }, { status: 500 });
  }
}
