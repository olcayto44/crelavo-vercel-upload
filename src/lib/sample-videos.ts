export type SampleComment = {
  id: string;
  author: string;
  role?: "user" | "admin";
  text: string;
  createdAt?: string;
  likes?: number;
  replies?: SampleComment[];
};

export type SampleVideo = {
  id: string;
  title: string;
  category: string;
  format: string;
  duration: string;
  quality: string;
  credits: string;
  description: string;
  features: string[];
  href: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  aspectRatio?: string;
  platformTargets?: string[];
  shareReady?: boolean;
  socialCaption?: string;
  hashtags?: string[];
  publishStatus?: "draft" | "ready" | "scheduled" | "published";
  scheduledAt?: string;
  likeCount?: number;
  shareCount?: number;
  comments?: SampleComment[];
};

export const sampleVideos: SampleVideo[] = [
  {
    id: "product-ad-skincare",
    title: "Skincare product ad",
    category: "E-commerce product ad",
    format: "9:16 social video",
    duration: "15-30 sec",
    quality: "720p / 1080p option",
    credits: "Business plan fit",
    description: "Product link, hook, voice-over, subtitles, product close-ups and social CTA in one ready-to-publish package.",
    features: ["Product URL analysis", "Voice-over", "Styled subtitles", "TikTok/Reels/Shorts export"],
    href: "/dashboard/assistant-workspace?idea=Skincare%20product%20ad%20sample",
    likeCount: 842,
    shareCount: 96,
    comments: [
      { id: "c1", author: "Maya", role: "user", text: "This style would work well for a skincare launch.", likes: 18, replies: [{ id: "c1-r1", author: "Crelavo Admin", role: "admin", text: "Yes, you can use the same flow with your own product link and brand assets.", likes: 7 }] },
      { id: "c2", author: "Deniz", role: "user", text: "Can this be made as 1080p vertical?", likes: 9, replies: [{ id: "c2-r1", author: "Crelavo Admin", role: "admin", text: "Yes, choose 9:16 and 1080p premium inside the assistant workflow.", likes: 4 }] }
    ]
  },
  {
    id: "social-hook-fashion",
    title: "Fashion hook test",
    category: "Social campaign",
    format: "9:16 short clips",
    duration: "5-15 sec",
    quality: "480p / 720p drafts",
    credits: "Pro plan fit",
    description: "Fast hook variations for testing angle, caption, CTA and first-three-second retention before buying a premium output.",
    features: ["Multiple hooks", "Caption variants", "Low-priority drafts", "Social publishing prep"],
    href: "/dashboard/assistant-workspace?idea=Fashion%20hook%20test%20sample"
  },
  {
    id: "ugc-product-demo",
    title: "UGC product demo",
    category: "AI video",
    format: "Vertical UGC ad",
    duration: "15-30 sec",
    quality: "720p / 1080p option",
    credits: "Business / Ultra",
    description: "Creator-style product explanation with scene plan, voice direction, subtitles and platform-ready export notes.",
    features: ["UGC script", "AI video", "Voice direction", "Ad-ready CTA"],
    href: "/dashboard/assistant-workspace?idea=UGC%20product%20demo%20sample"
  },
  {
    id: "music-visualizer",
    title: "Music visualizer teaser",
    category: "Music video / MV",
    format: "9:16 teaser + lyric moments",
    duration: "15-45 sec",
    quality: "720p / 1080p option",
    credits: "Business / Ultra",
    description: "Song mood, lyrics, performance notes and social teaser delivery for artists or labels.",
    features: ["Lyric moments", "Moodboard", "Performance notes", "Social teaser output"],
    href: "/dashboard/assistant-workspace?idea=Music%20visualizer%20sample"
  },
  {
    id: "saas-launch-video",
    title: "SaaS launch promo",
    category: "SaaS / website launch",
    format: "Product explainer",
    duration: "15-30 sec",
    quality: "720p / 1080p option",
    credits: "Business plan fit",
    description: "Dashboard screenshots, value proposition, UI highlights, voice-over and launch copy for SaaS products.",
    features: ["Script", "UI highlights", "Voice-over", "Launch captions"],
    href: "/dashboard/assistant-workspace?idea=SaaS%20launch%20promo%20sample"
  },
  {
    id: "bulk-store-campaign",
    title: "Bulk store campaign",
    category: "E-commerce automation",
    format: "Multi-output campaign pack",
    duration: "3 or 5 variants",
    quality: "720p standard / 1080p premium",
    credits: "Ultra / Team",
    description: "Multiple product assets, campaign captions, store publishing targets and ROAS hook regeneration workflow.",
    features: ["Bulk products", "3/5 variants", "Store publishing", "ROAS loop"],
    href: "/dashboard/assistant-workspace?idea=Bulk%20store%20campaign%20sample"
  },
  {
    id: "stickman-explainer",
    title: "Stickman explainer",
    category: "Stickman animation",
    format: "9:16 / 16:9 explainer",
    duration: "15-30 sec",
    quality: "480p / 720p draft",
    credits: "Pro plan fit",
    description: "Fast, clear animation package for education, product explanation or idea walkthroughs with simple line characters.",
    features: ["Short script", "Stickman scene plan", "Voice direction", "Subtitle notes"],
    href: "/dashboard/assistant-workspace?idea=Stickman%20explainer%20sample"
  },
  {
    id: "stickman-comedy-skit",
    title: "Stickman comedy skit",
    category: "Stickman animation",
    format: "Vertical comedy short",
    duration: "5-15 sec",
    quality: "Fast draft",
    credits: "Pro / Business",
    description: "Quick punchline, simple character flow and shareable short skit format for social media.",
    features: ["Hook", "Punchline", "Character list", "Social format"],
    href: "/dashboard/assistant-workspace?idea=Stickman%20comedy%20skit%20sample"
  },
  {
    id: "localization-ad-pack",
    title: "Global ad localization",
    category: "Global localization",
    format: "Country variants",
    duration: "15-30 sec",
    quality: "720p / 1080p option",
    credits: "Business / Ultra",
    description: "Repackages the same campaign for the target country with language, culture, voice tone, subtitle and publishing notes.",
    features: ["Language adaptation", "Cultural notes", "Voice plan", "Country variants"],
    href: "/dashboard/assistant-workspace?idea=Global%20ad%20localization%20sample"
  },
  {
    id: "brand-kit-motion",
    title: "Brand kit motion teaser",
    category: "Brand kit / visual",
    format: "Logo + social teaser",
    duration: "5-15 sec",
    quality: "720p standard",
    credits: "Business plan fit",
    description: "Makes a new brand identity visible with logo direction, color language, a social opening animation and delivery notes.",
    features: ["Logo concept", "Color language", "Social teaser", "Usage notes"],
    href: "/dashboard/assistant-workspace?idea=Brand%20kit%20motion%20teaser%20sample"
  },
  {
    id: "two-d-animation-story",
    title: "2D animation story",
    category: "2D animation video",
    format: "Animated social short",
    duration: "15-30 sec",
    quality: "720p / 1080p option",
    credits: "Pro / Business",
    description: "A clean 2D animated story with characters, short script, scene flow, voice direction and social-ready export.",
    features: ["2D animation", "Character scene", "Voice direction", "Social export"],
    href: "/dashboard/assistant-workspace?idea=2D%20animation%20story%20sample"
  },
  {
    id: "three-d-product-motion",
    title: "3D product motion",
    category: "3D animation video",
    format: "3D product reveal",
    duration: "10-20 sec",
    quality: "1080p premium",
    credits: "Business / Ultra",
    description: "A premium 3D product reveal with motion, close-ups, brand color direction and polished product showcase pacing.",
    features: ["3D animation", "Product reveal", "Premium motion", "Brand visuals"],
    href: "/dashboard/assistant-workspace?idea=3D%20product%20motion%20sample"
  },
  {
    id: "cinematic-4k-promo",
    title: "Cinematic 4K promo",
    category: "Cinematic video",
    format: "Wide / vertical premium promo",
    duration: "15-60 sec",
    quality: "4K direction",
    credits: "Ultra / Team",
    description: "A cinematic premium promo direction with camera language, dramatic lighting, music mood and high-end delivery notes.",
    features: ["Cinematic camera", "4K direction", "Premium grading", "Music mood"],
    href: "/dashboard/assistant-workspace?idea=Cinematic%204K%20promo%20sample"
  },
  {
    id: "quick-720p-draft",
    title: "720p quick draft",
    category: "Fast draft video",
    format: "Low-cost test clip",
    duration: "5-15 sec",
    quality: "720p draft",
    credits: "Starter / Pro",
    description: "A fast 720p draft workflow for testing hooks, visuals and direction before spending credits on a premium version.",
    features: ["Quick test", "720p draft", "Hook validation", "Low-cost preview"],
    href: "/dashboard/assistant-workspace?idea=720p%20quick%20draft%20sample"
  },
  {
    id: "premium-1080p-ad",
    title: "1080p premium ad",
    category: "Premium ad video",
    format: "Social / web campaign video",
    duration: "15-30 sec",
    quality: "1080p premium",
    credits: "Business plan fit",
    description: "A polished 1080p campaign video with product story, CTA, voice-over direction, subtitles and final delivery package.",
    features: ["1080p premium", "CTA", "Voice-over", "Final MP4"],
    href: "/dashboard/assistant-workspace?idea=1080p%20premium%20ad%20sample"
  },
  {
    id: "ai-shorts-beauty-message",
    title: "AI shorts beauty message",
    category: "AI shorts video",
    format: "Vertical inspirational short",
    duration: "10-20 sec",
    quality: "1080p option",
    credits: "Pro / Business",
    description: "A vertical AI shorts concept inspired by social storytelling pages: expressive subject, emotional message, subtitles and short-form pacing.",
    features: ["AI shorts", "Emotional message", "Subtitles", "Vertical video"],
    href: "/dashboard/assistant-workspace?idea=AI%20shorts%20beauty%20message%20sample"
  },
  {
    id: "motion-graphics-explainer",
    title: "Motion graphics explainer",
    category: "Motion graphics",
    format: "Explainer / SaaS video",
    duration: "20-45 sec",
    quality: "1080p",
    credits: "Business",
    description: "A motion graphics explainer for products, SaaS, apps or education with structured scenes and clear delivery notes.",
    features: ["Motion graphics", "Explainer", "Scene plan", "SaaS friendly"],
    href: "/dashboard/assistant-workspace?idea=Motion%20graphics%20explainer%20sample"
  }
];
