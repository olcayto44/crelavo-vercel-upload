import type { BillingMode } from "@/lib/payment-provider";

export const whopReturnPath = "/checkout/complete";

export const whopPlanIds: Record<string, Partial<Record<BillingMode, string>>> = {
  growth_intelligence_enterprise: { monthly: "plan_ZnbxWuOwrrFwh" },
  growth_intelligence_growth: { monthly: "plan_BCGKWVCrRakWc" },
  growth_intelligence_starter: { monthly: "plan_FlOEa6urAuKEx", yearly: "plan_5l0pLPgYyV1Zu" },
  autonomous_brand_agent: { monthly: "plan_G2ZGmpykTfRIE" },
  live_commerce_stream_pack: { monthly: "plan_7xBXQaBb9w0tw" },
  live_sales_agent_starter: { monthly: "plan_sw8N3lkTKH1N0", yearly: "plan_vDBBqvR8dpO9f" },
  drone_satellite_story: { one_time: "plan_ENiXR71BMaqB2" },
  drone_location_video: { one_time: "plan_Sm0chNhnmVKBG" },
  topup_business: { one_time: "plan_kkn9PeDilHc1q" },
  topup_creator: { one_time: "plan_Q0fJdHNnKGPd6" },
  topup_starter: { one_time: "plan_kmGVCrQu90NBV" },
  ultra: { monthly: "plan_UtIprGEXNEooK", yearly: "plan_apVKry7XkvOky" },
  team: { monthly: "plan_rkeOQU3gjmujh", yearly: "plan_jSBaM1LgMuaNL" },
  business: { monthly: "plan_DTxjYMeiRPBWz", yearly: "plan_R3OSfDLVHI9zi" },
  pro: { monthly: "plan_ECfkkMySZHtIZ", yearly: "plan_A9zegHpbjxAfO" }
};

export function whopPlanIdForProduct(productId: string, billing: BillingMode) {
  return whopPlanIds[productId]?.[billing] ?? "";
}

export function hasWhopPlan(productId: string, billing: BillingMode) {
  return Boolean(whopPlanIdForProduct(productId, billing));
}

export function whopCheckoutPath(planId: string, returnUrl: string) {
  const params = new URLSearchParams({ planId, returnUrl });
  return `/checkout/whop?${params.toString()}`;
}

export function whopProductForPlanId(planId: string) {
  const normalizedPlanId = planId.trim();
  if (!normalizedPlanId) return null;

  for (const [productId, plans] of Object.entries(whopPlanIds)) {
    for (const [billing, mappedPlanId] of Object.entries(plans) as Array<[BillingMode, string]>) {
      if (mappedPlanId === normalizedPlanId) {
        return { productId, billing, planId: mappedPlanId };
      }
    }
  }

  return null;
}
