export const couponCampaignVisibilityGuard = {
  status: "hidden_until_real_whop_code_verified",
  publicVisibilityRule: "Show coupon hunt copy only when a real Whop promo code, active campaign window, redemption limit and eligible product list are verified server-side.",
  requiredServerFields: ["code", "whopPromoCodeId", "startsAt", "endsAt", "redemptionLimit", "eligibleProductIds", "stackingRule", "marginCheck", "claimFingerprint", "checkoutVerificationStatus", "abuseGuard"],
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
  const stackingRule = String(input.stackingRule ?? input.stacking_rule ?? "no_stacking_without_margin_review").trim().slice(0, 120);
  const marginCheck = String(input.marginCheck ?? input.margin_check ?? "margin_review_required").trim().slice(0, 120);
  const claimFingerprint = String(input.claimFingerprint ?? input.claim_fingerprint ?? "").trim().slice(0, 180);
  const checkoutVerificationStatus = String(input.checkoutVerificationStatus ?? input.checkout_verification_status ?? "pending_whop_checkout_verification").trim().slice(0, 120);
  const active = Boolean(code && whopPromoCodeId && startsAt && endsAt && redemptionLimit > 0 && eligibleProductIds.length > 0 && checkoutVerificationStatus === "verified_in_whop_checkout");
  return {
    code,
    whopPromoCodeId,
    startsAt,
    endsAt,
    redemptionLimit,
    eligibleProductIds,
    stackingRule,
    marginCheck,
    claimFingerprint,
    checkoutVerificationStatus,
    active,
    visibility: active ? "public_coupon_hunt_allowed" : couponCampaignVisibilityGuard.status,
    abuseGuard: "coupon_claim_ip_device_redemption_limit_whop_code_required"
  };
}
