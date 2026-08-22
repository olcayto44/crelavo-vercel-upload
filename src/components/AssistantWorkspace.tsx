"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Bot, Box, Clock3, CreditCard, Download, Film, Gauge, Layers3, Mic, PackageCheck, Paperclip, Send, Sparkles } from "lucide-react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { blockedProductionMessage, validateProductionSafety } from "@/lib/content-safety";
import { getStoredLanguage } from "@/lib/i18n";
import { activePlatformMaterials } from "@/lib/platform-materials";
import { defaultDeliveryCreditRatesConfig, type DeliveryCreditRatesConfig } from "@/lib/delivery-credit-rates";
import { footerGroups } from "@/lib/site-content";
import { ASSISTANT_WORKSPACE_MESSAGES_KEY } from "@/lib/assistant-session-client";
import { buildAssistantProductionPayload, packageIdFromSelection, type UserUploadedMaterial } from "@/lib/production-payload";
import { estimateProductionCost, productionPackages, productionTypes, type ProductionPackage } from "@/lib/production";
import { productionWorkspacePath } from "@/lib/production-url";

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

const serviceNetworkGroups = [
  {
    key: "ai-core",
    label: "AI Core",
    shortLabel: "Core",
    note: "Prompt, plan, routing",
    services: ["OpenAI", "Crelavo Orchestrator", "Provider Router"],
    triggers: ["website", "saas", "admin", "document", "image", "video", "campaign", "voice", "music", "drama"]
  },
  {
    key: "visual",
    label: "Visual",
    shortLabel: "Image",
    note: "Image and brand generation",
    services: ["OpenAI Image", "Stability AI", "Brand Kit", "Asset Library"],
    triggers: ["image", "brand", "campaign", "website", "saas", "admin"]
  },
  {
    key: "video",
    label: "Video",
    shortLabel: "Video",
    note: "Video, render, avatar",
    services: ["Kling", "Runway", "Fal", "HeyGen", "Shotstack", "Seedance route"],
    triggers: ["video", "campaign", "drama", "drone", "talking", "avatar", "animation", "music_video"]
  },
  {
    key: "voice",
    label: "Voice",
    shortLabel: "Voice",
    note: "Voice-over and dubbing",
    services: ["ElevenLabs", "Voice Clone", "Dubbing", "Subtitle route"],
    triggers: ["voice", "dubbing", "talking", "avatar", "video", "drama"]
  },
  {
    key: "music",
    label: "Music",
    shortLabel: "Music",
    note: "Music and BGM",
    services: ["Stable Audio", "Mubert", "Music fallback", "License check"],
    triggers: ["music", "music_video", "video", "campaign"]
  },
  {
    key: "data-seo",
    label: "Data / SEO",
    shortLabel: "Data",
    note: "Research and indexing",
    services: ["DataForSEO", "Apify", "Google Maps", "Bing IndexNow"],
    triggers: ["document", "website", "saas", "campaign", "growth", "seo"]
  },
  {
    key: "commerce",
    label: "Commerce",
    shortLabel: "Shop",
    note: "Store and payment network",
    services: ["Shopify", "WooCommerce", "Whop", "Stripe", "Product feed"],
    triggers: ["campaign", "ecommerce", "shop", "product", "website"]
  },
  {
    key: "social",
    label: "Social",
    shortLabel: "Social",
    note: "Publishing and export",
    services: ["TikTok", "YouTube", "Meta", "Instagram/Facebook", "Export planner"],
    triggers: ["campaign", "video", "social", "shorts", "music_video"]
  }
];

function serviceGroupIsRelevant(group: typeof serviceNetworkGroups[number], productionType: string, modules: string[], features: string[], platforms: string[]) {
  const haystack = [productionType, ...modules, ...features, ...platforms].join(" ").toLowerCase();
  return group.triggers.some((trigger) => haystack.includes(trigger.toLowerCase()));
}

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
  provider_route?: string;
  voice_profile?: string;
  voice_language?: string;
  music_profile?: string;
  environment_profile?: string;
  delivery_handoff?: string;
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

type DynamicWizardType = "website" | "video" | "mobile_app" | "campaign" | "talking_video" | "music_video" | "growth_analysis" | "feature_tool" | "virtual_model" | "localization_tool" | "campaign_calendar_tool" | "academy_tool" | "showcase_tool" | "ai_agent_wizard" | "drone_wizard" | "stickman_wizard" | "image" | "document";

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
  music_video: "Music Video / Clip Wizard",
  growth_analysis: "Rakip / SEO Analiz Wizard",
  feature_tool: "Reklam Puanlayıcı Wizard",
  virtual_model: "Sanal Model Wizard",
  localization_tool: "Kültürel Yerelleştirme Wizard",
  campaign_calendar_tool: "Kampanya Takvimi Wizard",
  academy_tool: "Crelavo Akademi Wizard",
  showcase_tool: "Topluluk Vitrini Wizard",
  ai_agent_wizard: "AI Ajan Wizard",
  drone_wizard: "Drone / Uydu Wizard",
  stickman_wizard: "Çöp Adam Animasyon Wizard",
  image: "Image / Banner / Poster Pack",
  document: "Document / PDF Pack"
};

const wizardCategoryTypeMap: Record<string, DynamicWizardType> = {
  campaign: "campaign", ai_agent: "ai_agent_wizard", localization: "localization_tool", ad_score_checker: "feature_tool", cultural_localization: "localization_tool", campaign_calendar: "campaign_calendar_tool", community_showcase: "showcase_tool", virtual_model_studio: "virtual_model", crelavo_academy: "academy_tool",
  video: "video", documentary: "video", animation: "video", anime_short_film: "video", animal_video: "video", nature_video: "video", planet_space_video: "video", drone_video: "drone_wizard", live_sales_agent: "talking_video", stickman_animation: "stickman_wizard", music_video: "music_video", studio: "video", drama: "video", cinematic_video: "video", video_clipping: "video", video_tools: "video",
  talking_video: "talking_video", avatar: "talking_video", lip_sync: "talking_video", voice_clone: "talking_video", visual_clone: "image",
  website: "website", saas: "website", mobile_app: "mobile_app", admin_project: "website",
  image: "image", brand_kit: "image", document_pack: "document"
};

const wizardCategoryLabels: Record<string, string> = {
  campaign: "Text-to-Campaign / Product Ads", ai_agent: "AI Agents", localization: "Global Localization", ad_score_checker: "AI Ad Performance Score Checker", virtual_model_studio: "AI Virtual Model Studio", cultural_localization: "AI Cultural Localization", campaign_calendar: "AI Campaign Calendar", crelavo_academy: "Crelavo Academy", community_showcase: "Community Showcase",
  video: "AI Video Generator", talking_video: "Advanced Talking Video", documentary: "Documentary", animation: "Animation Video", anime_short_film: "Anime Short Film", animal_video: "Animal Video", nature_video: "Nature Video", planet_space_video: "Planet / Space Video", drone_video: "Drone / Satellite Video", live_sales_agent: "AI Live Sales Agent", stickman_animation: "Stickman Animation", music_video: "Music Video / MV", studio: "Studio / Series-Film", drama: "Drama / Short Series", cinematic_video: "Cinematic Video", video_clipping: "Video Clipping", video_tools: "Video Tools",
  avatar: "Avatar Design / Avatar Video", lip_sync: "Lip Sync Video", voice_clone: "Voice Cloning", visual_clone: "Visual / Style Clone",
  website: "Website Builder", saas: "SaaS Product", mobile_app: "Mobile App Builder", admin_project: "Admin Panel Projects",
  image: "Image / Banner / Poster Pack", brand_kit: "Brand Kit", document_pack: "Documents / Files"
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
  video: ["Prompt-to-video", "Link-to-video", "Image-to-video", "Script-to-video", "Product ad video", "Explainer video", "Voice-over", "Background music", "Subtitles"],
  talking_video: ["Self-in-video", "Photo/avatar input", "Choose character", "Create character", "Own voice-over", "Choose AI voice", "Create AI voice", "2/3/4/5+ people", "7-8 person panel", "Separate voices", "Regional clothing", "Dialect voice"],
  documentary: ["Topic research", "Narration outline", "Interview map", "Archival visuals", "Documentary music", "Own voice-over", "Choose AI voice", "Create AI voice"],
  animation: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Motion graphics", "Whiteboard animation", "Explainer animation", "Animation music", "Voice-over", "Subtitles"],
  anime_short_film: ["Anime style", "Character setup", "Dialogue", "Action scene", "Fantasy scene", "Anime music", "Voice-over", "Subtitles", "User materials"],
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
    { id: "videoType", label: "Ne tür video?", options: ["Short film", "Series / episode", "Trailer", "Social media short", "Restaurant / food video", "Product ad", "UGC style", "Explainer", "Cinematic promo", "Animation video"] },
    { id: "people", label: "Kaç kişi / karakter olacak?", options: ["No people", "1 person", "2 people", "3 people", "4 people", "5+ people"] },
    { id: "selfIncluded", label: "Kullanıcı videoda olacak mı?", options: ["No self footage", "I will be one character", "Use my uploaded photo", "Use my uploaded video", "Create AI version of me"] },
    { id: "characterCreation", label: "Diğer karakterler nasıl oluşsun?", multi: true, options: ["Create AI characters", "Choose from character library", "Use uploaded character photos", "Keep same characters across scenes", "Separate role for each character"] },
    { id: "voiceProfile", label: "Seslendirme / karakter sesi", multi: true, options: ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Child voice", "Senior voice", "Separate voice per person", "Dialogue scene"] },
    { id: "environment", label: "Çekilecek ortam", options: ["Auto scene environment", "Home interior", "Outdoor street", "Hotel / luxury lobby", "Sea / beach", "Cafe / restaurant", "Cinema / dark room", "Studio background", "Office / SaaS dashboard", "Outdoor cinematic", "Luxury product scene", "Regional environment", "Drone / satellite map", "Green screen / clean background"] },
    { id: "subjectWorld", label: "Sosyal kısa video dünyası", multi: true, options: ["Human characters", "Animals", "Nature", "Product / object", "Food / drink", "Fashion / outfit", "Regional clothing", "Traditional costume", "Local culture", "Vehicle / drone", "Fantasy / AI world"] },
    { id: "timeMood", label: "Zaman ve duygu", multi: true, options: ["Morning", "Daytime", "Evening", "Night", "Action environment", "Emotional atmosphere", "Funny / meme mood", "Luxury mood", "Calm documentary mood", "High-energy viral mood"] },
    { id: "quality", label: "Kalite / format", options: ["1080p", "1080p premium", "4K", "Vertical 9:16", "Horizontal 16:9", "YouTube 16:9"] },
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
    { id: "campaignType", label: "Kampanya türü", options: ["Product ad", "Marketplace product kit", "Restaurant campaign", "E-commerce launch", "Social media pack", "Brand promo", "Amazon listing campaign", "Trendyol product campaign", "Shopify launch kit", "WooCommerce product kit"] },
    { id: "commerceInput", label: "Ürün kaynağı", multi: true, options: ["Product URL", "Shopify product link", "Amazon product link", "Trendyol product link", "WooCommerce product", "Uploaded product image", "Product title only", "Bulk product list"] },
    { id: "commerceAsset", label: "E-ticaret çıktıları", multi: true, options: ["Product ad video", "Product image set", "Marketplace listing copy", "SEO product description", "Store banner", "Email promo", "UGC ad script", "A/B hook pack"] },
    { id: "channels", label: "Kanallar", multi: true, options: ["TikTok", "Instagram", "Meta Ads", "YouTube Shorts", "Shopify", "Amazon", "Trendyol", "WooCommerce", "Pinterest"] },
    { id: "assets", label: "Çıktılar", multi: true, options: ["Ad video", "Product visuals", "Caption", "Hashtags", "Landing page", "3 alternatives", "Dashboard delivery", "MP4 download"] }
  ],
  talking_video: [
    { id: "avatarType", label: "Avatar / konuşan video tipi", options: ["E-commerce avatar", "AI live sales avatar", "Talking head video", "Lip-sync from audio", "Multi-person conversation", "Brand spokesperson"] },
    { id: "people", label: "Kaç kişi konuşacak?", options: ["1 person", "2 people", "3 people", "4 people", "5+ people", "7-8 panel"] },
    { id: "productContext", label: "Ürün / e-ticaret bağlantısı", options: ["No product", "Use product link", "Use uploaded product image", "Marketplace product", "Shopify product"] },
    { id: "voiceProfile", label: "Ses karakteri", multi: true, options: ["Own voice", "Adult neutral voice", "Male voice", "Female voice", "Child voice", "Senior voice", "Separate voice per person", "Local accent", "Subtitles", "Lip-sync"] },
    { id: "environment", label: "Konuşma ortamı", options: ["Studio background", "E-commerce product scene", "Office / SaaS dashboard", "Shop background", "Regional environment", "Green screen / clean background"] },
    { id: "style", label: "Görsel tarz", options: ["Realistic talking video", "Animated talking video", "UGC style", "Corporate", "Regional culture"] }
  ],
  music_video: [
    { id: "clipType", label: "Klip türü", options: ["Performance clip", "Story music video", "Lyric video", "Visualizer", "3-person clip", "Dance / social clip"] },
    { id: "people", label: "Kaç kişi olacak?", options: ["No people", "1 person", "2 people", "3 people", "4 people", "5+ people"] },
    { id: "musicSource", label: "Müzik kaynağı", options: ["Use uploaded song", "Generate AI music", "User music reference", "Beat only", "No new music"] },
    { id: "voiceProfile", label: "Vokal / konuşma", multi: true, options: ["No voice-over", "Own voice", "Separate voice per person", "Subtitles", "Lyrics on screen"] },
    { id: "environment", label: "Klip ortamı", options: ["Stage performance", "Street cinematic", "Studio background", "Luxury scene", "Nature / outdoor", "Club / neon", "AI fantasy world"] },
    { id: "quality", label: "Kalite / oran", options: ["1080p", "1080p cinematic", "4K", "Vertical 9:16", "YouTube 16:9"] }
  ],
  growth_analysis: [
    { id: "analysisType", label: "Analiz türü", options: ["Rakip site analizi", "SEO keyword research", "Growth intelligence report", "Ad / social competitor analysis", "Local market analysis"] },
    { id: "sources", label: "Girdi kaynakları", multi: true, options: ["Competitor URLs", "Target keywords", "Target country/city", "Google Maps competitors", "Social accounts", "Marketplace links"] },
    { id: "reportScope", label: "Rapor kapsamı", options: ["Quick summary", "Detailed PDF report", "Dashboard report", "Weekly monitoring", "Action plan + priorities"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PDF document", "Email report", "Slack/email alerts", "Final ZIP"] }
  ],
  feature_tool: [
    { id: "adScoreInput", label: "Ne puanlanacak?", options: ["Product ad idea", "TikTok video ad", "E-commerce ad", "Existing script", "Hook + CTA", "Video-ready creative brief"] },
    { id: "reportScope", label: "Puan kapsamı", options: ["Basic ad score", "Detailed ad score report", "3 improved ad angles", "Hook rewrite", "Script + hook improvement"] },
    { id: "platform", label: "Platform", multi: true, options: ["TikTok", "Instagram Reels", "Meta Ads", "YouTube Shorts", "Shopify", "Amazon", "Trendyol"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PDF document", "Video-ready brief", "Campaign production draft"] }
  ],
  virtual_model: [
    { id: "modelOutput", label: "Sanal model çıktısı", options: ["1 virtual model visual", "4 image pack", "10 image catalog idea", "Full catalog set"] },
    { id: "productType", label: "Ürün türü", options: ["Fashion / clothing", "Jewelry", "Beauty product", "Accessory", "Marketplace product", "Custom product"] },
    { id: "modelStyle", label: "Model stili", options: ["Realistic fashion model", "Luxury editorial", "E-commerce clean background", "Lifestyle model", "Regional model look"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PNG images", "JPG images", "Final ZIP", "Source file delivery"] }
  ],
  localization_tool: [
    { id: "localizationType", label: "Yerelleştirme türü", options: ["Country localization brief", "Localized hooks", "Localized script", "Localized product video brief", "Multi-country campaign"] },
    { id: "market", label: "Hedef pazar", multi: true, options: ["US", "Germany", "France", "Gulf / Arabic", "Turkey", "UK", "Multi-country"] },
    { id: "adaptation", label: "Neler uyarlansın?", multi: true, options: ["Language", "CTA", "Tone", "Pacing", "Visual style", "Voice direction", "Cultural background"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PDF document", "Localized script", "Video brief", "Final ZIP"] }
  ],
  campaign_calendar_tool: [
    { id: "calendarType", label: "Takvim türü", options: ["Black Friday", "Valentine", "Ramadan / Eid", "New Year", "Back to school", "Product launch", "Seasonal campaign"] },
    { id: "calendarScope", label: "Kapsam", options: ["Campaign brief", "Seasonal hook list", "Product launch checklist", "Script pack", "Campaign asset plan"] },
    { id: "channels", label: "Kanallar", multi: true, options: ["TikTok", "Instagram", "Meta Ads", "Email", "Shopify", "Amazon", "Trendyol"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PDF document", "Calendar file", "Asset plan", "Final ZIP"] }
  ],
  academy_tool: [
    { id: "academyOutput", label: "Akademi çıktısı", options: ["Free lesson path", "Premium template", "Done-with-you brief", "UGC lesson pack", "Product video workflow"] },
    { id: "topic", label: "Konu", options: ["AI marketing", "Product video course", "E-commerce ad course", "UGC ads", "Shopify video marketing"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "PDF document", "Template pack", "README / setup", "Final ZIP"] }
  ],
  showcase_tool: [
    { id: "showcaseUse", label: "Vitrin nasıl kullanılsın?", options: ["Use similar style", "Template reuse", "AI ad example", "UGC example", "Product video example"] },
    { id: "reuseScope", label: "Yeniden kullanım kapsamı", options: ["Similar style request", "Template reuse pack", "Creative brief", "Production-ready request"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "Creative brief", "Preview link", "Final ZIP"] }
  ],
  ai_agent_wizard: [
    { id: "agentType", label: "AI ajan türü", options: ["AI influencer", "Daily social manager", "Trend monitor", "24/7 brand representative", "Approval-flow assistant"] },
    { id: "operationHours", label: "Çalışma kapsamı", options: ["Daily posts", "10h/month", "40h/month", "120h/month", "24/7 plan"] },
    { id: "personality", label: "Ses / kişilik", options: ["Friendly brand voice", "Expert advisor", "Energetic seller", "Luxury concierge", "Local language host"] },
    { id: "delivery", label: "Teslim", multi: true, options: ["Dashboard delivery", "Approval flow", "Social calendar", "Setup guide", "Service plan"] }
  ],
  drone_wizard: [
    { id: "droneInput", label: "Drone girdisi", options: ["Map/location prompt", "Satellite-view intro", "Marked area notes", "Route/path plan", "Property image"] },
    { id: "droneMotion", label: "Uçuş / kamera", options: ["Smooth flyover route", "Satellite to location zoom", "Marked-area reveal", "Real estate orbit", "Travel cinematic flyover"] },
    { id: "voiceProfile", label: "Anlatım", multi: true, options: ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Calm documentary voice", "Subtitles"] },
    { id: "environment", label: "Harita / ortam", options: ["Satellite map view", "Cinematic real estate", "Tourism route", "Construction / land view", "Urban aerial"] }
  ],
  stickman_wizard: [
    { id: "stickmanType", label: "Çöp adam türü", options: ["Explainer", "Comedy skit", "Education", "Story video", "Social media short"] },
    { id: "characterCreation", label: "Karakter", multi: true, options: ["Choose character", "Create character", "Keep same character", "Multiple stick characters"] },
    { id: "voiceProfile", label: "Ses", multi: true, options: ["No voice-over", "Own voice", "Adult neutral voice", "Child voice", "Energetic voice", "Subtitles"] },
    { id: "quality", label: "Kalite / teslim", options: ["1080p", "Vertical 9:16", "YouTube 16:9"] }
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

function safeWorkQuality(value: string | null | undefined, fallback = "1080p") {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return fallback;
  if (/480p|720p|draft|quick\s*test|fast\s*draft|low[-\s]?cost/i.test(cleaned)) return fallback;
  return cleaned;
}

function safeWorkQualityOptions(options: string[]) {
  const cleaned = options.map((option) => safeWorkQuality(option, "")).filter(Boolean);
  return Array.from(new Set(cleaned.length ? cleaned : ["1080p", "1080p premium"]));
}

const qualityOptions = ["1080p", "1080p premium", "1080p cinematic", "2K", "4K", "Vertical 9:16", "Horizontal 16:9", "Square 1:1", "Story 9:16", "YouTube 16:9"];
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
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Premium ad", "Realistic UGC", "Viral TikTok", "Product demo"],
    duration: ["15 sec", "30 sec", "45 sec", "60 sec"]
  },
  video: {
    title: "AI video options",
    note: "Prompt/link/image-to-video, product ads, explainers, cinematic clips, voice-over, subtitles, music and delivery decisions. Talking presenter, avatar, lip-sync, long-video clipping and MV requests use their own categories.",
    modules: ["AI video", "Prompt-to-video", "Link-to-video", "Image-to-video", "Script-to-video", "Product ad video", "Explainer video", "Visual/image pack", "Voice-over", "Background music direction", "User audio upload"],
    features: ["Script", "Scene plan", "Choose AI voice", "Create AI voice", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Watermark-free output", "3 alternatives"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p", "1080p premium", "1080p cinematic", "Vertical 9:16", "YouTube 16:9"],
    style: ["Premium ad", "Cinematic", "Cinematic animation", "Realistic UGC", "Documentary", "Product demo"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec", "2 min"]
  },
  talking_video: {
    title: "Advanced talking video options",
    note: "Self-in-video, 2/3/4/5+ or 7-8 person conversations, own voice materials, separate voices, regional clothing, local environments and dialect/accent voice decisions.",
    modules: ["Advanced talking video", "Self-in-video", "Multi-person talking video", "Regional culture video", "Local dialect voice", "Voice-to-video", "Lip-sync", "User audio upload", "Material reference"],
    features: ["Add yourself to video", "Own voice-over", "2-person conversation", "3-person conversation", "4-person conversation", "5+ person conversation", "7-8 person conversation", "Panel / roundtable conversation", "Separate voice per person", "Realistic talking video", "Animated talking video", "Regional clothing", "Traditional outfit", "Regional environment", "Local lifestyle environment", "Local accent voice-over", "Dialect voice-over", "Cultural scene direction", "User material upload", "Uploaded user materials", "Subtitles", "Music", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Realistic UGC", "Cinematic", "Character animation", "Cinematic animation", "Documentary"],
    duration: ["10 sec", "15 sec", "30 sec", "60 sec", "2 min", "Project based"]
  },
  documentary: {
    title: "Documentary options",
    note: "Topic research, narration outline, interview map, archival visual planning, documentary background music, subtitles and delivery decisions.",
    modules: ["Documentary", "Topic research", "Narration outline", "Interview map", "Archival visual plan", "Voice-over", "Documentary background music", "User audio upload"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Social media caption", "Shorts/Reels cut", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
    style: ["Documentary", "Corporate", "Cinematic", "Editorial Document"],
    duration: ["60 sec", "2 min", "5 min", "10 min", "Episode based", "Project based"]
  },
  animation: {
    title: "Animation options",
    note: "2D, 2.5D, 3D, character, explainer, motion graphics and whiteboard animation decisions. Talking avatar, lip-sync and multi-person dialogue are handled in Advanced Talking Video.",
    modules: ["Animation video", "2D animation", "2.5D animation", "3D animation", "Character animation", "Motion graphics", "Whiteboard animation", "Explainer animation", "Script + scene plan", "Animation background music", "User audio upload"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Character", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Motion graphics", "Whiteboard animation"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  anime_short_film: {
    title: "Anime short film options",
    note: "Anime style, character setup, action/drama scene, voice-over, subtitles, music and final anime short delivery decisions. Lip-sync/talking face jobs are routed separately.",
    modules: ["Anime short film", "Anime style selection", "Character setup", "Dialogue scene", "Action scene", "Fantasy scene", "Anime background music", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Character breakdown", "Action sequence", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "ZIP source", "YouTube Shorts", "Instagram Reels"],
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Anime cinematic", "Shonen action", "Slice of life", "Fantasy anime", "Mecha anime", "Cute chibi"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "Project based"]
  },
  animal_video: {
    title: "Animal video options",
    note: "Funny, exciting, cinematic, animated or 3D animal videos with own voice-over, user music, background music and material references.",
    modules: ["Animal video", "Funny animal short", "Exciting animal scene", "Cinematic animal video", "3D animal video", "Animation video", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Character", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Funny", "Exciting", "Cinematic", "Character animation", "3D animation", "Realistic UGC"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  nature_video: {
    title: "Nature video options",
    note: "Nature, wildlife, landscape and weather videos with cinematic, documentary or atmospheric mood-matched music and narration.",
    modules: ["Nature video", "Wildlife scene", "Landscape video", "Weather atmosphere", "Documentary", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Social media caption", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
    style: ["Documentary", "Cinematic", "Realistic UGC", "Luxury product", "Motion graphics"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "5 min"]
  },
  planet_space_video: {
    title: "Planet / space video options",
    note: "Planet, galaxy, astronomy and cosmic videos with explainer narration, cinematic/3D visuals, subtitles and emotional soundtrack.",
    modules: ["Planet video", "Space explainer", "Galaxy scene", "3D space visual", "Cinematic space video", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["1080p", "1080p premium", "2K", "YouTube 16:9", "Vertical 9:16"],
    style: ["Cinematic", "3D animation", "Documentary", "Motion graphics", "Luxury product"],
    duration: ["15 sec", "30 sec", "60 sec", "2 min", "5 min"]
  },
  drone_video: {
    title: "Drone / satellite video options",
    note: "Location, route, marked-map, satellite intro, drone flyover, narration, music and subtitle decisions for aerial-style production requests.",
    modules: ["Drone-style aerial video", "AI map/location drone-style video", "Satellite-view intro", "Route/path plan", "Voice-over", "Background music direction", "User audio upload", "Material reference"],
    features: ["Scene plan", "Marked area notes", "Voice-over", "Own voice-over", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "Thumbnail", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "YouTube Shorts", "Instagram Reels", "ZIP source"],
    quality: ["1080p", "1080p premium", "YouTube 16:9", "Vertical 9:16"],
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
    note: "Long source video, dynamic promo clipping, Crelavo category showcase, quality, cinematic/neon style, presenter/avatar, voice, music, subtitles, thumbnail and social export decisions.",
    modules: ["Long film/series clipping", "Long video shortening", "Source video material", "Crelavo category showcase", "Fast dynamic promo clip", "Shorts/Reels/TikTok cuts", "Scene detection", "Hook extraction", "AI video", "Voice-over", "Background music direction", "User audio upload"],
    features: ["Long film/series clipping", "Scene detection", "Hook extraction", "Shorts/Reels cut", "Fast cuts", "Beat-synced music", "Voice-over", "Choose AI voice", "Create AI voice", "Subtitles", "Music", "Background music", "Emotion-matched music", "Thumbnail", "Cover visual", "Social media caption", "Hashtag set", "Final MP4", "Social export pack", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts", "LinkedIn", "X/Twitter", "Facebook/Meta Ads"],
    quality: ["1080p", "1080p premium", "1080p cinematic", "2K", "4K", "Vertical 9:16", "Horizontal 16:9", "Square 1:1", "YouTube 16:9"],
    style: ["Viral TikTok", "Cinematic", "Premium ad", "Neon tech", "SaaS modern", "Motion graphics", "Product demo", "Realistic UGC", "Corporate", "Luxury product", "Fun"],
    duration: ["15 sec", "30 sec", "45 sec", "60 sec", "2 min", "Project based"]
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
    quality: ["1080p", "1080p premium", "Vertical 9:16"],
    style: ["Realistic UGC", "Corporate", "Character animation"],
    duration: ["10 sec", "15 sec", "30 sec", "60 sec"]
  },
  voice_clone: {
    title: "Voice cloning options",
    note: "Voice reference material, clean vocal, clone-style narration, multilingual voice and brand voice decisions.",
    modules: ["Voice clone", "Voice reference material", "Voice-over", "Clean vocal", "Narration", "Multilingual voice"],
    features: ["Voice-over", "Clean vocal", "Multilingual dub", "Usage rules", "Revision right"],
    platforms: ["Dashboard delivery", "ZIP source", "MP4 download"],
    quality: ["1080p", "1080p premium"],
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
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
    style: ["Cinematic", "Realistic UGC", "Product demo", "Motion graphics"],
    duration: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec"]
  },
  stickman_animation: {
    title: "Stickman animation options",
    note: "Character count, sketch style, explainer/comedy/story flow and short animation delivery decisions.",
    modules: ["Animation video", "Script + scene plan", "Shorts/Reels/TikTok cuts", "Voice-over", "Animation background music", "User audio upload"],
    features: ["Script", "Scene plan", "Voice-over", "Own voice-over", "Child voices", "Subtitles", "Music", "Background music", "Emotion-matched music", "User music reference", "3 alternatives", "Revision right"],
    platforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"],
    quality: ["1080p", "Vertical 9:16", "Horizontal 16:9"],
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
    quality: ["1080p", "1080p premium", "Vertical 9:16", "Horizontal 16:9"],
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

function isAiVideoOnlyIntent(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const hasVideo = /\b(ai video|video|tanitim videosu|tanıtım videosu|promo video|promotional video|reklam videosu|mp4|voice-over|voiceover|seslendirme|altyazi|altyazı|subtitle|subtitles)\b/.test(normalized);
  const hasVideoOnlyGuard = /(not a website|not website|only ai video|ai video only|sadece ai video|yalnizca ai video|yalnızca ai video|website degil|website değil|site degil|site değil|source code degil|source code değil|zip source degil|zip source değil|admin panel degil|admin panel değil|remove website|remove zip|remove source)/.test(normalized);
  const hasProjectBuild = /(source code|kaynak kod|admin panel|zip source|website project|web sitesi projesi|site projesi)/.test(normalized) && !hasVideoOnlyGuard;
  return hasVideo && (hasVideoOnlyGuard || /\b(ai video|promo video|promotional video|tanitim videosu|tanıtım videosu|mp4)\b/.test(normalized)) && !hasProjectBuild;
}

function isCharacterDialogueAnimationPrompt(message: string) {
  const normalized = normalizeTurkishQuery(message);
  const sceneCount = (normalized.match(/sahne\s*\d+\s*:/g) ?? []).length;
  const quotedDialogueCount = (message.match(/[“\"][^”\"]{2,160}[”\"]/g) ?? []).length;
  const wantsAnimation = /animasyon|animation|çizgi film|cizgi film|cartoon|2d/.test(normalized);
  const wantsSpeech = /seslendirme|voice-over|voiceover|diyalog|dialogue|konuş|konus|subtitles|subtitle|altyaz/.test(normalized);
  const hasCharacterContinuity = /consistent characters|same character|karakter|character|dede|babaanne|torun|anne|baba|aynı görün|ayni gorun/.test(normalized);
  return wantsAnimation && wantsSpeech && hasCharacterContinuity && sceneCount >= 2 && quotedDialogueCount >= 2;
}

function cleanNegativeDurationMentions(message: string) {
  return normalizeTurkishQuery(message)
    .replace(/\b(not|degil|değil|olmasin|olmasın|istemiyorum|remove|kaldir|kaldır)\s+(\d{1,3})\s*(sn|sny|saniye|sec|second|seconds|dk|dakika|min)\b/g, " ")
    .replace(/\b(\d{1,3})\s*(sn|sny|saniye|sec|second|seconds|dk|dakika|min)\s+(degil|değil|olmasin|olmasın|istemiyorum)\b/g, " ")
    .replace(/1o/g, "10")
    .replace(/lo/g, "10");
}

function durationFromFollowUp(message: string) {
  const normalized = cleanNegativeDurationMentions(message);
  if (isCreditCostQuestion(message)) return "";
  if (/\b(fifteen\s*seconds|fifteen\s*second|on\s*bes\s*saniye|on\s*beş\s*saniye)\b/.test(normalized)) return "15 sec";
  if (/\b(10\s*dk|10\s*dakika|10\s*min)\b/.test(normalized)) return "10 min";
  if (/\b(2\s*dk|2\s*dakika|120\s*sn|120\s*sny|120\s*saniye|120\s*sec)\b/.test(normalized)) return "2 min";
  if (/\b(1\s*dk|1\s*dakika|60\s*sn|60\s*sny|60\s*saniye|60\s*sec)\b/.test(normalized)) return "60 sec";
  const minuteMatch = normalized.match(/\b(\d{1,2})\s*(dk|dakika|min)\b/);
  if (minuteMatch) return `${minuteMatch[1]} min`;
  const secondMatch = normalized.match(/\b(\d{1,3})\s*(sn|sny|saniye|sec|second|seconds)\b/);
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
  const startOnly = /^(hadi\s+)?(başlayalım|baslayalim|başla|basla|başlat|baslat|devam et|tamam başlat|tamam baslat|onaylıyorum|onayliyorum|onay veriyorum|onay verdim|evet|evet veriyorum|veriyorum|tamam veriyorum|kabul|kabul ediyorum|olur|tamam olur|tamam buyurun|buyurun sunun|sunun|üretime geç|uretime gec|evet başla|evet basla|hemen başla|hemen basla|start|start production|start production now|begin production|begin production now|confirm|confirm production|create production|create production now)$/i.test(normalized);
  const hasNewSubjectAfterHadi = /^hadi\s+\S+/.test(normalized) && !/^(hadi\s+)?(başlayalım|baslayalim|başla|basla|başlat|baslat|devam et)$/i.test(normalized);
  if (/^(selam|merhaba|hello|hi|hey|sa|slm|günaydın|gunaydin|iyi akşamlar|iyi aksamlar)\b/.test(text)) return "greeting";
  if (/^(nasılsın|nasilsin|naber|ne haber|how are you)\b/.test(text)) return "greeting";
  if (/^(sana\s+)?(bir\s+)?(şey|sey)\s+(istemek|isteyeceğim|isteyecegim|soracağım|soracagim)\s+istiyorum\.?$/.test(text)) return "greeting";
  if (hasNewSubjectAfterHadi) return "production_request";
  if (/\b(youtube|tiktok|kanal|takip|izlenme|para kazan|kazandıran|kazandiran|niş|nis|affiliate|iş ortağı|is ortagi|partner|komisyon|referral|üye|uye|kayıt|kayit|mail|email|doğrulama|dogrulama|gelmedi)\b/.test(text)) return "consultation";
  if (/\b(kod|code|bug|hata|debug|api|component|react|next|supabase|veritabanı|veritabani|sql|çözebilir misin|cozebilir misin|yardımcı olur musun|yardimci olur musun|bakabilir misin|düzeltir misin|duzeltir misin|sıkıntı|sikinti|problem|çalışmazsa|calismazsa)\b/.test(text)) return "consultation";
  if (/\b(nasıl|nasil|ne yaparsın|ne yaparsin|yardım|yardim|destek|olursa|olduğunda|oldugunda|mümkün mü|mumkun mu|yapabilir misin)\b/.test(text) && /\b(site|website|web|kod|code|hata|bug|api|supabase|react|next|sql)\b/.test(text)) return "consultation";
  if (isGeneralInformationQuestion(message)) return "consultation";
  if (startOnly || /\b(üretime geç|uretime gec|start production|start production now|begin production|begin production now|create production now|proceed to production approval)\b/.test(text)) return "start_confirmation";
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
      credits: "I will keep the credit side practical: first estimate production type and scope, then suggest whether a controlled test or full delivery makes more sense. I will not inflate unnecessary expensive features.",
      analyzed: "I analyzed your command and am moving the production flow to the next step.", failed: "Assistant request failed.", creditsRequired: "Credits required before the assistant can continue."
    }
  };
  return (copy[language] ?? copy.en)[kind] ?? copy.en[kind] ?? copy.en.default ?? "Understood.";
}

function wantsEnglishProductionLanguage(message: string) {
  return /\b(fully\s+in\s+english|final\s+video\s+must\s+be\s+fully\s+in\s+english|voiceover\s+must\s+be\s+english|on-screen\s+text\s+must\s+be\s+english|do\s+not\s+answer\s+in\s+turkish|do\s+not\s+translate\s+.*turkish|language\s*:\s*english|english\s+voiceover)\b/i.test(message);
}

function englishProductionLanguageLock() {
  return "Language lock: The production brief, script, narration, voiceover, scene plan, final prompt, and any on-screen text must be in English. Do not translate the production content into Turkish.";
}

function responseLanguage(message: string, activeLanguage = "") {
  if (wantsEnglishProductionLanguage(message)) return "en";
  return isLikelyTurkish(message, activeLanguage) ? "tr" : activeLanguage || "en";
}

function turnLanguage(message: string, activeLanguage = "") {
  if (wantsEnglishProductionLanguage(message)) return "en";
  const normalized = normalizeTurkishQuery(message);
  if (/[\u0600-\u06ff]/.test(message)) return "ar";
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message) || hasTurkishQuestionWords(normalized)) return "tr";
  if (/\b(hallo|guten|danke|bitte|warum|wie|was|wer|welche)\b/i.test(message)) return "de";
  if (/\b(hola|gracias|por que|porque|como|qué|que|recomiendas)\b/i.test(message)) return "es";
  if (/\b(bonjour|merci|pourquoi|comment|quoi|recommandes)\b/i.test(message)) return "fr";
  if (/\b(update|change|keep|remove|show|confirm|start|production|duration|seconds|english|voice|subtitle|dashboard|download|visuals|reference|style|credits)\b/i.test(message)) return "en";
  return activeLanguage || "en";
}

function matchScore(text: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function inferDynamicWizardType(message: string): DynamicWizardType {
  const text = normalizeTurkishQuery(message);
  const routeText = text
  .replace(/\b(do\s+not|don't|avoid|exclude|without)\b[^.\n]*/g, " ")
  .replace(/\b(no|not)\s+(create\s+)?(a\s+)?(video|videos|mp4|mov|avatar|presenter|voice|music|heygen|video\s*agent|storefront|product\s+catalog|cart|checkout|admin\s+panel|source\s+zip|readme)\b/g, " ");
  if (/reklam puan|ad score|performance score|video reklam puan|tiktok reklam puan/.test(text)) return "feature_tool";
  if (/sanal model|virtual model|fashion model|moda model|model stüdyosu|model studyosu/.test(text)) return "virtual_model";
  if (/kültürel yerelleştirme|kulturel yerellestirme|cultural localization|global localization|yerelleştirme|yerellestirme/.test(text)) return "localization_tool";
  if (/kampanya takvimi|campaign calendar|black friday|kara cuma|sezonluk kampanya/.test(text)) return "campaign_calendar_tool";
  if (/akademi|academy|kurs|course|ders|şablon|sablon/.test(text)) return "academy_tool";
  if (/topluluk|community showcase|showcase|vitrin|örnek stil|ornek stil|template reuse/.test(text)) return "showcase_tool";
  if (/ai ajan|yapay zeka ajan|ai influencer|sosyal medya yöneticisi|trend monitor|24\/7|24 saat|satış asistanı|satis asistani/.test(text)) return "ai_agent_wizard";
  if (/drone|uydu|satellite|harita|rota|map location|flyover/.test(text)) return "drone_wizard";
  const imageDesignIntent = /\b(banner|afiş|afis|poster|görsel|gorsel|resim|image|visual|photo|picture|png|jpg|jpeg|static\s+ad|static\s+image|single\s+image|final\s+image|social\s+media\s+post|instagram\s+post|feed\s+post|reklam görseli|reklam gorseli|sosyal medya görseli|sosyal medya gorseli|kapak|thumbnail|cover|flyer|broşür|brosur|duyuru görseli|duyuru gorseli|kampanya görseli|kampanya gorseli)\b|\b4\s*[:x]\s*5\b|\bpng\s*\/\s*jpg\b/.test(text);
  const explicitVideoIntent = /\b(video|klip|clip|reels|shorts|tiktok|youtube shorts|mp4|mov|animasyon|animation|motion|hareketli|film|teaser|trailer)\b/.test(routeText);
  if (imageDesignIntent && !explicitVideoIntent) return "image";
  if (/çöp adam|cop adam|stickman/.test(text)) return "stickman_wizard";
  if (/rakip|competitor|seo|keyword|anahtar kelime|growth intelligence|site analizi|site analiz/.test(text)) return "growth_analysis";
  if (/klip|music video|mv|şarkı|sarki|song|lyrics|lyric|3 kişilik klip|3 kisilik klip/.test(text)) return "music_video";
  if (isAiVideoOnlyIntent(message)) return "video";
  if (/avatar|konuşmalı|konusmali|lip-sync|aksan|şive|sive|kendi ses|sesim|talking|canlı satış|canli satis|live sales/.test(text)) return "talking_video";

  const durationSignal = durationFromFollowUp(message) ? 3 : 0;
  const videoScore = durationSignal + matchScore(text, [
    /\b(video|tanitim|tanıtım|promo|promotional|reklam filmi|klip|mp4|reels|shorts|tiktok|youtube shorts)\b/,
    /\b(seslendirme|voiceover|voice-over|narration|sesli)\b/,
    /\b(altyazi|altyazı|subtitle|subtitles)\b/,
    /\b(muzik|müzik|background music|fon muzik|fon müzik|cinematic|sinematik)\b/,
    /\b(hook|kanca|cta|call to action)\b/
  ]);
  const websiteScore = matchScore(text, [
    /\b(web sitesi|website project|web site|landing page|site yap|site kur|sayfa yap|domain|hosting)\b/,
    /\b(admin panel|kaynak kod|source code|zip source|checkout|contact form|üyelik|uyelik)\b/
  ]);
  const appScore = matchScore(text, [/\b(uygulama|mobil uygulama|mobile app|app yap|ios|android|expo)\b/, /\b(randevu uygulamasi|randevu uygulaması|push notification)\b/]);
  const imageScore = matchScore(text, [/\b(görsel|gorsel|resim|poster|afiş|afis|logo|thumbnail|banner|kapak)\b/]);
  const documentScore = matchScore(text, [/\b(pdf|doküman|dokuman|belge|teklif|proposal|readme)\b/]);
  const campaignScore = matchScore(text, [/\b(kampanya|ürün reklami|urun reklami|product ad|shopify|amazon|trendyol|e-?ticaret|eticaret)\b/]);

  if (videoScore >= 3 && videoScore >= websiteScore + 1 && videoScore >= appScore + 1) return "video";
  if (appScore >= 1 && appScore >= videoScore) return "mobile_app";
  if (websiteScore >= 1 && websiteScore >= videoScore) return "website";
  if (campaignScore >= 1 && campaignScore >= videoScore) return "campaign";
  if (imageScore >= 1) return "image";
  if (documentScore >= 1) return "document";
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
    if (isAiVideoOnlyIntent(message)) return "Tamam. Bunu sadece AI Video üretimi olarak hazırlıyorum: 15 saniye, 16:9 1080p, voice-over, altyazı, sinematik müzik, MP4 ve dashboard teslimi. Website, admin panel, kaynak kod ve ZIP source seçeneklerini eklemeyeceğim.";
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
  if (/credit|price|package|payment/i.test(clean)) return "I will keep the credit side practical: first estimate production type and scope, then suggest whether a controlled test or full delivery makes more sense. I will not inflate unnecessary expensive features.";
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
  const [selectedDuration, setSelectedDuration] = useState("15 sec");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["Voice-over", "Subtitles", "Music"]);
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
  const [selectedServiceNetwork, setSelectedServiceNetwork] = useState("");
  const [selectedProviderService, setSelectedProviderService] = useState("");
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState("Adult neutral voice");
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState("English");
  const [selectedCharacterProfile, setSelectedCharacterProfile] = useState("No presenter / UI-only video");
  const [selectedMusicProfile, setSelectedMusicProfile] = useState("Cinematic background music");
  const [selectedEnvironmentProfile, setSelectedEnvironmentProfile] = useState("Auto scene environment");
  const [selectedDeliveryHandoff, setSelectedDeliveryHandoff] = useState("Dashboard delivery");
  const [manualWizardOpen, setManualWizardOpen] = useState(false);
  const [manualWizardStep, setManualWizardStep] = useState(0);
  const [manualWizardCompleted, setManualWizardCompleted] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [assistantCreditState, setAssistantCreditState] = useState<AssistantCreditState>(emptyAssistantCreditState);
  const [lastOrchestratorPlan, setLastOrchestratorPlan] = useState<AssistantOrchestratorResponse | null>(null);
  const [assistantConversationId, setAssistantConversationId] = useState("");
  const [productionCreditAvailable, setProductionCreditAvailable] = useState<number | null>(null);
  const [productionCreditBalance, setProductionCreditBalance] = useState<number | null>(null);
  const [productionCreditReserved, setProductionCreditReserved] = useState<number | null>(null);
const [dynamicWizard, setDynamicWizard] = useState<DynamicWizardState>(emptyDynamicWizard);
const [startedProduction, setStartedProduction] = useState<StartedProductionState>(null);
const [productionStartingIntent, setProductionStartingIntent] = useState(false);
const [selectedExampleDirection, setSelectedExampleDirection] = useState("");
const latestAgentAction = lastOrchestratorPlan?.jobs?.[0]?.agent_action ?? null;
const hasUserVisibleProductionSelection = Boolean(
  productionBrief.trim() ||
  dynamicWizard.open ||
  productionStartingIntent ||
  startedProduction ||
  selectedProductionType !== "video" ||
  selectedQuality !== "1080p" ||
  selectedStyle !== "Cinematic" ||
    selectedDuration !== "15 sec" ||
    selectedModules.join("|") !== "AI video" ||
    selectedFeatures.join("|") !== "Voice-over|Subtitles|Music" ||
    selectedPlatforms.join("|") !== "Dashboard delivery|MP4 download" ||
  selectedProviderService ||
  selectedServiceNetwork ||
    selectedVoiceProfile !== "Adult neutral voice" ||
    selectedVoiceLanguage !== "English" ||
    selectedCharacterProfile !== "No presenter / UI-only video" ||
    selectedMusicProfile !== "Cinematic background music" ||
  selectedEnvironmentProfile !== "Auto scene environment" ||
  selectedDeliveryHandoff !== "Dashboard delivery" ||
  selectedMaterials.length ||
  uploadedMaterials.length
);
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
  const safeSelectedQuality = safeWorkQuality(selectedQuality);
  const selectionForEstimate = { input: productionBrief || input, selectedStyle, selectedQuality: safeSelectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, selectedMaterials, uploadedMaterials, quickProviderTest };
  const selectedPackageForEstimate = packageIdFromSelection(selectedTypeForEstimate, selectionForEstimate, configuredProductionPackages);
  const selectedProduction = productionTypes.find((item) => item.id === selectedProductionType);
  const selectedPackage = configuredProductionPackages.find((item) => item.id === selectedPackageForEstimate) ?? productionPackages.find((item) => item.id === selectedPackageForEstimate);
  const configuredPackageOptionsForSelectedType = configuredProductionPackages.filter((item) => item.productionType === selectedProductionType).map((item) => item.name);
  const baseCategoryProfile = categoryOptionProfiles[selectedProductionType] ?? categoryOptionProfiles.video;
  const activeCategoryProfile = configuredPackageOptionsForSelectedType.length
    ? { ...baseCategoryProfile, quality: safeWorkQualityOptions(configuredPackageOptionsForSelectedType) }
    : { ...baseCategoryProfile, quality: safeWorkQualityOptions(baseCategoryProfile.quality) };
  const promptIntentText = `${chatInput} ${input} ${productionBrief}`.toLocaleLowerCase("tr-TR");
  const promptImageDesignIntent = /\b(banner|afiş|afis|poster|görsel|gorsel|resim|reklam görseli|reklam gorseli|sosyal medya görseli|sosyal medya gorseli|kapak|thumbnail|cover|flyer|broşür|brosur|duyuru görseli|duyuru gorseli|kampanya görseli|kampanya gorseli)\b/.test(promptIntentText);
  const promptExplicitVideoIntent = /\b(video|klip|clip|reels|shorts|tiktok|youtube shorts|mp4|mov|animasyon|animation|motion|hareketli|film|teaser|trailer)\b/.test(promptIntentText);
  const promptSuggestedCategory = promptImageDesignIntent && !promptExplicitVideoIntent
    ? "image"
    : isCharacterDialogueAnimationPrompt(`${chatInput} ${input} ${productionBrief}`)
      ? "animation"
      : /(?:^|\b)(video clipping|clipping|cliping|clip çıkar|clip cikar|klip|kesit çıkar|kesit cikar|highlight çıkar|highlight cikar|uzun video|long video|hook extraction|best moments|shorts|reels|tiktok cut)(?:\b|$)/.test(promptIntentText)
      ? "video_clipping"
      : /web site|website|landing|saas site|admin panel|dashboard/.test(promptIntentText)
        ? "website"
        : /mobil|mobile app|android|ios|uygulama/.test(promptIntentText)
          ? "mobile_app"
          : /talking|konuş|konus|avatar|lip.?sync|dudak|sunucu|presenter/.test(promptIntentText)
            ? "talking_video"
            : /anime/.test(promptIntentText)
              ? "anime_short_film"
              : /animasyon|animation|2d|3d/.test(promptIntentText)
                ? "animation"
                : /kısa film|kisa film|drama|senaryo|hikaye|story/.test(promptIntentText)
                  ? "drama"
                  : "video";
  const promptOptionGroups = [
    { label: "Categories", value: productionTypes.find((item) => item.id === promptSuggestedCategory)?.label ?? selectedProduction?.label ?? "AI Video", options: Array.from(new Set([productionTypes.find((item) => item.id === promptSuggestedCategory)?.label ?? "AI Video", selectedProduction?.label ?? "AI Video", "Banner / Poster", "Image / Banner / Poster", "Advanced Talking Video", "Website", "Mobile App", "Animation", "Drama / Short Series", "Video Clipping"])).filter(Boolean), apply: (value: string) => { if (value === "Banner / Poster") { applyCategorySelection("image"); return; } const match = productionTypes.find((item) => item.label === value || item.id === value); if (match) applyCategorySelection(match.id); } },
    { label: "Quality", value: selectedQuality, options: activeCategoryProfile.quality.slice(0, 6), apply: setSelectedQuality },
    { label: "Style / Motion", value: selectedStyle, options: activeCategoryProfile.style.slice(0, 6), apply: setSelectedStyle },
    { label: "Duration / Scope", value: selectedDuration, options: activeCategoryProfile.duration.slice(0, 6), apply: setSelectedDuration },
    { label: "Modules", value: selectedModules.join(", ") || "Auto", options: activeCategoryProfile.modules.slice(0, 8), apply: (value: string) => setSelectedModules((current) => Array.from(new Set([...current, value]))) },
    { label: "Features", value: selectedFeatures.join(", ") || "None", options: activeCategoryProfile.features.slice(0, 8), apply: (value: string) => setSelectedFeatures((current) => Array.from(new Set([...current, value]))) },
    { label: "Materials", value: selectedMaterials.length || uploadedMaterials.length ? "Materials selected" : "Not uploaded", options: ["Not uploaded", "Use uploaded images", "Use product link", "Use brand kit", "Use reference video"], apply: (value: string) => { if (value !== "Not uploaded") setOptionsOpen(true); } },
    { label: "Delivery", value: selectedPlatforms.join(", ") || selectedDeliveryHandoff, options: activeCategoryProfile.platforms.slice(0, 6), apply: (value: string) => { setSelectedDeliveryHandoff(value); setSelectedPlatforms((current) => Array.from(new Set([...current, value]))); } }
  ];
  const currentAiVideoOnly = selectedProductionType === "video" && (isAiVideoOnlyIntent(`${productionBrief} ${input} ${selectedModules.join(" ")} ${selectedPlatforms.join(" ")}`) || selectedModules.join("|") === "AI video");
  const selectedCostFeatures = Array.from(new Set([...selectedFeatures, ...selectedModules]));
  const selectedOutputCount = currentAiVideoOnly ? 1 : selectedCostFeatures.includes("5 alternatives") ? 5 : selectedCostFeatures.includes("3 alternatives") ? 3 : 1;
  const selectedDurationSeconds = Number(selectedDuration.replace(/\D/g, "")) || (currentAiVideoOnly ? 15 : 30);
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
      safeSelectedQuality.toLocaleLowerCase("tr-TR").includes("4k") ? "4k_export" : null
    ].filter(Boolean)
  };
  const costEstimate = estimateProductionCost(selectedPackageForEstimate, {
    outputCount: selectedOutputCount,
    quality: safeSelectedQuality,
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
const displayedProductionBalanceText = typeof productionCreditBalance === "number" ? `${productionCreditBalance.toLocaleString()} credits` : null;
const displayedProductionReservedText = typeof productionCreditReserved === "number" ? `${productionCreditReserved.toLocaleString()} reserved · ${(availableProductionCredits ?? 0).toLocaleString()} available` : null;
  const productionCreditShortfall = hasKnownProductionCredits ? Math.max(0, costEstimate.totalCredits - (availableProductionCredits ?? 0)) : 0;
  const productionCreditInsufficient = hasKnownProductionCredits && productionCreditShortfall > 0;
  async function refreshProductionCredits() {
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) return;
    const response = await fetch(`/api/credits?user_id=${auth.user.id}&t=${Date.now()}`, {
      cache: "no-store",
      headers: { ...authHeaders(auth.accessToken), "Cache-Control": "no-cache" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.available !== "number") return;
    setProductionCreditAvailable(data.available);
    setProductionCreditBalance(typeof data.balance === "number" ? data.balance : null);
    setProductionCreditReserved(typeof data.reserved === "number" ? data.reserved : null);
    setAssistantCreditState((current) => ({
      ...current,
      productionAvailable: data.available,
      productionBalance: typeof data.balance === "number" ? data.balance : current.productionBalance,
      requiredCredits: data.available >= costEstimate.totalCredits ? null : current.requiredCredits,
      redirect: data.available >= costEstimate.totalCredits ? null : current.redirect
    }));
  }

  const quickStartBriefes = [
    { id: "qs-saas", title: "SaaS landing 15s hero", brief: "Cinematic 9:16 hero ad for a SaaS website visitor who is comparing AI video tools. Premium ad voice, English, technology background music, subtitles." },
    { id: "qs-product", title: "E-commerce product ad 15s", brief: "Cinematic 9:16 product ad for an online store. Young presenter, premium ad voice, English, cinematic background music, subtitles." },
    { id: "qs-app", title: "Mobile app teaser 15s", brief: "Cinematic 9:16 mobile app teaser. Premium ad voice, English, technology background music, subtitles." }
  ];
  const productionExampleDirections = (() => {
    const recentProductionContext = messages.slice(-12).map((item) => item.content).join(" ");
    const subjectText = `${productionBrief} ${input} ${recentProductionContext} ${selectedProduction?.label ?? selectedProductionType}`.toLocaleLowerCase("tr-TR");
    if (isAiVideoOnlyIntent(subjectText) || selectedProductionType === "video") return [
      { id: "saas-video", title: "SaaS modern", meta: "Hook + UI motion", style: "SaaS modern", modules: ["AI video"], platforms: ["Dashboard delivery", "MP4 download"] },
      { id: "cinematic-video", title: "Cinematic promo", meta: "Voice + subtitles", style: "Cinematic", modules: ["AI video"], platforms: ["Dashboard delivery", "MP4 download"] },
      { id: "premium-video", title: "Premium ad cut", meta: "Fast CTA video", style: "Premium ad", modules: ["AI video"], platforms: ["Dashboard delivery", "MP4 download"] }
    ];
    if (/site|website|web|saas|app|uygulama|admin|eticaret|e-ticaret|storefront|mağaza|magaza/.test(subjectText)) return [
      { id: "commerce-site", title: "Commerce storefront", meta: "Store + product flow", style: "E-commerce Product", modules: ["Website", "Admin panel", "Working source package"], platforms: ["Dashboard delivery", "ZIP source", "README / setup"] },
      { id: "landing-page", title: "Landing page preview", meta: "Hero + sections", style: "SaaS modern", modules: ["Website", "Admin panel"], platforms: ["Dashboard delivery", "ZIP source", "README / setup"] },
      { id: "app-flow", title: "App screen flow", meta: "Screens + source", style: "App demo", modules: ["Mobile app", "Admin panel"], platforms: ["Dashboard delivery", "ZIP source"] }
    ];
    if (/voice|ses|seslendirme|dubbing|konuşma|konusma/.test(subjectText)) return [
      { id: "warm-voice", title: "Warm narration", meta: "Voice + subtitle", style: "Corporate", modules: ["Voice-over", "Subtitles"], platforms: ["Dashboard delivery", "MP4 download"] },
      { id: "energetic-voice", title: "Energetic shorts voice", meta: "Fast social voice", style: "Viral TikTok", modules: ["Voice-over", "Music", "Subtitles"], platforms: ["TikTok", "YouTube Shorts"] },
      { id: "premium-voice", title: "Premium brand voice", meta: "Clean product narration", style: "Premium ad", modules: ["Voice-over", "Music"], platforms: ["Dashboard delivery", "MP4 download"] }
    ];
    if (/image|görsel|gorsel|photo|visual|brand|logo/.test(subjectText)) return [
      { id: "premium-visual", title: "Premium visual set", meta: "Hero + thumbnails", style: "Premium ad", modules: ["Visual/image pack", "Brand kit"], platforms: ["Dashboard delivery", "PNG images", "JPG images"] },
      { id: "social-visual", title: "Social image pack", meta: "Post + story sizes", style: "Viral TikTok", modules: ["Visual/image pack"], platforms: ["Instagram", "TikTok"] },
      { id: "clean-product", title: "Clean product demo", meta: "Product-first visuals", style: "Product demo", modules: ["Visual/image pack"], platforms: ["Dashboard delivery", "ZIP source"] }
    ];
    return [
      { id: "shorts-energy", title: "Energetic Shorts", meta: "Hook + music + subtitles", style: "Viral TikTok", modules: ["AI video", "Prompt-to-video"], platforms: ["TikTok", "YouTube Shorts", "MP4 download"] },
      { id: "cinematic-story", title: "Cinematic story", meta: "Scene plan + motion", style: "Cinematic", modules: ["AI video", "Scene plan"], platforms: ["Dashboard delivery", "MP4 download"] },
      { id: "premium-ad", title: "Premium ad cut", meta: "Product-ready video", style: "Premium ad", modules: ["Product ad video", "Campaign set"], platforms: ["Instagram", "MP4 download"] }
    ];
  })();

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
    window.localStorage.removeItem(ASSISTANT_WORKSPACE_MESSAGES_KEY);
    window.sessionStorage.removeItem(ASSISTANT_WORKSPACE_MESSAGES_KEY);
    refreshProductionCredits().catch(() => undefined);
    requireVerifiedBrowserUser().then((auth) => {
      if (!auth.ok || cancelled) return;
      fetch(`/api/assistant-chat?user_id=${auth.user.id}&fresh=1`, { headers: authHeaders(auth.accessToken) })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.conversation?.id) setAssistantConversationId(String(data.conversation.id));
        })
        .catch(() => undefined);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function syncCredits() {
      refreshProductionCredits().catch(() => undefined);
    }
    function syncCreditsWhenVisible() {
      if (document.visibilityState === "visible") syncCredits();
    }
    window.addEventListener("focus", syncCredits);
    document.addEventListener("visibilitychange", syncCreditsWhenVisible);
    window.addEventListener("clipora:credits-updated", syncCredits);
    return () => {
      window.removeEventListener("focus", syncCredits);
      document.removeEventListener("visibilitychange", syncCreditsWhenVisible);
      window.removeEventListener("clipora:credits-updated", syncCredits);
    };
  }, [costEstimate.totalCredits]);

  useEffect(() => {
    if (messages.length) {
      const cleanedMessages = cleanAssistantMessages(messages);
      window.sessionStorage.setItem(ASSISTANT_WORKSPACE_MESSAGES_KEY, JSON.stringify(cleanedMessages.slice(-200)));
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
    setQuickProviderTest(true);
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

  function selectProductionExampleDirection(direction: { id: string; title: string; meta: string; style: string; modules: string[]; platforms: string[] }) {
    setSelectedExampleDirection(direction.id);
    setSelectedStyle(direction.style);
    if (selectedProductionType === "video" || isAiVideoOnlyIntent(`${productionBrief} ${input}`)) {
      setSelectedModules(["AI video"]);
      setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
      setSelectedFeatures((current) => Array.from(new Set(current.filter((item) => !/source|zip|admin|website/i.test(item)).concat(["Voice-over", "Subtitles", "Music"]))));
      setSelectedDuration((current) => current === "30 sec" || current === "Project based" ? "15 sec" : current);
    } else {
      setSelectedModules((current) => Array.from(new Set([...current, ...direction.modules])));
      setSelectedPlatforms((current) => Array.from(new Set([...current, ...direction.platforms])));
    }
    setProductionStartingIntent(false);
    setStatus(activeLanguage === "tr" ? `${direction.title} örneği seçildi. Onay verdiğinde üretim başlatma adımına geçilecek.` : `${direction.title} direction selected. Confirm when you are ready to start production.`);
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
      setSelectedFeatures(["Script", "Scene plan", "Voice-over", "Subtitles", "Music"]);
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
  if (question.id === "visualStyle" || question.id === "style") setSelectedStyle(option);
  if (question.id === "people") setSelectedFeatures((current) => current.includes(option) ? current : [...current, option]);
  if (question.id === "selfIncluded") { setSelectedFeatures((current) => current.includes(option) ? current : [...current, option]); if (option !== "No self footage") setUploadPurpose("self_avatar"); }
  if (question.id === "characterCreation") setSelectedModules((current) => current.includes(option) ? current : [...current, option]);
  if (question.id === "voiceProfile" || question.id === "voice") { setSelectedVoiceProfile(option); setSelectedFeatures((current) => option === "No voice-over" ? current.filter((item) => !/voice/i.test(item)) : Array.from(new Set([...current, option, "Voice-over"]))); }
  if (question.id === "environment") setSelectedEnvironmentProfile(option);
  if (question.id === "musicSource") { setSelectedMusicProfile(option); setSelectedFeatures((current) => option === "No new music" ? current : Array.from(new Set([...current, "Music", option]))); }
  if (question.id === "platform" || question.id === "channels") setSelectedPlatforms((current) => current.includes(option) ? current : [...current, option]);
  if (question.id === "extras" || question.id === "delivery" || question.id === "appFeatures" || question.id === "assets" || question.id === "videoStructure" || question.id === "sources" || question.id === "reportScope" || question.id === "subjectWorld" || question.id === "timeMood" || question.id === "commerceInput" || question.id === "commerceAsset" || question.id === "adScoreInput" || question.id === "modelOutput" || question.id === "productType" || question.id === "modelStyle" || question.id === "localizationType" || question.id === "market" || question.id === "adaptation" || question.id === "calendarType" || question.id === "calendarScope" || question.id === "academyOutput" || question.id === "topic" || question.id === "showcaseUse" || question.id === "reuseScope" || question.id === "agentType" || question.id === "operationHours" || question.id === "personality" || question.id === "droneInput" || question.id === "droneMotion" || question.id === "stickmanType") setSelectedFeatures((current) => current.includes(option) ? current : [...current, option]);
    if (question.id === "siteType" && option === "Restaurant / cafe") setSelectedModules((current) => current.includes("Website") ? current : [...current, "Website"]);
    if (question.id === "videoType" && option === "Restaurant / food video") setSelectedStyle("Product demo");
  if (question.id === "videoType" && ["Short film", "Series / episode", "Trailer"].includes(option)) { setSelectedProductionType(option === "Series / episode" ? "drama" : "studio"); setSelectedModules((current) => Array.from(new Set([...current, "Script + scene plan", "Character breakdown"]))); }
  if (question.id === "avatarType" && /e-commerce|live sales/i.test(option)) setSelectedProductionType(option.includes("live") ? "live_sales_agent" : "avatar");
  if (question.id === "clipType") setSelectedProductionType("music_video");
  if (question.id === "analysisType") { setSelectedProductionType("document_pack"); setSelectedModules((current) => Array.from(new Set([...current, "Growth Intelligence report", option]))); setSelectedPlatforms((current) => current.includes("Dashboard delivery") ? current : [...current, "Dashboard delivery"]); }
if (dynamicWizard.type === "feature_tool") { setSelectedProductionType("ad_score_checker"); setSelectedModules((current) => Array.from(new Set([...current, "AI ad score checker"]))); }
if (dynamicWizard.type === "virtual_model") { setSelectedProductionType("virtual_model_studio"); setSelectedModules((current) => Array.from(new Set([...current, "AI virtual model studio"]))); }
if (dynamicWizard.type === "localization_tool") { setSelectedProductionType("cultural_localization"); setSelectedModules((current) => Array.from(new Set([...current, "Cultural localization", "Localized creative brief"]))); }
if (dynamicWizard.type === "campaign_calendar_tool") { setSelectedProductionType("campaign_calendar"); setSelectedModules((current) => Array.from(new Set([...current, "Campaign calendar", "Campaign asset plan"]))); }
if (dynamicWizard.type === "academy_tool") { setSelectedProductionType("crelavo_academy"); setSelectedModules((current) => Array.from(new Set([...current, "Crelavo Academy", "Template pack"]))); }
if (dynamicWizard.type === "showcase_tool") { setSelectedProductionType("community_showcase"); setSelectedModules((current) => Array.from(new Set([...current, "Community showcase", "Template reuse"]))); }
if (dynamicWizard.type === "ai_agent_wizard") { setSelectedProductionType("ai_agent"); setSelectedModules((current) => Array.from(new Set([...current, "AI influencer", "Daily social manager", "Approval flow"]))); }
if (dynamicWizard.type === "drone_wizard") { setSelectedProductionType("drone_video"); setSelectedModules((current) => Array.from(new Set([...current, "Drone-style aerial video", "AI map/location drone-style video"]))); }
if (dynamicWizard.type === "stickman_wizard") { setSelectedProductionType("stickman_animation"); setSelectedModules((current) => Array.from(new Set([...current, "Stickman animation", "Storyboard"]))); }
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
    setSelectedQuality("1080p");
    setSelectedStyle("Cinematic animation");
    setSelectedDuration("10 sec");
    setSelectedModules(["AI video"]);
    setSelectedFeatures(["1 alternative", "Premium MP4 output"]);
    setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
    setQuickProviderTest(false);
    setInput("Produce a polished 10-second AI video in a cinematic animation style for a provider smoke test.");
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
    setSelectedQuality("1080p");
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

  function clearProductionChat() {
    setMessages([{ role: "assistant", content: activeLanguage === "tr" ? "Chat temizlendi. Ne üretmek istediğini yaz." : "Chat cleared. Describe what you want to create." }]);
    setProductionBrief("");
    setInput("");
    setChatInput("");
    setDynamicWizard(emptyDynamicWizard);
    setOptionsOpen(false);
    setProductionStartingIntent(false);
    setStartModalOpen(false);
    setStartError("");
    setSelectedServiceNetwork("");
    setSelectedProviderService("");
    setSelectedVoiceProfile("Adult neutral voice");
    setSelectedVoiceLanguage("English");
    setSelectedMusicProfile("Cinematic background music");
    setSelectedEnvironmentProfile("Auto scene environment");
    setSelectedDeliveryHandoff("Dashboard delivery");
    setManualWizardOpen(false);
    setManualWizardStep(0);
  }

  function applyCategorySelection(type: string) {
    const label = productionTypes.find((item) => item.id === type)?.label ?? type;
    applyGeneralProductionPreset(type, input.trim() || label);
    setOptionsOpen(true);
  }

  function applyAiVideoOnlyPreset(idea: string) {
    setQuickProviderTest(false);
    setDynamicWizard(emptyDynamicWizard);
    setSelectedProductionType("video");
    setSelectedQuality(/4k|ultra/i.test(idea) ? "4K" : "1080p");
    setSelectedStyle(/saas|startup|premium/i.test(idea) ? "SaaS modern" : /cinematic|sinematik/i.test(idea) ? "Cinematic" : "SaaS modern");
    setSelectedDuration(durationFromFollowUp(idea) || "15 sec");
    setSelectedModules(["AI video"]);
    setSelectedFeatures(Array.from(new Set([
      /voice|voice-over|voiceover|seslendirme|sesli/i.test(idea) ? "Voice-over" : "Voice-over",
      /subtitle|subtitles|altyazı|altyazi/i.test(idea) ? "Subtitles" : "Subtitles",
      /music|müzik|muzik|background music|fon müzik|fon muzik/i.test(idea) ? "Music" : "Music"
    ])));
    setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
    setOptionsOpen(false);
    setProductionStartingIntent(true);
  }

  function applyAssistantSuggestion(suggestion: AssistantSuggestion, idea: string, plan?: AssistantPlan) {
    const suggestedText = `${idea} ${suggestion.suggestedPrompt ?? ""}`;
    const inferredType = inferDynamicWizardType(suggestedText);
    const forcedVideoOnly = isAiVideoOnlyIntent(suggestedText) || inferredType === "video" && durationFromFollowUp(suggestedText) && /voice|voiceover|voice-over|seslendirme|subtitle|subtitles|altyazı|altyazi|mp4|tanitim|tanıtım|promo|cinematic|sinematik/i.test(suggestedText);
    const type = forcedVideoOnly ? "video" : productionTypeFromAssistantCategory(plan?.production_type ?? suggestion.category);
    forcedVideoOnly ? applyAiVideoOnlyPreset(suggestion.suggestedPrompt || idea) : applyGeneralProductionPreset(type, suggestion.suggestedPrompt || idea);
  if (forcedVideoOnly) {
    if (plan?.selected_style || suggestion.style) setSelectedStyle(plan?.selected_style ?? suggestion.style ?? "SaaS modern");
    if (plan?.selected_quality || suggestion.quality) setSelectedQuality(safeWorkQuality(plan?.selected_quality ?? suggestion.quality));
  } else {
    if (plan?.selected_style || suggestion.style) setSelectedStyle(plan?.selected_style ?? suggestion.style ?? "Corporate");
    if (plan?.selected_quality || suggestion.quality) setSelectedQuality(safeWorkQuality(plan?.selected_quality ?? suggestion.quality));
    if (plan?.selected_duration || suggestion.duration) setSelectedDuration(plan?.selected_duration ?? suggestion.duration ?? "30 sec");
    if (Array.isArray(plan?.selected_modules) && plan.selected_modules.length) setSelectedModules(plan.selected_modules);
    if (Array.isArray(plan?.selected_features) && plan.selected_features.length) setSelectedFeatures(plan.selected_features);
    if (Array.isArray(plan?.selected_platforms) && plan.selected_platforms.length) setSelectedPlatforms(plan.selected_platforms);
  }
    if (plan?.provider_route && plan.provider_route !== "auto") { setSelectedServiceNetwork("video"); setSelectedProviderService(plan.provider_route); }
    if (plan?.voice_profile) setSelectedVoiceProfile(plan.voice_profile);
    if (plan?.voice_language) setSelectedVoiceLanguage(plan.voice_language);
    if (plan?.music_profile) setSelectedMusicProfile(plan.music_profile);
    if (plan?.environment_profile) setSelectedEnvironmentProfile(plan.environment_profile);
    if (plan?.delivery_handoff) setSelectedDeliveryHandoff(plan.delivery_handoff);
    setOptionsOpen(false);
  }

  function applyOrchestratorPlan(orchestrator: AssistantOrchestratorResponse, idea: string) {
    const firstJob = Array.isArray(orchestrator.jobs) ? orchestrator.jobs[0] : null;
    if (!firstJob) return;
  const jobText = `${idea} ${firstJob.brief ?? ""}`;
  const inferredType = inferDynamicWizardType(jobText);
  const forcedVideoOnly = isAiVideoOnlyIntent(jobText) || inferredType === "video" && durationFromFollowUp(jobText) && /voice|voiceover|voice-over|seslendirme|subtitle|subtitles|altyazı|altyazi|mp4|tanitim|tanıtım|promo|cinematic|sinematik/i.test(jobText);
  const type = forcedVideoOnly ? "video" : productionTypeFromAssistantCategory(firstJob.type ?? "video");
  forcedVideoOnly ? applyAiVideoOnlyPreset(firstJob.brief || idea) : applyGeneralProductionPreset(type, firstJob.brief || idea);
  if (forcedVideoOnly) {
    if (firstJob.selected_style) setSelectedStyle(firstJob.selected_style);
    if (firstJob.selected_quality) setSelectedQuality(safeWorkQuality(firstJob.selected_quality));
  } else {
    if (firstJob.selected_style) setSelectedStyle(firstJob.selected_style);
    if (firstJob.selected_quality) setSelectedQuality(safeWorkQuality(firstJob.selected_quality));
    if (firstJob.selected_duration) setSelectedDuration(firstJob.selected_duration);
    if (Array.isArray(firstJob.selected_modules) && firstJob.selected_modules.length) setSelectedModules(firstJob.selected_modules);
    if (Array.isArray(firstJob.selected_features) && firstJob.selected_features.length) setSelectedFeatures(firstJob.selected_features);
    if (Array.isArray(firstJob.selected_platforms) && firstJob.selected_platforms.length) setSelectedPlatforms(firstJob.selected_platforms);
  }
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
    setDynamicWizard(emptyDynamicWizard);
    const commerceProject = type === "website" && isCommerceProjectIdea(idea);
    const growthIntelligenceProject = type === "document_pack" && /growth intelligence|rakip|competitor|pazar istihbarat|market intelligence|fiyat takibi|pricing changes|ad library|haftalık rapor|weekly report/i.test(idea);
    setSelectedProductionType(type);
    setSelectedQuality(growthIntelligenceProject ? "Monthly service plan" : type === "image" || type === "video" ? "1080p" : "1080p premium");
    setSelectedStyle(growthIntelligenceProject ? "Growth Intelligence service" : commerceProject ? "E-commerce Product" : type === "saas" ? "SaaS modern" : type === "mobile_app" ? "App demo" : type === "campaign" ? "Premium ad" : type === "video" ? (/saas|startup|premium/i.test(idea) ? "SaaS modern" : "Cinematic") : type === "documentary" ? "Documentary" : type === "drone_video" ? "Cinematic" : type === "live_sales_agent" ? "Friendly sales host" : type === "drama" ? "Short drama" : type === "stickman_animation" ? "Stickman animation" : type === "anime_short_film" ? "Anime cinematic" : "Corporate");
    setSelectedDuration(growthIntelligenceProject ? "Monthly monitoring" : ["website", "saas", "mobile_app", "admin_project", "image", "brand_kit", "document_pack"].includes(type) ? "Project based" : type === "documentary" ? "2 min" : type === "drone_video" ? "60 sec" : type === "live_sales_agent" ? "10h/month fair use" : type === "drama" ? "Scene 1-3 min" : type === "video" ? (durationFromFollowUp(idea) || "15 sec") : "30 sec");
    setSelectedModules(growthIntelligenceProject ? ["Growth Intelligence brief", "Competitor monitoring", "Weekly executive report", "Campaign response actions"] : commerceProject ? ["Website", "E-commerce product pack", "Marketplace listing", "Admin panel"] : type === "website" ? ["Website", "Visual/image pack"] : type === "saas" ? ["SaaS screen", "Admin panel"] : type === "mobile_app" ? ["Mobile app", "Admin panel"] : type === "admin_project" ? ["Admin panel"] : type === "brand_kit" ? ["Brand kit"] : type === "document_pack" ? ["PDF/document"] : type === "image" ? ["Visual/image pack"] : type === "ai_agent" ? ["AI video", "Brand kit"] : type === "campaign" ? ["Shopify product link", "Amazon product link", "Trendyol product link", "Product ad video"] : type === "documentary" ? ["Documentary", "Topic research", "Narration outline", "Archival visual plan", "Voice-over"] : type === "drone_video" ? ["Drone-style aerial video", "AI map/location drone-style video", "Voice-over", "Background music direction"] : type === "live_sales_agent" ? ["AI live sales agent", "Product link selling", "Live chat reply agent", "Avatar host persona", "Voice selection", "User audio upload", "Visual/image pack"] : type === "drama" ? ["Drama / short series", "Script + scene plan", "Character breakdown", "AI video", "Voice-over"] : ["AI video"]);
    setSelectedFeatures(growthIntelligenceProject ? ["Public-signal monitoring", "Weekly executive PDF", "Alert channel plan", "Campaign response actions"] : commerceProject ? ["Production package", "Source file delivery", "Final ZIP", "README", "Revision right"] : type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? ["Production package", "Source file delivery", "Final ZIP", "README", "Revision right"] : type === "campaign" ? ["A/B hook", "Social media caption", "Hashtag set", "Shorts/Reels cut"] : type === "video" ? ["Voice-over", "Subtitles", "Music"] : type === "localization" ? ["Voice-over", "Subtitles", "Scene plan"] : type === "documentary" ? ["Script", "Scene plan", "Voice-over", "Subtitles", "Music", "Revision right"] : type === "drone_video" ? ["Scene plan", "Marked area notes", "Voice-over", "Subtitles", "Music", "Revision right"] : type === "live_sales_agent" ? ["Sales script", "Live FAQ", "Objection handling", "CTA/discount playbook", "Choose AI voice", "Photo/avatar input", "Subtitles", "Compliance review", "Revision right"] : type === "drama" ? ["Script", "Scene plan", "Character breakdown", "Dialogue", "Voice-over", "Subtitles", "Music", "Revision right"] : ["Revision right"]);
    setSelectedPlatforms(growthIntelligenceProject ? ["Growth Intelligence dashboard", "Email report", "Slack/email alerts"] : commerceProject ? ["Dashboard delivery", "ZIP source", "Shopify", "WooCommerce"] : type === "website" || type === "saas" || type === "mobile_app" || type === "admin_project" ? ["Dashboard delivery", "ZIP source"] : type === "campaign" ? ["Dashboard delivery", "TikTok", "Shopify", "Amazon", "Trendyol"] : type === "documentary" ? ["Dashboard delivery", "MP4 download", "YouTube Shorts", "ZIP source"] : type === "live_sales_agent" ? ["TikTok Live", "YouTube Live"] : type === "drama" ? ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"] : ["Dashboard delivery", "MP4 download"]);
    const profile = categoryOptionProfiles[type];
    const configuredQualityOptions = configuredProductionPackages.filter((item) => item.productionType === type).map((item) => item.name);
    if (profile && !commerceProject && !["website", "saas", "mobile_app", "admin_project", "brand_kit", "document_pack", "image", "campaign", "video"].includes(type)) {
      setSelectedQuality(safeWorkQuality(configuredQualityOptions[0] ?? profile.quality[0]));
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

  const isManualAiVideoFlow = selectedProductionType === "video";
  const characterStepCopy = (() => {
    if (["drama", "studio", "anime_short_film", "animation", "stickman_animation"].includes(selectedProductionType)) {
      return {
        title: "Oyuncu / Karakter",
        subtitle: "Hikâyede oyuncu veya ana karakter olacak mı?",
        summaryLabel: "Oyuncu/karakter",
        options: ["Yok — sadece sahne / ortam", "Ana karakter", "Kadın oyuncu", "Erkek oyuncu", "Çocuk karakter", "Yaşlı karakter", "Çoklu karakter", "Maskot / yaratık"]
      };
    }
    if (["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(selectedProductionType)) {
      return {
        title: "Sunucu / Avatar",
        subtitle: "Ekranda konuşacak kişi veya avatarı seç.",
        summaryLabel: "Sunucu/avatar",
        options: ["Kadın sunucu", "Erkek sunucu", "AI avatar", "Kendi fotoğrafımı konuştur", "Çoklu konuşmacı / panel", "Satış temsilcisi avatarı"]
      };
    }
    if (["documentary"].includes(selectedProductionType)) {
      return {
        title: "Anlatıcı / Röportaj",
        subtitle: "Belgeselde görünen anlatıcı/röportaj kişisi olsun mu?",
        summaryLabel: "Anlatıcı/röportaj",
        options: ["Yok — sadece görüntü + dış ses", "Anlatıcı görünsün", "Röportaj kişisi", "Uzman konuşmacı", "Saha muhabiri"]
      };
    }
    return {
      title: "Konuşan kişi / avatar",
      subtitle: "Videoda konuşan kişi seçersen dudak senkronlu talking video hattı kullanılır. Sadece ürün/ekran/sahne için ilk seçeneği seç.",
      summaryLabel: "Konuşan kişi/avatar",
      options: ["Yok — sadece ürün / ekran / sahne videosu", "Kadın sunucu", "Erkek sunucu", "AI avatar", "Kendi fotoğrafımı konuştur", "Çoklu konuşmacı / panel", "Marka maskotu"]
    };
  })();
  const isNoPresenterSelection = (value: string) => /no presenter|ui-only|yok|sadece ürün|sadece urun|sadece sahne|sadece ekran|sadece görüntü|sadece goruntu/i.test(value);
  const defaultManualWizardSteps = [
    { id: "category", title: "Kategori", subtitle: "Önce üretimin ana kategorisini seç.", options: productionTypes.map((item) => item.label), value: selectedProduction?.label ?? selectedProductionType, apply: (value: string) => { const match = productionTypes.find((item) => item.label === value || item.id === value); if (match) setSelectedProductionType(match.id); } },
    { id: "modules", title: "Ana modüller", subtitle: "Bu kategori için üretilecek ana parçaları seç.", options: activeCategoryProfile.modules.length ? activeCategoryProfile.modules : ["Production package"], value: selectedModules[0] ?? "Production package", apply: (value: string) => setSelectedModules((current) => Array.from(new Set([...current, value]))) },
    { id: "features", title: "Ek özellikler", subtitle: "Ses, altyazı, revizyon veya teslimat eklerini seç.", options: activeCategoryProfile.features.length ? activeCategoryProfile.features : ["Final ZIP", "Revision right"], value: selectedFeatures[0] ?? "Auto", apply: (value: string) => setSelectedFeatures((current) => Array.from(new Set([...current, value]))) },
    { id: "style", title: "Stil", subtitle: "Görsel/yaratıcı yönü seç.", options: activeCategoryProfile.style.length ? activeCategoryProfile.style : ["SaaS modern", "Cinematic", "Premium ad"], value: selectedStyle, apply: setSelectedStyle },
    { id: "quality", title: "Kalite ve oran", subtitle: "Çözünürlük / platform oranı.", options: activeCategoryProfile.quality, value: selectedQuality, apply: (value: string) => { setQuickProviderTest(false); setSelectedQuality(value); } },
    { id: "duration", title: "Süre", subtitle: "Üretim süresini seç.", options: Array.from(new Set([...activeCategoryProfile.duration, "40 sec"])), value: selectedDuration, apply: (value: string) => { setQuickProviderTest(false); setSelectedDuration(value); } },
    { id: "delivery", title: "Teslim", subtitle: "Son dosya ve yönlendirme.", options: activeCategoryProfile.platforms.length ? activeCategoryProfile.platforms : ["Dashboard delivery"], value: selectedDeliveryHandoff, apply: (value: string) => { setSelectedDeliveryHandoff(value); setSelectedPlatforms((current) => Array.from(new Set([...current, value]))); } }
  ];
  const aiVideoWizardSteps = [
    { id: "category", title: "Kategori", subtitle: "Yapay Zeka Videosu seçili. İstersen farklı kategoriye geçebilirsin.", options: productionTypes.map((item) => item.label), value: selectedProduction?.label ?? selectedProductionType, apply: (value: string) => { const match = productionTypes.find((item) => item.label === value || item.id === value); if (match) setSelectedProductionType(match.id); } },
    { id: "character", title: characterStepCopy.title, subtitle: characterStepCopy.subtitle, options: characterStepCopy.options, value: selectedCharacterProfile, apply: setSelectedCharacterProfile },
    { id: "voice", title: "Seslendirme", subtitle: "Ses tarzını seç.", options: ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Energetic sales voice", "Professional SaaS narrator", "Calm documentary voice", "Premium ad voice"], value: selectedVoiceProfile, apply: (value: string) => { setSelectedVoiceProfile(value); setSelectedFeatures((current) => value === "No voice-over" ? current.filter((item) => !/voice/i.test(item)) : Array.from(new Set([...current, "Voice-over"]))); } },
    { id: "language", title: "Seslendirme dili", subtitle: "Voice-over ve altyazı dilini seç.", options: ["English", "Turkish", "German", "French", "Spanish", "Arabic", "Multi-language"], value: selectedVoiceLanguage, apply: setSelectedVoiceLanguage },
    { id: "environment", title: "Arka plan / Sahne", subtitle: "Videonun ana görsel ortamını seç.", options: ["Website visitor + AI chat scene", "Office / SaaS dashboard", "Product UI screens", "Studio background", "Clean abstract tech background", "Green screen / clean background"], value: selectedEnvironmentProfile, apply: setSelectedEnvironmentProfile },
    { id: "music", title: "Arka fon müziği", subtitle: "Müzik olsun mu, hangi ruh halinde olsun?", options: ["No music", "Cinematic background music", "Energetic ad music", "Calm ambient music", "Luxury brand music", "Technology SaaS music"], value: selectedMusicProfile, apply: (value: string) => { setSelectedMusicProfile(value); setSelectedFeatures((current) => value === "No music" ? current.filter((item) => !/music/i.test(item)) : Array.from(new Set([...current, "Music"]))); } },
    { id: "style", title: "Görsel stil", subtitle: "Video dili ve tempo seçimi.", options: ["SaaS modern", "Cinematic", "Premium ad", "Fast CTA video"], value: selectedStyle, apply: setSelectedStyle },
    { id: "quality", title: "Kalite ve oran", subtitle: "Kalite / platform formatını seç.", options: activeCategoryProfile.quality, value: selectedQuality, apply: (value: string) => { setQuickProviderTest(false); setSelectedQuality(value); } },
    { id: "duration", title: "Süre", subtitle: "Video süresini seç.", options: ["5 sec", "10 sec", "15 sec", "30 sec", "60 sec", "2 min"], value: selectedDuration, apply: (value: string) => { setQuickProviderTest(false); setSelectedDuration(value); } },
    { id: "delivery", title: "Teslim", subtitle: "Final dosya ve platform çıktısını seç.", options: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"], value: selectedDeliveryHandoff, apply: (value: string) => { setSelectedDeliveryHandoff(value); setSelectedPlatforms((current) => Array.from(new Set([...current, value]))); } }
  ];
  const manualWizardSteps = isManualAiVideoFlow ? aiVideoWizardSteps : defaultManualWizardSteps;
  const currentManualWizardStep = manualWizardSteps[Math.min(manualWizardStep, manualWizardSteps.length - 1)] ?? manualWizardSteps[0];

  function selectedOptionSummary() {
    const materialNames = materials.filter((material) => selectedMaterials.includes(material.id)).map((material) => material.title);
    const uploadNames = uploadedMaterials.map((material) => `${material.title} (${material.kind})`);
    const productionLabel = productionTypes.find((item) => item.id === selectedProductionType)?.label ?? selectedProductionType;
    const wizardLines: string[] = [];
    return [
`Production category: ${productionLabel}`,
...wizardLines,
`Quality/format: ${selectedQuality}`,
  `Style/type: ${selectedStyle}`,
  `Duration: ${selectedDuration}`,
  `Production modules: ${selectedModules.join(", ") || "Auto"}`,
  `Extra features: ${selectedFeatures.join(", ") || "None"}`,
  `Delivery/platform: ${selectedPlatforms.join(", ") || "Dashboard"}`,
  `Provider routing: Automatic by selected media type`,
  `Character/presenter: ${selectedCharacterProfile}`,
  `Voice profile: ${selectedVoiceProfile}`,
  `Voice language: ${selectedVoiceLanguage}`,
  `Music profile: ${selectedMusicProfile}`,
  `Environment/profile: ${selectedEnvironmentProfile}`,
  `Delivery handoff: ${selectedDeliveryHandoff}`,
  `Crelavo material library: ${materialNames.length ? materialNames.join(", ") : "Not selected"}`,
  `Uploaded user materials: ${uploadNames.length ? uploadNames.join(", ") : "Not uploaded"}`
    ].join("\n");
  }

  function productionTypeFromSelection() {
    const moduleText = selectedModules.join(" ").toLowerCase();
    const featureText = selectedFeatures.join(" ").toLowerCase();
    const characterText = selectedCharacterProfile.toLowerCase();
    const briefText = `${productionBrief} ${input}`.toLocaleLowerCase("tr-TR");
    const styleText = selectedStyle.toLowerCase();
    const rawBriefText = `${productionBrief} ${input}`;
    const text = `${moduleText} ${featureText} ${characterText} ${briefText} ${styleText}`;
    const characterDialogueAnimation = isCharacterDialogueAnimationPrompt(rawBriefText);
const wantsClipping = !characterDialogueAnimation && /clipping|clip çıkar|clip cikar|kesit çıkar|kesit cikar|highlight çıkar|highlight cikar|long video|uzun video|tiktok cut|best moments|komik an|korku|scary|exciting moments|hook extraction/.test(text);
if (characterDialogueAnimation || selectedProductionType === "animation") return "animation";
if (wantsClipping || selectedProductionType === "video_clipping") return "video_clipping";
    const routeText = text
  .replace(/\b(do\s+not|don't|avoid|exclude|without)\b[^.\n]*/g, " ")
  .replace(/\b(no|not)\s+(create\s+)?(a\s+)?(video|videos|mp4|mov|avatar|presenter|voice|music|heygen|video\s*agent|storefront|product\s+catalog|cart|checkout|admin\s+panel|source\s+zip|readme)\b/g, " ");
    const imageDesignIntent = /\b(banner|afiş|afis|poster|görsel|gorsel|resim|image|visual|photo|picture|png|jpg|jpeg|static\s+ad|static\s+image|single\s+image|final\s+image|social\s+media\s+post|instagram\s+post|feed\s+post|reklam görseli|reklam gorseli|sosyal medya görseli|sosyal medya gorseli|kapak|thumbnail|cover|flyer|broşür|brosur|duyuru görseli|duyuru gorseli|kampanya görseli|kampanya gorseli)\b|\b4\s*[:x]\s*5\b|\bpng\s*\/\s*jpg\b/.test(text);
    const explicitVideoIntent = /\b(video|klip|clip|reels|shorts|tiktok|youtube shorts|mp4|mov|animasyon|animation|motion|hareketli|film|teaser|trailer)\b/.test(routeText);
    if (selectedProductionType === "image" || (imageDesignIntent && !explicitVideoIntent)) return "image";
    const hasPresenter = selectedCharacterProfile !== "No presenter / UI-only video";
    const explicitSpeakingRequest = /talking|konuş|konus|sunucu|presenter|avatar|lip-sync|lip sync|dudak|röportaj|roportaj|diyalog|dialogue|testimonial|self-in-video|add yourself|multi-person|conversation|panel/.test(`${moduleText} ${featureText} ${briefText} ${styleText}`);
    const selectedTalkingCategory = ["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(selectedProductionType);
    const wantsSynchronizedSpeaking = !characterDialogueAnimation && (hasPresenter || explicitSpeakingRequest || (selectedTalkingCategory && hasPresenter));
    if (wantsSynchronizedSpeaking) return "talking_video";
    if (selectedTalkingCategory && !hasPresenter) return "video";
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

  function openManualWizard() {
    setManualWizardOpen(true);
    setManualWizardStep(0);
  }

  function completeManualWizardAndOpenStart() {
    setManualWizardCompleted(true);
    setManualWizardOpen(false);
    setProductionStartingIntent(true);
    setStartError("");
    setStartState("idle");
    setStartModalOpen(true);
  }

  function openStartProductionModal() {
    if (!manualWizardCompleted) {
      openManualWizard();
      return;
    }
    const selectedProductionFallback = selectedProduction ? `${String((selectedProduction as { description?: string; label?: string }).description ?? "")} ${String((selectedProduction as { description?: string; label?: string }).label ?? "")}`.trim() : "";
    const existingBrief = productionBrief.trim() || input.trim() || selectedProductionFallback || "Assistant workspace production";
    setProductionBrief((current) => current.trim() ? current : existingBrief);
    setProductionStartingIntent(true);
    setStartError("");
    setStartState("idle");
    setStartModalOpen(true);
  }

  async function startProduction() {
    const clean = productionBrief.trim() || input.trim() || "Assistant workspace production";
    const productionType = productionTypeFromSelection();
    const characterLine = selectedCharacterProfile && selectedCharacterProfile !== "No presenter / UI-only video" ? `\nCharacter/presenter: ${selectedCharacterProfile}` : "\nCharacter/presenter: No presenter / UI-only video";
    const selectionInput = `${productionBrief || input}${characterLine}`;
    const selection = { input: selectionInput, selectedStyle, selectedQuality: safeSelectedQuality, selectedDuration, selectedModules, selectedFeatures, selectedPlatforms, selectedMaterials, uploadedMaterials, quickProviderTest, selectedServiceNetwork, selectedProviderService, selectedVoiceProfile, selectedVoiceLanguage, selectedMusicProfile, selectedEnvironmentProfile, selectedDeliveryHandoff };
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
    const mustPreserveEnglishProductionText = productionBrief.includes("Language lock:") || wantsEnglishProductionLanguage(productionBrief) || wantsEnglishProductionLanguage(clean) || wantsEnglishProductionLanguage(String(orchestratorPayload?.prompt ?? ""));
    const preservedPrompt = mustPreserveEnglishProductionText ? fallbackPayload.prompt : String(orchestratorPayload?.prompt ?? fallbackPayload.prompt);
    const productionPayload = orchestratorPayload ? {
      ...fallbackPayload,
      ...orchestratorPayload,
      user_id: auth.user.id,
      user_email: auth.user.email ?? "",
      production_type: String(orchestratorPayload.production_type ?? fallbackPayload.production_type),
      package_id: String(orchestratorPayload.package_id ?? fallbackPayload.package_id),
      title: String(orchestratorPayload.title ?? fallbackPayload.title),
      prompt: preservedPrompt,
      project_details: mustPreserveEnglishProductionText ? `${preservedPrompt}\n\nProduction options:\n${selectedOptionSummary()}\n\nEnglish production text preservation: user requested English production content; do not translate the brief, script, narration, scene plan, final prompt, voiceover, or on-screen text.` : String(orchestratorPayload.project_details ?? fallbackPayload.project_details ?? preservedPrompt),
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

    if (selectedServiceNetwork || selectedProviderService) {
      const payloadRecord = productionPayload as Record<string, unknown>;
      const existingAgentAction = payloadRecord.agent_action && typeof payloadRecord.agent_action === "object" ? payloadRecord.agent_action as Record<string, unknown> : {};
      payloadRecord.service_network = selectedServiceNetwork;
      payloadRecord.provider_service = selectedProviderService;
      payloadRecord.agent_action = {
        ...existingAgentAction,
        provider_route: selectedProviderService || selectedServiceNetwork || existingAgentAction.provider_route,
        selected_service_network: selectedServiceNetwork,
        selected_provider_service: selectedProviderService
      };
    }

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
        const required = Number(data.required ?? data.requiredCredits ?? costEstimate.totalCredits) || costEstimate.totalCredits;
        const available = Number(data.available ?? availableProductionCredits ?? 0) || 0;
        const shortfall = Number(data.shortfall ?? Math.max(0, required - available)) || 0;
        setAssistantCreditState((current) => ({ ...current, requiredCredits: required, productionAvailable: available, redirect: "/dashboard/credits" }));
        setStartError(`Insufficient credits. Required: ${required.toLocaleString()} credits, available: ${available.toLocaleString()} credits, missing: ${shortfall.toLocaleString()} credits. Your draft stays here; open Credits only when you want to top up.`);
        setCreditSplashOpen(true);
      }
      return;
    }

    const productionId = data.production?.id;
    if (productionId) {
      setStartError("");
      const automationResponse = await fetch("/api/automation/start", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({ production_id: productionId, user_id: auth.user.id })
      }).catch(() => null);
      if (automationResponse && !automationResponse.ok) {
        const automationError = await automationResponse.json().catch(() => ({}));
        const recoveredProduction = automationError.production && typeof automationError.production === "object" ? automationError.production as Record<string, unknown> : null;
        setStartState("idle");
        setStartModalOpen(false);
        setProductionStartingIntent(false);
        setStartedProduction({
          id: String(recoveredProduction?.id ?? productionId),
          detailUrl: productionWorkspacePath({
            id: String(recoveredProduction?.id ?? productionId),
            title: String(recoveredProduction?.title ?? clean),
            prompt: clean,
            production_type: selectedProductionType,
            package_id: selectedPackageForEstimate
          }),
          status: "automation_warning",
          message: automationError.error ?? "Production record was created, but automation returned an error response. Open the detail page to continue.",
          providerStatus: String(recoveredProduction?.status ?? "automation_warning"),
          nextAction: "Open the production detail page and continue from there."
        });
        if (!recoveredProduction) {
          setStartError(automationError.error ?? "The production record was created, but automation could not be started. You can check it again from the live workspace.");
        }
        return;
      }
      const automationData = automationResponse ? await automationResponse.json().catch(() => ({})) : {};
      const providerReadiness = automationData.provider_readiness && typeof automationData.provider_readiness === "object" ? automationData.provider_readiness as Record<string, any> : null;
      const missingProviderKeys = Array.isArray(providerReadiness?.blocking) ? providerReadiness.blocking.map((item: Record<string, unknown>) => String(item.key ?? item.label ?? "provider_config")) : [];
      const returnedGenerationStatus = String(automationData.production?.generation_status ?? "");
      const returnedProviderStatus = String(automationData.production?.output_json?.providerStatus ?? "");
      const waitingProviderConfig = Boolean(automationData.waiting_provider_config) || /waiting_provider_config|queued_for_render_slot/.test(`${returnedGenerationStatus} ${returnedProviderStatus}`);
      const alreadyRunning = Boolean(automationData.already_running);
      setStartState("idle");
      setStartModalOpen(false);
      setProductionStartingIntent(false);
      setStartedProduction({
        id: productionId,
        detailUrl: productionWorkspacePath({
          id: productionId,
          title: clean,
          prompt: clean,
          production_type: selectedProductionType,
          package_id: selectedPackageForEstimate
        }),
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
const briefHasEnglishLock = productionBrief.includes("Language lock:") || wantsEnglishProductionLanguage(productionBrief);
const currentTurnLanguage = briefHasEnglishLock || wantsEnglishProductionLanguage(clean) ? "en" : turnLanguage(clean, activeLanguage);
const followUpProduction = isShortProductionFollowUp(clean, recentContext) || (dynamicWizard.open && isShortProductionFollowUp(clean, `${recentContext} video proje uretim`));
const followUpDuration = followUpProduction ? durationFromFollowUp(clean) : "";
const intent = followUpProduction ? "production_request" : detectWorkspaceIntent(clean);
const isStartConfirmation = intent === "start_confirmation";
const conversationalOnly = intent === "greeting" || intent === "help" || intent === "consultation";
const conversationalReplyKind = intent === "greeting" ? "greeting" : intent === "help" ? "help" : "consultation";
if (intent === "production_request" || followUpProduction) {
  const languageLockedClean = wantsEnglishProductionLanguage(clean) && !clean.includes("Language lock:") ? `${clean}\n\n${englishProductionLanguageLock()}` : clean;
  if (wantsEnglishProductionLanguage(clean)) setSelectedVoiceLanguage("English");
  setProductionBrief((current) => current && followUpProduction ? `${current}\n${languageLockedClean}` : languageLockedClean);
}
const optionSummary = selectedOptionSummary();
const enrichedClean = conversationalOnly ? clean : `${followUpProduction ? "Production follow-up detail" : "Production request"}: ${clean}\n\nRecent context:\n${messages.slice(-6).map((item) => `${item.role}: ${item.content}`).join("\n")}\n\nProduction options:\n${optionSummary}`;

    const wantsNoMaterial = /istemiyorum|gerek yok|olmasın|hayır|devam et/i.test(clean);
    const hasProductionContext = dynamicWizard.open || Boolean(productionBrief.trim()) || /\b(video|reklam|ayakkabi|ayakkabı|urun|ürün|tiktok|shorts|saas|site|website|app|uygulama|admin panel|eticaret|e-ticaret|production request|production follow-up detail)\b/.test(recentContext);
    const userWantsPreviewStatus = /(tasar[iı]m|sayfa|sayfalar|preview|[oö]nden|[oö]n izleme|g[oö]reyim|bekliyorum|ne yapt[iı]n[iı]z|hadi ne|show me|draft|wireframe)/i.test(clean);
    if (!startedProduction && hasProductionContext && !isStartConfirmation && userWantsPreviewStatus) {
      const statusReply = activeLanguage === "tr"
        ? "Şu anda gerçek bir tasarım çıktısı oluşmuş gibi göstermiyorum. Bu ekranda henüz yalnızca brief ve yön seçimi var; gerçek website/admin tasarım çıktısı için önce doğru website yönünü seçip Start Production onay ekranından üretim kaydını oluşturmak gerekiyor. Video kartları yerine website/admin yönleri gösterilecek şekilde çalışma alanını düzeltiyorum."
        : "I will not pretend a real design output exists yet. This workspace currently has only a brief and direction choices; to create real website/admin design output, choose the website direction and confirm Start Production first.";
      setProductionBrief((current) => current || messages.slice(-8).map((item) => item.content).join("\n") || clean);
      setMessages([...messages, { role: "user", content: clean }, { role: "assistant", content: statusReply }]);
      if (source === "chat") setChatInput("");
      setStatus(activeLanguage === "tr" ? "Gerçek çıktı yokken tasarım hazır mesajı gösterilmedi; website yönleri hazırlanıyor." : "No fake design-ready message was shown; website directions are prepared.");
      return;
    }
    if (isStartConfirmation && hasProductionContext) {
      const existingBrief = productionBrief.trim() || messages.slice(-8).filter((item) => item.role === "user").map((item) => item.content).join("\n") || input.trim() || "AI video production";
      if (isAiVideoOnlyIntent(existingBrief)) {
        applyAiVideoOnlyPreset(existingBrief);
      } else if (!dynamicWizard.open && existingBrief.trim()) openDynamicWizardFromMessage(existingBrief);
      setProductionBrief((current) => current.trim() ? current : existingBrief);
      setManualWizardCompleted(true);
      setMessages([...messages, { role: "user", content: clean }, { role: "assistant", content: currentTurnLanguage === "tr" ? "Onayı aldım. Chat içinde tekrar soru sormadan gerçek kredi rezerv/onay ekranını açıyorum." : "Confirmed. I am opening the real credit reserve and production approval step now." }]);
      if (source === "chat") setChatInput("");
      setStatus(currentTurnLanguage === "tr" ? "Üretim onayı açıldı; kredi harcanmadan önce rezerv ekranı görünecek." : "Production approval opened; credits are reserved before provider start.");
      setProductionStartingIntent(true);
      setStartError("");
      setStartState("idle");
      setStartModalOpen(true);
      return;
    }
    if (!conversationalOnly && !followUpProduction) {
      openDynamicWizardFromMessage(clean);
    }
    if (followUpProduction) {
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
      ? publicConversationalReply(clean, currentTurnLanguage, messages.length)
      : followUpProduction
        ? productionFollowUpReply(clean, currentTurnLanguage)
        : googleStyleProductionReply(clean, currentTurnLanguage);

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
        openDynamicWizardFromMessage(clean);
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
          if (followUpProduction) {
            if (followUpDuration) setSelectedDuration(followUpDuration);
            if (isAiVideoOnlyIntent(`${productionBrief}\n${clean}`) || selectedProductionType === "video") {
              setSelectedProductionType("video");
              setSelectedModules(["AI video"]);
              setSelectedPlatforms(["Dashboard delivery", "MP4 download"]);
              setSelectedFeatures((current) => Array.from(new Set(current.filter((item) => !/source|zip|admin|website|alternative/i.test(item)).concat(["Voice-over", "Subtitles", "Music"]))));
            }
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
      detail: selectedProduction?.label ?? "Production",
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
      count: activeCategoryProfile.quality.length,
      content: <div className="clean-tool-grid two">
        {activeCategoryProfile.quality.map((quality) => <button className={selectedQuality === quality ? "active" : ""} type="button" key={quality} onClick={() => { setQuickProviderTest(false); setSelectedQuality(quality); }}><strong>{quality}</strong></button>)}
      </div>
    },
    {
      id: "style",
      label: "Style / Motion",
      detail: selectedStyle,
      count: activeCategoryProfile.style.length,
      content: <div className="clean-tool-grid two">
        {activeCategoryProfile.style.map((style) => <button className={selectedStyle === style ? "active" : ""} type="button" key={style} onClick={() => { setQuickProviderTest(false); setSelectedStyle(style); }}><strong>{style}</strong></button>)}
      </div>
    },
    {
      id: "duration",
      label: "Duration / Scope",
      detail: selectedDuration,
      count: activeCategoryProfile.duration.length,
      content: <div className="clean-tool-grid two">
        {activeCategoryProfile.duration.map((duration) => <button className={selectedDuration === duration ? "active" : ""} type="button" key={duration} onClick={() => { setQuickProviderTest(false); setSelectedDuration(duration); }}><strong>{duration}</strong></button>)}
      </div>
    },
    {
      id: "modules",
      label: "Modules",
      detail: selectedModules.slice(0, 2).join(" + ") || "Select modules",
      count: activeCategoryProfile.modules.length,
      content: <div className="clean-tool-grid two">
        {activeCategoryProfile.modules.map((module) => <button className={selectedModules.includes(module) ? "active" : ""} type="button" key={module} onClick={() => toggleModule(module)}><strong>{module}</strong></button>)}
      </div>
    },
    {
      id: "features",
      label: "Features",
      detail: `${selectedFeatures.length} selected`,
      count: activeCategoryProfile.features.length,
      content: <div className="clean-tool-grid two">
        {activeCategoryProfile.features.map((feature) => <button className={selectedFeatures.includes(feature) ? "active" : ""} type="button" key={feature} onClick={() => toggleFeature(feature)}><strong>{feature}</strong></button>)}
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
      detail: selectedPlatforms.slice(0, 2).join(" + ") || "Download formats",
      count: activeCategoryProfile.platforms.length,
      content: <div className="clean-tool-groups compact-delivery-groups">
        <div className="clean-tool-group">
          <small>Download formats</small>
          <div className="clean-tool-grid two">
            {activeCategoryProfile.platforms.filter((platform) => ["Dashboard delivery", "MP4 download", "MOV video", "WebM video", "PNG images", "JPG images", "PDF document", "ZIP source", "README / setup", "Subtitle file", "Thumbnail / cover", "Preview link"].includes(platform)).map((platform) => <button className={selectedPlatforms.includes(platform) ? "active" : ""} type="button" key={platform} onClick={() => togglePlatform(platform)}><strong>{platform}</strong></button>)}
          </div>
        </div>
        <div className="clean-tool-group">
          <small>Publish / handoff</small>
          <div className="clean-tool-grid two">
            {activeCategoryProfile.platforms.filter((platform) => !["Dashboard delivery", "MP4 download", "MOV video", "WebM video", "PNG images", "JPG images", "PDF document", "ZIP source", "README / setup", "Subtitle file", "Thumbnail / cover", "Preview link"].includes(platform)).map((platform) => <button className={selectedPlatforms.includes(platform) ? "active" : ""} type="button" key={platform} onClick={() => togglePlatform(platform)}><strong>{platform}</strong></button>)}
          </div>
        </div>
      </div>
    }
  ];
  const activeCleanToolContent = cleanToolSections.find((section) => section.id === activeCleanToolSection) ?? cleanToolSections[0];

  return (
    <div className="assistant-workspace crelavo-clean-studio">
      <main className="clean-studio-main" aria-label="Production workspace">
        <section className="clean-studio-hero">
          <div className="clean-hero-copy">
            <span className="badge">Crelavo AI Studio · HeyGen Bridge Online</span>
            <h1>{selectedProduction?.label ?? "AI Production"}</h1>
            <p>{productionBrief || "Describe what you want to create in the prompt area. Crelavo will show the brief, action, credit estimate and delivery plan here."}</p>
            <div className="clean-hero-selection-chips" aria-label="HeyGen bridge status">
              <span><Sparkles size={13} /><strong>HEYGEN BRIDGE LIVE</strong></span>
              <span><Bot size={13} /><strong>Video Agent native artifacts aktif</strong></span>
              <span><Gauge size={13} /><strong>Build marker: assistant-workspace-bridge</strong></span>
            </div>
            {!startedProduction && productionBrief.trim().length === 0 ? (
              <div className="clean-hero-selection-chips" aria-label="Quick start examples">
                {quickStartBriefes.map((example) => (
                  <button key={example.id} type="button" className="btn secondary" onClick={() => { setInput(example.brief); setProductionBrief(example.brief); }}>{example.title}</button>
                ))}
              </div>
            ) : null}
            {!startedProduction && hasUserVisibleProductionSelection ? (
              <div className="clean-hero-selection-chips" aria-label="Selected production options">
                <span><Film size={13} /><strong>{selectedProduction?.label ?? selectedProductionType}</strong></span>
                <span><Gauge size={13} /><strong>{selectedQuality}</strong></span>
                <span><Sparkles size={13} /><strong>{selectedStyle}</strong></span>
                <span><Clock3 size={13} /><strong>{selectedDuration}</strong></span>
                {selectedModules.slice(0, 2).map((module) => <span key={`module-${module}`}><Layers3 size={13} /><strong>{module}</strong></span>)}
                {selectedFeatures.slice(0, 2).map((feature) => <span key={`feature-${feature}`}><Box size={13} /><strong>{feature}</strong></span>)}
                {selectedPlatforms.slice(0, 3).map((platform) => <span key={`platform-${platform}`}><Download size={13} /><strong>{platform}</strong></span>)}
                {selectedMaterials.length || uploadedMaterials.length ? <span><PackageCheck size={13} /><strong>{selectedMaterials.length + uploadedMaterials.length} material</strong></span> : null}
              </div>
            ) : null}
          </div>
          <div className="clean-hero-credit-pill">
            <CreditCard size={15} />
            <span><small>Tahmini rezerv</small><strong>{costEstimate.totalCredits.toLocaleString()} kredi</strong></span>
          </div>
        </section>

        <section className="prompt-first-options-panel clean-prompt-first-panel" aria-label="Prompt based production options">
          <div className="drawer-head">
            <div>
              <span className="badge">Prompt, plan, routing</span>
              <h3>Prompt’a göre üretim seçenekleri</h3>
              <p>Prompt yazınca kategori, kalite, stil, süre, modül, özellik, materyal ve teslimat seçenekleri burada dinamikleşir.</p>
            </div>
            <button className="btn" type="button" onClick={openStartProductionModal}>Start Production</button>
          </div>
          <div className="prompt-first-engine-strip compact-engines" aria-label="AI Core production engines">
            {serviceNetworkGroups.map((engine) => <span key={engine.label}><strong>{engine.label}</strong></span>)}
          </div>
          <div className="prompt-first-option-grid">
            {promptOptionGroups.map((group) => (
              <div className="prompt-first-option-card" key={group.label}>
                <small>{group.label}</small>
                <strong>{group.value}</strong>
                <div className="option-grid compact-option-grid">
                  {group.options.map((option) => <button className="option-pill" type="button" key={`${group.label}-${option}`} onClick={() => group.apply(option)}>{option}</button>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="clean-preview-card production-example-directions" aria-label="Manual production setup wizard">
          <div className="production-example-head">
            <span className="badge">Manual setup</span>
            <small>İstersen chat yerine buradan adım adım seç: motor, kalite, süre, ses, müzik, ortam ve teslim.</small>
          </div>
          <p>Kullanıcı hiçbir kategori bilmeden başlayabilir; seçimler splash ekranda kategori, modül, özellik, stil, motor, kalite, süre, ses, müzik, ortam ve teslim şeklinde sırayla sorulur.</p>
          <div className="production-example-actions">
            <button className="btn secondary" type="button" onClick={() => { setManualWizardOpen(true); setManualWizardStep(Math.max(0, manualWizardStep - 1)); }}>Önceki</button>
            <button className="btn secondary" type="button" onClick={() => { setManualWizardOpen(true); setManualWizardStep(Math.min(manualWizardSteps.length - 1, manualWizardStep + 1)); }}>Sonraki seçenek</button>
            <button className="btn" type="button" onClick={openManualWizard}>Adım adım seç</button>
            <button className="btn" type="button" onClick={openStartProductionModal}>Örnekleri göster / üretime hazırla</button>
          </div>
        </section>

        <section className="clean-preview-grid">
          <div className="clean-preview-card clean-preview-large clean-output-viewer">
            <small>Work output viewer</small>
            <strong>{startedProduction ? "Production is ready to review" : productionStartingIntent ? "Production approval is ready" : (selectedProduction?.label ?? selectedProductionType)}</strong>
            <p>{startedProduction ? "Your production record is ready. It stays in Work so you can watch, review, download, share, or request revisions." : productionStartingIntent ? "The assistant prepared the production setup. Confirm the start step to create the production record inside Work and begin automation." : productionBrief ? "Brief ready. Choose a direction below, or ask the assistant to change style, voice, visuals, duration, or delivery." : "No production output yet. Write what you want in the assistant and select the needed options above."}</p>
            {!startedProduction && hasUserVisibleProductionSelection && !productionStartingIntent ? (
              <div className="production-example-directions" aria-label="Production example directions">
                <div className="production-example-head">
                  <span className="badge">Choose direction</span>
                  <small>Select one example, then confirm to start production.</small>
                </div>
                <div className="production-example-grid">
                  {productionExampleDirections.map((direction) => (
                    <button className={selectedExampleDirection === direction.id ? "selected" : ""} type="button" key={direction.id} onClick={() => selectProductionExampleDirection(direction)}>
                      <strong>{direction.title}</strong>
                      <small>{direction.meta}</small>
                      <em>{direction.style}</em>
                    </button>
                  ))}
                </div>
                <div className="production-example-actions">
                  <button className="btn secondary" type="button" onClick={() => { setSelectedExampleDirection(""); setStatus(activeLanguage === "tr" ? "Yeni alternatif isteyebilirsin veya asistan mesajına ek detay yazabilirsin." : "You can ask for another alternative or add details in the assistant."); }}>Show another idea</button>
                  <button className="btn" type="button" onClick={openStartProductionModal}>Use this direction</button>
                </div>
              </div>
            ) : null}
            {startedProduction ? (
              <div className={`studio-started-card clean-completion-card ${startedProduction.status === "waiting_provider_config" || startedProduction.status === "automation_warning" ? "production-attention-card" : "production-live-card"}`}>
                <small>{startedProduction.status === "waiting_provider_config" || startedProduction.status === "automation_warning" ? "Needs attention" : "Production workspace ready"}</small>
                <strong>{startedProduction.message}</strong>
                <span><b>Production ID</b>{startedProduction.id}</span>
                {startedProduction.providerStatus ? <span><b>Provider status</b>{startedProduction.providerStatus}</span> : null}
                {startedProduction.nextAction ? <p className="workspace-action-note">{startedProduction.nextAction}</p> : null}
                <a className="btn" href="/dashboard/assistant-workspace">Stay in Work</a>
              </div>
            ) : null}
          </div>
          <div className="clean-preview-card">
            <small>Agent Action</small>
            <strong>{latestAgentAction?.name ?? "Draft"}</strong>
            <p>Production is not marked as started before a real record exists.</p>
          </div>
          <div className="clean-preview-card">
            <small>Delivery</small>
            <strong>{selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard"}</strong>
            <p>Files, links, previews and delivery package.</p>
          </div>
        </section>



      </main>

      <aside className="clean-studio-side" aria-label="Assistant and controls">
        <section className="clean-chat-panel">
          <div className="clean-panel-head">
            <span className="badge"><Bot size={14} /> Crelavo Assistant</span>
            <button className="btn secondary" type="button" onClick={clearProductionChat}>Clear</button>
          </div>
          <div className="clean-chat-log notranslate" data-no-translate="true" translate="no" ref={chatLogRef}>
            {cleanAssistantMessages(messages).map((message, index) => <div className={`chat-bubble ${message.role} notranslate`} data-no-translate="true" translate="no" key={`${message.role}-${index}`}>{message.content}</div>)}
            {isLoading ? <div className="chat-bubble assistant notranslate" data-no-translate="true" translate="no">Preparing response...</div> : null}
          </div>
          <div className="clean-chat-input">
            <textarea className="notranslate" data-no-translate="true" translate="no" spellCheck={false} autoCorrect="off" autoCapitalize="off" ref={inputRef} value={chatInput} onChange={(event) => { setChatInput(event.target.value); setInput(event.target.value); }} onKeyDown={handleChatInputKeyDown} placeholder="What do you want to create? Example: build a SaaS site like Crelavo..." />
            <div className="clean-chat-actions">
              <label className="btn secondary clean-chat-attach" title="Attach file">
                <Paperclip size={15} />
                <span>{uploadState === "loading" ? "Uploading" : "File"}</span>
                <input type="file" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.zip" disabled={uploadState === "loading"} onChange={(event) => uploadUserMaterial(event.currentTarget.files)} />
              </label>
              <button className="btn clean-chat-send" type="button" onClick={() => sendCommand(undefined, "quick", "chat")} disabled={isLoading || !chatInput.trim()}><Send size={15} /> Send</button>
            </div>
          </div>
        </section>

      </aside>

      {manualWizardOpen ? (
        <div className="production-start-modal-backdrop">
          <div className="production-start-modal credit-splash-modal">
            <button className="splash-ad-close" type="button" onClick={() => setManualWizardOpen(false)} aria-label="Close manual setup">×</button>
            <span className="badge">Manual production setup</span>
            <h3 key={`manual-step-title-${manualWizardStep}-${currentManualWizardStep?.id}`}>Adım {Math.min(manualWizardStep + 1, manualWizardSteps.length)} / {manualWizardSteps.length}: {currentManualWizardStep?.title}</h3>
            <p>{currentManualWizardStep?.subtitle}</p>
            <div className="progress-mini"><span style={{ width: `${Math.round(((manualWizardStep + 1) / manualWizardSteps.length) * 100)}%` }} /></div>
            <div className="clean-tool-grid two" style={{ marginTop: 14 }}>
              {currentManualWizardStep?.options.map((option) => (
                <button className={currentManualWizardStep?.value === option ? "active" : ""} type="button" key={option} onClick={() => currentManualWizardStep?.apply(option)}>
                  <strong>{option}</strong>
                </button>
              ))}
            </div>
            <div className="drawer-summary" style={{ marginTop: 14 }}><strong>Seçim özeti</strong><pre>{manualWizardStep === 0 ? "Kategori seçimini yaptıktan sonra özet dolacak. Eski/default paketler burada gösterilmiyor." : selectedOptionSummary()}</pre></div>
            <div className="production-example-actions">
              {manualWizardStep > 0 ? <button className="btn secondary" type="button" onClick={() => setManualWizardStep((current) => Math.max(0, current - 1))}>Önceki</button> : null}
              <button className="btn" type="button" onClick={() => { if (manualWizardStep < manualWizardSteps.length - 1) setManualWizardStep((current) => current + 1); else completeManualWizardAndOpenStart(); }}>{manualWizardStep < manualWizardSteps.length - 1 ? "Seç ve devam et" : "Üretime hazırla"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {startModalOpen ? (
        <div className="production-start-modal-backdrop">
          <div className="production-start-modal">
            <span className="badge">Start production</span>
            <h3>Create a production record with these options?</h3>
            <p>This writes the selected quality, style, duration, material and delivery options to the record, reserves credits and moves you to the live production workspace.</p>
            <div className="start-cost-preview">
              <strong>{quickProviderTest ? "Provider smoke test" : `${costEstimate.totalCredits.toLocaleString()} estimated credit reserve`}</strong>
              <span>Single output: {costEstimate.singleOutputCredits.toLocaleString()} credits · Output count: {costEstimate.outputCount} · Provider risk: {costEstimate.providerRiskLevel}{quickProviderTest ? " · 10 sec / 1080p / single output" : ""}</span>
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
              <button className="btn secondary" type="button" onClick={() => { setStartModalOpen(false); setProductionStartingIntent(false); }} disabled={startState === "loading"}>Cancel</button>
              <button className="btn" type="button" onClick={startProduction} disabled={startState === "loading"}>{startState === "loading" ? "Starting..." : productionCreditInsufficient ? "Kredi ekle / üretimi başlat" : "I understand, start production"}</button>
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
    </div>
  );

  return (
    <div className="assistant-workspace chat-open ai-generator-dashboard">
      <section className="assistant-live-stage ai-dashboard-shell">
        <aside className="ai-dashboard-sidebar" aria-label="Crelavo production navigation">
          <div className="ai-dashboard-brand">
            <span className="badge"><Sparkles size={14} /> Crelavo Studio</span>
            <h1>AI Production</h1>
            <p>Chat, brief, quality, credits and real production status in one workspace.</p>
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
            <small>Production status</small>
            <strong>{productionLifecycleState}</strong>
            <span>{productionLifecycleNote}</span>
          </div>
        </aside>

        <section className="assistant-inline-chat ai-dashboard-chat" aria-label="Assistant chat flow">
          <div className="assistant-inline-chat-head">
            <div>
              <span className="badge"><Bot size={14} /> Single chat</span>
              <h2>Crelavo Assistant</h2>
              <p>Write what you want here. General questions are answered; production requests become a brief and action automatically.</p>
            </div>
            <button className="btn secondary compact-chat-clear" type="button" onClick={clearProductionChat}>Clear</button>
          </div>
          <div className="assistant-inline-chat-log notranslate" data-no-translate="true" translate="no" ref={chatLogRef}>
            {cleanAssistantMessages(messages).map((message, index) => <div className={`chat-bubble ${message.role} notranslate`} data-no-translate="true" translate="no" key={`${message.role}-${index}`}>{message.content}</div>)}
            {isLoading ? <div className="chat-bubble assistant notranslate" data-no-translate="true" translate="no">Preparing response...</div> : null}
          </div>
          <div className="assistant-inline-chat-input">
            <textarea className="notranslate" data-no-translate="true" translate="no" spellCheck={false} autoCorrect="off" autoCapitalize="off" ref={inputRef} value={chatInput} onChange={(event) => { setChatInput(event.target.value); setInput(event.target.value); }} onKeyDown={handleChatInputKeyDown} placeholder="Example: build a SaaS site like Crelavo, create a shoe promo video, explain API setup..." />
            <div className="assistant-inline-chat-actions">
              <button className="btn secondary compact-chat-action" type="button" onClick={startVoiceInput} disabled={voiceListening} data-no-translate="true"><Mic size={15} /> {voiceListening ? "Listening" : "Voice"}</button>
              <button className="btn compact-chat-action" type="button" onClick={() => sendCommand(undefined, "quick", "chat")} disabled={isLoading || !chatInput.trim()}><Send size={15} /> Send</button>
            </div>
          </div>
          {uploadError ? <p className="workspace-action-note error">{uploadError}</p> : null}
        </section>

        <main className="ai-dashboard-canvas" aria-label="Production overview">
          <section className="studio-preview-plan ai-preview-hero">
            <div>
              <span className="badge">Production preview · HeyGen Bridge Online</span>
              <h3>{selectedProduction?.label ?? selectedProductionType}</h3>
              <p>{productionBrief || "Henüz üretim brief'i yok. Soldaki tek sohbet alanına isteğini yazınca burada üretim planı, teslimatlar, action ve kredi tahmini görünür."}</p>
              <div className="clean-hero-selection-chips" aria-label="HeyGen bridge status secondary">
                <span><Sparkles size={13} /><strong>HEYGEN BRIDGE LIVE</strong></span>
                <span><Bot size={13} /><strong>Video Agent native artifacts aktif</strong></span>
                <span><Gauge size={13} /><strong>Build marker: assistant-workspace-bridge</strong></span>
              </div>
            </div>
            <div className="studio-preview-metrics">
              <span><small>Kalite</small><strong>{selectedQuality}</strong></span>
              <span><small>Süre / kapsam</small><strong>{selectedDuration}</strong></span>
              <span><small>Teslimat</small><strong>{selectedPlatforms.slice(0, 2).join(" + ") || "Dashboard"}</strong></span>
              <span><small>Kredi</small><strong>{costEstimate.totalCredits.toLocaleString()}</strong></span>
            </div>
            <div className="prompt-first-engine-strip" aria-label="AI Core production engines">
              {serviceNetworkGroups.map((engine) => <span key={engine.label}><strong>{engine.label}</strong><small>{engine.services.join(" · ")}</small></span>)}
            </div>
            <section className="prompt-first-options-panel" aria-label="Prompt based production options">
              <div className="drawer-head">
                <div>
                  <span className="badge">Prompt, plan, routing</span>
                  <h3>Prompt’a göre üretim seçenekleri</h3>
                  <p>Kullanıcı ne yazarsa ilgili kategori, kalite, stil, süre, modül, materyal ve teslimat seçenekleri burada açılır.</p>
                </div>
                <button className="btn" type="button" onClick={openStartProductionModal}>Start Production</button>
              </div>
              <div className="prompt-first-option-grid">
                {promptOptionGroups.map((group) => (
                  <div className="prompt-first-option-card" key={group.label}>
                    <small>{group.label}</small>
                    <strong>{group.value}</strong>
                    <div className="option-grid compact-option-grid">
                      {group.options.map((option) => <button className="option-pill" type="button" key={`${group.label}-${option}`} onClick={() => group.apply(option)}>{option}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
                ? (index < activeStep ? "Done" : index === activeStep ? "Active" : "Waiting")
                : (isDraftActive ? "Draft ready" : "Not sent");
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
              <span className="badge">Live production route</span>
              <h2>{selectedProduction?.label ?? selectedProductionType}</h2>
              <p>{selectedProduction?.description ?? "Production type, delivery format and credit reserve are prepared from the chat."}</p>
              <div className="assistant-console-metrics">
                <div><small>Estimated reserve</small><strong>{costEstimate.totalCredits.toLocaleString()} credits</strong></div>
                <div><small>Output count</small><strong>{costEstimate.outputCount}</strong></div>
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
                  <p>{dynamicWizard.subject ? `Subject: ${dynamicWizard.subject}` : "The assistant opens the required questions based on the production request."}</p>
                </div>
                <button className="btn secondary" type="button" onClick={() => setDynamicWizard(emptyDynamicWizard)}>Close</button>
              </div>
              {dynamicWizardQuestions[dynamicWizard.type].filter((question) => !question.dependsOn || dynamicWizard.answers[question.dependsOn.questionId]?.includes(question.dependsOn.value)).map((question) => (
                <div className="category-specific-option-panel" key={question.id}>
                  <span className="badge">{question.multi ? "Select one or more" : "Select one"}</span>
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
                <button className="btn" type="button" onClick={requestDynamicWizardCredits}>Check credits</button>
                <button className="btn secondary" type="button" onClick={() => setOptionsOpen(true)}>Open settings</button>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="studio-credit-card studio-side-summary ai-dashboard-controls">
          <div className="studio-side-block primary">
            <small>Estimated credits</small>
            <strong>{costEstimate.totalCredits.toLocaleString()} credits</strong>
            <span>{selectedProduction?.label ?? selectedProductionType} · {selectedQuality} · Auto provider</span>
          </div>
          <div className="studio-quality-strip" aria-label="Quality tiers">
            {studioQualityTiers.map((tier) => <button className={selectedQuality.toLowerCase().includes(tier.toLowerCase()) ? "active" : ""} type="button" key={tier} onClick={() => setSelectedQuality(tier)}>{tier}</button>)}
          </div>
          <div className="studio-credit-trust-panel">
            <span><small>Total credits</small><strong>{displayedProductionBalanceText ?? (hasKnownProductionCredits ? `${(availableProductionCredits ?? 0).toLocaleString()} available` : "Check")}</strong><small>{displayedProductionReservedText ?? "Refresh for reserved/available"}</small><button className="btn secondary" type="button" onClick={() => refreshProductionCredits().catch(() => undefined)}>Refresh credits</button></span>
            <span><small>Reserved now</small><strong>{startedProduction ? "Production record" : "0 credits"}</strong></span>
            <span><small>After confirmation</small><strong>{costEstimate.totalCredits.toLocaleString()} reserve</strong></span>
            {productionCreditInsufficient ? <p className="workspace-action-note error">Missing: {productionCreditShortfall.toLocaleString()} credits. Add credits before starting or reduce quality/scope.</p> : <p className="workspace-action-note">No credits are reserved before a real record exists.</p>}
          </div>
          {latestAgentAction ? (
            <div className="studio-credit-trust-panel agent-action-panel">
              <span><small>Agent action</small><strong>{latestAgentAction?.name ?? "ready"}</strong></span>
              <span><small>Route</small><strong>{latestAgentAction?.next_backend_endpoint ?? "/api/productions"}</strong></span>
              <span><small>Provider</small><strong>{latestAgentAction?.provider_route ?? "auto"}</strong></span>
            </div>
          ) : null}
          <div className="studio-side-actions">
            <button className="btn" type="button" onClick={openStartProductionModal}>Start Production</button>
            <button className="btn secondary" type="button" onClick={() => setOptionsOpen((current) => !current)}>{optionsOpen ? "Close settings" : "Quality / features"}</button>
            {productionCreditInsufficient ? <a className="btn secondary" href="/dashboard/credits">Kredi ekle</a> : null}
            <a className="btn secondary" href="/dashboard/assistant-workspace">Work studio</a>
          </div>
          {optionsOpen ? (
            <section className="production-options-panel ai-control-drawer">
              <div className="drawer-head">
                <div>
                  <span className="badge">Settings</span>
                  <h3>Quality, scope and materials</h3>
                </div>
                <button className="btn secondary" type="button" onClick={() => setOptionsOpen(false)}>Close</button>
              </div>
              {renderOptionGrid("Production categories", productionTypes.map((type) => type.label), (value) => productionTypes.find((type) => type.label === value)?.id === selectedProductionType, (value) => { const type = productionTypes.find((item) => item.label === value); if (type) applyCategorySelection(type.id); })}
              <div className="category-specific-option-panel">
                <span className="badge">Category options</span>
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
              <button className="btn" type="button" onClick={() => setOptionsOpen(false)}>Apply selections</button>
            </section>
          ) : null}
          <div className="studio-side-status">
            <small>Provider status</small>
            {studioProviderSignals.map((item) => <span key={item.label}><b>{item.label}</b>{item.value} · {item.status}</span>)}
          </div>
          {!startedProduction ? (
            <div className="studio-started-card production-draft-card">
              <small>Not live yet</small>
              <strong>No production ID yet.</strong>
              <span><b>Next step</b>Use Start Production to create a real record.</span>
            </div>
          ) : null}
          {assistantCreditState.chargedCredits !== null ? <p className="workspace-action-note">Last assistant charge: {formatCredits(assistantCreditState.chargedCredits)} credits ({assistantCreditState.chargeSource === "assistant_trial" ? "free assistant credits" : "production credits"}).</p> : null}
          {assistantCreditState.redirect ? <p className="workspace-action-note error">Credits required. Top up on the credits page to continue chatting.</p> : null}
          {assistantCreditState.assistantBalance !== null && (assistantCreditState.assistantBalance ?? 0) > 0 && (assistantCreditState.assistantBalance ?? 0) < 300 && !assistantCreditState.redirect ? <p className="workspace-action-note warning">Your free assistant credits are running low. When they run out, messages will use production credits.</p> : null}
          {assistantCreditState.productionBalance !== null && (assistantCreditState.productionBalance ?? 0) > 0 && (assistantCreditState.productionBalance ?? 0) < 500 && !assistantCreditState.redirect ? <p className="workspace-action-note warning">Your production credits are running low. Consider topping up before the balance runs out.</p> : null}
        </aside>


        {startModalOpen ? (
          <div className="production-start-modal-backdrop">
            <div className="production-start-modal">
              <span className="badge">Start production</span>
              <h3>Create a production record with these options?</h3>
              <p>This writes the selected quality, style, duration, material and delivery options to the record, reserves credits and keeps the flow inside Work.</p>
              <div className="start-cost-preview">
                <strong>{quickProviderTest ? "Provider smoke test" : `${costEstimate.totalCredits.toLocaleString()} estimated credit reserve`}</strong>
                <span>Single output: {costEstimate.singleOutputCredits.toLocaleString()} credits · Output count: {costEstimate.outputCount} · Provider risk: {costEstimate.providerRiskLevel}{quickProviderTest ? " · 10 sec / 1080p / single output" : ""}</span>
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
                <button className="btn secondary" type="button" onClick={() => { setStartModalOpen(false); setProductionStartingIntent(false); }} disabled={startState === "loading"}>Cancel</button>
                <button className="btn" type="button" onClick={startProduction} disabled={startState === "loading"}>{startState === "loading" ? "Starting..." : productionCreditInsufficient ? "Kredi ekle / üretimi başlat" : "I understand, start production"}</button>
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
