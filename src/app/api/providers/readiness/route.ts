import { buildProviderPlan } from "@/lib/provider-plan";
import { platformVoices } from "@/lib/voice-library";

function hasEnv(name: string) {
  return Boolean(process.env[name]);
}

function selectedVideoProvider() {
  return (process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "runway").toLowerCase();
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
  if (provider === "replicate") return { ready: hasEnv("REPLICATE_API_TOKEN"), required: ["REPLICATE_API_TOKEN"], optional: ["REPLICATE_VIDEO_VERSION", "REPLICATE_MODEL"] };
  if (provider === "runway") return { ready: hasEnv("RUNWAY_API_KEY"), required: ["RUNWAY_API_KEY"], optional: ["RUNWAY_API_VERSION", "RUNWAY_MODEL"] };
  if (provider === "kling") return { ready: hasEnv("KLING_API_KEY"), required: ["KLING_API_KEY"], optional: ["KLING_API_URL", "KLING_STATUS_API_URL", "KLING_MODEL"] };
  if (provider === "fal") return { ready: hasAnyEnv(["FAL_KEY", "FAL_API_KEY"]), required: ["FAL_KEY or FAL_API_KEY"], optional: ["FAL_VIDEO_MODEL"] };
  return { ready: false, required: [], optional: [], error: `Unsupported VIDEO_PROVIDER: ${provider}` };
}

export async function GET() {
  const providerPlan = buildProviderPlan();
  const videoProvider = selectedVideoProvider();
  const video = videoProviderReady(videoProvider);
  const speechReady = hasEnv("ELEVENLABS_API_KEY");
  const brainReady = hasEnv("OPENAI_API_KEY");
  const imageReady = hasEnv("OPENAI_API_KEY");
  const renderReady = hasEnv("SHOTSTACK_API_KEY");

  return Response.json({
    ...providerPlan,
    video: {
      provider: videoProvider,
      ...video,
      preflight: videoPreflight(videoProvider)
    },
    speech: {
      provider: "elevenlabs",
      ready: speechReady,
      required: ["ELEVENLABS_API_KEY"],
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
      required: ["OPENAI_API_KEY"]
    },
    image: {
      provider: "openai-images",
      ready: imageReady,
      required: ["OPENAI_API_KEY"],
      optional: ["OPENAI_IMAGE_MODEL"]
    },
    render: {
      provider: "shotstack",
      ready: renderReady,
      required: ["SHOTSTACK_API_KEY"]
    },
    note: "Secrets are never returned; only readiness booleans, model choices and env variable names are exposed."
  });
}
