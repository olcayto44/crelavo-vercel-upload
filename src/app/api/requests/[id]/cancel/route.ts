import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();

  if (!userId) {
    return Response.json({ error: "User session is required." }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({
      request: { id, status: "cancelled", updated_at: new Date().toISOString() },
      mode: "mock"
    });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: currentRequest, error: requestReadError } = await supabase
      .from("video_requests")
      .select("id, user_id, status, reserved_credits, estimated_credits")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (requestReadError) throw requestReadError;

    if (["ready", "failed", "cancelled"].includes(currentRequest.status)) {
      return Response.json({ error: "This request is already closed." }, { status: 400 });
    }

    const reservedCredits = currentRequest.reserved_credits ?? currentRequest.estimated_credits ?? 0;
    const cancellationFee = Math.ceil(reservedCredits * 0.5);
    const refundAmount = Math.max(0, reservedCredits - cancellationFee);

    const { data: balanceRow, error: balanceReadError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceReadError) throw balanceReadError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;

    const { error: balanceUpdateError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: userId,
        balance: Math.max(0, balance - cancellationFee),
        reserved: Math.max(0, reserved - reservedCredits),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (balanceUpdateError) throw balanceUpdateError;

    const events = [];
    if (cancellationFee > 0) {
      events.push({
        user_id: userId,
        type: "spend",
        amount: cancellationFee,
        note: `50% cancellation fee for request: ${id}`
      });
    }
    if (refundAmount > 0) {
      events.push({
        user_id: userId,
        type: "refund",
        amount: refundAmount,
        note: `50% refund after cancellation: ${id}`
      });
    }

    if (events.length > 0) {
      const { error: creditEventError } = await supabase
        .from("credit_events")
        .insert(events);

      if (creditEventError) throw creditEventError;
    }

    const { data, error } = await supabase
      .from("video_requests")
      .update({
        status: "cancelled",
        generation_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({
      request: data,
      cancellation_fee: cancellationFee,
      refund_amount: refundAmount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel request";
    return Response.json({ error: message }, { status: 500 });
  }
}
