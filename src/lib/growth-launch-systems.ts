export const socialExportPack = [
  { platform: "TikTok", format: "9:16 short video", assets: "Opening hook text, subtitles, hashtags, cover text, call-to-action, launch job note", guardrail: "Connected APIs may prepare the launch job; manual approval is required before publishing or spend." },
  { platform: "YouTube Shorts", format: "9:16 short video", assets: "Title, description, hashtags, pinned comment, chapters note, upload readiness note", guardrail: "YouTube OAuth can prepare upload workflow; manual approval remains required." },
  { platform: "Instagram Reels", format: "9:16 / 4:5", assets: "Caption, hashtags, story teaser, bio CTA, cover text, Reels export note", guardrail: "Meta connection can prepare export/launch payload; direct publishing waits for approval." },
  { platform: "Facebook / Meta Ads", format: "9:16 / 4:5 / 1:1 ad creative", assets: "Primary text, headline, description, CTA button idea, campaign objective note, ad upload checklist", guardrail: "Paid ad launch waits for Whop payment, credit checks and manual approval." },
  { platform: "LinkedIn", format: "Text + image/video teaser", assets: "Founder/company post, B2B hook, link CTA, UTM label, comment prompt", guardrail: "Manual post review is required before any scheduled publishing." },
  { platform: "X / Twitter", format: "Short post + media teaser", assets: "Short post, thread outline, hashtags, link CTA, UTM label, reply prompt", guardrail: "Manual post review is required before any scheduled publishing." }
];

export const shortFormGrowthSystem = [
  { stage: "Daily proof clip", cadence: "1-2/day", idea: "Show before/after production result, builder flow or delivery package.", ownerAction: "Pick one existing output and convert it into TikTok/Shorts hook." },
  { stage: "Free tool hook", cadence: "3/week", idea: "Turn a free tool result into a short educational or ecommerce angle.", ownerAction: "Use /free-tools and send users to Assistant Workspace." },
  { stage: "Founder build-in-public", cadence: "2/week", idea: "Show Crelavo launch progress, payment guardrails and provider readiness honestly.", ownerAction: "Post manual update with no paid ad spend." },
  { stage: "Customer-style demo", cadence: "2/week", idea: "Demonstrate Shopify/product link to ad, website/app plan or Growth Intelligence use case.", ownerAction: "Use safe sample data; do not expose user files." }
];

export const shareToEarnLoop = [
  { action: "Share approved preview output", reward: 100, cap: "2 approved rewards per day", review: "Public URL, no abuse, no copied/protected content." },
  { action: "Invite user who signs up", reward: 250, cap: "5 approved rewards per week", review: "No self-referral, duplicate accounts or suspicious IP patterns." },
  { action: "Submit public case study", reward: 750, cap: "Manual approval", review: "User permission, final output quality and rights confirmation required." },
  { action: "Referred user starts first paid production", reward: 1000, cap: "Only after Whop validation", review: "Real paid conversion + idempotency + refund/chargeback guard." }
];

export const customAgentSystem = [
  { agent: "Brand content agent", purpose: "Reusable brand voice, social ideas, ad hooks and campaign briefs.", inputs: "Brand notes, product/service, audience, tone, forbidden claims.", status: "Ready as planning workflow; connected launch prep requires approval before posting." },
  { agent: "Ecommerce product agent", purpose: "Product-link campaign angles, listing copy, short-form scripts and delivery notes.", inputs: "Product URL, offer, marketplace, buyer persona, proof points.", status: "Ready for dashboard planning; product/provider records can be prepared when keys are available." },
  { agent: "Live sales agent", purpose: "Avatar/live commerce scripts, FAQ, objection handling and CTA playbook.", inputs: "Catalog, platform, language, avatar, offer rules, fallback instructions.", status: "Service plan ready; provider/live stack remains key-gated and approval-gated." },
  { agent: "Growth intelligence agent", purpose: "Public competitor and market signal summary with response campaign ideas.", inputs: "Own site, competitor URLs, public ad references, target market.", status: "Request/report flow ready; recurring automation remains review-gated." }
];

export const premiumExpansionSystem = [
  { module: "Marketplace localization", output: "Localized titles, bullets, SEO keywords, ad scripts and social captions.", safety: "Adapt language/culture; do not make unsupported local compliance claims." },
  { module: "Video / voice localization", output: "Dub direction, subtitles, local voice notes, cultural visual adaptation.", safety: "Voice/likeness rights and consent must be confirmed." },
  { module: "Competitor ad analyzer", output: "Hook structure, pacing, offer framing, proof signal and original response brief.", safety: "Analyze public structure only; never copy exact creative, logos, scripts or protected assets." },
  { module: "Growth Intelligence report", output: "Weekly CEO-style report and response actions.", safety: "Use public sources only; no paywall/login/captcha/private data bypass." }
];

export const launchBlockedNotes = [
  "Connected social APIs may prepare jobs, but live posting still waits for account approval rules.",
  "Paid ad spend waits for final Whop payment, credit and idempotency validation.",
  "Provider-heavy custom agents remain key-gated and final-live-test-gated before full automation.",
  "Rewards create reviewable records first and stay release-blocked until abuse/fraud/idempotency rules are proven."
];
