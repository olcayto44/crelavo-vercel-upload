export type PlatformVoice = {
  id: string;
  title: string;
  provider: "elevenlabs";
  providerVoiceId: string;
  gender: "female" | "male" | "neutral";
  language: string;
  tone: string;
  useCases: string[];
};

export const platformVoices: PlatformVoice[] = [
  {
    id: "clipora-premium-female-tr",
    title: "Crelavo Premium Kadin TR",
    provider: "elevenlabs",
    providerVoiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
    gender: "female",
    language: "tr",
    tone: "Sicak, guven veren, premium marka anlatimi",
    useCases: ["reklam", "tanitim", "sosyal medya", "kurumsal"]
  },
  {
    id: "clipora-dynamic-social-tr",
    title: "Crelavo Dinamik Sosyal TR",
    provider: "elevenlabs",
    providerVoiceId: process.env.ELEVENLABS_SOCIAL_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
    gender: "neutral",
    language: "tr",
    tone: "Enerjik, kisa video ve satis odakli",
    useCases: ["tiktok", "reels", "shorts", "kampanya"]
  },
  {
    id: "clipora-corporate-male-tr",
    title: "Crelavo Kurumsal Erkek TR",
    provider: "elevenlabs",
    providerVoiceId: process.env.ELEVENLABS_MALE_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
    gender: "male",
    language: "tr",
    tone: "Tok, sakin, profesyonel anlatim",
    useCases: ["kurumsal", "egitim", "sunum", "urun anlatimi"]
  }
];

export function voiceById(id?: string | null) {
  if (!id) return platformVoices[0];
  return platformVoices.find((voice) => voice.id === id) ?? platformVoices[0];
}

export function suggestVoiceId(text: string) {
  const normalized = text.toLocaleLowerCase("tr-TR");
  if (["erkek", "tok", "kurumsal", "guven", "güven"].some((word) => normalized.includes(word))) return "clipora-corporate-male-tr";
  if (["enerjik", "tiktok", "reels", "shorts", "satis", "satış", "dinamik"].some((word) => normalized.includes(word))) return "clipora-dynamic-social-tr";
  return "clipora-premium-female-tr";
}
