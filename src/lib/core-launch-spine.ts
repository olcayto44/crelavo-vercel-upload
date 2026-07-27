export const coreLaunchSpine = {
  status: "live_e2e_required_before_scale",
  components: [
    { key: "whop_payment_webhook", owner: "payment", check: "Whop checkout, webhook signature, duplicate event idempotency and subscription lifecycle are verified." },
    { key: "credit_reserve_spend", owner: "credits", check: "Credits are reserved before provider spend, spent only after accepted output, and safely released/refunded on failure." },
    { key: "production_state", owner: "production", check: "Production records move through queued/running/waiting_provider_config/delivered/failed states without false success claims." },
    { key: "selected_media_providers", owner: "providers", check: "Selected video/image/voice/avatar/music providers have low-cost live tests, polling and failure handling." },
    { key: "dashboard_delivery", owner: "delivery", check: "Final output, preview mode, download/source restrictions and revision/support state are visible in dashboard." },
    { key: "email_notification", owner: "email", check: "Customer receipt/status email and admin notification send only after real state changes." },
    { key: "cloudflare_waf", owner: "edge", check: "Cloudflare DNS, SSL, WAF, bot protection and allowed/blocked request logs are manually verified." },
    { key: "public_copy_safety", owner: "growth", check: "Public pages pass placeholder/H1/fake-proof audit before paid traffic." },
    { key: "referral_coupon_review", owner: "growth", check: "Referral rewards and coupon hunt campaigns stay review-gated until abuse, Whop idempotency and margin checks pass." }
  ],
  requiredEvidence: ["real_e2e_chain", "forced_failure_path", "provider_low_cost_success", "credit_release_or_refund_path", "referral_reward_review", "coupon_whop_code_verification"],
  rule: "Core launch is not ready just because code builds. It is ready only after this spine passes one real payment-to-delivery E2E and one forced-failure path."
};
