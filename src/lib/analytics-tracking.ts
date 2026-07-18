export type AnalyticsReadinessStatus = "ready" | "prepared" | "blocked";

export type TrackingEventDefinition = {
  eventName: string;
  funnelStage: "visit" | "activation" | "production" | "checkout" | "retention";
  trigger: string;
  requiredProperties: string[];
  destination: string;
  status: AnalyticsReadinessStatus;
  guardrail: string;
};

export type PaidTrafficChannelPlan = {
  channel: string;
  primaryGoal: string;
  utmSource: string;
  utmMedium: string;
  sampleCampaign: string;
  firstSafeAction: string;
  blockedUntil: string;
};

export const analyticsEnvVariables = [
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "NEXT_PUBLIC_TIKTOK_PIXEL_ID",
  "NEXT_PUBLIC_LINKEDIN_PARTNER_ID",
  "NEXT_PUBLIC_YANDEX_METRICA_ID",
  "NEXT_PUBLIC_ADS_DEBUG_MODE"
];

export const trackingEventDefinitions: TrackingEventDefinition[] = [
  {
    eventName: "page_view_attributed",
    funnelStage: "visit",
    trigger: "Every public page heartbeat stores path, referrer and first-touch UTM data.",
    requiredProperties: ["path", "url", "referrer", "utm_source", "utm_medium", "utm_campaign", "session_id"],
    destination: "Internal live visitor store now; GA/GTM/pixels only after env IDs are added.",
    status: "ready",
    guardrail: "Do not load third-party scripts when public pixel/env IDs are missing."
  },
  {
    eventName: "assistant_workspace_started",
    funnelStage: "activation",
    trigger: "User enters Assistant Workspace or starts a production intent flow.",
    requiredProperties: ["entry_path", "production_type", "utm_campaign", "ref"],
    destination: "Prepared event taxonomy for analytics dashboard and future ad conversions.",
    status: "prepared",
    guardrail: "Track intent only; do not start paid ads or real provider jobs from this event."
  },
  {
    eventName: "production_request_created",
    funnelStage: "production",
    trigger: "Production request is created from category, free tool, assistant or dashboard.",
    requiredProperties: ["production_type", "package_id", "credit_estimate", "source_path", "utm_source"],
    destination: "Future dashboard event stream; current production APIs remain source of truth.",
    status: "prepared",
    guardrail: "No real AI provider spend should be triggered by analytics collection."
  },
  {
    eventName: "social_content_planned",
    funnelStage: "retention",
    trigger: "User opens the social media / content automation flow or a repurposed launch asset.",
    requiredProperties: ["content_type", "platform", "campaign_goal", "utm_source", "ref"],
    destination: "Growth dashboard and content-loop reporting before any auto-publish integration.",
    status: "prepared",
    guardrail: "Social planning is allowed; auto-publishing waits for explicit user approval and later API setup."
  },
  {
    eventName: "partner_application_submitted",
    funnelStage: "retention",
    trigger: "A partner or creator submits the affiliate / partner application form.",
    requiredProperties: ["partner_code", "channel_type", "channel_url", "email", "utm_source"],
    destination: "Partner dashboard and manual review queue for approval and tracking.",
    status: "ready",
    guardrail: "No payout promise until Whop tracking, ledger logic and finance rules are confirmed."
  },
  {
    eventName: "checkout_started",
    funnelStage: "checkout",
    trigger: "User opens Whop checkout route or payment completion flow.",
    requiredProperties: ["provider", "package_id", "amount", "currency", "utm_campaign", "ref"],
    destination: "Whop attribution and future conversion analytics after real payment tests.",
    status: "blocked",
    guardrail: "Whop is active payment path; Lemon remains postponed. Real payment tests stay at the end of 1. Grup."
  },
  {
    eventName: "paid_conversion_verified",
    funnelStage: "checkout",
    trigger: "Whop webhook/reconciliation confirms a paid, non-refunded conversion.",
    requiredProperties: ["provider", "external_payment_id", "user_id", "package_id", "ref", "utm_source"],
    destination: "Revenue dashboard, partner commission review and ad ROAS review.",
    status: "blocked",
    guardrail: "Only after real Whop payment, credit and idempotency validation is complete."
  }
];

export const paidTrafficChannelPlan: PaidTrafficChannelPlan[] = [
  {
    channel: "Google Search / Performance Max",
    primaryGoal: "Capture high-intent searches for AI website/app/video production.",
    utmSource: "google",
    utmMedium: "cpc",
    sampleCampaign: "crelavo_launch_search",
    firstSafeAction: "Prepare conversion names and UTM URLs; do not spend yet.",
    blockedUntil: "Final Whop payment and credit/idempotency tests pass."
  },
  {
    channel: "Meta / Instagram",
    primaryGoal: "Retarget visitors and test product-video / website-before-after demos.",
    utmSource: "meta",
    utmMedium: "paid_social",
    sampleCampaign: "crelavo_launch_retargeting",
    firstSafeAction: "Prepare pixel ID slot and campaign naming convention.",
    blockedUntil: "Meta pixel/env IDs and final payment attribution are verified."
  },
  {
    channel: "TikTok",
    primaryGoal: "Short demo traffic from AI/no-code/ecommerce creator videos.",
    utmSource: "tiktok",
    utmMedium: "paid_social",
    sampleCampaign: "crelavo_short_demo_test",
    firstSafeAction: "Prepare UTMs for Spark-style manual posts and creator links.",
    blockedUntil: "Manual organic proof and Whop conversion path are validated."
  },
  {
    channel: "LinkedIn",
    primaryGoal: "Agency, SaaS founder and ecommerce operator lead tests.",
    utmSource: "linkedin",
    utmMedium: "paid_social",
    sampleCampaign: "crelavo_b2b_founder_test",
    firstSafeAction: "Prepare lead-page UTMs and dashboard reporting labels.",
    blockedUntil: "Low-volume manual founder posts prove message-market fit."
  }
];

export const analyticsReadinessChecklist = [
  "First-touch UTM capture is stored on live heartbeat payloads.",
  "Referrer, path and page title are visible in the admin live traffic card.",
  "Campaign source/medium/campaign labels are displayed before any paid spend.",
  "GA/GTM/Meta/TikTok/LinkedIn/Yandex Metrica env slots are documented but scripts stay inactive without IDs.",
  "Whop remains the active payment conversion provider; Lemon is postponed.",
  "Partner / referral codes are captured before payout automation is enabled.",
  "Social content planning events are tracked before any auto-publish integration.",
  "Paid ad spend waits until final Whop real payment, credit and idempotency checks pass."
];

export function buildTrackedUrl(path: string, source: string, medium: string, campaign: string) {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
  return `${safePath}?${params.toString()}`;
}
