import { supabaseAdmin } from "@/lib/supabase";

export async function recordPaymentFulfillment(input: {
  paymentId: string;
  userId?: string | null;
  planId: string;
  productTitle: string;
  amountUsd?: number | null;
  credits: number;
  kind: "credits" | "pro_flag" | "service" | "skipped_preview";
  status: "pending_user" | "fulfilled" | "skipped" | "reversed";
  billingReason?: string | null;
}) {
  if (!input.paymentId || !input.planId) return null;
  const { data, error } = await supabaseAdmin()
    .from("payment_fulfillments")
    .upsert({
      whop_payment_id: input.paymentId,
      user_id: input.userId ?? null,
      plan_id: input.planId,
      product_title: input.productTitle,
      amount_usd: Number(input.amountUsd ?? 0),
      credits: input.credits,
      kind: input.kind,
      status: input.status,
      billing_reason: input.billingReason ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "whop_payment_id" })
    .select("id,whop_payment_id,status")
    .single();
  if (error) throw error;
  return data;
}

export async function recordCreditLedger(input: {
  userId: string;
  delta: number;
  reason: "purchase" | "spend" | "refund" | "admin" | "reverse";
  paymentId?: string | null;
  jobId?: string | null;
  note?: string | null;
}) {
  if (!input.userId || !input.delta) return null;
  const supabase = supabaseAdmin();
  if (input.paymentId) {
    const { data: existing } = await supabase
      .from("credit_ledger")
      .select("id")
      .eq("whop_payment_id", input.paymentId)
      .eq("reason", input.reason)
      .maybeSingle();
    if (existing) return existing;
  }
  const { data, error } = await supabase
    .from("credit_ledger")
    .insert({
      user_id: input.userId,
      delta: input.delta,
      reason: input.reason,
      whop_payment_id: input.paymentId ?? null,
      job_id: input.jobId ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
