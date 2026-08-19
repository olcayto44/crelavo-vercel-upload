import { cloudflareWafFinalChecks, providerLiveVerificationChecks } from "@/lib/edge-provider-final-checks";
import { buildProviderPlan, providerRouteMap } from "@/lib/provider-plan";
import { buildProductionProviderRoutingCheck } from "@/lib/production-provider-routing-check";
import { hasProviderEnv, providerEnvNames } from "@/lib/providers/env";
import { minimaxReadiness } from "@/lib/providers/minimax";
import { platformVoices } from "@/lib/voice-library";

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function selectedVideoProvider() {
  return (process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "replicate").toLowerCase();
}

function hasAnyEnv(names: string[]) {
  return names.some((name) => hasEnv(name));
}

function videoPreflight(provider: string) {
  if (provider === "replicate") {
    const versionMode = hasEnv("REPLICATE_VIDEO_VERSION");
    return {
      provider,
      model: process.env.REPLICATE_MODEL || "wan-video/wan-2.2-t2v-fast",
      endpointMode: versionMode ? "version_prediction" : "model_prediction",
      durationSeconds: { min: 5, max: 10, test: 5 },
      aspectRatio: "9:16",
      testTarget: "low_cost_5s_720p_single_output"
    };
  }
  if (provider === "runway") {
    return {
      provider,
      model: process.env.RUNWAY_MODEL || "runway_image_to_video",
      endpointMode: "task_api",
      durationSeconds: { min: 5, max: 10, test: 5 },
      aspectRatio: "720:1280",
      testTarget: "low_cost_5s_720p_single_output"
    };
  }
  if (provider === "kling") {
    return {
      provider,
      model: process.env.KLING_MODEL || "kling_text2video",
      endpointMode: "task_api",
      durationSeconds: { min: 5, max: 10, test: 5 },
      aspectRatio: "9:16",
      testTarget: "low_cost_5s_720p_single_output"
    };
  }
  if (provider === "fal") {
    return {
      provider,
      model: process.env.FAL_VIDEO_MODEL || "fal-ai/wan/v2.2-a14b/text-to-video/turbo",
      endpointMode: "fal_queue",
      durationSeconds: { min: 5, max: 10, test: 5 },
      aspectRatio: "9:16",
      testTarget: "low_cost_5s_720p_single_output"
    };
  }
  return {
    provider,
    model: "unsupported",
    endpointMode: "unsupported",
    durationSeconds: { min: 5, max: 10, test: 5 },
    aspectRatio: "9:16",
    testTarget: "unsupported_provider"
  };
}

function videoProviderReady(provider: string) {
  if (provider === "replicate") return { ready: hasProviderEnv("replicate"), required: providerEnvNames("replicate"), optional: ["REPLICATE_VIDEO_VERSION", "REPLICATE_MODEL"] };
  if (provider === "runway") return { ready: hasProviderEnv("runway"), required: providerEnvNames("runway"), optional: ["RUNWAY_API_VERSION", "RUNWAY_MODEL"] };
  if (provider === "kling") return { ready: hasProviderEnv("kling"), required: providerEnvNames("kling"), optional: ["KLING_API_URL", "KLING_STATUS_API_URL", "KLING_MODEL"] };
  if (provider === "fal") return { ready: hasProviderEnv("fal"), required: providerEnvNames("fal"), optional: ["FAL_VIDEO_MODEL"] };
  return { ready: false, required: [], optional: [], error: `Unsupported VIDEO_PROVIDER: ${provider}` };
}

export async function GET() {
  const providerPlan = buildProviderPlan();
  const videoProvider = selectedVideoProvider();
  const video = videoProviderReady(videoProvider);
  const speechReady = hasProviderEnv("elevenlabs");
  const brainReady = hasProviderEnv("openai");
  const imageReady = hasProviderEnv("openai");
  const heygenReady = hasProviderEnv("heygen");
  const stabilityReady = hasProviderEnv("stability");
  const musicReady = hasProviderEnv("stableAudio") || hasProviderEnv("stability") || hasProviderEnv("mubert");
  const mapsReady = hasProviderEnv("googleMaps");
  const tiktokReady = hasProviderEnv("tiktokClientKey") && hasProviderEnv("tiktokClientSecret");
  const youtubeReady = hasProviderEnv("youtubeClientId") && hasProviderEnv("youtubeClientSecret");
  const indexNowReady = hasAnyEnv(["BING_INDEXNOW_KEY", "INDEXNOW_KEY"]);
  const whopReady = hasProviderEnv("whopApiKey") && hasProviderEnv("whopWebhookSecret");
  const metaReady = hasProviderEnv("metaAppId") && hasProviderEnv("metaAccessToken") && hasProviderEnv("metaAdAccount");
  const dataForSeoReady = hasProviderEnv("dataForSeoLogin") && hasProviderEnv("dataForSeoPassword");
  const apifyReady = hasProviderEnv("apify");
  const renderReady = hasProviderEnv("shotstack");
  const cloudflareReady = hasProviderEnv("cloudflareApiToken") && hasProviderEnv("cloudflareZoneId");
  const turnstileReady = hasProviderEnv("turnstileSecret");

  return Response.json({
    ...providerPlan,
    routeMap: providerRouteMap(),
    video: {
      provider: videoProvider,
      ...video,
      preflight: videoPreflight(videoProvider)
    },
    speech: {
      provider: "elevenlabs",
      ready: speechReady,
      required: providerEnvNames("elevenlabs"),
      optional: ["ELEVENLABS_VOICE_ID", "ELEVENLABS_SOCIAL_VOICE_ID", "ELEVENLABS_MALE_VOICE_ID", "ELEVENLABS_MODEL_ID"],
      mode: "approved_platform_voices_only",
      voices: platformVoices.map((voice) => ({
        id: voice.id,
        title: voice.title,
        gender: voice.gender,
        language: voice.language,
        tone: voice.tone,
        useCases: voice.useCases
      }))
    },
    brain: {
      provider: "openai",
      ready: brainReady,
      required: providerEnvNames("openai")
    },
    image: {
      provider: "openai-images",
      ready: imageReady,
      required: providerEnvNames("openai"),
      optional: ["OPENAI_IMAGE_MODEL"]
    },
    heygen: {
      provider: "heygen",
      ready: heygenReady,
      required: providerEnvNames("heygen"),
      optional: ["HEYGEN_BASE_URL", "HEYGEN_VIDEO_TRANSLATE_URL"]
    },
    minimax: {
      ...minimaxReadiness(),
      required: [...providerEnvNames("minimax"), ...providerEnvNames("minimaxGroupId")],
      optional: ["MINIMAX_BASE_URL"]
    },
    stability: {
      provider: "stability-ai",
      ready: stabilityReady,
      required: providerEnvNames("stability"),
      optional: ["STABILITY_BASE_URL", "STABILITY_IMAGE_MODEL"]
    },
    music: {
      provider: "stable-audio-primary-mubert-secondary",
      ready: musicReady,
      required: ["STABLE_AUDIO_API_KEY or STABILITY_API_KEY"],
      optional: ["STABLE_AUDIO_MODEL", "MUBERT_API_KEY", "MUBERT_ACCESS_TOKEN"]
    },
    maps: {
      provider: "google-maps",
      ready: mapsReady,
      required: providerEnvNames("googleMaps"),
      optional: ["GOOGLE_MAPS_LANGUAGE", "GOOGLE_MAPS_REGION", "GOOGLE_MAPS_SEARCH_RADIUS"]
    },
    tiktok: {
      provider: "tiktok-business-api",
      ready: tiktokReady,
      required: [...providerEnvNames("tiktokClientKey"), ...providerEnvNames("tiktokClientSecret")],
      optional: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID", "NEXT_PUBLIC_TIKTOK_PIXEL_ID"]
    },
    youtube: {
      provider: "youtube-google-oauth",
      ready: youtubeReady,
      required: [...providerEnvNames("youtubeClientId"), ...providerEnvNames("youtubeClientSecret")],
      optional: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_ACCESS_TOKEN"]
    },
    indexnow: {
      provider: "bing-indexnow",
      ready: indexNowReady,
      required: ["BING_INDEXNOW_KEY or INDEXNOW_KEY"],
      optional: ["INDEXNOW_KEY_LOCATION", "INDEXNOW_ENDPOINT", "INDEXNOW_HOST"]
    },
    whop: {
      provider: "whop",
      ready: whopReady,
      required: [...providerEnvNames("whopApiKey"), ...providerEnvNames("whopWebhookSecret")],
      optional: ["PAYMENT_PROVIDER", "PAYMENT_NOTIFICATION_EMAIL"]
    },
    meta: {
      provider: "meta",
      ready: metaReady,
      required: [...providerEnvNames("metaAppId"), ...providerEnvNames("metaAccessToken"), ...providerEnvNames("metaAdAccount")],
      optional: ["META_APP_SECRET", "META_GRAPH_API_VERSION", "META_GRAPH_BASE_URL"]
    },
    dataforseo: {
      provider: "dataforseo",
      ready: dataForSeoReady,
      required: [...providerEnvNames("dataForSeoLogin"), ...providerEnvNames("dataForSeoPassword")],
      optional: ["DATAFORSEO_BASE_URL", "DATAFORSEO_LOCATION_NAME", "DATAFORSEO_LANGUAGE_CODE"]
    },
    apify: {
      provider: "apify",
      ready: apifyReady,
      required: providerEnvNames("apify"),
      optional: ["APIFY_BASE_URL"]
    },
    render: {
      provider: "shotstack",
      ready: renderReady,
      required: providerEnvNames("shotstack")
    },
    cloudflare: {
      provider: "cloudflare",
      ready: cloudflareReady,
      required: [...providerEnvNames("cloudflareApiToken"), ...providerEnvNames("cloudflareZoneId")],
      optional: [...providerEnvNames("cloudflareAccountId"), "CLOUDFLARE_WAF_RULESET_ID", "CLOUDFLARE_RATE_LIMIT_RULESET_ID"],
      manualValidation: cloudflareWafFinalChecks.manualValidation,
      protectedRoutes: cloudflareWafFinalChecks.protectedRoutes,
      finalGuardrail: cloudflareWafFinalChecks.guardrail
    },
    turnstile: {
      provider: "cloudflare-turnstile",
      ready: turnstileReady,
      required: providerEnvNames("turnstileSecret"),
      optional: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
      mode: "recommended_for_public_forms_before_paid_traffic"
    },
    providerLiveVerification: providerLiveVerificationChecks,
    productionProviderRouting: buildProductionProviderRoutingCheck(),
    note: "Secrets are never returned; only readiness booleans, model choices and env variable names are exposed."
  });
}
