import { Webhooks } from "@polar-sh/nextjs";
import type { NextRequest } from "next/server";
import { clearSubscriptionCreditBuckets } from "@/lib/credit-rollover";
import { supabaseAdmin } from "@/lib/supabase";

type PolarObject = Record<string, any>;
type PolarPayload = {
  type: string;
  timestamp: Date;
  data: PolarObject;
};

const INTERNAL_PRODUCT_ID = "pro_24h_free_trial";
const INTERNAL_BILLING = "monthly";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function objectValue(value: unknown): PolarObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as PolarObject : {};
}

function iso(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function customerFrom(data: PolarObject) {
  return objectValue(data.customer);
}

function productFrom(data: PolarObject) {
  return objectValue(data.product);
}

function polarProductId(data: PolarObject) {
  return clean(data.productId || productFrom(data).id);
}

function isCrelavoPro(data: PolarObject) {
  const configuredProductId = clean(process.env.POLAR_PRO_PRODUCT_ID);
  const providerProductId = polarProductId(data);
  if (configuredProductId) return providerProductId === configuredProductId;

  const productName = clean(productFrom(data).name);
  return productName.toLowerCase() === "crelavo pro";
}

function polarEventId(payload: PolarPayload) {
  const objectId = clean(payload.data.id) || clean(payload.data.checkoutId) || "unknown";
  return `${payload.type}:${objectId}:${iso(payload.timestamp) || "unknown"}`;
}

async function findProfile(data: PolarObject) {
  const supabase = supabaseAdmin();
  const customer = customerFrom(data);
  const externalId = clean(customer.externalId);

  if (isUuid(externalId)) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email")
      .eq("id", externalId)
      .maybeSingle();
    if (error) throw error;
    if (profile) return profile;
  }

  const email = normalizeEmail(customer.email);
  if (!email) return null;

  const { data: normalizedProfile, error: normalizedError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("normalized_email", email)
    .maybeSingle();
  if (normalizedError) throw normalizedError;
  if (normalizedProfile) return normalizedProfile;

  const { data: emailProfile, error: emailError } = await supabase
    .from("profiles")
    .select("id,email")
    .ilike("email", email)
    .maybeSingle();
  if (emailError) throw emailError;
  if (emailProfile) return emailProfile;

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw usersError;
  const authUser = usersData.users.find((user) => normalizeEmail(user.email) === email);
  if (!authUser?.email) return null;

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .upsert({
      id: authUser.id,
      email,
      normalized_email: email,
      full_name: clean(authUser.user_metadata?.full_name) || clean(customer.name) || null,
      role: "user"
    }, { onConflict: "id" })
    .select("id,email")
    .single();
  if (createError) throw createError;
  return createdProfile;
}

function accessStatus(eventType: string, data: PolarObject) {
  const providerStatus = clean(data.status).toLowerCase();
  const currentPeriodEnd = iso(data.currentPeriodEnd);
  const periodStillActive = Boolean(currentPeriodEnd && new Date(currentPeriodEnd).getTime() > Date.now());
  const canceling = Boolean(data.cancelAtPeriodEnd) && periodStillActive;

  if (eventType === "subscription.revoked") return "restricted";
  if (providerStatus === "trialing") return "trialing";
  if (providerStatus === "active") return canceling ? "active_canceling" : "active";
  if (providerStatus === "past_due") return "payment_failed";
  if (providerStatus === "unpaid" || providerStatus === "incomplete" || providerStatus === "incomplete_expired") return "restricted";
  if (providerStatus === "canceled") return periodStillActive ? "active_canceling" : "restricted";
  if (eventType === "subscription.canceled") return periodStillActive ? "active_canceling" : "restricted";
  return "restricted";
}

async function updateSubscription(payload: PolarPayload) {
  const data = payload.data;
  if (!isCrelavoPro(data)) return { ignored: true, reason: "polar_product_not_mapped" };

  const profile = await findProfile(data);
  const customer = customerFrom(data);
  const status = accessStatus(payload.type, data);
  const now = new Date().toISOString();
  const customerId = clean(data.customerId || customer.id);
  const membershipId = clean(data.id);

  if (!profile) {
    return {
      activated: false,
      reason: "crelavo_user_not_found",
      customerEmail: normalizeEmail(customer.email),
      customerId,
      membershipId
    };
  }

  const supabase = supabaseAdmin();
  const subscriptionStatus = clean(data.status).toLowerCase() || status;
  const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
    user_id: profile.id,
    provider: "polar",
    membership_id: membershipId,
    customer_id: customerId || null,
    plan_id: polarProductId(data) || null,
    product_id: INTERNAL_PRODUCT_ID,
    billing_interval: clean(data.recurringInterval) || INTERNAL_BILLING,
    status: subscriptionStatus,
    trial_started_at: iso(data.trialStart),
    trial_ends_at: iso(data.trialEnd),
    current_period_start_at: iso(data.currentPeriodStart),
    current_period_end_at: iso(data.currentPeriodEnd),
    cancel_at: data.cancelAtPeriodEnd ? iso(data.currentPeriodEnd) : iso(data.endsAt),
    canceled_at: iso(data.canceledAt),
    updated_at: now
  }, { onConflict: "provider,membership_id" });
  if (subscriptionError) throw subscriptionError;

  const profileUpdate: PolarObject = {
    billing_status: status,
    payment_provider_customer_id: customerId || undefined,
    normalized_email: normalizeEmail(customer.email) || undefined,
    billing_failed_at: status === "payment_failed" ? now : null,
    billing_restricted_at: status === "restricted" ? now : null
  };
  const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", profile.id);
  if (profileError) throw profileError;

  const { data: currentBalance, error: balanceReadError } = await supabase
    .from("credit_balances")
    .select("balance,reserved,current_subscription_credits,rolled_over_credits,topup_credits,bonus_credits,billing_cycle_ends_at")
    .eq("user_id", profile.id)
    .maybeSingle();
  if (balanceReadError) throw balanceReadError;

  const activeAccess = ["trialing", "active", "active_canceling"].includes(status);
  const balanceUpdate: PolarObject = activeAccess
    ? {
        user_id: profile.id,
        subscription_status: status,
        billing_cycle_ends_at: iso(data.currentPeriodEnd),
        active_subscription_package: INTERNAL_PRODUCT_ID,
        active_subscription_billing: INTERNAL_BILLING,
        updated_at: now
      }
    : {
        user_id: profile.id,
        ...clearSubscriptionCreditBuckets({ row: currentBalance }),
        subscription_status: status,
        active_subscription_package: null,
        active_subscription_billing: null,
        updated_at: now
      };
  const { error: balanceError } = await supabase.from("credit_balances").upsert(balanceUpdate, { onConflict: "user_id" });
  if (balanceError) throw balanceError;

  if (status === "trialing") {
    const { data: existingEntitlement, error: entitlementReadError } = await supabase
      .from("preview_entitlements")
      .select("preview_used,trial_preview_used,business_trial_used")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (entitlementReadError) throw entitlementReadError;
    const { error: entitlementError } = await supabase.from("preview_entitlements").upsert({
      user_id: profile.id,
      plan_id: "pro",
      preview_limit: 0,
      preview_used: Number(existingEntitlement?.preview_used ?? 0),
      trial_preview_limit: 1,
      trial_preview_used: Number(existingEntitlement?.trial_preview_used ?? 0),
      business_trial_used: Boolean(existingEntitlement?.business_trial_used),
      updated_at: now
    }, { onConflict: "user_id" });
    if (entitlementError) throw entitlementError;
  }

  return { activated: activeAccess, status, profileId: profile.id, membershipId };
}

async function updateCheckoutIntent(profileId: string | null, email: string, checkoutId: string, orderId: string) {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("checkout_intents")
    .update({ status: "completed", completed_at: new Date().toISOString(), provider_reference: checkoutId || orderId, updated_at: new Date().toISOString() })
    .eq("provider", "polar")
    .eq("product_id", INTERNAL_PRODUCT_ID)
    .eq("status", "started");

  if (profileId) query = query.eq("user_id", profileId);
  else if (email) query = query.ilike("email", email);
  else return;

  const { error } = await query;
  if (error) throw error;
}

async function recordOrder(payload: PolarPayload) {
  const data = payload.data;
  if (!isCrelavoPro(data)) return { ignored: true, reason: "polar_product_not_mapped" };

  const profile = await findProfile(data);
  const customer = customerFrom(data);
  const orderId = clean(data.id);
  const checkoutId = clean(data.checkoutId);
  const subscriptionId = clean(data.subscriptionId || objectValue(data.subscription).id);
  const email = normalizeEmail(customer.email);
  const isRefunded = payload.type === "order.refunded";
  const status = isRefunded ? "refunded" : clean(data.status) || (data.paid ? "paid" : "pending");
  const now = new Date().toISOString();
  const supabase = supabaseAdmin();

  const { error: transactionError } = await supabase.from("payment_transactions").upsert({
    provider: "polar",
    event_id: polarEventId(payload),
    payment_id: orderId,
    customer_id: clean(data.customerId || customer.id) || null,
    membership_id: subscriptionId || null,
    plan_id: polarProductId(data) || null,
    product_id: INTERNAL_PRODUCT_ID,
    user_id: profile?.id ?? null,
    amount: Number(data.totalAmount ?? 0) / 100,
    currency: clean(data.currency).toUpperCase() || "USD",
    status,
    billing_reason: clean(data.billingReason) || null,
    occurred_at: iso(payload.timestamp) || now,
    updated_at: now
  }, { onConflict: "provider,payment_id" });
  if (transactionError) throw transactionError;

  if (payload.type === "order.paid" && profile) {
    const { error: profileError } = await supabase.from("profiles").update({
      billing_status: "active",
      billing_failed_at: null,
      billing_restricted_at: null,
      payment_provider_customer_id: clean(data.customerId || customer.id) || undefined,
      normalized_email: email || undefined
    }).eq("id", profile.id);
    if (profileError) throw profileError;

    const { error: balanceError } = await supabase.from("credit_balances").upsert({
      user_id: profile.id,
      subscription_status: "active",
      active_subscription_package: INTERNAL_PRODUCT_ID,
      active_subscription_billing: INTERNAL_BILLING,
      updated_at: now
    }, { onConflict: "user_id" });
    if (balanceError) throw balanceError;
    await updateCheckoutIntent(profile.id, email, checkoutId, orderId);
  }

  return { recorded: true, paid: payload.type === "order.paid", refunded: isRefunded, profileId: profile?.id ?? null, orderId };
}

async function reserveEvent(payload: PolarPayload) {
  const eventId = polarEventId(payload);
  const supabase = supabaseAdmin();
  const serializedPayload = JSON.parse(JSON.stringify(payload));
  const { error } = await supabase.from("payment_provider_events").insert({
    provider: "polar",
    event_id: eventId,
    event_type: payload.type,
    payload: serializedPayload
  });
  if (!error) return { eventId, duplicate: false };
  if (error.code === "23505") return { eventId, duplicate: true };
  throw error;
}

async function processPolarPayload(rawPayload: unknown) {
  const payload = rawPayload as PolarPayload;
  const reservation = await reserveEvent(payload);
  if (reservation.duplicate) return { duplicate: true, eventId: reservation.eventId };

  try {
    let result: unknown = { ignored: true, event: payload.type };
    if ([
      "subscription.created",
      "subscription.updated",
      "subscription.active",
      "subscription.canceled",
      "subscription.uncanceled",
      "subscription.revoked"
    ].includes(payload.type)) {
      result = await updateSubscription(payload);
    } else if (["order.paid", "order.refunded"].includes(payload.type)) {
      result = await recordOrder(payload);
    }

    const profileId = objectValue(result).profileId;
    if (profileId) {
      await supabaseAdmin().from("payment_provider_events").update({ user_id: profileId }).eq("provider", "polar").eq("event_id", reservation.eventId);
    }
    console.log("Polar webhook processed", { eventId: reservation.eventId, type: payload.type, result });
    return result;
  } catch (error) {
    await supabaseAdmin().from("payment_provider_events").delete().eq("provider", "polar").eq("event_id", reservation.eventId);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = clean(process.env.POLAR_WEBHOOK_SECRET);
  if (!webhookSecret) {
    return Response.json({ error: "Polar webhook is not configured." }, { status: 503 });
  }

  return Webhooks({
    webhookSecret,
    onPayload: async (payload) => {
      await processPolarPayload(payload);
    }
  })(request);
}
