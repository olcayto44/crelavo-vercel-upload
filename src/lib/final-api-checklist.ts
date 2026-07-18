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
      title: "Lemon Squeezy checkout and package variants",
      description: "Paid plans, top-ups, webhook events and manual entitlement reconciliation.",
      items: [
        item("Lemon Squeezy API keys", ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID"], "API checkout requires Lemon Squeezy API and store identifiers. Direct checkout URLs can be used as a safe early-launch fallback.", "Run one Lemon Squeezy test checkout from pricing or dashboard payment."),
        item("Lemon Squeezy webhook secret", ["LEMON_SQUEEZY_WEBHOOK_SECRET"], "Webhook signatures protect payment receipt/admin notification events.", "Send order_created and subscription events to /api/lemon-squeezy/webhook."),
        item("Lemon Squeezy package variant IDs", lemonVariantEnvNames(), "Every admin package needs a matching Lemon variant ID for API checkout. Early launch can use direct Lemon checkout URLs from /admin/packages instead.", "Open /admin/packages, click Check payment env and confirm either direct checkout links are configured or missing env names are resolved.")
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
      description: "Initial 9-service launch plan: OpenAI, Runway/video, image generation, Voice/TTS, video editing/render, Lemon Squeezy, Supabase, Resend and Storage/CDN.",
      items: [
        item("OpenAI assistant/planning", ["OPENAI_API_KEY"], "Assistant chat, brief, production planning, script, strategy and prompt generation use OpenAI in the first API phase.", "Run Assistant Workspace planning with a real test user and confirm no provider fallback error."),
        providerItem(),
        item("Image generation provider", ["OPENAI_API_KEY"], "First phase image generation/editing uses OpenAI Images unless IMAGE_PROVIDER is changed later.", "Run one image generation/editing E2E after final API setup."),
        item("Voice/TTS provider", ["ELEVENLABS_API_KEY"], "Voice-over, narration, dubbing and ad voice flows need the first phase voice provider.", "Run one low-cost voice-over test."),
        item("Video editing/render provider", ["SHOTSTACK_API_KEY"], "Cut, trim, crop, subtitle burn-in, audio merge and final export automation need the render provider.", "Run one cut/crop/subtitle/export render test.")
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
      "Open /admin/packages and confirm Check payment env returns no unexpected missing Lemon variant/direct checkout values.",
      "Register/login with a real confirmed test user.",
      "Run Assistant Workspace planning.",
      "Start one production with enough credits or a test package.",
      "Run one Lemon Squeezy checkout and verify order/subscription notification plus manual entitlement reconciliation.",
      "Verify customer receipt and owner/admin payment notification emails.",
      "Complete one provider-success production and verify production-ready email plus delivery links.",
      "Test cancellation, provider failure/admin review and manual delivery update paths."
    ],
    stillBlockedUntilKeys: [
      "Real Lemon Squeezy checkout and webhook E2E.",
      "Paid credit purchase, subscription event and manual entitlement reconciliation E2E.",
      "Resend production email delivery.",
      "Live domain redirects, auth callbacks and Search Console verification.",
      "Real AI/video provider success path."
    ],
    groups: groupsWithStatus
  };
}
