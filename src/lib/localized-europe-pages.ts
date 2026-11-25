export type LocalizedEuropePage = {
  locale: "de" | "fr" | "tr" | "zh";
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
    title: "KI-Videogenerator für Produktvideos und kreative Projekte | Crelavo",
    description: "Planen Sie Produktvideos, Werbeclips und kreative Kurzfilme mit Zielgruppe, Format, autorisierten Referenzen und überprüfbarem Lieferumfang.",
    eyebrow: "Europäische KI-Produktion",
    h1: "KI-Videogenerator für Produktvideos und kreative Projekte",
    lead: "Planen Sie Produktvideos, Werbeclips und kreative Kurzfilme anhand eines klaren Briefings. Prüfen Sie verfügbare Produktionswerkzeuge und Lieferoptionen vor der Freigabe.",
    primaryCta: "Produktion starten",
    secondaryCta: "Preise ansehen",
    marketNote: "Für deutsche und europäische E-Commerce Teams, Agenturen, Shopify/Amazon Seller und Startups.",
    sections: [
      { title: "Für E-Commerce gemacht", body: "Crelavo verbindet Produktlinks, Kampagnenziele und Markeninformationen zu einem organisierten Produktions-Workflow." },
      { title: "Mehrsprachige Kampagnen", body: "Bereite Creatives für verschiedene europäische Märkte vor, ohne jedes Asset von Grund auf neu zu planen." },
      { title: "Umfang und Qualität prüfen", body: "Prüfen Sie Briefing, verfügbare Werkzeuge, Credits, Lieferumfang und notwendige Korrekturen vor der Freigabe." }
    ],
    useCases: ["Produktvideo für Shopify", "Amazon Produktanzeige", "Social Video Creative", "Kreativer Kurzfilm", "Kampagnenpaket für EU-Märkte"],
    keywords: ["KI Video Generator", "KI Produktvideo", "E-Commerce Video Deutschland", "AI Video Ads Europe"]
  },
  {
    locale: "fr",
    hreflang: "fr-FR",
    languageName: "Français",
    slug: "generateur-video-ia",
    path: "/fr/generateur-video-ia",
    title: "Générateur de vidéos IA pour produits et projets créatifs | Crelavo",
    description: "Préparez des vidéos produit, publicités et courts-métrages créatifs avec un brief, des références autorisées et un périmètre de livraison défini.",
    eyebrow: "Production IA pour l’Europe",
    h1: "Générateur de vidéos IA : produits et projets créatifs",
    lead: "Préparez un projet vidéo à partir d’une idée, d’un lien produit ou d’un brief marketing. Vérifiez les options de production et de livraison avant validation.",
    primaryCta: "Démarrer une production",
    secondaryCta: "Voir les prix",
    marketNote: "Pour les marques e-commerce, agences, startups et équipes marketing en France et en Europe.",
    sections: [
      { title: "Pensé pour l’e-commerce", body: "Crelavo organise les liens produits, les objectifs marketing et les contraintes de marque dans un workflow clair." },
      { title: "Adaptation multilingue", body: "Préparez des campagnes pour plusieurs marchés européens avec une structure de production cohérente." },
      { title: "Vérification du périmètre et de la qualité", body: "Vérifiez le brief, les outils disponibles, les crédits, les livrables et les révisions nécessaires avant validation." }
    ],
    useCases: ["Vidéo produit Shopify", "Publicité Amazon", "Creative social video", "Court-métrage créatif", "Campagne e-commerce européenne"],
    keywords: ["générateur vidéo IA", "vidéo produit IA", "publicité e-commerce France", "AI video ads Europe"]
  },
  {
    locale: "tr",
    hreflang: "tr-TR",
    languageName: "Türkçe",
    slug: "yapay-zeka-video-uretici",
    path: "/tr/yapay-zeka-video-uretici",
    title: "Yapay Zekâ Video Üretici: Ürün Videoları ve Kreatif Projeler | Crelavo",
    description: "Ürün videosu, sosyal medya reklamı ve kısa film projesini hedef kitle, format, izinli referanslar ve teslim kapsamına göre planlayın.",
    eyebrow: "Avrupa odaklı AI üretim",
    h1: "Yapay zekâ video üretici ile ürün ve kreatif video projeleri",
    lead: "Ürün linki, fikir veya pazarlama briefiyle video projenizi planlayın. Üretim araçlarını, kredi gereksinimini ve teslim koşullarını onaydan önce inceleyin.",
    primaryCta: "Üretim başlat",
    secondaryCta: "Fiyatları gör",
    marketNote: "Türkiye, Avrupa e-ticaret markaları, ajanslar, Shopify/Amazon satıcıları ve startup ekipleri için.",
    sections: [
      { title: "E-ticaret için net üretim akışı", body: "Crelavo ürün linki, hedef pazar, kampanya fikri ve marka bilgisini tek üretim akışında toplar." },
      { title: "Avrupa pazarlarına uyum", body: "Farklı ülke ve diller için kampanya fikri, görsel yön, video briefi ve teslim formatı planlanabilir." },
      { title: "Kapsam ve kalite kontrolü", body: "Onaydan önce proje taslağını, kullanılabilir araçları, kredileri, teslimatı ve gereken düzenlemeleri inceleyin." }
    ],
    useCases: ["Shopify ürün videosu", "Amazon ürün reklamı", "Sosyal medya kreatifi", "Kreatif kısa film", "Avrupa kampanya paketi"],
    keywords: ["yapay zeka video üretici", "AI ürün videosu", "e-ticaret video reklam", "Avrupa e-ticaret kampanyası"]
  },
{
  "locale": "zh",
  "hreflang": "zh-Hans",
  "languageName": "简体中文",
  "slug": "ai-video-generator",
  "path": "/zh/ai-video-generator",
  "title": "AI 视频生成器：电商产品广告与创意制作 | Crelavo",
  "description": "通过产品链接、创意简报和授权素材，规划 AI 产品视频、社交广告、电影概念短片、系列内容及数字人视频。了解 Crelavo 的制作流程、价格与交付范围。",
  "eyebrow": "面向跨境电商与创作者的 AI 制作工作室",
  "h1": "用产品链接和创意简报，开启 AI 视频制作",
  "lead": "为 Shopify、Amazon 等平台的产品准备视频广告，或规划电影概念短片、系列内容、音乐视频和数字人讲解。提供准确的产品信息与授权素材，确认制作范围和点数后，再开始制作。",
  "primaryCta": "开始制作简报",
  "secondaryCta": "查看价格与点数",
  "marketNote": "适合跨境电商品牌、独立站卖家、营销团队和内容创作者。此页面为简体中文介绍；账户、结算和部分工作区页面目前仍为英文。",
  "sections": [
    {
      "title": "从产品链接到广告简报",
      "body": "提交公开产品链接、目标市场、卖点和品牌素材。若网页无法读取，请直接提供产品信息和授权图片。先核对事实，再确认开场钩子、产品展示和行动号召。"
    },
    {
      "title": "让创意和交付保持一致",
      "body": "在简报中注明平台、语言、画幅、时长和版本数量。需要字幕、配音、人物参考或交付说明时，请明确提出；支持范围与费用以确认后的制作方案为准。"
    },
    {
      "title": "先确认范围，再开始制作",
      "body": "查看制作所需点数、供应商可用性和交付要求。产品主张、音乐、声音及肖像均需具备相应使用权。生成内容仍需审核，不保证广告审批、销售增长或角色完全一致。"
    }
  ],
  "useCases": [
    "Shopify 产品视频",
    "Amazon 产品广告",
    "UGC 风格广告",
    "电影概念短片与系列内容",
    "音乐视频与歌词视频",
    "数字人讲解视频"
  ],
  "keywords": [
    "AI 视频生成器",
    "AI 产品视频",
    "电商视频广告",
    "跨境电商 AI",
    "数字人视频",
    "AI 电影",
    "Crelavo 中文"
  ]
}
];

export function getLocalizedEuropePage(locale: string, slug: string) {
  return localizedEuropePages.find((page) => page.locale === locale && page.slug === slug);
}

export function localizedLanguageAlternates() {
  return Object.fromEntries(localizedEuropePages.map((page) => [page.hreflang, page.path]));
}
