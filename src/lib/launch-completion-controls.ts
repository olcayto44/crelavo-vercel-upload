export const liveTestFixIntake = {
  status: "waiting_for_user_live_test_results",
  title: "Live test result → fix intake",
  requiredReportFields: ["tested account email", "payment/provider/test path", "expected result", "actual result", "screenshot or error text", "production_id or webhook/event id when available"],
  triageOrder: [
    "Classify the failure as payment/webhook, credit ledger, production state, provider job, dashboard delivery, email notification, public page copy or growth/reward abuse.",
    "Reproduce safely with dry-run or controlled test path before touching production-sensitive code.",
    "Patch the smallest server-side guard or UI state that fixes the real failure.",
    "Run smoke/build plus the closest route-specific smoke before commit.",
    "Report whether the issue is code-fixed, needs external provider/Whop/Cloudflare action, or needs another live retest."
  ],
  guardrail: "Do not claim a live issue is fixed until the user-provided failing path is reproduced or clearly mapped to an external provider/manual action."
};

export const mvpApiSeparation = {
  status: "separated_from_launch_guard_work",
  launchCriticalNow: ["Whop payment/webhook", "credit reserve/spend", "production state", "selected media providers", "dashboard delivery", "email notification", "Cloudflare/WAF", "public copy safety"],
  mvpApiLater: ["AI Ad Performance Score Checker API", "AI Virtual Model Studio API", "AI Cultural Localization API", "AI Campaign Calendar API", "Crelavo Academy API", "Community Showcase API", "Long Video Highlight Automation API", "24/7 AI live sales avatar", "human-image UGC/avatar sales module", "AI Drone-Style Video production module"],
  rule: "MVP feature APIs are a separate next integration track; they should not block the core launch E2E unless they are sold as active production deliverables."
};

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
  gapClosureFields: ["whop_event_id", "credit_ledger_entry", "production_id", "provider_job_id", "delivery_url", "customer_email_status", "forced_failure_result", "external_action_owner"],
  blockedStateRule: "Any missing Whop event, credit ledger entry, provider job id, delivery URL, email state or forced-failure result must stay visible as an E2E gap instead of being called done.",
  successDefinition: "Do not mark launch production ready until payment, webhook, credit reserve/spend, provider output, dashboard delivery and email notification all pass in one real E2E chain."
};

export const publicPlaceholderH1Audit = {
  status: "scan_required_before_public_launch",
  targets: ["awaiting", "placeholder", "lorem", "approved customer logo", "approved brand story", "TODO", "Coming soon"],
  publicPageScope: ["app public routes", "products", "tools", "free-tools", "alternatives", "blog", "pricing", "whop-billing", "checkout", "landing and launch pages"],
  allowedInternalScope: ["admin routes", "dashboard form placeholders", "developer delivery ZIP placeholders that tell customers what to replace"],
  rules: [
    "Public buyer-facing pages should not show implementation placeholders, fake customer proof or unapproved brand/logo stories.",
    "Each public page template should render exactly one primary H1 for SEO clarity.",
    "Admin/internal input placeholders may remain if they are form helper text, not public claims.",
    "Any customer logo, testimonial, case study or performance metric must have written approval and verified source data."
  ],
  scanWorkflow: [
    "Scan public route source for risky placeholder terms.",
    "Separate harmless form placeholder attributes from visible buyer-facing claims.",
    "Check page templates for a single primary h1 per rendered public page.",
    "Replace or remove fake proof language before launch."
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
  eventStates: ["click_tracked", "signup_review_pending", "purchase_review_pending", "commission_pending", "commission_approved", "commission_rejected", "credit_release_ready"],
  releaseChecklist: ["verified inviter", "verified invited user", "not self-referral", "no duplicate account cluster", "Whop event idempotency checked", "refund/chargeback window checked", "admin reviewer approved"],
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
  integrationFields: ["code", "whopPromoCodeId", "startsAt", "endsAt", "redemptionLimit", "eligibleProductIds", "stackingRule", "marginCheck", "claimFingerprint", "checkoutVerificationStatus"],
  checkoutGuard: "Checkout intent must carry coupon visibility and abuse metadata so public coupon hunt copy cannot drift from the real Whop promo code state.",
  publicCopyGuard: "Coupon hunt copy must say only what is true for the live code. No fake hidden discount, fake countdown, fake scarcity or guaranteed coupon claim."
};
