export const cloudflareWafFinalChecks = {
  status: "manual_required_before_paid_traffic",
  requiredEnv: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
  optionalEnv: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_WAF_RULESET_ID", "CLOUDFLARE_RATE_LIMIT_RULESET_ID", "TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
  protectedRoutes: ["/admin", "/auth", "/api/payments", "/api/leads", "/api/webhooks", "/api/automation", "/api/lip-sync", "/api/productions", "/api/providers"],
  manualValidation: [
    "Confirm crelavo.com DNS is proxied through Cloudflare and SSL mode is valid.",
    "Enable WAF rules for admin, auth, payment, lead capture, webhook and provider callback endpoints.",
    "Enable edge rate limits that complement in-app route/IP guards.",
    "Run one blocked invalid webhook/payment request and verify it appears in Cloudflare logs.",
    "Run one allowed Whop checkout/provider callback path and verify normal traffic is not blocked.",
    "Confirm Turnstile is ready for public forms before paid traffic if bot traffic increases."
  ],
  guardrail: "Cloudflare readiness is not complete just because env keys exist; DNS/SSL/WAF/log validation must be manually confirmed before paid traffic."
};

export const providerLiveVerificationChecks = {
  status: "connected_pending_real_production_e2e",
  providerGroups: ["OpenAI", "selected video provider", "image provider", "ElevenLabs", "HeyGen", "Stable Audio/Mubert", "Shotstack", "Resend", "Whop", "Cloudflare"],
  liveVerification: [
    "Run provider readiness endpoint without exposing secrets.",
    "Run the matching admin provider test for each launch-critical provider.",
    "Run one low-cost real provider output for sold media types only.",
    "Verify job id, status polling, output URL, dashboard delivery and email notification.",
    "Verify failed provider jobs resolve credits safely and do not silently claim success.",
    "Keep real production job E2E as open until payment -> credit reserve/spend -> provider output -> delivery -> notification is proven."
  ],
  guardrail: "Provider API keys being present is not the same as real production E2E. Do not claim live production readiness until a real paid/credit-gated job completes end to end."
};
