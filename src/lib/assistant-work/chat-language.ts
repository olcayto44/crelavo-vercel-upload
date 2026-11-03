import { normalizeWorkspaceMessages } from "./workspace-chat.ts";
const names: Record<string, string> = { en: "English", tr: "Turkish", de: "German", es: "Spanish", fr: "French", ar: "Arabic", ru: "Russian", zh: "Chinese", ja: "Japanese", ko: "Korean", pt: "Portuguese", it: "Italian" };
function identify(text: string): string {
  text = text.replace(/\u0130/g, "i");
  const requested = [ ["tr", "turkish|türkçe|turkce"], ["en", "english|ingilizce"], ["de", "german|deutsch|almanca"], ["fr", "french|français|fransızca|fransizca"], ["es", "spanish|español|ispanyolca"], ["ar", "arabic|العربية|arapça|arapca"] ];
  for (const [code, language] of requested) if (new RegExp("(?:reply|respond|answer|speak|cevap|yanıt|yanit|konuş|konus|antworte|répond|responde).{0,25}(?:" + language + ")|(?:" + language + ").{0,25}(?:cevap|yanıt|yanit|konuş|konus|reply|respond|answer)", "i").test(text)) return code;
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  const patterns: Record<string, RegExp> = { tr: /\b(merhaba|istiyorum|lütfen|lutfen|evet|hayır|hayir|olsun|sitesi|bana|bir|nasıl|nasil|hangi|yapalım|yapalim)\b|[ğıİş]/gi, de: /\b(hallo|ich|möchte|mochte|bitte|eine|einen|danke|erstellen|brauche|wie)\b|[ßä]/gi, fr: /\b(bonjour|je|voudrais|veux|avec|pour|merci|créer|créer|comment)\b/gi, es: /\b(hola|quiero|necesito|por|favor|crear|gracias|sitio|cómo)\b|[¿¡ñ]/gi, pt: /\b(olá|quero|preciso|obrigado|criar|você)\b/gi, it: /\b(ciao|vorrei|voglio|grazie|creare|sito)\b/gi, en: /\b(hello|please|want|need|create|build|website|what|how|the|can|would)\b/gi };
  const scores = Object.entries(patterns).map(([code, pattern]) => [code, [...text.matchAll(pattern)].length] as const).sort((a, b) => b[1] - a[1]);
  return scores[0]?.[1] ? scores[0][0] : "";
}
export function resolveReplyLanguage(message: string, history: unknown = []) {
  const current = identify(message); if (current) return current;
  for (const item of normalizeWorkspaceMessages(history).filter((item) => item.role === "user").reverse()) { const language = identify(item.content); if (language) return language; }
  return "auto";
}
export function replyLanguageInstruction(language: string) { return language === "auto" ? "Respond in the language of the latest substantive user message. For a short acknowledgement retain the latest user conversation language." : "Respond only in " + (names[language] || language) + ". The generated website language and the UI language are separate and must not change the chat language."; }
