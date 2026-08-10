export type ShowcaseVideo = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  videoUrl: string;
  imageUrl?: string;
  duration?: string;
  uploadDate: string;
  details: string[];
  bestFor: string[];
};

export const showcaseVideos: ShowcaseVideo[] = [
  {
    id: "product-link-to-video-showcase",
    title: "Product Link to Video",
    kicker: "Ecommerce ad workflow",
    description: "A Crelavo showcase showing how a product link becomes a ready social ad video.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/image/1786368284679743170-1786368284668.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/video/1786368316104444782-1786368316088.mp4",
    duration: "PT14S",
    uploadDate: "2026-08-10T21:00:00.000Z",
    details: [
      "A product-link-to-video showcase built for Crelavo's ecommerce production workflow.",
      "Shows how sellers can move from product page or store link to a polished social ad video direction.",
      "Designed for homepage proof, showcase pages and social media campaign examples."
    ],
    bestFor: ["Product link to video", "Ecommerce ads", "Shopify/Amazon sellers", "Homepage visual proof"]
  },
  {
    id: "crelavo-wow-reel",
    title: "Crelavo Wow Reel",
    kicker: "Viral visual",
    description: "A high-impact creature-led Crelavo concept built to stop the scroll.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A viral visual hook designed to catch attention fast before visitors read long explanation.",
      "Shows how Crelavo can turn a brand idea into a scroll-stopping social video concept.",
      "Useful for awareness ads, social media openers and campaign visuals that need instant curiosity."
    ],
    bestFor: ["Viral hooks", "Top-of-funnel ads", "Social media attention", "Brand awareness"]
  },
  {
    id: "crelavo-energy-system",
    title: "Crelavo Energy System",
    kicker: "Premium motion",
    description: "A cinematic chain-and-cube sequence showing Crelavo as an energetic creative engine.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148834458072949-1786148834448.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A premium creative-system visual with connected motion, cube energy and cinematic pacing.",
      "Makes the platform feel advanced, technical and high-value.",
      "Useful for brand pages, product launch sections and premium motion identities."
    ],
    bestFor: ["Premium brand motion", "Technology positioning", "Product launch visuals", "High-value landing pages"]
  },
  {
    id: "crelavo-product-story",
    title: "Crelavo Product Story",
    kicker: "Presenter demo",
    description: "A direct product explanation for visitors who want to understand the platform quickly.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148847561742266-1786148847522.mp4",
    uploadDate: "2026-08-08T08:00:00.000Z",
    details: [
      "A clear product-story format that explains what Crelavo does in a direct way.",
      "Supports landing-page copy with a human-style explanation.",
      "Best for onboarding, product education and conversion support."
    ],
    bestFor: ["Product explanation", "Homepage education", "Retargeting", "Conversion support"]
  },
  {
    id: "phoenix-awakening",
    title: "Phoenix Awakening",
    kicker: "3D animation",
    description: "A vivid mechanical phoenix teaser built for cinematic social-first storytelling.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-23/video/1786203250578603803-1786203250560.mp4",
    duration: "PT14S",
    uploadDate: "2026-08-08T23:00:00.000Z",
    details: [
      "A premium 3D animated showcase direction with a mechanical phoenix inside a crystal city.",
      "Designed for homepage proof and social media use without relying on a traditional explainer.",
      "Strong elements include the crystal heart opening, phoenix reveal and branded hero beat."
    ],
    bestFor: ["3D animation showcase", "Social teaser", "Homepage visual proof", "Cinematic brand mood"]
  },
  {
    id: "origami-dragon-meteor",
    title: "Origami Dragon Meteor",
    kicker: "Anime short film",
    description: "A fast neon anime teaser with a paper crane transforming into a luminous dragon.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-01/video/1786209159798605867-1786209159793.mp4",
    duration: "PT7S",
    uploadDate: "2026-08-09T01:00:00.000Z",
    details: [
      "A short anime-film test with a neon meteor impact and glowing paper crane reveal.",
      "Compact 9:16 social-first teaser with fast visual escalation and fantasy energy.",
      "Included as a direct Crelavo visual showcase for anime short-film production."
    ],
    bestFor: ["Anime short film", "Vertical social teaser", "Fantasy visual test", "Homepage visual proof"]
  },
  {
    id: "turkish-avatar-hook",
    title: "Turkish Avatar Hook",
    kicker: "Avatar speaker",
    description: "A Turkish-speaking avatar ad with a direct FOMO hook for Crelavo showcase and social use.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786219244367608234-1786219244348.mp4",
    duration: "PT17S",
    uploadDate: "2026-08-09T04:00:00.000Z",
    details: [
      "A Turkish voice-over avatar test with a direct FOMO opening line.",
      "Built for homepage proof, Reels, TikTok, Shorts and paid social placements.",
      "Shows Crelavo's talking-video production capability with a professional avatar presence."
    ],
    bestFor: ["Avatar speaker", "Turkish social ad", "Homepage visual proof", "A-roll showcase"]
  },
  {
    id: "luxury-serum-demo",
    title: "Luxury Serum Demo",
    kicker: "Product demo",
    description: "A luxury skincare product demo with cinematic macro beauty shots and a premium hook.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/image/1786222106538364280-1786222106536.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786222067850341317-1786222067841.mp4",
    duration: "PT14S",
    uploadDate: "2026-08-09T04:00:00.000Z",
    details: [
      "A product demo using macro beauty shots, slow product motion and premium lighting.",
      "Built for homepage showcase and social media use with a clean product hero frame.",
      "Suitable for ecommerce, ad campaigns and launch-page proof."
    ],
    bestFor: ["Product demo", "Beauty ad", "Ecommerce showcase", "Homepage visual proof"]
  },
  {
    id: "great-mishaps",
    title: "Great Mishaps",
    kicker: "3D animation",
    description: "A Pixar-style superhero comedy with five lovable misfit heroes and golden-hour cinematic chaos.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/image/1786224521060209859-1786224521053.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/video/1786224496725549080-1786224496690.mp4",
    duration: "PT26S",
    uploadDate: "2026-08-09T05:00:00.000Z",
    details: [
      "A five-character animated superhero comedy with expressive 3D staging and slapstick timing.",
      "Demonstrates full animated storytelling, character ensemble direction and feature-film polish.",
      "Useful for premium 3D animation, character comedy and animated brand storytelling."
    ],
    bestFor: ["3D animation", "Character comedy", "Hero team scene", "Homepage visual proof"]
  }
];

export function getShowcaseVideo(id: string) {
  return showcaseVideos.find((video) => video.id === id);
}

export function absoluteShowcaseVideoImage(video: ShowcaseVideo, siteUrl: string) {
  const fallback = `${siteUrl}/showcase/ai-production-studio.webp`;
  const image = video.imageUrl || fallback;
  return /^https?:\/\//i.test(image) ? image : `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;
}
