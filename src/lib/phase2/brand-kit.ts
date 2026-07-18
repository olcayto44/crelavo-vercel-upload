import type { BrandKit } from "./types";

const hexPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function normalizeBrandKit(input: BrandKit): BrandKit {
  return {
    userId: input.userId,
    logoUrl: input.logoUrl?.trim() || undefined,
    primaryColor: input.primaryColor && hexPattern.test(input.primaryColor) ? input.primaryColor : undefined,
    secondaryColor: input.secondaryColor && hexPattern.test(input.secondaryColor) ? input.secondaryColor : undefined,
    subtitleColor: input.subtitleColor && hexPattern.test(input.subtitleColor) ? input.subtitleColor : input.primaryColor,
    fontUrl: input.fontUrl?.trim() || undefined,
    fontName: input.fontName?.trim() || undefined
  };
}

export function shotstackBrandOverlay(brandKit: BrandKit) {
  const normalized = normalizeBrandKit(brandKit);
  return {
    logo: normalized.logoUrl ? { src: normalized.logoUrl, position: "topRight", width: 140 } : null,
    captions: {
      color: normalized.subtitleColor ?? "#ffffff",
      fontFamily: normalized.fontName ?? "Inter",
      fontUrl: normalized.fontUrl
    },
    colors: {
      primary: normalized.primaryColor ?? "#2563eb",
      secondary: normalized.secondaryColor ?? "#111827"
    }
  };
}
