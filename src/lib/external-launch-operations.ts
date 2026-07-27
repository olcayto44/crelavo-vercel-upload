export const externalSubmissionTracker = {
  status: "manual_submission_required",
  ownerAction: "Submit manually from the prepared launch kit, then record the submission URL, listing URL, approval status and follow-up date.",
  channels: [
    { name: "Futurepedia", type: "AI directory", priority: "P1", requiredBeforeSubmit: ["public screenshots stable", "pricing/Whop preview wording checked", "one-line pitch ready"], trackingFields: ["submission_url", "listing_url", "approval_status", "required_edits", "follow_up_date"] },
    { name: "There’s An AI For That", type: "AI directory", priority: "P1", requiredBeforeSubmit: ["AI production studio category selected", "public URL pack ready", "no exaggerated proof claims"], trackingFields: ["submission_url", "listing_url", "category", "approval_status"] },
    { name: "Toolify / OpenTools / TopAI.tools", type: "AI directory bundle", priority: "P1", requiredBeforeSubmit: ["same short description", "same category set", "UTM source=directory"], trackingFields: ["directory_name", "submission_url", "listing_url", "status"] },
    { name: "Product Hunt", type: "major launch", priority: "P3", requiredBeforeSubmit: ["real Whop payment E2E passed", "production E2E passed", "support/cancel flow verified"], trackingFields: ["launch_date", "maker_profile", "assets", "hunter_or_self_launch", "status"] },
    { name: "Ben’s Bites / newsletters", type: "newsletter outreach", priority: "P2", requiredBeforeSubmit: ["short founder pitch", "AI-readable manifesto", "public proof guard checked"], trackingFields: ["contact", "pitch_url", "reply_status", "follow_up_date"] },
    { name: "Reddit / Quora / Indie Hackers / Hacker News", type: "community", priority: "P2-P3", requiredBeforeSubmit: ["community rules read", "feedback-first post", "no spam reposting"], trackingFields: ["community", "post_url", "rules_checked", "feedback_received", "next_action"] }
  ],
  guardrails: [
    "Do not mass-post the same promotional copy across communities.",
    "Do not claim real traction, revenue, customer logos or case study metrics without verified proof.",
    "Product Hunt and Hacker News wait until Whop/payment/provider E2E is verified.",
    "Use UTM tracking for every external post or listing."
  ]
};

export const externalApiAccountReadiness = {
  status: "external_account_or_permission_required",
  launchCritical: ["Whop", "selected video provider", "OpenAI", "ElevenLabs", "Resend", "Cloudflare", "Supabase service role"],
  optionalMvpIntegrations: [
    { name: "Shopify Admin API", use: "store/product import and ecommerce automation", requirement: "merchant app/admin token approval before live customer use" },
    { name: "WooCommerce REST API", use: "WooCommerce product import", requirement: "store-specific consumer key/secret" },
    { name: "Amazon Selling Partner API", use: "Amazon catalog/order/product workflow", requirement: "seller/developer approval and restricted data review" },
    { name: "Trendyol API", use: "Turkey marketplace product workflow", requirement: "seller API credentials" },
    { name: "TikTok Shop API", use: "shop/catalog/social commerce workflow", requirement: "app approval and shop authorization" },
    { name: "Meta Graph API", use: "ads/social export and analytics", requirement: "Meta app permissions and business verification where needed" },
    { name: "YouTube Data API", use: "video/channel publishing and analytics", requirement: "Google Cloud project, OAuth consent and quota" },
    { name: "TikTok Content Posting API", use: "TikTok publishing", requirement: "TikTok developer approval and content posting scope" },
    { name: "D-ID commercial terms", use: "talking avatar fallback", requirement: "commercial usage/watermark terms confirmed" },
    { name: "n8n workflow", use: "external automation/orchestration", requirement: "hosted n8n instance, webhook auth and secret storage" },
    { name: "Shotstack", use: "template render/final assembly", requirement: "API access and render cost test" }
  ],
  rule: "External API accounts and platform approvals are not code-complete tasks. Track them separately, and wire them only after credentials, permissions, terms and low-cost live tests are verified."
};
