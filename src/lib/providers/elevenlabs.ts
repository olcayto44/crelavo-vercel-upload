import { voiceById } from "@/lib/voice-library";
import { optionalEnv, requireEnv } from "./env";
import { uploadProviderAsset } from "./storage";

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
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const selectedVoice = voiceById(input.voiceId);
  const voiceId = selectedVoice.providerVoiceId || optionalEnv("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: input.script,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
      voice_settings: voiceSettings(input.voiceDirection)
    })
  });

  if (!response.ok) throw new Error(`ElevenLabs voice-over failed: ${response.status} ${await response.text()}`);

  const audio = await response.arrayBuffer();
  const audioUrl = await uploadProviderAsset(`${input.productionId}/${input.filename}`, audio, "audio/mpeg");
  return { audioUrl, voice: selectedVoice };
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
