import { requireEnv } from "@/lib/providers/env";
import type { LipSyncTranslateInput } from "./types";

export async function startLipSyncTranslation(input: LipSyncTranslateInput) {
  if (input.provider === "heygen") return startHeyGenTranslate(input);
  return startElevenLabsDubbing(input);
}

function heygenTranslationLanguageName(language: string) {
  const normalized = language.trim().toLowerCase();
  const names: Record<string, string> = {
    tr: "Turkish",
    turkish: "Turkish",
    en: "English",
    english: "English",
    de: "German",
    german: "German",
    ar: "Arabic",
    arabic: "Arabic"
  };
  return names[normalized] ?? language;
}

async function startHeyGenTranslate(input: LipSyncTranslateInput) {
  const apiKey = requireEnv("HEYGEN_API_KEY");
  const configuredEndpoint = process.env.HEYGEN_VIDEO_TRANSLATE_URL || "";
  const endpoint = /\/v2\/video_translate/i.test(configuredEndpoint) ? "https://api.heygen.com/v3/video-translations" : configuredEndpoint || "https://api.heygen.com/v3/video-translations";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify({
      video: { type: "url", url: input.sourceVideoUrl },
      output_languages: [heygenTranslationLanguageName(input.targetLanguage)],
      input_language: input.sourceLanguage ? heygenTranslationLanguageName(input.sourceLanguage) : null,
      title: `Crelavo translate ${input.productionId ?? "video"}`,
      mode: "speed",
      translate_audio_only: false,
      keep_the_same_format: true,
      enable_dynamic_duration: true,
      disable_music_track: false,
      enable_speech_enhancement: true,
      enable_watermark: false
    })
  });

  if (!response.ok) throw new Error(`HeyGen video translate failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const ids = Array.isArray(data.data?.video_translation_ids) ? data.data.video_translation_ids : [];
  return { provider: "heygen_video_translation_v3", id: ids[0] ?? data.id ?? "queued", status: "queued", raw: data };
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
