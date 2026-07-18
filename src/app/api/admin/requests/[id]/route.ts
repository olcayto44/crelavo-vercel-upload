import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const allowed = ["pending", "in_production", "ready", "failed", "cancelled"];
  if (body.status && !allowed.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({
      request: { id, ...body, updated_at: new Date().toISOString() },
      mode: "mock"
    });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: currentRequest, error: requestReadError } = await supabase
      .from("video_requests")
      .select("user_id, status, reserved_credits, estimated_credits")
      .eq("id", id)
      .single();

    if (requestReadError) throw requestReadError;

    const oldStatus = currentRequest.status;
    const newStatus = body.status ?? oldStatus;
    const reservedCredits = currentRequest.reserved_credits ?? currentRequest.estimated_credits ?? 0;

    if (oldStatus !== newStatus && ["ready", "failed", "cancelled"].includes(newStatus) && reservedCredits > 0) {
      const { data: balanceRow, error: balanceReadError } = await supabase
        .from("credit_balances")
        .select("balance, reserved")
        .eq("user_id", currentRequest.user_id)
        .maybeSingle();

      if (balanceReadError) throw balanceReadError;

      const balance = balanceRow?.balance ?? 0;
      const reserved = balanceRow?.reserved ?? 0;
      const cancellationFee = newStatus === "cancelled" ? Math.ceil(reservedCredits * 0.5) : 0;
      const spendAmount = newStatus === "ready" ? reservedCredits : cancellationFee;
      const refundAmount = newStatus === "failed" ? reservedCredits : newStatus === "cancelled" ? Math.max(0, reservedCredits - cancellationFee) : 0;
      const nextReserved = Math.max(0, reserved - reservedCredits);
      const nextBalance = spendAmount > 0 ? Math.max(0, balance - spendAmount) : balance;

      const { error: balanceUpdateError } = await supabase
        .from("credit_balances")
        .upsert({
          user_id: currentRequest.user_id,
          balance: nextBalance,
          reserved: nextReserved,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (balanceUpdateError) throw balanceUpdateError;

      const events = [];
      if (spendAmount > 0) {
        events.push({
          user_id: currentRequest.user_id,
          type: "spend",
          amount: spendAmount,
          note: newStatus === "cancelled" ? `50% cancellation fee for request: ${id}` : `Request ${id} marked ready`
        });
      }
      if (refundAmount > 0) {
        events.push({
          user_id: currentRequest.user_id,
          type: "refund",
          amount: refundAmount,
          note: newStatus === "cancelled" ? `50% refund after cancellation: ${id}` : `Request ${id} marked failed`
        });
      }

      if (events.length > 0) {
        const { error: creditEventError } = await supabase
          .from("credit_events")
          .insert(events);

        if (creditEventError) throw creditEventError;
      }
    }

    const rawActualCost = body.actual_cost_usd === "" || body.actual_cost_usd === undefined ? null : Number(body.actual_cost_usd);
    const update = {
      status: newStatus,
      admin_notes: body.admin_notes,
      final_video_url: body.final_video_url,
      caption: body.caption,
      hashtags: body.hashtags,
      actual_cost_usd: Number.isFinite(rawActualCost) ? rawActualCost : null,
      production_tool_used: body.production_tool_used,
      production_cost_notes: body.production_cost_notes,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("video_requests")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ request: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update request";
    return Response.json({ error: message }, { status: 500 });
  }
}
