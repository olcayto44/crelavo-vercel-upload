import { buildMusicProviderRoute } from "./music-provider-routing";
import { paymentProviderName } from "./payment-provider";
import { hasAnyConfiguredEnv, hasConfiguredEnv, hasProviderEnv, optionalEnv } from "./providers/env";

export type ProviderPlanStatus = "ready" | "missing" | "pending" | "optional";

export type ProviderPlanItem = {
  id: string;
  label: string;
  category: "brain" | "video" | "image" | "voice" | "avatar" | "music" | "render" | "email" | "payment" | "storage" | "data";
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

function selectedVideoProvider() {
  return (optionalEnv("VIDEO_PROVIDER") || optionalEnv("GENERATION_PROVIDER") || "runway").toLowerCase();
}

function selectedBrainProvider() {
  return "openai";
}

function selectedImageProvider() {
  return (optionalEnv("IMAGE_PROVIDER") || "openai").toLowerCase();
}

function stableAudioReady() {
  return hasProviderEnv("stableAudio") || hasProviderEnv("stability");
}

function youtubeReady() {
  return hasProviderEnv("youtubeClientId") && hasProviderEnv("youtubeClientSecret");
}

function requiredStatus(requiredEnv: string[], optional = false): ProviderPlanStatus {
  if (requiredEnv.length === 0 && optional) return "optional";
  if (requiredEnv.every((name) => hasConfiguredEnv(name))) return "ready";
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
      status: hasProviderEnv("fal") ? "ready" : "missing",
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

function mapsPlan(): ProviderPlanItem {
  return {
    id: "maps-google",
    label: "Location and maps intelligence",
    category: "data",
    provider: "Google Maps",
    primaryModel: "geocode_places_details_api",
    fallbackModels: ["Manual location notes", "Public map lookup"],
    intendedUse: "Local SEO, map search, place details, regional page building and location-based campaign context.",
    requiredEnv: ["GOOGLE_MAPS_API_KEY"],
    optionalEnv: ["GOOGLE_MAPS_LANGUAGE", "GOOGLE_MAPS_REGION", "GOOGLE_MAPS_SEARCH_RADIUS"],
    status: requiredStatus(["GOOGLE_MAPS_API_KEY"]),
    safeMode: "If Google Maps is missing, keep location-based requests as structured notes and local SEO briefs only.",
    finalSetup: "Add the Google Maps API key, test geocoding and place search once, then wire region-aware pages."
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
      status: paymentProviderName() === "whop" && hasProviderEnv("whopApiKey") && hasProviderEnv("whopWebhookSecret") ? "ready" : "missing",
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

export function providerRouteMap() {
  return {
    create_ai_video: { primary: "video_provider", required: ["video", "storage"], fallback: ["manual_delivery", "demo_plan"] },
    generate_image: { primary: "image_provider", required: ["image", "storage"], fallback: ["manual_visual_brief"] },
    run_lip_sync: { primary: "heygen", required: ["avatar", "voice", "storage"], fallback: ["elevenlabs_voice_plus_manual_avatar", "kling_talking_video_fallback"] },
    voice_clone: { primary: "elevenlabs", required: ["voice", "reference_audio_consent", "storage"], fallback: ["approved_platform_voice_only"] },
    create_website_project: { primary: "openai", required: ["brain", "storage"], fallback: ["structured_project_brief"] },
    create_saas_project: { primary: "openai", required: ["brain", "storage"], fallback: ["structured_saas_brief"] }
  };
}

export function buildProviderPlan() {
  const musicRoute = buildMusicProviderRoute();
  const plans: ProviderPlanItem[] = [
    brainPlan(),
    imagePlan(),
    mapsPlan(),
    videoPlan(),
    {
      id: "avatar-heygen",
      label: "Avatar and talking video",
      category: "avatar",
      provider: "HeyGen",
      primaryModel: "heygen_avatar_video_api",
      fallbackModels: ["ElevenLabs voice + manual avatar delivery", "Kling talking-video fallback"],
      intendedUse: "Avatar presenters, talking video, video translation/lip-sync handoff and sales presenter workflows.",
      requiredEnv: ["HEYGEN_API_KEY"],
      optionalEnv: ["HEYGEN_BASE_URL", "HEYGEN_VIDEO_TRANSLATE_URL"],
      status: requiredStatus(["HEYGEN_API_KEY"]),
      safeMode: "If HeyGen is missing, keep avatar jobs as scripts/assets or route to manual delivery.",
      finalSetup: "Add HeyGen key, test avatar/voice listing, then run one low-cost talking-video flow."
    },
    {
      id: "image-stability",
      label: "Stability AI image provider",
      category: "image",
      provider: "Stability AI",
      primaryModel: process.env.STABILITY_IMAGE_MODEL || "stability_selected_image_model",
      fallbackModels: ["OpenAI Images", "FAL image provider"],
      intendedUse: "Image generation fallback, creative visuals and Stability/Stable Audio account checks.",
      requiredEnv: ["STABILITY_API_KEY"],
      optionalEnv: ["STABILITY_BASE_URL", "STABILITY_IMAGE_MODEL"],
      status: requiredStatus(["STABILITY_API_KEY"]),
      safeMode: "If Stability is missing, keep OpenAI/FAL as image routes and skip Stability-specific jobs.",
      finalSetup: "Add Stability key, test account/balance, then enable image route where needed."
    },
    {
      id: "music-stable-audio",
      label: "Music generation",
      category: "music",
      provider: "Stable Audio / Mubert",
      primaryModel: process.env.STABLE_AUDIO_MODEL || "stable_audio_primary",
      fallbackModels: ["Mubert API", "Manual licensed music fallback"],
      intendedUse: "Background music, campaign music beds and generated music workflows.",
      requiredEnv: ["STABLE_AUDIO_API_KEY or STABILITY_API_KEY"],
      optionalEnv: ["STABLE_AUDIO_MODEL", "STABLE_AUDIO_ACCOUNT_URL", "MUBERT_API_KEY", "MUBERT_ACCESS_TOKEN", "MUBERT_ACCOUNT_URL"],
      status: musicRoute.ready ? "ready" : "missing",
      safeMode: `${musicRoute.costGuard.policy} If music APIs are missing, use manual licensed music fallback and do not promise generated music.`,
      finalSetup: `Use ${musicRoute.primary} first with ${musicRoute.fallback} fallback; estimated ${musicRoute.costGuard.estimatedCredits} credits, review above ${musicRoute.costGuard.maxCreditsBeforeReview} credits before enabling music jobs.`
    },
    {
      id: "social-tiktok",
      label: "TikTok ads and OAuth",
      category: "data",
      provider: "TikTok Business API",
      primaryModel: "tiktok_oauth_ads_api",
      fallbackModels: ["Manual TikTok upload", "Meta/YouTube social fallback"],
      intendedUse: "TikTok OAuth, ad account connection, ad upload planning and social launch workflows.",
      requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
      optionalEnv: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID", "NEXT_PUBLIC_TIKTOK_PIXEL_ID"],
      status: requiredStatus(["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"]),
      safeMode: "If TikTok OAuth keys are missing, TikTok ad launch stays manual/export-only.",
      finalSetup: "Add TikTok client key/secret, verify OAuth URL generation, then connect access token and advertiser ID for live ad launch."
    },
    {
      id: "social-youtube",
      label: "YouTube OAuth and publishing",
      category: "data",
      provider: "YouTube / Google OAuth",
      primaryModel: "youtube_oauth_upload_api",
      fallbackModels: ["Manual YouTube upload", "Dashboard delivery link"],
      intendedUse: "YouTube OAuth, upload handoff, channel read access and video publishing workflows.",
      requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
      optionalEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_ACCESS_TOKEN"],
      status: youtubeReady() ? "ready" : "missing",
      safeMode: "If YouTube OAuth keys are missing, YouTube delivery remains manual upload instructions.",
      finalSetup: "Add YouTube client ID/secret, verify OAuth URL generation, then complete OAuth callback/token storage."
    },
    {
      id: "indexing-indexnow",
      label: "Bing IndexNow",
      category: "data",
      provider: "Bing IndexNow",
      primaryModel: "indexnow_submit_api",
      fallbackModels: ["Sitemap discovery", "Manual Bing Webmaster submission"],
      intendedUse: "Fast indexing submission for public landing pages, API docs, blog and SEO pages.",
      requiredEnv: ["BING_INDEXNOW_KEY or INDEXNOW_KEY"],
      optionalEnv: ["INDEXNOW_KEY_LOCATION", "INDEXNOW_ENDPOINT", "INDEXNOW_HOST"],
      status: hasAnyConfiguredEnv(["BING_INDEXNOW_KEY", "INDEXNOW_KEY"]) ? "ready" : "missing",
      safeMode: "If IndexNow key is missing, rely on sitemap and Search Console/Bing Webmaster discovery.",
      finalSetup: "Add BING_INDEXNOW_KEY, ensure the key file is reachable, then run a dry-run and a small submit."
    },
    {
      id: "social-meta",
      label: "Meta ads and social graph",
      category: "data",
      provider: "Meta",
      primaryModel: "graph_ads_insights_api",
      fallbackModels: ["Manual ad export", "Organic social planning"],
      intendedUse: "Meta ad account checks, campaign export planning, insights review, pages context and social growth signals.",
      requiredEnv: ["META_APP_ID", "META_SYSTEM_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
      optionalEnv: ["META_APP_SECRET", "META_GRAPH_API_VERSION", "META_GRAPH_BASE_URL"],
      status: requiredStatus(["META_APP_ID", "META_SYSTEM_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"]),
      safeMode: "If Meta is missing, keep ad launch and reporting as manual export plans only.",
      finalSetup: "Add Meta app/system token/ad account envs, test ad-account lookup and insights, then enable campaign handoff."
    },
    {
      id: "data-dataforseo",
      label: "SEO and keyword intelligence",
      category: "data",
      provider: "DataForSEO",
      primaryModel: "serp_keyword_volume_api",
      fallbackModels: ["Manual keyword research", "Search Console/GA notes"],
      intendedUse: "Keyword research, SERP checks, competitor SEO context and growth intelligence reports.",
      requiredEnv: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],
      optionalEnv: ["DATAFORSEO_BASE_URL", "DATAFORSEO_LOCATION_NAME", "DATAFORSEO_LANGUAGE_CODE"],
      status: requiredStatus(["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"]),
      safeMode: "If DataForSEO is missing, SEO tasks stay as manual research briefs and static content suggestions.",
      finalSetup: "Add DataForSEO login/password, test one SERP query and one search-volume query, then connect SEO reports."
    },
    {
      id: "data-apify",
      label: "Research and scraping automation",
      category: "data",
      provider: "Apify",
      primaryModel: "apify_actors_and_runs",
      fallbackModels: ["Manual research notes", "Public web lookup"],
      intendedUse: "Public data extraction, structured research, lead collection and competitor monitoring where allowed.",
      requiredEnv: ["APIFY_API_TOKEN"],
      optionalEnv: ["APIFY_BASE_URL"],
      status: requiredStatus(["APIFY_API_TOKEN"]),
      safeMode: "If Apify is missing, keep research requests as manual lookup or planning briefs only.",
      finalSetup: "Add Apify token, test one actor run and dataset fetch, then wire the research workflows."
    },
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
