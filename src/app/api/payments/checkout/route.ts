import { findPaymentProduct } from "@/lib/data";
import { findConfiguredCreditProduct, normalizePackageConfig, PACKAGE_CONFIG_KEY, paymentLinkForConfiguredCreditProduct } from "@/lib/package-config";
import { createLemonSqueezyCheckout, isLemonSqueezyEnabled, lemonVariantEnvForProduct, type BillingMode } from "@/lib/payment-provider";
import { supabaseAdmin } from "@/lib/supabase";
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

export async function POST(request: Request) {
  const body = await request.json();
  const productId = String(body.productId ?? body.packageId ?? body.package ?? "").trim();
  const billing = normalizeBilling(body.billing);
  const partnerCode = normalizePartnerCode(body.partnerCode ?? body.ref);
  const campaign = String(body.campaign ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const attribution = typeof body.attribution === "object" && body.attribution ? body.attribution as Record<string, unknown> : {};
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
    const configuredDirectUrl = configuredProduct ? paymentLinkForConfiguredCreditProduct(configuredProduct, effectiveBilling).trim() : "";
    const previewPolicy = whopPreviewSummary(product, effectiveBilling);
    const previewNote = whopPreviewNotice(product, effectiveBilling);

    if (configuredDirectUrl) {
      return Response.json({
        url: configuredDirectUrl,
        mode: checkoutMode,
        product: product.name,
        provider: "configured_direct_checkout",
        directCheckoutUrl: true,
        manualActivation: true,
        previewPolicy,
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
      return Response.json({
        url: whopCheckoutPath(whopPlanId, returnUrl, { partnerCode, campaign, adAttribution }),
        mode: checkoutMode,
        product: product.name,
        provider: "whop",
        whopPlanId,
        manualActivation: true,
        previewPolicy,
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

    return Response.json({
      url: checkout.url,
      mode: checkoutMode,
      product: product.name,
      provider: "lemon_squeezy",
      manualActivation: checkout.manualActivation,
      note: checkout.note
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment checkout could not start.";
    return Response.json({ error: message }, { status: 500 });
  }
}
