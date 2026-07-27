export const voiceProductionGuard = {
  maxTtsCharacters: 2400,
  maxVoiceDirectionCharacters: 320,
  defaultModel: "eleven_multilingual_v2",
  ttsSafetyRule: "Voice-over text is normalized, length-limited and provider-rendered only after payment/credit and provider readiness checks.",
  voiceCloneConsentRule: "Voice clone production requires reference audio owned by the user or explicit permission, plus rights_confirmed=true on every clone reference before provider setup.",
  avatarSpeechRule: "Avatar/talking-head jobs need a stable speaker persona, avatar reference/source and voice direction before real provider rendering.",
  supportedVoiceLocales: ["tr", "en", "de", "fr", "es", "ar"],
  fallbackPolicy: "If clone/avatar provider setup is not ready, keep delivery as approved platform voice-over, script, subtitles and manual avatar handoff instead of starting an unsafe provider job."
};

export function cleanProviderText(value: string, maxCharacters: number) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxCharacters);
}

export function voiceDirectionGuard(direction: string) {
  const cleaned = cleanProviderText(direction, voiceProductionGuard.maxVoiceDirectionCharacters);
  return cleaned || "premium clear narrator; natural delivery";
}
