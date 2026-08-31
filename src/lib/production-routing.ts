const DRONE_REQUEST = /\b(?:drone|drones|uydu|satellite|aerial|flyover|map\s+route|route\s+flyover|location\s+reveal|harita|rota)\b/i;
const SOCIAL_AD_REQUEST = /\b(?:tiktok|reels|instagram\s+reels|shorts|youtube\s+shorts|social\s+media|social\s+ad|social\s+campaign|fomo|e-?commerce|e-?ticaret|product\s+ad|product\s+advert|promo\s+video|ready[-\s]+to[-\s]+post|crelavo)\b/i;
const NO_PRESENTER_REQUEST = /(?:no\s+(?:presenter|people|person|human|avatar|voice)|without\s+(?:presenter|people|a\s+presenter)|no-presenter|no[_\s]?people|noPeopleMotionIntent|b-?roll\s+only|ui[-\s]?only|sunucusuz|insans[ıi]z|ki[şs]i\s+olmas[ıi]n|insan\s+olmas[ıi]n|seslendirme\s+olmas[ıi]n|voice-?over\s*(?:off|none)|music[-\s]+only|sadece\s+m[üu]zik)/i;

export function isExplicitDroneRequest(text: string) {
  return DRONE_REQUEST.test(String(text ?? ""));
}

export function isNoPresenterSocialVideoRequest(text: string, productionType = "", packageId = "") {
  const haystack = `${productionType} ${packageId} ${String(text ?? "")}`;
  const videoPackage = /(?:video_premium|campaign_product_ad_video|product_ad_video)/i.test(packageId);
  const socialSignal = SOCIAL_AD_REQUEST.test(haystack) || (productionType.toLowerCase() === "video" && videoPackage);
  return !isExplicitDroneRequest(haystack) && socialSignal && NO_PRESENTER_REQUEST.test(haystack);
}

function normalizeProvider(value: unknown) {
  const provider = String(value ?? "").trim().toLowerCase();
  if (["minimax", "minimax_h3", "minimax-h3", "minimax_video_agent"].includes(provider)) return "minimax" as const;
  return provider || undefined;
}

export function resolveProductionRoute(input: { text: string; productionType?: string; packageId?: string; preferredProvider?: string }) {
  const productionType = String(input.productionType ?? "");
  const packageId = String(input.packageId ?? "");
  const text = String(input.text ?? "");
  if (isNoPresenterSocialVideoRequest(text, productionType, packageId)) {
    return { productionType: "video", provider: "minimax" as const, route: "normal_social_video_no_presenter" as const };
  }
  if (isExplicitDroneRequest(`${productionType} ${text}`)) {
    return { productionType: "drone_video", provider: "runway" as const, route: "drone_video" as const };
  }
  return { productionType, provider: normalizeProvider(input.preferredProvider), route: "default" as const };
}
