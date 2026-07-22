import crypto from "node:crypto";
import { sendPaidAdConversions } from "@/lib/ad-conversions";
import { findPaymentProduct } from "@/lib/data";
import { sendAdminPaymentNotificationEmail, sendCreditActivationEmail, sendPaymentReceiptEmail } from "@/lib/payment-email";
import { business12000LaunchAffiliateCampaign, calculatePartnerCommission, normalizePartnerCode } from "@/lib/partner-program";
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

function nestedString(source: WhopObject, path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return "";
    current = (current as WhopObject)[key];
  }
  return clean(current);
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

function normalizeBase64(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return `${normalized}${padding}`;
}

function webhookSecretCandidates(secret: string) {
  const trimmed = secret.trim().replace(/^['\"]|['\"]$/g, "");
  const withoutPrefix = trimmed.startsWith("whsec_") ? trimmed.slice("whsec_".length) : trimmed;
  const candidates: Buffer[] = [];

  for (const value of [withoutPrefix, trimmed]) {
    if (!value) continue;
    try {
      const decoded = Buffer.from(normalizeBase64(value), "base64");
      if (decoded.length) candidates.push(decoded);
    } catch {
      // Ignore malformed base64 variants and keep the raw secret fallback below.
    }
  }

  candidates.push(Buffer.from(trimmed, "utf8"));
  return candidates;
}

function signatureCandidates(signatureHeader: string) {
  return signatureHeader
    .split(" ")
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== "v1");
}

function signatureBuffer(signature: string) {
  try {
    return Buffer.from(normalizeBase64(signature), "base64");
  } catch {
    return Buffer.alloc(0);
  }
}

function verifyWhopWebhook(body: string, request: Request) {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");
  const secret = process.env.WHOP_WEBHOOK_SECRET;

  if (!webhookId || !webhookTimestamp || !webhookSignature || !secret) return false;

  const timestamp = Number(webhookTimestamp);
  if (!Number.isFinite(timestamp)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestamp);
  if (ageSeconds > 60 * 5) return false;

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const signatures = signatureCandidates(webhookSignature.replace(/^v1,/, ""));

  for (const secretCandidate of webhookSecretCandidates(secret)) {
    const expected = crypto.createHmac("sha256", secretCandidate).update(signedContent).digest();
    for (const candidate of signatures) {
      const provided = signatureBuffer(candidate);
      if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) return true;
    }
  }

  return false;
}

function eventType(payload: WhopObject) {
  return firstString(payload.type, payload.event, nestedString(payload, ["meta", "event_type"]));
}

function eventData(payload: WhopObject) {
  const data = nestedObject(payload, "data");
  const object = nestedObject(data, "object");
  return Object.keys(object).length ? object : data;
}

function paymentFromPayload(payload: WhopObject) {
  const data = eventData(payload);
  const payment = nestedObject(data, "payment");
  return Object.keys(payment).length ? payment : data;
}

function paymentUser(payment: WhopObject) {
  return nestedObject(payment, "user");
}

function paymentMembership(payment: WhopObject) {
  return nestedObject(payment, "membership");
}

function paymentPlan(payment: WhopObject) {
  return nestedObject(payment, "plan");
}

function productTitle(payment: WhopObject) {
  return nestedString(payment, ["product", "title"]);
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

function paymentBillingReason(payment: WhopObject) {
  return firstString(payment.billing_reason, payment.billingReason);
}

function planIdFromPayment(payment: WhopObject) {
  return firstString(paymentPlan(payment).id, payment.plan_id, nestedString(payment, ["plan", "uid"]));
}

function customerEmail(payment: WhopObject) {
  const user = paymentUser(payment);
  return firstString(user.email, payment.email, payment.customer_email).toLowerCase();
}

function customerName(payment: WhopObject) {
  const user = paymentUser(payment);
  return firstString(user.name, payment.name, payment.customer_name);
}

function membershipId(payment: WhopObject) {
  const membership = paymentMembership(payment);
  return firstString(membership.id, payment.membership_id, nestedString(payment, ["member", "id"]));
}

function membershipStatus(payment: WhopObject) {
  return firstString(paymentMembership(payment).status, payment.membership_status);
}

function paymentTrackingValue(payment: WhopObject, key: string) {
  const metadata = nestedObject(payment, "metadata");
  const customFields = nestedObject(payment, "custom_fields");
  const checkout = nestedObject(payment, "checkout");
  const checkoutMetadata = nestedObject(checkout, "metadata");
  const membership = paymentMembership(payment);
  const membershipMetadata = nestedObject(membership, "metadata");
  return firstString(payment[key], metadata[key], customFields[key], checkoutMetadata[key], membershipMetadata[key]);
}

function paymentCampaign(payment: WhopObject) {
  return firstString(paymentTrackingValue(payment, "campaign"), paymentTrackingValue(payment, "utmCampaign"), paymentTrackingValue(payment, "utm_campaign"));
}

function paymentPartnerCode(payment: WhopObject) {
  const metadata = nestedObject(payment, "metadata");
  const customFields = nestedObject(payment, "custom_fields");
  const checkout = nestedObject(payment, "checkout");
  const checkoutMetadata = nestedObject(checkout, "metadata");
  const membership = paymentMembership(payment);
  const membershipMetadata = nestedObject(membership, "metadata");
  return normalizePartnerCode(firstString(
    payment.partner_code,
    payment.partnerCode,
    payment.ref,
    payment.referral_code,
    metadata.partner_code,
    metadata.partnerCode,
    metadata.ref,
    metadata.utm_ref,
    customFields.partner_code,
    customFields.ref,
    checkoutMetadata.partner_code,
    checkoutMetadata.ref,
    membershipMetadata.partner_code,
    membershipMetadata.ref
  ));
}

function expectedProductAmountUsd(product: Product, billing: string) {
  if (product.planType === "subscription" || product.planType === "service_subscription") {
    return billing === "yearly" ? product.priceUsd * 10 : product.priceUsd;
  }
  return product.priceUsd;
}

function inferWhopAmountUsd(amount: number | null, product: Product, billing: string) {
  if (amount === null) return 0;
  const expected = expectedProductAmountUsd(product, billing);
  const setupFee = "setupFeeUsd" in product && typeof product.setupFeeUsd === "number" ? product.setupFeeUsd : null;
  if (setupFee !== null && amount === setupFee * 100) return setupFee;
  if (amount === expected * 100) return expected;
  if (amount > 10000) return Number((amount / 100).toFixed(2));
  return Number(amount.toFixed(2));
}

async function recordPartnerCommissionFromPayment(input: { payment: WhopObject; product: Product; billing: string; paymentReference: string; customerEmail: string; status: string }) {
  const partnerCode = paymentPartnerCode(input.payment);
  if (!partnerCode) return { skipped: true, reason: "missing_partner_code" };
  if (!input.customerEmail) return { skipped: true, reason: "missing_customer_email" };
  const amountUsd = inferWhopAmountUsd(paymentAmount(input.payment), input.product, input.billing);
  if (amountUsd <= 0) return { skipped: true, reason: "non_positive_payment_amount" };

  const supabase = supabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("partner_commission_ledger")
    .select("id")
    .eq("payment_reference", input.paymentReference)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return { skipped: true, reason: "commission_already_recorded", commissionId: existing.id };

  const isBusiness12000Campaign = input.product.id === business12000LaunchAffiliateCampaign.packageId && amountUsd === business12000LaunchAffiliateCampaign.saleAmountUsd;
  const purchaseCategory = isBusiness12000Campaign ? "subscription campaign" : input.product.planType;
  const packageName = isBusiness12000Campaign ? business12000LaunchAffiliateCampaign.packageName : input.product.name;
  const commission = calculatePartnerCommission(amountUsd, purchaseCategory, packageName, input.status || "paid");
  if (commission.commissionUsd <= 0) return { skipped: true, reason: commission.eligibility };

  const payoutWindow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("partner_commission_ledger")
    .insert({
      partner_code: partnerCode,
      customer_email: input.customerEmail,
      purchase_category: purchaseCategory,
      package_name: packageName,
      purchase_amount: amountUsd,
      commission_percent: commission.percent,
      commission_amount: commission.commissionUsd,
      currency: paymentCurrency(input.payment).toUpperCase(),
      source: "whop_webhook",
      payment_reference: input.paymentReference,
      payout_status: "pending_review",
      payout_window: payoutWindow,
      admin_notes: `Auto-created from Whop webhook. Eligibility: ${commission.eligibility}${isBusiness12000Campaign ? "; special campaign=business-12000" : ""}`
    })
    .select("id,partner_code,commission_amount,payout_status")
    .single();
  if (error) throw error;

  await supabase.from("partner_referral_events").insert({
    partner_code: partnerCode,
    event_type: "purchase",
    email: input.customerEmail,
    ip_address: "whop_webhook",
    country: "Unknown",
    city: "Unknown",
    metadata: {
      source: "whop_webhook",
      productId: input.product.id,
      packageName,
      purchaseAmount: amountUsd,
      commissionPercent: commission.percent,
      commissionAmount: commission.commissionUsd,
      paymentReference: input.paymentReference,
      payoutWindow
    }
  });

  return { recorded: true, commission: data };
}

function conversionSourceUrl(payment: WhopObject) {
  return firstString(paymentTrackingValue(payment, "sourceUrl"), paymentTrackingValue(payment, "landingUrl"), process.env.NEXT_PUBLIC_APP_URL, "https://www.crelavo.com");
}

function creditsForProduct(product: Product, billing: string) {
  if (product.planType !== "subscription") return product.credits;
  if (billing === "yearly" && "yearlyCredits" in product && typeof product.yearlyCredits === "number") return product.yearlyCredits;
  return billing === "yearly" ? product.credits * 12 : product.credits;
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
  idempotencyKey: string;
  paymentId: string;
  membershipId: string;
}) {
  if (!input.email) return { activated: false, reason: "missing_customer_email" };

  const profile = await profileByEmail(input.email, input.customerName);
  if (!profile) return { activated: false, reason: "crelavo_user_not_found" };

  const supabase = supabaseAdmin();
  const { data: existingEvent, error: existingError } = await supabase
    .from("credit_events")
    .select("id")
    .eq("user_id", profile.id)
    .ilike("note", `%${input.idempotencyKey}%`)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEvent) return { activated: false, reason: "already_processed", profile };

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
    input.idempotencyKey,
    `package=${input.product.id}`,
    `billing=${input.billing}`,
    input.paymentId ? `whop_payment=${input.paymentId}` : "",
    input.membershipId ? `membership=${input.membershipId}` : ""
  ].filter(Boolean).join(" | ");

  const { error: eventError } = await supabase
    .from("credit_events")
    .insert({
      user_id: profile.id,
      type: "purchase",
      amount: input.credits,
      note
    });

  if (eventError) throw eventError;
  return { activated: true, profile, balance, creditsAdded: input.credits };
}

async function handlePaymentSucceeded(event: string, payment: WhopObject, webhookId: string) {
  const planId = planIdFromPayment(payment);
  const mappedPlan = whopProductForPlanId(planId);
  const product = mappedPlan ? findPaymentProduct(mappedPlan.productId) : null;
  const email = customerEmail(payment);
  const name = customerName(payment);
  const amount = paymentAmount(payment);
  const paymentReference = paymentId(payment) || webhookId;
  const membershipReference = membershipId(payment);
  const billingReason = paymentBillingReason(payment);
  const status = paymentStatus(payment) || membershipStatus(payment);

  const receiptEmailResult = await sendPaymentReceiptEmail({
    to: email,
    customerName: name,
    amountTotal: displayAmountInCents(amount),
    currency: paymentCurrency(payment),
    sessionId: paymentReference,
    paymentIntentId: paymentReference,
    receiptUrl: null
  });

  const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
    eventType: event,
    customerEmail: email,
    customerName: name,
    amountTotal: displayAmountInCents(amount),
    currency: paymentCurrency(payment),
    product: productTitle(payment) || "whop",
    productId: product?.id ?? mappedPlan?.productId ?? null,
    productName: product?.name ?? productTitle(payment) ?? null,
    billing: mappedPlan?.billing ?? null,
    billingReason,
    credits: product ? creditsForProduct(product, mappedPlan?.billing ?? "monthly") : null,
    sessionId: webhookId,
    subscriptionId: membershipReference,
    paymentIntentId: paymentReference,
    status
  });

  if (!mappedPlan || !product) {
    return { receiptEmailResult, adminPaymentNotificationResult, activation: { activated: false, reason: "whop_plan_not_mapped", planId } };
  }

  const partnerCommissionResult = await recordPartnerCommissionFromPayment({
    payment,
    product,
    billing: mappedPlan.billing,
    paymentReference,
    customerEmail: email,
    status: status || "paid"
  }).catch((error) => ({ skipped: true, reason: error instanceof Error ? error.message : "partner_commission_record_failed" }));

  const activationDecision = shouldAddCredits(product, mappedPlan.billing, payment);
  const amountUsd = inferWhopAmountUsd(amount, product, mappedPlan.billing);
  const adConversionEventName = activationDecision.add ? "business_paid" : activationDecision.reason === "preview_setup_payment_no_full_credits" ? "preview_paid" : null;
  const adConversionResult = adConversionEventName ? await sendPaidAdConversions({
    eventName: adConversionEventName,
    eventId: `whop:${paymentReference}:${adConversionEventName}`,
    valueUsd: amountUsd,
    currency: paymentCurrency(payment).toUpperCase(),
    email,
    productId: product.id,
    packageName: product.name,
    partnerCode: paymentPartnerCode(payment),
    campaign: paymentCampaign(payment),
    fbclid: paymentTrackingValue(payment, "fbclid"),
    gclid: paymentTrackingValue(payment, "gclid"),
    gbraid: paymentTrackingValue(payment, "gbraid"),
    wbraid: paymentTrackingValue(payment, "wbraid"),
    sourceUrl: conversionSourceUrl(payment)
  }) : [{ provider: "meta" as const, status: "not_configured" as const, detail: `skipped_${activationDecision.reason}` }, { provider: "google_ads" as const, status: "not_configured" as const, detail: `skipped_${activationDecision.reason}` }];

  if (!activationDecision.add) {
    return { receiptEmailResult, adminPaymentNotificationResult, partnerCommissionResult, adConversionResult, activation: { activated: false, reason: activationDecision.reason, productId: product.id } };
  }

  const credits = creditsForProduct(product, mappedPlan.billing);
  const activation = await addCredits({
    email,
    customerName: name,
    product,
    billing: mappedPlan.billing,
    credits,
    idempotencyKey: `whop:payment:${paymentReference}`,
    paymentId: paymentReference,
    membershipId: membershipReference
  });

  const creditActivationEmailResult = activation.activated
    ? await sendCreditActivationEmail({
        to: email,
        customerName: name,
        credits,
        note: `${product.name} activated after Whop payment confirmation.`,
        receiptReference: paymentReference,
        invoiceReference: membershipReference || null,
        newBalance: typeof activation.balance?.balance === "number" ? activation.balance.balance : null
      })
    : { skipped: true, reason: activation.reason };

  return { receiptEmailResult, adminPaymentNotificationResult, partnerCommissionResult, adConversionResult, activation, creditActivationEmailResult };
}

async function handleAttentionEvent(event: string, payment: WhopObject, webhookId: string) {
  const planId = planIdFromPayment(payment);
  const mappedPlan = whopProductForPlanId(planId);
  const product = mappedPlan ? findPaymentProduct(mappedPlan.productId) : null;

  return sendAdminPaymentNotificationEmail({
    eventType: event,
    customerEmail: customerEmail(payment),
    customerName: customerName(payment),
    amountTotal: displayAmountInCents(paymentAmount(payment)),
    currency: paymentCurrency(payment),
    product: productTitle(payment) || "whop",
    productId: product?.id ?? mappedPlan?.productId ?? null,
    productName: product?.name ?? productTitle(payment) ?? null,
    billing: mappedPlan?.billing ?? null,
    billingReason: paymentBillingReason(payment),
    credits: product?.credits ?? null,
    sessionId: webhookId,
    subscriptionId: membershipId(payment),
    paymentIntentId: paymentId(payment) || null,
    status: paymentStatus(payment) || membershipStatus(payment)
  });
}

export async function POST(request: Request) {
  const body = await request.text();

  if (!verifyWhopWebhook(body, request)) {
    return Response.json({ error: "Missing or invalid Whop webhook signature." }, { status: 400 });
  }

  try {
    const payload = JSON.parse(body) as WhopObject;
    const event = eventType(payload);
    const payment = paymentFromPayload(payload);
    const webhookId = request.headers.get("webhook-id") ?? paymentId(payment) ?? event;

    if (event === "payment.succeeded") {
      const result = await handlePaymentSucceeded(event, payment, webhookId);
      console.log("Whop payment succeeded", result);
      return Response.json({ received: true, result });
    }

    if (["payment.failed", "membership.deactivated", "refund.created", "dispute.created"].includes(event)) {
      const adminPaymentNotificationResult = await handleAttentionEvent(event, payment, webhookId);
      console.warn("Whop attention event", { event, adminPaymentNotificationResult });
      return Response.json({ received: true, adminPaymentNotificationResult });
    }

    if (event === "membership.activated") {
      const adminPaymentNotificationResult = await handleAttentionEvent(event, payment, webhookId);
      console.log("Whop membership activated", { event, adminPaymentNotificationResult });
      return Response.json({ received: true, adminPaymentNotificationResult });
    }

    return Response.json({ received: true, ignored: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Whop webhook error.";
    return Response.json({ error: message }, { status: 400 });
  }
}
