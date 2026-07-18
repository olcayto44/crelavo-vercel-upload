import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const allowedPayoutStatuses = ["pending_bank_details", "pending_verification", "verified", "rejected", "paused"];

function cleanText(value: unknown, maxLength = 240) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanPartnerCode(value: unknown) {
  return cleanText(value, 80).toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ partnerCode: string }> }) {
  const { partnerCode } = await params;
  const body = await request.json().catch(() => ({}));

  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const cleanCode = cleanPartnerCode(partnerCode);
  if (!cleanCode) return Response.json({ error: "Partner code is required." }, { status: 400 });

  const payoutStatus = cleanText(body.payout_status ?? body.payoutStatus, 80) || "pending_verification";
  if (!allowedPayoutStatuses.includes(payoutStatus)) {
    return Response.json({ error: "Invalid partner payout status." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update partner payout details." }, { status: 503 });
  }

  const updatePayload = {
    payout_method: cleanText(body.payout_method ?? body.payoutMethod, 80) || null,
    payout_email: cleanText(body.payout_email ?? body.payoutEmail, 160) || null,
    bank_name: cleanText(body.bank_name ?? body.bankName, 160) || null,
    bank_account_holder: cleanText(body.bank_account_holder ?? body.bankAccountHolder, 160) || null,
    bank_iban: cleanText(body.bank_iban ?? body.bankIban, 120) || null,
    bank_swift: cleanText(body.bank_swift ?? body.bankSwift, 80) || null,
    payout_status: payoutStatus,
    payout_verified_at: payoutStatus === "verified" ? new Date().toISOString() : null,
    payout_notes: cleanText(body.payout_notes ?? body.payoutNotes, 1000) || null
  };

  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_profiles")
      .update(updatePayload)
      .eq("partner_code", cleanCode)
      .select("id,partner_name,email,partner_code,status,payout_method,payout_email,bank_name,bank_account_holder,bank_iban,bank_swift,payout_status,payout_verified_at,payout_notes,updated_at")
      .single();

    if (error) throw error;
    return Response.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update partner payout details.";
    return Response.json({ error: message }, { status: 500 });
  }
}
