type ChecklistStatus = "ready" | "missing" | "pending" | "optional";

type ChecklistItem = {
  label: string;
  status: ChecklistStatus;
  env: string[];
  note: string;
  validation: string;
};

type ChecklistGroup = {
  title: string;
  description: string;
  items: ChecklistItem[];
};

type EmailTemplate = {
  label: string;
  subject: string;
  body: string;
  audience: string;
  smokeStep: string;
};

type ReadinessGate = {
  title: string;
  owner: string;
  check: string;
};

const apiAutomationReadinessGates: ReadinessGate[] = [
  { title: "Secrets stay server-side", owner: "Owner", check: "Provider, Whop, Resend, Supabase service-role and render keys must exist only in Vercel/env or local .env.local; never in client bundles, docs, screenshots or chat." },
  { title: "Whop is payment source of record", owner: "Finance", check: "Preview activation, subscription status, cancellation visibility, idempotency and credit grants must be driven by verified Whop events before automation is enabled." },
  { title: "Credits never trust client payloads", owner: "Backend", check: "Package price, credit amount, reward credit, coupon claim and clean-export access must be recalculated server-side from package/payment records." },
  { title: "Provider spend has a stop switch", owner: "Operations", check: "Run a low-cost success job and a failure job for each selected provider; confirm API Guard, admin review and fallback messaging before paid traffic." },
  { title: "Viral loops remain manual until proven", owner: "Growth", check: "Referral credits, coupon hunt, share-to-earn, partner commission and abandoned checkout recovery stay manual or consent-safe until fraud and attribution checks pass." },
  { title: "Preview watermark gates clean export", owner: "Product", check: "Watermarked preview export can be generated for proof; watermark-free final export opens only after paid plan eligibility and delivery rules are confirmed." }
];

const providerFailoverChecklist: ReadinessGate[] = [
  { title: "Primary provider selected", owner: "Owner", check: "Choose one active video/generation provider for launch and document why it is first: cost, quality, API reliability and commercial usage rights." },
  { title: "Fallback provider account prepared", owner: "Owner", check: "Create at least one fallback account or manual fulfillment route for video/image/render if the primary provider blocks, fails or rate-limits launch traffic." },
  { title: "Failure path tested", owner: "Operations", check: "Force one provider error and confirm the production moves to admin review without spending extra credits or promising automatic delivery." },
  { title: "Cost ceiling verified", owner: "Finance", check: "Confirm per-job credit ceilings, daily user limits and provider cost assumptions before ads or influencer traffic send users into production." }
];

const resendEmailTemplates: EmailTemplate[] = [
  {
    label: "Welcome / access",
    subject: "Welcome to Crelavo",
    audience: "New users",
    body: "Hi {{name}},\n\nWelcome to Crelavo. Your account is ready, and you can start from categories, free tools or your dashboard.\n\nIf you need help, reply to this email and we will help you continue.",
    smokeStep: "Send to one internal test inbox and confirm sender, subject, plain text body and reply-to all arrive correctly."
  },
  {
    label: "Payment receipt",
    subject: "Your Crelavo payment was received",
    audience: "Paying users",
    body: "Hi {{name}},\n\nWe received your payment and activated the next step in your Crelavo flow. Your receipt reference and package details are recorded in the dashboard.\n\nIf you need the receipt again, reply and we will resend the details.",
    smokeStep: "Send one payment-style test email and confirm the receipt language, package reference and dashboard wording are clear."
  },
  {
    label: "Production update",
    subject: "Your Crelavo production has an update",
    audience: "Active production users",
    body: "Hi {{name}},\n\nYour production has a new update. Please check the dashboard for the latest status, delivery link or next action.\n\nIf anything looks wrong, reply and we will review it.",
    smokeStep: "Send one status-update test email and confirm the dashboard call-to-action and support fallback are readable."
  },
  {
    label: "Partner approval",
    subject: "Your Crelavo partner application update",
    audience: "Affiliate / partner applicants",
    body: "Hi {{name}},\n\nYour partner application has been reviewed. Please check your partner dashboard or reply if you need any payout detail updates.\n\nCommission remains subject to refund and payout rules.",
    smokeStep: "Send one partner review email and confirm referral / payout wording matches the current policy."
  },
  {
    label: "Refund / policy",
    subject: "Crelavo refund and cancellation policy reminder",
    audience: "Support / finance follow-up",
    body: "Hi {{name}},\n\nThis email summarizes the refund and cancellation rules for your current package. Please review the policy and the dashboard notes before replying.\n\nIf you need a manual review, reply to this message.",
    smokeStep: "Send one policy reminder email and confirm the refund wording matches the public refund policy."
  }
];

const resendSmokeChecklist = [
  "Verify RESEND_API_KEY exists in the active environment.",
  "Verify SUPPORT_FROM_EMAIL and SUPPORT_EMAIL are valid and branded.",
  "Confirm SPF, DKIM and DMARC are verified for the sender domain.",
  "Send one welcome email to an internal test inbox.",
  "Send one payment receipt email and confirm receipt wording.",
  "Send one production update email and confirm the support fallback.",
  "Send one partner approval email and confirm commission/payout wording.",
  "Send one refund policy reminder email and confirm policy language.",
  "Check that all links, reply-to details and subjects render correctly in the inbox.",
  "Record the test inbox addresses and results in the admin notes before launch."
];

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => hasEnv(name));
}

function item(label: string, env: string[], note: string, validation: string, optional = false): ChecklistItem {
  const ready = env.every((name) => hasEnv(name));
  return {
    label,
    status: ready ? "ready" : optional ? "optional" : "missing",
    env,
    note,
    validation
  };
}

function lemonVariantEnvNames() {
  return [
    "LEMON_VARIANT_PRO_MONTHLY",
    "LEMON_VARIANT_PRO_YEARLY",
    "LEMON_VARIANT_BUSINESS_MONTHLY",
    "LEMON_VARIANT_BUSINESS_YEARLY",
    "LEMON_VARIANT_ULTRA_MONTHLY",
    "LEMON_VARIANT_ULTRA_YEARLY",
    "LEMON_VARIANT_TEAM_MONTHLY",
    "LEMON_VARIANT_TEAM_YEARLY",
    "LEMON_VARIANT_TOPUP_STARTER_ONE_TIME",
    "LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME",
    "LEMON_VARIANT_TOPUP_BUSINESS_ONE_TIME"
  ];
}

function providerItem(): ChecklistItem {
  const provider = (process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "runway").toLowerCase();
  if (provider === "replicate") {
    return item("Selected video provider", ["REPLICATE_API_TOKEN"], "Replicate is selected for video/generation provider tests.", "Run one low-cost provider success production and confirm provider status polling.");
  }
  if (provider === "fal") {
    return {
      label: "Selected video provider",
      status: hasAnyEnv(["FAL_KEY", "FAL_API_KEY"]) ? "ready" : "missing",
      env: ["FAL_KEY or FAL_API_KEY"],
      note: "FAL is selected for video/generation provider tests.",
      validation: "Run one low-cost provider success production and confirm provider status polling."
    };
  }
  if (provider === "runway") {
    return item("Selected video provider", ["RUNWAY_API_KEY"], "Runway is selected for video/generation provider tests.", "Run one low-cost provider success production and confirm provider status polling.");
  }
  if (provider === "kling") {
    return item("Selected video provider", ["KLING_API_KEY"], "Kling is selected for video/generation provider tests.", "Run one low-cost provider success production and confirm provider status polling.");
  }
  return {
    label: "Selected video provider",
    status: "missing",
    env: ["VIDEO_PROVIDER"],
    note: `Unsupported provider selected: ${provider}`,
    validation: "Set VIDEO_PROVIDER/GENERATION_PROVIDER to replicate, fal, runway or kling."
  };
}

function groupStatus(items: ChecklistItem[]) {
  if (items.some((entry) => entry.status === "missing")) return "missing";
  if (items.some((entry) => entry.status === "pending")) return "pending";
  return "ready";
}

export function buildFinalApiChecklist() {
  const groups: ChecklistGroup[] = [
    {
      title: "App, admin and domain",
      description: "Production URL, owner routing and launch identity.",
      items: [
        item("Production app URL", ["NEXT_PUBLIC_APP_URL"], "Used for auth, emails, Lemon Squeezy redirects, callbacks and canonical links.", "Confirm NEXT_PUBLIC_APP_URL uses the final https://crelavo.com domain."),
        item("Admin and payment recipients", ["ADMIN_EMAIL", "PAYMENT_NOTIFICATION_EMAIL"], "Admin-only APIs and owner payment alerts need stable recipients.", "Open admin-only routes with ADMIN_EMAIL and confirm payment notifications route to the intended inbox.")
      ]
    },
    {
      title: "Supabase production access",
      description: "Auth, database, credits, production records and storage.",
      items: [
        item("Supabase browser client", ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], "Browser auth and safe public Supabase access.", "Register/login with a real confirmed test user."),
        item("Supabase server role", ["SUPABASE_SERVICE_ROLE_KEY"], "Server-only admin, credit and production operations.", "Create/cancel/admin-review a test production and confirm credit changes."),
        item("Storage buckets", ["SUPABASE_PROVIDER_ASSETS_BUCKET", "SUPABASE_USER_MATERIALS_BUCKET"], "Provider output and user material uploads need known buckets.", "Upload a test material and confirm provider output links remain accessible.", true)
      ]
    },
    {
      title: "Whop checkout, preview and webhook automation",
      description: "Active payment source, 24-hour preview lifecycle, verified events and credit entitlement safety.",
      items: [
        item("Whop API access", ["WHOP_API_KEY"], "Whop remains the active checkout, subscription and payment source for launch. API access is needed for reconciliation and account/payment lookup.", "Confirm Whop API lookup can find a test payment/subscription without exposing secret values."),
        item("Whop webhook secret", ["WHOP_WEBHOOK_SECRET"], "Webhook signatures protect payment, subscription, cancellation and preview lifecycle events.", "Send required Whop events to /api/webhooks/whop and confirm invalid signatures are rejected."),
        item("Active payment provider", ["PAYMENT_PROVIDER"], "Production must keep PAYMENT_PROVIDER=whop until a later migration is intentionally approved.", "Confirm /admin and checkout copy show Whop as the source of record, not Lemon or a mixed provider state."),
        item("Webhook idempotency and credit gate", ["WHOP_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY"], "Credits, preview access and subscription activation must be granted once per verified payment event, never from client checkout parameters.", "Replay the same test event and confirm duplicate credits, duplicate commissions and duplicate preview activation do not happen.")
      ]
    },
    {
      title: "Parked Lemon Squeezy fallback",
      description: "Code can remain present, but Lemon should not become the active payment path until Whop launch is stable.",
      items: [
        item("Lemon Squeezy API keys", ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID"], "Lemon is a parked/future fallback. Missing Lemon keys are not a Whop launch blocker while PAYMENT_PROVIDER=whop.", "Do not route live checkout to Lemon unless the owner intentionally starts a migration.", true),
        item("Lemon Squeezy webhook secret", ["LEMON_SQUEEZY_WEBHOOK_SECRET"], "Keep webhook code dormant unless Lemon becomes active later.", "If Lemon is tested later, send order_created and subscription events to /api/lemon-squeezy/webhook.", true),
        item("Lemon Squeezy package variant IDs", lemonVariantEnvNames(), "Variant IDs are future migration data, not required for the current Whop-first API day.", "Leave missing unless Lemon migration is scheduled after Whop/payment/provider launch is stable.", true)
      ]
    },
    {
      title: "Email delivery",
      description: "Support, login, payment and production-ready emails.",
      items: [
        item("Resend API key", ["RESEND_API_KEY"], "Transactional email delivery uses Resend.", "Send contact, login notification, payment receipt and production-ready test emails."),
        item("Support sender setup", ["SUPPORT_EMAIL", "SUPPORT_FROM_EMAIL"], "Customer-facing sender and reply-to identity.", "Confirm SPF, DKIM, DMARC and sender domain are verified before email E2E."),
        item("Partner application inbox", ["PARTNER_APPLICATION_EMAIL"], "Partner intake needs a destination inbox before creator outreach.", "Submit one partner application and confirm admin inbox receives it.", true)
      ]
    },
    {
      title: "First-phase AI and provider keys",
      description: "Initial launch provider plan: planning, video, image, voice/TTS, editing/render and storage/CDN with explicit cost and failure gates.",
      items: [
        item("OpenAI assistant/planning", ["OPENAI_API_KEY"], "Assistant chat, brief, production planning, script, strategy and prompt generation use OpenAI in the first API phase.", "Run Assistant Workspace planning with a real test user and confirm no provider fallback error."),
        providerItem(),
        item("Image generation provider", ["OPENAI_API_KEY"], "First phase image generation/editing uses OpenAI Images unless IMAGE_PROVIDER is changed later.", "Run one image generation/editing E2E after final API setup."),
        item("Voice/TTS provider", ["ELEVENLABS_API_KEY"], "Voice-over, narration, dubbing and ad voice flows need the first phase voice provider.", "Run one low-cost voice-over test."),
        item("Video editing/render provider", ["SHOTSTACK_API_KEY"], "Cut, trim, crop, subtitle burn-in, audio merge and final export automation need the render provider.", "Run one cut/crop/subtitle/export render test."),
        item("Provider routing selector", ["VIDEO_PROVIDER"], "A single primary provider should be explicit before live traffic; fallback routes can exist but must not silently spend without admin awareness.", "Open /api/providers/readiness and confirm selected provider, missing keys and fallback note are understandable.", true)
      ]
    },
    {
      title: "Growth automation fraud gates",
      description: "Referral credits, coupon hunt, share-to-earn, partner commission, checkout recovery and clean export must stay server-verified.",
      items: [
        item("Referral and reward ledger", ["SUPABASE_SERVICE_ROLE_KEY"], "Referral +100, upgrade +2,000, share-to-earn and case-study credits must be awarded from server/admin review paths only.", "Try a self-referral or duplicate event in staging and confirm no automatic credit is granted."),
        item("Partner commission review", ["SUPABASE_SERVICE_ROLE_KEY"], "Partner commission must remain pending until payment, refund, cancellation, chargeback and finance checks pass.", "Replay a payment/commission reference and confirm duplicate commission rows are blocked."),
        item("Checkout recovery email", ["RESEND_API_KEY", "SUPPORT_FROM_EMAIL"], "Abandoned checkout recovery can send only consent-safe, honest reminder email; no fake saved bonus, fake scarcity or guaranteed discount.", "Send one internal recovery email test and confirm opt-out/support fallback wording."),
        item("Watermark and clean-export gate", ["SHOTSTACK_API_KEY"], "Preview exports can carry Made with Crelavo AI watermark; watermark-free export must require paid eligibility.", "Run one preview-style render and confirm the clean export CTA does not unlock from client state alone.", true)
      ]
    }
  ];

  const groupsWithStatus = groups.map((group) => ({ ...group, status: groupStatus(group.items) }));
  const allItems = groups.flatMap((group) => group.items.map((entry) => ({ ...entry, group: group.title })));
  const missing = allItems.filter((entry) => entry.status === "missing");
  const ready = allItems.filter((entry) => entry.status === "ready" || entry.status === "optional");

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      readyCount: ready.length,
      missingCount: missing.length,
      totalCount: allItems.length,
      status: missing.length ? "blocked" : "ready_for_live_e2e"
    },
    nextMissing: missing.slice(0, 8),
    commands: [
      "npm run smoke:env-readiness",
      "npm run smoke",
      "npm run build",
      "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/assistant-conversation-smoke.mts",
      "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/non-payment-e2e-smoke.mts",
      "npm run smoke:security-privacy",
      "npm run smoke:final-api-env-checklist"
    ],
    liveE2EOrder: [
      "Confirm /admin/launch-readiness has no unexpected missing blocker.",
      "Open /admin/final-api-checklist and resolve Whop, Supabase service-role, Resend and selected provider blockers first.",
      "Confirm PAYMENT_PROVIDER=whop and never route live checkout to parked Lemon env by accident.",
      "Register/login with a real confirmed test user.",
      "Run Assistant Workspace planning.",
      "Start one production with enough credits or a test package.",
      "Run one Whop checkout/webhook test and verify preview activation, subscription mapping, idempotency and manual entitlement reconciliation.",
      "Verify customer receipt, owner/admin payment notification and support fallback emails.",
      "Complete one provider-success production and verify production-ready email plus delivery links.",
      "Force one provider failure/admin review path and confirm credits, delivery, retries and support messaging stay safe.",
      "Test cancellation visibility, clean-export eligibility, referral reward review and manual delivery update paths."
    ],
    stillBlockedUntilKeys: [
      "Real Whop checkout, webhook signature and subscription lifecycle E2E.",
      "Paid credit purchase, preview activation and manual entitlement reconciliation E2E.",
      "Resend production email delivery.",
      "Live domain redirects, auth callbacks and Search Console verification.",
      "Real AI/video provider success and forced-failure paths.",
      "Automatic referral/coupon/share-to-earn rewards and clean-export unlocks."
    ],
    apiAutomationReadinessGates,
    providerFailoverChecklist,
    resendEmailTemplates,
    resendSmokeChecklist,
    groups: groupsWithStatus
  };
}
