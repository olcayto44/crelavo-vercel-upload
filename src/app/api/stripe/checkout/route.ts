import { findPaymentProduct, stripePriceEnvForPaymentProduct } from "@/lib/data";
import { findConfiguredCreditProduct, normalizePackageConfig, PACKAGE_CONFIG_KEY, paymentLinkForConfiguredCreditProduct, stripePriceEnvForConfiguredCreditProduct } from "@/lib/package-config";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

type BillingMode = "monthly" | "yearly" | "one_time";

function normalizeBilling(value: unknown): BillingMode {
  if (value === "yearly") return "yearly";
  if (value === "one_time") return "one_time";
  return "monthly";
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
  const legacyPriceId = String(body.priceId ?? "").trim();

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
    const effectiveBilling = product?.planType === "topup" || product?.planType === "production_one_time" ? "one_time" : product?.planType === "service_subscription" ? "monthly" : billing;
    const paymentLinkUrl = configuredProduct ? paymentLinkForConfiguredCreditProduct(configuredProduct, effectiveBilling) : "";

    if (paymentLinkUrl) {
      return Response.json({
        url: paymentLinkUrl,
        mode: product?.planType === "subscription" || product?.planType === "service_subscription" ? "subscription" : "payment",
        product: product?.name ?? null,
        paymentLink: true,
        manualActivation: true,
        note: product?.planType === "service_subscription" || product?.planType === "production_one_time" ? "Stripe Payment Link is configured. Admin should verify the service/package payment without adding normal credits." : "Stripe Payment Link is configured. Credits should be activated from admin review after Stripe payment confirmation."
      });
    }

    const priceEnv = configuredProduct
      ? stripePriceEnvForConfiguredCreditProduct(configuredProduct, effectiveBilling)
      : legacyProduct
        ? stripePriceEnvForPaymentProduct(legacyProduct, effectiveBilling)
        : "";
    const resolvedPriceId = priceEnv ? String(process.env[priceEnv] ?? "").trim() : legacyPriceId;

    if (!resolvedPriceId) {
      return Response.json({ error: product ? `Stripe price ID is not configured for ${product.name}. Missing env: ${priceEnv}` : "Missing priceId or productId" }, { status: 400 });
    }

    const isServicePlan = product?.planType === "service_subscription";
    const isProductionPackage = product?.planType === "production_one_time";
    const serviceCategory = serviceCategoryForProduct(product);
    const isGrowthService = isServicePlan && serviceCategory === "growth_intelligence";
    const isLiveSalesService = isServicePlan && serviceCategory === "live_sales_agent";
    const checkoutMode = product?.planType === "subscription" || isServicePlan ? "subscription" : "payment";
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";
    const successPath = isGrowthService ? "/growth-intelligence?subscription=success" : isLiveSalesService ? "/live-sales-credits?subscription=success" : isServicePlan ? "/dashboard?subscription=success" : isProductionPackage ? "/drone-credits?success=true" : checkoutMode === "subscription" ? "/dashboard/credits?subscription=success" : "/dashboard/credits?success=true";
    const cancelPath = isGrowthService ? "/growth-intelligence?subscription=cancelled" : isLiveSalesService ? "/live-sales-credits?subscription=cancelled" : isServicePlan ? "/dashboard?subscription=cancelled" : isProductionPackage ? "/drone-credits?cancelled=true" : checkoutMode === "subscription" ? "/dashboard/credits?subscription=cancelled" : "/dashboard/credits?cancelled=true";
    const metadataProductType = isGrowthService ? "growth_intelligence_service_plan" : isLiveSalesService ? "live_sales_service_plan" : isServicePlan ? "service_subscription" : isProductionPackage ? "drone_production_package" : product?.planType === "topup" ? "credit_topup" : "credit_subscription";

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      customer_creation: checkoutMode === "payment" ? "always" : undefined,
      billing_address_collection: "auto",
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}${cancelPath}`,
      metadata: {
        product: metadataProductType,
        productId: product?.id ?? productId,
        productName: product?.name ?? "Legacy credit package",
        billing: effectiveBilling,
        credits: String(product?.credits ?? ""),
        priceEnv
      },
      subscription_data: checkoutMode === "subscription" ? {
        metadata: {
          product: metadataProductType,
          productId: product?.id ?? productId,
          productName: product?.name ?? "Credit subscription",
          billing: effectiveBilling,
          credits: String(product?.credits ?? "")
        }
      } : undefined,
      payment_intent_data: checkoutMode === "payment" ? {
        metadata: {
          product: metadataProductType,
          productId: product?.id ?? productId,
          productName: product?.name ?? "Credit package",
          billing: effectiveBilling,
          credits: String(product?.credits ?? "")
        }
      } : undefined
    });

    return Response.json({ url: session.url, mode: checkoutMode, product: product?.name ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe checkout could not start";
    return Response.json({ error: message }, { status: 500 });
  }
}
