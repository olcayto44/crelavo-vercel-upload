import { supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

export async function recordWhopAnalytics(input: {
  eventId: string;
  eventType: string;
  paymentId?: string;
  membershipId?: string;
  customerId?: string;
  planId?: string;
  productId?: string;
  userId?: string | null;
  email?: string;
  amount?: number | null;
  currency?: string;
  status: string;
  billingReason?: string;
  occurredAt?: string;
}) {
  const supabase = supabaseAdmin();
  const occurredAt = input.occurredAt || new Date().toISOString();
  const safeEventId = clean(input.eventId);
  const paymentId = clean(input.paymentId);
  const membershipId = clean(input.membershipId);
  const userId = input.userId || null;
  await supabase.from("payment_provider_events").upsert({
    provider: "whop",
    event_id: safeEventId,
    event_type: clean(input.eventType, 120),
    user_id: userId,
    payload: { event: clean(input.eventType, 120), paymentId, membershipId, planId: clean(input.planId, 160), status: clean(input.status, 50) }
  }, { onConflict: "provider,event_id" });

  await supabase.from("payment_transactions").upsert({
    provider: "whop",
    event_id: safeEventId || null,
    payment_id: paymentId || null,
    customer_id: clean(input.customerId) || null,
    membership_id: membershipId || null,
    plan_id: clean(input.planId, 160) || null,
    product_id: clean(input.productId, 160) || null,
    user_id: userId,
    amount: typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : null,
    currency: clean(input.currency, 12).toLowerCase() || null,
    status: clean(input.status, 50) || "unknown",
    billing_reason: clean(input.billingReason, 80) || null,
    occurred_at: occurredAt,
    updated_at: occurredAt
  }, { onConflict: paymentId ? "provider,payment_id" : "provider,event_id" });

  if (membershipId) {
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      provider: "whop",
      membership_id: membershipId,
      customer_id: clean(input.customerId) || null,
      plan_id: clean(input.planId, 160) || null,
      product_id: clean(input.productId, 160) || null,
      status: clean(input.status, 50) || "unknown",
      last_payment_at: input.paymentId ? occurredAt : null,
      updated_at: occurredAt
    }, { onConflict: "provider,membership_id" });
  }
}
