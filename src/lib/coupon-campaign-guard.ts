export const couponCampaignVisibilityGuard = {
  status: "hidden_until_real_whop_code_verified",
  publicVisibilityRule: "Show coupon hunt copy only when a real Whop promo code, active campaign window, redemption limit and eligible product list are verified server-side.",
  requiredServerFields: ["code", "whopPromoCodeId", "startsAt", "endsAt", "redemptionLimit", "eligibleProductIds", "stackingRule", "abuseGuard"],
  abuseSignals: ["repeated claims", "same IP/device claim cluster", "coupon scraping pattern", "checkout mismatch", "code not accepted by Whop"],
  fallbackCopy: "Preview available — no hidden discount is promised unless a live Whop promo code is active."
};

export function normalizeCouponCampaign(input: Record<string, unknown>) {
  const code = String(input.code ?? input.promoCode ?? input.promo_code ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
  const whopPromoCodeId = String(input.whopPromoCodeId ?? input.whop_promo_code_id ?? "").trim().slice(0, 120);
  const startsAt = String(input.startsAt ?? input.starts_at ?? "").trim();
  const endsAt = String(input.endsAt ?? input.ends_at ?? "").trim();
  const redemptionLimit = Math.max(0, Math.floor(Number(input.redemptionLimit ?? input.redemption_limit ?? 0)) || 0);
  const eligibleProductIds = Array.isArray(input.eligibleProductIds) ? input.eligibleProductIds.map((item) => String(item).trim()).filter(Boolean).slice(0, 20) : [];
  const active = Boolean(code && whopPromoCodeId && startsAt && endsAt && redemptionLimit > 0 && eligibleProductIds.length > 0);
  return {
    code,
    whopPromoCodeId,
    startsAt,
    endsAt,
    redemptionLimit,
    eligibleProductIds,
    active,
    visibility: active ? "public_coupon_hunt_allowed" : couponCampaignVisibilityGuard.status,
    abuseGuard: "coupon_claim_ip_device_redemption_limit_whop_code_required"
  };
}
