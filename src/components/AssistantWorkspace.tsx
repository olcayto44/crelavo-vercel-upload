"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { blockedProductionMessage, validateProductionSafety } from "@/lib/content-safety";
import { getStoredLanguage } from "@/lib/i18n";
import { activePlatformMaterials } from "@/lib/platform-materials";
import { defaultDeliveryCreditRatesConfig, type DeliveryCreditRatesConfig } from "@/lib/delivery-credit-rates";
import { footerGroups } from "@/lib/site-content";
import { buildAssistantProductionPayload, packageIdFromSelection, type UserUploadedMaterial } from "@/lib/production-payload";
import { estimateProductionCost, productionPackages, productionTypes, type ProductionPackage } from "@/lib/production";

const defaultSteps = [
  "Brief received",
  "Production type selected",
  "Options and credit estimate ready",
  "Production record created",
  "Preview / delivery workspace ready"
];

const defaultDeliveryPreviewItems = [
  "Preview link",
  "Final ZIP package",
  "Source files",
  "README / setup guide",
  "Export notes",
  "Revision path"
];

const studioQuickPaths = [
  { label: "Product Video", description: "Turn a product link, image or listing into a social ad video.", category: "campaign", mode: "commerce" },
  { label: "UGC Sales Video", description: "Create creator-style product proof, hook, CTA and voice direction.", category: "video", mode: "media" },
  { label: "AI Avatar Video", description: "Prepare a talking sales avatar with voice, script and delivery options.", category: "talking_video", mode: "media" },
  { label: "AI Drone-Style", description: "Generate aerial-style location or product motion without real drone shooting.", category: "drone_video", mode: "media" },
  { label: "Campaign Pack", description: "Plan hooks, captions, ad angles, visuals and launch assets together.", category: "campaign", mode: "commerce" },
  { label: "Voice / Dubbing", description: "Create voice-over, dubbing, subtitles or localized narration paths.", category: "voice_clone", mode: "media" }
];

const studioQualityTiers = ["Fast", "Standard", "Pro", "Cinematic", "Ultra"];

const studioProviderSignals = [
  { label: "Video engines", value: "Auto routing", status: "Kling / Seedance style" },
  { label: "Voice", value: "Ready", status: "ElevenLabs" },
  { label: "Publishing", value: "Configured", status: "TikTok / YouTube / Meta" },
  { label: "Avatar", value: "Pending", status: "D-ID / provider review" }
];

const deliveryHandoffItems = [
  "Dashboard delivery tracking",
  "Admin-managed status",
  "Download buttons",
  "Manual handoff link when needed"
];

type Message = { role: "assistant" | "user"; content: string };

type AssistantAgentAction = {
  name?: string;
  intent?: string;
  production_type?: string;
  confirmation_required?: boolean;
  credit_check_required?: boolean;
  provider_route?: string;
  state_before_confirmation?: string;
  next_backend_endpoint?: string;
  args?: Record<string, unknown>;
};

type AssistantSuggestion = {
  category?: string;
  style?: string;
  duration?: string;
  requestType?: string;
  quality?: string;
  suggestedPrompt?: string;
  assistantReply?: string;
  note?: string;
  route?: string;
  nextStep?: string;
  agent_action?: AssistantAgentAction;
};

type AssistantPlan = {
  intent?: string;
  production_type?: string;
  package_id?: string;
  missing_fields?: string[];
  estimated_credits?: number;
  selected_quality?: string;
  selected_duration?: string;
  selected_style?: string;
  selected_modules?: string[];
  selected_features?: string[];
  selected_platforms?: string[];
  workflow_stage?: string;
  next_user_action?: string;
  delivery_path?: string[];
  agent_action?: AssistantAgentAction;
  summary?: string;
};

type AssistantOrchestratorJob = {
  id?: string;
  type?: string;
  title?: string;
  brief?: string;
  selected_style?: string;
  selected_quality?: string;
  selected_duration?: string;
  selected_modules?: string[];
  selected_features?: string[];
  selected_platforms?: string[];
  package_id?: string;
  estimated_credits?: number;
  deliverables?: string[];
  required_materials?: string[];
  agent_action?: AssistantAgentAction;
  production_payload?: Record<string, unknown>;
};

type AssistantOrchestratorResponse = {
  intent?: string;
  workflow_stage?: string;
  next_user_action?: string;
  missing_fields?: string[];
  delivery_path?: string[];
  jobs?: AssistantOrchestratorJob[];
  total_estimated_credits?: number;
  api_gap_note?: string;
};

type AssistantCreditState = {
  chargedCredits: number | null;
  chargeSource: "assistant_trial" | "production" | null;
  assistantBalance: number | null;
  productionBalance: number | null;
  requiredCredits: number | null;
  assistantAvailable: number | null;
  productionAvailable: number | null;
  redirect: string | null;
};

type StartedProductionState = {
  id: string;
  detailUrl: string;
  status: "created" | "automation_started" | "automation_warning" | "waiting_provider_config" | "already_running";
  message: string;
  providerStatus?: string;
  missingProviderKeys?: string[];
  nextAction?: string;
} | null;

const emptyAssistantCreditState: AssistantCreditState = {
  chargedCredits: null,
  chargeSource: null,
  assistantBalance: null,
  productionBalance: null,
  requiredCredits: null,
  assistantAvailable: null,
  productionAvailable: null,
  redirect: null
};

type DynamicWizardType = "website" | "video" | "mobile_app" | "campaign" | "talking_video" | "image" | "document";

type DynamicWizardState = {
  open: boolean;
  type: DynamicWizardType;
  subject: string;
  answers: Record<string, string[]>;
  creditPromptOpen: boolean;
  groupId?: string;
  categoryId?: string;
};

type DynamicWizardQuestion = {
  id: string;
  label: string;
  options: string[];
  multi?: boolean;
  dependsOn?: { questionId: string; value: string };
};

const emptyDynamicWizard: DynamicWizardState = {
  open: false,
  type: "video",
  subject: "",
  answers: {},
  creditPromptOpen: false
};

const dynamicWizardLabels: Record<DynamicWizardType, string> = {
  website: "Website Builder",
  video: "AI Video Generator",
  mobile_app: "Mobile App Builder",
  campaign: "E-commerce Product Ad",
  talking_video: "Advanced Talking Video",
  image: "Image & Visual Pack",
  document: "Document / PDF Pack"
};

const wizardCategoryTypeMap: Record<string, DynamicWizardType> = {
  campaign: "campaign", ai_agent: "campaign", localization: "campaign", ad_score_checker: "campaign", cultural_localization: "campaign", campaign_calendar: "campaign", community_showcase: "campaign", virtual_model_studio: "image", crelavo_academy: "document",
  video: "video", documentary: "video", animation: "video", anime_short_film: "video", animal_video: "video", nature_video: "video", planet_space_video: "video", drone_video: "video", live_sales_agent: "video", stickman_animation: "video", music_video: "video", studio: "video", drama: "video", cinematic_video: "video", video_clipping: "video", video_tools: "video",
  talking_video: "talking_video", avatar: "talking_video", lip_sync: "talking_video", voice_clone: "talking_video", visual_clone: "image",
  website: "website", saas: "website", mobile_app: "mobile_app", admin_project: "website",
  image: "image", brand_kit: "image", document_pack: "document"
};

const wizardCategoryLabels: Record<string, string> = {
  campaign: "Text-to-Campaign / Product Ads", ai_agent: "AI Agents", localization: "Global Localization", ad_score_checker: "AI Ad Performance Score Checker", virtual_model_studio: "AI Virtual Model Studio", cultural_localization: "AI Cultural Localization", campaign_calendar: "AI Campaign Calendar", crelavo_academy: "Crelavo Academy", community_showcase: "Community Showcase",
  video: "AI Video Generator", talking_video: "Advanced Talking Video", documentary: "Documentary", animation: "Animation Video", anime_short_film: "Anime Short Film", animal_video: "Animal Video", nature_video: "Nature Video", planet_space_video: "Planet / Space Video", drone_video: "Drone / Satellite Video", live_sales_agent: "AI Live Sales Agent", stickman_animation: "Stickman Animation", music_video: "Music Video / MV", studio: "Studio / Series-Film", drama: "Drama / Short Series", cinematic_video: "Cinematic Video", video_clipping: "Video Clipping", video_tools: "Video Tools",
  avatar: "Avatar Design / Avatar Video", lip_sync: "Lip Sync Video", voice_clone: "Voice Cloning", visual_clone: "Visual / Style Clone",
  website: "Website Builder", saas: "SaaS Product", mobile_app: "Mobile App Builder", admin_project: "Admin Panel Projects",
  image: "Image & Visual Pack", brand_kit: "Brand Kit", document_pack: "Documents / Files"
};

const wizardCategoryOptions: Record<string, string[]> = {
  campaign: ["Shopify product link", "Amazon product link", "Trendyol product link", "Product link ad", "Store/social publish"],
  ai_agent: ["AI influencer", "Daily social manager", "Trend monitor", "Voice/personality", "Approval flow"],
  localization: ["Language adaptation", "Cultural rewrite", "Voice direction", "Subtitle notes", "Country variants"],
  ad_score_checker: ["Basic ad score", "Detailed ad score report", "3 improved ad angles", "Hook rewrite", "Video-ready creative brief"],
  virtual_model_studio: ["1 virtual model visual", "4 image pack", "10 image catalog idea", "Fashion model visual", "Jewelry / beauty product visual"],
  cultural_localization: ["1 country localization brief", "Localized hooks", "Localized script", "Country-specific CTA", "Video brief"],
  campaign_calendar: ["Campaign brief", "Seasonal hook list", "Product launch checklist", "Script pack", "Campaign asset plan"],
  crelavo_academy: ["Free lesson path", "Premium template", "Done-with-you brief", "UGC lesson pack", "Product video workflow"],
  community_showcase: ["Use similar style", "Template reuse", "AI ad example", "UGC example", "Product video example"],
  video: ["Prompt-to-video", "Link-to-video", "Voice-to-video", "Own voice-over", "Photo/avatar input", "Choose character", "Create character", "Choose AI voice", "Create AI voice", "Background music", "Emotion-matched music"],
  talking_video: ["Self-in-video", "Photo/avatar input", "Choose character", "Create character", "Own voice-over", "Choose AI voice", "Create AI voice", "2/3/4/5+ people", "7-8 person panel", "Separate voices", "Regional clothing", "Dialect voice"],
  documentary: ["Topic research", "Narration outline", "Interview map", "Archival visuals", "Documentary music", "Own voice-over", "Choose AI voice", "Create AI voice"],
  animation: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Photo/avatar input", "Choose character", "Create character", "Animation music", "Own voice-over", "Choose AI voice", "Create AI voice", "Child voices"],
  anime_short_film: ["Anime style", "Character setup", "Photo/avatar input", "Choose character", "Create character", "Dialogue", "Action scene", "Anime music", "Own voice-over", "Choose AI voice", "Create AI voice", "User materials"],
  animal_video: ["Funny animal", "Exciting animal", "Cinematic", "Animated", "3D style", "Own voice-over"],
  nature_video: ["Wildlife", "Landscape", "Weather", "Documentary", "Cinematic music", "Narration"],
  planet_space_video: ["Planet explainer", "Galaxy scene", "3D space", "Cosmic music", "Narration", "Subtitles"],
  drone_video: ["Map/location prompt", "Satellite-view intro", "Marked area notes", "Drone flyover", "Route/path plan", "Voice-over", "Subtitles", "Background music"],
  live_sales_agent: ["Fair-use AI live host", "Product link selling", "Live chat replies", "Avatar persona", "Multilingual sales", "CTA/discount", "OBS/provider readiness", "$249/$799/$2499 service plans"],
  stickman_animation: ["Explainer", "Comedy skit", "Education", "Storyboard", "Social short", "Choose character", "Create character", "Own voice-over", "Choose AI voice"],
  music_video: ["Lyric video", "Visualizer", "Performance clip", "Teaser", "Social MV", "Own image/avatar", "Own voice/song", "Choose character", "Create character", "Another person/artist", "Choose AI voice", "Create AI voice"],
  studio: ["Script", "Scene plan", "Character breakdown", "Trailer", "Teaser", "Series bible", "Shot list"],
  drama: ["One-prompt drama", "Short series", "Viral short film", "Episode arc", "Character roles", "Dialogue", "Voice-over", "Music", "Subtitles", "Reels/TikTok cuts"],
  cinematic_video: ["Luxury video", "Trailer look", "Drama scene", "Cinematic camera", "Music/voice", "Premium output"],
  video_clipping: ["Long video to Shorts", "Exciting moments", "Funny scenes", "Hook extraction", "Subtitles"],
  video_tools: ["Video extend", "Motion control", "Image-to-video", "Link-to-video", "Script-to-video"],
  avatar: ["Avatar design", "Custom avatar", "Brand persona", "Talking avatar", "Avatar video"],
  lip_sync: ["Audio to lip-sync", "Avatar speaking", "Dialogue sync", "Face video", "Final MP4"],
  voice_clone: ["Voice reference", "Clean vocal", "Clone-style narration", "Multilingual voice", "Brand voice"],
  visual_clone: ["Reference style", "Character look", "Product look", "Style transfer", "New variations"],
  website: ["Landing page", "Business site", "E-commerce storefront", "Admin screens", "Source ZIP + README"],
  saas: ["Dashboard", "Auth", "Billing", "Admin", "Source ZIP + README"],
  mobile_app: ["iOS/Android UI", "Expo starter", "Navigation", "Core screens", "Admin pair"],
  admin_project: ["CRUD", "Roles", "Database", "Dashboard", "Setup guide"],
  image: ["Hero image", "Product mockup", "Social visual", "App screen", "Asset pack"],
  brand_kit: ["Logo", "Palette", "Typography", "Social kit", "Usage rules"],
  document_pack: ["Pitch deck", "Proposal", "Catalog", "PDF", "ZIP package"]
};

const wizardCategoryGroups = [
  { id: "new-feature-tools", title: "Yeni Feature Araçları", count: 6, description: "Reklam skoru, sanal model, kültürel lokalizasyon, kampanya takvimi, Academy ve showcase üretim girişleri.", typeIds: ["ad_score_checker", "virtual_model_studio", "cultural_localization", "campaign_calendar", "crelavo_academy", "community_showcase"] },
  { id: "marketing", title: "Pazarlama ve Ticaret", count: 3, description: "Büyüme iş akışları için ürün bağlantıları, kampanyalar, yerelleştirme ve yapay zeka aracıları.", typeIds: ["campaign", "ai_agent", "localization"] },
  { id: "video-motion", title: "Video ve Hareket", count: 17, description: "Yapay zekâ destekli video, canlı satış ajanı, drama, kısa dizi, drone/uydu, animasyon, sinematik çalışmalar, klip düzenleme, müzik videoları ve video araçları.", typeIds: ["video", "talking_video", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "stickman_animation", "music_video", "studio", "drama", "cinematic_video", "video_clipping", "video_tools"] },
  { id: "avatar-cloning", title: "Avatar ve Klonlama", count: 4, description: "Özel avatarlar, konuşan videolar, dudak senkronizasyonu, ses klonlama ve görsel/stil klonlama.", typeIds: ["avatar", "lip_sync", "voice_clone", "visual_clone"] },
  { id: "web-app-software", title: "Web, Uygulama ve Yazılım", count: 4, description: "Kaynak kod teslimatı ile web siteleri, SaaS ürünleri, mobil uygulamalar ve yönetim paneli projeleri.", typeIds: ["website", "saas", "mobile_app", "admin_project"] },
  { id: "brand-files", title: "Marka, Görseller ve Dosyalar", count: 3, description: "Görseller, marka kitleri, sunum dosyaları, PDF'ler ve yeniden kullanılabilir dosya paketleri.", typeIds: ["image", "brand_kit", "document_pack"] }
];

const dynamicWizardQuestions: Record<DynamicWizardType, DynamicWizardQuestion[]> = {
  website: [
    { id: "siteType", label: "Ne tür web sitesi?", options: ["Business website", "Restaurant / cafe", "E-commerce", "SaaS landing page", "Portfolio", "Blog / content"] },
    { id: "pages", label: "Hangi sayfalar olsun?", multi: true, options: ["Home", "About", "Services", "Menu / products", "Gallery", "Contact", "Pricing", "FAQ"] },
    { id: "restaurant", label: "Restoran/kafe özellikleri", multi: true, dependsOn: { questionId: "siteType", value: "Restaurant / cafe" }, options: ["Menu page", "Reservation form", "WhatsApp order", "Google Maps", "Photo gallery", "Daily offers"] },
    { id: "commerce", label: "Satış/ödeme tarafı", multi: true, dependsOn: { questionId: "siteType", value: "E-commerce" }, options: ["Product listing", "Cart", "Checkout", "Admin product panel", "Order management", "Coupon system"] },
    { id: "admin", label: "Admin panelde ne yönetilsin?", multi: true, options: ["Pages/content", "Products/menu", "Orders/requests", "Users", "Media gallery", "Analytics"] },
    { id: "delivery", label: "Teslim paketi", multi: true, options: ["Admin panel", "Source code", "Final ZIP", "README", "Deployment guide", "Responsive design"] }
  ],
  video: [
    { id: "videoType", label: "Ne tür video?", options: ["Social media short", "Restaurant / food video", "Product ad", "UGC style", "Explainer", "Cinematic promo", "Animation video"] },
    { id: "quality", label: "Kalite / format", options: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9", "YouTube 16:9"] },
    { id: "visualStyle", label: "Görsel tarz", options: ["Realistic video", "Cinematic", "Product demo", "2D animation", "3D animation", "Stickman animation", "Motion graphics", "Whiteboard animation"] },
    { id: "platform", label: "Nerede kullanılacak?", multi: true, options: ["TikTok", "Instagram Reels", "YouTube Shorts", "Website", "Meta Ads", "YouTube 16:9"] },
    { id: "duration", label: "Süre", options: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"] },
    { id: "videoStructure", label: "Video yapısı", multi: true, options: ["Hook opening", "Scene plan", "Product close-ups", "Call to action", "End card", "3 alternatives"] },
    { id: "food", label: "Yemek videosu detayları", multi: true, dependsOn: { questionId: "videoType", value: "Restaurant / food video" }, options: ["Menu item", "Campaign price", "Restaurant intro", "Close-up product shots", "Combo meal", "Price text"] },
    { id: "extras", label: "Ek özellikler", multi: true, options: ["Music", "Voice-over", "Subtitles", "Logo", "Thumbnail", "Social caption", "Final MP4"] }
  ],
  mobile_app: [
    { id: "appType", label: "Ne tür uygulama?", options: ["Booking app", "Marketplace", "Delivery app", "SaaS app", "Community app", "Custom app"] },
    { id: "screens", label: "Ekran kapsamı", options: ["5 screens", "10 screens", "Custom screen count"] },
    { id: "appFeatures", label: "Uygulama özellikleri", multi: true, options: ["Login", "Admin panel", "Payments", "Notifications", "User dashboard", "Database", "Calendar", "Search/filter"] },
    { id: "admin", label: "Admin panel kapsamı", multi: true, options: ["Users", "Bookings/orders", "Products/services", "Payments", "Content", "Analytics"] },
    { id: "delivery", label: "Teslim paketi", multi: true, options: ["Source code", "Final ZIP", "README", "Deployment guide", "API notes", "Responsive design"] }
  ],
  campaign: [
    { id: "campaignType", label: "Kampanya türü", options: ["Product ad", "Restaurant campaign", "E-commerce launch", "Social media pack", "Brand promo"] },
    { id: "channels", label: "Kanallar", multi: true, options: ["TikTok", "Instagram", "Meta Ads", "Shopify", "Amazon", "Trendyol"] },
    { id: "assets", label: "Çıktılar", multi: true, options: ["Ad video", "Product visuals", "Caption", "Hashtags", "Landing page", "3 alternatives"] }
  ],
  talking_video: [
    { id: "people", label: "Kaç kişi konuşacak?", options: ["1 person", "2 people", "3 people", "4 people", "5+ people", "7-8 panel"] },
    { id: "voice", label: "Ses tarafı", multi: true, options: ["Own voice", "Separate voice per person", "Local accent", "Subtitles", "Lip-sync"] },
    { id: "style", label: "Görsel tarz", options: ["Realistic talking video", "Animated talking video", "UGC style", "Corporate", "Regional culture"] }
  ],
  image: [
    { id: "imageType", label: "Görsel türü", options: ["Product visual", "Poster", "Social media post", "Logo/brand kit", "Thumbnail", "Banner"] },
    { id: "outputs", label: "Çıktı sayısı", options: ["1 visual", "3 alternatives", "5 alternatives"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["PNG/JPG", "Source file delivery", "Final ZIP", "Social caption"] }
  ],
  document: [
    { id: "documentType", label: "Doküman türü", options: ["PDF", "Proposal", "Business plan", "Product documentation", "README package"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["PDF", "Editable source", "Final ZIP", "README"] }
  ]
};

function formatCredits(value: number | null) {
  return typeof value === "number" ? value.toLocaleString() : "-";
}

const qualityOptions = ["480p test", "720p", "720p quick test", "1080p", "1080p premium", "1080p cinematic", "2K", "4K", "Vertical 9:16", "Horizontal 16:9", "Square 1:1", "Story 9:16", "YouTube 16:9"];
const styleOptions = ["Cinematic", "Series / film", "Short film", "Series scene", "Trailer", "Cinematic animation", "2D animation", "2.5D animation", "3D animation", "Stickman animation", "Motion graphics", "Whiteboard animation", "Character animation", "Realistic UGC", "Premium ad", "Luxury product", "SaaS modern", "Minimal", "Viral TikTok", "Corporate", "Fun", "Documentary", "Product demo", "App demo"];
const featureOptions = ["Voice-over", "Own voice-over", "Choose AI voice", "Create AI voice", "Voice clone", "Child voices", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Script", "Scene plan", "Character breakdown", "Series/film bible", "Trailer cut", "Long film/series clipping", "Scene detection", "Hook extraction", "Shorts/Reels cut", "3 alternatives", "5 alternatives", "A/B hook", "Character", "Photo/avatar input", "Choose character", "Create character", "Add yourself to video", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "7-8 person conversation", "Panel / roundtable conversation", "Separate voice per person", "Realistic talking video", "Animated talking video", "Regional clothing", "Traditional outfit", "Regional environment", "Local lifestyle environment", "Local accent voice-over", "Dialect voice-over", "Cultural scene direction", "Scene transition", "Lip-sync", "Drone-style aerial video", "AI map/location drone-style video", "Logo/brand kit", "Source file delivery", "Production package", "Working source package", "Social media caption", "Hashtag set", "Cover visual", "Thumbnail", "Final ZIP", "README", "Revision right"];
const durationOptions = ["5 sec", "10 sec", "15 sec", "30 sec", "45 sec", "60 sec", "2 min", "3 min", "5 min", "10 min", "Scene 1-3 min", "Pilot 3-10 min", "Episode based", "Season / film plan", "Project based"];
const moduleOptions = ["AI video", "Prompt-to-video", "Link-to-video", "Voice-to-video", "Self-in-video", "Advanced talking video", "Multi-person talking video", "Regional culture video", "Local dialect voice", "Series / film studio", "Short film", "Trailer", "Script + scene plan", "Long film/series clipping", "Shorts/Reels/TikTok cuts", "Animation video", "Visual/image pack", "Music video/MV", "Character/photo input", "Character selection", "Character creation", "Voice selection", "AI voice creation", "Voice-over", "Background music direction", "User audio upload", "Drone-style aerial video", "AI map/location drone-style video", "Website", "SaaS screen", "Mobile app", "Admin panel", "Brand kit", "PDF/document", "Shopify product link", "Amazon product link", "Trendyol product link", "E-commerce product pack", "Product ad video", "Marketplace listing", "Product visual set", "Store banner", "SEO product description", "Campaign set", "Bulk product production"];
const platformOptions = ["Dashboard delivery", "MP4 download", "ZIP source", "TikTok", "Instagram Reels", "YouTube Shorts", "Facebook/Meta Ads", "LinkedIn", "X/Twitter", "Shopify", "Amazon", "Trendyol", "WooCommerce"];

type CategoryOptionProfile = {
  title: string;
  note: string;
  modules: string[];
  features: string[];
  platforms: string[];
  quality: string[];
  style: string[];
  duration: string[];
};

const categoryOptionProfiles: Record<string, CategoryOptionProfile> = {
  ad_score_checker: {
    title: "AI ad score checker options",
    note: "Ad score, hook review, CTA clarity, improved angles and video-ready brief decisions.",
    modules: ["Ad score report", "Hook review", "CTA clarity", "Creative weakness analysis", "Video-ready creative brief"],
    features: ["Basic ad score", "Detailed ad score report", "3 improved ad angles", "Hook rewrite", "CTA rewrite", "Video-ready creative brief", "Production package"],
    platforms: ["Dashboard delivery", "TikTok", "Facebook/Meta Ads", "Instagram Reels", "Shopify", "Amazon", "Trendyol"],
    quality: ["Basic Ad Score Report", "Ad Score + Script Improvement Pack"],
    style: ["Premium ad", "Realistic UGC", "Viral TikTok", "Product demo"],
    duration: ["Project based"]
  },
  virtual_model_studio: {
    title: "AI virtual model studio options",
    note: "Virtual model image count, catalog/lifestyle mix, product fit and ecommerce delivery decisions.",
    modules: ["Virtual model visual", "Fashion model visual", "Jewelry model visual", "Product visual set", "Catalog image pack"],
    features: ["1 virtual model visual", "4 image pack", "10 image catalog idea", "Product close-up", "Lifestyle shot direction", "Final ZIP", "Production package"],
    platforms: ["Dashboard delivery", "ZIP source", "Shopify", "Amazon", "Trendyol", "WooCommerce"],
    quality: ["Single Virtual Model Visual", "Virtual Model Image Pack"],
    style: ["Luxury product", "Product demo", "Realistic UGC", "Minimal"],
    duration: ["Project based"]
  },
  cultural_localization: {
    title: "AI cultural localization options",
    note: "Target country, localized hooks, CTA, proof angle, script and video brief decisions.",
    modules: ["Country localization brief", "Localized hook pack", "Localized script", "Country-specific CTA", "Video-ready creative brief"],
    features: ["1 country localization brief", "Localized hooks", "Localized script", "Country-specific CTA", "Visual direction", "Video-ready creative brief", "Production package"],
    platforms: ["Dashboard delivery", "TikTok", "Instagram Reels", "Facebook/Meta Ads", "Shopify", "Amazon", "Trendyol"],
    quality: ["Country Localization Brief", "Localized Script + Video Brief Pack"],
    style: ["Premium ad", "Product demo", "Corporate", "Realistic UGC"],
    duration: ["Project based"]
  },
  campaign_calendar: {
    title: "AI campaign calendar options",
    note: "Season, launch timing, campaign brief, hook calendar, script pack and asset checklist decisions.",
    modules: ["Campaign calendar", "Seasonal campaign brief", "Product launch checklist", "Ad hook calendar", "Campaign asset plan"],
    features: ["Campaign brief", "Seasonal hook list", "Product launch checklist", "Script pack", "Campaign asset plan", "Production package"],
    platforms: ["Dashboard delivery", "TikTok", "Instagram Reels", "Facebook/Meta Ads", "Shopify", "Amazon", "Trendyol"],
    quality: ["Campaign Calendar Brief", "Seasonal Campaign Asset Plan"],
    style: ["Premium ad", "Corporate", "Minimal", "Product demo"],
    duration: ["Project based"]
  },
  crelavo_academy: {
    title: "Crelavo Academy options",
    note: "Free lesson path, premium template, done-with-you brief and production-ready learning pack decisions.",
    modules: ["Academy lesson", "Premium template", "UGC lesson pack", "Product video workflow", "Done-with-you brief"],
    features: ["Free lesson path", "Premium template", "Done-with-you brief", "Production checklist", "Template pack", "Production package"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["Academy Template Pack", "Done-With-You Creative Brief"],
    style: ["Corporate", "SaaS modern", "Minimal"],
    duration: ["Project based"]
  },
  community_showcase: {
    title: "Community showcase options",
    note: "Example selection, similar-style request, template reuse and dashboard delivery decisions.",
    modules: ["Showcase example", "Use similar style", "Template reuse", "AI ad example", "UGC product demo"],
    features: ["Use similar style", "Template reuse", "Reference notes", "Production plan", "Final ZIP", "Production package"],
    platforms: ["Dashboard delivery", "ZIP source", "TikTok", "Instagram Reels", "Shopify", "Amazon", "Trendyol"],
    quality: ["Use Similar Style Request", "Showcase Template Reuse Pack"],
    style: ["Premium ad", "Realistic UGC", "Product demo", "SaaS modern"],
    duration: ["Project based"]
  },
  website: {
    title: "Website project options",
    note: "Page count, site type, admin panel, e-commerce and source delivery decisions for website projects.",
    modules: ["Website", "Landing page", "Business website", "Website + admin panel", "E-commerce product pack", "Admin panel", "SEO product description"],
    features: ["1 page", "3 pages", "5 pages", "Custom page count", "Production package", "Working source package", "Source file delivery", "Final ZIP", "README", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "Shopify", "WooCommerce"],
    quality: ["1080p", "1080p premium", "2K", "4K"],
    style: ["SaaS modern", "Minimal", "Corporate", "Luxury product", "E-commerce Product"],
    duration: ["Project based"]
  },
  saas: {
    title: "SaaS product options",
    note: "Dashboard, auth, billing, customer portal and admin-ready source package decisions.",
    modules: ["SaaS screen", "Admin panel", "Auth flow", "Billing screen", "Customer portal", "Database schema"],
    features: ["Production package", "Working source package", "Source file delivery", "Final ZIP", "README", "Revision right", "3 alternatives"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["1080p", "1080p premium", "2K"],
    style: ["SaaS modern", "Minimal", "Corporate"],
    duration: ["Project based"]
  },
  mobile_app: {
    title: "Mobile app options",
    note: "iOS/Android target, Expo source, screen count, login/admin and app delivery decisions.",
    modules: ["Mobile app", "Expo source", "iOS app", "Android app", "Admin panel", "Login screens", "Push notification"],
    features: ["5 screens", "10 screens", "Custom screen count", "Production package", "Working source package", "Source file delivery", "Final ZIP", "README", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["1080p", "1080p premium", "2K"],
    style: ["App demo", "Mobile App Modern", "SaaS modern", "Minimal"],
    duration: ["Project based"]
  },
  campaign: {
    title: "Campaign / product ad options",
    note: "Shopify, Amazon, Trendyol or direct product link, platform, hook, caption, video format and social delivery decisions.",
    modules: ["Shopify product link", "Amazon product link", "Trendyol product link", "Product ad video", "Marketplace listing", "E-commerce product pack"],
    features: ["A/B hook", "Social media caption", "Hashtag set", "Shorts/Reels cut", "Voice-over", "Subtitles", "Music", "3 alternatives", "5 alternatives"],
    platforms: ["Dashboard delivery", "TikTok", "Instagram Reels", "YouTube Shorts", "Facebook/Meta Ads", "Shopify", "Amazon", "Trendyol", "WooCommerce"],
    quality: ["720p quick test", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Premium ad", "Realistic UGC", "Viral TikTok", "Product demo"],
    duration: ["15 sec", "30 sec", "45 sec", "60 sec"]
  },
  video: {
    title: "AI video options",
    note: "Format, duration, self-in-video, multi-person dialogue, regional culture, voice, subtitles, music, scene plan and video delivery decisions.",
    modules: ["AI video", "Prompt-to-video", "Link-to-video", "Image-to-video", "Script-to-video", "Voice-to-video", "Self-in-video", "Character/photo input", "Character selection", "Character creation", "Voice selection", "AI voice creation", "Multi-person talking video", "Regional culture video", "Local dialect voice", "Script + scene plan", "Visual/image pack", "Voice-over", "Background music direction", "User audio upload", "Drone-style aerial video", "AI map/location drone-style video"],
    features: ["Script", "Scene plan", "Photo/avatar input", "Choose character", "Create character", "Add yourself to video", "Choose AI voice", "Create AI voice", "Voice clone", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "7-8 person conversation", "Separate voice per person", "Regional clothing", "Traditional outfit", "Regional environment", "Local accent voice-over", "Dialect voice-over", "Cultural scene direction", "Drone-style aerial video", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Shorts/Reels cut", "Watermark-free output", "3 alternatives"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "1080p cinematic", "Vertical 9:16", "YouTube 16:9"],
    style: ["Cinematic", "Cinematic animation", "Realistic UGC", "Documentary", "Product demo"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec", "2 min"]
  },
  talking_video: {
    title: "Advanced talking video options",
    note: "Self-in-video, 2/3/4/5+ or 7-8 person conversations, own voice materials, separate voices, regional clothing, local environments and dialect/accent voice decisions.",
    modules: ["Advanced talking video", "Self-in-video", "Multi-person talking video", "Regional culture video", "Local dialect voice", "Voice-to-video", "Lip-sync", "User audio upload", "Material reference"],
    features: ["Add yourself to video", "Own voice-over", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "7-8 person conversation", "Panel / roundtable conversation", "Separate voice per person", "Realistic talking video", "Animated talking video", "Regional clothing", "Traditional outfit", "Regional environment", "Local lifestyle environment", "Local accent voice-over", "Dialect voice-over", "Cultural scene direction", "User material upload", "Uploaded user materials", "Subtitles", "Music", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Realistic UGC", "Cinematic", "Character animation", "Cinematic animation", "Documentary"],
    duration: ["10 sec", "15 sec", "30 sec", "60 sec", "2 min", "Project based"]
  },
  documentary: {
    title: "Documentary options",
    note: "Topic research, narration outline, interview map, archival visual planning, documentary background music, subtitles and delivery decisions.",
    modules: ["Documentary", "Topic research", "Narration outline", "Interview map", "Archival visual plan", "Voice-over", "Documentary background music", "User audio upload"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Social media caption", "Shorts/Reels cut", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["720p", "1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
    style: ["Documentary", "Corporate", "Cinematic", "Editorial Document"],
    duration: ["60 sec", "2 min", "5 min", "10 min", "Episode based", "Project based"]
  },
  animation: {
    title: "Animation options",
    note: "2D, 2.5D, 3D, character, explainer, multi-person animated dialogue, optional user photo/avatar, selected/created characters, selected/created voices, regional culture and social animation decisions.",
    modules: ["Animation video", "2D animation", "2.5D animation", "3D animation", "Character animation", "Character/photo input", "Character selection", "Character creation", "Voice selection", "AI voice creation", "Multi-person talking video", "Regional culture video", "Local dialect voice", "Motion control", "Script + scene plan", "Animation background music", "User audio upload"],
    features: ["Script", "Scene plan", "Photo/avatar input", "Choose character", "Create character", "Choose AI voice", "Create AI voice", "Voice clone", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "Separate voice per person", "Regional clothing", "Traditional outfit", "Regional environment", "Local accent voice-over", "Dialect voice-over", "Cultural scene direction", "Voice-over", "Own voice-over", "Child voices", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Character", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Motion graphics", "Whiteboard animation"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  anime_short_film: {
    title: "Anime short film options",
    note: "User-selected anime style, uploaded photo/avatar, selected/created characters, dialogue, action scenes, selected/created voice, subtitles, Crelavo materials and final anime short delivery decisions.",
    modules: ["Anime short film", "Anime style selection", "Character setup", "Character/photo input", "Character selection", "Character creation", "Dialogue scene", "Action scene", "Voice selection", "AI voice creation", "Voice-over", "Lip-sync", "Anime background music", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Photo/avatar input", "Choose character", "Create character", "Character breakdown", "Dialogue sync", "Action sequence", "Choose AI voice", "Create AI voice", "Voice clone", "Voice-over", "Own voice-over", "Child voices", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "ZIP source", "YouTube Shorts", "Instagram Reels"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Anime cinematic", "Shonen action", "Slice of life", "Fantasy anime", "Mecha anime", "Cute chibi"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "Project based"]
  },
  animal_video: {
    title: "Animal video options",
    note: "Funny, exciting, cinematic, animated or 3D animal videos with own voice-over, user music, background music and material references.",
    modules: ["Animal video", "Funny animal short", "Exciting animal scene", "Cinematic animal video", "3D animal video", "Animation video", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Character", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Funny", "Exciting", "Cinematic", "Character animation", "3D animation", "Realistic UGC"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  nature_video: {
    title: "Nature video options",
    note: "Nature, wildlife, landscape and weather videos with cinematic, documentary or atmospheric mood-matched music and narration.",
    modules: ["Nature video", "Wildlife scene", "Landscape video", "Weather atmosphere", "Documentary", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Social media caption", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["720p", "1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
    style: ["Documentary", "Cinematic", "Realistic UGC", "Luxury product", "Motion graphics"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "5 min"]
  },
  planet_space_video: {
    title: "Planet / space video options",
    note: "Planet, galaxy, astronomy and cosmic videos with explainer narration, cinematic/3D visuals, subtitles and emotional soundtrack.",
    modules: ["Planet video", "Space explainer", "Galaxy scene", "3D space visual", "Cinematic space video", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["720p", "1080p", "1080p premium", "2K", "YouTube 16:9", "Vertical 9:16"],
    style: ["Cinematic", "3D animation", "Documentary", "Motion graphics", "Luxury product"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "5 min"]
  },
  drone_video: {
    title: "Drone / satellite video options",
    note: "Location, route, marked-map, satellite intro, drone flyover, narration, music and subtitle decisions for aerial-style production requests.",
    modules: ["Drone-style aerial video", "AI map/location drone-style video", "Satellite-view intro", "Route/path plan", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Scene plan", "Marked area notes", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["720p", "1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
    style: ["Cinematic", "Documentary", "Real estate flyover", "Travel promo", "Map explainer"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "Project based"]
  },
  live_sales_agent: {
    title: "AI live sales agent options",
    note: "Autonomous live-stream brand agent service plans for product links, live chat replies, avatar persona, multilingual sales and live-commerce operations. Plans include fair-use live hours but no credit balance; extra live-operation hours are pay-as-you-go.",
    modules: ["AI live sales agent", "Product link selling", "Live chat reply agent", "Avatar host persona", "OBS/stream setup", "Production handoff readiness", "Product FAQ/objection handling", "Multilingual sales script", "Pay-as-you-go operation cost analysis", "Extra live-hour add-on plan"],
    features: ["Sales script", "Live FAQ", "Objection handling", "CTA/discount playbook", "Voice/avatar direction", "Human fallback policy", "Compliance review", "Fair-use hours policy", "Pay-as-you-go operation cost estimate", "Revision right"],
    platforms: ["TikTok Live", "YouTube Live", "Twitch", "Instagram Live", "Multi-platform"],
    quality: ["Starter $249/mo - 10h fair use", "Pro $799/mo - 40h fair use", "Agency $2499/mo - 120h fair use"],
    style: ["Friendly sales host", "Luxury brand advisor", "Gen Z TikTok seller", "Expert consultant", "Influencer-style host", "Multilingual support agent"],
    duration: ["10h/month fair use", "40h/month fair use", "120h/month fair use", "Extra hours pay-as-you-go", "Custom in prompt"]
  },
  studio: {
    title: "Studio / series-film options",
    note: "Series, film, trailer, script, scene plan, character breakdown and production bible decisions.",
    modules: ["Series / film studio", "Script + scene plan", "Trailer", "Teaser", "Direct final video", "Short film", "AI video", "Voice-over", "Cinematic background music", "User audio upload"],
    features: ["Script", "Scene plan", "Character breakdown", "Series/film bible", "Trailer cut", "Teaser cut", "Direct final output", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "ZIP source", "YouTube Shorts"],
    quality: ["1080p", "1080p cinematic", "2K", "4K"],
    style: ["Series / film", "Short film", "Trailer", "Cinematic"],
    duration: ["Scene 1-3 min", "Pilot 3-10 min", "Episode based", "Season / film plan"]
  },
  drama: {
    title: "Drama / short series options",
    note: "One-prompt short drama, mini-series, viral short film, episode arc, character roles, dialogue, voice, music and social cut decisions.",
    modules: ["Drama / short series", "Short film", "Script + scene plan", "Character breakdown", "AI video", "Voice-over", "Cinematic background music", "Shorts/Reels/TikTok cuts", "User audio upload"],
    features: ["Script", "Scene plan", "Character breakdown", "Dialogue", "Viral hook", "Trailer cut", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts", "ZIP source"],
    quality: ["1080p", "1080p cinematic", "Vertical 9:16", "YouTube 16:9"],
    style: ["Short drama", "Viral short film", "Series / film", "Cinematic", "Realistic UGC"],
    duration: ["30 sec", "60 sec", "Scene 1-3 min", "Episode based", "Project based"]
  },
  cinematic_video: {
    title: "Cinematic video options",
    note: "Luxury, dramatic, trailer-like, camera-led and premium visual video decisions.",
    modules: ["AI video", "Trailer", "Short film", "Visual/image pack", "Voice-over", "Cinematic background music", "User audio upload"],
    features: ["Scene plan", "Music", "Background music", "Emotion-matched music", "User music reference", "Voice-over", "Own voice-over", "Subtitles", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p premium", "1080p cinematic", "2K", "4K", "YouTube 16:9"],
    style: ["Cinematic", "Luxury product", "Series / film", "Trailer"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min"]
  },
  video_clipping: {
    title: "Video clipping options",
    note: "Long source video material, shortening, exciting/scary/funny moment extraction, hook detection and social cut decisions.",
    modules: ["Long film/series clipping", "Long video shortening", "Source video material", "Shorts/Reels/TikTok cuts", "Scene detection", "Hook extraction"],
    features: ["Long film/series clipping", "Scene detection", "Hook extraction", "Shorts/Reels cut", "Subtitles", "Cover visual", "Social media caption", "Hashtag set"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "Vertical 9:16", "YouTube 16:9"],
    style: ["Viral TikTok", "Documentary", "Cinematic", "Fun"],
    duration: ["Project based", "15 sec", "30 sec", "60 sec"]
  },
  avatar: {
    title: "Avatar design / avatar video options",
    note: "Custom avatar, brand persona, talking avatar, self-in-video, multi-person conversation and optional avatar video decisions.",
    modules: ["Avatar design", "Custom avatar", "Avatar reference", "Self-in-video", "Multi-person talking video", "Brand kit", "AI video", "Voice-over", "Lip-sync"],
    features: ["Character", "Add yourself to video", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "Separate voice per person", "Realistic talking video", "Animated talking video", "Logo/brand kit", "Voice-over", "Lip-sync", "Social media caption", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "ZIP source", "TikTok", "Instagram Reels"],
    quality: ["1080p", "1080p premium", "2K", "Vertical 9:16"],
    style: ["Realistic UGC", "Corporate", "Fun", "SaaS modern", "Character animation"],
    duration: ["Project based", "15 sec", "30 sec", "60 sec"]
  },
  lip_sync: {
    title: "Lip sync video options",
    note: "Face/avatar material, self-in-video, multi-speaker dialogue sync, multilingual dub and final talking-video decisions.",
    modules: ["Lip-sync", "Audio-to-face", "Face/avatar material", "Self-in-video", "Multi-person talking video", "Audio/script material", "Voice-over", "AI video", "Avatar design"],
    features: ["Voice-over", "Subtitles", "Lip-sync", "Dialogue sync", "2-person conversation", "3-person conversation", "4-person conversation", "Separate voice per person", "Multilingual dub", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16"],
    style: ["Realistic UGC", "Corporate", "Character animation"],
    duration: ["10 sec", "15 sec", "30 sec", "60 sec"]
  },
  voice_clone: {
    title: "Voice cloning options",
    note: "Voice reference material, clean vocal, clone-style narration, multilingual voice and brand voice decisions.",
    modules: ["Voice clone", "Voice reference material", "Voice-over", "Clean vocal", "Narration", "Multilingual voice"],
    features: ["Voice-over", "Clean vocal", "Multilingual dub", "Usage rules", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "MP4 download"],
    quality: ["720p", "1080p", "1080p premium"],
    style: ["Corporate", "Documentary", "Realistic UGC"],
    duration: ["Project based", "30 sec", "60 sec", "2 min"]
  },
  visual_clone: {
    title: "Visual clone / style clone options",
    note: "Reference style, character look, product look, image clone and new variation decisions.",
    modules: ["Visual/image pack", "Reference style", "Character look", "Product look", "Style transfer"],
    features: ["3 alternatives", "5 alternatives", "Logo/brand kit", "Final ZIP", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "Instagram Reels", "Facebook/Meta Ads"],
    quality: ["1080p", "2K", "4K", "Square 1:1", "Story 9:16"],
    style: ["Luxury product", "Minimal", "Corporate", "Premium ad", "E-commerce Product"],
    duration: ["Project based"]
  },
  video_tools: {
    title: "Video tool options",
    note: "Link-to-video, image-to-video, script-to-video, voice-to-video, video extend, motion control, Crelavo preview watermark and paid watermark-free delivery decisions.",
    modules: ["Link-to-video", "Image-to-video", "Script-to-video", "Voice-to-video", "Video extend", "Motion control", "Watermark control"],
    features: ["Watermark-free final delivery", "Crelavo preview watermark", "Owned-content watermark cleanup", "Rights confirmation", "Scene plan", "Voice-over", "Subtitles", "Music", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Cinematic", "Realistic UGC", "Product demo", "Motion graphics"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  stickman_animation: {
    title: "Stickman animation options",
    note: "Character count, sketch style, explainer/comedy/story flow and short animation delivery decisions.",
    modules: ["Animation video", "Script + scene plan", "Shorts/Reels/TikTok cuts", "Voice-over", "Animation background music", "User audio upload"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Child voices", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["480p test", "720p", "1080p", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Stickman animation", "Whiteboard animation", "2D animation", "Fun", "Documentary"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  music_video: {
    title: "Music video / MV options",
    note: "Song/audio reference, lyrics, visualizer, performance clip, teaser and rhythm-led social delivery decisions.",
    modules: ["Music video/MV", "Lyric video", "Song/audio reference", "Lyrics/beat material", "AI video", "Visual/image pack", "Shorts/Reels/TikTok cuts"],
    features: ["Scene plan", "Music", "Background music", "Emotion-matched music", "User music reference", "Own voice-over", "Subtitles", "Cover visual", "Shorts/Reels cut", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "TikTok"],
    quality: ["1080p", "1080p cinematic", "Vertical 9:16", "YouTube 16:9"],
    style: ["Cinematic", "Motion graphics", "Cinematic animation", "2.5D animation"],
    duration: ["30 sec", "60 sec", "2 min", "3 min", "5 min"]
  },
  ai_agent: {
    title: "AI agent options",
    note: "AI influencer, brand face, social manager, trend monitor, persona and approval-flow decisions.",
    modules: ["AI video", "Brand kit", "Voice-over", "Campaign set", "Visual/image pack"],
    features: ["Character", "Logo/brand kit", "Voice-over", "Social media caption", "Hashtag set", "A/B hook", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "TikTok", "Instagram Reels", "LinkedIn", "X/Twitter"],
    quality: ["1080p", "1080p premium", "2K"],
    style: ["Corporate", "Realistic UGC", "Premium ad", "SaaS modern", "Fun"],
    duration: ["Project based", "30 sec", "60 sec"]
  },
  localization: {
    title: "Global localization options",
    note: "Target country, language, cultural adaptation, wardrobe/background, voice and subtitle decisions.",
    modules: ["AI video", "Voice-over", "Visual/image pack", "Campaign set"],
    features: ["Voice-over", "Subtitles", "Scene plan", "Social media caption", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "ZIP source", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["720p", "1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Corporate", "Documentary", "Premium ad", "Realistic UGC"],
    duration: ["15 sec", "30 sec", "60 sec", "Project based"]
  },
  image: {
    title: "Image / visual options",
    note: "Hero image, product mockup, social visual, variations and delivery package decisions.",
    modules: ["Visual/image pack", "Product visual set", "Store banner", "Brand kit"],
    features: ["3 alternatives", "5 alternatives", "Logo/brand kit", "Cover visual", "Thumbnail", "Final ZIP", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "Instagram Reels", "Facebook/Meta Ads"],
    quality: ["1080p", "2K", "4K", "Square 1:1", "Story 9:16", "Horizontal 16:9"],
    style: ["Luxury product", "Minimal", "Corporate", "Premium ad", "E-commerce Product"],
    duration: ["Project based"]
  },
  brand_kit: {
    title: "Brand kit options",
    note: "Logo, color palette, typography, social kit and brand delivery decisions.",
    modules: ["Brand kit", "Visual/image pack", "Logo/brand kit"],
    features: ["Logo/brand kit", "Cover visual", "Social media caption", "Final ZIP", "README", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["1080p", "2K", "4K"],
    style: ["Luxury product", "Minimal", "Corporate", "SaaS modern"],
    duration: ["Project based"]
  },
  document_pack: {
    title: "Document / file options",
    note: "Pitch deck, proposal, catalog, PDF and structured delivery decisions.",
    modules: ["PDF/document", "Brand kit", "Visual/image pack"],
    features: ["README", "Final ZIP", "Revision right", "3 alternatives"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["1080p", "2K"],
    style: ["Corporate", "Minimal", "SaaS modern"],
    duration: ["Project based"]
  },
  admin_project: {
    title: "Admin panel project options",
    note: "CRUD, roles, dashboard screens, database notes and source package decisions.",
    modules: ["Admin panel", "SaaS screen", "Database schema", "Auth flow"],
    features: ["Production package", "Source file delivery", "Final ZIP", "README", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source"],
    quality: ["1080p", "1080p premium", "2K"],
    style: ["SaaS modern", "Corporate", "Minimal"],
    duration: ["Project based"]
  }
};

function isLikelyTurkish(text: string, activeLanguage = "") {
  if (activeLanguage === "tr") return true;
  const clean = text.toLocaleLowerCase("tr-TR");
  const normalized = normalizeTurkishQuery(text);
  return /[çğıöşü]/i.test(text) || /\b(ben|bana|beni|benim|sen|sana|seni|senin|biz|bize|bizi|bir|ve|ile|için|icin|şey|sey|istiyorum|isterim|istediğim|istedigim|soracağım|soracagim|sorayım|sorayim|soru|cevap|yorum|fikir|öneri|oneri|onerirsin|onerirsiniz|tavsiye|anlat|açıkla|acikla|nedir|neden|niye|nasıl|nasil|hangi|hangisi|kim|kimsin|nerenin|nerede|nerde|neresi|ne zaman|kaç|kac|olur mu|olurmu|mi|mı|mu|mü|oluştur|olustur|yap|video|reklam|ürün|urun|site|uygulama|kredi|fiyat|paket|ödeme|odeme|konuş|konus|sesli|ses|devam|tamam|evet|hayır|hayir|peki|selam|merhaba|naber|nasılsın|nasilsin|iyimisin|türkçe|turkce|yazmıyorsun|yazmiyorsun|insanlar|türkiye|turkiye|dünya|dunya|bursa|bursanin|meshur|meshurdur|takipci|izlenim|izlenme|askerlik|evren|gezegenler|yıldızlar|yildizlar|uzay|seslendirme|altyazı|altyazi|dakika|saniye)\b/.test(clean) || /(iyi misin|ne haber|ne demek|ne yapabilirim|ne yapabiliriz|ne onerirsin|ne önerirsin|sen ne onerirsin|sen ne önerirsin|yardim eder misin|yardım eder misin|yardimci olur musun|yardımcı olur musun|sen nerenin asistanisin|sen nerenin asistanısın)/.test(normalized);
}

type WorkspaceIntent = "greeting" | "help" | "consultation" | "production_request" | "start_confirmation";

function isCreditCostQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  return /(kredi|para|maliyet|ucret|fiyat|kac para|ne kadar tutar|ne kadar kredi)/.test(normalized);
}

function isAppIdeaDemandQuestion(message: string, recentContext = "") {
  const current = normalizeTurkishQuery(message);
  const context = normalizeTurkishQuery(recentContext);
  const currentAsksForIdea = /(uygulama|app|mobil|site|platform|fikir|oneri|onerirsin|aklima bir sey gelmiyor)/.test(current);
  const currentWantsHighDemand = /(ihtiyac|talep|pesinden kos|deli gibi|indirecek|kullanacak|para kazan|hizli para|problem|cozum)/.test(current);
  const contextAsksForIdea = /(uygulama|app|mobil|site|platform|fikir|oneri|onerirsin)/.test(context);
  return (currentAsksForIdea && (currentWantsHighDemand || /aklima bir sey gelmiyor/.test(current))) || (contextAsksForIdea && currentWantsHighDemand);
}

function isOutfitColorQuestion(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const hasClothing = /(sort|tisort|t-shirt|gomlek|ustune|ust|giyilir|giyinilir|kombin|renk)/.test(normalized);
  const hasColor = /(limon|sari|yesil|mavi|beyaz|siyah|bej|krem|gri|lacivert|renk)/.test(normalized);
  return hasClothing && hasColor;
}

function isMaterialUploadQuestion(message: string, recentContext = "") {
  const current = normalizeTurkishQuery(message);
  const context = normalizeTurkishQuery(recentContext);
  const isPlainChat = /^(selam|merhaba|sa|slm|hey|nasilsin|iyimisin|iyi misin|naber|ne haber|kimsin|nesin|ben sana baska bir sey sormak istiyorum|baska bir sey soracagim|sana bir sey soracagim|soru soracagim|soru sormak istiyorum)\b/.test(current);
  if (isPlainChat) return false;
  const asksHowNow = /(nasil|nereden|nereye|gonderecegim|yukleyecegim|atacagim|ekleyecegim|kac sny|kac saniye|ne konusmam|ne soylemem|kayit|gonderebilir miyim|yukleyebilir miyim|atabilir miyim)/.test(current);
  const hasMaterialNow = /(fotograf|foto|gorsel|resim|ses|sesim|ses kaydi|voice|audio|video kaydi|dosya|materyal)/.test(current);
  const recentMaterialTopic = /(fotograf|foto|gorsel|resim|ses|sesim|ses kaydi|voice|audio|video kaydi|dosya|materyal|upload material|materyal yukle)/.test(context);
  return (asksHowNow && hasMaterialNow) || (hasMaterialNow && /gonder|yukle|at|ekle/.test(current)) || (asksHowNow && recentMaterialTopic && current.split(/\s+/).length > 3);
}

function materialUploadFallbackReply(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message);
  const reply = "Evet, gönderebilirsin.\nFotoğraf, ses veya videoyu ‘Upload material / Materyal yükle’ alanından ekle.\nFotoğraf JPG/PNG, ses için 20-60 saniye temiz kayıt yeterli.\nKendi görüntün olacaksa kısa MP4/MOV video da yükleyebilirsin.";
  return responseLanguage(message, language) === "tr" || hasTurkishQuestionWords(normalized) ? reply : "Yes, you can upload it.\nUse the workspace ‘Upload material’ area.\nJPG/PNG works for photos; 20-60 seconds of clean audio is enough for voice.\nFor real footage, upload a short MP4/MOV clip.";
}

function durationFromFollowUp(message: string) {
  const normalized = normalizeTurkishQuery(message).replace(/1o/g, "10").replace(/lo/g, "10");
  if (isCreditCostQuestion(message)) return "";
  if (/\b(10\s*dk|10\s*dakika|10\s*min)\b/.test(normalized)) return "10 min";
  if (/\b(2\s*dk|2\s*dakika|120\s*sn|120\s*sny|120\s*saniye|120\s*sec)\b/.test(normalized)) return "2 min";
  if (/\b(1\s*dk|1\s*dakika|60\s*sn|60\s*sny|60\s*saniye|60\s*sec)\b/.test(normalized)) return "60 sec";
  const minuteMatch = normalized.match(/\b(\d{1,2})\s*(dk|dakika|min)\b/);
  if (minuteMatch) return `${minuteMatch[1]} min`;
  const secondMatch = normalized.match(/\b(\d{1,3})\s*(sn|sny|saniye|sec)\b/);
  if (secondMatch) return `${secondMatch[1]} sec`;
  return "";
}

function isShortProductionFollowUp(message: string, recentContext: string) {
  const normalized = normalizeTurkishQuery(message);
  const hasProductionContext = /(video|youtube|shorts|seslendirme|sesli|gorsel|goruntu|goruntulu|kamera|konusarak|altyazi|almanca|ingilizce|cince|ulke|avrupa|uzay|site|uygulama|admin panel|proje|production|uretim)/.test(recentContext);
  if (!hasProductionContext || isCreditCostQuestion(message)) return false;
  if (durationFromFollowUp(message)) return true;
  if (/^(evren|gezegenler|evren gezegenler|yildizlar|uzay|galaksi|astronomi)$/.test(normalized)) return true;
  if (/(goruntu|gorsel|goruntulu|kamerali|kamera|yuzum|ben gorun|konusarak|sesli|sadece ses|ses kaydi|altyazi|cince|ingilizce|turkce)/.test(normalized)) return true;
  return normalized.split(/\s+/).length <= 6 && /(konu|tema|evren|gezegen|yildiz|uzay|ses|sesli|goruntu|gorsel|kamera|altyazi|almanca|ingilizce|cince|ulke|avrupa)/.test(normalized);
}

function creditCostFallbackReply(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message).replace(/1o/g, "10").replace(/lo/g, "10");
  if (responseLanguage(message, language) !== "tr" && !hasTurkishQuestionWords(normalized)) {
    return "For a cinematic educational animation, 1 minute is roughly 5,500-6,500 credits; 10 minutes is roughly 29,000-32,000 credits, depending on quality, voice-over, subtitles and scene count.";
  }
  if ((normalized.includes("1 dakika") || normalized.includes("60")) && (normalized.includes("10 dakika") || normalized.includes("10 dk"))) {
    return "Yaklaşık hesapla: 1 dakikalık sinematik/eğitici animasyon video 5.500-6.500 kredi bandına, 10 dakikalık versiyon ise 29.000-32.000 kredi bandına yaklaşır. Net rakam kalite, sahne sayısı, seslendirme, altyazı ve kaç alternatif istediğine göre değişir.";
  }
  return "Bu tarz sinematik/eğitici animasyon videoda maliyet süreye göre artar. Kaba hesapla 1 dakika genelde 5.500-6.500 kredi bandı, 10 dakika ise 29.000-32.000 kredi bandı gibi düşünülmeli; net rakam seçtiğin kalite, seslendirme, altyazı ve sahne sayısına göre hesaplanır.";
}

function productionFollowUpReply(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message);
  const duration = durationFromFollowUp(message);
  const durationText = duration === "2 min" ? "2 dakika" : duration === "10 min" ? "10 dakika" : duration === "60 sec" ? "60 saniye" : duration;
  if (responseLanguage(message, language) === "tr") {
    if (duration) return `Tamam, süreyi ${durationText} olarak aldım. Brief'e ekledim; konu ve stil de varsa üretim planını netleştirip başlatma adımına geçeceğim.`;
    if (/(kendi goruntumu istemiyorum|kendi goruntum istemiyorum|kendi goruntu istemiyorum|yapay olsun|yapay goruntu|yapay gorsel|ai olsun|kendi cekimim yok|materyal istemiyorum)/.test(normalized)) return "Tamam, kendi görüntün kullanılmayacak. Video tamamen yapay/sinematik görsellerle planlanacak; voice-over, altyazı ve müzik brief'e bağlı kalacak.";
    if (/(altyazi|cince|almanca|ingilizce|turkce|voiceover|voice over|seslendirme)/.test(normalized)) return "Tamam, dil/seslendirme/altyazı bilgisini brief'e ekledim. Bunu genel tavsiye olarak bırakmayacağım; üretim planında voice-over, altyazı ve video sahneleri birlikte hazırlanacak.";
    if (/(goruntu|gorsel|goruntulu|kamerali|kamera|yuzum|ben gorun|konusarak)/.test(normalized)) return "Tamam, görüntü bilgisini aldım. Kendi görüntün istenmiyorsa yapay/sinematik sahnelerle ilerleyeceğim; kendi görüntün istenirse ayrıca materyal isterim.";
    if (/(sesli|sadece ses|ses kaydi)/.test(normalized)) return "Tamam, ses bilgisini brief'e ekledim. Seslendirme gerekiyorsa metin + voice-over akışıyla planlayacağım.";
    if (/(evren|gezegen|yildiz|uzay|galaksi|astronomi)/.test(normalized)) return "Tamam, konuyu uzay / evren / gezegenler ekseninde aldım. Bunu shorts video brief'ine bağlıyorum.";
    return "Tamam, bunu önceki üretim isteğinin brief'ine ekledim. Başla dediğinde tekrar soru sormadan üretim kontrol adımına geçeceğim.";
  }
  if (duration) return `Got it, I set the duration to ${duration} and attached it to the production brief.`;
  return "Got it, I attached this to the current production brief and will move to the start step when you confirm.";
}

function detectWorkspaceIntent(message: string): WorkspaceIntent {
  const text = message.toLocaleLowerCase("tr-TR").trim();
  const normalized = text.replace(/[.!?]+$/g, "").trim();
  const startOnly = /^(hadi\s+)?(başlayalım|baslayalim|başla|basla|başlat|baslat|devam et|tamam başlat|tamam baslat|onaylıyorum|onayliyorum|onay veriyorum|evet başla|evet basla|hemen başla|hemen basla|start|confirm|create production)$/i.test(normalized);
  const hasNewSubjectAfterHadi = /^hadi\s+\S+/.test(normalized) && !/^(hadi\s+)?(başlayalım|baslayalim|başla|basla|başlat|baslat|devam et)$/i.test(normalized);
  if (/^(selam|merhaba|hello|hi|hey|sa|slm|günaydın|gunaydin|iyi akşamlar|iyi aksamlar)\b/.test(text)) return "greeting";
  if (/^(nasılsın|nasilsin|naber|ne haber|how are you)\b/.test(text)) return "greeting";
  if (/^(sana\s+)?(bir\s+)?(şey|sey)\s+(istemek|isteyeceğim|isteyecegim|soracağım|soracagim)\s+istiyorum\.?$/.test(text)) return "greeting";
  if (hasNewSubjectAfterHadi) return "production_request";
  if (/\b(youtube|tiktok|kanal|takip|izlenme|para kazan|kazandıran|kazandiran|niş|nis|affiliate|iş ortağı|is ortagi|partner|komisyon|referral|üye|uye|kayıt|kayit|mail|email|doğrulama|dogrulama|gelmedi)\b/.test(text)) return "consultation";
  if (/\b(kod|code|bug|hata|debug|api|component|react|next|supabase|veritabanı|veritabani|sql|çözebilir misin|cozebilir misin|yardımcı olur musun|yardimci olur musun|bakabilir misin|düzeltir misin|duzeltir misin|sıkıntı|sikinti|problem|çalışmazsa|calismazsa)\b/.test(text)) return "consultation";
  if (/\b(nasıl|nasil|ne yaparsın|ne yaparsin|yardım|yardim|destek|olursa|olduğunda|oldugunda|mümkün mü|mumkun mu|yapabilir misin)\b/.test(text) && /\b(site|website|web|kod|code|hata|bug|api|supabase|react|next|sql)\b/.test(text)) return "consultation";
  if (isGeneralInformationQuestion(message)) return "consultation";
  if (startOnly || /\b(üretime geç|uretime gec)\b/.test(text)) return "start_confirmation";
  if (/\b(nasıl yardımcı|nasil yardimci|yardım|yardim|ne yapabilirim|anlat|seçenek|secenek|hangi|how|help|explain|options)\b/.test(text)) return "help";

  if (/\b(video|reklam|website|web site|site|saas|mobil|uygulama|avatar|animasyon|müzik|muzik|klip|mv|kampanya|ürün|urun|shopify|amazon|trendyol|logo|brand|seslendirme|altyazı|altyazi|klonlama|lip-sync|konuşmalı|konusmali|görüntülü|goruntulu|içecek|icecek|tavuk|yemek|gıda|gida|restoran|menü|menu|kafe|cafe|e-ticaret|eticaret|admin panel)\b/.test(text)) return "production_request";
  return "consultation";
}

function localizedWorkspaceReply(kind: "default" | "greeting" | "continue" | "flow" | "help" | "consultation" | "story" | "campaign" | "project" | "credits" | "analyzed" | "failed" | "creditsRequired", language: string, turnCount = 1) {
  const copy: Record<string, Partial<Record<typeof kind, string>>> = {
    tr: {
      default: "Buradayım. Ne yapmak istediğini yaz; ben kısa kısa yönlendireyim.",
      greeting: "Selam, dinliyorum. Ne üretmek istiyorsun?",
      consultation: "Tabii. Fikrini yaz, ben toparlayayım.",
      continue: "Tamam, devam ediyorum. Mantıklı ayarlarla ilerleyeceğim.",
      flow: "Önce fikri anlarım, sonra doğru kategori ve seçenekleri hazırlarım. Üretime geçmeden önce sana kısa özet gösteririm.",
      help: "Bana normal cümleyle yazman yeterli. Örneğin: ‘ürünüm için TikTok reklamı’, ‘7 kişi konuşmalı video’ veya ‘SaaS landing page’.",
      story: "Bunu hikaye/video akışı gibi ele alırım: konu, sahneler, karakterler, ses ve teslim formatı.",
      campaign: "Bunu kampanya/video işi gibi okuyorum. Ürün, hedef kitle ve platform yeterli olur.",
      project: "Bunu proje işi gibi kurarım: sayfalar, ekranlar, kaynak teslimi ve README planı.",
      credits: "Kredi tahminini kapsamdan çıkarırım. Gerçek ödeme kısmı üretime geçerken ayrı görünür.",
      analyzed: "Hazırladım. Seçenekleri aşağıda güncelledim.",
      failed: "Şu an cevap veremedim. Tekrar deneyelim.",
      creditsRequired: "Devam etmek için kredi gerekiyor. İstersen önce kapsamı küçültebiliriz."
    },
    de: {
      default: "Verstanden. Schreibe einfach, was du brauchst; kleine Lücken fülle ich sinnvoll, und nur kritische Details frage ich klar nach.", continue: "Verstanden. Ich mache weiter, leite das Ziel ab, überspringe unnötige Materialien und bereite einen produktionsreifen Plan vor.", flow: "Der Ablauf ist einfach: Ich verstehe deine Anfrage, wähle den passenden Produktionstyp und bereite den Produktionsdatensatz vor.", help: "Du musst keine Menüs kennen. Schreib deine Notizen frei; ich mache daraus einen Produktionsplan.", story: "Ich behandle das als Serien-/Filmproduktion mit Story, Szenen, Figuren, Stimme, Untertiteln und Lieferung.", campaign: "Ich lese das als Kampagnen-/Videoproduktion. Produktlink, Produktname und Zielgruppe reichen für den Start.", project: "Das kann als digitales Produkt/Projekt eingerichtet werden: Seiten, Screens, Admin, Quellpaket und README.", credits: "Ich halte die Credits praktisch: erst Umfang schätzen, dann Test oder vollständige Lieferung empfehlen.", analyzed: "Ich habe deinen Auftrag analysiert und verschiebe den Produktionsablauf zum nächsten Schritt.", failed: "Die Assistenten-Anfrage ist fehlgeschlagen.", creditsRequired: "Credits sind erforderlich, bevor der Assistent fortfahren kann."
    },
    es: {
      default: "Entendido. Escribe lo que necesitas; completaré pequeños huecos y solo preguntaré si falta algo crítico.", continue: "Entendido. Continuaré sin detener el flujo, omitiré materiales innecesarios y prepararé un plan listo para producción.", flow: "El flujo es simple: entiendo tu solicitud, la convierto en el tipo de producción correcto y preparo el registro de producción.", help: "No necesitas memorizar menús. Escribe notas sueltas; las convertiré en un plan de producción.", story: "Lo trataré como producción de serie/película: historia, escenas, personajes, voz, subtítulos y entrega.", campaign: "Lo interpreto como una producción de campaña/video. Un enlace de producto, nombre y audiencia son suficientes para empezar.", project: "Podemos configurarlo como producto/proyecto digital: páginas, pantallas, admin, entrega de fuente y README.", credits: "Mantendré los créditos claros: primero estimamos alcance y luego decidimos prueba económica o entrega completa.", analyzed: "Analicé tu comando y llevo el flujo de producción al siguiente paso.", failed: "La solicitud del asistente falló.", creditsRequired: "Se requieren créditos antes de que el asistente pueda continuar."
    },
    fr: {
      default: "Compris. Écris ce dont tu as besoin ; je compléterai les petits manques et ne poserai une question que si un détail critique manque.", continue: "Compris. Je continue sans bloquer le flux, j'écarte les éléments inutiles et je prépare un plan prêt pour la production.", flow: "Le flux est simple : je comprends ta demande, je choisis le bon type de production et je prépare le dossier de production.", help: "Pas besoin de mémoriser les menus. Écris tes notes librement ; je les transforme en plan de production.", story: "Je traiterai cela comme une production série/film : histoire, scènes, personnages, voix, sous-titres et livraison.", campaign: "Je lis cela comme une production campagne/vidéo. Un lien produit, le nom du produit et l'audience suffisent pour commencer.", project: "On peut le configurer comme produit/projet digital : pages, écrans, admin, sources et README.", credits: "Je garderai les crédits clairs : estimation du périmètre puis choix entre test économique ou livraison complète.", analyzed: "J'ai analysé ta commande et je fais avancer le flux de production.", failed: "La demande de l'assistant a échoué.", creditsRequired: "Des crédits sont nécessaires avant que l'assistant puisse continuer."
    },
    ar: {
      default: "فهمت. اكتب ما تحتاجه وسأكمل التفاصيل الصغيرة، ولن أسأل إلا إذا كان هناك نقص مهم.", continue: "فهمت. سأتابع بدون إيقاف المسار، وأتجاوز المواد غير الضرورية، وأجهز خطة إنتاج جاهزة.", flow: "المسار بسيط: أفهم طلبك، أحدد نوع الإنتاج المناسب، ثم أجهز سجل الإنتاج.", help: "لا تحتاج إلى حفظ القوائم. اكتب ملاحظاتك بحرية وسأحوّلها إلى خطة إنتاج.", story: "سأتعامل مع هذا كإنتاج مسلسل/فيلم: قصة، مشاهد، شخصيات، صوت، ترجمة وتسليم.", campaign: "أقرأ هذا كإنتاج حملة أو فيديو. رابط المنتج أو اسمه والجمهور المستهدف يكفي للبدء.", project: "يمكن إعداده كمشروع رقمي: صفحات، شاشات، لوحة إدارة، ملفات مصدر وREADME.", credits: "سأجعل الأرصدة واضحة: نقدر النطاق أولاً ثم نختار اختباراً منخفض التكلفة أو تسليماً كاملاً.", analyzed: "حللت طلبك وأنقل مسار الإنتاج إلى الخطوة التالية.", failed: "فشل طلب المساعد.", creditsRequired: "تحتاج إلى أرصدة قبل أن يتمكن المساعد من المتابعة."
    },
    en: {
      default: turnCount > 2 ? "I am here and will not repeat the same answer. I will infer the intent from your latest message and turn it into a production plan; you can simply write 'continue' and I will proceed with sensible settings." : "Understood. Write what you want in natural language; I will fill small gaps myself and ask clearly only if a critical decision is required.",
      greeting: "Hi, welcome. Tell me what you want to produce in one sentence; it can be a video, ad, website, avatar, music video, or any other idea.",
      consultation: "Sure. First I need to understand what you want to produce. Write the idea freely; I will extract the category, style, duration, and credit impact for you.",
      continue: "Understood. I will continue without stopping the flow: I will infer the goal, skip unnecessary material, ask only one clear question if needed, and prepare a production-ready plan.",
      flow: "The flow is simple: I understand what you want in natural language, convert it into the right production type, choose sensible defaults unless a critical detail is missing, and then start the live production record.",
      help: "I am here to clarify the work, not make you memorize menus. You can write messy notes; I will turn them into an ad, website, video, brand kit, document, or app production plan.",
      story: "I will treat this as a series/film production flow: story direction, scene plan, characters, voice, subtitles, and trailer/final delivery can be managed in one workspace.",
      campaign: "I read this as a campaign/video production. If you have a product link, we can use it; otherwise product name and audience are enough. If you do not want voice, music, or subtitles, I will skip them and keep the flow lean.",
      project: "We can set this up as a digital product/project production. I will plan pages, screens, admin side, source delivery, and README package, then turn it into a live production record.",
      credits: "I will keep the credit side practical: first estimate production type and scope, then suggest whether a low-cost test or full delivery makes more sense. I will not inflate unnecessary expensive features.",
      analyzed: "I analyzed your command and am moving the production flow to the next step.", failed: "Assistant request failed.", creditsRequired: "Credits required before the assistant can continue."
    }
  };
  return (copy[language] ?? copy.en)[kind] ?? copy.en[kind] ?? copy.en.default ?? "Understood.";
}

function responseLanguage(message: string, activeLanguage = "") {
  return isLikelyTurkish(message, activeLanguage) ? "tr" : activeLanguage || "en";
}

function inferDynamicWizardType(message: string): DynamicWizardType {
  const text = message.toLocaleLowerCase("tr-TR");
  if (/konuşmalı|konusmali|lip-sync|aksan|şive|sive|kendi ses|sesim|talking/.test(text)) return "talking_video";
  if (/web sitesi|website|web site|landing|site|saas/.test(text)) return "website";
  if (/uygulama|mobil|mobile app|app|randevu uygulaması|randevu uygulamasi/.test(text)) return "mobile_app";
  if (/reklam|kampanya|ürün|urun|shopify|amazon|trendyol|e-?ticaret/.test(text)) return "campaign";
  if (/görsel|gorsel|resim|poster|afiş|afis|logo|thumbnail|banner/.test(text)) return "image";
  if (/pdf|doküman|dokuman|belge|teklif|proposal|readme/.test(text)) return "document";
  return "video";
}

function extractWizardSubject(message: string) {
  const cleaned = message
    .replace(/\b(bana|benim için|benim icin|yap|yapar mısın|yapar misin|istiyorum|üret|uret|oluştur|olustur|hadi|o zaman|kısa kısa|kisa kisa|bir|bi)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 80);
}

function firstVisibleWizardQuestion(wizard: DynamicWizardState) {
  return dynamicWizardQuestions[wizard.type].find((question) => {
    if (wizard.answers[question.id]?.length) return false;
    if (!question.dependsOn) return true;
    return wizard.answers[question.dependsOn.questionId]?.includes(question.dependsOn.value);
  });
}

function isLegacyVoiceErrorMessage(message: string) {
  return /Ses kaydı alınamadı|Lütfen tekrar deneyin|komutunuzu yazın|Ses alınamadı|Voice could not be captured|Voice command could not be captured/i.test(message);
}

function isLegacyAssistantPlaceholderMessage(message: string) {
  return /Buradayım\. Son mesajına göre|Seni anladım\. Eğer bu bir soruysa|Sorunu aldım\. Üretim isteği değilse|Üretimin doğru cevabı yoktur|soğutucu akışkan|Bunu net cevaplayabilmem için|Please add one more sentence|Evet, gönderebilirsin\.\s*Fotoğraf|Tabii, kod tarafında da yardımcı olurum/i.test(message);
}

function cleanAssistantMessages(messages: Message[]) {
  return messages.filter((message) => !(message.role === "assistant" && (isLegacyVoiceErrorMessage(message.content) || isLegacyAssistantPlaceholderMessage(message.content))));
}

function extractAssistantSignals(message: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const peopleMatch = text.match(/\b(\d{1,2})\s*(kişi|kisi|person|people)\b/);
  const signals: string[] = [];
  if (peopleMatch) signals.push(`${peopleMatch[1]} kişi`);
  if (/kendi ses|own voice|sesim/.test(text)) signals.push("kendi sesin");
  if (/yöresel|yoresel|bölgesel|bolgesel|regional/.test(text)) signals.push("yöresel detaylar");
  if (/kıyafet|kiyafet|traditional outfit|clothing/.test(text)) signals.push("kıyafet");
  if (/şive|sive|aksan|dialect|accent/.test(text)) signals.push("şive/aksan");
  if (/tiktok/.test(text)) signals.push("TikTok");
  if (/instagram/.test(text)) signals.push("Instagram");
  if (/shopify|amazon|trendyol|ürün|urun|product/.test(text)) signals.push("ürün");
  if (/içecek|icecek|drink|beverage/.test(text)) signals.push("içecek");
  if (/tavuk|chicken/.test(text)) signals.push("tavuk");
  if (/yemek|gıda|gida|restoran|menü|menu|kafe|cafe|food/.test(text)) signals.push("yiyecek/içecek");
  if (/web|website|site/.test(text)) signals.push("website");
  if (/saas/.test(text)) signals.push("SaaS");
  if (/mobil|mobile|uygulama|app/.test(text)) signals.push("mobil uygulama");
  return signals.slice(0, 4);
}

function normalizeTurkishQuery(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTurkishQuestionWords(normalized: string) {
  return /(selam|merhaba|naber|nasilsin|iyimisin|iyi misin|ne haber|kimsin|nerenin|turkce|yazmiyorsun|peki|biz|insanlar|soyundan|geliyoruz|turkiye|dunya|ulke|araba|marka|kadin|erkek|askerlik|asker|ne kadar|suruyor|surer|kac|yasar|yilan|zehir|zehirli|zehirsiz|tavuk|yumurta|civciv|sehir|nufus|nerede|neresi|bolge|bursa|bursanin|meshur|meshurdur|neyi meshur|takipci|izlenim|izlenme|fotograf|gorsel|ses kaydi|sesim|dosya|materyal|yukleyecegim|gonderecegim|sort|tisort|gomlek|giyilir|giyinilir|kombin|renk|soru|cevap|yorum|fikir|oneri|onerirsin|onerirsiniz|tavsiye|anlat|acikla|nedir|neden|nasil|hangi|hangisi|kim|ne zaman)/.test(normalized);
}

function isGeneralInformationQuestion(message: string) {
  const text = message.toLocaleLowerCase("tr-TR").trim();
  const normalized = normalizeTurkishQuery(message);
  const asksCapability = /(yapabilir misin|yapabilirmisin|istedigim seyleri|istedigim seyler|benim istedigim)/.test(normalized);
  const hasProductionAction = /\b(yap|yapar misin|uret|olustur|hazirla|tasarla|kur|build|create|generate|make|produce)\b/.test(normalized) && !asksCapability;
  const hasQuestionSignal = /\?/.test(text) || isOutfitColorQuestion(message) || /(mi|mu|nedir|ne demek|neden|niye|nasil|ne yapabilirim|ne yapabiliriz|ne yapmali|ne iyi gelir|neler iyi gelir|iyi gelir|tavsiye|oneri|onerirsin|onerirsiniz|sen ne onerirsin|kac|kimdir|kim|hangisi|hangi|hngi|nerenin|nereli|nerede|nerde|neresi|neresinde|neresindedir|ne tarafinda|hangi tarafta|ne zaman|neyle meshur|neyi meshur|meshur|meshurdur|say|listele|bilgi almak|ogrenmek|anlatir misin|aciklar misin|bolgesinde|bolgesi|nufus|soyundan|geliyoruz|askerlik|suruyor|surer|ulke|araba mark|markalari|kadin|erkek|yapabilir misin|yapabilirmisin|istedigim|giyilir|giyinilir|ustune|kombin|what is|why|how|who|which|where|when|list|explain|learn|advice|recommend)/.test(normalized);
  return hasQuestionSignal && !hasProductionAction;
}

function informationalReply(message: string, language: string) {
  // Do not answer arbitrary user questions from hard-coded examples.
  // General Q&A, advice, article writing and follow-up replies must come from /api/assistant-chat.
  // This helper only marks that the message is conversational; it intentionally returns no content.
  return "";
}

function unavailableConversationalFallback(message: string, language: string) {
  const normalized = normalizeTurkishQuery(message);
  const replyLanguage = responseLanguage(message, language);
  if (replyLanguage === "tr" || hasTurkishQuestionWords(normalized)) {
    if (/^(selam|merhaba|sa|slm|hey)\b/.test(normalized)) return "Selam, buradayım. Şu an uzak AI cevabı alınamasa da mesajını aldım; tekrar yazarsan gerçek asistan cevabını deneyeceğim.";
    if (/^(nasilsin|iyimisin|iyi misin|naber|ne haber)\b/.test(normalized)) return "İyiyim, buradayım. Şu an uzak AI cevabı alınamadı; bağlantı gelince soruna normal asistan gibi cevap vereceğim.";
    return "Şu an gerçek AI cevabı alınamadı. Yanlış kategori cevabı vermek yerine bunu açık söylüyorum; lütfen tekrar dene veya biraz sonra yeniden gönder.";
  }
  return "The real AI reply is unavailable right now. I won’t fake a category answer; please try again shortly.";
}

function safeConversationalFallbackReply(message: string, language: string, turnCount: number, recentContext = "") {
  const normalized = normalizeTurkishQuery(message);
  const context = normalizeTurkishQuery(recentContext);
  if (isMaterialUploadQuestion(message, recentContext)) return materialUploadFallbackReply(message, language);
  if (/(takipci|izlenim|izlenme|onerirsin|onerin|tavsiyen|sen ne onerirsin|ne onerirsin|nasil yapacagiz|nasil yapariz|peki nasil|ne yapacagiz|siradaki adim)/.test(normalized) && /(tiktok|video|reklam|kampanya|shorts|reels|production|uretim)/.test(context)) {
    return responseLanguage(message, language) === "tr"
      ? "Gerçek AI cevabı şu an alınamadı. Normalde burada bağlamı okuyup doğrudan tavsiye vermem gerekiyor; lütfen tekrar gönder, bağlantı gelirse bu kez gerçek cevap üreteceğim."
      : "The real AI reply is unavailable right now. Please send it again and I’ll answer with context when the remote assistant responds.";
  }
  return unavailableConversationalFallback(message, language);
}

function publicConversationalReply(message: string, language: string, turnCount: number) {
  const text = message.toLocaleLowerCase("tr-TR");
  const replyLanguage = responseLanguage(message, language);
  const signals = extractAssistantSignals(message);
  const signalText = signals.length ? ` (${signals.join(", ")})` : "";
  const infoReply = informationalReply(message, language);
  if (infoReply) return infoReply;
  if (replyLanguage === "tr") {
    if (/^(selam|merhaba|sa|slm|hey)\b/.test(text)) return "Selam, buradayım. Ne yapmak istediğini yazabilir ya da sesli söyleyebilirsin.";
    if (/^(nasılsın|nasilsin|naber|ne haber|iyimisin|iyi misin)\b/.test(text)) return "İyiyim, buradayım. Sen ne yapmak istiyorsun?";
    if (/neden\s+türkçe\s+yazmıyorsun|neden\s+turkce\s+yazmiyorsun/.test(normalizeTurkishQuery(message))) return "Haklısın, Türkçe devam edeceğim. Sen Türkçe yazdığında veya sesli konuştuğunda ben de Türkçe cevap vereceğim.";
    if (/sen\s+nerenin\s+asistanısın|sen\s+nerenin\s+asistanisin|kimsin|nesin/.test(normalizeTurkishQuery(message))) return "Ben Crelavo çalışma alanındaki yapay zekâ asistanıyım. Site, üretim, API, video, reklam, kredi, dashboard ve proje işleri için sana adım adım yardımcı olurum.";
    if (/canim\s+sikkin|canım\s+sıkkın|moralim\s+bozuk|keyfim\s+yok/.test(normalizeTurkishQuery(message))) return "Üzüldüm. İstersen biraz anlat; dinlerim. Hemen çözüm üretmek zorunda değiliz, önce neyin canını sıktığını beraber netleştirebiliriz.";
    if (/api.*(nasil|nereden|alinir|alabilirim|basvur|olustur)|nasil.*api.*(alinir|alabilirim|olusturulur)/.test(normalizeTurkishQuery(message))) return "API almak için genelde şu yol izlenir: ilgili platformda developer hesabı açılır, yeni app/project oluşturulur, gerekli izinler/scopes seçilir, callback/domain doğrulaması yapılır, sonra client key/secret veya API key alınır. Hangi API’yi almak istediğini söylersen adımlarını tek tek yazarım.";
    if (/istanbul.*deprem.*(ne zaman|en son)|en son.*istanbul.*deprem/.test(normalizeTurkishQuery(message))) return "Canlı deprem verisine bağlı olmadan kesin ‘en son’ bilgisini garanti edemem. En doğru güncel bilgi için Kandilli Rasathanesi veya AFAD son depremler sayfasına bakmak gerekir. İstersen sana nereden kontrol edeceğini adım adım gösterebilirim.";
    if (/bursa.*(neyi|neyle).*(meshur|meshurdur)|bursanin.*(neyi|neyle).*(meshur|meshurdur)/.test(normalizeTurkishQuery(message))) return "Bursa en çok İskender kebabı, kestane şekeri, pideli köfte, İnegöl köftesi, şeftalisi, Uludağ’ı, Cumalıkızık köyü ve tarihi Osmanlı mirasıyla meşhur. Kısa cevap: yemek tarafında İskender ve kestane şekeri ilk akla gelenler.";
    if (/(sen ne onerirsin|ne onerirsin|tavsiyen ne|senin tavsiyen)/.test(normalizeTurkishQuery(message))) return "Benim önerim: hedefi önce netleştir, sonra küçük bir deneme yap. Eğer video/iş fikri konuşuyorsak tek büyük iş yerine 3-5 kısa seçenek üretip en güçlü olanı test etmek daha mantıklı.";
    if (/^(sana\s+)?(bir\s+)?(şey|sey)\s+(istemek|isteyeceğim|isteyecegim|soracağım|soracagim)\s+istiyorum/.test(text)) return "Tabii, söyle. Ne istiyorsun?";
    if (/growth intelligence|rakip|competitor|pazar istihbarat|market intelligence|fiyat takibi|pricing changes|ad library|haftalık rapor|weekly report/.test(text)) return "Bunu Growth Intelligence hizmeti olarak ele alabiliriz. Bu normal kredi top-up değil; ama aktif hak/kredi uygunluğu olan kullanıcıya sonuç dashboard’da PDF/dosya raporu olarak teslim edilir. Rakip URL’leri, public reklam/fiyat/landing page sinyalleri, haftalık PDF rapor ve aksiyon önerileriyle ilerler.";
if (/youtube|tiktok|kanal|takip|izlenme|para kazan|kazandıran|kazandiran|niş|nis/.test(text)) return "Anladım, burada kategori seçtirmekten önce hedefi netleştirmek gerekiyor: izlenme, takipçi ve gelir potansiyeline göre birkaç kanal fikrini karşılaştırıp en güçlü yolu önereceğim.";
    if (/affiliate|iş ortağı|is ortagi|partner|komisyon|referral|iş arkadaşı|is arkadasi/.test(text)) return "İş ortaklığı için seni partner başvuru akışına yönlendirebilirim. Kısaca: affiliate sayfasından başvuru yapılır, onaydan sonra referral link ve komisyon takibi açılır.";
    if (/üye|uye|kayıt|kayit|mail|email|doğrulama|dogrulama|gelmedi|atmayın|atmayin/.test(text)) return "Üyelik veya mail doğrulama tarafında takıldıysan adım adım gideriz. Önce kayıt sayfası, sonra gelen doğrulama maili; mail gelmediyse resend confirmation sayfası kontrol edilir.";
    if (/kod|code|bug|hata|debug|api|component|react|next|supabase|veritabanı|veritabani|sql/.test(text)) return "Tabii, kod tarafında da yardımcı olurum. Hatanı, dosya adını veya yapmak istediğin değişikliği yaz; sebep, çözüm ve öneriyi kısa şekilde çıkarırım.";
    if (/(web sitesi|website|site|landing).*(tanıtım videosu|tanitim videosu|video|reklam)|((tanıtım videosu|tanitim videosu|video|reklam).*(web sitesi|website|site|landing))/.test(text)) return "Bunu iki parçalı proje olarak ele alabiliriz: bir web sitesi ve ona bağlı tanıtım videosu. Site tarafında sayfa yapısı, tasarım, gerekirse admin panel, kaynak kod ve teslim paketini; video tarafında konsept, sahneler, seslendirme, altyazı, müzik ve final MP4 teslimini birlikte planlarız.";
    if (/müzik video|muzik video|müzik klip|muzik klip|klip|mv|şarkı|sarki/.test(text)) return "Bunu müzik klip/MV akışı olarak ele alırım. Kendi görüntün kullanılacaksa materyal yükleme, şarkı/ses, görsel tarz, altyazı veya lyric ve final MP4 teslimini birlikte ilerletiriz.";
    if (/e-?ticaret|eticaret|mağaza|magaza|shopify|woocommerce|checkout|sepet/.test(text)) return "Bunu e-ticaret projesi olarak ele alırım. Ürün sayfaları, sepet/checkout, admin ürün yönetimi, kaynak kod, localhost test ve final teslim akışını birlikte kurarız.";
    if (/admin panel|web sitesi|website|site yaptır|site yaptir|landing/.test(text)) return "Bunu web sitesi/proje işi olarak ele alabiliriz. Sayfa yapısı, tasarım, gerekirse admin panel, kaynak kod, localhost test ve final teslim akışını birlikte kurarız.";
    if (/nasıl yardımcı|nasil yardimci|ne yapabilirsin|yardım|yardim|nasıl çalış|nasil calis/.test(text)) return "Fikrini, site içinde takıldığın yeri veya kod sorununu normal cümleyle yaz. Ben önce hedefi anlayıp sonra seni tek tek doğru adıma götürürüm.";
    if (/anlat|seçenek|secenek|akış|akis/.test(text)) return "Önce hedefi anlarım, sonra seçenekleri karşılaştırır, önerimi yapar ve üretim/test/teslim adımlarına bölerim.";
    if (/kredi|fiyat|paket|ödeme|odeme/.test(text)) return signals.length ? `Kredi tahminini ${signals.join(", ")} kapsamına göre çıkarırım. Ödeme kısmı üretime geçerken ayrı görünür.` : "Kredi tahminini kapsama göre çıkarırım. Ödeme kısmı üretime geçerken ayrı görünür.";
    if (/devam|tamam|olur|evet|başla|basla/.test(text) && text.split(/\s+/).length <= 4) return signals.length ? `Tamam, ${signals.join(", ")} detaylarını koruyarak devam ediyorum.` : "Tamam, devam ediyorum. Son yazdığın hedefe göre toparlayacağım.";
    if (/video|reklam|avatar|animasyon|site|website|saas|ürün|urun|kampanya|müzik|muzik|konuşmalı|konusmali|içecek|icecek|tavuk|yemek|gıda|gida|restoran|menü|menu|kafe|cafe/.test(text)) return `Anladım${signalText}. Bunu yapılabilir bir üretim akışına çevireceğim; gerekirse sadece kritik materyal veya hedefi sorarım.`;
    return "Buradayım. Site işi, üretim, kod, fikir, genel soru veya yorum fark etmez; normal cümleyle yaz, doğrudan cevap vereyim ya da gerekiyorsa işi akışa çevireyim.";
  }
  if (/hello|hi|hey/.test(text)) return "Hi, I’m listening. You can ask general questions, discuss ideas, debug code, or start a production request here.";
  if (/code|bug|error|debug|api|component|react|next|supabase|database|sql/.test(text)) return "Yes, I can help with code too. Send the error, file name, or change you want; I’ll summarize the cause, fix, and suggestions.";
  if (/how can you help|what can you do|help/.test(text)) return "Ask normally: general questions, opinions, code issues, business ideas, or production requests. I’ll answer directly when it’s a question and only turn it into a workflow when it’s a real production task.";
  if (/continue|ok|yes|start/.test(text)) return "Okay, I’ll continue and keep the setup simple.";
  return "I’m here. Ask a general question, share an idea, request a comment, debug code, or start a production task; I’ll answer directly instead of forcing everything into a form.";
}

function conversationalReplyForIntent(intent: WorkspaceIntent, language: string, turnCount: number) {
  if (intent === "greeting") return language === "tr" ? "Selam, buradayım. Ne yapmak istediğini yazabilirsin." : localizedWorkspaceReply("greeting", language, turnCount);
  if (intent === "help") return localizedWorkspaceReply("help", language, turnCount);
  return language === "tr"
    ? "Buradayım. Fikrini yaz, ben kısa ve net şekilde yönlendireyim."
    : "I’m here. Share the idea and I’ll guide you clearly.";
}

function googleStyleProductionReply(message: string, language: string) {
  const text = message.toLocaleLowerCase("tr-TR");
  const replyLanguage = responseLanguage(message, language);
  const signals = extractAssistantSignals(message);
  const details = signals.length ? ` Şunu yakaladım: ${signals.join(", ")}.` : "";
  if (replyLanguage === "tr") {
    if (/growth intelligence|rakip|competitor|pazar istihbarat|market intelligence|fiyat takibi|pricing changes|ad library|haftalık rapor|weekly report/.test(text)) return "Bunu Growth Intelligence servis akışı olarak ele alıyorum. Rakip URL’leri, public fiyat/reklam/landing page sinyalleri, haftalık rapor, alert kanalları ve dashboard’da PDF/dosya raporu teslimini planlayacağım. Rapor teslimi aktif hak/kredi uygunluğu olan kullanıcıya açılır.";
if (/youtube|tiktok|kanal|takip|izlenme|para kazan|kazandıran|kazandiran|niş|nis/.test(text)) return "Bunu kanal stratejisi olarak ele alıyorum. Önce izlenme, takipçi ve gelir potansiyeli yüksek nişleri karşılaştırıp sana önerilen yolu çıkaracağım.";
    if (/affiliate|iş ortağı|is ortagi|partner|komisyon|referral|iş arkadaşı|is arkadasi/.test(text)) return "Bunu partner/affiliate destek akışı olarak ele alıyorum. Başvuru, onay, referral link, komisyon ve payout adımlarını net şekilde anlatacağım.";
    if (/üye|uye|kayıt|kayit|mail|email|doğrulama|dogrulama|gelmedi|atmayın|atmayin/.test(text)) return "Bunu üyelik/mail doğrulama desteği olarak ele alıyorum. Kayıt, doğrulama maili, yeniden gönderme ve destek adımlarını tek tek yönlendireceğim.";
    if (/kredi|fiyat|paket|ödeme|odeme/.test(text)) return `Kapsama göre kredi tahmini çıkarırım.${details} Önce işi netleştirelim.`;
    if (/(web sitesi|website|site|landing).*(tanıtım videosu|tanitim videosu|video|reklam)|((tanıtım videosu|tanitim videosu|video|reklam).*(web sitesi|website|site|landing))/.test(text)) return `Tamam, bunu çok parçalı proje olarak hazırlayabiliriz.${details} Web sitesi için sayfa yapısı, tasarım, gerekirse admin panel, kaynak kod ve teslim paketi; tanıtım videosu için konsept, sahneler, seslendirme, altyazı, müzik ve final MP4 akışını çıkaracağım.`;
    if (/müzik video|muzik video|müzik klip|muzik klip|klip|mv|şarkı|sarki/.test(text)) return `Tamam, bunu müzik klip/MV işi olarak hazırlıyorum.${details} Şarkı, kendi görüntün, görsel tarz, altyazı/lyric ve final MP4 teslimini planlayacağım.`;
    if (/e-?ticaret|eticaret|mağaza|magaza|shopify|woocommerce|checkout|sepet/.test(text)) return `Tamam, bunu e-ticaret projesi olarak hazırlıyorum.${details} Ürün yönetimi, sepet/checkout, admin panel, localhost test ve kaynak teslimini planlayacağım.`;
    if (/admin panel|web sitesi|website|site yaptır|site yaptir|landing|web|site|saas|mobil|uygulama|admin/.test(text)) return `Tamam, bunu proje işi olarak hazırlayabiliriz.${details} Sayfa/ekran yapısı, gerekirse admin panel, test ve kaynak teslimini öne alacağım.`;
    if (/içecek|icecek|tavuk|yemek|gıda|gida|restoran|menü|menu|kafe|cafe/.test(text)) return `Tamam, bunu yiyecek/içecek işi olarak hazırlıyorum.${details} Menü, ürün, hedef kitle, platform ve teslim formatına göre seçenekleri düzenleyeceğim.`;
    if (/konuşmalı|konusmali|lip-sync|dudak|avatar|şive|sive|aksan|yöresel|yoresel|kişi|kisi/.test(text)) return `Tamam, bunu konuşmalı video olarak hazırlıyorum.${details} Kişiler, sesler, materyaller ve yöresel detayları ayıracağım.`;
    if (/ürün|urun|reklam|tiktok|instagram|kampanya|shopify|amazon|trendyol/.test(text)) return `Tamam, bunu kampanya/reklam işi olarak hazırlıyorum.${details} Ürün, hedef kitle ve platforma göre seçenekleri düzenleyeceğim.`;
    if (/video|animasyon|avatar|müzik|muzik/.test(text)) return `Tamam, bunu video işi olarak hazırlıyorum.${details} Konsept, sahne, ses, altyazı ve final teslim akışını çıkaracağım.`;
    return `Tamam, bunu taslak olarak aldım.${details} Hedefe göre uygulanabilir bir akış çıkaracağım.`;
  }
  const enDetails = signals.length ? ` I noticed: ${signals.join(", ")}.` : "";
  if (/web|site|saas|mobile|app|admin/.test(text)) return `Got it. I’ll treat this as a project build.${enDetails}`;
  if (/talking|voice|accent|regional|dialect/.test(text)) return `Got it. I’ll treat this as a talking-video request.${enDetails}`;
  if (/product|ad|campaign|tiktok|instagram|shopify|amazon/.test(text)) return `Got it. I’ll treat this as an ad/campaign request.${enDetails}`;
  return `Got it. I’ll prepare this as a production draft.${enDetails}`;
}

function normalizeAssistantReplyLanguage(reply: string, userText: string, activeLanguage = "") {
  const language = activeLanguage || (isLikelyTurkish(userText) ? "tr" : "en");
  if (language === "en") return reply;
  if (/^I analyzed your command/i.test(reply)) return localizedWorkspaceReply("analyzed", language);
  if (/assistant request failed/i.test(reply)) return localizedWorkspaceReply("failed", language);
  if (/credits required/i.test(reply)) return localizedWorkspaceReply("creditsRequired", language);
  if (/I read this as a campaign\/video production/i.test(reply)) return localAssistantReply(userText, 1, language);
  if (/Understood\.|I am here|We can set this up|The flow is simple/i.test(reply)) return localAssistantReply(userText, 1, language);
  return reply;
}

function localAssistantReply(text: string, turnCount: number, activeLanguage = "") {
  const infoReply = informationalReply(text, activeLanguage);
  if (infoReply) return infoReply;
  const clean = text.toLocaleLowerCase("tr-TR");
  if (activeLanguage && activeLanguage !== "en" && activeLanguage !== "tr") {
    if (/evet|konuşalım|konusalim|devam|tamam|sürdür|surdur|yes|continue|ok/i.test(clean)) return localizedWorkspaceReply("continue", activeLanguage, turnCount);
    if (/nasıl|nasil|yapacağız|yapacagiz|ne yap|mantık|mantik|akış|akis|how|what next|flow/i.test(clean)) return localizedWorkspaceReply("flow", activeLanguage, turnCount);
    if (/yardım|yardim|yardımcı|yardimci|bilmiyorum|kararsız|kararsiz|help|not sure/i.test(clean)) return localizedWorkspaceReply("help", activeLanguage, turnCount);
    if (/dizi|film|kısa film|kisa film|fragman|senaryo|sahne|series|movie|trailer|script|scene/i.test(clean)) return localizedWorkspaceReply("story", activeLanguage, turnCount);
    if (/reklam|video|ürün|urun|shopify|tiktok|instagram|kampanya|ad|product|campaign/i.test(clean)) return localizedWorkspaceReply("campaign", activeLanguage, turnCount);
    if (/web|site|saas|mobil|uygulama|admin panel|mobile|app/i.test(clean)) return localizedWorkspaceReply("project", activeLanguage, turnCount);
    if (/kredi|fiyat|paket|satın|satin|ödeme|odeme|credit|price|package|payment/i.test(clean)) return localizedWorkspaceReply("credits", activeLanguage, turnCount);
    return localizedWorkspaceReply("default", activeLanguage, turnCount);
  }
  const turkish = isLikelyTurkish(text, activeLanguage);
  if (turkish) {
    if (/evet|konuşalım|konusalim|devam|tamam|sürdür|surdur/i.test(clean)) return "Anladım. Akışı durdurmadan devam edeceğim: amacı çıkaracağım, gereksiz materyalleri atlayacağım, sadece işi bozacak kritik bir eksik varsa tek net soru soracağım ve üretime hazır bir plan hazırlayacağım.";
    if (/nasıl|nasil|yapacağız|yapacagiz|ne yap|mantık|mantik|akış|akis/i.test(clean)) return "Akış basit: ne istediğini doğal dille anlıyorum, doğru üretim tipine çeviriyorum, kritik bir eksik yoksa mantıklı varsayılanlarla ilerliyorum ve canlı üretim kaydını hazırlıyorum.";
    if (/yardım|yardim|yardımcı|yardimci|bilmiyorum|kararsız|kararsiz/i.test(clean)) return "Menü ezberlemen gerekmiyor. Dağınık not yazabilirsin; ben bunu reklam, website, video, brand kit, doküman veya uygulama üretim planına çevireceğim.";
    if (/dizi|film|kısa film|kisa film|fragman|senaryo|sahne/i.test(clean)) return "Bunu dizi/film üretim akışı olarak ele alacağım: hikaye yönü, sahne planı, karakterler, ses, altyazı ve fragman/final teslim tek workspace içinde yönetilebilir.";
    if (/reklam|video|ürün|urun|shopify|tiktok|instagram|kampanya/i.test(clean)) return "Bunu kampanya/video üretimi olarak okuyorum. Ürün linkin varsa kullanabiliriz; yoksa ürün adı ve hedef kitle yeterli. Ses, müzik veya altyazı istemiyorsan bunları atlayıp akışı sade tutacağım.";
    if (/web|site|saas|mobil|uygulama|admin panel/i.test(clean)) return "Bunu dijital ürün/proje üretimi olarak kurabiliriz. Sayfaları, ekranları, admin tarafını, kaynak teslimini ve README paketini planlayıp canlı üretim kaydına çevireceğim.";
    if (/kredi|fiyat|paket|satın|satin|ödeme|odeme/i.test(clean)) return "Kredi tarafını pratik tutacağım: önce üretim tipi ve kapsamı tahmin edilir, sonra düşük maliyetli test mi yoksa tam teslim mi daha mantıklı belirlenir. Gereksiz pahalı özellikleri şişirmeyeceğim.";
    return turnCount > 2
      ? "Buradayım ve aynı cevabı tekrarlamayacağım. Son mesajındaki niyeti çıkarıp üretim planına çevireceğim; sadece 'devam' yazarsan mantıklı ayarlarla ilerlerim."
      : "Anladım. Ne istediğini normal dille yaz; küçük boşlukları ben tamamlarım, sadece kritik bir karar eksikse net şekilde sorarım.";
  }
  if (/yes|continue|ok/i.test(clean)) return "Understood. I will continue without stopping the flow: I will infer the goal, skip unnecessary material, ask only one clear question if needed, and prepare a production-ready plan.";
  if (/how|what next|flow/i.test(clean)) return "The flow is simple: I understand what you want in natural language, convert it into the right production type, choose sensible defaults unless a critical detail is missing, and then start the live production record.";
  if (/help|not sure/i.test(clean)) return "I am here to clarify the work, not make you memorize menus. You can write messy notes; I will turn them into an ad, website, video, brand kit, document, or app production plan.";
  if (/series|movie|trailer|script|scene/i.test(clean)) return "I will treat this as a series/film production flow: story direction, scene plan, characters, voice, subtitles, and trailer/final delivery can be managed in one workspace.";
  if (/ad|product|campaign|video|shopify|tiktok|instagram/i.test(clean)) return "I read this as a campaign/video production. If you have a product link, we can use it; otherwise product name and audience are enough. If you do not want voice, music, or subtitles, I will skip them and keep the flow lean.";
  if (/web|site|saas|mobile|app|admin panel/i.test(clean)) return "We can set this up as a digital product/project production. I will plan pages, screens, admin side, source delivery, and README package, then turn it into a live production record.";
  if (/credit|price|package|payment/i.test(clean)) return "I will keep the credit side practical: first estimate production type and scope, then suggest whether a low-cost test or full delivery makes more sense. I will not inflate unnecessary expensive features.";
  return turnCount > 2
    ? "I am here and will not repeat the same answer. I will infer the intent from your latest message and turn it into a production plan; you can simply write 'continue' and I will proceed with sensible settings."
    : "Understood. Write what you want in natural language; I will fill small gaps myself and ask clearly only if a critical decision is required.";
}

export function AssistantWorkspace({ initialIdea = "", initialCategory = "", initialMode = "", providerTestPreset = false }: { initialIdea?: string; initialCategory?: string; initialMode?: string; providerTestPreset?: boolean }) {
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceTranscriptReceivedRef = useRef(false);
  const voiceTimeoutRef = useRef<number | null>(null);
const [input, setInput] = useState(initialIdea || "");
const [productionBrief, setProductionBrief] = useState(initialIdea || "");
const [chatInput, setChatInput] = useState("");
const [activeLanguage, setActiveLanguage] = useState(() => getStoredLanguage());
  const [messages, setMessages] = useState<Message[]>(() => {
    const language = getStoredLanguage();
    return [{ role: "assistant", content: language === "tr" ? "Selam, dinliyorum. Genel soru, fikir, kod, site işi veya üretim isteği yazabilirsin; kısa ve net cevap vereceğim." : "Hi, I’m listening. You can ask general questions, discuss ideas, debug code, or start a production request here." }];
  });
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState(() => getStoredLanguage() === "tr" ? "Canlı üretim çalışma alanı hazır. Asistanla serbestçe sohbet edebilirsin; üretim başlamadan önce kısa onay görünür." : "Live production workspace is ready. You can chat freely with the assistant; a short confirmation appears before production starts.");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRoute, setLastRoute] = useState("/dashboard/assistant-workspace");
  const [selectedProductionType, setSelectedProductionType] = useState("video");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [selectedDuration, setSelectedDuration] = useState("30 sec");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["Voice-over", "Subtitles", "3 alternatives"]);
  const [selectedModules, setSelectedModules] = useState<string[]>(["AI video"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Dashboard delivery", "MP4 download"]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [activeCleanToolSection, setActiveCleanToolSection] = useState("categories");
  const [uploadedMaterials, setUploadedMaterials] = useState<UserUploadedMaterial[]>([]);
  const [droneLocation, setDroneLocation] = useState("");
  const [droneRoute, setDroneRoute] = useState("");
  const [droneMarkedArea, setDroneMarkedArea] = useState("");
  const [droneShotType, setDroneShotType] = useState("Satellite intro + drone flyover");
  const [droneMapStyle, setDroneMapStyle] = useState("Satellite map view");
  const [droneCameraMovement, setDroneCameraMovement] = useState("Smooth flyover route");
  const [droneVisualStyle, setDroneVisualStyle] = useState("Cinematic real estate");
  const [droneNarrationLanguage, setDroneNarrationLanguage] = useState("English voice-over");
  const [droneSubtitleOption, setDroneSubtitleOption] = useState("Clean bottom subtitles");
  const [droneMusicStyle, setDroneMusicStyle] = useState("Cinematic ambient music");
  const [liveSalesProductLink, setLiveSalesProductLink] = useState("");
  const [liveSalesBrandName, setLiveSalesBrandName] = useState("");
  const [liveSalesProductCategory, setLiveSalesProductCategory] = useState("");
  const [liveSalesTargetMarket, setLiveSalesTargetMarket] = useState("US / English");
  const [liveSalesPlatform, setLiveSalesPlatform] = useState("TikTok Live");
  const [liveSalesPersona, setLiveSalesPersona] = useState("Friendly sales host");
  const [liveSalesAvatarSource, setLiveSalesAvatarSource] = useState("Create new AI avatar");
  const [liveSalesAvatarStyle, setLiveSalesAvatarStyle] = useState("Realistic brand host");
  const [liveSalesVoiceSource, setLiveSalesVoiceSource] = useState("Choose AI voice");
  const [liveSalesVoiceLanguage, setLiveSalesVoiceLanguage] = useState("English multilingual support");
  const [liveSalesVoiceTone, setLiveSalesVoiceTone] = useState("Friendly persuasive sales voice");
  const [liveSalesBackground, setLiveSalesBackground] = useState("Modern virtual studio");
  const [liveSalesVisualStyle, setLiveSalesVisualStyle] = useState("Clean premium commerce look");
  const [liveSalesSubtitleOption, setLiveSalesSubtitleOption] = useState("Optional live captions");
  const [liveSalesInteractionMode, setLiveSalesInteractionMode] = useState("Live chat FAQ + sales replies");
  const [liveSalesStreamGoal, setLiveSalesStreamGoal] = useState("Product sales");
  const [liveSalesHumanFallback, setLiveSalesHumanFallback] = useState("Escalate refunds, complaints and sensitive claims to a human");
  const [liveSalesProviderReadiness, setLiveSalesProviderReadiness] = useState("Production handoff to prepare");
  const [liveSalesCtaOffer, setLiveSalesCtaOffer] = useState("");
  const [liveSalesComplianceNotes, setLiveSalesComplianceNotes] = useState("AI disclosure + human fallback policy");
  const [dramaFormat, setDramaFormat] = useState("Short drama");
  const [dramaGenre, setDramaGenre] = useState("Betrayal / revenge");
  const [dramaStructure, setDramaStructure] = useState("3 scenes");
  const [dramaCharacters, setDramaCharacters] = useState("2 leads");
  const [dramaHook, setDramaHook] = useState("Betrayal reveal");
  const [dramaVoiceDirection, setDramaVoiceDirection] = useState("Dialogue scene + subtitles");
  const [uploadPurpose, setUploadPurpose] = useState("user_material");
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [creditSplashOpen, setCreditSplashOpen] = useState(false);
  const [startState, setStartState] = useState<"idle" | "loading" | "error">("idle");
  const [startError, setStartError] = useState("");
  const [quickProviderTest, setQuickProviderTest] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [assistantCreditState, setAssistantCreditState] = useState<AssistantCreditState>(emptyAssistantCreditState);
  const [lastOrchestratorPlan, setLastOrchestratorPlan] = useState<AssistantOrchestratorResponse | null>(null);
  const [assistantConversationId, setAssistantConversationId] = useState("");
  const [productionCreditAvailable, setProductionCreditAvailable] = useState<number | null>(null);
const [dynamicWizard, setDynamicWizard] = useState<DynamicWizardState>(emptyDynamicWizard);
const [startedProduction, setStartedProduction] = useState<StartedProductionState>(null);
const latestAgentAction = lastOrchestratorPlan?.jobs?.[0]?.agent_action ?? null;
const productionLifecycleState = startedProduction ? "Production started" : productionBrief.trim() || input.trim() || dynamicWizard.open ? "Draft ready" : "Not submitted yet";
const productionLifecycleNote = startedProduction
  ? "Production record exists. Credits were checked during the start step."
  : productionBrief.trim() || input.trim() || dynamicWizard.open
    ? "Brief is prepared, but production has not started and credits are not reserved yet."
    : "No production request has been submitted yet.";
const [deliveryCreditRates, setDeliveryCreditRates] = useState<DeliveryCreditRatesConfig>(defaultDeliveryCreditRatesConfig);
  const [configuredProductionPackages, setConfiguredProductionPackages] = useState<ProductionPackage[]>(productionPackages);
  const materials = activePlatformMaterials();
  const siteToolOptions = footerGroups.flatMap((group) => group.links.map((link) => link.label));
  const selectedTypeForEstimate = productionTypeFromSelection();
  const selectionForEstimate = { input: productionBrief || input, selectedStyle, selectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, selectedMaterials, uploadedMaterials, quickProviderTest };
  const selectedPackageForEstimate = packageIdFromSelection(selectedTypeForEstimate, selectionForEstimate, configuredProductionPackages);
  const selectedProduction = productionTypes.find((item) => item.id === selectedProductionType);
  const selectedPackage = configuredProductionPackages.find((item) => item.id === selectedPackageForEstimate) ?? productionPackages.find((item) => item.id === selectedPackageForEstimate);
  const configuredPackageOptionsForSelectedType = configuredProductionPackages.filter((item) => item.productionType === selectedProductionType).map((item) => item.name);
  const baseCategoryProfile = categoryOptionProfiles[selectedProductionType] ?? categoryOptionProfiles.video;
  const activeCategoryProfile = configuredPackageOptionsForSelectedType.length ? { ...baseCategoryProfile, quality: configuredPackageOptionsForSelectedType } : baseCategoryProfile;
  const selectedCostFeatures = Array.from(new Set([...selectedFeatures, ...selectedModules]));
  const selectedOutputCount = selectedCostFeatures.includes("5 alternatives") ? 5 : selectedCostFeatures.includes("3 alternatives") ? 3 : 1;
  const selectedDurationSeconds = Number(selectedDuration.replace(/\D/g, "")) || 30;
  const uploadedMaterialBytes = uploadedMaterials.reduce((total, material) => total + (Number(material.size_bytes) || 0), 0);
  const deliverySignal = `${selectedFeatures.join(" ")} ${selectedPlatforms.join(" ")} ${selectedModules.join(" ")}`.toLocaleLowerCase("tr-TR");
  const selectedDeliveryRequirements = {
    requested: true,
    status: "pending",
    formats: [
      deliverySignal.includes("mp4") || deliverySignal.includes("video") ? "final_mp4" : null,
      deliverySignal.includes("zip") || deliverySignal.includes("paket") ? "final_zip" : null,
      deliverySignal.includes("source") || deliverySignal.includes("kaynak") || deliverySignal.includes("working source") ? "source_code" : null,
      deliverySignal.includes("readme") || deliverySignal.includes("setup") || deliverySignal.includes("kurulum") ? "readme" : null,
      deliverySignal.includes("subtitle") || deliverySignal.includes("altyaz") ? "subtitle_file" : null,
      deliverySignal.includes("thumbnail") || deliverySignal.includes("cover") || deliverySignal.includes("kapak") ? "thumbnail" : null,
      deliverySignal.includes("pdf") ? "pdf" : null,
      deliverySignal.includes("admin panel") ? "admin_panel" : null,
      selectedQuality.toLocaleLowerCase("tr-TR").includes("4k") ? "4k_export" : null
    ].filter(Boolean)
  };
  const costEstimate = estimateProductionCost(selectedPackageForEstimate, {
    outputCount: selectedOutputCount,
    quality: selectedQuality,
    durationSeconds: selectedDurationSeconds,
    features: selectedCostFeatures,
    productionType: selectedTypeForEstimate,
    materialCount: selectedMaterials.length + uploadedMaterials.length,
    materialBytes: uploadedMaterialBytes,
    revisionBuffer: selectedFeatures.includes("Revision right"),
    deliveryRequirements: selectedDeliveryRequirements,
    deliveryCreditRates,
    packageCatalog: configuredProductionPackages
  });
  const availableProductionCredits = productionCreditAvailable ?? assistantCreditState.productionAvailable;
  const hasKnownProductionCredits = typeof availableProductionCredits === "number";
  const productionCreditShortfall = hasKnownProductionCredits ? Math.max(0, costEstimate.totalCredits - (availableProductionCredits ?? 0)) : 0;
  const productionCreditInsufficient = hasKnownProductionCredits && productionCreditShortfall > 0;

  useEffect(() => {
    fetch("/api/delivery-credit-rates")
      .then((res) => res.json())
      .then((data) => data.config ? setDeliveryCreditRates(data.config) : undefined)
      .catch(() => undefined);
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data) => Array.isArray(data.config?.productionPackages) && data.config.productionPackages.length ? setConfiguredProductionPackages(data.config.productionPackages) : undefined)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cachedMessages = window.localStorage.getItem("clipora_assistant_workspace_messages");
    if (cachedMessages) {
      try {
        const parsed = JSON.parse(cachedMessages) as Message[];
        if (Array.isArray(parsed) && parsed.length) setMessages(cleanAssistantMessages(parsed).slice(-200));
      } catch {
        window.localStorage.removeItem("clipora_assistant_workspace_messages");
      }
    }
    requireVerifiedBrowserUser().then((auth) => {
      if (!auth.ok || cancelled) return;
      fetch(`/api/credits?user_id=${auth.user.id}`, { cache: "no-store", headers: authHeaders(auth.accessToken) })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && typeof data.available === "number") setProductionCreditAvailable(data.available);
        })
        .catch(() => undefined);
      fetch(`/api/assistant-chat?user_id=${auth.user.id}`, { headers: authHeaders(auth.accessToken) })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.conversation?.id) setAssistantConversationId(String(data.conversation.id));
          const persistedMessages = Array.isArray(data.messages)
            ? data.messages
              .map((item: { role?: string; content?: string }) => ({ role: item.role === "assistant" ? "assistant" as const : "user" as const, content: String(item.content ?? "") }))
              .filter((item: Message) => item.content.trim())
            : [];
          const cleanedPersistedMessages = cleanAssistantMessages(persistedMessages);
          if (cleanedPersistedMessages.length) setMessages(cleanedPersistedMessages.slice(-200));

        })
        .catch(() => undefined);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (messages.length) {
      const cleanedMessages = cleanAssistantMessages(messages);
      window.localStorage.setItem("clipora_assistant_workspace_messages", JSON.stringify(cleanedMessages.slice(-200)));
      if (cleanedMessages.length !== messages.length) setMessages(cleanedMessages);
    }
  }, [messages]);

  useEffect(() => {
    setActiveLanguage(getStoredLanguage());
    function handleLanguageChange() {
      setActiveLanguage(getStoredLanguage());
    }
    window.addEventListener("clipora-language-change", handleLanguageChange);
    return () => window.removeEventListener("clipora-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (!providerTestPreset) return;
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, [providerTestPreset]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "assistant") return current;
      return [{ role: "assistant", content: localizedWorkspaceReply("default", activeLanguage, 1) }];
    });
  }, [activeLanguage]);

  useEffect(() => {
    const node = chatLogRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  }, [messages, isLoading]);

  function toggleFeature(feature: string) {
    setQuickProviderTest(false);
    setSelectedFeatures((current) => current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]);
  }

  function toggleModule(module: string) {
    setQuickProviderTest(false);
    setSelectedModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  }

  function togglePlatform(platform: string) {
    setQuickProviderTest(false);
    setSelectedPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
  }

  function toggleMaterial(materialId: string) {
    setQuickProviderTest(false);
    setSelectedMaterials((current) => current.includes(materialId) ? current.filter((item) => item !== materialId) : [...current, materialId]);
  }

  function applyDynamicWizardPreset(type: DynamicWizardType, subject: string) {
    setQuickProviderTest(false);
    setSelectedProductionType(type === "document" ? "website" : type);
    if (type === "website") {
      setSelectedStyle("SaaS modern");
      setSelectedDuration("Project based");
      setSelectedModules(["Website", "Admin panel", "Working source package"]);
      setSelectedFeatures(["Source file delivery", "Final ZIP", "README", "Revision right"]);
      setSelectedPlatforms(["Dashboard delivery", "ZIP source"]);
    } else if (type === "mobile_app") {
      setSelectedStyle("App demo");
      setSelectedDuration("Project based");
      setSelectedModules(["Mobile app", "Admin panel"]);
      setSelectedFeatures(["Source file delivery", "Final ZIP", "README", "Revision right"]);
      setSelectedPlatforms(["Dashboard delivery", "ZIP source"]);
    } else if (type === "campaign") {
      setSelectedStyle("Premium ad");
      setSelectedDuration("30 sec");
      setSelectedModules(["Product ad video", "Campaign set"]);
      setSelectedFeatures(["A/B hook", "Social media caption", "Subtitles", "Music", "3 alternatives"]);
      setSelectedPlatforms(["Dashboard delivery", "TikTok", "Instagram Reels"]);
    } else if (type === "talking_video") {
      setSelectedStyle("Realistic UGC");
      setSelectedDuration("30 sec");
      setSelectedModules(["Advanced talking video", "Voice-to-video", "Lip-sync"]);
      setSelectedFeatures(["Voice-over", "Subtitles", "Music", "Revision right"]);
      setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
    } else if (type === "image") {
      setSelectedStyle("Premium ad");
      setSelectedDuration("Project based");
      setSelectedModules(["Visual/image pack", "Brand kit"]);
      setSelectedFeatures(["Source file delivery", "Final ZIP", "3 alternatives"]);
      setSelectedPlatforms(["Dashboard delivery", "ZIP source"]);
    } else if (type === "document") {
      setSelectedStyle("Corporate");
      setSelectedDuration("Project based");
      setSelectedModules(["PDF/document", "Website"]);
      setSelectedFeatures(["Source file delivery", "Final ZIP", "README"]);
      setSelectedPlatforms(["Dashboard delivery", "ZIP source"]);
    } else {
      setSelectedStyle(/tavuk|içecek|icecek|yemek|restoran|menü|menu/i.test(subject) ? "Product demo" : "Cinematic");
      setSelectedDuration("15 sec");
      setSelectedModules(["AI video", "Prompt-to-video"]);
      setSelectedFeatures(["Script", "Scene plan", "Subtitles", "Music", "3 alternatives"]);
      setSelectedPlatforms(["Dashboard delivery", "MP4 download", "Instagram Reels"]);
    }
  }

function openDynamicWizardFromMessage(message: string) {
  const type = inferDynamicWizardType(message);
  const subject = extractWizardSubject(message) || message.trim();
  applyDynamicWizardPreset(type, subject);
  setDynamicWizard({ open: true, type, subject, answers: {}, creditPromptOpen: false });
  setOptionsOpen(true);
}

function selectWizardCategory(groupId: string, categoryId: string) {
  const type = wizardCategoryTypeMap[categoryId] ?? "video";
  const subject = wizardCategoryLabels[categoryId] ?? dynamicWizardLabels[type];
  const productionMatch = productionTypes.some((item) => item.id === categoryId);
  if (productionMatch) {
    applyGeneralProductionPreset(categoryId, subject);
  } else {
    applyDynamicWizardPreset(type, subject);
  }
  setDynamicWizard({ open: true, type, subject, groupId, categoryId, answers: {}, creditPromptOpen: false });
  setOptionsOpen(true);
}

function selectDynamicWizardOption(question: DynamicWizardQuestion, option: string) {
    setDynamicWizard((current) => {
      const currentAnswers = current.answers[question.id] ?? [];
      const nextAnswers = question.multi
        ? (currentAnswers.includes(option) ? currentAnswers.filter((item) => item !== option) : [...currentAnswers, option])
        : [option];
      return { ...current, creditPromptOpen: false, answers: { ...current.answers, [question.id]: nextAnswers } };
    });
  if (question.id === "duration") setSelectedDuration(option);
  if (question.id === "quality") setSelectedQuality(option);
  if (question.id === "visualStyle") setSelectedStyle(option);
  if (question.id === "platform" || question.id === "channels") setSelectedPlatforms((current) => current.includes(option) ? current : [...current, option]);
  if (question.id === "extras" || question.id === "delivery" || question.id === "appFeatures" || question.id === "assets" || question.id === "videoStructure") setSelectedFeatures((current) => current.includes(option) ? current : [...current, option]);
    if (question.id === "siteType" && option === "Restaurant / cafe") setSelectedModules((current) => current.includes("Website") ? current : [...current, "Website"]);
    if (question.id === "videoType" && option === "Restaurant / food video") setSelectedStyle("Product demo");
  }

  function requestDynamicWizardCredits() {
    setDynamicWizard((current) => ({ ...current, open: true, creditPromptOpen: true }));
    setAssistantCreditState((current) => ({ ...current, requiredCredits: costEstimate.totalCredits, redirect: current.redirect ?? "/dashboard/credits" }));
    setStatus(activeLanguage === "tr" ? "Üretim özeti hazır. Devam etmek için kredi kontrolü gerekiyor." : "Production summary is ready. Credits are required to continue.");
  }

  async function uploadUserMaterial(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setQuickProviderTest(false);
    setUploadState("loading");
    setUploadError("");
    try {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) {
        setUploadState("error");
        setUploadError("Please sign in and confirm your email before uploading materials.");
        return;
      }
      const formData = new FormData();
      formData.set("user_id", auth.user.id);
      formData.set("purpose", uploadPurpose);
      formData.set("file", file);
      const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.material) {
        throw new Error(data.error ?? "Material upload failed.");
      }
      setUploadedMaterials((current) => [...current, data.material as UserUploadedMaterial]);
      setUploadState("idle");
    } catch (error) {
      setUploadState("error");
      setUploadError(error instanceof Error ? error.message : "Material upload failed.");
    }
  }

  function removeUploadedMaterial(fileUrl: string) {
    setUploadedMaterials((current) => current.filter((material) => material.file_url !== fileUrl));
  }

  function applyQuickProviderTestPreset() {
    setSelectedProductionType("video");
    setSelectedQuality("720p quick test");
    setSelectedStyle("Cinematic animation");
    setSelectedDuration("5 sec");
    setSelectedModules(["AI video"]);
    setSelectedFeatures(["1 alternative", "MP4 test output"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
    setQuickProviderTest(true);
    setInput("Produce a simple 5-second AI video in a cinematic animation style for a quick provider test.");
    setOptionsOpen(false);
  }

  function runQuickProviderTest() {
    applyQuickProviderTestPreset();
    setStartError("");
    setStartState("idle");
    setStartModalOpen(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }

  function applySeriesFilmPreset() {
    setQuickProviderTest(false);
    setSelectedProductionType("video");
    setSelectedQuality("1080p cinematic");
    setSelectedStyle("Series / film");
    setSelectedDuration("Episode based");
    setSelectedModules(["Series / film studio", "Script + scene plan", "AI video", "Voice-over"]);
    setSelectedFeatures(["Script", "Scene plan", "Character breakdown", "Series/film bible", "Trailer cut", "Voice-over", "Subtitles", "Music", "Revision right"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download", "ZIP source"]);
    setInput("Prepare a production workspace for a series/film studio flow with script, scene plan, character breakdown, trailer cut, voice-over, music and subtitles.");
    setOptionsOpen(false);
  }

  function applyLongFilmClippingPreset() {
    setQuickProviderTest(false);
    setSelectedProductionType("video");
    setSelectedQuality("1080p");
    setSelectedStyle("Series / film");
    setSelectedDuration("Project based");
    setSelectedModules(["Series / film studio", "Long film/series clipping", "Shorts/Reels/TikTok cuts", "Subtitles"]);
    setSelectedFeatures(["Long film/series clipping", "Scene detection", "Hook extraction", "Shorts/Reels cut", "Subtitles", "Social media caption", "Hashtag set", "Cover visual"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"]);
    setInput("Build a production workspace that finds the best moments from long film or series content and prepares Shorts/Reels/TikTok cuts, subtitles, cover visuals, captions and hashtag sets.");
    setOptionsOpen(false);
  }

  function applyVideoToolPreset(kind: "image" | "text" | "ugc" | "voice") {
    setQuickProviderTest(false);
    setSelectedProductionType("video");
    setSelectedQuality(kind === "ugc" ? "1080p" : "720p");
    setSelectedStyle(kind === "ugc" ? "Realistic UGC" : kind === "voice" ? "Corporate" : "Cinematic");
    setSelectedDuration(kind === "voice" ? "60 sec" : "30 sec");
    setSelectedModules(["AI video", kind === "voice" ? "Voice-over" : "Visual/image pack"]);
    setSelectedFeatures(kind === "voice" ? ["Voice-over", "Subtitles", "Music", "Revision right"] : ["Scene plan", "Subtitles", "Music", "Shorts/Reels cut"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
    setInput(kind === "image"
      ? "Prepare a short AI video production workspace from an image reference for Image to Video."
      : kind === "text"
        ? "Prepare a scene plan and short AI video production workspace from text for Text to Video."
        : kind === "ugc"
          ? "Prepare a production workspace for a realistic UGC product/promo video with hook, scene plan, subtitles and CTA."
          : "Prepare a voice-over video production workspace with narration, subtitles, music and final video delivery.");
    setOptionsOpen(false);
  }

  function applyMusicVideoPreset(kind: "mv" | "lyric" | "visualizer") {
    setQuickProviderTest(false);
    setSelectedProductionType("music_video");
    setSelectedQuality(kind === "mv" ? "1080p cinematic" : "1080p");
    setSelectedStyle(kind === "lyric" ? "Motion graphics" : kind === "visualizer" ? "Cinematic animation" : "Cinematic");
    setSelectedDuration(kind === "mv" ? "3 min" : "60 sec");
    setSelectedModules(["Music video/MV", "AI video", "Visual/image pack"]);
    setSelectedFeatures(kind === "lyric" ? ["Subtitles", "Music", "Scene plan", "Shorts/Reels cut"] : ["Scene plan", "Music", "Cover visual", "Shorts/Reels cut", "Revision right"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels"]);
    setInput(kind === "lyric"
      ? "Prepare a lyric video workspace with lyric timing, motion graphics, subtitles and social cuts."
      : kind === "visualizer"
        ? "Prepare a visualizer workspace with rhythm-led visuals, cover visual and social teasers."
        : "Prepare a music video/MV workspace with scene plan, performance/concept direction, cover visual and social cuts.");
    setOptionsOpen(false);
  }

  function isCommerceProjectIdea(idea: string) {
    const text = idea.toLocaleLowerCase("tr-TR");
    return ["e-ticaret", "ecommerce", "e-commerce", "shopify", "woocommerce", "marketplace", "mağaza", "magaza", "sepet", "checkout", "ürün sayfası", "urun sayfasi"].some((keyword) => text.includes(keyword));
  }

  function productionTypeFromAssistantCategory(category?: string) {
    const normalized = String(category ?? "").toLocaleLowerCase("tr-TR");
    const match = productionTypes.find((type) => type.label.toLocaleLowerCase("tr-TR") === normalized || type.id.toLocaleLowerCase("tr-TR") === normalized);
    return match?.id ?? "video";
  }

  function applyCategorySelection(type: string) {
    const label = productionTypes.find((item) => item.id === type)?.label ?? type;
    applyGeneralProductionPreset(type, input.trim() || label);
    setOptionsOpen(true);
  }

  function applyAssistantSuggestion(suggestion: AssistantSuggestion, idea: string, plan?: AssistantPlan) {
    const type = productionTypeFromAssistantCategory(plan?.production_type ?? suggestion.category);
    applyGeneralProductionPreset(type, suggestion.suggestedPrompt || idea);
    if (plan?.selected_style || suggestion.style) setSelectedStyle(plan?.selected_style ?? suggestion.style ?? "Corporate");
    if (plan?.selected_quality || suggestion.quality) setSelectedQuality(plan?.selected_quality ?? suggestion.quality ?? "1080p");
    if (plan?.selected_duration || suggestion.duration) setSelectedDuration(plan?.selected_duration ?? suggestion.duration ?? "30 sec");
    if (Array.isArray(plan?.selected_modules) && plan.selected_modules.length) setSelectedModules(plan.selected_modules);
    if (Array.isArray(plan?.selected_features) && plan.selected_features.length) setSelectedFeatures(plan.selected_features);
    if (Array.isArray(plan?.selected_platforms) && plan.selected_platforms.length) setSelectedPlatforms(plan.selected_platforms);
    setOptionsOpen(false);
  }

  function applyOrchestratorPlan(orchestrator: AssistantOrchestratorResponse, idea: string) {
    const firstJob = Array.isArray(orchestrator.jobs) ? orchestrator.jobs[0] : null;
    if (!firstJob) return;
    const type = productionTypeFromAssistantCategory(firstJob.type ?? "video");
    applyGeneralProductionPreset(type, firstJob.brief || idea);
    if (firstJob.selected_style) setSelectedStyle(firstJob.selected_style);
    if (firstJob.selected_quality) setSelectedQuality(firstJob.selected_quality);
    if (firstJob.selected_duration) setSelectedDuration(firstJob.selected_duration);
    if (Array.isArray(firstJob.selected_modules) && firstJob.selected_modules.length) setSelectedModules(firstJob.selected_modules);
    if (Array.isArray(firstJob.selected_features) && firstJob.selected_features.length) setSelectedFeatures(firstJob.selected_features);
    if (Array.isArray(firstJob.selected_platforms) && firstJob.selected_platforms.length) setSelectedPlatforms(firstJob.selected_platforms);
    setOptionsOpen(false);
  }

  function orchestratorStatusText(orchestrator: AssistantOrchestratorResponse, language: string) {
    const jobCount = Array.isArray(orchestrator.jobs) ? orchestrator.jobs.length : 0;
    const credits = typeof orchestrator.total_estimated_credits === "number" ? orchestrator.total_estimated_credits : null;
    const isGrowthService = orchestrator.intent === "growth_intelligence_service";
    if (language === "tr") {
      const jobText = isGrowthService ? "Growth Intelligence servis akışı hazır." : jobCount > 1 ? `${jobCount} parçalı üretim planı hazır.` : "Üretim planı hazır.";
      const creditText = credits && !isGrowthService ? ` Tahmini toplam: ${credits.toLocaleString("tr-TR")} kredi.` : "";
      const serviceText = isGrowthService ? " Bu normal kredi top-up değil; aktif hak/kredi uygunluğu olan kullanıcıya dashboard’da PDF/dosya raporu teslim edilir." : "";
      const nextText = orchestrator.next_user_action ? ` Sonraki adım: ${orchestrator.next_user_action}` : "";
      return `${jobText}${creditText}${serviceText}${nextText}`;
    }
    const jobText = isGrowthService ? "Growth Intelligence service flow is ready." : jobCount > 1 ? `${jobCount}-part production plan is ready.` : "Production plan is ready.";
    const creditText = credits && !isGrowthService ? ` Estimated total: ${credits.toLocaleString()} credits.` : "";
    const serviceText = isGrowthService ? " This is not a normal credit top-up; eligible users receive the finished dashboard PDF/file report after active entitlement or credit eligibility is confirmed." : "";
    const nextText = orchestrator.next_user_action ? ` Next: ${orchestrator.next_user_action}` : "";
    return `${jobText}${creditText}${serviceText}${nextText}`;
  }

  function applyGeneralProductionPreset(type: string, idea: string) {
    setQuickProviderTest(false);
    const commerceProject = type === "website" && isCommerceProjectIdea(idea);
    const growthIntelligenceProject = type === "document_pack" && /growth intelligence|rakip|competitor|pazar istihbarat|market intelligence|fiyat takibi|pricing changes|ad library|haftalık rapor|weekly report/i.test(idea);
    setSelectedProductionType(type);
    setSelectedQuality(growthIntelligenceProject ? "Monthly service plan" : type === "image" ? "1080p" : "1080p premium");
    setSelectedStyle(growthIntelligenceProject ? "Growth Intelligence service" : commerceProject ? "E-commerce Product" : type === "saas" ? "SaaS modern" : type === "mobile_app" ? "App demo" : type === "campaign" ? "Premium ad" : type === "documentary" ? "Documentary" : type === "drone_video" ? "Cinematic" : type === "live_sales_agent" ? "Friendly sales host" : type === "drama" ? "Short drama" : type === "stickman_animation" ? "Stickman animation" : type === "anime_short_film" ? "Anime cinematic" : "Corporate");
    setSelectedDuration(growthIntelligenceProject ? "Monthly monitoring" : ["website", "saas", "mobile_app", "admin_project", "image", "brand_kit", "document_pack"].includes(type) ? "Project based" : type === "documentary" ? "2 min" : type === "drone_video" ? "60 sec" : type === "live_sales_agent" ? "10h/month fair use" : type === "drama" ? "Scene 1-3 min" : "30 sec");
    setSelectedModules(growthIntelligenceProject ? ["Growth Intelligence brief", "Competitor monitoring", "Weekly executive report", "Campaign response actions"] : commerceProject ? ["Website", "E-commerce product pack", "Marketplace listing", "Admin panel"] : type === "website" ? ["Website", "Visual/image pack"] : type === "saas" ? ["SaaS screen", "Admin panel"] : type === "mobile_app" ? ["Mobile app", "Admin panel"] : type === "admin_project" ? ["Admin panel"] : type === "brand_kit" ? ["Brand kit"] : type === "document_pack" ? ["PDF/document"] : type === "image" ? ["Visual/image pack"] : type === "ai_agent" ? ["AI video", "Brand kit"] : type === "campaign" ? ["Shopify product link", "Amazon product link", "Trendyol product link", "Product ad video"] : type === "documentary" ? ["Documentary", "Topic research", "Narration outline", "Archival visual plan", "Voice-over"] : type === "drone_video" ? ["Drone-style aerial video", "AI map/location drone-style video", "Voice-over", "Background music direction"] : type === "live_sales_agent" ? ["AI live sales agent", "Product link selling", "Live chat reply agent", "Avatar host persona", "Voice selection", "User audio upload", "Visual/image pack"] : type === "drama" ? ["Drama / short series", "Script + scene plan", "Character breakdown", "AI video", "Voice-over"] : ["AI video"]);
    setSelectedFeatures(growthIntelligenceProject ? ["Public-signal monitoring", "Weekly executive PDF", "Alert channel plan", "Campaign response actions"] : commerceProject ? ["Production package", "Source file delivery", "Final ZIP", "README", "Revision right"] : type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? ["Production package", "Source file delivery", "Final ZIP", "README", "Revision right"] : type === "campaign" ? ["A/B hook", "Social media caption", "Hashtag set", "Shorts/Reels cut"] : type === "localization" ? ["Voice-over", "Subtitles", "Scene plan"] : type === "documentary" ? ["Script", "Scene plan", "Voice-over", "Subtitles", "Music", "Revision right"] : type === "drone_video" ? ["Scene plan", "Marked area notes", "Voice-over", "Subtitles", "Music", "Revision right"] : type === "live_sales_agent" ? ["Sales script", "Live FAQ", "Objection handling", "CTA/discount playbook", "Choose AI voice", "Photo/avatar input", "Subtitles", "Compliance review", "Revision right"] : type === "drama" ? ["Script", "Scene plan", "Character breakdown", "Dialogue", "Voice-over", "Subtitles", "Music", "Revision right"] : ["Revision right"]);
    setSelectedPlatforms(growthIntelligenceProject ? ["Growth Intelligence dashboard", "Email report", "Slack/email alerts"] : commerceProject ? ["Dashboard delivery", "ZIP source", "Shopify", "WooCommerce"] : type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? ["Dashboard delivery", "ZIP source"] : type === "campaign" ? ["Dashboard delivery", "TikTok", "Shopify", "Amazon", "Trendyol"] : type === "documentary" ? ["Dashboard delivery", "MP4 download", "YouTube Shorts", "ZIP source"] : type === "live_sales_agent" ? ["TikTok Live", "YouTube Live"] : type === "drama" ? ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"] : ["Dashboard delivery", "MP4 download"]);
    const profile = categoryOptionProfiles[type];
    const configuredQualityOptions = configuredProductionPackages.filter((item) => item.productionType === type).map((item) => item.name);
    if (profile && !commerceProject && !["website", "saas", "mobile_app", "admin_project", "brand_kit", "document_pack", "image", "campaign", "video"].includes(type)) {
      setSelectedQuality(configuredQualityOptions[0] ?? profile.quality[0] ?? "1080p");
      setSelectedStyle(profile.style[0] ?? "Corporate");
      setSelectedDuration(profile.duration[0] ?? "Project based");
      setSelectedModules(profile.modules.slice(0, Math.min(4, profile.modules.length)));
      setSelectedFeatures(profile.features.slice(0, Math.min(5, profile.features.length)));
      setSelectedPlatforms(profile.platforms.slice(0, Math.min(3, profile.platforms.length)));
    }

    setOptionsOpen(false);
  }

  useEffect(() => {
    if (providerTestPreset) {
      applyQuickProviderTestPreset();
      setStartModalOpen(true);
      return;
    }
    if (initialCategory) {
      const type = productionTypeFromAssistantCategory(initialCategory);
      const ideaForPreset = initialIdea || initialCategory;
      applyGeneralProductionPreset(type, ideaForPreset);
      if (initialMode === "commerce") {
        setSelectedModules(["Shopify product link", "Amazon product link", "Trendyol product link", "Product ad video", "Marketplace listing"]);
        setSelectedFeatures(["A/B hook", "Social media caption", "Hashtag set", "Shorts/Reels cut"]);
        setSelectedPlatforms(["Dashboard delivery", "TikTok", "Instagram Reels", "Shopify", "Amazon", "Trendyol"]);
      }
      if (initialMode === "project") {
        setSelectedPlatforms(["Dashboard delivery", "ZIP source"]);
      }
      if (initialMode === "media" && !categoryOptionProfiles[type]) {
        setSelectedModules(["AI video", "Visual/image pack"]);
        setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
      }
      setOptionsOpen(true);
      return;
    }
    const idea = initialIdea.toLocaleLowerCase("tr-TR");
    if (idea.includes("kesitleme") || idea.includes("uzun film") || idea.includes("uzun dizi")) {
      applyLongFilmClippingPreset();
      return;
    }
    if (idea.includes("ai ad performance score") || idea.includes("ad score checker") || idea.includes("ad_score_checker") || idea.includes("reklam skoru")) {
      applyGeneralProductionPreset("ad_score_checker", initialIdea || "AI Ad Performance Score Checker");
      return;
    }
    if (idea.includes("ai virtual model") || idea.includes("virtual model studio") || idea.includes("virtual_model_studio") || idea.includes("sanal model")) {
      applyGeneralProductionPreset("virtual_model_studio", initialIdea || "AI Virtual Model Studio");
      return;
    }
    if (idea.includes("ai cultural localization") || idea.includes("cultural localization") || idea.includes("cultural_localization") || idea.includes("kültürel lokalizasyon") || idea.includes("kulturel lokalizasyon")) {
      applyGeneralProductionPreset("cultural_localization", initialIdea || "AI Cultural Localization");
      return;
    }
    if (idea.includes("ai campaign calendar") || idea.includes("campaign calendar") || idea.includes("campaign_calendar") || idea.includes("kampanya takvimi")) {
      applyGeneralProductionPreset("campaign_calendar", initialIdea || "AI Campaign Calendar");
      return;
    }
    if (idea.includes("crelavo academy") || idea.includes("crelavo_academy")) {
      applyGeneralProductionPreset("crelavo_academy", initialIdea || "Crelavo Academy");
      return;
    }
    if (idea.includes("community showcase") || idea.includes("community_showcase")) {
      applyGeneralProductionPreset("community_showcase", initialIdea || "Community Showcase");
      return;
    }
    if (idea.includes("ai live sales agent") || idea.includes("live sales") || idea.includes("live commerce") || idea.includes("canlı satış") || idea.includes("canli satis") || idea.includes("canlı yayın satış") || idea.includes("canli yayin satis") || idea.includes("24/7 sales") || idea.includes("tiktok shop") || idea.includes("autonomous brand agent") || idea.includes("canlı yayın marka temsilciliği") || idea.includes("canli yayin marka temsilciligi")) {
      applyGeneralProductionPreset("live_sales_agent", initialIdea || "AI live sales agent");
      return;
    }
    if (idea.includes("lyric")) {
      applyMusicVideoPreset("lyric");
      return;
    }
    if (idea.includes("visualizer")) {
      applyMusicVideoPreset("visualizer");
      return;
    }
    if (idea.includes("müzik") || idea.includes("music") || idea.includes("mv")) {
      applyMusicVideoPreset("mv");
      return;
    }
    if (idea.includes("anime") || idea.includes("manga")) {
      applyGeneralProductionPreset("anime_short_film", initialIdea || "Anime short film");
      return;
    }
    if (idea.includes("hayvan") || idea.includes("animal") || idea.includes("pet") || idea.includes("kedi") || idea.includes("köpek") || idea.includes("kopek")) {
      applyGeneralProductionPreset("animal_video", initialIdea || "Animal video");
      return;
    }
    if (idea.includes("doğa") || idea.includes("doga") || idea.includes("nature") || idea.includes("wildlife") || idea.includes("landscape")) {
      applyGeneralProductionPreset("nature_video", initialIdea || "Nature video");
      return;
    }
    if (idea.includes("gezegen") || idea.includes("planet") || idea.includes("space") || idea.includes("uzay") || idea.includes("galaxy") || idea.includes("astronomy")) {
      applyGeneralProductionPreset("planet_space_video", initialIdea || "Planet / space video");
      return;
    }
    if (idea.includes("drone") || idea.includes("uydu") || idea.includes("satellite") || idea.includes("harita") || idea.includes("map") || idea.includes("aerial")) {
      applyGeneralProductionPreset("drone_video", initialIdea || "Drone / satellite video");
      return;
    }
    if (idea.includes("documentary") || idea.includes("belgesel")) {
      applyGeneralProductionPreset("documentary", initialIdea || "Documentary");
      return;
    }
    if (idea.includes("image to video")) {
      applyVideoToolPreset("image");
      return;
    }
    if (idea.includes("text to video") || idea.includes("seedance")) {
      applyVideoToolPreset("text");
      return;
    }
    if (idea.includes("ugc")) {
      applyVideoToolPreset("ugc");
      return;
    }
    if (idea.includes("voice-over") || idea.includes("voice over")) {
      applyVideoToolPreset("voice");
      return;
    }
    if (idea.includes("drama") || idea.includes("kısa dizi") || idea.includes("kisa dizi") || idea.includes("mini dizi") || idea.includes("short series") || idea.includes("viral kısa") || idea.includes("viral kisa") || idea.includes("viral short")) {
      applyGeneralProductionPreset("drama", initialIdea || "Drama / short series");
      return;
    }
    if (idea.includes("dizi") || idea.includes("film") || idea.includes("fragman")) {
      applySeriesFilmPreset();
      return;
    }
    if ((idea.includes("e-ticaret") || idea.includes("ecommerce") || idea.includes("e-commerce") || idea.includes("storefront") || idea.includes("checkout") || idea.includes("sepet") || idea.includes("mağaza sitesi") || idea.includes("magaza sitesi") || idea.includes("ürün sayfası") || idea.includes("urun sayfasi")) && !idea.includes("reklam")) {
      applyGeneralProductionPreset("website", initialIdea || "E-ticaret website");
      return;
    }
    if (idea.includes("campaign") || idea.includes("kampanya") || idea.includes("reklam") || idea.includes("roas")) {
      applyGeneralProductionPreset("campaign", initialIdea || "Kampanya");
      return;
    }
    if (idea.includes("çöp") || idea.includes("cop adam") || idea.includes("stickman_animation")) {
      applyGeneralProductionPreset("stickman_animation", initialIdea || "Stickman animation");
      return;
    }
    if (idea.includes("lokalizasyon") || idea.includes("localization") || idea.includes("pazar uyarlama")) {
      applyGeneralProductionPreset("localization", initialIdea || "Global lokalizasyon");
      return;
    }
    if (idea.includes("brand")) {
      applyGeneralProductionPreset("brand_kit", initialIdea || "Brand kit");
      return;
    }
    if (idea.includes("document") || idea.includes("document_pack") || idea.includes("pitch") || idea.includes("pdf")) {
      applyGeneralProductionPreset("document_pack", initialIdea || "Document pack");
      return;
    }
    if (idea.includes("website") || idea.includes("web sitesi") || idea.includes("landing") || idea.includes("site")) {
      applyGeneralProductionPreset("website", initialIdea || "Website");
      return;
    }
    if (idea.includes("saas")) {
      applyGeneralProductionPreset("saas", initialIdea || "SaaS");
      return;
    }
    if (idea.includes("mobile") || idea.includes("mobil") || idea.includes("mobile_app")) {
      applyGeneralProductionPreset("mobile_app", initialIdea || "Mobile App");
      return;
    }
    if (idea.includes("admin panel") || idea.includes("admin_project")) {
      applyGeneralProductionPreset("admin_project", initialIdea || "Admin Panel");
      return;
    }
    if (idea === "image" || idea.includes("görsel") || idea.includes("image pack")) {
      applyGeneralProductionPreset("image", initialIdea || "Visual Image Pack");
      return;
    }
    if (idea.includes("ai agents") || idea.includes("ai agent") || idea.includes("ai_agent")) {
      applyGeneralProductionPreset("ai_agent", initialIdea || "AI Agents");
    }
  }, [providerTestPreset, initialIdea, initialCategory, initialMode]);

  function selectedOptionSummary() {
    const materialNames = materials.filter((material) => selectedMaterials.includes(material.id)).map((material) => material.title);
    const uploadNames = uploadedMaterials.map((material) => `${material.title} (${material.kind})`);
    const productionLabel = productionTypes.find((item) => item.id === selectedProductionType)?.label ?? selectedProductionType;
    const wizardLines = dynamicWizard.open
      ? [
        `Wizard group: ${wizardCategoryGroups.find((group) => group.id === dynamicWizard.groupId)?.title ?? "Not selected"}`,
        `Wizard category: ${dynamicWizard.categoryId ? wizardCategoryLabels[dynamicWizard.categoryId] : dynamicWizardLabels[dynamicWizard.type]}`,
        `Wizard type: ${dynamicWizardLabels[dynamicWizard.type]}`,
        `Wizard subject: ${dynamicWizard.subject || "Not specified"}`,
        ...Object.entries(dynamicWizard.answers).map(([key, value]) => `Wizard ${key}: ${value.join(", ")}`)
      ]
      : [];
    return [
      `Production category: ${productionLabel}`,
      ...wizardLines,
      `Quality/format: ${selectedQuality}`,
      `Style/type: ${selectedStyle}`,
      `Duration: ${selectedDuration}`,
      `Production modules: ${selectedModules.length ? selectedModules.join(", ") : "None"}`,
      `Extra features: ${selectedFeatures.length ? selectedFeatures.join(", ") : "None"}`,
      `Delivery/platform: ${selectedPlatforms.length ? selectedPlatforms.join(", ") : "Dashboard delivery"}`,
      ...(selectedProductionType === "drone_video" ? [
        `Drone location/address: ${droneLocation.trim() || "Not specified"}`,
        `Drone route/path: ${droneRoute.trim() || "Not specified"}`,
        `Marked map/satellite area: ${droneMarkedArea.trim() || "Not specified"}`,
        `Drone shot type: ${droneShotType}`,
        `Drone map style: ${droneMapStyle}`,
        `Drone camera movement: ${droneCameraMovement}`,
        `Drone visual style: ${droneVisualStyle}`,
        `Drone narration language: ${droneNarrationLanguage}`,
        `Drone subtitle option: ${droneSubtitleOption}`,
        `Drone music style: ${droneMusicStyle}`
      ] : []),
      ...(selectedProductionType === "live_sales_agent" ? [
        `Live sales product link/details: ${liveSalesProductLink.trim() || "Not specified"}`,
        `Live sales brand name: ${liveSalesBrandName.trim() || "Not specified"}`,
        `Live sales product category: ${liveSalesProductCategory.trim() || "Not specified"}`,
        `Live sales target market/language: ${liveSalesTargetMarket}`,
        `Live sales target platform: ${liveSalesPlatform}`,
        `Live sales persona: ${liveSalesPersona}`,
        `Live sales avatar source: ${liveSalesAvatarSource}`,
        `Live sales avatar style: ${liveSalesAvatarStyle}`,
        `Live sales voice source: ${liveSalesVoiceSource}`,
        `Live sales voice/language: ${liveSalesVoiceLanguage}`,
        `Live sales voice tone: ${liveSalesVoiceTone}`,
        `Live sales background: ${liveSalesBackground}`,
        `Live sales visual style: ${liveSalesVisualStyle}`,
        `Live sales subtitle option: ${liveSalesSubtitleOption}`,
        `Live sales interaction mode: ${liveSalesInteractionMode}`,
        `Live sales stream goal: ${liveSalesStreamGoal}`,
        `Live sales human fallback: ${liveSalesHumanFallback}`,
        `Live sales provider readiness: ${liveSalesProviderReadiness}`,
        `Live sales CTA/discount: ${liveSalesCtaOffer.trim() || "Not specified"}`,
        `Live sales compliance notes: ${liveSalesComplianceNotes.trim() || "AI disclosure + human fallback policy"}`,
        "Live sales credit policy: No included credits; subscription includes fair-use live hours and extra live-operation hours are pay-as-you-go after cost analysis."
      ] : []),
      ...(selectedProductionType === "drama" ? [
        `Drama format: ${dramaFormat}`,
        `Drama genre/tone: ${dramaGenre}`,
        `Drama structure: ${dramaStructure}`,
        `Drama characters: ${dramaCharacters}`,
        `Drama hook type: ${dramaHook}`,
        `Drama dialogue/voice: ${dramaVoiceDirection}`
      ] : []),
      `Crelavo material library: ${materialNames.length ? materialNames.join(", ") : "Not selected"}`,
      `Uploaded user materials: ${uploadNames.length ? uploadNames.join(", ") : "Not uploaded"}`
    ].join("\n");
  }

  function productionTypeFromSelection() {
    const moduleText = selectedModules.join(" ").toLowerCase();
    const styleText = selectedStyle.toLowerCase();
    const text = `${moduleText} ${styleText}`;
    if (styleText.includes("çöp adam")) return "stickman_animation";
    if (selectedProductionType === "drama" || text.includes("drama / short series") || text.includes("short drama") || text.includes("viral short film")) return "drama";
    if (selectedProductionType === "drone_video" || text.includes("drone-style") || text.includes("satellite") || text.includes("map/location")) return "drone_video";
    if (selectedProductionType === "live_sales_agent" || text.includes("ai live sales agent") || text.includes("live sales") || text.includes("live commerce") || text.includes("canlı satış") || text.includes("canli satis") || text.includes("canlı yayın satış") || text.includes("24/7 sales") || text.includes("tiktok shop") || text.includes("autonomous brand agent")) return "live_sales_agent";
    if (selectedProductionType) return selectedProductionType;
    if (text.includes("dizi") || text.includes("film") || text.includes("fragman") || text.includes("senaryo")) return "video";
    if (text.includes("müzik")) return "music_video";
    if (text.includes("documentary") || text.includes("belgesel") || text.includes("topic research") || text.includes("interview map") || text.includes("archival visual")) return "documentary";
    if (text.includes("web")) return "website";
    if (text.includes("saas")) return "saas";
    if (text.includes("mobil")) return "mobile_app";
    if (text.includes("admin")) return "admin_project";
    if (text.includes("brand")) return "brand_kit";
    if (text.includes("pdf") || text.includes("doküman")) return "document_pack";
    if (text.includes("görsel") || text.includes("image")) return "image";
    if (text.includes("web sitesi") || text.includes("e-ticaret ürün paketi") || text.includes("mağaza banner") || text.includes("marketplace listeleme")) return "website";
    if (text.includes("e-ticaret") || text.includes("ürün") || text.includes("marketplace") || text.includes("mağaza") || text.includes("seo") || text.includes("kampanya") || text.includes("toplu ürün")) return "campaign";
    return "video";
  }

  async function startProduction() {
    const clean = productionBrief.trim() || input.trim() || "Assistant workspace production";
    const productionType = productionTypeFromSelection();
    const selection = { input: productionBrief || input, selectedStyle, selectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, selectedMaterials, uploadedMaterials, quickProviderTest };
    const packageId = packageIdFromSelection(productionType, selection, configuredProductionPackages);
    if (productionCreditInsufficient) {
      setStartState("error");
      setStartError(`Insufficient credits for this production. Available: ${(availableProductionCredits ?? 0).toLocaleString()} credits. Estimated: ${costEstimate.totalCredits.toLocaleString()} credits. Reduce duration, quality, materials or add credits.`);
      setCreditSplashOpen(true);
      return;
    }
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      window.location.href = auth.redirect || "/auth/login";
      return;
    }

    const growthServiceSelected = productionType === "document_pack" && (lastOrchestratorPlan?.intent === "growth_intelligence_service" || selectedModules.some((item) => /growth intelligence|competitor monitoring|weekly executive report/i.test(item)));
    if (growthServiceSelected) {
      window.location.href = "/dashboard/growth-intelligence";
      return;
    }

    setStartState("loading");
    setStartError("");

    const orchestratorJob = Array.isArray(lastOrchestratorPlan?.jobs) ? lastOrchestratorPlan.jobs[0] : null;
    const orchestratorPayload = orchestratorJob?.production_payload && typeof orchestratorJob.production_payload === "object" ? orchestratorJob.production_payload : null;
    const fallbackPayload = buildAssistantProductionPayload({
      ...selection,
      userId: auth.user.id,
      userEmail: auth.user.email ?? "",
      productionType,
      packageId,
      prompt: clean,
      optionSummary: selectedOptionSummary()
    });
    const productionPayload = orchestratorPayload ? {
      ...fallbackPayload,
      ...orchestratorPayload,
      user_id: auth.user.id,
      user_email: auth.user.email ?? "",
      production_type: String(orchestratorPayload.production_type ?? fallbackPayload.production_type),
      package_id: String(orchestratorPayload.package_id ?? fallbackPayload.package_id),
      title: String(orchestratorPayload.title ?? fallbackPayload.title),
      prompt: String(orchestratorPayload.prompt ?? fallbackPayload.prompt),
      legal_acceptance: fallbackPayload.legal_acceptance,
      uploaded_materials: fallbackPayload.uploaded_materials,
      selected_material_ids: fallbackPayload.selected_material_ids,
      material_links: fallbackPayload.material_links,
      song_audio_link: fallbackPayload.song_audio_link,
      music_reference_links: fallbackPayload.music_reference_links,
      voiceover_reference_link: fallbackPayload.voiceover_reference_link,
      orchestrator_plan: lastOrchestratorPlan,
      orchestrator_job_id: orchestratorJob?.id ?? null
    } : fallbackPayload;

    const response = await fetch("/api/productions", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify(productionPayload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStartState("error");
      setStartError(data.error ?? "Production could not be started.");
      if (response.status === 402 || data.redirect === "/dashboard/credits" || /not enough credits|credits required/i.test(String(data.error ?? ""))) {
        setAssistantCreditState((current) => ({ ...current, requiredCredits: Number(data.required ?? data.requiredCredits ?? costEstimate.totalCredits) || costEstimate.totalCredits, redirect: "/dashboard/credits" }));
        setCreditSplashOpen(true);
      }
      return;
    }

    const productionId = data.production?.id;
    if (productionId) {
      const automationResponse = await fetch("/api/automation/start", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({ production_id: productionId, user_id: auth.user.id })
      }).catch(() => null);
      if (automationResponse && !automationResponse.ok) {
        const automationError = await automationResponse.json().catch(() => ({}));
        setStartState("error");
        setStartError(automationError.error ?? "The production record was created, but automation could not be started. You can check it again from the live workspace.");
        setStartedProduction({
          id: productionId,
          detailUrl: `/dashboard/productions/${productionId}`,
          status: "automation_warning",
          message: "Production record was created, but automation needs attention.",
          providerStatus: "automation_error",
          nextAction: "Open the production detail page and review the automation error."
        });
        setStartModalOpen(false);
        return;
      }
      const automationData = automationResponse ? await automationResponse.json().catch(() => ({})) : {};
      const providerReadiness = automationData.provider_readiness && typeof automationData.provider_readiness === "object" ? automationData.provider_readiness as Record<string, any> : null;
      const missingProviderKeys = Array.isArray(providerReadiness?.blocking) ? providerReadiness.blocking.map((item: Record<string, unknown>) => String(item.key ?? item.label ?? "provider_config")) : [];
      const waitingProviderConfig = Boolean(automationData.waiting_provider_config);
      const alreadyRunning = Boolean(automationData.already_running);
      setStartState("idle");
      setStartModalOpen(false);
      setStartedProduction({
        id: productionId,
        detailUrl: `/dashboard/productions/${productionId}`,
        status: waitingProviderConfig ? "waiting_provider_config" : alreadyRunning ? "already_running" : "automation_started",
        message: waitingProviderConfig
          ? "Production record was created, but real provider execution is waiting for API/provider configuration."
          : alreadyRunning
            ? "Production record exists and an active provider job is already running."
            : "Production record created and automation started. You can stay here or open the detailed production workspace.",
        providerStatus: waitingProviderConfig ? "waiting_provider_config" : alreadyRunning ? "already_running" : "provider_started",
        missingProviderKeys,
        nextAction: waitingProviderConfig
          ? "Connect the missing provider/API keys or continue with manual/demo delivery from the production detail page."
          : "Open production detail to follow live status, preview and delivery."
      });
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }

  async function sendCommand(text?: string, mode: "quick" | "voice" = "quick", source: "chat" | "production" = "chat") {
    const clean = (text ?? (source === "production" ? input : chatInput)).trim();
    if (!clean || isLoading) return;

    const safety = validateProductionSafety([clean]);
    if (!safety.ok) {
      setMessages([...messages, { role: "user", content: clean }, { role: "assistant", content: blockedProductionMessage }]);
      setStatus("The action was stopped by the safety policy.");
      return;
    }

const recentContext = normalizeTurkishQuery(messages.slice(-8).map((item) => item.content).join(" "));
const followUpProduction = isShortProductionFollowUp(clean, recentContext) || (dynamicWizard.open && isShortProductionFollowUp(clean, `${recentContext} video proje uretim`));
const intent = followUpProduction ? "production_request" : detectWorkspaceIntent(clean);
const isStartConfirmation = intent === "start_confirmation";
const conversationalOnly = intent === "greeting" || intent === "help" || intent === "consultation" || isStartConfirmation;
const conversationalReplyKind = intent === "greeting" ? "greeting" : intent === "help" ? "help" : "consultation";
if (intent === "production_request" || followUpProduction) {
  setProductionBrief((current) => current && followUpProduction ? `${current}\n${clean}` : clean);
}
const optionSummary = selectedOptionSummary();
const enrichedClean = conversationalOnly ? clean : `${followUpProduction ? "Production follow-up detail" : "Production request"}: ${clean}\n\nRecent context:\n${messages.slice(-6).map((item) => `${item.role}: ${item.content}`).join("\n")}\n\nProduction options:\n${optionSummary}`;

    const wantsNoMaterial = /istemiyorum|gerek yok|olmasın|hayır|devam et/i.test(clean);
    const hasProductionContext = dynamicWizard.open || Boolean(productionBrief.trim()) || /\b(video|reklam|ayakkabi|ayakkabı|urun|ürün|tiktok|shorts|saas|site|website|app|uygulama|admin panel|eticaret|e-ticaret|production request|production follow-up detail)\b/.test(recentContext);
    if (isStartConfirmation && hasProductionContext) {
      const existingBrief = productionBrief.trim() || messages.slice(-8).map((item) => item.content).join("\n");
      if (!dynamicWizard.open && existingBrief.trim()) openDynamicWizardFromMessage(existingBrief);
      const startReply = activeLanguage === "tr"
        ? "Tamam. Chat cevabı üretmiyorum; gerçek üretim/kredi kontrol ekranını açıyorum. Kredi bu onay adımında kontrol edilir, üretim kaydı da buradan oluşur."
        : "Understood. I am not pretending the production has started in chat; I am opening the real production/credit confirmation step now.";
      setMessages([...messages, { role: "user", content: clean }, { role: "assistant", content: startReply }]);
      if (source === "chat") setChatInput("");
      setStatus(activeLanguage === "tr" ? "Gerçek üretim/kredi kontrol adımı açılıyor." : "Opening the real production/credit check step.");
      requestDynamicWizardCredits();
      return;
    }
    if (!conversationalOnly && !followUpProduction) {
      openDynamicWizardFromMessage(clean);
    }
    if (followUpProduction) {
      const followUpDuration = durationFromFollowUp(clean);
      const followUpNormalized = normalizeTurkishQuery(clean);
      if (followUpDuration) setSelectedDuration(followUpDuration);
      if (/(sinematik|cinematic|film gibi|premium)/.test(followUpNormalized)) {
        setSelectedStyle("Cinematic");
        setSelectedQuality("Cinematic");
      }
      if (/(ultra|en iyi|maksimum kalite|maximum quality)/.test(followUpNormalized)) setSelectedQuality("Ultra");
      if (/(pro|profesyonel|professional)/.test(followUpNormalized)) setSelectedQuality("Pro");
      if (/(ingilizce|english|seslendirme|voiceover|voice over|sesli anlatim|sesli anlatım)/.test(followUpNormalized)) setSelectedFeatures((current) => current.includes("Voice-over") ? current : [...current, "Voice-over"]);
      if (/(altyazi|subtitle|subtitles)/.test(followUpNormalized)) setSelectedFeatures((current) => current.includes("Subtitles") ? current : [...current, "Subtitles"]);
      if (/(fon muzik|fon müzik|muzik|müzik|music|background music)/.test(followUpNormalized)) setSelectedFeatures((current) => current.includes("Music") ? current : [...current, "Music"]);
      if (/(kapak|cover|thumbnail|hook|kanca)/.test(followUpNormalized)) setSelectedFeatures((current) => current.includes("Cover visual") ? current : [...current, "Cover visual"]);
      if (/(yapay|ai olsun|kendi goruntumu istemiyorum|kendi cekimim yok)/.test(followUpNormalized)) setSelectedModules((current) => Array.from(new Set([...current, "AI video", "Visual/image pack"])));
      if (!followUpDuration && source === "production") {
        setInput((current) => current ? `${current}\n${clean}` : clean);
        setDynamicWizard((current) => current.open ? { ...current, subject: current.subject ? `${current.subject} · ${clean}` : clean } : current);
      }
    }
    const assistantVisibleReply = conversationalOnly
      ? publicConversationalReply(clean, activeLanguage, messages.length)
      : followUpProduction
        ? productionFollowUpReply(clean, activeLanguage)
        : googleStyleProductionReply(clean, activeLanguage);

    const nextMessages: Message[] = [...messages, { role: "user", content: clean }];
    const nextVisibleMessages: Message[] = conversationalOnly ? nextMessages : [...nextMessages, { role: "assistant", content: assistantVisibleReply }];
    const assistantPayloadMessages: Message[] = [...messages, { role: "user", content: enrichedClean }];
    setMessages(nextVisibleMessages);
    if (source === "chat") setChatInput("");
    setIsLoading(conversationalOnly);
    setStatus(wantsNoMaterial ? "Extra material was skipped; the assistant is continuing." : conversationalOnly ? (responseLanguage(clean, activeLanguage) === "tr" ? "Asistan cevap hazırlıyor." : "Assistant is preparing an answer.") : (responseLanguage(clean, activeLanguage) === "tr" ? "Asistan cevabı hazırladı." : "Assistant reply prepared."));
    if (!conversationalOnly) setActiveStep((current) => Math.min(current + 1, defaultSteps.length - 1));

    try {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) {
        if (!conversationalOnly) {
          const localSuggestion: AssistantSuggestion = { assistantReply: assistantVisibleReply };
          applyAssistantSuggestion(localSuggestion, clean);
          setLastRoute(auth.redirect || "/auth/login");
        }
        if (conversationalOnly) {
          setMessages(nextMessages.concat({ role: "assistant", content: safeConversationalFallbackReply(clean, activeLanguage, messages.length, recentContext) }));
        }
        setStatus(conversationalOnly
          ? (activeLanguage === "tr" ? "Uzak chat alınamadı; güvenli yerel cevap gösterildi." : "Remote chat was unavailable; a safe local reply was shown.")
          : (activeLanguage === "tr" ? "Taslak hazır. Üretimi başlatma aşamasında giriş kontrol edilir." : "Draft ready. Login is checked only when starting production."));
        return;
      }

      if (conversationalOnly) {
        const response = await fetch("/api/assistant-chat", {
          method: "POST",
          headers: authHeaders(auth.accessToken),
          body: JSON.stringify({
            user_id: auth.user.id,
            user_email: auth.user.email ?? "",
            message: clean,
            messages: nextMessages,
            conversation_id: assistantConversationId,
            local_reply: conversationalOnly ? "" : assistantVisibleReply,
            language: activeLanguage,
            mode
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (data.conversation_id) setAssistantConversationId(String(data.conversation_id));
          const nextCreditState: AssistantCreditState = {
            ...emptyAssistantCreditState,
            requiredCredits: typeof data.requiredCredits === "number" ? data.requiredCredits : null,
            assistantAvailable: typeof data.assistantAvailable === "number" ? data.assistantAvailable : null,
            productionAvailable: typeof data.available === "number" ? data.available : null,
            redirect: typeof data.redirect === "string" ? data.redirect : null
          };
          setAssistantCreditState(nextCreditState);
          if (data.redirect) {
            setLastRoute(data.redirect);
            setCreditSplashOpen(true);
            const creditText = typeof data.requiredCredits === "number" ? ` (${formatCredits(data.requiredCredits)} kredi gerekli)` : "";
            setMessages(nextMessages.concat({ role: "assistant", content: activeLanguage === "tr" ? `Kredin yetersiz${creditText}.\nDevam etmek için kredi yükleyip buraya dönebilirsin.` : `Not enough credits${creditText}.\nAdd credits, then come back here to continue.` }));
            setStatus(activeLanguage === "tr" ? "Kredi gerekiyor; mesaj durduruldu." : "Credits required; message stopped.");
            return;
          }
          setMessages(nextMessages.concat({ role: "assistant", content: safeConversationalFallbackReply(clean, activeLanguage, messages.length, recentContext) }));
          setStatus(activeLanguage === "tr" ? "Uzak chat cevabı alınamadı; güvenli yerel cevap gösterildi." : "Remote chat was unavailable; a safe local reply was shown.");
          return;
        }
        if (data.conversation_id) setAssistantConversationId(String(data.conversation_id));
        const reply = String(data.reply ?? "").trim();
        if (reply) {
          setMessages(nextMessages.concat({ role: "assistant", content: reply }));
        }
        const nextCreditState: AssistantCreditState = {
          ...emptyAssistantCreditState,
          chargedCredits: typeof data.chargedCredits === "number" ? data.chargedCredits : null,
          chargeSource: data.chargeSource === "assistant_trial" || data.chargeSource === "production" ? data.chargeSource : null,
          assistantBalance: typeof data.assistantBalance === "number" ? data.assistantBalance : null,
          productionBalance: typeof data.balance === "number" ? data.balance : null,
          productionAvailable: typeof data.available === "number" ? data.available : null
        };
        setAssistantCreditState(nextCreditState);
        if (typeof data.available === "number") {
          setProductionCreditAvailable(data.available);
          window.dispatchEvent(new CustomEvent("clipora:credits-updated", { detail: { available: data.available, balance: data.balance, reserved: data.reserved ?? 0 } }));
        }
        setStatus(activeLanguage === "tr" ? "Asistan cevapladı." : "Assistant replied.");
        return;
      }


      const response = await fetch("/api/assistant/plan", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({
          user_id: auth.user.id,
          user_email: auth.user.email ?? "",
          idea: clean,
          messages: assistantPayloadMessages,
          mode
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const nextCreditState: AssistantCreditState = {
          ...emptyAssistantCreditState,
          requiredCredits: typeof data.requiredCredits === "number" ? data.requiredCredits : null,
          assistantAvailable: typeof data.assistantAvailable === "number" ? data.assistantAvailable : null,
          productionAvailable: typeof data.available === "number" ? data.available : null,
          redirect: typeof data.redirect === "string" ? data.redirect : null
        };
        setAssistantCreditState(nextCreditState);
        setStatus(data.redirect ? (activeLanguage === "tr" ? "Kredi gerekiyor; chat cevabı korunuyor." : "Credits required; chat reply preserved.") : (activeLanguage === "tr" ? "Taslak yerel olarak hazırlandı." : "Draft prepared locally."));
        if (data.redirect) {
          setLastRoute(data.redirect);
          setCreditSplashOpen(true);
        }
        return;
      }

      const suggestion = (data.suggestion ?? {}) as AssistantSuggestion;
      const plan = (data.plan ?? {}) as AssistantPlan;
      let orchestratorPlan: AssistantOrchestratorResponse | null = null;
      if (!conversationalOnly) {
        applyAssistantSuggestion(suggestion, clean, plan);
        try {
          const orchestratorResponse = await fetch("/api/assistant/orchestrate", {
            method: "POST",
            headers: authHeaders(auth.accessToken),
            body: JSON.stringify({
              user_id: auth.user.id,
              user_email: auth.user.email ?? "",
              message: clean,
              messages: assistantPayloadMessages,
              mode
            })
          });
          const orchestratorData = await orchestratorResponse.json().catch(() => ({}));
          if (orchestratorResponse.ok) {
            orchestratorPlan = orchestratorData as AssistantOrchestratorResponse;
            setLastOrchestratorPlan(orchestratorPlan);
            applyOrchestratorPlan(orchestratorPlan, clean);
          }
        } catch {
          orchestratorPlan = null;
        }
      }
      const nextCreditState: AssistantCreditState = {
        ...emptyAssistantCreditState,
        chargedCredits: typeof data.chargedCredits === "number" ? data.chargedCredits : null,
        chargeSource: data.chargeSource === "assistant_trial" || data.chargeSource === "production" ? data.chargeSource : null,
        assistantBalance: typeof data.assistantBalance === "number" ? data.assistantBalance : null,
        productionBalance: typeof data.balance === "number" ? data.balance : null,
        productionAvailable: typeof data.available === "number" ? data.available : null
      };
      setAssistantCreditState(nextCreditState);
      if (typeof data.available === "number") {
        setProductionCreditAvailable(data.available);
        window.dispatchEvent(new CustomEvent("clipora:credits-updated", { detail: { available: data.available, balance: data.balance, reserved: data.reserved ?? 0 } }));
      }
      setLastRoute(suggestion.route || "/dashboard/assistant-workspace");
      const missingFields = Array.isArray(orchestratorPlan?.missing_fields) && orchestratorPlan.missing_fields.length
        ? orchestratorPlan.missing_fields
        : Array.isArray(plan.missing_fields) ? plan.missing_fields : [];
      setStatus(conversationalOnly
        ? (activeLanguage === "tr"
          ? `Asistan mesajı yanıtladı. ${formatCredits(nextCreditState.chargedCredits)} kredi harcandı.`
          : `Assistant replied. ${formatCredits(nextCreditState.chargedCredits)} credits spent.`)
        : orchestratorPlan
          ? orchestratorStatusText(orchestratorPlan, isLikelyTurkish(clean, activeLanguage) ? "tr" : "en")
          : missingFields.length
            ? (isLikelyTurkish(clean, activeLanguage)
              ? `Taslak hazır. Eksik bilgi: ${missingFields.join(", ")}.`
              : `Draft ready. Missing info: ${missingFields.join(", ")}.`)
        : (isLikelyTurkish(clean, activeLanguage)
          ? "Taslak hazır. Seçenekleri aşağıda güncelledim."
          : "Draft ready. I updated the options below."));
      if (!conversationalOnly) setActiveStep((current) => Math.min(current + 1, defaultSteps.length - 1));
    } catch {
      if (conversationalOnly) {
        setMessages(nextMessages.concat({ role: "assistant", content: safeConversationalFallbackReply(clean, activeLanguage, messages.length, recentContext) }));
      }
      setStatus(conversationalOnly
        ? (activeLanguage === "tr" ? "Bağlantı cevabı alınamadı; güvenli yerel cevap gösterildi." : "Remote reply was unavailable; a safe local reply was shown.")
        : (activeLanguage === "tr" ? "Taslak yerel olarak hazırlandı; bağlantı cevabı alınamadı." : "Draft prepared locally; remote reply was unavailable."));
    } finally {
      setIsLoading(false);
    }
  }

function focusTextInputWithVoiceHint(reason: "unsupported" | "permission" | "error" | "empty") {
  setVoiceListening(false);
  inputRef.current?.focus();
  const message = activeLanguage === "tr"
    ? reason === "unsupported"
      ? "Bu tarayıcı sesli komutu desteklemiyor. Chrome veya Edge ile deneyin."
      : reason === "permission"
        ? "Mikrofon izni verilmedi. Tarayıcı adres çubuğundan mikrofon iznini açın."
        : reason === "empty"
          ? "Ses algılanmadı; tekrar basıp konuşabilirsiniz."
          : "Mikrofon başlatılamadı. Tarayıcı mikrofon iznini kontrol edin."
    : reason === "unsupported"
      ? "This browser does not support voice input. Try Chrome or Edge."
      : reason === "permission"
        ? "Microphone permission was not granted. Allow microphone access from the browser address bar."
        : reason === "empty"
          ? "No speech was detected; press again and speak."
          : "Microphone could not start. Check browser microphone permission.";
  setStatus(message);
}

async function requestMicrophonePermission() {
  if (!navigator.mediaDevices?.getUserMedia) return true;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
  return true;
}

function clearVoiceTimeout() {
  if (voiceTimeoutRef.current) {
    window.clearTimeout(voiceTimeoutRef.current);
    voiceTimeoutRef.current = null;
  }
}

function handleVoiceNoTranscript() {
  clearVoiceTimeout();
  voiceTranscriptReceivedRef.current = false;
  setVoiceListening(false);
  inputRef.current?.focus();
  setStatus(activeLanguage === "tr" ? "Ses alındı ama metne çevrilemedi. Lütfen tekrar deneyin veya yazı alanına yazın." : "Audio was captured but could not be converted to text. Please try again or type your command.");
}

async function startRawMicrophoneFallback() {
  if (!navigator.mediaDevices?.getUserMedia) {
    focusTextInputWithVoiceHint("unsupported");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setVoiceListening(true);
    setStatus(activeLanguage === "tr" ? "Mikrofon aktif. Ses tanıma desteklenmiyor; komutu yazıya çevirmek için Chrome/Edge kullanın." : "Microphone is active. Speech recognition is unavailable; use Chrome/Edge to turn speech into text.");
    window.setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
      setVoiceListening(false);
    }, 3500);
  } catch (error: any) {
    focusTextInputWithVoiceHint(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "permission" : "error");
  }
}

  async function startVoiceInput() {
    inputRef.current?.focus();
    if (voiceListening) return;
    const speechWindow = window as typeof window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      await startRawMicrophoneFallback();
      return;
    }
    try {
      setStatus(activeLanguage === "tr" ? "Mikrofon izni isteniyor..." : "Requesting microphone permission...");
      await requestMicrophonePermission();
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = activeLanguage === "tr" ? "tr-TR" : activeLanguage === "de" ? "de-DE" : activeLanguage === "es" ? "es-ES" : activeLanguage === "fr" ? "fr-FR" : activeLanguage === "ar" ? "ar-SA" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      voiceTranscriptReceivedRef.current = false;
      clearVoiceTimeout();
      setVoiceListening(true);
      setStatus(activeLanguage === "tr" ? "Dinleniyor... şimdi konuşun." : "Listening... speak now.");
      recognition.onstart = () => {
        setVoiceListening(true);
        voiceTimeoutRef.current = window.setTimeout(() => {
          if (!voiceTranscriptReceivedRef.current) handleVoiceNoTranscript();
        }, 8000);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        clearVoiceTimeout();
        setVoiceListening(false);
        if (transcript) {
          voiceTranscriptReceivedRef.current = true;
          setStatus(activeLanguage === "tr" ? `Algılanan metin: ${transcript}` : `Detected text: ${transcript}`);
          setChatInput(transcript);
          sendCommand(transcript, "voice", "chat");
        } else {
          handleVoiceNoTranscript();
        }
      };
      recognition.onerror = (event: any) => {
        clearVoiceTimeout();
        focusTextInputWithVoiceHint(event?.error === "not-allowed" || event?.error === "service-not-allowed" ? "permission" : event?.error === "no-speech" ? "empty" : "error");
      };
      recognition.onend = () => {
        setVoiceListening(false);
        if (!voiceTranscriptReceivedRef.current && voiceTimeoutRef.current) handleVoiceNoTranscript();
      };
      recognition.start();
    } catch (error: any) {
      focusTextInputWithVoiceHint(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "permission" : "error");
    }
  }

  function handleChatInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCommand(undefined, "quick", "chat");
    }
  }

  function handleProductionInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCommand(undefined, "quick", "production");
    }
  }

  function renderOptionGrid(title: string, options: string[], isSelected: (value: string) => boolean, onSelect: (value: string) => void) {
    return (
      <div className="option-section assistant-option-section">
        <strong>{title}</strong>
        <div className="assistant-option-grid">
          {options.map((option) => (
            <button
              className={isSelected(option) ? "assistant-option-card active" : "assistant-option-card"}
              type="button"
              key={option}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderMaterialGrid() {
    const musicVideoUploadOptions = selectedProductionType === "music_video";
    return (
      <div className="option-section assistant-option-section">
        <strong>Crelavo material library</strong>
        <div className="assistant-option-grid material-grid">
          {materials.map((material) => (
            <button
              className={selectedMaterials.includes(material.id) ? "assistant-option-card material active" : "assistant-option-card material"}
              type="button"
              key={material.id}
              onClick={() => toggleMaterial(material.id)}
            >
              <span>{material.title}</span>
              <small>{material.category}</small>
            </button>
          ))}
        </div>
        <div className="user-material-upload-panel">
          <strong>User material upload</strong>
          <p>Upload MP3, WAV, MP4, MOV, WEBM, JPG, PNG or WEBP files you own. Uploaded materials affect the credit estimate and are attached to the production record.</p>
          <div className="user-material-controls">
            <select value={uploadPurpose} onChange={(event) => setUploadPurpose(event.target.value)}>
              <option value="user_material">General material</option>
              <option value="music">Background music / song</option>
              <option value="voiceover">Own voice-over</option>
              {selectedProductionType === "live_sales_agent" ? <option value="live_sales_own_voice">Live sales own voice sample</option> : null}
              {selectedProductionType === "live_sales_agent" ? <option value="live_sales_self_avatar">Live sales self avatar / user photo</option> : null}
              {selectedProductionType === "live_sales_agent" ? <option value="live_sales_avatar_reference">Live sales avatar style reference</option> : null}
              {selectedProductionType === "live_sales_agent" ? <option value="live_sales_background">Live sales background / studio visual</option> : null}
              {selectedProductionType === "live_sales_agent" ? <option value="live_sales_product_visual">Live sales product visual</option> : null}
              {selectedProductionType === "drone_video" ? <option value="drone_map_reference">Drone map / satellite reference</option> : null}
              {selectedProductionType === "drone_video" ? <option value="drone_route_reference">Drone route / marked area reference</option> : null}
              {selectedProductionType === "drone_video" ? <option value="drone_location_visual">Drone location visual / property image</option> : null}
              {selectedProductionType === "drone_video" ? <option value="drone_style_reference">Drone style reference video/image</option> : null}
              {musicVideoUploadOptions ? <option value="song_audio">MV song / audio master</option> : null}
              {musicVideoUploadOptions ? <option value="own_voice">MV own voice / vocal reference</option> : null}
              {musicVideoUploadOptions ? <option value="own_image_avatar">MV own image / avatar</option> : null}
              {musicVideoUploadOptions ? <option value="artist_image">MV artist image</option> : null}
              {musicVideoUploadOptions ? <option value="reference_character">MV reference character</option> : null}
              {musicVideoUploadOptions ? <option value="another_person_reference">MV another person reference</option> : null}
              {musicVideoUploadOptions ? <option value="performance_video_reference">MV performance video reference</option> : null}
              <option value="source_video">Source video</option>
              <option value="reference_image">Reference image</option>
            </select>
            <label className="btn secondary">
              {uploadState === "loading" ? "Uploading..." : "Upload file"}
              <input accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aac,audio/ogg,audio/mp4,video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp" disabled={uploadState === "loading"} onChange={(event) => uploadUserMaterial(event.target.files)} type="file" />
            </label>
          </div>
          {uploadError ? <p className="workspace-action-note error">{uploadError}</p> : null}
          {uploadedMaterials.length > 0 ? <div className="uploaded-material-list">
            {uploadedMaterials.map((material) => (
              <div key={material.file_url}>
                <span>{material.title}</span>
                <small>{material.kind} · {material.reference_type} · {Math.ceil(material.size_bytes / 1024).toLocaleString()} KB</small>
                <button className="btn secondary" type="button" onClick={() => removeUploadedMaterial(material.file_url)}>Remove</button>
              </div>
            ))}
          </div> : <small>No user files uploaded yet.</small>}
        </div>
      </div>
    );
  }

  const cleanToolSections = [
    {
      id: "categories",
      label: "Categories",
      detail: selectedProduction?.label ?? "AI Video",
      count: productionTypes.length,
      content: <div className="clean-tool-grid one">
        {productionTypes.map((type) => (
          <button className={selectedProductionType === type.id ? "active" : ""} type="button" key={type.id} onClick={() => applyCategorySelection(type.id)}>
            <strong>{type.label}</strong>
          </button>
        ))}
      </div>
    },
    {
      id: "quality",
      label: "Quality",
      detail: selectedQuality,
      count: Array.from(new Set([...activeCategoryProfile.quality, ...qualityOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.quality, ...qualityOptions])).map((quality) => <button className={selectedQuality === quality ? "active" : ""} type="button" key={quality} onClick={() => { setQuickProviderTest(false); setSelectedQuality(quality); }}><strong>{quality}</strong></button>)}
      </div>
    },
    {
      id: "style",
      label: "Style / Motion",
      detail: selectedStyle,
      count: Array.from(new Set([...activeCategoryProfile.style, ...styleOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.style, ...styleOptions])).map((style) => <button className={selectedStyle === style ? "active" : ""} type="button" key={style} onClick={() => { setQuickProviderTest(false); setSelectedStyle(style); }}><strong>{style}</strong></button>)}
      </div>
    },
    {
      id: "duration",
      label: "Duration / Scope",
      detail: selectedDuration,
      count: Array.from(new Set([...activeCategoryProfile.duration, ...durationOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.duration, ...durationOptions])).map((duration) => <button className={selectedDuration === duration ? "active" : ""} type="button" key={duration} onClick={() => { setQuickProviderTest(false); setSelectedDuration(duration); }}><strong>{duration}</strong></button>)}
      </div>
    },
    {
      id: "modules",
      label: "Modules",
      detail: selectedModules.slice(0, 2).join(" + ") || "Select modules",
      count: Array.from(new Set([...activeCategoryProfile.modules, ...moduleOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.modules, ...moduleOptions])).map((module) => <button className={selectedModules.includes(module) ? "active" : ""} type="button" key={module} onClick={() => toggleModule(module)}><strong>{module}</strong></button>)}
      </div>
    },
    {
      id: "features",
      label: "Features",
      detail: `${selectedFeatures.length} selected`,
      count: Array.from(new Set([...activeCategoryProfile.features, ...featureOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.features, ...featureOptions])).map((feature) => <button className={selectedFeatures.includes(feature) ? "active" : ""} type="button" key={feature} onClick={() => toggleFeature(feature)}><strong>{feature}</strong></button>)}
      </div>
    },
    {
      id: "materials",
      label: "Materials",
      detail: `${selectedMaterials.length + uploadedMaterials.length} selected`,
      count: materials.slice(0, 20).length,
      content: <>
        <div className="clean-tool-grid one compact">
          {materials.slice(0, 20).map((material) => <button className={selectedMaterials.includes(material.id) ? "active" : ""} type="button" key={material.id} onClick={() => toggleMaterial(material.id)}><strong>{material.title}</strong><small>{material.category}</small></button>)}
        </div>
        <label className="btn secondary clean-upload-btn">
          Upload material
          <input type="file" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(event) => uploadUserMaterial(event.currentTarget.files)} style={{ display: "none" }} />
        </label>
      </>
    },
    {
      id: "delivery",
      label: "Delivery",
      detail: selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard",
      count: Array.from(new Set([...activeCategoryProfile.platforms, ...platformOptions])).length,
      content: <div className="clean-tool-grid two">
        {Array.from(new Set([...activeCategoryProfile.platforms, ...platformOptions])).map((platform) => <button className={selectedPlatforms.includes(platform) ? "active" : ""} type="button" key={platform} onClick={() => togglePlatform(platform)}><strong>{platform}</strong></button>)}
      </div>
    }
  ];
  const activeCleanToolContent = cleanToolSections.find((section) => section.id === activeCleanToolSection) ?? cleanToolSections[0];

  return (
    <div className="assistant-workspace crelavo-clean-studio">
      <aside className="clean-studio-rail clean-tool-panel" aria-label="Production settings">
        <div className="clean-tool-head">
          <div className="clean-studio-logo"><span>▶</span></div>
          <div><strong>Crelavo Studio</strong><small>Üretim ayarları</small></div>
        </div>

        <div className="clean-tool-switcher" aria-label="Production setting groups">
          {cleanToolSections.map((section) => (
            <button
              className={activeCleanToolContent.id === section.id ? "active" : ""}
              type="button"
              key={section.id}
              onClick={() => setActiveCleanToolSection(section.id)}
            >
              <span><strong>{section.label}</strong><small>{section.detail}</small></span>
              <em>{section.count}</em>
            </button>
          ))}
        </div>

        <div className="clean-tool-section clean-tool-active-section">
          <span className="badge">{activeCleanToolContent.label}</span>
          {activeCleanToolContent.content}
        </div>
      </aside>

      <main className="clean-studio-main" aria-label="Production workspace">
        <section className="clean-studio-hero">
          <div>
            <span className="badge">Crelavo AI Studio</span>
            <h1>{selectedProduction?.label ?? "AI Production"}</h1>
            <p>{productionBrief || "Ne üretmek istediğini soldaki prompt alanına yaz. Crelavo brief, action, kredi ve teslimat planını burada gösterecek."}</p>
          </div>
        <div className="clean-studio-state">
          <span><small>Durum</small><strong>{productionLifecycleState}</strong></span>
          <span><small>Kredi</small><strong>{costEstimate.totalCredits.toLocaleString()}</strong></span>
          <span><small>Kalite</small><strong>{selectedQuality}</strong></span>
          <span><small>Ajan eylemi</small><strong>{latestAgentAction?.name ?? "Taslak"}</strong></span>
          <span><small>Teslimat</small><strong>{selectedPlatforms.slice(0, 2).join(" + ") || "Kontrol paneli"}</strong></span>
        </div>
        </section>

        <section className="clean-preview-grid">
          <div className="clean-preview-card clean-preview-large">
            <small>Production Preview</small>
            <strong>{selectedProduction?.label ?? selectedProductionType}</strong>
            <p>{productionBrief ? "Brief hazır. Üretim onay bekliyor." : "Henüz üretim çıktısı yok. Komut bekleniyor."}</p>
          </div>
          <div className="clean-preview-card">
            <small>Agent Action</small>
            <strong>{latestAgentAction?.name ?? "Draft"}</strong>
            <p>Gerçek kayıt olmadan üretim başladı denmez.</p>
          </div>
          <div className="clean-preview-card">
            <small>Delivery</small>
            <strong>{selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard"}</strong>
            <p>Dosya, link, preview ve teslim paketi.</p>
          </div>
        </section>

        <section className="clean-progress-row">
          {defaultSteps.map((step, index) => {
            const isStarted = Boolean(startedProduction);
            const isDraftActive = !isStarted && index === 0 && Boolean(productionBrief.trim() || input.trim() || chatInput.trim());
            const isActive = isStarted ? index <= activeStep : isDraftActive;
            return <div className={isActive ? "active" : ""} key={step}><span>{index + 1}</span><strong>{step}</strong></div>;
          })}
        </section>
      </main>

      <aside className="clean-studio-side" aria-label="Assistant and controls">
        <section className="clean-chat-panel">
          <div className="clean-panel-head">
            <span className="badge"><Bot size={14} /> Crelavo Assistant</span>
            <button className="btn secondary" type="button" onClick={() => setMessages([{ role: "assistant", content: "Sohbet temizlendi. Ne yapmak istediğini yazabilirsin." }])}>Temizle</button>
          </div>
          <div className="clean-chat-log notranslate" data-no-translate="true" translate="no" ref={chatLogRef}>
            {cleanAssistantMessages(messages).map((message, index) => <div className={`chat-bubble ${message.role} notranslate`} data-no-translate="true" translate="no" key={`${message.role}-${index}`}>{message.content}</div>)}
            {isLoading ? <div className="chat-bubble assistant notranslate" data-no-translate="true" translate="no">Cevap hazırlanıyor...</div> : null}
          </div>
          <div className="clean-chat-input">
            <textarea className="notranslate" data-no-translate="true" translate="no" spellCheck={false} autoCorrect="off" autoCapitalize="off" ref={inputRef} value={chatInput} onChange={(event) => { setChatInput(event.target.value); setInput(event.target.value); }} onKeyDown={handleChatInputKeyDown} placeholder="Ne yapmak istiyorsun? Örn: Crelavo gibi SaaS sitesi kur..." />
            <button className="btn" type="button" onClick={() => sendCommand(undefined, "quick", "chat")} disabled={isLoading || !chatInput.trim()}><Send size={15} /> Gönder</button>
          </div>
        </section>

        <section className="clean-control-panel">
          <div className="clean-panel-head"><span className="badge">Controls</span><strong>{costEstimate.totalCredits.toLocaleString()} kredi</strong></div>
          <div className="clean-control-list">
            <span><small>Type</small><strong>{selectedProduction?.label ?? selectedProductionType}</strong></span>
            <span><small>Scope</small><strong>{selectedDuration}</strong></span>
            <span><small>Provider</small><strong>Auto route</strong></span>
            <span><small>Production ID</small><strong>{startedProduction?.id ?? "Yok"}</strong></span>
          </div>
          <button className="btn clean-start-btn" type="button" onClick={requestDynamicWizardCredits} disabled={productionCreditInsufficient}>Start Production</button>
          {productionCreditInsufficient ? <a className="btn secondary" href="/dashboard/credits">Kredi ekle</a> : null}
          <a className="btn secondary" href="/dashboard/productions">Production Studio</a>
        </section>
      </aside>
    </div>
  );

  return (
    <div className="assistant-workspace chat-open ai-generator-dashboard">
      <section className="assistant-live-stage ai-dashboard-shell">
        <aside className="ai-dashboard-sidebar" aria-label="Crelavo production navigation">
          <div className="ai-dashboard-brand">
            <span className="badge"><Sparkles size={14} /> Crelavo Studio</span>
            <h1>AI Production</h1>
            <p>Tek sayfada sohbet, brief, kalite, kredi ve gerçek üretim durumu.</p>
          </div>
          <div className="ai-dashboard-nav">
            {studioQuickPaths.map((path) => (
              <button className={selectedProductionType === path.category ? "active" : ""} type="button" key={path.label} onClick={() => { applyCategorySelection(path.category); setInput((current) => current || path.description); setProductionBrief((current) => current || path.description); }}>
                <strong>{path.label}</strong>
                <span>{path.description}</span>
              </button>
            ))}
          </div>
          <div className="ai-dashboard-mini-card">
            <small>Üretim durumu</small>
            <strong>{productionLifecycleState}</strong>
            <span>{productionLifecycleNote}</span>
          </div>
        </aside>

        <section className="assistant-inline-chat ai-dashboard-chat" aria-label="Assistant chat flow">
          <div className="assistant-inline-chat-head">
            <div>
              <span className="badge"><Bot size={14} /> Tek sohbet</span>
              <h2>Crelavo Assistant</h2>
              <p>Ne istediğini buraya yaz. Genel soruları cevaplar; üretim isteğini otomatik brief ve action'a çevirir.</p>
            </div>
            <button className="btn secondary compact-chat-clear" type="button" onClick={() => setMessages([{ role: "assistant", content: "Sohbet temizlendi. Ne yapmak istediğini yazabilirsin." }])}>Temizle</button>
          </div>
          <div className="assistant-inline-chat-log notranslate" data-no-translate="true" translate="no" ref={chatLogRef}>
            {cleanAssistantMessages(messages).map((message, index) => <div className={`chat-bubble ${message.role} notranslate`} data-no-translate="true" translate="no" key={`${message.role}-${index}`}>{message.content}</div>)}
            {isLoading ? <div className="chat-bubble assistant notranslate" data-no-translate="true" translate="no">Cevap hazırlanıyor...</div> : null}
          </div>
          <div className="assistant-inline-chat-input">
            <textarea className="notranslate" data-no-translate="true" translate="no" spellCheck={false} autoCorrect="off" autoCapitalize="off" ref={inputRef} value={chatInput} onChange={(event) => { setChatInput(event.target.value); setInput(event.target.value); }} onKeyDown={handleChatInputKeyDown} placeholder="Örn: Crelavo gibi SaaS sitesi kur, ayakkabı tanıtım videosu yap, API kurulumu anlat..." />
            <div className="assistant-inline-chat-actions">
              <button className="btn secondary compact-chat-action" type="button" onClick={startVoiceInput} disabled={voiceListening} data-no-translate="true"><Mic size={15} /> {voiceListening ? "Dinleniyor" : "Ses"}</button>
              <button className="btn compact-chat-action" type="button" onClick={() => sendCommand(undefined, "quick", "chat")} disabled={isLoading || !chatInput.trim()}><Send size={15} /> Gönder</button>
            </div>
          </div>
          {uploadError ? <p className="workspace-action-note error">{uploadError}</p> : null}
        </section>

        <main className="ai-dashboard-canvas" aria-label="Production overview">
          <section className="studio-preview-plan ai-preview-hero">
            <div>
              <span className="badge">Production preview</span>
              <h3>{selectedProduction?.label ?? selectedProductionType}</h3>
              <p>{productionBrief || "Henüz üretim brief'i yok. Soldaki tek sohbet alanına isteğini yazınca burada üretim planı, teslimatlar, action ve kredi tahmini görünür."}</p>
            </div>
            <div className="studio-preview-metrics">
              <span><small>Kalite</small><strong>{selectedQuality}</strong></span>
              <span><small>Süre / kapsam</small><strong>{selectedDuration}</strong></span>
              <span><small>Teslimat</small><strong>{selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard"}</strong></span>
              <span><small>Kredi</small><strong>{costEstimate.totalCredits.toLocaleString()}</strong></span>
            </div>
            <div className="ai-output-canvas-preview" aria-label="Production output canvas">
              <div className="ai-output-card large"><small>Preview</small><strong>{selectedProduction?.label ?? "Production"}</strong><span>{productionBrief ? "Brief hazır" : "Komut bekleniyor"}</span></div>
              <div className="ai-output-card"><small>Action</small><strong>{latestAgentAction?.name ?? "Draft"}</strong><span>Onaydan önce üretim başlamaz</span></div>
              <div className="ai-output-card"><small>Delivery</small><strong>{selectedPackage?.name ?? "Files + links"}</strong><span>{selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard teslim"}</span></div>
            </div>
          </section>

          <div className="live-production-board compact-studio-steps ai-progress-board">
            {defaultSteps.map((step, index) => {
              const isStarted = Boolean(startedProduction);
              const isDraftActive = !isStarted && index === 0 && Boolean(productionBrief.trim() || input.trim() || dynamicWizard.open);
              const isActive = isStarted ? index <= activeStep : isDraftActive;
              const stepStatus = isStarted
                ? (index < activeStep ? "Tamam" : index === activeStep ? "Aktif" : "Bekliyor")
                : (isDraftActive ? "Taslak hazır" : "Gönderilmedi");
              return (
                <div className={`live-step ${isActive ? "active" : ""} ${!isStarted ? "draft-step" : ""}`} key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                  <small>{stepStatus}</small>
                </div>
              );
            })}
          </div>

          <section className="assistant-production-console ai-delivery-console">
            <section className="assistant-console-main">
              <span className="badge">Canlı üretim yönü</span>
              <h2>{selectedProduction?.label ?? selectedProductionType}</h2>
              <p>{selectedProduction?.description ?? "Üretim tipi, teslimat formatı ve kredi rezervi sohbetten hazırlanır."}</p>
              <div className="assistant-console-metrics">
                <div><small>Tahmini rezerv</small><strong>{costEstimate.totalCredits.toLocaleString()} kredi</strong></div>
                <div><small>Çıktı sayısı</small><strong>{costEstimate.outputCount}</strong></div>
                <div><small>Provider risk</small><strong>{costEstimate.providerRiskLevel}</strong></div>
              </div>
            </section>
            <aside className="assistant-delivery-stack assistant-delivery-preview">
              <span className="badge">Teslimat içeriği</span>
              <strong>{selectedPackage?.name ?? "Custom production package"}</strong>
              <p>{selectedPackage?.description ?? "Teslimat paketi seçilen modüller, platformlar ve üretim kapsamına göre hazırlanır."}</p>
              <div className="assistant-delivery-format-grid">
                {defaultDeliveryPreviewItems.map((item) => <span key={item}>{item}</span>)}
              </div>
            </aside>
          </section>

          {dynamicWizard.open ? (
            <section className="production-options-panel dynamic-production-wizard ai-inline-wizard" data-no-translate="true">
              <div className="drawer-head">
                <div>
                  <span className="badge">Dynamic Production Wizard</span>
                  <h3>{dynamicWizardLabels[dynamicWizard.type]}</h3>
                  <p>{dynamicWizard.subject ? `Subject: ${dynamicWizard.subject}` : "Asistan gerekli soruları üretim isteğine göre açar."}</p>
                </div>
                <button className="btn secondary" type="button" onClick={() => setDynamicWizard(emptyDynamicWizard)}>Kapat</button>
              </div>
              {dynamicWizardQuestions[dynamicWizard.type].filter((question) => !question.dependsOn || dynamicWizard.answers[question.dependsOn.questionId]?.includes(question.dependsOn.value)).map((question) => (
                <div className="category-specific-option-panel" key={question.id}>
                  <span className="badge">{question.multi ? "Bir veya daha fazla seç" : "Birini seç"}</span>
                  <h3>{question.label}</h3>
                  <div className="option-grid compact-option-grid">
                    {question.options.map((option) => {
                      const selected = dynamicWizard.answers[question.id]?.includes(option) ?? false;
                      return <button className={`option-pill ${selected ? "selected" : ""}`} type="button" key={option} onClick={() => selectDynamicWizardOption(question, option)}>{option}</button>;
                    })}
                  </div>
                </div>
              ))}
              <div className="drawer-summary"><strong>Live production summary</strong><pre>{selectedOptionSummary()}</pre></div>
              <div className="assistant-start-actions">
                <button className="btn" type="button" onClick={requestDynamicWizardCredits}>Kredi kontrolü</button>
                <button className="btn secondary" type="button" onClick={() => setOptionsOpen(true)}>Ayarları aç</button>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="studio-credit-card studio-side-summary ai-dashboard-controls">
          <div className="studio-side-block primary">
            <small>Tahmini kredi</small>
            <strong>{costEstimate.totalCredits.toLocaleString()} kredi</strong>
            <span>{selectedProduction?.label ?? selectedProductionType} · {selectedQuality} · Auto provider</span>
          </div>
          <div className="studio-quality-strip" aria-label="Quality tiers">
            {studioQualityTiers.map((tier) => <button className={selectedQuality.toLowerCase().includes(tier.toLowerCase()) ? "active" : ""} type="button" key={tier} onClick={() => setSelectedQuality(tier)}>{tier}</button>)}
          </div>
          <div className="studio-credit-trust-panel">
            <span><small>Mevcut</small><strong>{hasKnownProductionCredits ? `${(availableProductionCredits ?? 0).toLocaleString()} kredi` : "Kontrol"}</strong></span>
            <span><small>Şimdi ayrılan</small><strong>{startedProduction ? "Production record" : "0 kredi"}</strong></span>
            <span><small>Onay sonrası</small><strong>{costEstimate.totalCredits.toLocaleString()} rezerv</strong></span>
            {productionCreditInsufficient ? <p className="workspace-action-note error">Eksik: {productionCreditShortfall.toLocaleString()} kredi. Başlamadan önce kredi ekle veya kalite/kapsamı düşür.</p> : <p className="workspace-action-note">Gerçek kayıt oluşmadan kredi ayrılmaz.</p>}
          </div>
          {latestAgentAction ? (
            <div className="studio-credit-trust-panel agent-action-panel">
              <span><small>Agent action</small><strong>{latestAgentAction?.name ?? "ready"}</strong></span>
              <span><small>Route</small><strong>{latestAgentAction?.next_backend_endpoint ?? "/api/productions"}</strong></span>
              <span><small>Provider</small><strong>{latestAgentAction?.provider_route ?? "auto"}</strong></span>
            </div>
          ) : null}
          <div className="studio-side-actions">
            <button className="btn" type="button" onClick={() => setStartModalOpen(true)} disabled={productionCreditInsufficient}>Start Production</button>
            <button className="btn secondary" type="button" onClick={() => setOptionsOpen((current) => !current)}>{optionsOpen ? "Ayarları kapat" : "Kalite / özellikler"}</button>
            {productionCreditInsufficient ? <a className="btn secondary" href="/dashboard/credits">Kredi ekle</a> : null}
            <a className="btn secondary" href="/dashboard/productions">Production Studio</a>
          </div>
          {optionsOpen ? (
            <section className="production-options-panel ai-control-drawer">
              <div className="drawer-head">
                <div>
                  <span className="badge">Ayarlar</span>
                  <h3>Kalite, kapsam ve materyal</h3>
                </div>
                <button className="btn secondary" type="button" onClick={() => setOptionsOpen(false)}>Kapat</button>
              </div>
              {renderOptionGrid("Production categories", productionTypes.map((type) => type.label), (value) => productionTypes.find((type) => type.label === value)?.id === selectedProductionType, (value) => { const type = productionTypes.find((item) => item.label === value); if (type) applyCategorySelection(type.id); })}
              <div className="category-specific-option-panel">
                <span className="badge">Kategori seçenekleri</span>
                <h3>{activeCategoryProfile.title}</h3>
                <p>{activeCategoryProfile.note}</p>
              </div>
              {renderOptionGrid("Quality / format", activeCategoryProfile.quality, (value) => selectedQuality === value, (value) => { setQuickProviderTest(false); setSelectedQuality(value); })}
              {renderOptionGrid("Style / production type", activeCategoryProfile.style, (value) => selectedStyle === value, (value) => { setQuickProviderTest(false); setSelectedStyle(value); })}
              {renderOptionGrid("Duration / scope", activeCategoryProfile.duration, (value) => selectedDuration === value, (value) => { setQuickProviderTest(false); setSelectedDuration(value); })}
              {renderOptionGrid("Relevant modules", activeCategoryProfile.modules, (value) => selectedModules.includes(value), toggleModule)}
              {renderOptionGrid("Relevant features", activeCategoryProfile.features, (value) => selectedFeatures.includes(value), toggleFeature)}
              {renderOptionGrid("Delivery / platform", activeCategoryProfile.platforms, (value) => selectedPlatforms.includes(value), togglePlatform)}
              {renderMaterialGrid()}
              <div className="drawer-summary"><strong>Selection summary</strong><pre>{selectedOptionSummary()}</pre></div>
              <button className="btn" type="button" onClick={() => setOptionsOpen(false)}>Seçimleri uygula</button>
            </section>
          ) : null}
          <div className="studio-side-status">
            <small>Provider status</small>
            {studioProviderSignals.map((item) => <span key={item.label}><b>{item.label}</b>{item.value} · {item.status}</span>)}
          </div>
          {startedProduction ? (
            <div className={`studio-started-card ${startedProduction?.status === "waiting_provider_config" || startedProduction?.status === "automation_warning" ? "production-attention-card" : "production-live-card"}`}>
              <small>{startedProduction?.status === "automation_warning" || startedProduction?.status === "waiting_provider_config" ? "Dikkat gerekiyor" : "Production started"}</small>
              <strong>{startedProduction?.message}</strong>
              <span><b>Production ID</b>{startedProduction?.id}</span>
              {startedProduction?.providerStatus ? <span><b>Provider status</b>{startedProduction?.providerStatus}</span> : null}
              {startedProduction?.missingProviderKeys?.length ? <span><b>Missing provider</b>{startedProduction?.missingProviderKeys?.join(", ")}</span> : null}
              {startedProduction?.nextAction ? <p className="workspace-action-note">{startedProduction?.nextAction}</p> : null}
              <a className="btn secondary" href={startedProduction?.detailUrl ?? "/dashboard/productions"}>Detayı aç</a>
            </div>
          ) : (
            <div className="studio-started-card production-draft-card">
              <small>Henüz canlı değil</small>
              <strong>Production ID yok.</strong>
              <span><b>Sonraki adım</b>Gerçek kayıt için Start Production kullanılır.</span>
            </div>
          )}
          {assistantCreditState.chargedCredits !== null ? <p className="workspace-action-note">Son asistan ücreti: {formatCredits(assistantCreditState.chargedCredits)} kredi ({assistantCreditState.chargeSource === "assistant_trial" ? "ücretsiz asistan kredisi" : "üretim kredisi"}).</p> : null}
          {assistantCreditState.redirect ? <p className="workspace-action-note error">Kredi gerekiyor. Kredi sayfasından bakiye yükleyip konuşmaya devam edebilirsin.</p> : null}
          {assistantCreditState.assistantBalance !== null && (assistantCreditState.assistantBalance ?? 0) > 0 && (assistantCreditState.assistantBalance ?? 0) < 300 && !assistantCreditState.redirect ? <p className="workspace-action-note warning">Ücretsiz asistan kredin azalıyor. Bitince mesajlar üretim kredisinden düşer.</p> : null}
          {assistantCreditState.productionBalance !== null && (assistantCreditState.productionBalance ?? 0) > 0 && (assistantCreditState.productionBalance ?? 0) < 500 && !assistantCreditState.redirect ? <p className="workspace-action-note warning">Üretim kredin azalıyor. Bakiye bitmeden kredi yüklemeni öneririm.</p> : null}
        </aside>


        {startModalOpen ? (
          <div className="production-start-modal-backdrop">
            <div className="production-start-modal">
              <span className="badge">Start production</span>
              <h3>Create a production record with these options?</h3>
              <p>This writes the selected quality, style, duration, material and delivery options to the record, reserves credits and moves you to the live production workspace.</p>
              <div className="start-cost-preview">
                <strong>{quickProviderTest ? "Low-cost paid test" : `${costEstimate.totalCredits.toLocaleString()} estimated credit reserve`}</strong>
                <span>Single output: {costEstimate.singleOutputCredits.toLocaleString()} credits · Output count: {costEstimate.outputCount} · Provider risk: {costEstimate.providerRiskLevel}{quickProviderTest ? " · 5 sec / 720p / single output" : ""}</span>
              </div>
              <div className="production-start-trust-grid">
                <span><b>1</b><strong>Confirm first</strong><small>No credit reserve is created before this screen.</small></span>
                <span><b>2</b><strong>Reserve estimate</strong><small>Credits are reserved for provider/render cost control.</small></span>
                <span><b>3</b><strong>Provider check</strong><small>Unavailable providers stay pending instead of pretending to work.</small></span>
                <span><b>4</b><strong>Final delivery</strong><small>Unused reserved credits can be released by the production resolution flow.</small></span>
              </div>
              <pre className="start-option-preview">{selectedOptionSummary()}</pre>
              {productionCreditInsufficient ? <p className="workspace-action-note error">Insufficient credits for this production. Available: {(availableProductionCredits ?? 0).toLocaleString()} credits. Estimated: {costEstimate.totalCredits.toLocaleString()} credits. Reduce duration, quality, materials or add credits.</p> : null}
              {startError ? <p className="workspace-action-note error">{startError}</p> : null}
              <div className="production-start-actions">
                <button className="btn secondary" type="button" onClick={() => setStartModalOpen(false)} disabled={startState === "loading"}>Cancel</button>
                <button className="btn" type="button" onClick={startProduction} disabled={startState === "loading" || productionCreditInsufficient}>{startState === "loading" ? "Starting..." : "I understand, start production"}</button>
              </div>
            </div>
          </div>
        ) : null}

        {creditSplashOpen ? (
          <div className="production-start-modal-backdrop">
            <div className="production-start-modal credit-splash-modal">
              <span className="badge">Credits required</span>
              <h3>Your first preview is ready. Add credits to continue production.</h3>
              <p>The welcome bonus helps create the first assistant brief/preview plan. Full production, provider rendering and final delivery require production credits.</p>
              <div className="start-cost-preview">
                <strong>{(assistantCreditState.requiredCredits ?? costEstimate.totalCredits).toLocaleString()} credits estimated</strong>
                <span>Choose a credit package, then return here to continue with this prepared production request.</span>
              </div>
              <div className="production-start-actions">
                <button className="btn secondary" type="button" onClick={() => setCreditSplashOpen(false)}>Not now</button>
                <a className="btn" href="/dashboard/credits">View credit packages</a>
              </div>
            </div>
          </div>
        ) : null}
      </section>


    </div>
  );
}
