import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { normalizePartnerCode } from "@/lib/partner-program";
import { supabaseAdmin } from "@/lib/supabase";

const allowedPayoutStatuses = ["pending_review", "approved", "rejected", "paid", "manual_margin_review", "no_commission"];

function toMoney(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const partnerCode = normalizePartnerCode(body.partner_code ?? body.partnerCode);
  const customerEmail = String(body.customer_email ?? body.customerEmail ?? "").trim().toLowerCase();
  const purchaseCategory = String(body.purchase_category ?? body.purchaseCategory ?? "").trim();
  const packageName = String(body.package_name ?? body.packageName ?? "").trim();
  const purchaseAmount = toMoney(body.purchase_amount ?? body.purchaseAmount);
  const commissionPercent = toMoney(body.commission_percent ?? body.commissionPercent);
  const providedCommissionAmount = toMoney(body.commission_amount ?? body.commissionAmount);
  const commissionAmount = providedCommissionAmount > 0 ? providedCommissionAmount : toMoney((purchaseAmount * commissionPercent) / 100);
  const payoutStatus = String(body.payout_status ?? body.payoutStatus ?? "pending_review").trim();

  if (!partnerCode || !customerEmail || !purchaseCategory || !packageName) {
    return Response.json({ error: "Partner code, customer email, purchase category and package name are required." }, { status: 400 });
  }

  if (purchaseAmount <= 0 || commissionPercent < 0) {
    return Response.json({ error: "Purchase amount must be above 0 and commission percent cannot be negative." }, { status: 400 });
  }

  if (!allowedPayoutStatuses.includes(payoutStatus)) {
    return Response.json({ error: "Invalid payout status." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create manual commission records." }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_commission_ledger")
      .insert({
        partner_code: partnerCode,
        customer_email: customerEmail,
        customer_user_id: body.customer_user_id ?? body.customerUserId ?? null,
        purchase_category: purchaseCategory,
        package_name: packageName,
        purchase_amount: purchaseAmount,
        commission_percent: commissionPercent,
        commission_amount: commissionAmount,
        currency: String(body.currency ?? "USD").trim().toUpperCase().slice(0, 8),
        source: "manual_admin",
        payment_reference: String(body.payment_reference ?? body.paymentReference ?? "").trim() || null,
        payout_status: payoutStatus,
        payout_window: String(body.payout_window ?? body.payoutWindow ?? "").trim() || null,
        admin_notes: String(body.admin_notes ?? body.adminNotes ?? "").trim() || null
      })
      .select("id,partner_code,customer_email,purchase_category,package_name,purchase_amount,commission_percent,commission_amount,currency,source,payment_reference,payout_status,payout_window,admin_notes,created_at")
      .single();

    if (error) throw error;

    await supabaseAdmin()
      .from("partner_referral_events")
      .insert({
        partner_code: partnerCode,
        event_type: "purchase",
        email: customerEmail,
        ip_address: "manual_admin",
        country: "Unknown",
        city: "Unknown",
        metadata: {
          source: "manual_admin",
          packageName,
          purchaseAmount,
          commissionPercent,
          commissionAmount,
          paymentReference: String(body.payment_reference ?? body.paymentReference ?? "").trim() || null
        }
      });

    return Response.json({ commission: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create manual commission record.";
    return Response.json({ error: message }, { status: 500 });
  }
}
