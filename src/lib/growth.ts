export type GrowthWorkstreamStatus = "planned" | "ready_for_build" | "blocked_by_payment" | "blocked_by_domain";

export type GrowthWorkstream = {
  id: string;
  title: string;
  priority: "P1" | "P2" | "P3";
  status: GrowthWorkstreamStatus;
  summary: string;
  userValue: string;
  adminChecks: string[];
  nextSteps: string[];
  blockedUntil?: string;
};

export const growthWorkstreams: GrowthWorkstream[] = [
  {
    id: "preview-watermark",
    title: "Free-plan / preview watermark",
    priority: "P1",
    status: "ready_for_build",
    summary: "Free or unpaid preview outputs keep a Crelavo preview watermark while paid final delivery can become watermark-free after eligibility and rights checks.",
    userValue: "Users can share previews safely before paying, while paid delivery still has a clear upgrade value.",
    adminChecks: ["previewWatermark flag", "watermarkFreeEligible flag", "rightsConfirmed flag", "owned-content cleanup review"],
    nextSteps: ["Add output metadata flags", "Show preview/final state in dashboard", "Keep watermark-free final blocked until payment eligibility exists"]
  },
  {
    id: "share-to-earn",
    title: "Share-to-earn credits",
    priority: "P1",
    status: "ready_for_build",
    summary: "Users can earn small capped reward credits for verified sharing actions such as posting an output, inviting a user or submitting a public case study.",
    userValue: "Creates a no-budget viral loop and gives users a reason to spread Crelavo outputs.",
    adminChecks: ["shareActionType", "shareUrl", "rewardCredits", "rewardStatus", "abuse review reason"],
    nextSteps: ["Define daily/weekly reward caps", "Create admin review queue", "Separate reward credits from purchased credits"]
  },
  {
    id: "referral-affiliate",
    title: "Referral / affiliate MVP",
    priority: "P1",
    status: "ready_for_build",
    summary: "Referral codes and links can track clicked, signed-up, activated and production-started users before automated payout logic exists. TikTok and YouTube no-code/AI micro-influencer partners can later use lifetime commission links after payout rules are ready.",
    userValue: "Short path to growth partners, affiliates, micro-influencers and customer referrals.",
    adminChecks: ["referralCode", "referrerUserId", "referredUserId", "signupAt", "firstProductionAt", "firstPaidAt pending", "affiliate commission percent", "creator campaign approval"],
    nextSteps: ["Define referral link format", "Add referral tracking table later", "Prepare 30-40% lifetime commission offer copy", "Build influencer outreach list after launch pages are stable", "Connect paid conversion after Lemon Squeezy or affiliate tracking is available"],
    blockedUntil: "Commission/payout and paid conversion attribution wait for Lemon Squeezy or affiliate payout tooling."
  },
  {
    id: "team-workspace",
    title: "Team workspace",
    priority: "P2",
    status: "planned",
    summary: "Team roles, invitations, shared production list, shared material library and approval notes for agencies or businesses.",
    userValue: "Higher-value team use cases without waiting for full billing integration.",
    adminChecks: ["owner/admin/member/viewer roles", "shared productions", "shared materials", "approval notes"],
    nextSteps: ["Plan role model", "Plan invite UI", "Delay shared billing until Lemon Squeezy billing is tested"]
  },
  {
    id: "analytics-dashboard",
    title: "Growth analytics dashboard",
    priority: "P2",
    status: "planned",
    summary: "Track category usage, Assistant routing outcomes, production starts/cancellations/failures, credit reservations and provider failures.",
    userValue: "Helps decide which categories and provider flows deserve investment after launch.",
    adminChecks: ["category usage", "credit reservations", "provider failures", "material upload usage", "refund events"],
    nextSteps: ["Add event schema", "Add admin cards", "Connect revenue metrics after Lemon Squeezy payment events"]
  },
  {
    id: "organic-launch-assets",
    title: "Global organic launch assets",
    priority: "P2",
    status: "planned",
    summary: "Product Hunt, AI directory, X and LinkedIn launch copy drafts prepared before live domain publishing.",
    userValue: "Launch channels become ready while technical blockers are being resolved.",
    adminChecks: ["Product Hunt tagline", "AI directory copy", "X thread", "LinkedIn post", "demo script"],
    nextSteps: ["Draft copy", "Wait for live domain", "Publish only after manual E2E"]
  },
  {
    id: "auto-social-portfolio",
    title: "Automatic social portfolio",
    priority: "P2",
    status: "planned",
    summary: "High-quality user-approved outputs can later be prepared for TikTok, YouTube Shorts, X and Pinterest with captions that show the work was produced by Crelavo.",
    userValue: "Turns the product itself into a live proof portfolio and organic acquisition loop.",
    adminChecks: ["user permission", "quality score", "privacy review", "platform format", "caption approval", "publish schedule"],
    nextSteps: ["Add quality and permission flags", "Prepare platform caption templates", "Keep live publishing blocked until social APIs and manual approval are ready"],
    blockedUntil: "Live posting waits for final API/env setup, social account connections and manual approval rules."
  },
  {
    id: "future-categories",
    title: "Future category backlog",
    priority: "P3",
    status: "planned",
    summary: "AI map/location drone-style video, Creator/YouTuber Studio, custom AI agents, browser extension and social automation remain documented but not launch-critical.",
    userValue: "Keeps expansion ideas visible without distracting from Faz 1 launch readiness.",
    adminChecks: ["category concept", "provider risk", "input requirements", "rough credit model"],
    nextSteps: ["Review after launch data", "Prioritize by user demand", "Avoid building before core launch"]
  },
  {
    id: "compliant-outreach-later",
    title: "Compliant B2B outreach later",
    priority: "P3",
    status: "planned",
    summary: "Cold email / Apollo / Instantly outreach is intentionally placed at the end of the growth backlog and must be handled as compliant outreach, not broad spam.",
    userValue: "Can become an agency sales channel later without risking the main brand domain during launch prep.",
    adminChecks: ["separate outreach domain", "unsubscribe", "lead verification", "GDPR/CAN-SPAM review", "domain warming", "daily volume caps"],
    nextSteps: ["Do not build before core launch", "Draft compliant agency offer later", "Use low-volume tests before any scaled campaign"],
    blockedUntil: "Deferred by user until safer launch and growth foundations are finished."
  }
];

export const launchGrowthSequence = [
  {
    phase: "Pre-launch foundation",
    priority: "Now",
    focus: "Finish manual E2E, Lemon checkout setup, service pages, free tools funnel and partner intake copy before public traffic."
  },
  {
    phase: "Soft launch channels",
    priority: "First traffic",
    focus: "Use TikTok, YouTube Shorts, founder posts, AI directories and no-code communities with low-risk organic content."
  },
  {
    phase: "Referral and partner intake",
    priority: "After first users",
    focus: "Collect partner applications, approve best creators manually and use Lemon checkout purchases plus admin credit activation until payout automation is ready."
  },
  {
    phase: "Free tools SEO loop",
    priority: "Always-on",
    focus: "Push free tools as SEO/side-project landing pages that send users into Assistant Workspace and paid credit packages."
  },
  {
    phase: "Revenue optimization",
    priority: "After live payments",
    focus: "Connect paid attribution, partner commissions, conversion analytics and team workspace upsell only after payment/provider E2E passes."
  },
  {
    phase: "Cold outreach",
    priority: "Last",
    focus: "Keep Apollo/Instantly/cold email at the end; use a separate compliant outreach domain only after safer launch channels work."
  }
];

export const launchChannelPriorities = [
  { channel: "TikTok", status: "Primary", angle: "Short demos: idea to website/app/video package, Lemon checkout launch offer, free tools to paid credits." },
  { channel: "YouTube Shorts", status: "Primary", angle: "Before/after builds, AI production workflows, no-code creator and ecommerce hooks." },
  { channel: "Free Tools SEO", status: "Primary", angle: "Micro-tools that capture search intent and route selected outputs into Assistant Workspace." },
  { channel: "Product Hunt / AI directories", status: "Secondary", angle: "Use after manual E2E, live domain and public service pages are stable." },
  { channel: "X / LinkedIn founder posts", status: "Secondary", angle: "Founder story, launch progress, demo clips and agency/ecommerce use cases." },
  { channel: "Cold email", status: "Deferred", angle: "Only after core launch, compliant setup, separate domain and low-volume tests." }
];

export const growthExecutionOrder = [
  {
    stage: "Referral / partner growth",
    priority: "P1",
    focus: "Prepare partner links, referral code tracking, application copy and conversion handoff before paid attribution is switched on."
  },
  {
    stage: "Blog / showcase duyuru planı",
    priority: "P1",
    focus: "Plan the public posts that announce blog entries and showcase pages, then point each post back into the matching Crelavo path."
  },
  {
    stage: "Free tools tanıtım planı",
    priority: "P1",
    focus: "Promote free tools with short posts, captions and direct links so search traffic can move into the assistant workspace."
  },
  {
    stage: "Takip ve ölçüm",
    priority: "P2",
    focus: "Track clicks, traffic sources, partner responses and which content path creates the most activation."
  }
];

export const growthMeasurementChecklist = [
  "Track which post or page sent the click.",
  "Record partner, referral and campaign source separately.",
  "Measure traffic, signup and activation from each growth channel.",
  "Compare free-tools, blog and showcase performance weekly.",
  "Keep the next growth move ordered by observed return."
];

export const rewardCreditRules = [
  { action: "Share a Crelavo preview output", credits: 100, limit: "2 approved rewards per day" },
  { action: "Invite a new user who signs up", credits: 250, limit: "5 approved rewards per week" },
  { action: "Submit a public case study", credits: 750, limit: "Manual admin approval" },
  { action: "Affiliate referred user starts first production", credits: 1000, limit: "Pending Lemon Squeezy conversion rules" }
];

export const watermarkPolicy = [
  "Free preview outputs use Crelavo preview watermark.",
  "Paid final outputs can be watermark-free after payment eligibility is confirmed.",
  "Owned-content watermark cleanup requires rights confirmation.",
  "Watermark-free delivery must not be promised before credits/payment eligibility exists."
];
