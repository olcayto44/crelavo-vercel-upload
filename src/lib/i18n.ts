export const supportedLanguages = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "tr", label: "Türkçe", shortLabel: "TR" },
  { code: "de", label: "Deutsch", shortLabel: "DE" },
  { code: "es", label: "Español", shortLabel: "ES" },
  { code: "fr", label: "Français", shortLabel: "FR" },
  { code: "ar", label: "العربية", shortLabel: "AR" }
] as const;

export const defaultLanguage = "en";
export const languageStorageKey = "clipora_language";
export type SupportedLanguage = typeof supportedLanguages[number]["code"];

export type TranslationKey =
  | "aiAssistantBadge"
  | "homeAssistantInitial"
  | "homeAssistantEmpty"
  | "homeAssistantRedirecting"
  | "homeAssistantPlaceholder"
  | "homeAssistantButton"
  | "homeAssistantRedirectingButton";

const translations: Record<string, Partial<Record<TranslationKey, string>>> = {
  en: {
    aiAssistantBadge: "AI Assistant",
    homeAssistantInitial: "Write what you want to produce; I will make a short pre-analysis and redirect you to the full-screen AI Assistant Workspace.",
    homeAssistantEmpty: "Write what you want to produce; I will analyze the idea and move you to the full-screen AI Assistant Workspace.",
    homeAssistantRedirecting: "I got your idea: \"{idea}\". Instead of sending it directly to the production form, it is better to clarify it first in AI Assistant Workspace. There I will ask for the target platform, content type, material preferences if needed and any extras you do not want. I will skip unwanted materials and continue without blocking the flow. Now I am redirecting you to the full-screen AI Assistant Workspace and carrying your command there.",
    homeAssistantPlaceholder: "What do you want to produce? Example: TikTok ad from a product link",
    homeAssistantButton: "Send to Assistant",
    homeAssistantRedirectingButton: "Redirecting..."
  },
  tr: {
    aiAssistantBadge: "AI Asistan",
    homeAssistantInitial: "Ne üretmek istediğini yaz; kısa bir ön analiz yapıp seni tam ekran AI Assistant Workspace'e yönlendireceğim.",
    homeAssistantEmpty: "Ne üretmek istediğini yaz; fikri analiz edip seni tam ekran AI Assistant Workspace'e taşıyacağım.",
    homeAssistantRedirecting: "Fikrini aldım: \"{idea}\". Bunu doğrudan üretim formuna göndermek yerine önce AI Assistant Workspace içinde netleştirmek daha doğru. Orada hedef platformu, içerik türünü, gerekirse materyal tercihlerini ve istemediğin ekstra özellikleri soracağım. İstemediğin materyalleri atlayıp akışı durdurmadan devam edeceğim. Şimdi komutunu taşıyarak seni tam ekran AI Assistant Workspace'e yönlendiriyorum.",
    homeAssistantPlaceholder: "Ne üretmek istiyorsun? Örnek: Ürün linkinden TikTok reklamı",
    homeAssistantButton: "Asistana gönder",
    homeAssistantRedirectingButton: "Yönlendiriliyor..."
  },
  de: {
    aiAssistantBadge: "KI-Assistent",
    homeAssistantInitial: "Schreibe, was du produzieren möchtest; ich mache eine kurze Voranalyse und leite dich zum vollständigen AI Assistant Workspace weiter.",
    homeAssistantEmpty: "Schreibe, was du produzieren möchtest; ich analysiere die Idee und öffne den vollständigen AI Assistant Workspace.",
    homeAssistantRedirecting: "Ich habe deine Idee erhalten: \"{idea}\". Statt sie direkt an das Produktionsformular zu senden, klären wir sie zuerst im AI Assistant Workspace. Jetzt leite ich dich weiter und übernehme deinen Auftrag.",
    homeAssistantPlaceholder: "Was möchtest du produzieren? Beispiel: TikTok-Anzeige aus einem Produktlink",
    homeAssistantButton: "An Assistent senden",
    homeAssistantRedirectingButton: "Weiterleitung..."
  },
  es: {
    aiAssistantBadge: "Asistente IA",
    homeAssistantInitial: "Escribe lo que quieres producir; haré un breve análisis y te llevaré al AI Assistant Workspace en pantalla completa.",
    homeAssistantEmpty: "Escribe lo que quieres producir; analizaré la idea y abriré el AI Assistant Workspace.",
    homeAssistantRedirecting: "Recibí tu idea: \"{idea}\". Es mejor aclararla primero en AI Assistant Workspace antes de enviarla al formulario de producción. Ahora te estoy redirigiendo con tu comando.",
    homeAssistantPlaceholder: "¿Qué quieres producir? Ejemplo: anuncio de TikTok desde un enlace de producto",
    homeAssistantButton: "Enviar al asistente",
    homeAssistantRedirectingButton: "Redirigiendo..."
  },
  fr: {
    aiAssistantBadge: "Assistant IA",
    homeAssistantInitial: "Écris ce que tu veux produire ; je ferai une courte préanalyse et je t'enverrai vers l'AI Assistant Workspace en plein écran.",
    homeAssistantEmpty: "Écris ce que tu veux produire ; j'analyserai l'idée et j'ouvrirai l'AI Assistant Workspace.",
    homeAssistantRedirecting: "J'ai reçu ton idée : \"{idea}\". Il vaut mieux la clarifier d'abord dans AI Assistant Workspace avant de l'envoyer au formulaire de production. Je te redirige maintenant avec ta demande.",
    homeAssistantPlaceholder: "Que veux-tu produire ? Exemple : publicité TikTok depuis un lien produit",
    homeAssistantButton: "Envoyer à l'assistant",
    homeAssistantRedirectingButton: "Redirection..."
  },
  ar: {
    aiAssistantBadge: "مساعد الذكاء الاصطناعي",
    homeAssistantInitial: "اكتب ما تريد إنتاجه؛ سأجري تحليلاً قصيراً ثم أنقلك إلى مساحة AI Assistant الكاملة.",
    homeAssistantEmpty: "اكتب ما تريد إنتاجه؛ سأحلل الفكرة وأنقلك إلى مساحة AI Assistant الكاملة.",
    homeAssistantRedirecting: "وصلتني فكرتك: \"{idea}\". من الأفضل توضيحها أولاً داخل AI Assistant Workspace قبل إرسالها إلى نموذج الإنتاج. سأقوم الآن بنقلك مع حفظ طلبك.",
    homeAssistantPlaceholder: "ماذا تريد أن تنتج؟ مثال: إعلان TikTok من رابط منتج",
    homeAssistantButton: "إرسال إلى المساعد",
    homeAssistantRedirectingButton: "جارٍ التحويل..."
  }
};

const navTranslations: Record<string, Record<string, string>> = {
  tr: {
    Home: "Ana sayfa",
    Categories: "Kategoriler",
    Tools: "Araçlar",
    Credits: "Krediler",
    Assistant: "Asistan",
    Start: "Başla",
    Productions: "Üretimler",
    Dashboard: "Panel",
    Contact: "İletişim",
    "Blog / Content": "Blog / İçerik"
  },
  de: { Home: "Startseite", Categories: "Kategorien", Tools: "Tools", Credits: "Credits", Assistant: "Assistent", Start: "Start", Productions: "Produktionen", Dashboard: "Dashboard", Contact: "Kontakt", "Blog / Content": "Blog / Inhalte" },
  es: { Home: "Inicio", Categories: "Categorías", Tools: "Herramientas", Credits: "Créditos", Assistant: "Asistente", Start: "Empezar", Productions: "Producciones", Dashboard: "Panel", Contact: "Contacto", "Blog / Content": "Blog / Contenido" },
  fr: { Home: "Accueil", Categories: "Catégories", Tools: "Outils", Credits: "Crédits", Assistant: "Assistant", Start: "Démarrer", Productions: "Productions", Dashboard: "Tableau", Contact: "Contact", "Blog / Content": "Blog / Contenu" },
  ar: { Home: "الرئيسية", Categories: "الفئات", Tools: "الأدوات", Credits: "الأرصدة", Assistant: "المساعد", Start: "ابدأ", Productions: "الإنتاجات", Dashboard: "لوحة التحكم", Contact: "اتصال", "Blog / Content": "المدونة / المحتوى" }
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.some((item) => item.code === value);
}

export function getStoredLanguage() {
  if (typeof window === "undefined") return defaultLanguage;
  const saved = window.localStorage.getItem(languageStorageKey) || defaultLanguage;
  return isSupportedLanguage(saved) ? saved : defaultLanguage;
}

export function setStoredLanguage(nextLanguage: string) {
  if (typeof window === "undefined") return defaultLanguage;
  const language = isSupportedLanguage(nextLanguage) ? nextLanguage : defaultLanguage;
  window.localStorage.setItem(languageStorageKey, language);
  document.documentElement.lang = language;
  document.documentElement.dir = "ltr";
  window.dispatchEvent(new CustomEvent("clipora-language-change", { detail: language }));
  return language;
}

export function translate(key: TranslationKey, language: string, fallback: string, values?: Record<string, string>) {
  const template = translations[language]?.[key] ?? translations.en[key] ?? fallback;
  return Object.entries(values ?? {}).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), template);
}

export function translateNavLabel(label: string, language: string) {
  return navTranslations[language]?.[label] ?? label;
}
