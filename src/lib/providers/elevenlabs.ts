import { voiceById } from "@/lib/voice-library";
import { optionalEnv, requireProviderEnv } from "./env";
import { uploadProviderAsset } from "./storage";

const MAX_TTS_CHARS = 2400;

function cleanVoiceScript(script: string) {
  return script.replace(/\s+/g, " ").trim().slice(0, MAX_TTS_CHARS);
}

function voiceSettings(direction: string) {
  const normalized = direction.toLowerCase();
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

export async function createRevisionVoiceover(input: { productionId: string; revisionId: string; script: string; voiceDirection: string; voiceId?: string }) {
  return synthesizeVoice({
    productionId: input.productionId,
    script: input.script,
    voiceDirection: input.voiceDirection,
    voiceId: input.voiceId,
    filename: `voice-revisions/${input.revisionId}.mp3`
  });
}
