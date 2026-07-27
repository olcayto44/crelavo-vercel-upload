export const realProductionE2EChecklist = {
  status: "manual_live_e2e_required",
  title: "Real payment → credit → production → delivery E2E",
  orderedSteps: [
    "Complete a real Whop checkout with a confirmed test user and matching account email.",
    "Verify Whop webhook signature, event idempotency, preview activation and subscription mapping.",
    "Confirm credits are loaded or entitlement is reconciled from server-side payment records only.",
    "Start one credit-gated production and verify credit reserve before provider spend.",
    "Run one launch-critical provider job and record provider job id, polling status and output URL.",
    "Confirm final output appears in dashboard delivery with preview/download rules respected.",
    "Confirm customer receipt, production-ready email and admin notification are sent.",
    "Force one provider failure and confirm credits/retry/support messaging remain safe."
  ],
  successDefinition: "Do not mark launch production ready until payment, webhook, credit reserve/spend, provider output, dashboard delivery and email notification all pass in one real E2E chain."
};

export const publicPlaceholderH1Audit = {
  status: "scan_required_before_public_launch",
  targets: ["awaiting", "placeholder", "lorem", "approved customer logo", "approved brand story", "TODO", "Coming soon"],
  rules: [
    "Public buyer-facing pages should not show implementation placeholders, fake customer proof or unapproved brand/logo stories.",
    "Each public page template should render exactly one primary H1 for SEO clarity.",
    "Admin/internal input placeholders may remain if they are form helper text, not public claims.",
    "Any customer logo, testimonial, case study or performance metric must have written approval and verified source data."
  ],
  remediation: "Replace public placeholders with honest preview-mode wording or remove the proof block until real assets are approved."
};

export const referralRewardAutomationGuard = {
  status: "review_gated_before_auto_credit",
  rewardRules: [
    "+100 credits for inviter and invited user only after verified signup review.",
    "+2,000 bonus credits only after invited user becomes a paid Business/Team subscriber and payment is not refunded/cancelled.",
    "Partner/affiliate commission stays finance-reviewed with hold, refund and chargeback checks."
  ],
  abuseControls: [
    "Block self-referral by same user id, email, payment account or obvious account family.",
    "Flag duplicate account, disposable email, repeated IP/device and suspicious signup clusters.",
    "Use Whop payment idempotency keys before any paid-upgrade reward.",
    "Cap automatic rewards per user/week until fraud signals are proven."
  ],
  guardrail: "Referral rewards can be tracked now, but credit release must stay server-side and review-gated until attribution and abuse controls pass live E2E."
};

export const couponHuntCampaignGuard = {
  status: "only_show_when_real_whop_code_live",
  requiredBeforePublicVisibility: [
    "Create a real Whop promo code with exact discount, duration, redemption limit and eligible products.",
    "Store the active campaign window and code metadata server-side, not only in frontend copy.",
    "Confirm code works in Whop checkout and cannot stack beyond margin limits.",
    "Add abuse controls for repeated claims, suspicious IP/device patterns and coupon scraping.",
    "Hide public coupon hunt prompts when no live Whop promo code exists."
  ],
  publicCopyGuard: "Coupon hunt copy must say only what is true for the live code. No fake hidden discount, fake countdown, fake scarcity or guaranteed coupon claim."
};
