export type RetentionStatus = "ready" | "manual_ready" | "blocked_by_real_payment" | "connected_pending_live_e2e";

export const retentionGrowthSummary = {
  title: "Retention and growth operating system",
  mode: "Whop + provider-aware growth flows connected",
  promise: "Bring users back, push them toward first production, and guide them to Whop packages while tracking conversion, delivery and reward readiness.",
  guardrail: "Lead capture, Whop-aware checkout and referral records can be prepared now; rewards, partner payouts and paid spend still require manual review until final live E2E validation."
};

export const lifecycleNudges = [
  {
    stage: "New signup, no production",
    status: "ready" as RetentionStatus,
    trigger: "User registered but has not started Assistant Workspace or a builder flow.",
    message: "Start with a free tool or open Assistant Workspace to create your first production brief.",
    primaryCta: "Open Assistant Workspace",
    href: "/dashboard/assistant-workspace",
    adminCheck: "Track signup → first builder visit → first production request."
  },
  {
    stage: "Production started, not delivered",
    status: "manual_ready" as RetentionStatus,
    trigger: "User has an active or draft production request.",
    message: "Your production is in progress. Review delivery status or add missing assets to move faster.",
    primaryCta: "View productions",
    href: "/dashboard/productions",
    adminCheck: "Check stalled requests and missing user inputs before sending reminders."
  },
  {
    stage: "Delivered, no second action",
    status: "ready" as RetentionStatus,
    trigger: "User received a delivery but has not opened another category or package.",
    message: "Turn this result into a second asset: ad creative, landing page, social kit or Growth Intelligence report.",
    primaryCta: "Open growth rewards",
    href: "/dashboard/growth",
    adminCheck: "Suggest next category based on previous production type."
  },
  {
    stage: "Low credits or checkout intent",
    status: "connected_pending_live_e2e" as RetentionStatus,
    trigger: "User visits credits/payment or starts checkout but does not complete Whop payment.",
    message: "Top up safely with Whop when ready; no production spend starts until credits/payment are confirmed.",
    primaryCta: "View credits",
    href: "/dashboard/credits",
    adminCheck: "Checkout intent logging is connected through lead_captures when the user opts in. Send one consent-safe abandoned checkout reminder after about 1 hour, and send a 23rd-hour preview reminder before the paid plan continues; final live Whop E2E remains required before full automation."
  },
  {
    stage: "Inactive user",
    status: "manual_ready" as RetentionStatus,
    trigger: "User has not returned after the first visit or first production.",
    message: "New Crelavo samples, free tools and production flows are ready when you want to continue.",
    primaryCta: "Explore categories",
    href: "/categories",
    adminCheck: "Use low-volume manual email/social reminders first; no automated bulk outreach yet."
  }
];

export const activationFunnelSteps = [
  { step: "Visit", signal: "page_view_attributed", goal: "Capture path/ref/UTM source." },
  { step: "Signup", signal: "registered_user", goal: "Move user into dashboard and first builder." },
  { step: "First production intent", signal: "assistant_workspace_started", goal: "Start a brief, category flow or free tool handoff." },
  { step: "First production request", signal: "production_request_created", goal: "Create request without triggering unnecessary provider spend." },
  { step: "Delivery viewed", signal: "delivery_viewed", goal: "Prompt second action, share, referral or upgrade." },
  { step: "Whop checkout", signal: "checkout_started",     goal: "Prepare payment/credit/idempotency records, log opt-in checkout intent, and trigger consent-safe recovery/preview reminder emails while release stays behind final review." }
];

export const growthRewardReadiness = [
  {
    reward: "First production completion",
    credits: 100,
    status: "manual_ready" as RetentionStatus,
    cap: "One launch reward per user",
    guardrail: "Create a reviewable reward record; do not release credits from unverified actions."
  },
  {
    reward: "Share approved preview",
    credits: 100,
    status: "manual_ready" as RetentionStatus,
    cap: "2 approved rewards per day",
    guardrail: "Shared URL must be public, non-abusive and approved by admin."
  },
  {
    reward: "Invite user who signs up",
    credits: 250,
    status: "manual_ready" as RetentionStatus,
    cap: "5 approved rewards per week",
    guardrail: "No self-referral, duplicate account or fraud/abuse reward."
  },
  {
    reward: "Paid Whop conversion",
    credits: 1000,
    status: "blocked_by_real_payment" as RetentionStatus,
    cap: "After Whop payment + credit/idempotency validation",
    guardrail: "Prepare the reward record after Whop signal; release only after payment, refund window and duplicate protection pass."
  }
];

export const dashboardNextBestActions = [
  { label: "Finish your first production", href: "/dashboard/assistant-workspace", reason: "Highest activation step for new users." },
  { label: "Explore free tools", href: "/free-tools", reason: "Low-friction SEO loop that routes into production." },
  { label: "Plan social content", href: "/ai-social-media-ai", reason: "Turns outputs into launch posts, repurposed clips and content loops." },
  { label: "View credits", href: "/dashboard/credits", reason: "Moves engaged users toward Whop top-up without forcing checkout." },
  { label: "Open Growth Rewards", href: "/dashboard/growth", reason: "Shows share/referral/watermark rules and next growth actions." }
];

export const retentionAdminChecklist = [
  "Dashboard shows next best actions for signup → first production → delivery → second action.",
  "Lifecycle nudges are mapped to dashboard, lead capture and email-ready triggers before bulk automation is enabled.",
  "Reward credits create reviewable records first and remain release-blocked until abuse/idempotency checks are proven.",
  "Whop checkout remains the active payment path; Lemon remains postponed.",
  "Social, growth and provider-aware delivery flows are code-connected; final live E2E validation is the remaining gate."
];
