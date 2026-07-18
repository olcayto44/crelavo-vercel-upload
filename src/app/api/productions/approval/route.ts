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
    const selectedOption = String(body.selected_option ?? "").trim();
    const extraCredits = Math.max(0, Number(body.extra_credits ?? 0));

    if (!productionId || !userId || !selectedOption) {
      return Response.json({ error: "production_id, user_id and selected_option are required." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: production, error: productionError } = await supabase
      .from("production_requests")
      .select("id, user_id, approval_status, reserved_credits")
      .eq("id", productionId)
      .eq("user_id", userId)
      .single();

    if (productionError) throw productionError;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });

    if (extraCredits > 0) {
      const { data: balanceRow, error: balanceError } = await supabase
        .from("credit_balances")
        .select("balance, reserved")
        .eq("user_id", userId)
        .maybeSingle();

      if (balanceError) throw balanceError;

      const balance = balanceRow?.balance ?? 0;
      const reserved = balanceRow?.reserved ?? 0;
      const available = balance - reserved;

      if (available < extraCredits) {
        return Response.json({ error: `Not enough credits. Required: ${extraCredits}, available: ${available}.`, redirect: "/dashboard/credits" }, { status: 402 });
      }

      const { error: reserveError } = await supabase
        .from("credit_balances")
        .upsert({ user_id: userId, balance, reserved: reserved + extraCredits, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      if (reserveError) throw reserveError;

      const { error: eventError } = await supabase
        .from("credit_events")
        .insert({ user_id: userId, type: "reserve", amount: extraCredits, note: `Extra approval credits for production ${productionId}: ${selectedOption}` });

      if (eventError) throw eventError;
    }

    const { data, error } = await supabase
      .from("production_requests")
      .update({
        approval_status: "answered",
        approval_answer: {
          selectedOption,
          extraCredits,
          answeredAt: new Date().toISOString()
        },
        extra_credit_required: 0,
        generation_status: "generation_ready_after_member_choice",
        automation_status: "running",
        updated_at: new Date().toISOString()
      })
      .eq("id", productionId)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({ production: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save approval decision") }, { status: 500 });
  }
}
