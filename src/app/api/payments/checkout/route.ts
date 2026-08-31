import { normalizeCouponCampaign } from "@/lib/coupon-campaign-guard";
import { findPaymentProduct } from "@/lib/data";
import { findConfiguredCreditProduct, normalizePackageConfig, PACKAGE_CONFIG_KEY, paymentLinkForConfiguredCreditProduct } from "@/lib/package-config";
import { createLemonSqueezyCheckout, isLemonSqueezyEnabled, lemonVariantEnvForProduct, type BillingMode } from "@/lib/payment-provider";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { whopCheckoutPath, whopPlanIdForProduct, whopReturnPath } from "@/lib/whop";
import { whopPreviewNotice, whopPreviewSummary } from "@/lib/whop-preview-policy";
import { normalizePartnerCode } from "@/lib/partner-program";

function normalizeBilling(value: unknown): BillingMode {
  if (value === "yearly") return "yearly";
  if (value === "one_time") return "one_time";
  return "monthly";
}

function safeTrackingValue(value: unknown, maxLength = 180) {
  return String(value ?? "").trim().replace(/[^a-zA-Z0-9_./:?#=&%-]/g, "").slice(0, maxLength);
}

function cleanCheckoutEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase().slice(0, 180);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function serviceCategoryForProduct(product: unknown) {
  if (!product || typeof product !== "object") return "";
  const record = product as Record<string, unknown>;
  const explicitCategory = String(record.serviceCategory ?? "").trim();
  if (explicitCategory) return explicitCategory;

  const signature = `${String(record.id ?? "")} ${String(record.name ?? "")}`.toLowerCase();
  if (signature.includes("growth_intelligence") || signature.includes("growth intelligence") || signature.includes("intelligence agent")) return "growth_intelligence";
  if (signature.includes("live_sales") || signature.includes("live sales") || signature.includes("live commerce") || signature.includes("brand agent")) return "live_sales_agent";
  return "";
}

async function recordCheckoutIntent(input: {
  email: string;
  consent: boolean;
  productId: string;
  productName: string;
  billing: BillingMode;
  provider: string;
  checkoutUrl: string;
  campaign: string;
  pageUrl: unknown;
  referrer: unknown;
  attribution: Record<string, unknown>;
  sessionId?: string;
  userId?: string | null;
  couponCampaign?: ReturnType<typeof normalizeCouponCampaign>;
}) {
  const startedAt = new Date().toISOString();
  const { error: intentError } = await supabaseAdmin().from("checkout_intents").insert({
    user_id: input.userId ?? null,
    anonymous_id: input.sessionId || null,
    email: isEmail(input.email) ? input.email : null,
    provider: input.provider,
    product_id: input.productId,
    package_id: input.productId,
    billing_interval: input.billing,
    status: "started",
    checkout_url: input.checkoutUrl,
    campaign: input.campaign,
    started_at: startedAt,
    updated_at: startedAt
  });

  if (!input.consent || !isEmail(input.email)) return intentError ? { recorded: true, leadSkipped: true, reason: intentError.message } : { recorded: true, leadSkipped: true };

  const lead = {
    email: input.email,
    source: "checkout_intent",
    offer: `${input.productId}_${input.billing}_checkout_recovery`.slice(0, 160),
    status: "checkout_started",
    consent: true,
    bonus_credits: 0,
    landing_url: safeTrackingValue(input.attribution.landingUrl, 800),
    page_url: safeTrackingValue(input.pageUrl, 800),
    referrer: safeTrackingValue(input.referrer, 800),
    utm_source: safeTrackingValue(input.attribution.utmSource, 200),
    utm_medium: safeTrackingValue(input.attribution.utmMedium, 200),
    utm_campaign: safeTrackingValue(input.attribution.utmCampaign || input.campaign, 240),
    utm_term: safeTrackingValue(input.attribution.utmTerm, 240),
    utm_content: safeTrackingValue(input.attribution.utmContent, 240),
    ref: safeTrackingValue(input.attribution.ref, 240),
    fbclid: safeTrackingValue(input.attribution.fbclid, 500),
    gclid: safeTrackingValue(input.attribution.gclid, 500),
    gbraid: safeTrackingValue(input.attribution.gbraid, 500),
    wbraid: safeTrackingValue(input.attribution.wbraid, 500),
      metadata: {
        productId: input.productId,
        productName: input.productName,
        billing: input.billing,
        provider: input.provider,
        checkoutUrl: input.checkoutUrl,
        checkoutStartedAt: new Date().toISOString(),
        recoveryPolicy: "Send one abandoned checkout email after about 1 hour only if no Whop payment/subscription completion exists; no fake saved bonus or guaranteed discount.",
        previewReminderPolicy: "For 24-hour previews, send a trust reminder near hour 23 or around 3 hours before the main subscription starts when provider timing allows.",
        couponCampaignVisibility: input.couponCampaign?.visibility ?? "hidden_until_real_whop_code_verified",
        couponCheckoutVerificationStatus: input.couponCampaign?.checkoutVerificationStatus ?? "pending_whop_checkout_verification",
        couponMarginCheck: input.couponCampaign?.marginCheck ?? "margin_review_required",
        couponStackingRule: input.couponCampaign?.stackingRule ?? "no_stacking_without_margin_review",
        couponClaimFingerprint: input.couponCampaign?.claimFingerprint || null,
        couponAbuseGuard: input.couponCampaign?.abuseGuard ?? "coupon_claim_ip_device_redemption_limit_whop_code_required"
      }

  };

  const { error } = await supabaseAdmin().from("lead_captures").upsert(lead, { onConflict: "email,source" });
  if (error) return { skipped: true, reason: error.message };
  return { recorded: true };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const productId = String(body.productId ?? body.packageId ?? body.package ?? "").trim();
  const billing = normalizeBilling(body.billing);
  const partnerCode = normalizePartnerCode(body.partnerCode ?? body.ref);
  const campaign = String(body.campaign ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const couponCampaign = normalizeCouponCampaign(typeof body.couponCampaign === "object" && body.couponCampaign ? body.couponCampaign as Record<string, unknown> : {});
  const attribution = typeof body.attribution === "object" && body.attribution ? body.attribution as Record<string, unknown> : {};
  const token = bearerTokenFromRequest(request);
  const authUser = token ? (await supabaseAdmin().auth.getUser(token).catch(() => ({ data: { user: null } }))).data.user : null;
  const sessionId = safeTrackingValue(body.sessionId, 160);
  const adAttribution = {
    utmSource: safeTrackingValue(attribution.utmSource, 80),
    utmMedium: safeTrackingValue(attribution.utmMedium, 80),
    utmCampaign: safeTrackingValue(attribution.utmCampaign || campaign, 100),
    utmTerm: safeTrackingValue(attribution.utmTerm, 120),
    utmContent: safeTrackingValue(attribution.utmContent, 120),
    fbclid: safeTrackingValue(attribution.fbclid, 220),
    gclid: safeTrackingValue(attribution.gclid, 220),
    gbraid: safeTrackingValue(attribution.gbraid, 220),
    wbraid: safeTrackingValue(attribution.wbraid, 220),
    firstTouchPath: safeTrackingValue(attribution.firstTouchPath, 220)
  };

  try {
    const { data: packageConfigRow } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", PACKAGE_CONFIG_KEY)
      .maybeSingle();
    const packageConfig = normalizePackageConfig(packageConfigRow?.value);
    const configuredProduct = productId ? findConfiguredCreditProduct(packageConfig, productId) : null;
    const legacyProduct = productId ? findPaymentProduct(productId) : null;
    const product = configuredProduct ?? legacyProduct;

    if (!product) {
      return Response.json({ error: "Payment product was not found." }, { status: 400 });
    }

    const effectiveBilling: BillingMode = product.planType === "topup" || product.planType === "production_one_time" ? "one_time" : billing;
    const isServicePlan = product.planType === "service_subscription";
    const isProductionPackage = product.planType === "production_one_time";
    const serviceCategory = serviceCategoryForProduct(product);
    const isGrowthService = isServicePlan && serviceCategory === "growth_intelligence";
    const isLiveSalesService = isServicePlan && serviceCategory === "live_sales_agent";
    const isDronePackage = serviceCategory === "drone_video";
    const checkoutMode = product.planType === "subscription" || isServicePlan ? "subscription" : "payment";
    const successPath = isGrowthService ? "/growth-intelligence?subscription=success" : isLiveSalesService ? "/live-sales-credits?subscription=success" : isServicePlan ? "/dashboard?subscription=success" : isProductionPackage || isDronePackage ? "/drone-credits?success=true" : checkoutMode === "subscription" ? "/dashboard/credits?subscription=success" : "/dashboard/credits?success=true";
    const cancelPath = isGrowthService ? "/growth-intelligence?subscription=cancelled" : isLiveSalesService ? "/live-sales-credits?subscription=cancelled" : isServicePlan ? "/dashboard?subscription=cancelled" : isProductionPackage || isDronePackage ? "/drone-credits?cancelled=true" : checkoutMode === "subscription" ? "/dashboard/credits?subscription=cancelled" : "/dashboard/credits?cancelled=true";
    const productType = isGrowthService ? "growth_intelligence_service_plan" : isLiveSalesService ? "live_sales_service_plan" : isServicePlan ? "service_subscription" : isProductionPackage || isDronePackage ? "drone_production_package" : product.planType === "topup" ? "credit_topup" : "credit_subscription";
    const checkoutEmail = cleanCheckoutEmail(body.checkoutEmail ?? body.email);
    const consentRecovery = body.consentRecovery === true;
    const configuredDirectUrl = configuredProduct ? paymentLinkForConfiguredCreditProduct(configuredProduct, effectiveBilling).trim() : "";
    const previewPolicy = whopPreviewSummary(product, effectiveBilling);
    const previewNote = whopPreviewNotice(product, effectiveBilling);

    if (configuredDirectUrl) {
      const checkoutIntentResult = await recordCheckoutIntent({ email: checkoutEmail, consent: consentRecovery, productId: product.id, productName: product.name, billing: effectiveBilling, provider: "configured_direct_checkout", checkoutUrl: configuredDirectUrl, campaign, pageUrl: body.pageUrl, referrer: body.referrer, attribution, sessionId, userId: authUser?.id ?? null, couponCampaign }).catch((error) => ({ skipped: true, reason: error instanceof Error ? error.message : "Checkout intent could not be recorded." }));
      return Response.json({
        url: configuredDirectUrl,
        mode: checkoutMode,
        product: product.name,
        provider: "configured_direct_checkout",
        directCheckoutUrl: true,
        manualActivation: true,
        previewPolicy,
        checkoutIntentResult,
        note: previewNote || "Configured direct checkout URL is active. Admin should reconcile the payment provider order/subscription before activating credits or service access."
      });
    }

    const whopPlanId = whopPlanIdForProduct(product.id, effectiveBilling);
    const paymentProvider = String(process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase();
    const whopEnabled = paymentProvider === "whop";
    if (whopEnabled) {
      if (!whopPlanId) {
        return Response.json({ error: `Whop plan ID is not configured for ${product.name} (${effectiveBilling}).` }, { status: 400 });
      }
      const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin || "https://www.crelavo.com";
      const returnUrl = new URL(whopReturnPath, origin).toString();
      const checkoutUrl = whopCheckoutPath(whopPlanId, returnUrl, { partnerCode, campaign, adAttribution });
      const checkoutIntentResult = await recordCheckoutIntent({ email: checkoutEmail, consent: consentRecovery, productId: product.id, productName: product.name, billing: effectiveBilling, provider: "whop", checkoutUrl, campaign, pageUrl: body.pageUrl, referrer: body.referrer, attribution, sessionId, userId: authUser?.id ?? null, couponCampaign }).catch((error) => ({ skipped: true, reason: error instanceof Error ? error.message : "Checkout intent could not be recorded." }));
      return Response.json({
        url: checkoutUrl,
        mode: checkoutMode,
        product: product.name,
        provider: "whop",
        whopPlanId,
        manualActivation: true,
        previewPolicy,
        checkoutIntentResult,
        note: previewNote || "Whop checkout is active. Crelavo should reconcile the Whop payment/subscription before activating credits or service access."
      });
    }

    if (!isLemonSqueezyEnabled()) {
      return Response.json({ error: "Payment provider is not set to Whop. Set PAYMENT_PROVIDER=whop before checkout." }, { status: 400 });
    }

    const checkout = await createLemonSqueezyCheckout({
      productId: product.id,
      productName: product.name,
      billing: effectiveBilling,
      checkoutMode,
      variantEnv: lemonVariantEnvForProduct(product.id, effectiveBilling),
      credits: product.credits,
      productType,
      successPath,
      cancelPath
    });

    if ("error" in checkout) {
      return Response.json({ error: checkout.error }, { status: checkout.status });
    }

    const checkoutIntentResult = await recordCheckoutIntent({ email: checkoutEmail, consent: consentRecovery, productId: product.id, productName: product.name, billing: effectiveBilling, provider: "lemon_squeezy", checkoutUrl: checkout.url, campaign, pageUrl: body.pageUrl, referrer: body.referrer, attribution, sessionId, userId: authUser?.id ?? null, couponCampaign }).catch((error) => ({ skipped: true, reason: error instanceof Error ? error.message : "Checkout intent could not be recorded." }));

    return Response.json({
      url: checkout.url,
      mode: checkoutMode,
      product: product.name,
      provider: "lemon_squeezy",
      manualActivation: checkout.manualActivation,
      checkoutIntentResult,
      note: checkout.note
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment checkout could not start.";
    return Response.json({ error: message }, { status: 500 });
  }
}
