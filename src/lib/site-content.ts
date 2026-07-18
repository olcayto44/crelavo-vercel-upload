import { footerInfoHref, productionInfoHref } from "@/lib/footer-info-pages";

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

export const footerGroups: FooterGroup[] = [
  {
    title: "Products",
    links: [
      { label: "Text-to-Campaign", href: footerInfoHref("text-to-campaign") },
      { label: "AI Video Generator", href: footerInfoHref("ai-video-generator") },
      { label: "Advanced Talking Video", href: footerInfoHref("advanced-talking-video") },
      { label: "AI Music Video", href: footerInfoHref("ai-music-video") },
      { label: "Series / Film Studio", href: footerInfoHref("series-film-studio") },
      { label: "AI Live Sales Agent", href: productionInfoHref("live_sales_agent") },
      { label: "Drama / Short Series", href: productionInfoHref("drama") },
      { label: "Documentary", href: productionInfoHref("documentary") },
      { label: "Animation", href: productionInfoHref("animation") },
      { label: "Anime Short Film", href: productionInfoHref("anime_short_film") },
      { label: "AI Agents", href: footerInfoHref("ai-agents") },
      { label: "Global Localization", href: footerInfoHref("global-localization") },
      { label: "Brand Kit", href: footerInfoHref("brand-kit") },
      { label: "Document Pack", href: footerInfoHref("document-pack") }
    ]
  },
  {
    title: "Video Tools",
    links: [
      { label: "Image to Video", href: footerInfoHref("image-to-video") },
      { label: "Text to Video", href: footerInfoHref("text-to-video") },
      { label: "Seedance 2.0 Video", href: footerInfoHref("seedance-2-video") },
      { label: "Cinematic Video", href: productionInfoHref("cinematic_video") },
      { label: "Video Clipping", href: productionInfoHref("video_clipping") },
      { label: "Video Tools Pack", href: productionInfoHref("video_tools") },
      { label: "UGC Video", href: footerInfoHref("ugc-video") },
      { label: "Stickman Animation", href: footerInfoHref("stickman-animation") },
      { label: "Animal Video", href: productionInfoHref("animal_video") },
      { label: "Nature Video", href: productionInfoHref("nature_video") },
      { label: "Planet / Space Video", href: productionInfoHref("planet_space_video") },
      { label: "Drone / Satellite Video", href: productionInfoHref("drone_video") },
      { label: "Product Ad Video", href: footerInfoHref("product-ad-video") },
      { label: "Long Film/Series Clipping", href: footerInfoHref("long-film-series-clipping") },
      { label: "Social Campaign Video", href: footerInfoHref("social-campaign-video") }
    ]
  },
  {
    title: "Music and Audio Tools",
    links: [
      { label: "Music Video / MV", href: footerInfoHref("music-video-mv") },
      { label: "Lyric Video", href: footerInfoHref("lyric-video") },
      { label: "Visualizer", href: footerInfoHref("visualizer") },
      { label: "Voice-over", href: footerInfoHref("voice-over") },
      { label: "AI Dubbing / Lip-Sync", href: footerInfoHref("ai-dubbing-lip-sync") },
      { label: "Lip Sync Video", href: productionInfoHref("lip_sync") },
      { label: "Voice Cloning", href: productionInfoHref("voice_clone") },
      { label: "Language and Market Adaptation", href: footerInfoHref("language-market-adaptation") }
    ]
  },
  {
    title: "Business and File Production",
    links: [
      { label: "Website", href: footerInfoHref("website") },
      { label: "SaaS", href: footerInfoHref("saas") },
      { label: "Mobile App", href: footerInfoHref("mobile-app") },
      { label: "Admin Panel", href: footerInfoHref("admin-panel") },
      { label: "Admin Panel Project", href: productionInfoHref("admin_project") },
      { label: "Pitch Deck / PDF", href: footerInfoHref("pitch-deck-pdf") },
      { label: "Visual / Image Pack", href: footerInfoHref("visual-image-pack") },
      { label: "Image / Visual", href: productionInfoHref("image") },
      { label: "Document / File Pack", href: productionInfoHref("document_pack") }
    ]
  },
  {
    title: "More Production Categories",
    links: [
      { label: "Avatar Design / Avatar Video", href: productionInfoHref("avatar") },
      { label: "Visual Clone / Style Clone", href: productionInfoHref("visual_clone") },
      { label: "AI Tool Alternatives", href: "/alternatives" },
      { label: "All Production Categories", href: footerInfoHref("categories") },
      { label: "Explore Samples", href: "/showcase/explore-samples" },
      { label: "All Tools", href: "/showcase/all-tools" }
    ]
  },
  {
    title: "Free Tools",
    links: [
      { label: "Free Tools Hub", href: "/free-tools" },
      { label: "TikTok Hook Generator", href: "/free-tools/tiktok-hook-generator" },
      { label: "AI Prompt Generator", href: "/free-tools/ai-prompt-generator" },
      { label: "Product Description Generator", href: "/free-tools/product-description-generator" },
      { label: "YouTube Title Generator", href: "/free-tools/youtube-title-generator" },
      { label: "Instagram Caption Generator", href: "/free-tools/instagram-caption-generator" },
      { label: "Ad Copy Generator", href: "/free-tools/ad-copy-generator" },
      { label: "Brand Slogan Generator", href: "/free-tools/brand-slogan-generator" }
    ]
  },
  {
    title: "Platform",
    links: [
      { label: "Categories", href: footerInfoHref("categories") },
      { label: "Pricing", href: footerInfoHref("pricing") },
      { label: "Dashboard", href: footerInfoHref("dashboard") },
      { label: "My Productions", href: footerInfoHref("my-productions") },
      { label: "Credit Packages", href: footerInfoHref("credit-packages") },
      { label: "Connections", href: footerInfoHref("connections") }
    ]
  },
  {
    title: "Company and Help",
    links: [
      { label: "Frequently Asked Questions", href: "/#faq" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund / Cancellation Policy", href: "/refund-policy" },
      { label: "Usage Rules", href: "/pricing" },
      { label: "Contact / Support", href: "/contact" },
      { label: "Blog / Content", href: "/blog" },
      { label: "API and Integrations", href: "/dashboard/connections" },
      { label: "Partner Program", href: "/affiliate" }
    ]
  }
];

export const defaultFaqItems: FaqItem[] = [
  {
    id: "what-is-clipora",
    question: "What exactly does Crelavo produce?",
    answer: "Crelavo prepares managed production requests for videos, music videos, visuals, brand kits, documents, websites, SaaS screens, mobile apps, and campaign packages through a credit-based workflow.",
    category: "General",
    order: 1,
    active: true
  },
  {
    id: "is-it-automatic",
    question: "Does the system run fully automatically?",
    answer: "The target is full automation. In the current phase, user requests, credit reservation, admin monitoring, and dashboard delivery work together; production steps become more automated as provider integrations are enabled.",
    category: "Production",
    order: 2,
    active: true
  },
  {
    id: "credits-how-work",
    question: "How are credits calculated?",
    answer: "Each production type has a starting credit cost and package options. Output count, extra visuals, revision buffer, video/audio/visual scope, and delivery details can increase the credit cost.",
    category: "Credits",
    order: 3,
    active: true
  },
  {
    id: "final-or-preview",
    question: "Do I get a demo/trailer first or the final production?",
    answer: "Crelavo is designed with a final-output-first mindset. Users can add preview or revision stages when needed, but the system is not locked to a mandatory trailer step.",
    category: "Delivery",
    order: 4,
    active: true
  },
  {
    id: "which-tools",
    question: "Which AI tools are supported?",
    answer: "The platform brings together AI video, image-to-video, text-to-video, Seedance 2.0, UGC video, music video, voice-over, dubbing, localization, brand kit, and file production flows inside one production panel.",
    category: "Tools",
    order: 5,
    active: true
  },
  {
    id: "admin-can-edit-faq",
    question: "Can FAQ and footer content be managed from the admin panel?",
    answer: "FAQ entries can be added, edited, and deleted from the admin panel. Footer link groups are currently prepared in code around Crelavo system categories and can later move to the same admin-managed config structure.",
    category: "Admin",
    order: 6,
    active: true
  }
];
