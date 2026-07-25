import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getApifyRun } from "@/lib/providers/apify";
import { getKeywordVolume } from "@/lib/providers/dataforseo";
import { geocodeAddress } from "@/lib/providers/google-maps";
import { getHeyGenAvatars } from "@/lib/providers/heygen";
import { getMetaAdAccount } from "@/lib/providers/meta";
import { getMubertAccount, getStableAudioAccount } from "@/lib/providers/music";
import { createShotstackTestRender } from "@/lib/providers/shotstack";
import { getStabilityBalance } from "@/lib/providers/stability";
import { buildProviderPlan } from "@/lib/provider-plan";

function ok(provider: string, detail: unknown) {
  return Response.json({ provider, ok: true, detail });
}

function fail(provider: string, error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Provider test failed.";
  return Response.json({ provider, ok: false, error: message }, { status });
}

async function testOpenAi() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const response = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`OpenAI models check failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { modelCount: Array.isArray(data.data) ? data.data.length : 0 };
}

async function testElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");
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
  if (!process.env.APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN missing");
  const response = await fetch(`${process.env.APIFY_BASE_URL || "https://api.apify.com/v2"}/users/me?token=${encodeURIComponent(process.env.APIFY_API_TOKEN)}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Apify user check failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { userId: data.data?.id ?? "connected", username: data.data?.username ?? null };
}

async function testDataForSeo() {
  const result = await getKeywordVolume({ keywords: ["ai video generator"], locationName: "United States", languageCode: "en" });
  return { checked: "keyword_volume", hasTasks: Array.isArray((result as { tasks?: unknown[] }).tasks) };
}

async function testMusicProvider() {
  if (process.env.STABLE_AUDIO_API_KEY || process.env.STABILITY_API_KEY) {
    return { primary: "stable-audio", result: await getStableAudioAccount() };
  }
  if (process.env.MUBERT_API_KEY || process.env.MUBERT_ACCESS_TOKEN) {
    return { primary: "mubert", result: await getMubertAccount() };
  }
  throw new Error("STABLE_AUDIO_API_KEY or MUBERT_API_KEY missing");
}

function selectedVideoReadiness() {
  const plan = buildProviderPlan().plans.find((item) => item.category === "video");
  return { note: "No video generation was started. This only checks selected video provider readiness to avoid spend.", readiness: plan };
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
    if (provider === "elevenlabs") return ok(provider, await testElevenLabs());
    if (provider === "heygen") return ok(provider, await getHeyGenAvatars());
    if (provider === "stability") return ok(provider, await getStabilityBalance());
    if (provider === "music" || provider === "stable-audio") return ok("music", await testMusicProvider());
    if (provider === "shotstack") return ok(provider, await createShotstackTestRender());
    if (["video", "kling", "fal", "runway"].includes(provider)) return ok(provider, selectedVideoReadiness());
    if (provider === "shopify") return ok(provider, { status: "pending", note: "Shopify is paused until store URL and integration type are confirmed." });
    return fail(provider, new Error("Unsupported provider test."), 400);
  } catch (error) {
    return fail(provider, error);
  }
}
