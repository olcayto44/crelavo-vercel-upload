export type LocalizedEuropePage = {
  locale: "de" | "fr" | "tr";
  hreflang: string;
  languageName: string;
  slug: string;
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lead: string;
  primaryCta: string;
  secondaryCta: string;
  marketNote: string;
  sections: { title: string; body: string }[];
  useCases: string[];
  keywords: string[];
};

export const localizedEuropePages: LocalizedEuropePage[] = [
  {
    locale: "de",
    hreflang: "de-DE",
    languageName: "Deutsch",
    slug: "ki-video-generator",
    path: "/de/ki-video-generator",
    title: "KI Video Generator für europäische E-Commerce Marken | Crelavo",
    description: "Crelavo hilft europäischen E-Commerce Marken, Produktvideos, Kampagnen-Assets und Website-Workflows mit KI und menschlicher Qualitätskontrolle zu erstellen.",
    eyebrow: "Europäische KI-Produktion",
    h1: "KI-Produktvideos und Kampagnen-Assets für europäische Marken",
    lead: "Erstelle Produktvideos, Werbeideen, Website-Briefs und Kampagnen-Assets aus einem klaren Produktionsbrief — mit KI-Geschwindigkeit und menschlicher Qualitätskontrolle.",
    primaryCta: "Produktion starten",
    secondaryCta: "Preise ansehen",
    marketNote: "Für deutsche und europäische E-Commerce Teams, Agenturen, Shopify/Amazon Seller und Startups.",
    sections: [
      { title: "Für E-Commerce gemacht", body: "Crelavo verbindet Produktlinks, Kampagnenziele und Markeninformationen zu einem organisierten Produktions-Workflow." },
      { title: "Mehrsprachige Kampagnen", body: "Bereite Creatives für verschiedene europäische Märkte vor, ohne jedes Asset von Grund auf neu zu planen." },
      { title: "KI + menschliche QA", body: "Der Fokus liegt nicht nur auf schneller Generierung, sondern auf überprüfbaren Briefings, Credits, Lieferung und Revisionen." }
    ],
    useCases: ["Produktvideo für Shopify", "Amazon Produktanzeige", "Social Video Creative", "Landingpage Brief", "Kampagnenpaket für EU-Märkte"],
    keywords: ["KI Video Generator", "KI Produktvideo", "E-Commerce Video Deutschland", "AI Video Ads Europe"]
  },
  {
    locale: "fr",
    hreflang: "fr-FR",
    languageName: "Français",
    slug: "generateur-video-ia",
    path: "/fr/generateur-video-ia",
    title: "Générateur de vidéos IA pour marques e-commerce européennes | Crelavo",
    description: "Crelavo aide les marques e-commerce européennes à créer des vidéos produit, assets de campagne et briefs web avec IA et contrôle qualité humain.",
    eyebrow: "Production IA pour l’Europe",
    h1: "Vidéos produit IA et campagnes créatives pour les marques européennes",
    lead: "Transformez une idée, un lien produit ou un brief marketing en vidéo produit, campagne publicitaire, page web ou package créatif prêt à livrer.",
    primaryCta: "Démarrer une production",
    secondaryCta: "Voir les prix",
    marketNote: "Pour les marques e-commerce, agences, startups et équipes marketing en France et en Europe.",
    sections: [
      { title: "Pensé pour l’e-commerce", body: "Crelavo organise les liens produits, les objectifs marketing et les contraintes de marque dans un workflow clair." },
      { title: "Adaptation multilingue", body: "Préparez des campagnes pour plusieurs marchés européens avec une structure de production cohérente." },
      { title: "IA + contrôle humain", body: "La plateforme privilégie les briefs vérifiables, les crédits, les livraisons et les révisions plutôt que de simples générations isolées." }
    ],
    useCases: ["Vidéo produit Shopify", "Publicité Amazon", "Creative social video", "Brief landing page", "Campagne e-commerce européenne"],
    keywords: ["générateur vidéo IA", "vidéo produit IA", "publicité e-commerce France", "AI video ads Europe"]
  },
  {
    locale: "tr",
    hreflang: "tr-TR",
    languageName: "Türkçe",
    slug: "yapay-zeka-video-uretici",
    path: "/tr/yapay-zeka-video-uretici",
    title: "Avrupa E-Ticaret Markaları için Yapay Zeka Video Üretici | Crelavo",
    description: "Crelavo, Avrupa ve Türkiye odaklı e-ticaret markaları için ürün videosu, kampanya görselleri, web/app briefleri ve teslim paketleri üretmeye yardımcı olur.",
    eyebrow: "Avrupa odaklı AI üretim",
    h1: "Avrupa pazarları için yapay zeka ürün videosu ve kampanya üretimi",
    lead: "Ürün linki, fikir veya pazarlama briefini; video, görsel paket, landing page briefi ve kampanya çıktısına dönüştüren organize bir AI üretim stüdyosu.",
    primaryCta: "Üretim başlat",
    secondaryCta: "Fiyatları gör",
    marketNote: "Türkiye, Avrupa e-ticaret markaları, ajanslar, Shopify/Amazon satıcıları ve startup ekipleri için.",
    sections: [
      { title: "E-ticaret için net üretim akışı", body: "Crelavo ürün linki, hedef pazar, kampanya fikri ve marka bilgisini tek üretim akışında toplar." },
      { title: "Avrupa pazarlarına uyum", body: "Farklı ülke ve diller için kampanya fikri, görsel yön, video briefi ve teslim formatı planlanabilir." },
      { title: "AI hızı + insan kalite kontrolü", body: "Amaç sadece çıktı üretmek değil; kredi, teslimat, revizyon ve kalite kontrolü görülebilir bir akışta tutmaktır." }
    ],
    useCases: ["Shopify ürün videosu", "Amazon ürün reklamı", "Sosyal medya kreatifi", "Landing page briefi", "Avrupa kampanya paketi"],
    keywords: ["yapay zeka video üretici", "AI ürün videosu", "e-ticaret video reklam", "Avrupa e-ticaret kampanyası"]
  }
];

export function getLocalizedEuropePage(locale: string, slug: string) {
  return localizedEuropePages.find((page) => page.locale === locale && page.slug === slug);
}

export function localizedLanguageAlternates() {
  return Object.fromEntries(localizedEuropePages.map((page) => [page.hreflang, page.path]));
}
