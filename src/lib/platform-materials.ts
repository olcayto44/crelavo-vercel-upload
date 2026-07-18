export type PlatformMaterial = {
  id: string;
  title: string;
  type: "product" | "brand_asset" | "scene" | "music" | "template";
  category: string;
  description: string;
  previewUrl: string;
  fileUrl: string;
  usageTags: string[];
  active: boolean;
};

export const platformMaterials: PlatformMaterial[] = [
  {
    id: "clipora-cosmetic-serum",
    title: "Crelavo Glow Serum",
    type: "product",
    category: "Beauty / skincare",
    description: "Premium serum product pack for beauty ads, product pages and social visuals.",
    previewUrl: "/materials/clipora-glow-serum-preview.jpg",
    fileUrl: "/materials/clipora-glow-serum-pack.zip",
    usageTags: ["beauty", "skincare", "product_ad", "ecommerce"],
    active: true
  },
  {
    id: "clipora-coffee-pack",
    title: "Crelavo Artisan Coffee",
    type: "product",
    category: "Food / beverage",
    description: "Coffee bag, cup and cafe mood assets for reels, banners and store visuals.",
    previewUrl: "/materials/clipora-coffee-preview.jpg",
    fileUrl: "/materials/clipora-coffee-pack.zip",
    usageTags: ["coffee", "restaurant", "cafe", "social"],
    active: true
  },
  {
    id: "clipora-saas-dashboard-kit",
    title: "Crelavo SaaS Dashboard Kit",
    type: "template",
    category: "SaaS / web",
    description: "Dashboard, pricing, auth and admin panel starter visuals for web/app productions.",
    previewUrl: "/materials/clipora-saas-dashboard-preview.jpg",
    fileUrl: "/materials/clipora-saas-dashboard-kit.zip",
    usageTags: ["saas", "website", "admin", "source_delivery"],
    active: true
  },
  {
    id: "clipora-luxury-showroom",
    title: "Luxury Showroom Scene",
    type: "scene",
    category: "Scene / environment",
    description: "Premium showroom background direction for product, brand and localization outputs.",
    previewUrl: "/materials/luxury-showroom-preview.jpg",
    fileUrl: "/materials/luxury-showroom-scene-pack.zip",
    usageTags: ["luxury", "showroom", "product", "brand"],
    active: true
  },
  {
    id: "clipora-social-brand-pack",
    title: "Crelavo Social Brand Pack",
    type: "brand_asset",
    category: "Brand / social",
    description: "Reusable social color, layout and CTA assets controlled by Crelavo.",
    previewUrl: "/materials/clipora-social-brand-preview.jpg",
    fileUrl: "/materials/clipora-social-brand-pack.zip",
    usageTags: ["brand", "social", "campaign", "template"],
    active: true
  },
  {
    id: "clipora-fashion-drop-kit",
    title: "Fashion Drop Launch Kit",
    type: "product",
    category: "Fashion / apparel",
    description: "Apparel drop visuals, product angles and social ad references for fashion launches.",
    previewUrl: "/materials/fashion-drop-preview.jpg",
    fileUrl: "/materials/fashion-drop-launch-kit.zip",
    usageTags: ["fashion", "apparel", "launch", "social_ad"],
    active: true
  },
  {
    id: "clipora-tech-gadget-pack",
    title: "Tech Gadget Product Pack",
    type: "product",
    category: "Tech / electronics",
    description: "Premium device, accessory and ecommerce mockup material for gadget campaigns.",
    previewUrl: "/materials/tech-gadget-preview.jpg",
    fileUrl: "/materials/tech-gadget-pack.zip",
    usageTags: ["tech", "electronics", "ecommerce", "product_ad"],
    active: true
  },
  {
    id: "clipora-restaurant-menu-kit",
    title: "Restaurant Menu Visual Kit",
    type: "product",
    category: "Restaurant / food",
    description: "Menu, food closeup and local campaign materials for restaurant promos.",
    previewUrl: "/materials/restaurant-menu-preview.jpg",
    fileUrl: "/materials/restaurant-menu-kit.zip",
    usageTags: ["restaurant", "food", "menu", "local_campaign"],
    active: true
  },
  {
    id: "clipora-real-estate-showcase",
    title: "Real Estate Showcase Scene",
    type: "scene",
    category: "Real estate / property",
    description: "Interior, exterior and premium property scene references for listings and videos.",
    previewUrl: "/materials/real-estate-showcase-preview.jpg",
    fileUrl: "/materials/real-estate-showcase.zip",
    usageTags: ["real_estate", "property", "listing", "video"],
    active: true
  },
  {
    id: "clipora-gym-fitness-kit",
    title: "Gym & Fitness Campaign Kit",
    type: "scene",
    category: "Fitness / wellness",
    description: "Gym, trainer, transformation and promo references for fitness campaigns.",
    previewUrl: "/materials/gym-fitness-preview.jpg",
    fileUrl: "/materials/gym-fitness-kit.zip",
    usageTags: ["fitness", "gym", "wellness", "promo"],
    active: true
  },
  {
    id: "clipora-app-store-screens",
    title: "Mobile App Store Screens",
    type: "template",
    category: "Mobile app / SaaS",
    description: "App store screenshot layouts, onboarding frames and mobile UI promo references.",
    previewUrl: "/materials/app-store-screens-preview.jpg",
    fileUrl: "/materials/app-store-screens.zip",
    usageTags: ["mobile_app", "app_store", "saas", "ui"],
    active: true
  },
  {
    id: "clipora-shopify-storefront-kit",
    title: "Shopify Storefront Kit",
    type: "template",
    category: "Ecommerce / Shopify",
    description: "Storefront hero, product card, collection and checkout reference package.",
    previewUrl: "/materials/shopify-storefront-preview.jpg",
    fileUrl: "/materials/shopify-storefront-kit.zip",
    usageTags: ["shopify", "ecommerce", "storefront", "website"],
    active: true
  },
  {
    id: "clipora-youtube-shorts-kit",
    title: "YouTube Shorts Motion Kit",
    type: "template",
    category: "Short-form video",
    description: "Hook, subtitle, cover and motion layout references for Shorts/Reels/TikTok cuts.",
    previewUrl: "/materials/youtube-shorts-preview.jpg",
    fileUrl: "/materials/youtube-shorts-motion-kit.zip",
    usageTags: ["shorts", "reels", "tiktok", "subtitles"],
    active: true
  },
  {
    id: "clipora-podcast-audio-pack",
    title: "Podcast Audio Identity Pack",
    type: "music",
    category: "Audio / podcast",
    description: "Intro, outro, lower-third and spoken content direction for podcast-style productions.",
    previewUrl: "/materials/podcast-audio-preview.jpg",
    fileUrl: "/materials/podcast-audio-pack.zip",
    usageTags: ["podcast", "audio", "voice", "intro"],
    active: true
  },
  {
    id: "clipora-luxury-brand-kit",
    title: "Luxury Brand Identity Kit",
    type: "brand_asset",
    category: "Luxury / brand",
    description: "Premium typography, social cards, pitch visuals and campaign identity references.",
    previewUrl: "/materials/luxury-brand-preview.jpg",
    fileUrl: "/materials/luxury-brand-kit.zip",
    usageTags: ["luxury", "brand", "identity", "pitch"],
    active: true
  },
  {
    id: "clipora-b2b-deck-template",
    title: "B2B Pitch Deck Template",
    type: "template",
    category: "Document / pitch deck",
    description: "Pitch deck, proposal and investor-ready slide reference package.",
    previewUrl: "/materials/b2b-deck-preview.jpg",
    fileUrl: "/materials/b2b-pitch-deck-template.zip",
    usageTags: ["deck", "pdf", "proposal", "b2b"],
    active: true
  },
  {
    id: "clipora-avatar-reference-kit",
    title: "Avatar Reference Kit",
    type: "brand_asset",
    category: "Avatar / character",
    description: "Avatar identity, talking-video, self-in-video and character consistency references.",
    previewUrl: "/materials/avatar-reference-preview.jpg",
    fileUrl: "/materials/avatar-reference-kit.zip",
    usageTags: ["avatar", "talking_video", "character", "identity"],
    active: true
  },
  {
    id: "clipora-localization-pack",
    title: "Localization Asset Pack",
    type: "template",
    category: "Localization / global",
    description: "Regional copy, subtitle, language and market adaptation reference material.",
    previewUrl: "/materials/localization-preview.jpg",
    fileUrl: "/materials/localization-asset-pack.zip",
    usageTags: ["localization", "subtitles", "language", "global"],
    active: true
  },
  {
    id: "clipora-event-promo-kit",
    title: "Event Promo Visual Kit",
    type: "scene",
    category: "Event / launch",
    description: "Event poster, speaker, schedule and social launch references for campaigns.",
    previewUrl: "/materials/event-promo-preview.jpg",
    fileUrl: "/materials/event-promo-kit.zip",
    usageTags: ["event", "launch", "poster", "social"],
    active: true
  },
  {
    id: "clipora-course-launch-kit",
    title: "Course Launch Kit",
    type: "template",
    category: "Education / course",
    description: "Course landing, webinar, lesson preview and creator education launch references.",
    previewUrl: "/materials/course-launch-preview.jpg",
    fileUrl: "/materials/course-launch-kit.zip",
    usageTags: ["course", "education", "webinar", "creator"],
    active: true
  }
];

export function activePlatformMaterials() {
  return platformMaterials.filter((material) => material.active);
}

export function platformMaterialsByIds(ids: string[]) {
  const allowed = new Set(ids);
  return activePlatformMaterials().filter((material) => allowed.has(material.id));
}
