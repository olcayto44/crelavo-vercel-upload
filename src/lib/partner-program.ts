export const DEFAULT_PARTNER_CODE = "CRELAVO-AGENCY";

export const legacyPartnerCodeAliases: Record<string, string> = {
  "CLIPORA-AITOOLS": "CRELAVO-AITOOLS",
  "CLIPORA-NOCODE": "CRELAVO-NOCODE",
  "CLIPORA-AGENCY": "CRELAVO-AGENCY"
};

export function cleanPartnerCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 80);
}

export function normalizePartnerCode(value: unknown) {
  const code = cleanPartnerCode(value);
  return legacyPartnerCodeAliases[code] ?? code;
}

export function partnerCodeLookupCandidates(value: unknown) {
  const cleaned = cleanPartnerCode(value);
  const normalized = normalizePartnerCode(cleaned);
  return Array.from(new Set([normalized, cleaned].filter(Boolean)));
}

export const partnerCommissionDefaults = {
  plannedRange: "15-30% by product type, margin and delivery risk",
  defaultDraftPercent: 20,
  payoutProvider: "Whop source metadata + manual partner ledger until automated payout is connected",
  launchMode: "safe_manual_ledger",
  attributionWindowDays: 30,
  payoutHoldDays: 30,
  minimumPayoutUsd: 50,
  recurringMode: "off at launch; Growth Intelligence can be reviewed manually later",
  cancellationPolicy: "Refunded, cancelled, chargebacked, unpaid or fraud/abuse flagged purchases earn no commission.",
  payoutSchedule: "Affiliate commissions stay pending for 30 days after the paid purchase. After the 30-day refund/cancellation hold, finance reviews eligible payable balances. Minimum payout is $50. Refunds, cancelled sales, chargebacks, unpaid invoices and abuse/fraud flags void the commission.",
  payoutCutoff: "30-day hold after purchase date",
  payoutDay: "Finance-approved payout after 30-day hold and $50 minimum balance"
};

export const partnerProgramPolicy = {
  attributionWindowDays: 30,
  payoutHoldDays: 30,
  minimumPayoutUsd: 50,
  recurring: "Disabled at launch",
  commissionBase: "Paid amount only; refund/cancellation/chargeback/unpaid/fraud purchases are excluded.",
  payoutEligibility: [
    "Referral click or code must be inside the 30-day attribution window.",
    "Purchase must be paid and not refunded, cancelled, chargebacked, unpaid or abuse/fraud flagged.",
    "Commission remains pending for 30 days after purchase.",
    "Payable balance must be at least $50.",
    "Admin/finance can manually pause, reject or override a commission before payout."
  ],
  voidStatuses: ["refunded", "cancelled", "chargeback", "unpaid", "fraud_review", "abuse_flagged"],
  partnerFacingSummary: "30-day attribution, 30-day payout hold, $50 minimum payout. No commission is paid on refunded, cancelled, chargebacked, unpaid or abuse/fraud flagged purchases."
};

export function commissionRateForPurchase(category: string, packageName = "") {
  const text = `${category} ${packageName}`.toLowerCase();
  if (/credit|top.?up|starter monthly|creator/.test(text)) return 15;
  if (/starter production|starter|basic/.test(text)) return 20;
  if (/custom|managed|agency|manual|heavy/.test(text)) return 15;
  if (/growth intelligence|intelligence|high ticket|enterprise/.test(text)) return 30;
  if (/production|pro monthly|business monthly|ultra|video|website|app|saas|campaign/.test(text)) return 25;
  return partnerCommissionDefaults.defaultDraftPercent;
}

export function commissionEligibilityStatus(status: string) {
  const normalized = String(status).toLowerCase().replace(/\s+/g, "_");
  if (partnerProgramPolicy.voidStatuses.includes(normalized)) return "void_no_commission";
  if (["paid", "active", "completed"].includes(normalized)) return "pending_30_day_hold";
  return "no_commission_yet";
}

export function calculatePartnerCommission(amountUsd: number, category: string, packageName: string, purchaseStatus = "paid") {
  const eligibility = commissionEligibilityStatus(purchaseStatus);
  if (eligibility === "void_no_commission" || amountUsd <= 0) {
    return { percent: 0, commissionUsd: 0, eligibility };
  }
  const percent = commissionRateForPurchase(category, packageName);
  return { percent, commissionUsd: Number(((amountUsd * percent) / 100).toFixed(2)), eligibility };
}

export const partnerPackageCommissionRules = [
  {
    packageGroup: "Low-cost digital credit plans",
    examplePackages: ["Starter monthly", "Creator Top-up", "Business monthly"],
    marginProfile: "low-to-medium provider cost",
    defaultPercent: 15,
    note: "Credit/top-up products use 15% because AI/provider and payment costs are direct. Refunds/cancellations void commission."
  },
  {
    packageGroup: "Standard production subscriptions",
    examplePackages: ["Pro monthly", "Ultra monthly", "AI video / website production packages"],
    marginProfile: "balanced margin",
    defaultPercent: 25,
    note: "Default 25% partner rate for normal production plans where delivery cost is predictable; still pending for 30 days."
  },
  {
    packageGroup: "Growth Intelligence service plans",
    examplePackages: ["Starter Intelligence Agent", "Growth Intelligence Agent", "Enterprise Intelligence Agent"],
    marginProfile: "higher recurring service value",
    defaultPercent: 30,
    note: "Highest launch default is 30%. Recurring is off at launch; admin can manually review Growth Intelligence recurring later."
  },
  {
    packageGroup: "High-cost managed delivery / custom production",
    examplePackages: ["Custom app", "managed SaaS build", "heavy provider/API usage", "enterprise custom work"],
    marginProfile: "high labor or provider cost",
    defaultPercent: 15,
    note: "High delivery-cost packages need lower commission or manual approval to protect margin; refund/cancel always voids commission."
  }
];

export const partnerAudienceSegments = [
  "AI tool reviewers",
  "No-code educators",
  "TikTok AI creators",
  "YouTube Shorts creators",
  "SaaS and startup creators",
  "Ecommerce growth creators",
  "Agency owners and consultants"
];

export const partnerAssets = [
  {
    title: "Creator referral link",
    status: "API-ready placeholder",
    detail: "Each approved partner will receive a unique referral code/link once tracking is connected."
  },
  {
    title: "Launch video angles",
    status: "Prepared",
    detail: "Suggested hooks focus on AI production, no-code delivery, websites, apps, video ads and client-ready ZIP/source packages."
  },
  {
    title: "Commission terms",
    status: "Waiting for final percent",
    detail: "The structure is ready; final public percent is set when payout/API provider is selected."
  },
  {
    title: "Partner review workflow",
    status: "Prepared",
    detail: "Applications can move through pending, contacted, approved, rejected and live states."
  }
];

export const partnerWorkflowStages = [
  "Application received",
  "Channel reviewed",
  "Partner approved",
  "Referral code and sharing links assigned",
  "Content brief sent",
  "First signup tracked",
  "First paid conversion tracked",
  "Commission/payout reviewed"
];

export const partnerReadinessChecks = [
  {
    label: "Public landing page",
    status: "ready",
    note: "Partner Program page explains who it is for and collects early access applications."
  },
  {
    label: "User dashboard entry",
    status: "ready",
    note: "Dashboard has a Partner Rewards area for referral status, assets and future links."
  },
  {
    label: "Admin review workflow",
    status: "ready",
    note: "Admin panel has statuses, sample application fields, launch checklist and provider blockers."
  },
  {
    label: "Commission percent",
    status: "pending_final_decision",
    note: "Draft range is prepared; final percent is selected before launch."
  },
  {
    label: "Payout/tracking provider",
    status: "pending_api",
    note: "Whop source metadata and the manual partner ledger are the active launch path; Lemon stays postponed until later."
  },
  {
    label: "Live payout start",
    status: "pending_api",
    note: "Start only after payment provider, attribution and payout rules are tested."
  }
];

export const partnerApplicationFields = [
  "Full name",
  "Email",
  "Channel type",
  "Channel URL",
  "Audience size",
  "Main audience",
  "Promotion idea",
  "Application IP address",
  "Application country",
  "Application city",
  "Payout email later",
  "Payout method after approval",
  "Bank account holder after approval",
  "Bank name after approval",
  "IBAN / SWIFT after approval",
  "Payout detail change request email log",
  "Status",
  "Referral code later"
];

export const samplePartnerApplications = [
  {
    name: "AI Tools Reviewer",
    email: "aitools-reviewer@example.com",
    channel: "YouTube Shorts",
    channelUrl: "https://youtube.com/@aitoolsreviewer",
    audience: "AI tools and no-code founders",
    audienceSize: "38k subscribers",
    status: "pending",
    submittedAt: "2026-07-08 10:15",
    ip: "185.60.216.35",
    country: "Turkey",
    city: "Istanbul",
    inbox: "affiliate",
    nextAction: "Review channel fit, then approve or reject with one-click email."
  },
  {
    name: "No-Code Builder Creator",
    email: "nocode-builder@example.com",
    channel: "TikTok",
    channelUrl: "https://tiktok.com/@nocodebuilder",
    audience: "SaaS builders, freelancers and agencies",
    audienceSize: "64k followers",
    status: "contacted",
    submittedAt: "2026-07-07 15:40",
    ip: "31.145.82.19",
    country: "Turkey",
    city: "Izmir",
    inbox: "affiliate",
    nextAction: "Send launch asset pack after commission percent is finalized."
  },
  {
    name: "Agency Growth Partner",
    email: "agency-growth@example.com",
    channel: "LinkedIn / newsletter",
    channelUrl: "https://linkedin.com/company/agency-growth-partner",
    audience: "Digital agency owners and ecommerce operators",
    audienceSize: "12k newsletter subscribers",
    status: "approved_pending_code",
    submittedAt: "2026-07-06 09:20",
    ip: "88.255.101.74",
    country: "Turkey",
    city: "Ankara",
    inbox: "affiliate",
    nextAction: "Assign referral code when tracking provider is connected."
  }
];

export const partnerInboxRoutingRules = [
  { source: "Partner application form", destination: "Admin → Partner Program", note: "Affiliate/partner applications and replies should be kept in the partner inbox, not the normal customer support queue." },
  { source: "Partner payout or IBAN email", destination: "Admin → Partner Program + Finance", note: "Bank detail changes require finance verification before the next 30-day payout review." },
  { source: "Normal customer contact", destination: "Admin → Contact / support flow", note: "General member support, production requests and user replies stay outside the affiliate inbox." }
];

export const partnerLaunchSequence = [
  { phase: "Before public partner push", action: "Keep /affiliate collecting early applications, but avoid public payout promises until commission percent and payout provider are final." },
  { phase: "Whop paid launch", action: "If a referred user pays through Whop, capture partner/source metadata manually and activate credits or service access only after Whop receipt review." },
  { phase: "First creator tests", action: "Start with TikTok and YouTube Shorts creators who can demonstrate website/app/video package use cases." },
  { phase: "After Whop/manual ledger validation", action: "Connect paid attribution, commission ledger, payout approvals and partner-specific links without enabling real payouts until finance signs off." },
  { phase: "Scale partners", action: "Only scale after referral-to-signup-to-paid conversion is verified with one complete manual E2E path." }
];

export const partnerChannelPriority = [
  { channel: "TikTok AI creators", priority: "Primary", reason: "Short before/after demos and free-tool-to-production flow can convert quickly." },
  { channel: "YouTube Shorts creators", priority: "Primary", reason: "Best for repeatable AI production, no-code and ecommerce workflow demos." },
  { channel: "No-code educators", priority: "Primary", reason: "Strong fit for websites, apps, source ZIP and client-ready delivery packages." },
  { channel: "Ecommerce growth creators", priority: "Secondary", reason: "Good for product-link ad videos and store assets after provider examples are stable." },
  { channel: "Agency/newsletter partners", priority: "Secondary", reason: "Higher-ticket potential, but needs trust assets and clean case studies." }
];

export const partnerLaunchChecklist = [
  "Use Whop source metadata plus manual commission ledger as the active launch provider path",
  "Keep 15% / 25% / 30% commission rules visible before any public partner push",
  "Generate unique partner referral links for main, affiliate and Growth Intelligence pages",
  "Prepare creator asset pack: hooks, demo script, screenshots, offer copy",
  "Record every paid conversion with Whop payment reference, partner code, payout window and admin note",
  "Run one manual test: click link → signup → first production → paid conversion → commission record",
  "Keep Lemon out of partner launch flow until all Whop and growth work is complete"
];

export const partnerManualOperationQueues = [
  { queue: "New applications", owner: "Admin", action: "Review channel fit, audience quality, content examples and promotion risk before approval.", exit: "approve, reject or request more details" },
  { queue: "Approved but no code", owner: "Admin", action: "Assign partner code, create main/affiliate/Growth Intelligence links and send creator asset pack.", exit: "partner has code and safe launch copy" },
  { queue: "First referred signup", owner: "Admin", action: "Record referred user, source URL, UTM/ref code, signup date and whether the user started production.", exit: "signup linked to partner record" },
  { queue: "Paid conversion review", owner: "Finance", action: "Verify Whop payment reference, package, amount, refund risk and duplicate payment reference before adding commission.", exit: "commission is pending_30_day_hold or rejected" },
  { queue: "Payout review", owner: "Finance", action: "After 30-day hold, confirm no refund/cancel/chargeback, minimum payout reached and payout details verified.", exit: "payable, held, rejected or needs bank update" },
  { queue: "Partner support", owner: "Support", action: "Keep payout questions, bank detail changes and campaign requests outside normal customer support noise.", exit: "admin note updated and next action assigned" }
];

export const partnerManualOperationChecklist = [
  "Check partner application source, channel URL and audience before approval.",
  "Send approval/rejection/bank-info email using the prepared partner templates.",
  "Create or confirm partner code and referral links before the partner promotes Crelavo.",
  "For every paid conversion, record partner code, customer email, package, amount, Whop payment reference and payout window.",
  "Reject duplicate payment references and purchases outside the attribution window.",
  "Keep every commission pending for 30 days before payout review.",
  "Void commission for refunded, cancelled, chargebacked, unpaid, fraud or abuse-flagged purchases.",
  "Verify payout method, payout email, account holder and bank details before any manual payout.",
  "Add finance/admin notes for every manual override, payout hold or rejected commission.",
  "Run one full manual path before scaling outreach: partner click → signup → paid purchase → ledger → 30-day hold → payout review."
];

export const partnerWhopOptimizationPlan = [
  {
    title: "Whop source metadata capture",
    status: "active_manual",
    action: "Use partner code/ref links and Whop payment reference together when recording a commission.",
    guardrail: "No payout before 30-day hold, $50 minimum and refund/cancel review."
  },
  {
    title: "Manual commission ledger",
    status: "ready",
    action: "Admin records purchase amount, package, customer email, partner code, source and Whop payment reference.",
    guardrail: "Duplicate Whop payment references must not create duplicate payable commissions."
  },
  {
    title: "Partner referral links",
    status: "ready",
    action: "Prioritize main, affiliate, free-tools and Growth Intelligence links with ?ref= partner code.",
    guardrail: "Referral claim must stay inside 30-day attribution window."
  },
  {
    title: "Creator launch asset pack",
    status: "ready_to_use",
    action: "Give approved creators hooks, demo scripts, landing URLs and Whop-safe offer copy.",
    guardrail: "Do not promise instant payouts, fixed recurring commission or Lemon checkout."
  },
  {
    title: "Scale gate",
    status: "blocked_until_manual_e2e",
    action: "Only scale partner outreach after one full manual path is verified end-to-end.",
    guardrail: "Path must include click → signup → paid Whop conversion → ledger → payout hold."
  }
];

export const partnerCreatorAssetPack = [
  {
    asset: "Short-form hook set",
    copy: "I tested an AI studio that turns ideas into websites, apps, videos and growth assets from one dashboard.",
    target: "TikTok / YouTube Shorts / Reels"
  },
  {
    asset: "No-code founder demo script",
    copy: "Show free tool → production category → Whop checkout-ready package → dashboard delivery flow.",
    target: "No-code educators and SaaS creators"
  },
  {
    asset: "Agency offer angle",
    copy: "Use Crelavo as an AI production layer for client videos, websites, apps, brand kits and campaign assets.",
    target: "Agencies, consultants and ecommerce operators"
  },
  {
    asset: "Safe disclosure line",
    copy: "Partner links may earn a commission after a paid Whop purchase clears the 30-day refund/cancellation hold.",
    target: "All public partner content"
  }
];

export const partnerApiVisibilityRoadmap = [
  "Whop payment/reference mapping stays active while Lemon is postponed.",
  "Affiliate API automation comes after manual Whop partner ledger validation.",
  "Provider/API cost and quality optimization is tracked as a separate 2. Grup item.",
  "Lemon API/webhook work is last-phase only and must not disturb Whop checkout."
];

export const partnerCommissionTiers = [
  {
    id: "starter_creator",
    label: "Starter creator",
    followerRange: "1k-10k followers",
    channels: ["TikTok", "YouTube Shorts", "X / LinkedIn"],
    defaultPercent: 25,
    approvalRule: "Good audience fit, but early or small channel."
  },
  {
    id: "growth_creator",
    label: "Growth creator",
    followerRange: "10k-50k followers",
    channels: ["TikTok", "YouTube Shorts", "Blog / newsletter"],
    defaultPercent: 30,
    approvalRule: "Consistent AI/no-code content and reliable engagement."
  },
  {
    id: "premium_creator",
    label: "Premium creator",
    followerRange: "50k-250k followers",
    channels: ["TikTok", "YouTube", "Newsletter", "Community"],
    defaultPercent: 30,
    approvalRule: "Strong conversion potential, clear audience trust and launch video capability. Launch cap is 30%."
  },
  {
    id: "strategic_partner",
    label: "Strategic partner",
    followerRange: "250k+ followers or agency network",
    channels: ["YouTube", "Agency", "Community", "Newsletter"],
    defaultPercent: 30,
    approvalRule: "High-value creator, agency, community owner or distribution partner. Any rate above 30% requires manual executive approval after margin review."
  }
];

export const partnerStatusCommissionAdjustments = [
  { status: "pending", label: "Pending review", adjustment: 0, note: "Application received; no public payout terms yet." },
  { status: "contacted", label: "Contacted", adjustment: 0, note: "Channel fit being reviewed." },
  { status: "approved", label: "Approved", adjustment: 0, note: "Default tier commission can apply." },
  { status: "top_performer", label: "Top performer", adjustment: 5, note: "Optional bonus for partners with proven paid conversions." },
  { status: "paused", label: "Paused", adjustment: -100, note: "No new commission accrual while paused." }
];

export const partnerPaymentProfiles = [
  {
    partnerCode: "CRELAVO-AITOOLS",
    partner: "AI Tools Reviewer",
    email: "aitools-reviewer@example.com",
    payoutMethod: "Bank transfer",
    accountHolder: "AI Tools Reviewer Media LLC",
    bankName: "Wise Business",
    iban: "TR00 0000 0000 0000 0000 0000 01",
    swift: "TRWIBEB1XXX",
    country: "TR",
    lastIp: "185.60.216.35",
    lastCountry: "Turkey",
    lastCity: "Istanbul",
    status: "pending_verification",
    lastUpdated: "2026-07-02",
    changePolicy: "Partner must email finance before payout details are changed."
  },
  {
    partnerCode: "CRELAVO-NOCODE",
    partner: "No-Code Builder Creator",
    email: "nocode-builder@example.com",
    payoutMethod: "Bank transfer",
    accountHolder: "No-Code Builder Studio",
    bankName: "Revolut Business",
    iban: "TR00 0000 0000 0000 0000 0000 02",
    swift: "REVOLT21XXX",
    country: "TR",
    lastIp: "31.145.82.19",
    lastCountry: "Turkey",
    lastCity: "Izmir",
    status: "verified",
    lastUpdated: "2026-07-03",
    changePolicy: "Partner must email finance before payout details are changed."
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    partner: "Agency Growth Partner",
    email: "agency-growth@example.com",
    payoutMethod: "Bank transfer",
    accountHolder: "Agency Growth Partner LTD",
    bankName: "Garanti BBVA",
    iban: "TR00 0000 0000 0000 0000 0000 03",
    swift: "TGBATRISXXX",
    country: "TR",
    lastIp: "88.255.101.74",
    lastCountry: "Turkey",
    lastCity: "Ankara",
    status: "verified",
    lastUpdated: "2026-07-08",
    changePolicy: "Partner must email finance before payout details are changed."
  }
];

export const partnerReferralLinks = [
  {
    partnerCode: "CRELAVO-AITOOLS",
    slug: "aitools",
    status: "ready_after_tracking",
    primaryPath: "/?ref=CRELAVO-AITOOLS",
    affiliatePath: "/affiliate?ref=CRELAVO-AITOOLS",
    growthIntelligencePath: "/growth-intelligence?ref=CRELAVO-AITOOLS&utm_source=affiliate&utm_medium=creator&utm_campaign=growth_intelligence",
    dashboardPath: "/dashboard/partners",
    shareText: "Try Crelavo for AI videos, websites, apps and Growth Intelligence. Use my partner link to start.",
    note: "Use this for AI tool review videos and free-tool conversion funnels."
  },
  {
    partnerCode: "CRELAVO-NOCODE",
    slug: "nocode",
    status: "ready_after_tracking",
    primaryPath: "/?ref=CRELAVO-NOCODE",
    affiliatePath: "/affiliate?ref=CRELAVO-NOCODE",
    growthIntelligencePath: "/growth-intelligence?ref=CRELAVO-NOCODE&utm_source=affiliate&utm_medium=tiktok&utm_campaign=growth_intelligence",
    dashboardPath: "/dashboard/partners",
    shareText: "Build production-ready AI assets, websites and growth campaigns with Crelavo. Start with my partner link.",
    note: "Use this for no-code tutorials, SaaS builder content and TikTok demos."
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    slug: "agency",
    status: "ready_after_tracking",
    primaryPath: "/?ref=CRELAVO-AGENCY",
    affiliatePath: "/affiliate?ref=CRELAVO-AGENCY",
    growthIntelligencePath: "/growth-intelligence?ref=CRELAVO-AGENCY&utm_source=affiliate&utm_medium=agency&utm_campaign=growth_intelligence",
    dashboardPath: "/dashboard/partners",
    shareText: "Use Crelavo Growth Intelligence to monitor public competitor signals and receive executive reports. Start with my partner link.",
    note: "Best for agencies, consultants and ecommerce growth partners promoting recurring service plans."
  }
];

export const partnerEmailCampaignTemplates = [
  { label: "Approval email", subject: "Your Crelavo Partner Program application is approved", body: "Congratulations — your Crelavo Partner Program application has been approved. Your partner account is ready for referral setup. Please log in to your partner dashboard, review your referral area and add/confirm payout details. Commissions stay pending for 30 days after purchase, require a $50 minimum payable balance, and are void if the sale is refunded, cancelled, chargebacked, unpaid or flagged for abuse/fraud." },
  { label: "Rejection email", subject: "Update about your Crelavo Partner Program application", body: "Thank you for applying to the Crelavo Partner Program. We reviewed your application carefully, but we are not able to approve it at this stage. We are sorry that we cannot move forward right now. As Crelavo grows, we would be happy to review future applications again, and we hope to welcome you into the partner community later." },
  { label: "Bank info reminder", subject: "Add or confirm your affiliate payout bank details", body: "Please confirm your account holder name, bank name, IBAN/SWIFT and payout country in your partner dashboard. For security, payout details cannot be silently changed. If you need to update bank details later, reply to this email so finance can verify the update before the next payout review." },
  { label: "Payout eligibility notice", subject: "Crelavo affiliate payout eligibility review", body: "Your referred paid conversions are reviewed after the 30-day refund/cancellation hold. Only paid, non-refunded, non-cancelled, non-chargebacked and non-abuse flagged sales are eligible. Minimum payout is $50 after finance review." }
];

export const partnerPerformanceSummary = [
  {
    partner: "AI Tools Reviewer",
    code: "CRELAVO-AITOOLS",
    channel: "YouTube Shorts",
    tier: "Growth creator",
    status: "approved",
    commissionPercent: 30,
    referredUsers: 18,
    payingUsers: 4,
    totalRevenueUsd: 316,
    estimatedCommissionUsd: 94.8,
    lastConversion: "Pro monthly",
    nextAction: "Assign live tracking link after payout provider setup."
  },
  {
    partner: "No-Code Builder Creator",
    code: "CRELAVO-NOCODE",
    channel: "TikTok",
    tier: "Premium creator",
    status: "top_performer",
    commissionPercent: 30,
    referredUsers: 64,
    payingUsers: 11,
    totalRevenueUsd: 1189,
    estimatedCommissionUsd: 356.7,
    lastConversion: "Business monthly",
    nextAction: "Keep launch cap at 30% unless executive margin review approves an override."
  },
  {
    partner: "Agency Growth Partner",
    code: "CRELAVO-AGENCY",
    channel: "LinkedIn / newsletter",
    tier: "Strategic partner",
    status: "approved",
    commissionPercent: 30,
    referredUsers: 10,
    payingUsers: 4,
    totalRevenueUsd: 1096,
    estimatedCommissionUsd: 328.8,
    lastConversion: "Growth Intelligence Agent monthly",
    nextAction: "Prepare agency-specific Growth Intelligence landing link and demo package."
  }
];

export const partnerReferredMembers = [
  {
    partnerCode: "CRELAVO-AGENCY",
    memberName: "Ahmet Yilmaz",
    memberEmail: "ahmet@example.com",
    signupDate: "2026-07-08",
    sourceChannel: "LinkedIn newsletter",
    status: "signed_up_no_purchase",
    purchasedPlan: "No package yet",
    packageCategory: "No purchase",
    purchaseAmountUsd: 0,
    commissionPercent: 0,
    commissionUsd: 0,
    payoutStatus: "no_commission_yet",
    period: "daily"
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    memberName: "Growth Client",
    memberEmail: "growth-client@example.com",
    signupDate: "2026-07-07",
    sourceChannel: "Agency landing page",
    status: "paid",
    purchasedPlan: "Growth Intelligence Agent monthly",
    packageCategory: "Growth Intelligence",
    purchaseAmountUsd: 499,
    commissionPercent: 30,
    commissionUsd: 149.7,
    payoutStatus: "pending_30_day_hold",
    period: "weekly"
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    memberName: "Agency Client",
    memberEmail: "agency-client@example.com",
    signupDate: "2026-07-04",
    sourceChannel: "Partner demo call",
    status: "paid",
    purchasedPlan: "Ultra monthly",
    packageCategory: "Standard subscription",
    purchaseAmountUsd: 199,
    commissionPercent: 25,
    commissionUsd: 49.75,
    payoutStatus: "pending_30_day_hold",
    period: "weekly"
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    memberName: "Enterprise Buyer",
    memberEmail: "enterprise-buyer@example.com",
    signupDate: "2026-07-01",
    sourceChannel: "LinkedIn DM",
    status: "paid",
    purchasedPlan: "Enterprise Intelligence Agent monthly",
    packageCategory: "Growth Intelligence",
    purchaseAmountUsd: 1999,
    commissionPercent: 30,
    commissionUsd: 599.7,
    payoutStatus: "manual_margin_review",
    period: "monthly"
  }
];

export const partnerPayoutReportingWindows = [
  { label: "Daily", value: "daily", note: "Shows today’s signups, paid purchases and no-purchase referred members." },
  { label: "Weekly", value: "weekly", note: "Shows weekly referral activity only; payout remains blocked until the 30-day hold and finance review are complete." },
  { label: "Monthly", value: "monthly", note: "Aggregates partner revenue, package categories and commission liability for finance review." }
];

export const partnerPurchaseAttribution = [
  {
    partnerCode: "CRELAVO-AITOOLS",
    memberEmail: "founder-alpha@example.com",
    signupPlan: "Free / welcome credits",
    purchasedPlan: "Pro monthly",
    purchaseAmountUsd: 29,
    commissionPercent: 25,
    commissionUsd: 7.25,
    status: "pending_30_day_hold"
  },
  {
    partnerCode: "CRELAVO-NOCODE",
    memberEmail: "studio-owner@example.com",
    signupPlan: "Free / welcome credits",
    purchasedPlan: "Business monthly",
    purchaseAmountUsd: 79,
    commissionPercent: 25,
    commissionUsd: 19.75,
    status: "pending_30_day_hold"
  },
  {
    partnerCode: "CRELAVO-NOCODE",
    memberEmail: "ecom-team@example.com",
    signupPlan: "Free / welcome credits",
    purchasedPlan: "Creator Top-up",
    purchaseAmountUsd: 25,
    commissionPercent: 15,
    commissionUsd: 3.75,
    status: "pending_30_day_hold"
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    memberEmail: "agency-client@example.com",
    signupPlan: "Free / welcome credits",
    purchasedPlan: "Ultra monthly",
    purchaseAmountUsd: 199,
    commissionPercent: 25,
    commissionUsd: 49.75,
    status: "pending_30_day_hold"
  },
  {
    partnerCode: "CRELAVO-AGENCY",
    memberEmail: "growth-client@example.com",
    signupPlan: "Growth Intelligence brief",
    purchasedPlan: "Growth Intelligence Agent monthly",
    purchaseAmountUsd: 499,
    commissionPercent: 30,
    commissionUsd: 149.7,
    status: "pending_30_day_hold"
  }
];
