import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { cloudflareWafFinalChecks, providerLiveVerificationChecks } from "@/lib/edge-provider-final-checks";
import { getApifyRun } from "@/lib/providers/apify";
import { getKeywordVolume } from "@/lib/providers/dataforseo";
import { geocodeAddress } from "@/lib/providers/google-maps";
import { getHeyGenAvatars } from "@/lib/providers/heygen";
import { getMetaAdAccount } from "@/lib/providers/meta";
import { getMubertAccount, getStableAudioAccount } from "@/lib/providers/music";
import { createShotstackTestRender } from "@/lib/providers/shotstack";
import { getShopifyReadiness } from "@/lib/providers/shopify";
import { getStabilityBalance } from "@/lib/providers/stability";
import { adOAuthUrl } from "@/lib/phase2/ads";
import { buildProviderPlan } from "@/lib/provider-plan";
import { hasProviderEnv, providerEnvNames, requireProviderEnv } from "@/lib/providers/env";

function ok(provider: string, detail: unknown) {
  return Response.json({ provider, ok: true, detail });
}

function fail(provider: string, error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Provider test failed.";
  return Response.json({ provider, ok: false, error: message }, { status });
}

async function testOpenAi() {
  const apiKey = requireProviderEnv("openai");
  const response = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`OpenAI models check failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { modelCount: Array.isArray(data.data) ? data.data.length : 0 };
}

async function testElevenLabs() {
  const apiKey = requireProviderEnv("elevenlabs");
  const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": apiKey, Accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) {
    if (response.status === 401 && text.includes("missing_permissions")) {
      return { connected: true, permissionLimited: true, note: "API key exists but lacks user_read/voices_read permissions. TTS may still work if text-to-speech permission is enabled.", rawStatus: response.status };
    }
    throw new Error(`ElevenLabs auth check failed: ${response.status} ${text}`);
  }
  const data = JSON.parse(text || "{}");
  return { tier: data.tier ?? "connected", characterLimit: data.character_limit ?? null, characterCount: data.character_count ?? null };
}

async function testApify() {
  const token = requireProviderEnv("apify");
  const response = await fetch(`${process.env.APIFY_BASE_URL || "https://api.apify.com/v2"}/users/me?token=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Apify user check failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { userId: data.data?.id ?? "connected", username: data.data?.username ?? null };
}

async function testDataForSeo() {
  const result = await getKeywordVolume({ keywords: ["ai video generator"], locationName: "United States", languageCode: "en" });
  return { checked: "keyword_volume", hasTasks: Array.isArray((result as { tasks?: unknown[] }).tasks) };
}

async function testMusicProvider() {
  if (hasProviderEnv("stableAudio") || hasProviderEnv("stability")) {
    return { primary: "stable-audio", result: await getStableAudioAccount() };
  }
  if (hasProviderEnv("mubert")) {
    return { primary: "mubert", result: await getMubertAccount() };
  }
  throw new Error("STABLE_AUDIO_API_KEY or MUBERT_API_KEY missing");
}

function selectedVideoReadiness() {
  const plan = buildProviderPlan().plans.find((item) => item.category === "video");
  return { note: "No video generation was started. This only checks selected video provider readiness to avoid spend.", readiness: plan };
}

function requireAnyEnv(names: string[]) {
  const found = names.find((name) => Boolean(process.env[name]));
  if (!found) throw new Error(`${names.join(" or ")} missing`);
  return found;
}

function testWhop() {
  if (!hasProviderEnv("whopApiKey")) throw new Error(`${providerEnvNames("whopApiKey").join(" or ")} missing`);
  if (!hasProviderEnv("whopWebhookSecret")) throw new Error(`${providerEnvNames("whopWebhookSecret").join(" or ")} missing`);
  return { connected: true, required: [...providerEnvNames("whopApiKey"), ...providerEnvNames("whopWebhookSecret")], note: "Secrets exist. Live webhook validation still needs a real Whop event." };
}

function testIndexNow() {
  const keyName = requireAnyEnv(["BING_INDEXNOW_KEY", "INDEXNOW_KEY"]);
  const key = process.env[keyName] || "";
  return { connected: true, keyName, keyLength: key.length, keyLocation: process.env.INDEXNOW_KEY_LOCATION || `https://www.crelavo.com/${key}.txt`, note: "Dry config check only; submit test is handled from the IndexNow admin page." };
}

function testCloudflare() {
  if (!hasProviderEnv("cloudflareApiToken")) throw new Error(`${providerEnvNames("cloudflareApiToken").join(" or ")} missing`);
  if (!hasProviderEnv("cloudflareZoneId")) throw new Error(`${providerEnvNames("cloudflareZoneId").join(" or ")} missing`);
  return {
    connected: true,
    required: [...providerEnvNames("cloudflareApiToken"), ...providerEnvNames("cloudflareZoneId")],
    optional: cloudflareWafFinalChecks.optionalEnv,
    protectedRoutes: cloudflareWafFinalChecks.protectedRoutes,
    manualValidation: cloudflareWafFinalChecks.manualValidation,
    providerLiveVerification: providerLiveVerificationChecks.status,
    note: cloudflareWafFinalChecks.guardrail
  };
}

function testTikTokOAuth() {
  if (!hasProviderEnv("tiktokClientKey")) throw new Error(`${providerEnvNames("tiktokClientKey").join(" or ")} missing`);
  if (!hasProviderEnv("tiktokClientSecret")) throw new Error(`${providerEnvNames("tiktokClientSecret").join(" or ")} missing`);
  return { connected: true, oauthUrlReady: Boolean(adOAuthUrl("tiktok", "provider-test")), required: [...providerEnvNames("tiktokClientKey"), ...providerEnvNames("tiktokClientSecret")] };
}

function testYouTubeOAuth() {
  if (!hasProviderEnv("youtubeClientId")) throw new Error(`${providerEnvNames("youtubeClientId").join(" or ")} missing`);
  if (!hasProviderEnv("youtubeClientSecret")) throw new Error(`${providerEnvNames("youtubeClientSecret").join(" or ")} missing`);
  return { connected: true, oauthUrlReady: Boolean(adOAuthUrl("youtube", "provider-test")), required: [...providerEnvNames("youtubeClientId"), ...providerEnvNames("youtubeClientSecret")] };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "readiness").toLowerCase();

  try {
    if (provider === "readiness") return ok(provider, buildProviderPlan().summary);
    if (provider === "openai") return ok(provider, await testOpenAi());
    if (provider === "google-maps" || provider === "maps") return ok("google-maps", await geocodeAddress("New York, USA"));
    if (provider === "apify") return ok(provider, await testApify());
    if (provider === "dataforseo") return ok(provider, await testDataForSeo());
    if (provider === "meta") return ok(provider, await getMetaAdAccount());
    if (provider === "whop") return ok(provider, testWhop());
    if (provider === "cloudflare") return ok(provider, testCloudflare());
    if (provider === "indexnow") return ok(provider, testIndexNow());
    if (provider === "tiktok") return ok(provider, testTikTokOAuth());
    if (provider === "youtube") return ok(provider, testYouTubeOAuth());
    if (provider === "elevenlabs") return ok(provider, await testElevenLabs());
    if (provider === "heygen") return ok(provider, await getHeyGenAvatars());
    if (provider === "stability") return ok(provider, await getStabilityBalance());
    if (provider === "music" || provider === "stable-audio") return ok("music", await testMusicProvider());
    if (provider === "shotstack") return ok(provider, await createShotstackTestRender());
    if (["video", "kling", "fal", "runway"].includes(provider)) return ok(provider, selectedVideoReadiness());
    if (provider === "shopify") return ok(provider, getShopifyReadiness());
    return fail(provider, new Error("Unsupported provider test."), 400);
  } catch (error) {
    return fail(provider, error);
  }
}
