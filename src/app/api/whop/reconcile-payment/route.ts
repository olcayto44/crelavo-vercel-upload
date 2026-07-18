import { findPaymentProduct } from "@/lib/data";
import { sendAdminPaymentNotificationEmail, sendCreditActivationEmail } from "@/lib/payment-email";
import { supabaseAdmin } from "@/lib/supabase";
import { whopProductForPlanId } from "@/lib/whop";

type WhopObject = Record<string, unknown>;
type Product = NonNullable<ReturnType<typeof findPaymentProduct>>;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function nestedObject(source: WhopObject, key: string) {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as WhopObject : {};
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const candidate = clean(value);
    if (candidate) return candidate;
  }
  return "";
}

function numericAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : null;
}

function amountMatchesUsd(amount: number | null, expectedUsd: number | undefined) {
  if (amount === null || typeof expectedUsd !== "number") return false;
  return amount === expectedUsd || amount === expectedUsd * 100;
}

function displayAmountInCents(amount: number | null) {
  if (amount === null) return null;
  return amount < 1000 ? Math.round(amount * 100) : Math.round(amount);
}

function paymentPlan(payment: WhopObject) {
  return nestedObject(payment, "plan");
}

function paymentUser(payment: WhopObject) {
  return nestedObject(payment, "user");
}

function paymentMembership(payment: WhopObject) {
  return nestedObject(payment, "membership");
}

function paymentId(payment: WhopObject) {
  return firstString(payment.id, payment.payment_id, payment.receipt_id);
}

function paymentAmount(payment: WhopObject) {
  return numericAmount(payment.usd_total ?? payment.total ?? payment.amount_total ?? payment.amount);
}

function paymentCurrency(payment: WhopObject) {
  return firstString(payment.currency, "usd").toLowerCase();
}

function paymentStatus(payment: WhopObject) {
  return firstString(payment.status, payment.substatus);
}

function paymentSubstatus(payment: WhopObject) {
  return firstString(payment.substatus);
}

function paymentBillingReason(payment: WhopObject) {
  return firstString(payment.billing_reason, payment.billingReason);
}

function planIdFromPayment(payment: WhopObject) {
  return firstString(paymentPlan(payment).id, payment.plan_id);
}

function customerEmail(payment: WhopObject) {
  return firstString(paymentUser(payment).email, payment.email, payment.customer_email).toLowerCase();
}

function customerName(payment: WhopObject) {
  return firstString(paymentUser(payment).name, payment.name, payment.customer_name);
}

function membershipId(payment: WhopObject) {
  return firstString(paymentMembership(payment).id, payment.membership_id, nestedObject(payment, "member").id);
}

function membershipStatus(payment: WhopObject) {
  return firstString(paymentMembership(payment).status, payment.membership_status);
}

function creditsForProduct(product: Product, billing: string) {
  if (product.planType !== "subscription") return product.credits;
  return billing === "yearly" ? product.credits * 12 : product.credits;
}

function paymentSucceeded(payment: WhopObject) {
  return paymentStatus(payment) === "paid" || paymentSubstatus(payment) === "succeeded" || Boolean(payment.paid_at);
}

function shouldAddCredits(product: Product, billing: string, payment: WhopObject) {
  if (!product.credits || product.credits <= 0) return { add: false, reason: "no_credits_to_add" };

  const amount = paymentAmount(payment);
  const reason = paymentBillingReason(payment);
  const status = membershipStatus(payment);

  if (product.planType === "topup") return { add: true, reason: "one_time_credit_purchase" };
  if (product.planType !== "subscription") return { add: false, reason: "service_subscription_no_credit_balance" };

  const setupFeeUsd = "setupFeeUsd" in product ? product.setupFeeUsd : undefined;
  const previewPayment = reason === "subscription_create" || status === "trialing" || amountMatchesUsd(amount, setupFeeUsd);
  if (previewPayment) return { add: false, reason: "preview_setup_payment_no_full_credits" };

  const expectedRenewalUsd = billing === "yearly" ? product.priceUsd * 10 : product.priceUsd;
  const renewalPayment = ["subscription_cycle", "subscription"].includes(reason) || amountMatchesUsd(amount, expectedRenewalUsd);
  if (renewalPayment) return { add: true, reason: "subscription_renewal_credits" };

  return { add: false, reason: "subscription_payment_not_eligible_for_full_credits" };
}

function whopApiKey() {
  const raw = clean(process.env.WHOP_API_KEY).replace(/^['\"]|['\"]$/g, "");
  return raw
    .replace(/^WHOP_API_KEY\s*=\s*/i, "")
    .replace(/^Authorization\s*:\s*/i, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

async function retrieveWhopPayment(paymentIdValue: string) {
  const apiKey = whopApiKey();
  if (!apiKey) throw new Error("Missing WHOP_API_KEY");

  const response = await fetch(`https://api.whop.com/api/v1/payments/${encodeURIComponent(paymentIdValue)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": "2026-07-08",
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? JSON.stringify((payload as WhopObject).error)
      : text;
    throw new Error(`Whop payment lookup failed (${response.status}): ${message}`);
  }

  return payload as WhopObject;
}

async function profileByEmail(email: string, customerNameValue?: string | null) {
  const supabase = supabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileError) throw profileError;
  if (profile) return profile;

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const authUser = usersData.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
  if (!authUser?.email) return null;

  const { data: createdProfile, error: createProfileError } = await supabase
    .from("profiles")
    .upsert({
      id: authUser.id,
      email: authUser.email.toLowerCase(),
      full_name: clean(authUser.user_metadata?.full_name) || clean(customerNameValue) || null,
      role: "user"
    }, { onConflict: "id" })
    .select("id, email")
    .single();

  if (createProfileError) throw createProfileError;
  return createdProfile;
}

async function addCredits(input: {
  email: string;
  customerName?: string | null;
  product: Product;
  billing: string;
  credits: number;
  paymentId: string;
  membershipId: string;
}) {
  if (!input.email) return { activated: false, reason: "missing_customer_email" };

  const profile = await profileByEmail(input.email, input.customerName);
  if (!profile) return { activated: false, reason: "crelavo_user_not_found" };

  const supabase = supabaseAdmin();
  const idempotencyKey = `whop:payment:${input.paymentId}`;
  const { data: existingEvent, error: existingError } = await supabase
    .from("credit_events")
    .select("id, amount, note, created_at")
    .eq("user_id", profile.id)
    .ilike("note", `%${idempotencyKey}%`)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEvent) return { activated: false, reason: "already_processed", profile, existingEvent };

  const { data: balanceRow, error: balanceReadError } = await supabase
    .from("credit_balances")
    .select("balance, reserved")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (balanceReadError) throw balanceReadError;

  const currentBalance = Number(balanceRow?.balance ?? 0) || 0;
  const currentReserved = Number(balanceRow?.reserved ?? 0) || 0;
  const nextBalance = currentBalance + input.credits;

  const { data: balance, error: balanceError } = await supabase
    .from("credit_balances")
    .upsert({
      user_id: profile.id,
      balance: nextBalance,
      reserved: currentReserved,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" })
    .select("balance, reserved, updated_at")
    .single();

  if (balanceError) throw balanceError;

  const note = [
    idempotencyKey,
    `package=${input.product.id}`,
    `billing=${input.billing}`,
    `whop_payment=${input.paymentId}`,
    input.membershipId ? `membership=${input.membershipId}` : "",
    "source=checkout_complete_fallback"
  ].filter(Boolean).join(" | ");

  const { data: event, error: eventError } = await supabase
    .from("credit_events")
    .insert({ user_id: profile.id, type: "purchase", amount: input.credits, note })
    .select("id, type, amount, created_at")
    .single();

  if (eventError) throw eventError;
  return { activated: true, profile, balance, event, creditsAdded: input.credits };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedPaymentId = clean(body.payment_id ?? body.paymentId ?? body.receipt_id);
    if (!requestedPaymentId || !requestedPaymentId.startsWith("pay_")) {
      return Response.json({ ok: false, reason: "missing_or_invalid_payment_id" }, { status: 400 });
    }

    const payment = await retrieveWhopPayment(requestedPaymentId);
    const resolvedPaymentId = paymentId(payment) || requestedPaymentId;
    if (resolvedPaymentId !== requestedPaymentId) {
      return Response.json({ ok: false, reason: "payment_id_mismatch" }, { status: 400 });
    }

    if (!paymentSucceeded(payment)) {
      return Response.json({ ok: true, activated: false, reason: "payment_not_succeeded", status: paymentStatus(payment), substatus: paymentSubstatus(payment) });
    }

    const planId = planIdFromPayment(payment);
    const mappedPlan = whopProductForPlanId(planId);
    const product = mappedPlan ? findPaymentProduct(mappedPlan.productId) : null;
    const email = customerEmail(payment);
    const name = customerName(payment);
    const membershipReference = membershipId(payment);

    const adminNotificationInput = {
      eventType: "checkout_complete_fallback",
      customerEmail: email,
      customerName: name,
      amountTotal: displayAmountInCents(paymentAmount(payment)),
      currency: paymentCurrency(payment),
      product: firstString(nestedObject(payment, "product").title, "whop"),
      productId: product?.id ?? mappedPlan?.productId ?? null,
      productName: product?.name ?? firstString(nestedObject(payment, "product").title) ?? null,
      billing: mappedPlan?.billing ?? null,
      billingReason: paymentBillingReason(payment),
      credits: product ? creditsForProduct(product, mappedPlan?.billing ?? "monthly") : null,
      sessionId: "checkout_complete_fallback",
      subscriptionId: membershipReference,
      paymentIntentId: resolvedPaymentId,
      status: paymentStatus(payment) || paymentSubstatus(payment)
    };

    if (!mappedPlan || !product) {
      const adminNotification = await sendAdminPaymentNotificationEmail(adminNotificationInput);
      return Response.json({ ok: true, activated: false, reason: "whop_plan_not_mapped", planId, adminNotification });
    }

    const activationDecision = shouldAddCredits(product, mappedPlan.billing, payment);
    if (!activationDecision.add) {
      const adminNotification = await sendAdminPaymentNotificationEmail(adminNotificationInput);
      return Response.json({ ok: true, activated: false, reason: activationDecision.reason, productId: product.id, adminNotification });
    }

    const credits = creditsForProduct(product, mappedPlan.billing);
    const activation = await addCredits({
      email,
      customerName: name,
      product,
      billing: mappedPlan.billing,
      credits,
      paymentId: resolvedPaymentId,
      membershipId: membershipReference
    });
    const isAlreadyProcessed = (activation as { reason?: string }).reason === "already_processed";
    const adminNotification = isAlreadyProcessed
      ? { skipped: true, reason: "Payment already processed; admin notification not repeated." }
      : await sendAdminPaymentNotificationEmail(adminNotificationInput);

    if (activation.activated) {
      await sendCreditActivationEmail({
        to: email,
        customerName: name,
        credits,
        note: `${product.name} activated after Whop payment verification.`,
        receiptReference: resolvedPaymentId,
        invoiceReference: membershipReference || null,
        newBalance: typeof activation.balance?.balance === "number" ? activation.balance.balance : null
      });
    }

    return Response.json({ ok: true, ...activation, productId: product.id, billing: mappedPlan.billing, credits, adminNotification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop payment reconciliation failed.";
    return Response.json({ ok: false, reason: "reconcile_failed", error: message }, { status: 400 });
  }
}
