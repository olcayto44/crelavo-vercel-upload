import { cleanProviderText, voiceDirectionGuard, voiceProductionGuard } from "@/lib/voice-production-guard";
import { voiceById } from "@/lib/voice-library";
import { optionalEnv, requireProviderEnv } from "./env";
import { uploadProviderAsset } from "./storage";

const MAX_TTS_CHARS = voiceProductionGuard.maxTtsCharacters;

function cleanVoiceScript(script: string) {
  return cleanProviderText(script, MAX_TTS_CHARS);
}

function voiceSettings(direction: string) {
  const normalized = voiceDirectionGuard(direction).toLowerCase();
  return {
    stability: normalized.includes("enerjik") || normalized.includes("tiktok") ? 0.38 : 0.5,
    similarity_boost: 0.78,
    style: normalized.includes("tiktok") || normalized.includes("reels") || normalized.includes("enerjik") ? 0.7 : 0.35,
    use_speaker_boost: true
  };
}

async function synthesizeVoice(input: { productionId: string; script: string; voiceDirection: string; voiceId?: string; filename: string }) {
  const apiKey = requireProviderEnv("elevenlabs");
  const selectedVoice = voiceById(input.voiceId);
  const voiceId = selectedVoice.providerVoiceId || optionalEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
  const script = cleanVoiceScript(input.script);
  if (!script) throw new Error("Voice-over script is empty after cleanup.");
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: script,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: voiceSettings(input.voiceDirection)
    })
  });

  if (!response.ok) throw new Error(`ElevenLabs voice-over failed: ${response.status} ${await response.text()}`);

  const audio = await response.arrayBuffer();
  const audioUrl = await uploadProviderAsset(`${input.productionId}/${input.filename}`, audio, "audio/mpeg");
  return {
    audioUrl,
    voice: selectedVoice,
    provider: "elevenlabs",
    providerVoiceId: voiceId,
    model: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    scriptCharacters: script.length,
    truncated: cleanVoiceScript(input.script).length < String(input.script ?? "").replace(/\s+/g, " ").trim().length
  };
}

export async function createVoiceover(input: { productionId: string; script: string; voiceDirection: string; voiceId?: string }) {
  const result = await synthesizeVoice({ ...input, filename: "voiceover.mp3" });
  return result.audioUrl;
}

export type VoiceAudioSegment = {
  speaker: string;
  audioUrl: string;
  start: number;
  length: number;
  text: string;
  voiceId: string;
};

function voiceIdForSpeaker(speaker: string) {
  const normalized = speaker.toLocaleLowerCase("tr-TR");
  if (/dede|baba|erkek/.test(normalized)) return "clipora-corporate-male-tr";
  if (/babaanne|anne|kadın|kadin/.test(normalized)) return "clipora-premium-female-tr";
  if (/torun|çocuk|cocuk|karakter/.test(normalized)) return "clipora-dynamic-social-tr";
  return "clipora-premium-female-tr";
}

export async function createVoiceoverSegments(input: {
  productionId: string;
  segments: Array<{ speaker: string; text: string; start: number; length: number }>;
  voiceDirection: string;
}) {
  const safeSegments = input.segments
    .filter((segment) => String(segment.text ?? "").trim())
    .slice(0, 18);
  const results: VoiceAudioSegment[] = [];
  for (let index = 0; index < safeSegments.length; index += 1) {
    const segment = safeSegments[index];
    const voiceId = voiceIdForSpeaker(segment.speaker);
    const result = await synthesizeVoice({
      productionId: input.productionId,
      script: segment.text,
      voiceDirection: `${input.voiceDirection}; character voice for ${segment.speaker}`,
      voiceId,
      filename: `voice-segments/${String(index + 1).padStart(2, "0")}-${segment.speaker.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.mp3`
    });
    results.push({
      speaker: segment.speaker,
      audioUrl: result.audioUrl,
      start: segment.start,
      length: segment.length,
      text: segment.text,
      voiceId
    });
  }
  return results;
}

export async function createRevisionVoiceover(input: { productionId: string; revisionId: string; script: string; voiceDirection: string; voiceId?: string }) {
  return synthesizeVoice({
    productionId: input.productionId,
    script: input.script,
    voiceDirection: input.voiceDirection,
    voiceId: input.voiceId,
    filename: `voice-revisions/${input.revisionId}.mp3`
  });
}
