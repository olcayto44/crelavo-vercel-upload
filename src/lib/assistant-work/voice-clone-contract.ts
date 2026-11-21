import type { AssistantReference } from "./reference-contract.ts";
export const VOICE_CLONE_CONSENT_VERSION = "voice-clone-v1";
export function validateVoiceCloneRequest(refs: AssistantReference[], consent: unknown) {
  if (refs.length !== 1 || refs[0].kind !== "audio" || refs[0].role !== "reference") throw new Error("voice_clone_requires_one_audio_reference");
  const value = consent && typeof consent === "object" ? consent as Record<string,unknown> : {};
  if (value.version !== VOICE_CLONE_CONSENT_VERSION || value.rightsConfirmed !== true) throw new Error("voice_clone_explicit_consent_required");
  return refs[0];
}
