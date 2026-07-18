import { defaultPackageConfig } from "./package-config.ts";
import { lemonVariantEnvForProduct, type BillingMode } from "./payment-provider.ts";

type LaunchReadinessStatus = "ready" | "missing" | "pending" | "optional";

type LaunchReadinessItem = {
  label: string;
  status: LaunchReadinessStatus;
  required: string[];
  note: string;
  action: string;
};

type LaunchReadinessGroup = {
  title: string;
  description: string;
  items: LaunchReadinessItem[];
};

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => hasEnv(name));
}

function statusFor(required: string[], optional = false): LaunchReadinessStatus {
  if (optional && required.length === 0) return "optional";
  return required.every((name) => hasEnv(name)) ? "ready" : optional ? "optional" : "missing";
}

function item(label: string, required: string[], note: string, action: string, optional = false): LaunchReadinessItem {
  return {
    label,
    status: statusFor(required, optional),
    required,
    note,
    action
  };
}

function lemonPackageVariantEnvNames() {
  const config = defaultPackageConfig();
  return Array.from(new Set(config.creditPackages.flatMap((plan) => {
    const billingModes: BillingMode[] = plan.planType === "topup" || plan.planType === "production_one_time" ? ["one_time"] : ["monthly", "yearly"];
    return billingModes.map((billing) => lemonVariantEnvForProduct(plan.id, billing));
  })));
}

function lemonPackageVariantItem(): LaunchReadinessItem {
  const required = lemonPackageVariantEnvNames();
  const missing = required.filter((name) => !hasEnv(name));
  return {
    label: "Configured Lemon package variants",
    status: missing.length === 0 ? "ready" : "missing",
    required,
    note: missing.length === 0
      ? "Every configured subscription and top-up package has a Lemon Squeezy variant env value."
      : `Missing Lemon Squeezy variant env names: ${missing.join(", ")}. Secret values are never printed here. Direct checkout URLs can still be used as an early-launch fallback.`,
    action: "Use /admin/packages -> Check payment env to verify the active admin package config, then paste matching Lemon variant IDs or direct checkout URLs into local/Vercel env."
  };
}

function selectedVideoProvider() {
  return (process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "runway").toLowerCase();
}

function videoProviderItem(): LaunchReadinessItem {
  const provider = selectedVideoProvider();
  if (provider === "replicate") {
    return item("Replicate video provider", ["REPLICATE_API_TOKEN"], "Primary video/generation provider for controlled launch tests.", "Add REPLICATE_API_TOKEN and keep REPLICATE_MODEL set to the selected model.");
  }
  if (provider === "fal") {
    return {
      label: "FAL video provider",
      status: hasAnyEnv(["FAL_KEY", "FAL_API_KEY"]) ? "ready" : "missing",
      required: ["FAL_KEY or FAL_API_KEY"],
      note: "Alternative video provider selected through VIDEO_PROVIDER/GENERATION_PROVIDER.",
      action: "Add FAL_KEY or FAL_API_KEY and confirm FAL_VIDEO_MODEL."
    };
  }
  if (provider === "runway") {
    return item("Runway video provider", ["RUNWAY_API_KEY"], "Alternative video provider selected through VIDEO_PROVIDER/GENERATION_PROVIDER.", "Add RUNWAY_API_KEY and confirm RUNWAY_API_VERSION.");
  }
  if (provider === "kling") {
    return item("Kling video provider", ["KLING_API_KEY"], "Alternative video provider selected through VIDEO_PROVIDER/GENERATION_PROVIDER.", "Add KLING_API_KEY and provider endpoint URLs if required.");
  }
  return {
    label: "Video provider",
    status: "missing",
    required: ["VIDEO_PROVIDER"],
    note: `Unsupported provider selected: ${provider}`,
    action: "Set VIDEO_PROVIDER/GENERATION_PROVIDER to replicate, fal, runway or kling."
  };
}

function groupStatus(items: LaunchReadinessItem[]) {
  if (items.some((entry) => entry.status === "missing")) return "missing";
  if (items.some((entry) => entry.status === "pending")) return "pending";
  return "ready";
}

function isHardBlocker(entry: LaunchReadinessItem) {
  const label = entry.label.toLowerCase();
  return entry.status === "missing" && (
    label.includes("supabase") ||
    label.includes("lemon") ||
    label.includes("payment") ||
    label.includes("app url") ||
    label.includes("domain") ||
    label.includes("resend") ||
    label.includes("brain") ||
    label.includes("video provider") ||
    label.includes("security")
  );
}

function launchDayTimeline() {
  return [
    { phase: "T-7 days", owner: "Admin", action: "Confirm domain, SSL, Supabase, Lemon Squeezy test mode, Resend DNS, provider routing and admin package variant/direct checkout setup." },
    { phase: "T-3 days", owner: "Admin", action: "Run build, smoke tests, non-payment E2E, provider low-cost test and partner intake test." },
    { phase: "T-1 day", owner: "Admin", action: "Freeze public copy, confirm Product Hunt/Reddit copy, reduce provider concurrency and prepare rollback notes." },
    { phase: "Launch morning", owner: "Admin", action: "Run final health/API/provider readiness check, confirm Lemon Squeezy webhook, verify support inbox and open monitoring tabs." },
    { phase: "First traffic spike", owner: "Admin", action: "Watch errors, checkout, provider queue, API rate-limit responses, signup volume and support messages every 15 minutes." },
    { phase: "After 2 hours", owner: "Admin", action: "Review conversion, failures, provider spend, refund risk, partner applications and decide whether to scale traffic." }
  ];
}

function finalSetupSequence() {
  return [
    {
      step: "1",
      title: "Keep pre-API work frozen",
      status: "ready",
      owner: "Admin",
      action: "Do not add real API keys until code, SEO, partner intake, provider routing and launch checks are stable."
    },
    {
      step: "2",
      title: "Add production domain and app URL",
      status: hasEnv("NEXT_PUBLIC_APP_URL") ? "pending" : "missing",
      owner: "Admin / hosting",
      action: "Bind crelavo.com, enable SSL, then set NEXT_PUBLIC_APP_URL and retest auth/payment redirects."
    },
    {
      step: "3",
      title: "Connect Supabase production access",
      status: hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") && hasEnv("SUPABASE_SERVICE_ROLE_KEY") ? "ready" : "missing",
      owner: "Admin / Supabase",
      action: "Add browser-safe Supabase URL/anon key plus server-only service role key, then verify auth, credits and storage buckets."
    },
    {
      step: "4",
      title: "Connect Lemon Squeezy checkout and webhook",
      status: hasEnv("LEMON_SQUEEZY_API_KEY") && hasEnv("LEMON_SQUEEZY_STORE_ID") && hasEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") && lemonPackageVariantEnvNames().every((name) => hasEnv(name)) ? "ready" : "missing",
      owner: "Admin / Lemon Squeezy",
      action: "Add Lemon Squeezy API key, store ID, webhook secret and package variant IDs or direct checkout URLs. Run order/subscription webhook and manual entitlement reconciliation tests."
    },
    {
      step: "5",
      title: "Connect email delivery",
      status: hasEnv("RESEND_API_KEY") && hasEnv("SUPPORT_FROM_EMAIL") && hasEnv("ADMIN_EMAIL") ? "ready" : "missing",
      owner: "Admin / Resend",
      action: "Verify sender DNS, then test contact, login notification, partner application and payment notification emails."
    },
    {
      step: "6",
      title: "Connect first-phase AI/provider keys last",
      status: hasEnv("OPENAI_API_KEY") && videoProviderItem().status === "ready" && hasEnv("ELEVENLABS_API_KEY") && hasEnv("SHOTSTACK_API_KEY") ? "ready" : "pending",
      owner: "Admin / providers",
      action: "Add OpenAI, Runway/video, image, Voice/TTS and video editing/render keys, set usage limits and run one low-cost real provider job."
    }
  ];
}

function finalValidationPlan() {
  return [
    { label: "Build and static route check", command: "npm run build", result: "Must pass before every launch attempt." },
    { label: "SEO and public brand smoke", command: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/seo-brand-smoke.mts", result: "Confirms public SEO/service/free-tool surfaces stay safe." },
    { label: "Assistant flow smoke", command: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/assistant-conversation-smoke.mts", result: "Confirms assistant smoke-sensitive copy and flow still work." },
    { label: "Non-payment E2E smoke", command: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/non-payment-e2e-smoke.mts", result: "Confirms non-payment launch paths before real APIs." },
    { label: "Security/privacy smoke", command: "npm run smoke:security-privacy", result: "Confirms private routes stay noindex and sitemap stays public-only." },
    { label: "Final API/env checklist smoke", command: "npm run smoke:final-api-env-checklist", result: "Confirms final setup docs still include required env/test gates." }
  ];
}

function monitoringAndRollbackPlan() {
  return [
    { label: "Error monitoring", status: "pending", action: "Keep server logs, browser console, provider API failures and Lemon Squeezy webhook errors open during the first traffic spike." },
    { label: "Cost guard", status: hasEnv("BULK_GENERATION_CONCURRENCY") ? "ready" : "pending", action: "Keep video/provider concurrency conservative and require credits before expensive jobs run." },
    { label: "Checkout guard", status: hasEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") ? "pending" : "missing", action: "Watch Lemon order/subscription events, failed payments, duplicate manual activations and webhook signature failures." },
    { label: "Support guard", status: hasEnv("SUPPORT_EMAIL") && hasEnv("ADMIN_EMAIL") ? "ready" : "missing", action: "Keep support inbox and admin email active; respond quickly to payment/provider failures." },
    { label: "Rollback rule", status: "pending", action: "If checkout, auth or provider jobs fail repeatedly, pause paid/provider entry points and keep only public browsing/free tools open." }
  ];
}

export function buildLaunchReadiness() {
  const groups: LaunchReadinessGroup[] = [
    {
      title: "Current launch gate",
      description: "Non-payment code checks can be ready while Lemon Squeezy and domain ownership are still pending.",
      items: [
        {
          label: "Non-payment launch checks",
          status: "ready",
          required: ["npm run smoke", "npm run build", "non-payment E2E smoke"],
          note: "Smoke, build and non-payment dry-run checks can pass before Lemon Squeezy/domain details are available.",
          action: "Continue non-payment manual E2E and keep payment/provider live tests blocked until real keys are added."
        },
        {
          label: "Lemon Squeezy details",
          status: hasEnv("LEMON_SQUEEZY_API_KEY") && hasEnv("LEMON_SQUEEZY_STORE_ID") && hasEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") && lemonPackageVariantEnvNames().every((name) => hasEnv(name)) ? "ready" : "pending",
          required: ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET", ...lemonPackageVariantEnvNames()],
          note: "Lemon Squeezy details and package variant IDs are required before full API checkout, webhook and paid-credit reconciliation tests can run.",
          action: "Add Lemon Squeezy API key, store ID, webhook secret and every configured subscription/top-up variant ID or direct checkout URL when the Lemon account is ready."
        },
        {
          label: "Domain details",
          status: hasEnv("NEXT_PUBLIC_APP_URL") && process.env.NEXT_PUBLIC_APP_URL?.includes("crelavo.com") ? "pending" : "pending",
          required: ["crelavo.com DNS", "SSL", "hosting domain binding"],
          note: "Domain ownership/hosting details are not available yet, so live redirects, SSL, Resend DNS and Search Console checks remain pending.",
          action: "Connect the domain, enable SSL, then verify auth redirects, Lemon Squeezy redirects, webhook URL and Resend DNS."
        }
      ]
    },
    {
      title: "Core app and domain",
      description: "Public URL, deployment target and production identity.",
      items: [
        item("App URL", ["NEXT_PUBLIC_APP_URL"], "Production links, emails, Lemon Squeezy redirects and provider callbacks use this domain.", "Set NEXT_PUBLIC_APP_URL=https://crelavo.com."),
        {
          label: "Domain and SSL",
          status: hasEnv("NEXT_PUBLIC_APP_URL") ? "pending" : "missing",
          required: ["DNS / SSL"],
          note: "The code can be ready before DNS propagation, but live auth/payment/email checks require the domain to resolve with SSL.",
          action: "Connect crelavo.com to hosting, enable SSL and verify the live URL."
        }
      ]
    },
    {
      title: "Supabase",
      description: "Auth, database, credit balances, production requests and user materials.",
      items: [
        item("Supabase public client", ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], "Frontend auth and browser-safe data access require the URL and publishable/anon key.", "Add Supabase API URL and publishable key."),
        item("Supabase server access", ["SUPABASE_SERVICE_ROLE_KEY"], "Server routes need service role access for production creation, admin operations and credit updates.", "Add SUPABASE_SERVICE_ROLE_KEY only as a server secret."),
        item("Storage buckets", ["SUPABASE_PROVIDER_ASSETS_BUCKET"], "Provider assets bucket is configured by env; user-materials falls back to the default bucket when not set.", "Confirm provider-assets and user-materials buckets exist in Supabase.")
      ]
    },
    {
      title: "Lemon Squeezy payments",
      description: "Subscriptions, one-time top-ups, checkout and webhook notifications.",
      items: [
        item("Lemon Squeezy API keys", ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID"], "API checkout cannot run without Lemon Squeezy API key and store ID. Direct checkout URLs can still support early manual activation.", "Add Lemon Squeezy API key and store ID from the same account."),
        item("Lemon Squeezy webhook", ["LEMON_SQUEEZY_WEBHOOK_SECRET"], "Payment receipt, admin payment alerts, renewals and failures depend on signed webhook events.", "Create webhook endpoint /api/lemon-squeezy/webhook and add the signing secret."),
        lemonPackageVariantItem(),
        {
          label: "Admin package payment readiness",
          status: "pending",
          required: ["/admin/packages", "/api/admin/stripe-readiness"],
          note: "Launch readiness uses the default package env map; the active admin package config can be checked from the package editor without exposing secrets. The legacy route name is kept for admin compatibility.",
          action: "Open /admin/packages, enter ADMIN_EMAIL, click Check payment env, then add any listed Lemon env names or direct checkout URLs to local/Vercel."
        }
      ]
    },
    {
      title: "Email delivery",
      description: "Customer receipts, owner payment alerts, login notices, contact form and production-ready emails.",
      items: [
        item("Resend API key", ["RESEND_API_KEY"], "Transactional email helpers use Resend for all production email flows.", "Add RESEND_API_KEY after creating the sending key."),
        item("Support and admin email routing", ["SUPPORT_EMAIL", "SUPPORT_FROM_EMAIL", "ADMIN_EMAIL", "PAYMENT_NOTIFICATION_EMAIL"], "Support sender, owner notifications and payment alerts need stable addresses.", "Use verified crelavo.com sender addresses once DNS is verified."),
        {
          label: "Resend DNS verification",
          status: hasEnv("RESEND_API_KEY") ? "pending" : "missing",
          required: ["SPF / DKIM / DMARC DNS"],
          note: "API key can exist before DNS verification, but deliverability requires domain DNS records.",
          action: "Add Resend DNS records at the domain provider and wait for verified status."
        }
      ]
    },
    {
      title: "First-phase AI and provider production",
      description: "First phase automated production covers OpenAI assistant/planning, Runway/video, image generation, Voice/TTS and video editing/render services.",
      items: [
        {
          label: "OpenAI assistant/planning",
          status: hasEnv("OPENAI_API_KEY") ? "ready" : "pending",
          required: ["OPENAI_API_KEY", "provider billing", "usage/rate limits"],
          note: "The first phase assistant, brief, production planning, script, strategy and prompt generation use OpenAI.",
          action: "After pre-API launch cleanup, add OPENAI_API_KEY, confirm billing/limits and run manual assistant E2E before public launch."
        },
        videoProviderItem(),
        {
          label: "Image generation provider",
          status: hasEnv("OPENAI_API_KEY") ? "ready" : "pending",
          required: ["OPENAI_API_KEY", "OPENAI_IMAGE_MODEL"],
          note: "First phase image generation/editing uses OpenAI Images unless IMAGE_PROVIDER is changed later.",
          action: "Run one image generation/editing E2E after final API setup."
        },
        {
          label: "Provider routing map",
          status: "pending",
          required: ["/admin/providers", "/api/providers/readiness", "final model choices"],
          note: "Provider/UI routing is prepared before API keys are entered, so final setup should only require choosing models, adding keys and running E2E tests.",
          action: "Open /admin/providers, confirm brain/video/image/voice/render/email/payment routing, then add keys during final setup."
        },
        item("Voice/TTS provider", ["ELEVENLABS_API_KEY"], "Voice-over, narration, dubbing and ad voice features need the first phase voice provider.", "Add the voice provider key and run one low-cost voice-over E2E."),
        item("Video editing/render provider", ["SHOTSTACK_API_KEY"], "Cut, trim, crop, resize, subtitles, audio merge and final export automation need the render provider.", "Add render provider key and run one cut/crop/subtitle/export E2E.")
      ]
    },
    {
      title: "Safe launch capacity policy",
      description: "Initial concurrency rules that protect provider balance, user experience and launch stability.",
      items: [
        {
          label: "Public website traffic",
          status: "pending",
          required: ["hosting / CDN / SSL"],
          note: "Public pages can handle much more traffic than real AI/video jobs because most browsing is static or lightweight.",
          action: "Open public traffic after domain, SSL and smoke/build checks pass."
        },
        {
          label: "Assistant and brief concurrency",
          status: "pending",
          required: ["OPENAI_API_KEY / usage limits"],
          note: "Keep assistant/brief generation open but watch OpenAI usage limits and monthly spend.",
          action: "Start with controlled assistant usage and review usage during the first launch week."
        },
        {
          label: "Video provider active jobs",
          status: "pending",
          required: ["Replicate billing / provider limits"],
          note: "Safe launch target is 1-5 active video jobs. Jumping to 50 active jobs can trigger provider rate limits, queue delays, failures and a fast balance burn.",
          action: "Keep launch concurrency low, then scale gradually after real cost and failure-rate data is known."
        },
        {
          label: "Bulk generation concurrency",
          status: hasEnv("BULK_GENERATION_CONCURRENCY") ? "ready" : "pending",
          required: ["BULK_GENERATION_CONCURRENCY"],
          note: "Bulk jobs should stay limited during launch; video-heavy batches must not start unlimited provider jobs.",
          action: "Use a conservative concurrency value and require paid credits for provider tests."
        }
      ]
    },
    {
      title: "Launch traffic and rate-limit readiness",
      description: "Product Hunt, Reddit and social launch traffic should not overload hosting, queues or AI provider limits.",
      items: [
        {
          label: "Launch surge plan",
          status: "pending",
          required: ["Vercel/hosting capacity", "CDN/cache review", "2k-3k visitor launch scenario"],
          note: "Public pages are mostly static, but launch-day traffic still needs a hosting and cache check before Product Hunt, Reddit or influencer pushes.",
          action: "Before launch day, verify hosting limits, cache static pages, keep heavy provider jobs behind credits/queue and monitor errors during the first traffic spike."
        },
        {
          label: "AI provider rate-limit plan",
          status: hasAnyEnv(["ANTHROPIC_API_KEY", "OPENAI_API_KEY"]) ? "pending" : "missing",
          required: ["Claude/OpenAI usage tier", "rate-limit review", "fallback/queue behavior"],
          note: "Claude/OpenAI may rate-limit assistant or production planning if a launch spike creates too many simultaneous requests.",
          action: "After choosing the provider, request higher limits if needed, keep user-facing retries graceful and queue heavy jobs instead of failing silently."
        },
        {
          label: "Provider queue and spend guard",
          status: hasEnv("BULK_GENERATION_CONCURRENCY") ? "ready" : "pending",
          required: ["concurrency cap", "credit gate", "provider balance guard"],
          note: "Launch traffic should not create unlimited AI/video jobs or burn provider balance unexpectedly.",
          action: "Keep conservative concurrency, require credits for expensive jobs and review provider failures/cost daily during launch week."
        },
        {
          label: "Partner program intake and payout readiness",
          status: hasAnyEnv(["PARTNER_APPLICATION_EMAIL", "RESEND_API_KEY"]) ? "pending" : "missing",
          required: ["PARTNER_APPLICATION_EMAIL", "RESEND_API_KEY", "affiliate tracking/payout provider"],
          note: "Partner pages and admin workflow are prepared, but live creator applications and commission payouts need email delivery plus Lemon Squeezy or affiliate tracking.",
          action: "Before starting the partner program, set application inbox, choose final commission percent, connect tracking provider and run one referral-to-paid-conversion test."
        }
      ]
    },
    {
      title: "Operations and protection",
      description: "Manual checks that must be completed before live traffic.",
      items: [
        {
          label: "Manual E2E checklist",
          status: "pending",
          required: ["docs/manual-e2e-checklist.md"],
          note: "Smoke/build can pass before real user, payment and provider checks are completed.",
          action: "Run the checklist with a real confirmed test user after env setup."
        },
        {
          label: "Security and abuse review",
          status: "pending",
          required: ["RLS / rate limits / webhook signatures"],
          note: "Before public launch, review Supabase RLS, upload limits, auth redirects, private env exposure and Lemon Squeezy signature checks.",
          action: "Complete final security review and block private/admin/API routes from indexing."
        }
      ]
    }
  ];

  const groupsWithStatus = groups.map((entry) => ({ ...entry, status: groupStatus(entry.items) }));
  const totalItems = groups.flatMap((entry) => entry.items);
  const readyCount = totalItems.filter((entry) => entry.status === "ready" || entry.status === "optional").length;
  const missingCount = totalItems.filter((entry) => entry.status === "missing").length;
  const pendingCount = totalItems.filter((entry) => entry.status === "pending").length;
  const hardBlockers = groups.flatMap((group) => group.items.filter(isHardBlocker).map((item) => ({ group: group.title, ...item })));
  const softBlockers = groups.flatMap((group) => group.items.filter((item) => item.status === "pending").map((item) => ({ group: group.title, ...item })));
  const missingButNotHard = groups.flatMap((group) => group.items.filter((item) => item.status === "missing" && !isHardBlocker(item)).map((item) => ({ group: group.title, ...item })));
  const canOpenPublicSite = hardBlockers.length === 0 && groupsWithStatus.find((group) => group.title === "Core app and domain")?.status !== "missing";
  const canTakePayments = hasEnv("LEMON_SQUEEZY_API_KEY") && hasEnv("LEMON_SQUEEZY_STORE_ID") && hasEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") && lemonPackageVariantEnvNames().every((name) => hasEnv(name));
  const canRunRealAiJobs = hasAnyEnv(["ANTHROPIC_API_KEY", "OPENAI_API_KEY"]) && videoProviderItem().status === "ready";
  const canRunPartnerIntake = hasEnv("RESEND_API_KEY") && hasEnv("PARTNER_APPLICATION_EMAIL");
  const goNoGo = hardBlockers.length > 0
    ? "NO_GO"
    : !canTakePayments || !canRunRealAiJobs
      ? "SOFT_LAUNCH_ONLY"
      : softBlockers.length > 0
        ? "GO_WITH_MONITORING"
        : "GO";
  const nextCriticalActions = [
    ...hardBlockers.slice(0, 4).map((entry) => ({ priority: "Hard blocker", group: entry.group, label: entry.label, action: entry.action })),
    ...softBlockers.slice(0, Math.max(0, 6 - Math.min(hardBlockers.length, 4))).map((entry) => ({ priority: "Soft blocker", group: entry.group, label: entry.label, action: entry.action }))
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      status: missingCount > 0 ? "blocked" : pendingCount > 0 ? "pending_manual_checks" : "ready",
      goNoGo,
      readyCount,
      missingCount,
      pendingCount,
      hardBlockerCount: hardBlockers.length,
      softBlockerCount: softBlockers.length,
      totalCount: totalItems.length
    },
    launchModes: [
      { label: "Public browsing", ready: canOpenPublicSite, note: canOpenPublicSite ? "Public pages can open after final domain/SSL confirmation." : "Domain/core app blockers still prevent public launch." },
      { label: "Paid checkout", ready: canTakePayments, note: canTakePayments ? "Lemon Squeezy checkout/webhook/variants are configured." : "Keep checkout blocked or use admin-approved direct checkout URLs until Lemon Squeezy API key, store ID, webhook secret and variant IDs are set." },
      { label: "Real AI/provider jobs", ready: canRunRealAiJobs, note: canRunRealAiJobs ? "Brain and selected video provider are ready for controlled jobs." : "Keep production in safe planning/demo mode until brain + video provider keys and tests are done." },
      { label: "Partner intake", ready: canRunPartnerIntake, note: canRunPartnerIntake ? "Partner application email intake can run." : "Partner page can stay visible, but live intake needs Resend + PARTNER_APPLICATION_EMAIL." }
    ],
    blockerBoard: {
      hardBlockers,
      softBlockers,
      missingButNotHard
    },
    nextCriticalActions,
    finalSetupSequence: finalSetupSequence(),
    finalValidationPlan: finalValidationPlan(),
    monitoringAndRollbackPlan: monitoringAndRollbackPlan(),
    launchDayTimeline: launchDayTimeline(),
    groups: groupsWithStatus
  };
}
