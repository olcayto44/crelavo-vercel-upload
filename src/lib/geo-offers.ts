export type GeoOfferSegment = "US" | "UK" | "EU" | "CA_AU" | "TR" | "GLOBAL";

export type GeoOfferCopy = {
  segment: GeoOfferSegment;
  country: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  kicker: string;
  bonusPrimary: string;
  bonusSecondary: string;
  homepageBadge: string;
  homepageTitle: string;
  homepageDescription: string;
};

const euCountries = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "CH"
]);

const baseHref = "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000";

export function normalizeCountryCode(value: string | null | undefined) {
  const country = String(value ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  if (!country || country === "XX") return "GLOBAL";
  if (country === "UK") return "GB";
  return country;
}

export function geoSegmentForCountry(countryCode: string): GeoOfferSegment {
  const country = normalizeCountryCode(countryCode);
  if (country === "US") return "US";
  if (country === "GB") return "UK";
  if (country === "CA" || country === "AU") return "CA_AU";
  if (euCountries.has(country)) return "EU";
  if (country === "TR") return "TR";
  return "GLOBAL";
}

export function countryFromHeaders(headersList: Headers) {
  return normalizeCountryCode(
    headersList.get("x-vercel-ip-country")
    || headersList.get("cf-ipcountry")
    || headersList.get("x-country")
    || headersList.get("x-geo-country")
  );
}

export function geoOfferForCountry(countryCode: string): GeoOfferCopy {
  const country = normalizeCountryCode(countryCode);
  const segment = geoSegmentForCountry(country);

  const shared = {
    segment,
    country,
    cta: "START 24-HOUR TEAM PREVIEW FOR $20",
    href: baseHref,
    bonusPrimary: "174,000 annual credits",
    bonusSecondary: "$20 secure Whop preview"
  };

  if (segment === "US") {
    return {
      ...shared,
      eyebrow: "US ecommerce teams",
      title: "Scale Shopify, Amazon and DTC video ads from one AI production workspace",
      body: "For US Shopify, Amazon and DTC teams: test product-video ads, UGC-style variations and client-ready campaign delivery with a secure $20 Whop preview before the $1,300 Team Annual plan continues.",
      kicker: "US Meta Sales traffic · Whop-secure preview",
      homepageBadge: "US ecommerce teams",
      homepageTitle: "$20 Team Annual preview for US Shopify/Amazon teams",
      homepageDescription: "Built for US Shopify, Amazon FBA and DTC teams that want to test product-video production before the $1,300 yearly plan continues."
    };
  }

  if (segment === "UK") {
    return {
      ...shared,
      eyebrow: "UK ecommerce agencies",
      title: "Preview AI product-video delivery for UK brands and agency teams",
      body: "For UK ecommerce agencies and marketplace sellers: test Crelavo’s product-video workflow, approval handoff and client-ready delivery with a secure $20 Whop preview before the annual plan continues.",
      kicker: "UK agency workflow · Whop-secure preview",
      homepageBadge: "UK ecommerce agencies",
      homepageTitle: "$20 Team Annual preview for UK ecommerce agencies",
      homepageDescription: "Preview Crelavo’s product-video workflow for UK brands, sellers and agency delivery before the yearly Team plan continues."
    };
  }

  if (segment === "CA_AU") {
    return {
      ...shared,
      eyebrow: "Canada & Australia ecommerce teams",
      title: "Test AI product-video production for English-speaking ecommerce markets",
      body: "For Canada and Australia ecommerce teams: preview Shopify, Amazon and DTC campaign production with a secure $20 Whop trial before scaling into the Team Annual workflow.",
      kicker: "CA/AU ecommerce traffic · Whop-secure preview",
      homepageBadge: "CA/AU ecommerce teams",
      homepageTitle: "$20 Team Annual preview for Canada & Australia sellers",
      homepageDescription: "For Canada and Australia teams seeing product-video demand: test Crelavo’s Shopify/Amazon campaign workflow before scaling."
    };
  }

  if (segment === "EU") {
    return {
      ...shared,
      eyebrow: "EU marketplace teams",
      title: "Plan localized product ads, subtitles and marketplace campaign variations",
      body: "For EU DTC and marketplace teams: test localized product-video angles, subtitles and campaign variations with a secure $20 Whop preview before the Team Annual plan continues.",
      kicker: "EU localization angle · Whop-secure preview",
      homepageBadge: "EU marketplace teams",
      homepageTitle: "$20 Team Annual preview for EU DTC and marketplace teams",
      homepageDescription: "Plan localized ads, subtitles and product-video variations before scaling into a yearly Team workflow."
    };
  }

  if (segment === "TR") {
    return {
      ...shared,
      eyebrow: "Secure global preview",
      title: "Test Crelavo with a low-risk Whop preview before scaling",
      body: "Start with a secure 24-hour Whop preview, review the product-video workflow and continue only if the Team Annual production setup fits your business.",
      kicker: "Preview first · scale only if it fits",
      homepageBadge: "Secure preview",
      homepageTitle: "$20 Team Annual preview before you scale",
      homepageDescription: "Start with a secure Whop preview, review the workflow and continue only if Crelavo fits your production needs."
    };
  }

  return {
    ...shared,
    eyebrow: "Secure Whop preview",
    title: "Start with a 24-hour preview, then scale only when the workflow fits",
    body: "Test Crelavo’s ecommerce production workflow with a secure $20 Whop preview. If it fits, the Team Annual plan continues with 174,000 annual credits and client-ready delivery workflows.",
    kicker: "Global preview · no fake local scarcity",
    homepageBadge: "Secure Whop preview",
    homepageTitle: "$20 Team Annual preview for ecommerce teams",
    homepageDescription: "Start with a secure 24-hour preview, then scale only when the creative workflow fits your team."
  };
}

export function geoOfferFromHeaders(headersList: Headers) {
  return geoOfferForCountry(countryFromHeaders(headersList));
}

export const geoOfferGuardrail = "Geo personalization changes message relevance only; it must not create fake local scarcity, fake local purchases, fake discounts or different price promises.";
