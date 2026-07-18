import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const allowedPayoutStatuses = ["pending_review", "approved", "rejected", "paid", "manual_margin_review", "no_commission"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const payoutStatus = String(body.payout_status ?? body.payoutStatus ?? "").trim();
  const adminNotes = String(body.admin_notes ?? body.adminNotes ?? "").trim();

  if (!allowedPayoutStatuses.includes(payoutStatus)) {
    return Response.json({ error: "Invalid commission payout status." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update commission payout status." }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_commission_ledger")
      .update({
        payout_status: payoutStatus,
        admin_notes: adminNotes || null
      })
      .eq("id", id)
      .select("id,partner_code,customer_email,purchase_category,package_name,purchase_amount,commission_percent,commission_amount,currency,source,payment_reference,payout_status,payout_window,admin_notes,updated_at")
      .single();

    if (error) throw error;

    const eventType = payoutStatus === "approved"
      ? "commission_approved"
      : payoutStatus === "rejected"
        ? "commission_rejected"
        : payoutStatus === "paid"
          ? "commission_approved"
          : "commission_pending";

    await supabaseAdmin()
      .from("partner_referral_events")
      .insert({
        partner_code: data.partner_code,
        event_type: eventType,
        email: data.customer_email,
        ip_address: "manual_admin",
        country: "Unknown",
        city: "Unknown",
        metadata: {
          source: "admin_commission_status_update",
          commissionId: data.id,
          payoutStatus,
          purchaseCategory: data.purchase_category,
          packageName: data.package_name,
          purchaseAmount: data.purchase_amount,
          commissionPercent: data.commission_percent,
          commissionAmount: data.commission_amount
        }
      });

    return Response.json({ commission: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update commission payout status.";
    return Response.json({ error: message }, { status: 500 });
  }
}
