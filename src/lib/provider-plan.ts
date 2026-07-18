import { paymentProviderName } from "./payment-provider";

export type ProviderPlanStatus = "ready" | "missing" | "pending" | "optional";

export type ProviderPlanItem = {
  id: string;
  label: string;
  category: "brain" | "video" | "image" | "voice" | "render" | "email" | "payment" | "storage";
  provider: string;
  primaryModel: string;
  fallbackModels: string[];
  intendedUse: string;
  requiredEnv: string[];
  optionalEnv: string[];
  status: ProviderPlanStatus;
  safeMode: string;
  finalSetup: string;
};

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => hasEnv(name));
}

function selectedVideoProvider() {
  return (process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "runway").toLowerCase();
}

function selectedBrainProvider() {
  return "openai";
}

function selectedImageProvider() {
  return (process.env.IMAGE_PROVIDER || "openai").toLowerCase();
}

function requiredStatus(requiredEnv: string[], optional = false): ProviderPlanStatus {
  if (requiredEnv.length === 0 && optional) return "optional";
  if (requiredEnv.every((name) => hasEnv(name))) return "ready";
  return optional ? "optional" : "missing";
}

function brainPlan(): ProviderPlanItem {
  return {
    id: "brain-openai",
    label: "OpenAI assistant and planning",
    category: "brain",
    provider: "OpenAI",
    primaryModel: process.env.OPENAI_REASONING_MODEL || "o3-mini",
    fallbackModels: ["gpt-4o", "OpenAI fast model"],
    intendedUse: "Assistant chat, production brief planning, script, strategy, prompt generation and revision understanding.",
    requiredEnv: ["OPENAI_API_KEY"],
    optionalEnv: ["OPENAI_REASONING_MODEL", "OPENAI_FAST_MODEL"],
    status: requiredStatus(["OPENAI_API_KEY"]),
    safeMode: "If OpenAI is missing, keep structured local/mock planning and block real paid AI reasoning until final setup.",
    finalSetup: "Add OPENAI_API_KEY, confirm billing/rate limits, set reasoning/fast model envs, then run assistant manual E2E."
  };
}

function videoPlan(): ProviderPlanItem {
  const provider = selectedVideoProvider();
  if (provider === "fal") {
    return {
      id: "video-fal",
      label: "Video generation",
      category: "video",
      provider: "FAL",
      primaryModel: process.env.FAL_VIDEO_MODEL || "fal-ai/wan/v2.2-a14b/text-to-video/turbo",
      fallbackModels: ["Replicate WAN 2.2", "Kling", "Runway"],
      intendedUse: "Low-cost test clips, social video drafts, image-to-video/text-to-video generation and provider preflight.",
      requiredEnv: ["FAL_KEY or FAL_API_KEY"],
      optionalEnv: ["VIDEO_PROVIDER", "FAL_VIDEO_MODEL", "BULK_GENERATION_CONCURRENCY"],
      status: hasAnyEnv(["FAL_KEY", "FAL_API_KEY"]) ? "ready" : "missing",
      safeMode: "If FAL is missing, production can create dashboard records and delivery plans, but real video jobs stay waiting_provider_config.",
      finalSetup: "Add FAL key, choose video model, run 5-second provider test, then raise concurrency slowly."
    };
  }
  if (provider === "kling") {
    return {
      id: "video-kling",
      label: "Video generation",
      category: "video",
      provider: "Kling",
      primaryModel: process.env.KLING_MODEL || "kling_text2video",
      fallbackModels: ["Replicate WAN 2.2", "FAL WAN", "Runway"],
      intendedUse: "High-quality social videos, product clips, image-to-video and text-to-video generation.",
      requiredEnv: ["KLING_API_KEY"],
      optionalEnv: ["VIDEO_PROVIDER", "KLING_API_URL", "KLING_STATUS_API_URL", "KLING_MODEL"],
      status: requiredStatus(["KLING_API_KEY"]),
      safeMode: "If Kling is missing, keep provider jobs blocked behind waiting_provider_config and use manual/demo delivery only.",
      finalSetup: "Add Kling key/endpoints, run one low-cost test, verify status polling and failed-job credit handling."
    };
  }
  if (provider === "runway") {
    return {
      id: "video-runway",
      label: "Video generation",
      category: "video",
      provider: "Runway",
      primaryModel: process.env.RUNWAY_MODEL || "runway_image_to_video",
      fallbackModels: ["Replicate WAN 2.2", "FAL WAN", "Kling"],
      intendedUse: "Image-to-video and short cinematic video tasks after provider/API setup.",
      requiredEnv: ["RUNWAY_API_KEY"],
      optionalEnv: ["VIDEO_PROVIDER", "RUNWAY_API_VERSION", "RUNWAY_MODEL"],
      status: requiredStatus(["RUNWAY_API_KEY"]),
      safeMode: "If Runway is missing, block real video jobs and keep the dashboard in provider-ready planning mode.",
      finalSetup: "Add Runway key/version, verify task creation/status polling and run low-cost test."
    };
  }
  return {
    id: "video-replicate",
    label: "Video generation",
    category: "video",
    provider: "Replicate",
    primaryModel: process.env.REPLICATE_MODEL || "wan-video/wan-2.2-t2v-fast",
    fallbackModels: ["FAL WAN", "Kling", "Runway"],
    intendedUse: "Controlled launch video tests, low-cost 5-second clips and standard video generation before scaling.",
    requiredEnv: ["REPLICATE_API_TOKEN"],
    optionalEnv: ["VIDEO_PROVIDER", "REPLICATE_MODEL", "REPLICATE_VIDEO_VERSION", "BULK_GENERATION_CONCURRENCY"],
    status: requiredStatus(["REPLICATE_API_TOKEN"]),
    safeMode: "If Replicate is missing, production requests can be created but real provider jobs remain waiting_provider_config.",
    finalSetup: "Add REPLICATE_API_TOKEN, confirm selected model/version, run low-cost test and monitor cost/failures."
  };
}

function imagePlan(): ProviderPlanItem {
  const provider = selectedImageProvider();
  const openAi = provider === "openai";
  const requiredEnv = openAi ? ["OPENAI_API_KEY"] : ["REPLICATE_API_TOKEN"];
  return {
    id: openAi ? "image-openai" : "image-replicate",
    label: "Image generation and editing",
    category: "image",
    provider: openAi ? "OpenAI Images" : "Replicate image provider",
    primaryModel: openAi ? (process.env.OPENAI_IMAGE_MODEL || "gpt-image-1") : (process.env.REPLICATE_IMAGE_MODEL || "provider-selected-image-model"),
    fallbackModels: openAi ? ["Replicate image provider"] : ["OpenAI Images"],
    intendedUse: "Product visuals, brand images, ad concepts, thumbnails, image edits and visual packages.",
    requiredEnv,
    optionalEnv: ["IMAGE_PROVIDER", "OPENAI_IMAGE_MODEL", "REPLICATE_IMAGE_MODEL"],
    status: requiredStatus(requiredEnv),
    safeMode: "If image provider is missing, keep visual requests blocked behind credit-safe planning/admin delivery instead of starting real image jobs.",
    finalSetup: "Choose image provider, add key/model env, then run one image generation/editing E2E."
  };
}

function paymentPlan(): ProviderPlanItem {
  const provider = paymentProviderName();

  if (provider === "whop") {
    return {
      id: "payment-whop",
      label: "Payments and credits",
      category: "payment",
      provider: "Whop",
      primaryModel: "checkout_webhook_reconcile",
      fallbackModels: ["Admin manual credit activation", "Controlled payment review"],
      intendedUse: "Whop checkout, payment/subscription reconciliation, controlled credit activation, duplicate-payment protection and admin fallback.",
      requiredEnv: ["PAYMENT_PROVIDER=whop", "WHOP_API_KEY", "WHOP_WEBHOOK_SECRET"],
      optionalEnv: ["PAYMENT_NOTIFICATION_EMAIL", "Whop plan IDs in /admin/packages"],
      status: process.env.PAYMENT_PROVIDER === "whop" && hasEnv("WHOP_API_KEY") && hasEnv("WHOP_WEBHOOK_SECRET") ? "ready" : "missing",
      safeMode: "If Whop keys are missing, keep checkout/payment automation blocked and use admin-reviewed manual credit activation only.",
      finalSetup: "Confirm PAYMENT_PROVIDER=whop, WHOP_API_KEY and WHOP_WEBHOOK_SECRET in production; run live Whop payment, webhook and idempotency checks."
    };
  }

  if (provider === "lemon_squeezy" || provider === "lemonsqueezy" || provider === "lemon") {
    return {
      id: "payment-lemon",
      label: "Payments and credits",
      category: "payment",
      provider: "Lemon Squeezy",
      primaryModel: "checkout_webhook",
      fallbackModels: ["Direct checkout URL", "Manual/admin credit review"],
      intendedUse: "Future Lemon Squeezy checkout, webhook reconciliation and credit activation after the later application/migration phase.",
      requiredEnv: ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET"],
      optionalEnv: ["LEMON_VARIANT_*", "LEMON_CHECKOUT_URL_*", "PAYMENT_NOTIFICATION_EMAIL"],
      status: requiredStatus(["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET"]),
      safeMode: "If Lemon is missing, keep Lemon checkout disabled and use the active payment provider/manual review path.",
      finalSetup: "Complete Lemon application first, then add API/store/webhook/variant envs and run checkout/webhook E2E."
    };
  }

  return {
    id: "payment-stripe",
    label: "Payments and credits",
    category: "payment",
    provider: "Stripe",
    primaryModel: "checkout_webhook",
    fallbackModels: ["Stripe Payment Links", "Manual/admin credit review"],
    intendedUse: "Legacy/fallback subscriptions, one-time top-ups, credit activation and paid conversion attribution.",
    requiredEnv: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    optionalEnv: ["STRIPE_PRICE_*", "PAYMENT_NOTIFICATION_EMAIL", "Stripe Payment Links in /admin/packages"],
    status: requiredStatus(["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]),
    safeMode: "If Stripe API keys are missing, do not use Stripe API checkout; keep legacy/manual payment review only.",
    finalSetup: "Only use this path if Stripe becomes active again; otherwise keep Whop as the current payment source of record."
  };
}

export function buildProviderPlan() {
  const plans: ProviderPlanItem[] = [
    brainPlan(),
    imagePlan(),
    videoPlan(),
    {
      id: "voice-elevenlabs",
      label: "Voice/TTS production",
      category: "voice",
      provider: "ElevenLabs / Voice provider",
      primaryModel: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      fallbackModels: ["Manual voiceover upload", "Provider-disabled delivery"],
      intendedUse: "Voice-over, narration, ad voice, dubbing and talking-video audio tracks.",
      requiredEnv: ["ELEVENLABS_API_KEY"],
      optionalEnv: ["ELEVENLABS_MODEL_ID", "ELEVENLABS_VOICE_ID", "ELEVENLABS_SOCIAL_VOICE_ID", "ELEVENLABS_MALE_VOICE_ID"],
      status: requiredStatus(["ELEVENLABS_API_KEY"]),
      safeMode: "If ElevenLabs is missing, voice workflows stay as script/direction deliverables or user-uploaded audio.",
      finalSetup: "Add ElevenLabs key, choose default voices, run one voiceover and one dubbing/lip-sync test."
    },
    {
      id: "render-shotstack",
      label: "Video editing/render",
      category: "render",
      provider: "Shotstack / render provider",
      primaryModel: "render_api",
      fallbackModels: ["Manual package delivery", "Provider-native output only"],
      intendedUse: "Video cut, trim, crop, resize, extension handoff, subtitle burn-in, audio merge, export packages and final render automation.",
      requiredEnv: ["SHOTSTACK_API_KEY"],
      optionalEnv: ["SHOTSTACK_OWNER_ID", "SHOTSTACK_STAGE"],
      status: requiredStatus(["SHOTSTACK_API_KEY"]),
      safeMode: "If render provider is missing, keep provider-native output and dashboard delivery package fields; do not promise automated editing/render.",
      finalSetup: "Add Shotstack/render key, render one cut/crop/subtitle/export test, verify final delivery link."
    },
    {
      id: "email-resend",
      label: "Transactional email",
      category: "email",
      provider: "Resend",
      primaryModel: "email_api",
      fallbackModels: ["Dashboard-only notifications"],
      intendedUse: "Contact forms, partner applications, payment alerts, login notices and production-ready emails.",
      requiredEnv: ["RESEND_API_KEY"],
      optionalEnv: ["SUPPORT_EMAIL", "SUPPORT_FROM_EMAIL", "ADMIN_EMAIL", "PARTNER_APPLICATION_EMAIL"],
      status: requiredStatus(["RESEND_API_KEY"]),
      safeMode: "If Resend is missing, forms return configuration errors and dashboard-only workflows remain available.",
      finalSetup: "Add Resend key/sender envs, verify SPF/DKIM/DMARC and send one test email."
    },
    paymentPlan()
  ];

  const readyCount = plans.filter((plan) => plan.status === "ready" || plan.status === "optional").length;
  const missingCount = plans.filter((plan) => plan.status === "missing").length;
  const pendingCount = plans.filter((plan) => plan.status === "pending").length;

  return {
    generatedAt: new Date().toISOString(),
    selected: {
      brainProvider: selectedBrainProvider(),
      videoProvider: selectedVideoProvider(),
      imageProvider: selectedImageProvider()
    },
    summary: {
      status: missingCount > 0 ? "blocked" : pendingCount > 0 ? "pending" : "ready",
      readyCount,
      missingCount,
      pendingCount,
      totalCount: plans.length
    },
    plans
  };
}
