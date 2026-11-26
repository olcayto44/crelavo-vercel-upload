export type PhaseOneFeaturePage = {
  slug: string;
  title: string;
  badge: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  summary: string;
  primaryKeyword: string;
  keywords: string[];
  useCases: string[];
  mvpDeliverables: string[];
  creditModel: string[];
  internalLinks: { label: string; href: string; note: string }[];
};

export const phaseOneFeaturePages: PhaseOneFeaturePage[] = [
  {
    slug: "ai-ad-performance-score-checker",
    title: "AI Ad Performance Score Checker",
    badge: "AI Ad Scorer",
    metaTitle: "AI Ad Performance Score Checker for Ecommerce Ads | Crelavo",
    metaDescription: "Use Crelavo's free AI ad performance score checker to review ecommerce ads, TikTok hooks, product video scripts, CTA clarity and creative performance before spending budget.",
    h1: "Free AI ad performance score checker for ecommerce ads, hooks and product video scripts",
    summary: "Crelavo's AI Ad Performance Score Checker is now positioned as a free lead magnet and production gateway: users can score product ad ideas, hooks, CTA clarity, platform fit and creative weaknesses before turning the best version into an AI + human QA Crelavo campaign brief.",
    primaryKeyword: "AI ad performance score checker",
    keywords: ["AI ad scorer", "ad performance checker", "video ad score", "TikTok ad score", "ecommerce ad score", "ROAS prediction tool", "CTR prediction tool", "ad creative analysis", "product ad checker", "creative performance score"],
    useCases: ["Score a TikTok product ad hook before production", "Review Shopify or Amazon product video scripts", "Find weak CTA, offer clarity and first-three-second issues", "Turn low scoring ad concepts into improved Crelavo briefs"],
    mvpDeliverables: ["Basic ad score report", "Hook strength and CTA clarity notes", "3 improved ad angles", "Video-ready creative brief", "Optional product video production request"],
    creditModel: ["Light preview can stay free as a lead magnet", "Detailed ad score report opens as a credit-based package", "Script and hook improvement uses a higher package tier", "Workspace shows the exact credit cost before production starts", "Generated video variants use normal video production credits"],
    internalLinks: [
      { label: "Free AI Ad Scorer", href: "/free-tools/ad-performance-score-checker", note: "Score the ad before spending budget" },
      { label: "AI product video generator", href: "/ai-product-video-generator", note: "Turn improved ad score into video production" },
      { label: "TikTok Hook Generator", href: "/free-tools/tiktok-hook-generator", note: "Prepare stronger hooks first" },
      { label: "Predictive launch plan", href: "/ai-tool-launch-distribution-plan", note: "Route scored ads into launch channels" }
    ]
  },
  {
    slug: "ai-virtual-model-studio",
    title: "AI Virtual Model Studio",
    badge: "Virtual Model Studio",
    metaTitle: "AI Virtual Model Studio for Fashion and Ecommerce | Crelavo",
    metaDescription: "Create a roadmap for AI virtual model photos, fashion product images, AI clothing models, jewelry model visuals and ecommerce model photography with Crelavo.",
    h1: "AI virtual model studio for fashion, jewelry, accessories and ecommerce product visuals",
    summary: "Crelavo's AI Virtual Model Studio positions product visuals for fashion, jewelry, beauty and accessories as model-ready campaign assets. The first phase is SEO and request intake; MVP delivery can provide sanal model image packs through admin/assistant-assisted production.",
    primaryKeyword: "AI virtual model studio",
    keywords: ["AI virtual model", "AI fashion model", "virtual model studio", "AI clothing model", "AI model photography", "fashion product photos", "AI jewelry model", "AI try on model", "ecommerce model photos", "virtual model generator"],
    useCases: ["Show apparel on different virtual model styles", "Create jewelry and accessory model visuals", "Prepare fashion product photos without a full shoot", "Generate lifestyle images for Shopify, Amazon or Trendyol campaigns"],
    mvpDeliverables: ["4 image virtual model pack", "10 image catalog pack", "Product close-up and lifestyle shot direction", "Short video teaser brief", "Model style and market fit notes"],
    creditModel: ["Single model visual opens as a credit-based visual package", "4-image packs use a higher catalog-production tier", "Bigger catalog sets are scoped inside the workspace", "Image + short video teaser uses normal visual/video production credits", "Workspace shows the exact credit cost before production starts"],
    internalLinks: [
      { label: "AI product video generator", href: "/ai-product-video-generator", note: "Use virtual model assets in product videos" },
      { label: "AI UGC creator program", href: "/ai-ugc-creator-program", note: "Connect model visuals with UGC creator strategy" },
      { label: "Pinterest + YouTube visual distribution", href: "/pinterest-youtube-visual-distribution-plan", note: "Distribute visuals into visual search" }
    ]
  },
  {
    slug: "ai-cultural-localization",
    title: "AI Cultural Localization",
    badge: "Global Culture-Shift",
    metaTitle: "AI Cultural Localization for Global Ecommerce Ads | Crelavo",
    metaDescription: "Adapt ecommerce ads, product videos, scripts, visuals and messaging for country-specific buyer psychology with Crelavo AI cultural localization.",
    h1: "AI cultural localization for cross-border ecommerce ads and global product videos",
    summary: "AI Cultural Localization goes beyond translation. Crelavo can position this as country-specific creative adaptation: messaging, proof, tone, pacing, visual style, CTA and product psychology change by market.",
    primaryKeyword: "AI cultural localization",
    keywords: ["AI cultural localization", "global ad localization", "cross border ecommerce ads", "localized product video", "AI localization pack", "multilingual ad video", "international ecommerce marketing", "country specific ad creative", "ecommerce localization", "global product video"],
    useCases: ["Adapt a Shopify product video for Germany, USA, Japan or Gulf markets", "Rewrite ad psychology for country-specific buyer trust", "Localize hooks, CTAs, claims and proof points", "Create market-specific video briefs and scripts"],
    mvpDeliverables: ["1 country localization brief", "Localized hook and script pack", "Visual style and pace notes", "Country-specific CTA and proof angle", "Optional localized video variant brief"],
    creditModel: ["Country localization brief opens as a credit-based package", "Localized script and video brief use higher planning tiers", "Multi-country campaign packs are scoped inside the workspace", "Full global campaign work uses normal campaign/localization credits", "Workspace shows the exact credit cost before production starts"],
    internalLinks: [
      { label: "Trendyol product video", href: "/trendyol-product-video", note: "Regional ecommerce video path" },
      { label: "AI ecommerce campaign checklist", href: "/blog/shopify-amazon-trendyol-ai-campaign-checklist", note: "Prepare campaign inputs" },
      { label: "Campaign category", href: "/categories/campaign", note: "Start a localized campaign request" }
    ]
  },
];

export function getPhaseOneFeature(slug: string) {
  return phaseOneFeaturePages.find((page) => page.slug === slug);
}

export const phaseOneFeatureKeywords = Array.from(new Set(phaseOneFeaturePages.flatMap((page) => [page.primaryKeyword, ...page.keywords])));
