import { seoLaunchKit } from "./seo-launch-kit";

export const aiDirectorySubmissionTargets = [
  { name: "There’s An AI For That", priority: "P1", type: "AI tool directory", status: "prepare_manual_submission", fit: "Broad AI tool discovery for Crelavo as an AI production studio.", category: "AI Video, AI Website Builder, AI App Builder, Marketing Automation" },
  { name: "Futurepedia", priority: "P1", type: "AI tool directory", status: "prepare_manual_submission", fit: "High-intent AI tools audience; submit after public pages and screenshots are ready.", category: "AI Tools, Productivity, Marketing, Design" },
  { name: "Toolify.ai", priority: "P1", type: "AI tool directory", status: "prepare_manual_submission", fit: "SEO and AI discovery listing for multi-category production features.", category: "AI Video Generator, AI Website Builder, AI Marketing" },
  { name: "OpenTools", priority: "P1", type: "AI tool directory", status: "prepare_manual_submission", fit: "General AI tool listing with clear one-line pitch and categories.", category: "AI Productivity, Video, Website, E-commerce" },
  { name: "TopAI.tools", priority: "P1", type: "AI tool directory", status: "prepare_manual_submission", fit: "Fast directory submission for AI production studio positioning.", category: "AI Video, AI Business, AI Design" },
  { name: "Dang.ai", priority: "P2", type: "AI tool directory", status: "prepare_manual_submission", fit: "Additional AI discovery backlink and listing coverage.", category: "AI Tools, Marketing, Video" },
  { name: "AI Tools Directory", priority: "P2", type: "AI tool directory", status: "prepare_manual_submission", fit: "Lower-risk directory listing for organic discovery.", category: "AI Tools, Creator Tools" },
  { name: "AlternativeTo", priority: "P2", type: "SaaS comparison", status: "prepare_profile", fit: "Position Crelavo as an alternative to Canva, Runway, Wix AI, Synthesia and product video tools.", category: "Marketing, Video, Website Builder" },
  { name: "SaaSHub", priority: "P2", type: "SaaS listing", status: "prepare_profile", fit: "SaaS comparison page and backlink opportunity.", category: "Marketing Software, AI Tools" },
  { name: "BetaList", priority: "P2", type: "startup listing", status: "prepare_profile", fit: "Early startup listing once public onboarding and payment tests are stable.", category: "AI, SaaS, Marketing" },
  { name: "Product Hunt", priority: "P3", type: "major launch", status: "wait_until_final_whop_tests", fit: "Do not launch until real Whop payment and onboarding are fully verified.", category: "AI, Marketing, Design Tools" },
  { name: "Hacker News / Show HN", priority: "P3", type: "community launch", status: "wait_until_product_hardened", fit: "Use only after final launch polish; first impression matters.", category: "Show HN, AI SaaS" }
];

export const aiDirectorySubmissionKit = {
  productName: "Crelavo",
  website: "https://www.crelavo.com",
  oneLinePitch: "AI production studio for websites, apps, product videos, ads, brand kits and growth campaigns.",
  shortDescription: "Crelavo helps creators and businesses turn ideas, product links and briefs into websites, apps, product videos, ad campaigns, brand assets, voice-over content and delivery-ready production packages.",
  longDescription: "Crelavo is a managed AI production studio for teams that need more than a single generator. It combines AI video, product-link campaigns, website and app production, SaaS screens, brand kits, visual packs, avatar workflows, voice-over, localization, Growth Intelligence and dashboard delivery in one structured workspace.",
  primaryCategories: [
    "AI production studio",
    "AI video generator",
    "AI website builder",
    "AI app builder",
    "AI marketing campaign platform",
    "AI ecommerce campaign generator",
    "AI product video generator",
    "AI avatar video",
    "AI brand kit builder",
    "No-code production studio"
  ],
  coreKeywords: [
    "AI production studio",
    "AI video generator",
    "text to video",
    "image to video",
    "script to video",
    "product link to ad video",
    "Shopify product video",
    "Amazon product ad video",
    "Trendyol product video",
    "AI ecommerce campaign generator",
    "AI website production",
    "AI app production",
    "SaaS dashboard production",
    "AI avatar video",
    "AI voice-over",
    "voice cloning",
    "lip-sync video",
    "music video generator",
    "animation video",
    "drone satellite video",
    "AI live sales agent",
    "brand kit production",
    "visual cloning",
    "AI image generation",
    "Growth Intelligence"
  ],
  publicLinks: [
    "https://www.crelavo.com",
    "https://www.crelavo.com/categories",
    "https://www.crelavo.com/tools",
    "https://www.crelavo.com/free-tools",
    "https://www.crelavo.com/ai-video-generator",
    "https://www.crelavo.com/ai-website-builder",
    "https://www.crelavo.com/ai-app-builder",
    "https://www.crelavo.com/growth-intelligence",
    "https://www.crelavo.com/pricing",
    "https://www.crelavo.com/blog"
  ],
  launchKit: seoLaunchKit,
  launchGuardrails: [
    "No Lemon application in this phase.",
    "Do not trigger real payout or paid ad spend from directory preparation.",
    "Product Hunt, Hacker News and major community launch wait until final Whop payment tests are complete.",
    "Use Whop/payment wording as the active payment path.",
    ...seoLaunchKit.proofGuardrails
  ]
};

export const organicKeywordCoverage = [
  "AI video generator", "AI product video generator", "product link to ad video", "AI ecommerce campaign generator", "Shopify product link ad video", "Amazon product ad video", "Trendyol product video", "TikTok Shop AI live sales agent", "AI website builder", "AI app builder", "SaaS dashboard", "admin panel builder", "AI avatar video", "talking video", "lip-sync video", "voice cloning", "AI voice-over", "music video", "motion graphics", "2D animation", "3D animation", "stickman animation", "anime short film", "short drama", "cinematic video", "drone satellite video", "map to video", "route flyover video", "brand kit builder", "AI image generation", "visual cloning", "visual style clone", "brand memory", "free AI tools", "Growth Intelligence"
];

export const organicDirectoryLaunchPlan = [
  {
    stage: "Prepare public proof",
    action: "Make sure homepage, categories, pricing, product pages and screenshots are stable before submission.",
    priority: "P1"
  },
  {
    stage: "Submit AI directories first",
    action: "Start with There’s An AI For That, Futurepedia, Toolify.ai, OpenTools, TopAI.tools and Dang.ai.",
    priority: "P1"
  },
  {
    stage: "Add comparison listings",
    action: "Use AlternativeTo, SaaSHub and BetaList after the core public pages and positioning are steady.",
    priority: "P2"
  },
  {
    stage: "Wait for final launch",
    action: "Keep Product Hunt and Hacker News for the final Whop-verified launch window.",
    priority: "P3"
  }
];

export const organicDirectoryBacklinkOperations = [
  { channel: "There’s An AI For That", priority: "P1", action: "Submit Crelavo with AI production studio positioning and dashboard delivery wording.", tracking: "Record submission URL, approval status and backlink/live listing URL." },
  { channel: "Futurepedia", priority: "P1", action: "Submit after public screenshots and pricing/Whop preview wording are stable.", tracking: "Track category, listing URL, approval email and required edits." },
  { channel: "Toolify.ai / OpenTools / TopAI.tools", priority: "P1", action: "Use the same one-line pitch, short description and public link pack without exaggerated proof claims.", tracking: "Track each listing state: prepared, submitted, live, rejected or needs edit." },
  { channel: "AlternativeTo / SaaSHub / BetaList", priority: "P2", action: "Prepare profile/comparison copy after core AI directory submissions.", tracking: "Track referral URL, backlink type and next follow-up date." },
  { channel: "Product Hunt / Hacker News", priority: "P3", action: "Wait until final Whop payment, production E2E and onboarding confidence are verified.", tracking: "Keep as launch-window candidates, not immediate submission tasks." }
];

export const organicDirectoryChecklist = [
  "Public pages are live and consistent",
  "Screenshots and short product copy are ready",
  "Primary categories and keywords match the site",
  "Launch guardrails still block Lemon and paid spend",
  "High-profile launch directories wait until final Whop tests",
  "Directory/backlink operations track submission URL, listing URL, approval status and follow-up owner"
];

export const aiDirectoryBacklinkCopyPack = {
  status: "copy_pack_ready_tracking_required",
  fields: ["oneLinePitch", "shortDescription", "longDescription", "primaryCategories", "coreKeywords", "publicLinks", "screenshots", "pricingSummary", "founderNote"],
  trackingColumns: ["target", "priority", "submission_url", "listing_url", "approval_status", "backlink_type", "follow_up_date", "owner", "notes"],
  guardrails: [
    "Use English Whop/product descriptions for global submissions.",
    "Do not claim live customers, partner badges, revenue metrics, ROAS or public logos without proof permission.",
    "Track rejected/needs-edit listings instead of resubmitting spam."
  ]
};
