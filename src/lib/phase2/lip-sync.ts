import { requireEnv } from "@/lib/providers/env";
import type { LipSyncTranslateInput } from "./types";

export async function startLipSyncTranslation(input: LipSyncTranslateInput) {
  if (input.provider === "heygen") return startHeyGenTranslate(input);
  return startElevenLabsDubbing(input);
}

async function startHeyGenTranslate(input: LipSyncTranslateInput) {
  const apiKey = requireEnv("HEYGEN_API_KEY");
  const response = await fetch(process.env.HEYGEN_VIDEO_TRANSLATE_URL || "https://api.heygen.com/v2/video_translate", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      video_url: input.sourceVideoUrl,
      output_language: input.targetLanguage,
      source_language: input.sourceLanguage,
      title: `Crelavo translate ${input.productionId ?? "video"}`
    })
  });

  if (!response.ok) throw new Error(`HeyGen video translate failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "heygen", id: data.data?.video_translate_id ?? data.id, status: data.data?.status ?? "queued", raw: data };
}

async function startElevenLabsDubbing(input: LipSyncTranslateInput) {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const response = await fetch("https://api.elevenlabs.io/v1/dubbing", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_url: input.sourceVideoUrl,
      source_lang: input.sourceLanguage,
      target_lang: input.targetLanguage,
      num_speakers: 1,
      watermark: false
    })
  });

  if (!response.ok) throw new Error(`ElevenLabs dubbing failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "elevenlabs_dubbing", id: data.dubbing_id ?? data.id, status: data.status ?? "queued", raw: data };
}
