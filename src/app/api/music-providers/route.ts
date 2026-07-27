import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getMubertAccount, getStableAudioAccount } from "@/lib/providers/music";
import { hasProviderEnv, providerEnvNames } from "@/lib/providers/env";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  const provider = new URL(request.url).searchParams.get("provider") || "stable-audio";
  const readiness = {
    primary: "stable-audio",
    secondary: "mubert",
    stableAudioReady: hasProviderEnv("stableAudio") || hasProviderEnv("stability"),
    mubertReady: hasProviderEnv("mubert"),
    required: { stableAudio: ["STABLE_AUDIO_API_KEY or STABILITY_API_KEY"], mubert: providerEnvNames("mubert") },
    guard: "admin_only_music_provider_readiness"
  };
  if (!["stable-audio", "mubert", "summary"].includes(provider)) return Response.json({ error: "provider must be stable-audio, mubert or summary.", readiness }, { status: 400 });
  if (provider === "summary") return Response.json({ provider, readiness });
  try {
    if (provider === "mubert") return Response.json({ provider, readiness, result: await getMubertAccount() });
    return Response.json({ provider: "stable-audio", readiness, result: await getStableAudioAccount() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Music provider request failed.";
    return Response.json({ provider, error: message }, { status: 500 });
  }
}
