/** Shared category normalization so the welcome prompt and production preset use the same mapping. */
export const ASSISTANT_CATEGORY_ALIASES: Record<string, string> = {
  website_builder: "website",
  ai_website_builder: "website",
  ai_ecommerce_builder: "website",
  ai_e_commerce_builder: "website",
  ecommerce: "website",
  e_commerce: "website",
  e_commerce_builder: "website",
  e_ticaret: "website",
  ecommerce_builder: "website",
  ecommerce_kit: "website",
  e_commerce_kit: "website",
  online_store: "website",
  storefront: "website",
  ai_app_builder: "saas",
  saas_and_app_builder: "saas",
  saas_app_builder: "saas",
  // "App Builder" is the broad SaaS/web-app path; native mobile apps have their own explicit aliases.
  app: "saas",
  application: "saas",
  mobile_application: "mobile_app",
  native_mobile_app: "mobile_app",
  ios_android_app: "mobile_app",
  social_media_content: "campaign",
  social_media: "campaign",
  ai_social_media_content: "campaign",
  social_media_content_pack: "campaign",
  product_ad_video: "campaign",
  ai_product_video_generator: "campaign",
  text_to_campaign: "campaign",
  campaign_pack: "campaign",
  ai_video_generator: "video",
  ai_video: "video",
  video_generator: "video",
  video_production: "video",
  image_banner_poster: "image",
  banner: "image",
  poster: "image",
  visual: "image",
  görsel: "image",
  gorsel: "image",
  afiş: "image",
  afis: "image",
  brand_kit_builder: "brand_kit",
  brand_identity: "brand_kit",
  document: "document_pack",
  documents: "document_pack",
  ai_ad_performance_score_checker: "ad_score_checker",
  ad_performance_score_checker: "ad_score_checker",
  virtual_model: "virtual_model_studio",
  ai_virtual_model_studio: "virtual_model_studio",
  ai_cultural_localization: "cultural_localization",
  global_localization: "localization",
  ai_campaign_calendar: "campaign_calendar",
  ai_live_sales_agent: "live_sales_agent",
  community: "community_showcase",
  academy: "crelavo_academy",
  ai_agents: "ai_agent",
  advanced_talking_video: "talking_video",
  avatar_video: "avatar",
  avatar_design: "avatar",
  lip_sync_video: "lip_sync",
  voice_cloning: "voice_clone",
  visual_style_clone: "visual_clone",
  planet_space: "planet_space_video",
  drone_satellite_video: "drone_video",
  series_film: "studio",
  drama_short_series: "drama",
  ai_video_tools: "video_tools",
  clipping: "video_clipping",
};

export function normalizeAssistantCategoryKey(category: string): string {
  return String(category || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "_and_")
    .replace(/[\s\/-]+/g, "_")
    .replace(/[^a-z0-9_çğıöşü]/gi, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function resolveAssistantCategoryKey(category: string): string {
  const key = normalizeAssistantCategoryKey(category);
  return ASSISTANT_CATEGORY_ALIASES[key] || key;
}

/**
 * Resolve the conversation/prompt category separately from the production engine type.
 * Several landing-page categories intentionally share one production engine but should still
 * start with different discovery questions (for example, Ecommerce Builder vs Website Builder).
 */
const ASSISTANT_PROMPT_CATEGORY_ALIASES: Record<string, string> = {
  website_builder: "website",
  ai_website_builder: "website",
  ecommerce: "ecommerce",
  e_commerce: "ecommerce",
  ecommerce_builder: "ecommerce",
  e_commerce_builder: "ecommerce",
  ai_ecommerce_builder: "ecommerce",
  ai_e_commerce_builder: "ecommerce",
  ecommerce_kit: "ecommerce",
  e_commerce_kit: "ecommerce",
  online_store: "ecommerce",
  storefront: "ecommerce",
  app: "app_builder",
  application: "app_builder",
  ai_app_builder: "app_builder",
  saas_and_app_builder: "app_builder",
  saas_app_builder: "app_builder",
  social_media: "social_media_content",
  social_media_content: "social_media_content",
  ai_social_media_content: "social_media_content",
  social_media_content_pack: "social_media_content",
  product_ad_video: "product_ad_video",
  ai_product_video_generator: "product_ad_video",
  ai_video_generator: "video",
};

export function resolveAssistantPromptCategoryKey(category: string): string {
  const key = normalizeAssistantCategoryKey(category);
  return ASSISTANT_PROMPT_CATEGORY_ALIASES[key] || resolveAssistantCategoryKey(category);
}

/**
 * Infer an explicit primary deliverable only when the message includes an action/intention
 * and a concrete output type. Platform names on their own (for example, "I want TikTok")
 * are not enough to switch the active category.
 */
export function resolveExplicitProductionTypeFromMessage(message: string): string | null {
  const text = String(message || "").toLocaleLowerCase("tr-TR");
  const actionPattern = /\b(create|build|make|generate|design|develop|produce|prepare|start|want|need|looking for|would like|yapalım|yapalim|oluştur|olustur|hazırla|hazirla|üret|uret|tasarla|kur|geliştir|gelistir|istiyorum|istiyoruz|isterim|ihtiyacım var|ihtiyacim var|oluşturmak|olusturmak|yapmak|hazırlamak|hazirlamak)\b/i;
  const actionMatch = actionPattern.exec(text);
  if (!actionMatch || actionMatch.index < 0) return null;
  // Turkish commonly places the intent verb after the deliverable ("Web sitesi oluşturmak
  // istiyorum"). Only treat an earlier deliverable as explicit when it is tightly connected
  // to a concrete creation verb, not merely mentioned in a business-context answer.
  const trailingConstructionIntent = /\b(yapmak|yapalım|yapalim|kurmak|açmak|acmak|oluşturmak|olusturmak|hazırlamak|hazirlamak|üretmek|uretmek|tasarlamak|geliştirmek|gelistirmek|inşa etmek|insa etmek|yaptırmak|yaptirmak)\s*(istiyorum|istiyoruz|isterim|istiyoruz|istiyor|istiyorlar|lazım|gerek)?\b/i.exec(text);

  // Choose the first deliverable tied to the user's action, rather than the first feature
  // mentioned anywhere. This avoids treating "website with an admin panel" as an admin-only
  // project and prevents a target platform (e.g. TikTok) from being mistaken for an output.
  const rules: Array<[RegExp, string]> = [
    [/\b(admin panel|admin dashboard|management panel|control panel|yönetim paneli|yonetim paneli|crud panel)\b/i, "admin_project"],
    [/\b(web site|website|web sitesi|landing page|landing website|business site|kurumsal site|site yap|site kur)\b/i, "website"],
    [/\b(e-?commerce|e commerce|e-ticaret|online store|storefront|shopify store|woocommerce store)\b/i, "website"],
    [/\b(mobile app|mobile application|native app|mobil uygulama|ios app|android app|react native|expo starter|app store|play store)\b/i, "mobile_app"],
    [/\b(saas|web app|app builder|application|\bapp\b|uygulama)\b/i, "saas"],
    [/\b(ai agent|ai agents|yapay zeka ajanı|yapay zeka ajani|ai influencer|social media manager agent)\b/i, "ai_agent"],
    [/\b(product ad video|video ad|ad video|reklam videosu|ürün reklam videosu|urun reklam videosu|campaign pack|kampanya paketi|social media content|social media post|sosyal medya içerikleri|sosyal medya icerikleri|sosyal medya gönderisi|sosyal medya gonderisi|ad copy|reklam metni|campaign)\b/i, "campaign"],
    [/\b(global localization|cultural localization|localization|lokalizasyon|yerelleştirme|yerellestirme|kültürel uyarlama|kulturel uyarlama)\b/i, "localization"],
    [/\b(ad score|ad performance score|reklam skoru|reklam analizi)\b/i, "ad_score_checker"],
    [/\b(virtual model|sanal model|model studio|model stüdyosu|model studyosu)\b/i, "virtual_model_studio"],
    [/\b(campaign calendar|kampanya takvimi)\b/i, "campaign_calendar"],
    [/\b(live sales agent|live commerce agent|canlı satış ajanı|canli satis ajani)\b/i, "live_sales_agent"],
    [/\b(video clipping|video clip|clip extraction|video kırpma|video kirpma|kesit çıkar|kesit cikar)\b/i, "video_clipping"],
    [/\b(lip sync|lip-sync|dudak senkronizasyonu)\b/i, "lip_sync"],
    [/\b(voice cloning|voice clone|ses klonlama|ses klonu|dublaj|dubbing)\b/i, "voice_clone"],
    [/\b(avatar video|talking avatar|talking video|konuşan video|konusan video|avatar)\b/i, "avatar"],
    [/\b(brand kit|brand identity|logo|marka kiti|kurumsal kimlik)\b/i, "brand_kit"],
    [/\b(pdf|document pack|doküman|dokuman|pitch deck|presentation|sunum|proposal|teklif dosyası|teklif dosyasi)\b/i, "document_pack"],
    [/\b(static image|image|visual|banner|poster|thumbnail|görsel|gorsel|afiş|afis|logo tasarımı|logo tasarimi)\b/i, "image"],
    [/\b(video|videos|mp4|mov|reels|shorts|short film|cinematic video|animasyon|animation|film)\b/i, "video"],
  ];

  const matches = rules.flatMap(([pattern, typeId], priority) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const followsAction = match.index >= actionMatch.index;
    const precedesTurkishCreationVerb = Boolean(
      trailingConstructionIntent &&
      match.index < trailingConstructionIntent.index &&
      trailingConstructionIntent.index - (match.index + match[0].length) <= 55
    );
    return followsAction || precedesTurkishCreationVerb
      ? [{ index: match.index, priority, typeId }]
      : [];
  });
  matches.sort((a, b) => a.index - b.index || a.priority - b.priority);
  const first = matches[0];
  if (!first) return null;
  if (first.typeId === "video" && /\b(product|ürün|urun|ad|reklam|campaign|kampanya)\b/i.test(text)) return "campaign";
  return first.typeId;
}

/** Backwards-compatible Boolean helper for tests and call sites that only need the signal. */
export function messageExplicitlyRequestsProductionType(message: string): boolean {
  return resolveExplicitProductionTypeFromMessage(message) !== null;
}

/**
 * Resolve a category passed by an existing Crelavo link to an actual production type.
 * Unknown values intentionally return null rather than silently becoming an AI video job.
 */
export function resolveProductionTypeIdFromCategory(
  category: string,
  productionTypes: readonly { id: string; label: string }[],
): string | null {
  const raw = String(category || "").trim().toLocaleLowerCase("tr-TR");
  if (!raw) return null;

  const exact = productionTypes.find(
    (type) => type.id.toLocaleLowerCase("tr-TR") === raw || type.label.toLocaleLowerCase("tr-TR") === raw,
  );
  if (exact) return exact.id;

  const normalized = resolveAssistantCategoryKey(category);
  return productionTypes.find((type) => type.id.toLocaleLowerCase("tr-TR") === normalized)?.id ?? null;
}

/** Build a trusted server-side hint from a category ID accepted by the current catalog. */
export function buildAssistantCategoryContextNote(
  category: string,
  productionTypes: readonly { id: string; label: string }[],
): string {
  const typeId = resolveProductionTypeIdFromCategory(category, productionTypes);
  if (!typeId) return "";
  const type = productionTypes.find((item) => item.id === typeId);
  if (!type) return "";
  const promptCategory = resolveAssistantPromptCategoryKey(category);
  const promptLabels: Record<string, string> = {
    website: "Website Builder",
    ecommerce: "E-commerce Builder",
    app_builder: "SaaS & App Builder",
    product_ad_video: "Product Ad Video",
    social_media_content: "Social Media Content",
    campaign: "Campaign Production",
    video: "AI Video",
    saas: "SaaS / App Builder",
    mobile_app: "Mobile App Builder",
    admin_project: "Admin Panel Builder",
    image: "Image / Visual Production",
    brand_kit: "Brand Kit",
    document_pack: "Document & File Package"
  };
  const workflowLabel = promptLabels[promptCategory] || type.label;
  return [
    "ACTIVE CRELAVO CATEGORY CONTEXT:",
    `The user entered this workflow through the “${workflowLabel}” category (production engine type ID: ${type.id}; engine label: ${type.label}).`,
    "Treat this category as the default when the latest user message answers discovery questions or provides business details. Platform names alone do not mean the user wants to switch production categories.",
    "Ask follow-up questions and suggest modules appropriate to this category. Switch only when the user clearly requests a different primary deliverable. Do not infer that production has started; wait for the app's production confirmation flow."
  ].join("\n");
}
