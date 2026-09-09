/**
 * Assistant production start — UI only.
 * After a card is chosen, the floor shows required categories, options,
 * sub-features and materials. Bind Work Brain. Do not invent a job API.
 */

export type ProductionIntentId = "international" | "scorer" | "scratch";

export type ProductionIntent = {
  id: ProductionIntentId;
  kicker: string;
  title: string;
  lead: string;
  href?: string;
  categories: string[];
  options: string[];
  subFeatures: string[];
  materials: string[];
};

export const PRODUCTION_INTENTS: ProductionIntent[] = [
  {
    id: "international",
    kicker: "Recommended for global sellers",
    title: "I want to sell my product internationally",
    lead: "Localize hooks, visuals and campaign direction so the host never drops an order on camera in another market.",
    categories: [
      "Localization",
      "Product video",
      "Campaign pack",
      "Avatars & Voice",
    ],
    options: [
      "Destination market",
      "Spoken language",
      "On-screen language",
      "Aspect 9:16 or 16:9",
      "Price / currency plate",
    ],
    subFeatures: [
      "Hook rewrite",
      "Subtitle burn-in",
      "Cultural stills",
      "CTA language",
      "End card lockup",
    ],
    materials: [
      "Product URL or SKU photos",
      "Offer copy",
      "Destination market",
      "Brand files (optional)",
      "Reference ads (optional)",
    ],
  },
  {
    id: "scorer",
    kicker: "Fastest free entry",
    title: "I want to test my existing ad",
    lead: "Use the free AI Ad Scorer to find hook, CTA and proof gaps before you spend credits.",
    href: "/free-tools/ad-performance-score-checker",
    categories: ["Free tools", "Ad scorer"],
    options: ["Upload a file", "Paste a public URL"],
    subFeatures: [
      "Hook gap",
      "CTA gap",
      "Proof gap",
      "No invented score in this pack",
    ],
    materials: ["Existing ad file or URL"],
  },
  {
    id: "scratch",
    kicker: "Best for new ideas",
    title: "I want to create from scratch",
    lead: "Product video, landing page, campaign pack or launch asset from one brief.",
    categories: [
      "Product video",
      "Landing page",
      "Campaign pack",
      "Launch asset",
      "Special Video",
    ],
    options: [
      "Format (9:16 / 16:9 / 1:1)",
      "Length",
      "Host on camera or no host",
      "Voice / avatar",
      "End card",
    ],
    subFeatures: [
      "Script",
      "Stills",
      "Voice-over",
      "Subtitle",
      "Pack shot",
      "ZIP handoff",
    ],
    materials: [
      "Product",
      "Brand files",
      "Offer",
      "References",
      "Showcase sample (optional)",
    ],
  },
];

export function getIntent(id: string | null | undefined) {
  if (!id) return null;
  return PRODUCTION_INTENTS.find((p) => p.id === id) ?? null;
}
