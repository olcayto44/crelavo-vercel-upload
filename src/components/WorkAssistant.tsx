"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, Code2, Loader2, PackageCheck, Paperclip, Send, Sparkles, Video } from "lucide-react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { buildPresenterCreativeBrief, initialPresenterActivityLog } from "@/lib/creative-director";
import { sanitizeProviderRouteSignal } from "@/lib/heygen-routing";
import { type UserUploadedMaterial } from "@/lib/production-payload";

type WorkAssistantProps = {
  initialIdea?: string;
  initialCategory?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StudioPlan = {
  production_type: string;
  package_id: string;
  selected_quality: string;
  selected_duration: string;
  selected_style: string;
  selected_modules: string[];
  selected_features: string[];
  selected_platforms: string[];
  delivery_requirements: { requested?: boolean; status?: string; formats?: string[] };
  estimated_credits: number;
  missing_fields?: string[];
  summary?: string;
  workflow_stage?: string;
  next_user_action?: string;
};

type PlanResponse = {
  plan?: StudioPlan;
  suggestion?: { assistantReply?: string; note?: string; nextStep?: string };
  conversation_id?: string;
  error?: string;
  redirect?: string;
};

type WorkProductionCard = {
  id: string;
  title?: string;
  production_type?: string;
  status?: string;
  generation_status?: string;
  automation_status?: string;
  preview_url?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  output_json?: Record<string, unknown> | null;
};

type MinimaxGalleryAvatar = {
  id: string;
  avatarId?: string;
  lookId?: string;
  name: string;
  imageUrl?: string;
  gender?: string;
  style?: string;
};

type MinimaxGalleryVoice = {
  id: string;
  name: string;
  language?: string;
  gender?: string;
  age?: string;
  style?: string;
  previewAudioUrl?: string;
};

type MinimaxGallerySound = {
  id: string;
  name: string;
  style?: string;
  duration?: string;
  audioUrl?: string;
};

const studioChips = ["Video", "Video Clipping", "Product Link to Video", "Ad Creative Angles", "UGC Style Ad", "Lower Ad Costs", "Website", "Mobile App", "Animation", "Anime Short Film", "Studio / Series-Film", "Stickman Animation", "Brand Kit", "Image / Banner / Poster", "Voice", "Campaign"];

const productionLabels: Record<string, string> = {
  video: "AI Video",
  campaign: "Campaign",
  talking_video: "Talking Video",
  avatar: "Avatar Video",
  lip_sync: "Lip Sync Video",
  live_sales_agent: "AI Live Sales Agent",
  website: "Website",
  saas: "SaaS / Web App",
  mobile_app: "Mobile App",
  admin_project: "Admin Panel",
  image: "Image",
  brand_kit: "Brand Kit",
  voice_clone: "Voice",
  music_video: "Music Video",
  document_pack: "Document / SEO Pack",
  video_clipping: "Video Clipping",
  animation: "Animation",
  anime_short_film: "Anime Short Film",
  drone_video: "AI Drone / Satellite Video",
  stickman_animation: "Stickman Animation",
  documentary: "Documentary",
  cinematic_video: "Cinematic Video",
  drama: "Short Film / Drama",
  ai_agent: "AI Agent",
  localization: "Localization",
  ad_score_checker: "Ad Score Checker",
  virtual_model_studio: "Virtual Model Studio",
  cultural_localization: "Cultural Localization",
  campaign_calendar: "Campaign Calendar",
  crelavo_academy: "Crelavo Academy",
  community_showcase: "Community Showcase",
  visual_clone: "Visual Clone"
};

type SetupGroup = {
  id: string;
  title: string;
  options: string[];
  multi?: boolean;
  credit?: number;
};

type SetupProfile = {
  title: string;
  note: string;
  groups: SetupGroup[];
};

type ProductionSetupState = Record<string, string[]>;

const sharedDeliveryOptions = ["Dashboard delivery", "Final ZIP", "README", "Revision right"];
const sharedVideoQuality = ["1080p", "1080p premium", "4K"];
const sharedVideoFormat = ["Vertical 9:16", "Horizontal 16:9", "Square 1:1", "YouTube 16:9"];
const sharedVideoDuration = ["15 sec", "30 sec", "45 sec", "60 sec", "10 sec", "2 min", "3 min", "5 min"];
const minimaxVideoDuration = ["Auto", "15sec", "30sec", "1min", "2min", "3min"];
const sharedVoiceOptions = ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Child voice", "Senior voice", "Own voice-over", "Choose AI voice", "Create AI voice"];
const sharedSubtitleOptions = ["No subtitles", "Auto subtitles", "Burned subtitles", "Subtitle file", "Large social captions"];
const sharedMotionOptions = ["Dynamic transitions", "Fast cuts", "Smooth zooms", "Swipe transitions", "Animated text overlays", "UI overlays", "Strong opening hook", "Final CTA", "Energetic social pacing", "Premium clean pacing"];
const HEYGEN_MANUAL_AVATAR_CREDITS = 900;
const HEYGEN_MANUAL_VOICE_CREDITS = 1500;
const HEYGEN_MOTION_PROMPT_CREDITS = 700;
const HEYGEN_MANUAL_MUSIC_CREDITS = 900;
const HEYGEN_PREMIUM_CREDITS_PER_MINUTE = 3000;
const minimaxH3Options = ["Minimax H3"];
const minimaxMotionPromptOptions = ["No presenter motions", "Natural delivery", "Smile", "Wave", "Point at camera", "CTA hand gesture", "Energetic gestures"];
const minimaxMusicVibes = [
  { label: "Enerjik reklam", query: "upbeat electronic ad music" },
  { label: "Modern teknoloji", query: "modern tech electronic corporate" },
  { label: "Kurumsal ilham", query: "corporate motivational inspiring" },
  { label: "Sakin eğitim", query: "calm acoustic educational" },
  { label: "UGC sosyal medya", query: "trendy social media upbeat" }
];

const setupProfiles: Record<string, SetupProfile> = {
  video: {
    title: "AI video setup",
    note: "Only video-specific production choices are shown here.",
    groups: [
      { id: "videoStyle", title: "Video style", options: ["Silent / music only", "No presenter / B-roll only", "Voice-over only", "AI presenter"] },
      { id: "heygenQuality", title: "Minimax H3", options: minimaxH3Options },
      { id: "presenterChoice", title: "Karakter seçimi", options: ["No presenter / B-roll only", "Auto choose best presenter", "Female presenter", "Male presenter", "Young energetic creator", "Professional business presenter", "Energetic UGC creator", "Mature trustworthy presenter"] },
      { id: "presenterMotion", title: "Karakter hareketleri", multi: true, options: ["No presenter motions", "Natural delivery", "Smile", "Wave", "Point at camera", "CTA hand gesture", "Energetic gestures"], credit: HEYGEN_MOTION_PROMPT_CREDITS },
      { id: "videoType", title: "Video type", options: ["Cinematic promo", "Social media short", "Prompt-to-video", "Image-to-video", "Script-to-video", "Product ad video", "Explainer video"] },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Target duration (approx.)", options: minimaxVideoDuration, credit: 350 },
      { id: "format", title: "Format", options: sharedVideoFormat, credit: 250 },
      { id: "sourceHandling", title: "Source / scene handling", options: ["Prompt-only", "No people", "Use uploaded material", "Keep original environment", "Replace background", "Blur background", "With presenter"], credit: 300 },
      { id: "background", title: "Background / environment", options: ["Cinematic scene", "Motion graphics", "City", "Nature", "Studio", "Brand color", "Lifestyle", "Product UI"], credit: 300 },
      { id: "motion", title: "Pace / transitions", multi: true, options: sharedMotionOptions, credit: 350 },
      { id: "voice", title: "Voice-over", options: sharedVoiceOptions, credit: 600 },
      { id: "extras", title: "Extras", multi: true, options: ["Background music", "Subtitles", "Thumbnail", "3 alternatives", "5 alternatives", "Final MP4", ...sharedDeliveryOptions], credit: 450 }
    ]
  },
  animation: {
    title: "Animation video setup",
    note: "Animation, voice, subtitle, duration and final MP4 choices.",
    groups: [
      { id: "animationStyle", title: "Animation style", options: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Motion graphics", "Whiteboard animation"] },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Target duration (approx.)", options: minimaxVideoDuration, credit: 350 },
      { id: "format", title: "Format", options: sharedVideoFormat, credit: 250 },
      { id: "character", title: "Character", multi: true, options: ["Create AI characters", "Choose from character library", "Use uploaded character photos", "Keep same characters", "Multiple characters"], credit: 700 },
      { id: "environment", title: "Environment", options: ["Same environment", "New background", "City", "Fantasy world", "School", "Forest", "Space", "Cyberpunk"], credit: 350 },
      { id: "peopleHandling", title: "Character handling", options: ["Keep same characters", "Create new characters", "Remove extra characters", "Main character only", "Multiple characters"], credit: 350 },
      { id: "voice", title: "Voice", options: sharedVoiceOptions, credit: 600 },
      { id: "subtitles", title: "Subtitles", options: sharedSubtitleOptions, credit: 300 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Final MP4", "Thumbnail", "Script pack", "Prompt pack", ...sharedDeliveryOptions], credit: 350 }
    ]
  },
  anime_short_film: {
    title: "Anime short film setup",
    note: "Anime style, characters, scenes, voice and subtitle choices.",
    groups: [
      { id: "sceneType", title: "Scene type", options: ["Anime style", "Character setup", "Dialogue", "Action scene", "Fantasy scene"] },
      { id: "environment", title: "Anime environment", options: ["Same environment", "New background", "School", "City", "Fantasy world", "Forest", "Space", "Cyberpunk"], credit: 350 },
      { id: "peopleHandling", title: "Character handling", options: ["Keep same characters", "Create new characters", "Main character only", "Remove extra characters", "Multiple characters"], credit: 350 },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Target duration (approx.)", options: minimaxVideoDuration, credit: 350 },
      { id: "voice", title: "Voice", options: sharedVoiceOptions, credit: 600 },
      { id: "extras", title: "Extras", multi: true, options: ["Anime music", "Subtitles", "User materials", "Final MP4", ...sharedDeliveryOptions], credit: 450 }
    ]
  },
  drone_video: {
    title: "AI drone / satellite video setup",
    note: "AI-only drone/satellite-style video choices. No real drone shoot option is shown.",
    groups: [
      { id: "droneInput", title: "Drone input", options: ["Map/location prompt", "Satellite-view intro", "Marked area notes", "Route/path plan", "Property image"] },
      { id: "motion", title: "Camera motion", options: ["Smooth flyover route", "Satellite to location zoom", "Marked-area reveal", "Real estate orbit", "Travel cinematic flyover"] },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
      { id: "format", title: "Format", options: sharedVideoFormat, credit: 250 },
      { id: "voice", title: "Narration", options: ["No voice-over", "Calm documentary voice", "Male voice", "Female voice", "Adult neutral voice"], credit: 600 },
      { id: "extras", title: "Extras", multi: true, options: ["Location labels", "Subtitles", "Background music", "Thumbnail", "Final MP4", ...sharedDeliveryOptions], credit: 450 }
    ]
  },
  video_clipping: {
    title: "Video clipping setup",
    note: "Source video, clip count, quality, cinematic style, presenter/avatar, captions, music, thumbnail and social export choices.",
    groups: [
      { id: "source", title: "Source", options: ["Upload video", "Use product/platform footage", "Long podcast", "Long film/episode", "Webinar/lesson", "Product video", "Crelavo category showcase"] },
      { id: "clipType", title: "Clip type", multi: true, options: ["Hook extraction", "Fast dynamic promo clip", "Crelavo platform showcase", "Exciting moments", "Funny scenes", "Educational shorts", "Product highlights", "Ad cutdowns"], credit: 450 },
      { id: "videoStyle", title: "Video style", options: ["No presenter / B-roll only", "Voice-over only", "AI presenter", "Avatar / talking host", "Silent / music only", "UI-only motion graphics"] },
      { id: "presenterChoice", title: "Karakter seçimi", options: ["No presenter / B-roll only", "Auto choose best presenter", "Female presenter", "Male presenter", "Young energetic creator", "Professional business presenter", "Energetic UGC creator", "Mature trustworthy presenter", "AI avatar host"] },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
      { id: "visualStyle", title: "Visual style", options: ["Cinematic", "Premium ad", "Neon tech", "SaaS modern", "Motion graphics", "Product demo", "Realistic UGC", "Viral TikTok", "Corporate", "Luxury product"], credit: 350 },
      { id: "duration", title: "Duration", options: ["15 sec", "30 sec", "45 sec", "60 sec", "2 min"], credit: 350 },
      { id: "clipCount", title: "Clip count", options: ["1 social promo clip", "3 clips", "5 clips", "10 clips"], credit: 700 },
      { id: "format", title: "Format", options: ["TikTok 9:16", "Instagram Reels 9:16", "YouTube Shorts", "LinkedIn 1:1", "YouTube 16:9", "Square 1:1"], credit: 250 },
      { id: "motion", title: "Pace / transitions", multi: true, options: sharedMotionOptions, credit: 350 },
      { id: "sourceHandling", title: "Source / scene handling", options: ["Reframe to vertical", "Keep original environment", "Replace background", "Blur background", "No people", "With presenter", "UI/dashboard scenes", "Neon motion graphics"], credit: 300 },
      { id: "voice", title: "Voice-over", options: sharedVoiceOptions, credit: 600 },
      { id: "captions", title: "Captions", options: sharedSubtitleOptions, credit: 300 },
      { id: "audio", title: "Audio / music", multi: true, options: ["Keep original audio", "Clean voice", "Remove background noise", "Add music", "Beat-synced music", "Duck music under speech", "AI generated music", "No music"], credit: 450 },
      { id: "extras", title: "Extras", multi: true, options: ["Background music", "Subtitles", "Thumbnail", "Cover visual", "Social media caption", "Hashtag set", "Final MP4", "Export for TikTok/Reels/Shorts", ...sharedDeliveryOptions], credit: 450 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Final clips", "Final MP4", "Caption files", "Social export pack", "ZIP", "Revision right"], credit: 350 }
    ]
  },
  talking_video: {
    title: "Talking video setup",
    note: "Avatar, person count, voice, lip-sync and final MP4 choices.",
    groups: [
      { id: "avatarType", title: "Avatar type", options: ["E-commerce avatar", "AI live sales avatar", "Talking head video", "Lip-sync from audio", "Multi-person conversation", "Brand spokesperson"] },
      { id: "people", title: "People", options: ["1 person", "2 people", "3 people", "4 people", "5+ people", "7-8 panel"], credit: 500 },
      { id: "voice", title: "Voice", multi: true, options: ["Own voice", "Adult neutral voice", "Male voice", "Female voice", "Child voice", "Senior voice", "Separate voice per person", "Local accent", "Lip-sync", "Subtitles"], credit: 600 },
      { id: "background", title: "Background", options: ["Studio background", "E-commerce product scene", "Office / SaaS dashboard", "Shop background", "Regional environment", "Clean background"] },
      { id: "delivery", title: "Delivery", multi: true, options: ["Final MP4", "Script", "Voice settings", "Subtitle file", ...sharedDeliveryOptions], credit: 350 }
    ]
  },
  live_sales_agent: {
    title: "AI live sales agent setup",
    note: "AI live host, product selling, chat replies and service-plan choices.",
    groups: [
      { id: "agentMode", title: "Agent mode", options: ["AI live host", "Product link selling", "Live chat replies", "Avatar persona", "Multilingual sales"] },
      { id: "salesTools", title: "Sales tools", multi: true, options: ["CTA/discount", "Lead capture", "Product FAQ", "Admin inbox", "Approval flow", "Setup guide"], credit: 500 },
      { id: "plan", title: "Service plan", options: ["$249 plan", "$799 plan", "$2499 plan"], credit: 1200 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Dashboard delivery", "Agent config", "Sales playbook", "README", "Revision right"], credit: 350 }
    ]
  },
  music_video: {
    title: "Music video / clip setup",
    note: "Music source, clip type, lyrics, character and export choices.",
    groups: [
      { id: "clipType", title: "Clip type", options: ["Performance clip", "Story music video", "Lyric video", "Visualizer", "Social MV", "Dance/social clip"] },
      { id: "musicSource", title: "Music source", options: ["Use uploaded song", "Generate AI music", "User music reference", "Beat only", "No new music"], credit: 700 },
      { id: "people", title: "People", options: ["No people", "1 person", "2 people", "3 people", "4 people", "5+ people"], credit: 500 },
      { id: "quality", title: "Quality / format", options: ["1080p", "1080p cinematic", "4K", "Vertical 9:16", "YouTube 16:9"], credit: 900 },
      { id: "extras", title: "Extras", multi: true, options: ["Lyrics on screen", "Subtitles", "Own image/avatar", "Choose character", "Create character", "Final MP4", ...sharedDeliveryOptions], credit: 450 }
    ]
  },
  website: {
    title: "Website setup",
    note: "Only website/source package choices are shown.",
    groups: [
      { id: "siteType", title: "Site type", options: ["Business website", "Restaurant / cafe", "E-commerce", "SaaS landing page", "Portfolio", "Blog / content"] },
      { id: "pages", title: "Pages", multi: true, options: ["Home", "About", "Services", "Menu/products", "Gallery", "Contact", "Pricing", "FAQ"], credit: 350 },
      { id: "commerce", title: "Commerce", multi: true, options: ["Product listing", "Cart", "Checkout", "Admin product panel", "Order management", "Coupon system"], credit: 650 },
      { id: "admin", title: "Admin", multi: true, options: ["Pages/content", "Products/menu", "Orders/requests", "Users", "Media gallery", "Analytics"], credit: 500 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Source code", "Final ZIP", "README", "Deployment guide", "Responsive design", "Revision right"], credit: 350 }
    ]
  },
  saas: {
    title: "SaaS setup",
    note: "Dashboard, auth, billing and source package choices.",
    groups: [
      { id: "modules", title: "Modules", multi: true, options: ["Landing page", "Auth", "Dashboard", "Billing", "Admin panel", "Customer portal", "Team roles", "Database schema"], credit: 600 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Source code", "Final ZIP", "README", "Deployment guide", "API notes", "Revision right"], credit: 350 }
    ]
  },
  mobile_app: {
    title: "Mobile app setup",
    note: "App screens, features, admin pair and Expo source choices.",
    groups: [
      { id: "appType", title: "App type", options: ["Booking app", "Marketplace", "Delivery app", "SaaS app", "Community app", "Custom app"] },
      { id: "screens", title: "Screens", options: ["5 screens", "10 screens", "Custom screen count"], credit: 800 },
      { id: "features", title: "Features", multi: true, options: ["Login", "Admin panel", "Payments", "Notifications", "User dashboard", "Database", "Calendar", "Search/filter"], credit: 650 },
      { id: "admin", title: "Admin", multi: true, options: ["Users", "Bookings/orders", "Products/services", "Payments", "Content", "Analytics"], credit: 500 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Expo source code", "Final ZIP", "README", "Deployment guide", "API notes", "Revision right"], credit: 350 }
    ]
  },
  admin_project: {
    title: "Admin panel setup",
    note: "CRUD, roles, database, dashboard and setup guide choices.",
    groups: [
      { id: "modules", title: "Modules", multi: true, options: ["CRUD records", "User management", "Roles", "Database", "Dashboard", "Activity log", "Analytics"], credit: 550 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Source code", "Final ZIP", "README", "Setup guide", "Revision right"], credit: 350 }
    ]
  },
  image: {
    title: "Image / visual setup",
    note: "Image-only output, style, variants and delivery choices.",
    groups: [
      { id: "imageType", title: "Image type", options: ["Product visual", "Poster", "Social media post", "Logo/brand kit", "Thumbnail", "Banner"] },
      { id: "outputs", title: "Output count", options: ["1 visual", "3 alternatives", "5 alternatives"], credit: 600 },
      { id: "style", title: "Style", options: ["Realistic", "Luxury product", "Minimal", "Corporate", "Viral TikTok", "Product demo"], credit: 250 },
      { id: "aspectRatio", title: "Aspect ratio", options: ["Portrait 4:5", "Square 1:1", "Story 9:16", "Landscape 16:9"], credit: 150 },
      { id: "delivery", title: "Delivery", multi: true, options: ["PNG/JPG", "Prompt pack", "Source file delivery", "Final ZIP", "Social caption", "Revision right"], credit: 350 }
    ]
  },
  campaign: {
    title: "Campaign / product ad setup",
    note: "Product source, campaign asset, channels and delivery choices.",
    groups: [
      { id: "campaignType", title: "Campaign type", options: ["Product ad", "Marketplace product kit", "Restaurant campaign", "E-commerce launch", "Social media pack", "Brand promo"] },
      { id: "source", title: "Product source", multi: true, options: ["Product URL", "Shopify product link", "Amazon product link", "Trendyol product link", "WooCommerce product", "Uploaded product image", "Product title only", "Bulk product list"], credit: 350 },
      { id: "assets", title: "Assets", multi: true, options: ["Product ad video", "Product image set", "Marketplace listing copy", "SEO product description", "Store banner", "Email promo", "UGC ad script", "A/B hook pack"], credit: 650 },
      { id: "channels", title: "Channels", multi: true, options: ["TikTok", "Instagram", "Meta Ads", "YouTube Shorts", "Shopify", "Amazon", "Trendyol", "WooCommerce", "Pinterest"], credit: 250 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Dashboard delivery", "MP4 download", "Caption", "Hashtags", "Final ZIP", "Revision right"], credit: 350 }
    ]
  },
  document_pack: {
    title: "SEO / document setup",
    note: "Report, content, keyword, PDF and ZIP choices.",
    groups: [
      { id: "documentType", title: "Document type", options: ["SEO keyword research", "Growth intelligence report", "Pitch deck", "Proposal", "Business plan", "Product documentation"] },
      { id: "scope", title: "Scope", multi: true, options: ["Keywords", "Metadata", "Content outline", "Page copy", "Implementation checklist", "Competitor URLs", "Action plan"], credit: 450 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Dashboard delivery", "PDF document", "Editable source", "CSV export", "Final ZIP", "README"], credit: 350 }
    ]
  }
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function labelFor(type: string) {
  return productionLabels[type] ?? type.replaceAll("_", " ");
}

const trUiLabels: Record<string, string> = {
  "AI Video": "Reklam videosu",
  "Talking Video": "Sunuculu video",
  "Production draft": "Üretim ayarları",
  "Production running": "Üretim başladı",
  "Choose what will be produced": "Üretimde hazırlanacak işler",
  "Selected setup": "Seçili üretim ayarları",
  "No extra setup selected yet.": "Henüz ek ayar seçilmedi.",
  "Package": "Paket",
  "Delivery": "Teslim",
  "Credits": "Kredi",
  "Production ID": "Üretim ID",
  "Status": "Durum",
  "Provider": "Sağlayıcı",
  "Preview": "Ön izleme",
  "Waiting": "Bekliyor",
  "Ready": "Hazır",
  "Page": "Sayfa",
  "Open production": "Üretimi aç",
  "Start Production": "Üretimi başlat",
  "Creating...": "Oluşturuluyor...",
  "AI video setup": "Video üretim ayarları",
  "Only video-specific production choices are shown here.": "Bu kategori için gerekli video ayarları burada seçilir.",
  "Video style": "Video tarzı",
  "Minimax H3": "Minimax H3",
  "Karakter seçimi": "Karakter seçimi",
  "Karakter hareketleri": "Karakter hareketleri",
  "Natural delivery": "Doğal anlatım",
  "Smile": "Gülümse",
  "Wave": "El salla",
  "Point at camera": "Kamerayı işaret et",
  "CTA hand gesture": "CTA’da el hareketi",
  "Energetic gestures": "Enerjik jestler",
  "Auto choose best presenter": "En uygun sunucuyu otomatik seç",
  "Female presenter": "Kadın sunucu",
  "Male presenter": "Erkek sunucu",
  "Young energetic creator": "Genç enerjik creator",
  "Professional business presenter": "Profesyonel iş sunucusu",
  "Energetic UGC creator": "Enerjik UGC creator",
  "Mature trustworthy presenter": "Olgun güvenilir sunucu",
  "AI presenter": "AI sunuculu",
  "Voice-over only": "Sadece seslendirmeli",
  "Silent / music only": "Sessiz / müzikli",
  "Video type": "Video türü",
  "Quality": "Kalite",
  "Duration": "Süre",
  "Format": "Format",
  "Source / scene handling": "Sahne / kaynak kullanımı",
  "Background / environment": "Arka plan / ortam",
  "Pace / transitions": "Tempo / geçişler",
  "Voice-over": "Seslendirme",
  "Extras": "Ek özellikler",
  "Single": "Tek seçim",
  "Multiple": "Çoklu seçim",
  "credits each": "kredi",
  "Prompt-to-video": "Prompt’tan video",
  "Image-to-video": "Görselden video",
  "Script-to-video": "Senaryodan video",
  "Product ad video": "Ürün reklam videosu",
  "Explainer video": "Anlatım videosu",
  "Social media short": "Sosyal medya kısa video",
  "Cinematic promo": "Sinematik tanıtım",
  "1080p premium": "1080p premium",
  "Vertical 9:16": "Dikey 9:16",
  "Horizontal 16:9": "Yatay 16:9",
  "Square 1:1": "Kare 1:1",
  "YouTube 16:9": "YouTube 16:9",
  "5 sec": "5 sn",
  "10 sec": "10 sn",
  "15 sec": "15 sn",
  "30 sec": "30 sn",
  "45 sec": "45 sn",
  "60 sec": "60 sn",
  "2 min": "2 dk",
  "3 min": "3 dk",
  "5 min": "5 dk",
  "Prompt-only": "Sadece prompt",
  "Use uploaded material": "Yüklenen materyali kullan",
  "Keep original environment": "Mevcut ortamı koru",
  "Replace background": "Arka planı değiştir",
  "Blur background": "Arka planı bulanıklaştır",
  "No people": "İnsan olmasın",
  "With presenter": "Ekranda sunucu olsun",
  "Product UI": "Ürün arayüzü",
  "Studio": "Stüdyo",
  "Brand color": "Marka rengi",
  "Lifestyle": "Günlük yaşam",
  "City": "Şehir",
  "Nature": "Doğa",
  "Cinematic scene": "Sinematik sahne",
  "Motion graphics": "Hareketli grafikler",
  "Dynamic transitions": "Dinamik geçişler",
  "Fast cuts": "Hızlı kesmeler",
  "Smooth zooms": "Yumuşak zoomlar",
  "Swipe transitions": "Kaydırmalı geçişler",
  "Animated text overlays": "Animasyonlu yazılar",
  "UI overlays": "Arayüz bindirmeleri",
  "Strong opening hook": "Güçlü açılış cümlesi",
  "Final CTA": "Final çağrı ekranı",
  "Energetic social pacing": "Enerjik sosyal medya temposu",
  "Premium clean pacing": "Premium temiz tempo",
  "No voice-over": "Seslendirme olmasın",
  "Adult neutral voice": "Yetişkin nötr ses",
  "Male voice": "Erkek sesi",
  "Female voice": "Kadın sesi",
  "Child voice": "Çocuk sesi",
  "Senior voice": "Yaşlı / olgun ses",
  "Own voice-over": "Kendi seslendirmem",
  "Choose AI voice": "AI sesi seç",
  "Create AI voice": "AI sesi oluştur",
  "Background music": "Arka plan müziği",
  "Subtitles": "Altyazı",
  "Thumbnail": "Kapak görseli",
  "Final MP4": "Final MP4",
  "Dashboard delivery": "Panelde teslim",
  "Final ZIP": "Final ZIP",
  "README": "Kurulum notu",
  "Revision right": "Revizyon hakkı",
  "3 alternatives": "3 alternatif",
  "5 alternatives": "5 alternatif",
  "Production brief": "Üretim özeti",
  "Script / scene plan": "Senaryo / sahne planı",
  "Visual video": "Görsel video",
  "Music": "Müzik",
  "Revision path": "Revizyon akışı",
  "Link-to-video ad setup": "Linkten video reklam ayarları",
  "Website/SaaS link ad setup": "Website/SaaS link reklam ayarları",
  "Product link ad setup": "Ürün linki reklam ayarları",
  "UGC product recommendation setup": "UGC ürün öneri video ayarları",
  "Competitor comparison ad setup": "Rakip karşılaştırma reklam ayarları",
  "Competitor analysis": "Rakip analizi",
  "Competitor comparison": "Rakip karşılaştırması",
  "Alternative positioning": "Alternatif konumlandırma",
  "Market gap ad": "Pazar boşluğu reklamı",
  "Analyze competitor page": "Rakip sayfasını analiz et",
  "Extract competitor offer": "Rakip teklifini çıkar",
  "Find positioning angle": "Konumlandırma açısını bul",
  "Create comparison hook": "Karşılaştırma hook'u oluştur",
  "Create Crelavo CTA": "Crelavo CTA oluştur",
  "Safe no-copy guard": "Güvenli kopyalamama koruması",
  "Base": "Temel",
  "Main jobs": "Ana işler",
  "Setup": "Ayarlar",
  "Total": "Toplam"
};

function uiText(value: string) {
  return trUiLabels[value] ?? value;
}

function isProjectType(type: string) {
  return ["website", "saas", "mobile_app", "admin_project"].includes(type);
}

function profileForType(type: string) {
  if (["avatar", "lip_sync", "voice_clone"].includes(type)) return setupProfiles.talking_video;
  if (["stickman_animation"].includes(type)) return setupProfiles.animation;
  if (["documentary", "cinematic_video", "drama"].includes(type)) return setupProfiles.video;
  if (["brand_kit", "visual_clone", "virtual_model_studio"].includes(type)) return setupProfiles.image;
  if (["ad_score_checker", "campaign_calendar", "cultural_localization", "localization", "crelavo_academy", "community_showcase", "ai_agent"].includes(type)) return setupProfiles.document_pack;
  return setupProfiles[type] ?? setupProfiles.video;
}

function hasUrlIntent(text: string) {
  return /https?:\/\/[^\s)\]}"']+/i.test(text);
}

function isImageProductionType(type: string) {
  return ["image", "brand_kit", "visual_clone", "virtual_model_studio"].includes(type);
}

function isStaticImagePrompt(text: string) {
  return /\b(image|visual|photo|picture|png|jpg|jpeg|banner|poster|thumbnail|cover|flyer|static\s+ad|social\s+media\s+post|instagram\s+post|instagram\s+portrait|feed\s+post|reklam\s+görseli|reklam\s+gorseli|sosyal\s+medya\s+(post|görseli|gorseli)|görsel|gorsel|resim|afiş|afis|kapak)\b|\b4\s*[:x]\s*5\b/.test(text.toLocaleLowerCase("tr-TR"));
}

function imageTypeFromPrompt(text: string, options: string[]) {
  const signal = text.toLocaleLowerCase("tr-TR");
  const checks: Array<[RegExp, RegExp]> = [
    [/instagram|social\s+media|sosyal\s+medya|\bpost\b|reklam\s+görseli|reklam\s+gorseli|product\s+advertisement|feed\s+post/, /social media post/i],
    [/poster|afiş|afis|kampanya\s+posteri/, /poster/i],
    [/banner|web\s+banner/, /banner/i],
    [/logo|brand\s+kit|marka\s+kiti/, /logo\/brand kit/i],
    [/thumbnail|cover|kapak/, /thumbnail/i],
  ];
  for (const [textPattern, optionPattern] of checks) {
    if (textPattern.test(signal)) {
      const wanted = options.find((option) => optionPattern.test(option));
      if (wanted) return wanted;
    }
  }
  return options.find((option) => /product visual/i.test(option));
}

function imageAspectRatioFromPrompt(text: string, options: string[]) {
  const signal = text.toLocaleLowerCase("tr-TR");
  const checks: Array<[RegExp, RegExp]> = [
    [/\b4\s*[:x]\s*5\b|instagram\s+(portrait|feed)|portrait\s+post/, /portrait 4:5/i],
    [/\b1\s*[:x]\s*1\b|square|kare/, /square 1:1/i],
    [/\b9\s*[:x]\s*16\b|story|reels|tiktok|vertical|dikey/, /story 9:16/i],
    [/\b16\s*[:x]\s*9\b|landscape|horizontal|yatay/, /landscape 16:9/i],
  ];
  for (const [textPattern, optionPattern] of checks) {
    if (textPattern.test(signal)) {
      const wanted = options.find((option) => optionPattern.test(option));
      if (wanted) return wanted;
    }
  }
  return undefined;
}

function normalizedImageAspectRatio(setup: ProductionSetupState, hint = "") {
  const selected = String((setup.aspectRatio ?? [])[0] ?? "");
  const signal = `${selected} ${hint}`.toLocaleLowerCase("tr-TR");
  if (/4\s*[:x]\s*5|portrait\s+4:5/.test(signal)) return "4:5";
  if (/1\s*[:x]\s*1|square/.test(signal)) return "1:1";
  if (/9\s*[:x]\s*16|story/.test(signal)) return "9:16";
  if (/16\s*[:x]\s*9|landscape/.test(signal)) return "16:9";
  return undefined;
}

function dynamicProfileForPlan(plan: StudioPlan, hint = ""): SetupProfile {
  const base = profileForType(plan.production_type);
  const signal = `${hint} ${plan.summary ?? ""} ${plan.selected_modules.join(" ")} ${plan.selected_features.join(" ")} ${plan.selected_platforms.join(" ")} ${plan.package_id}`.toLocaleLowerCase("tr-TR");
  const hasLink = hasUrlIntent(signal);
  const isCrelavoOrSaas = hasLink && /crelavo|crelavo\.com|saas|software|dashboard|website\s+link|website\/saas|landing\s+page/.test(signal);
  const isSaasOrSiteLink = hasLink && /crelavo|saas|website|landing|site|web|dashboard|software|app|tool/.test(signal);
  const isCommerceLink = hasLink && !isCrelavoOrSaas && /shopify|amazon|trendyol|woocommerce|etsy|product|ürün|urun|store|shop|e-?commerce|marketplace|checkout/.test(signal);
  const isCompetitorComparison = hasLink && /competitor|comparison|compare|alternative|position\s+crelavo|rakip|karşılaştır|karsilastir|alternatif|rakibe\s+göre|rakibe\s+gore/.test(signal);
  const isUgcProductRecommendation = hasLink && /ugc|koc|creator|social\s+media\s+creator|real\s+social\s+media|recommendation|product\s+recommendation|tiktok|reels|influencer|doğal\s+öneri|dogal\s+oneri|ürün\s+öneri|urun\s+oneri/.test(signal);
  const explicitClipRequest = /clip\s*(çıkar|cikar|extract|make)|kesit\s*(çıkar|cikar)|highlight\s*(çıkar|cikar|extract)|kırp|kirp|long video|uzun video|best moments|shorts\s*(çıkar|cikar|extract|make)|reels\s*(çıkar|cikar|extract|make)/.test(signal);
  const sourceIsVideoPlatform = /https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|vimeo\.com)/.test(signal);
  const isClipLink = hasLink && sourceIsVideoPlatform && explicitClipRequest;
  const isSocialLink = hasLink && !isClipLink && /instagram|tiktok|youtube|reels|shorts|social|sosyal|post|creator|influencer/.test(signal);
  const isPresenterUgcLock = /ugc|koc|creator|ai\s*presenter|with\s*presenter|heygen|video\s*agent|talking\s*avatar|product\s*demo|social\s*media\s*ad/.test(signal)
    && !/no\s*presenter|without\s*presenter|b-?roll\s*only|silent\s*\/\s*music\s*only|no\s*voice/.test(signal);
  const isFilmAnimation = !isPresenterUgcLock && /anime|animation|animasyon|short film|kısa film|kisa film|drama|story|hikaye|scene|sahne/.test(signal);
  const isCinematicAction = /cinematic\s+action|action\s+video|action\s+trailer|battle|battlefield|war|fighters?|fight\s+scene|savaş|savas|aksiyon|özel\s+savaş|ozel\s+savas|energy\s+shield|pulse\s+baton|tactical\s+staff|combat\s+glove|defense\s+drone|sci-fi\s+melee/.test(signal);

  if (plan.production_type === "video" && isPresenterUgcLock) {
    return {
      title: "AI presenter / UGC video setup",
      note: "Karakter, ses, product-demo ve Minimax seçenekleri bu UGC tarzı reklam için önceliklidir.",
      groups: [
        { id: "videoStyle", title: "Video style", options: ["AI presenter", "Avatar / talking host", "Voice-over only", "No presenter / B-roll only"] },
        { id: "heygenQuality", title: "Minimax H3", options: minimaxH3Options },
        { id: "presenterChoice", title: "Karakter seçimi", options: ["Auto choose best presenter", "Female presenter", "Male presenter", "Young energetic creator", "Professional business presenter", "Energetic UGC creator", "Mature trustworthy presenter"] },
        { id: "presenterMotion", title: "Karakter hareketleri", multi: true, options: minimaxMotionPromptOptions, credit: HEYGEN_MOTION_PROMPT_CREDITS },
        { id: "videoType", title: "Ad type", options: ["UGC-style product script", "Product ad video", "Social media short", "Product demo"] },
        { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Target duration (approx.)", options: ["15 sec", "30 sec", "45 sec", "60 sec"], credit: 350 },
        { id: "format", title: "Format", options: ["Vertical 9:16", "Instagram Reels 9:16", "TikTok 9:16", "YouTube Shorts", "Square 1:1"], credit: 250 },
        { id: "visualDirection", title: "Visual direction", options: ["With presenter", "UGC-style demo", "Product close-up", "Lifestyle scene", "Clean studio background"], credit: 400 },
        { id: "background", title: "Background", options: ["Social media style", "Home/lifestyle", "White studio", "Brand color", "City"], credit: 300 },
        { id: "motion", title: "Pace / transitions", multi: true, options: sharedMotionOptions, credit: 350 },
        { id: "voice", title: "Voice-over", options: ["Adult neutral voice", "Female voice", "Male voice", "Choose AI voice", "No voice-over"], credit: 600 },
        { id: "extras", title: "Ad assets", multi: true, options: ["Background music", "Thumbnail", "Final MP4", "Dashboard delivery", "Revision right", "Export for TikTok/Reels/Shorts"], credit: 450 }
      ]
    };
  }

    if (plan.production_type === "video" && isCinematicAction) {
    return {
      title: "Cinematic action video setup",
      note: "Only cinematic video choices are shown here. Presenter/avatar controls are hidden for this no-presenter action scene.",
      groups: [
        { id: "videoStyle", title: "Video style", options: ["Silent / music only", "Voice-over only"] },
        { id: "videoType", title: "Video type", options: ["Cinematic promo", "Social media short", "Prompt-to-video", "Script-to-video"] },
        { id: "quality", title: "Quality", options: ["1080p premium", "1080p", "4K"], credit: 900 },
        { id: "duration", title: "Target duration (approx.)", options: minimaxVideoDuration, credit: 350 },
        { id: "format", title: "Format", options: sharedVideoFormat, credit: 250 },
        { id: "sourceHandling", title: "Source / scene handling", options: ["Prompt-only", "No people", "Use uploaded material", "Keep original environment"], credit: 300 },
        { id: "background", title: "Background / environment", options: ["Cinematic scene", "City", "Nature", "Studio", "Motion graphics"], credit: 300 },
        { id: "motion", title: "Pace / transitions", multi: true, options: ["Strong opening hook", "Fast cuts", "Dynamic transitions", "Smooth zooms", "Final CTA", "Premium clean pacing"], credit: 350 },
        { id: "voice", title: "Voice-over", options: ["No voice-over", "Adult neutral voice", "Male voice", "Female voice"], credit: 600 },
        { id: "extras", title: "Extras", multi: true, options: ["Background music", "Thumbnail", "Final MP4", "Dashboard delivery", "Revision right", "Final ZIP"], credit: 450 }
      ]
    };
  }


  if (plan.production_type === "video_clipping" || isClipLink) {
    return {
      title: "Link/video clipping setup",
      note: "Options are based on the supplied video/social link.",
      groups: [
        { id: "source", title: "Source analysis", options: ["Analyze link", "Long video", "Podcast/webinar", "Social video", "Product video", "Crelavo category showcase"] },
        { id: "clipType", title: "Clip goal", multi: true, options: ["Best hooks", "Fast dynamic promo clip", "Crelavo platform showcase", "Product highlights", "Educational shorts", "Funny moments", "Viral moments", "Ad cutdowns"], credit: 450 },
        { id: "videoStyle", title: "Video style", options: ["No presenter / B-roll only", "Voice-over only", "AI presenter", "Avatar / talking host", "Silent / music only", "UI-only motion graphics"] },
      { id: "presenterChoice", title: "Karakter seçimi", options: ["No presenter / B-roll only", "Auto choose best presenter", "Female presenter", "Male presenter", "Young energetic creator", "Professional business presenter", "Energetic UGC creator", "Mature trustworthy presenter", "AI avatar host"] },
        { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "visualStyle", title: "Visual style", options: ["Cinematic", "Premium ad", "Neon tech", "SaaS modern", "Motion graphics", "Product demo", "Realistic UGC", "Viral TikTok", "Corporate", "Luxury product"], credit: 350 },
        { id: "duration", title: "Duration", options: ["15 sec", "30 sec", "45 sec", "60 sec", "2 min"], credit: 350 },
        { id: "clipCount", title: "Clip count", options: ["1 social promo clip", "3 clips", "5 clips", "10 clips"], credit: 700 },
        { id: "format", title: "Format", options: ["TikTok 9:16", "Instagram Reels 9:16", "YouTube Shorts", "LinkedIn 1:1", "YouTube 16:9", "Square 1:1"], credit: 250 },
        { id: "sourceHandling", title: "Source handling", options: ["Keep original environment", "Reframe to vertical", "Blur background", "Replace background", "Keep main speaker only", "Remove background people", "No people", "UI/dashboard scenes", "Neon motion graphics"], credit: 300 },
        { id: "motion", title: "Pace / transitions", multi: true, options: sharedMotionOptions, credit: 350 },
        { id: "voice", title: "Voice-over", options: sharedVoiceOptions, credit: 600 },
        { id: "captions", title: "Captions", options: sharedSubtitleOptions, credit: 300 },
        { id: "audio", title: "Audio / music", multi: true, options: ["Keep original audio", "Clean voice", "Remove background noise", "Add music", "Beat-synced music", "Duck music under speech", "AI generated music", "No music"], credit: 450 },
        { id: "extras", title: "Extras", multi: true, options: ["Background music", "Subtitles", "Thumbnail", "Cover visual", "Social media caption", "Hashtag set", "Final MP4", "Export for TikTok/Reels/Shorts", ...sharedDeliveryOptions], credit: 450 },
        { id: "delivery", title: "Delivery", multi: true, options: ["Final clips", "Final MP4", "Caption files", "Social export pack", "ZIP", "Revision right"], credit: 350 }
      ]
    };
  }

  if (plan.production_type === "video" && (isCommerceLink || isSaasOrSiteLink || isSocialLink || hasLink)) {
    return {
      title: isCompetitorComparison ? "Competitor comparison ad setup" : isUgcProductRecommendation ? "UGC product recommendation setup" : isCommerceLink ? "Product link ad setup" : isSaasOrSiteLink ? "Website/SaaS link ad setup" : "Link-to-video ad setup",
      note: isCompetitorComparison ? "Options focus on safe competitor analysis, positioning angle, comparison hook, and an original Crelavo ad." : isUgcProductRecommendation ? "Options focus on a native creator-style recommendation using the supplied product link." : "Options are generated from the supplied link and the selected ad/video intent.",
      groups: [
        { id: "videoType", title: "Ad type", options: isCompetitorComparison ? ["Competitor comparison", "Alternative positioning", "Market gap ad", "Website promo", "Explainer video", "Social media short"] : isCommerceLink ? ["Product ad video", "Marketplace ad", "UGC-style product script", "Explainer product video", "Social media short"] : ["Website promo", "SaaS product demo", "Explainer video", "Social media short", "Cinematic promo"] },
        { id: "heygenQuality", title: "Minimax H3", options: minimaxH3Options },
{ id: "presenterChoice", title: "Karakter seçimi", options: ["No presenter / B-roll only", "Auto choose best presenter", "Female presenter", "Male presenter", "Young energetic creator", "Professional business presenter", "Energetic UGC creator", "Mature trustworthy presenter"] },
        { id: "presenterMotion", title: "Karakter hareketleri", multi: true, options: minimaxMotionPromptOptions, credit: HEYGEN_MOTION_PROMPT_CREDITS },
        { id: "source", title: isCompetitorComparison ? "Competitor analysis" : "Link analysis", multi: true, options: isCompetitorComparison ? ["Analyze competitor page", "Extract competitor offer", "Extract benefits", "Find positioning angle", "Create comparison hook", "Create Crelavo CTA", "Safe no-copy guard"] : ["Analyze page", "Extract benefits", "Extract visuals", "Create hook", "Create CTA"], credit: 350 },
        { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Duration", options: ["15 sec", "30 sec", "45 sec", "60 sec"], credit: 350 },
        { id: "format", title: "Format", options: ["Vertical 9:16", "Horizontal 16:9", "Square 1:1", "YouTube 16:9"], credit: 250 },
        { id: "visualDirection", title: "Visual direction", options: isCommerceLink ? ["Product close-up", "With presenter", "Clean studio background", "Lifestyle scene", "Marketplace ad", "UGC-style demo", "Premium product commercial"] : ["UI dashboard demo", "Website walkthrough", "Product explainer", "No people", "With presenter", "Motion graphics", "Premium SaaS promo"], credit: 400 },
        { id: "background", title: "Background", options: isCommerceLink ? ["White studio", "Brand color", "Home/lifestyle", "Luxury surface", "Social media style"] : ["Product UI", "Brand color", "Clean gradient", "Dashboard background", "Motion graphics"], credit: 300 },
        { id: "motion", title: "Pace / transitions", multi: true, options: sharedMotionOptions, credit: 350 },
        { id: "voice", title: "Voice-over", options: ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Choose AI voice"], credit: 600 },
        { id: "extras", title: "Ad assets", multi: true, options: ["Background music", "Subtitles", "Thumbnail", "Final MP4", "Revision right", "Export for TikTok/Reels/Shorts"], credit: 450 }
      ]
    };
  }

  if (isFilmAnimation && ["animation", "anime_short_film", "video"].includes(plan.production_type)) {
    return plan.production_type === "anime_short_film" ? setupProfiles.anime_short_film : plan.production_type === "animation" ? setupProfiles.animation : setupProfiles.video;
  }

  return base;
}

function voiceDisabledByPrompt(text: string) {
  return /no\s*voice|without\s*voice|no\s*human\s*voice-?over|no\s*voice-?over|without\s*voice-?over|voice-?over\s*(off|none)|no\s*narration\s*required|no\s*human\s*narration|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/.test(text);
}

function subtitlesDisabledByPrompt(text: string) {
  return /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|subtitles?\s*(off|none)|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/.test(text);
}

function musicDisabledByPrompt(text: string) {
  return /no\s*music|without\s*music|music\s*(off|none)|müzik\s*olmasın|muzik\s*olmasın|müzik\s*yok|muzik\s*yok|sessiz/.test(text);
}

function voiceRequestedByPrompt(text: string) {
  return /ai\s*presenter|presenter|host|spokesperson|with\s+presenter|voice-?over|narration|spoken|speak|talking|dialogue|diyalog|replik|seslendirme|anlatıcı|anlatici|konuşsun|konussun|anlatsın|anlatsin|sesli|with\s*voice/.test(text);
}

function subtitlesRequestedByPrompt(text: string) {
  return /with\s*subtitles?|subtitles?\s*(on|required|yes)?|add\s*subtitles?|altyaz[ıi]\s*(olsun|istiyorum|ekle|var)?|altyaz[ıi].*(takip\s*etsin|takip etsin)|subtitle\s*file|altyaz[ıi]\s*dosyas[ıi]/.test(text);
}

function optionMatchesDuration(option: string, text: string) {
  const normalized = option.toLowerCase();
  const seconds = normalized.match(/(\d+)\s*sec/);
  if (seconds) {
    const value = seconds[1];
    return new RegExp(`(?<!-)\\b${value}[-\\s]*(sn|saniye|saniyelik|sec|second|seconds|s)\\b|(?<!-)\\b${value}[-\\s]*(second|seconds|sec)[-\\s]*(vertical|horizontal|animation|video|cartoon)`).test(text);
  }
  const minutes = normalized.match(/(\d+)\s*min/);
  if (minutes) {
    const value = minutes[1];
    return new RegExp(`(?<!-)\\b${value}\\s*(dk|dakika|dakikalık|dakikalik|min|minute|minutes)\\b`).test(text);
  }
  return text.includes(normalized);
}

function requestedDurationOption(options: string[], text: string) {
  const overall = text.match(/\b(\d+)[-\s]*(?:sn|saniye|saniyelik|sec|second|seconds|s)\b[^.!?]{0,80}\b(?:vertical|horizontal|animation|animasyon|video|cartoon|çizgi|cizgi)\b/)
    ?? text.match(/\b(?:create|make|generate|produce|hazırla|hazirla|oluştur|olustur|yap)[^.!?]{0,80}\b(\d+)[-\s]*(?:sn|saniye|saniyelik|sec|second|seconds|s)\b/);
  const value = Number(overall?.[1]);
  if (Number.isFinite(value) && value > 0) {
    const exact = options.find((option) => new RegExp(`\b${value}\s*sec\b`, "i").test(option));
    if (exact) return exact;
    const secondOptions = options
      .map((option) => ({ option, seconds: Number(option.match(/(\d+)\s*sec/i)?.[1] ?? 0) }))
      .filter((item) => item.seconds > 0)
      .sort((a, b) => a.seconds - b.seconds);
    const ceiling = secondOptions.find((item) => item.seconds >= value);
    if (ceiling) return ceiling.option;
    const largest = secondOptions.at(-1);
    if (largest) return largest.option;
  }
  return options.find((option) => optionMatchesDuration(option, text));
}

function requestedVoiceOption(text: string, options: string[]) {
  const specificVoiceChecks: Array<[RegExp, RegExp]> = [
    [/çocuk.*(ses|anlatıcı|anlatici)|cocuk.*(ses|anlatıcı|anlatici)|child\s*(voice|narrator)/, /child/],
    [/yaşlı.*(ses|anlatıcı|anlatici)|yasli.*(ses|anlatıcı|anlatici)|senior\s*(voice|narrator)/, /senior/],
    [/kadın.*(ses|anlatıcı|anlatici)|kadin.*(ses|anlatıcı|anlatici)|female\s*(voice|narrator)/, /female/],
    [/erkek.*(ses|anlatıcı|anlatici)|male\s*(voice|narrator)/, /male/],
  ];

  for (const [textPattern, optionPattern] of specificVoiceChecks) {
    if (textPattern.test(text)) {
      const specific = options.find((option) => optionPattern.test(option.toLowerCase()));
      if (specific) return specific;
    }
  }

  const direct = options.find((option) => text.includes(option.toLowerCase()));
  if (direct) return direct;

  if (/dış\s*anlatıcı|dis\s*anlatici|anlatıcı\s*sesi|anlatici\s*sesi|adult\s*neutral/.test(text)) {
    return options.find((option) => /adult neutral/.test(option.toLowerCase()));
  }

  return undefined;
}

function defaultSetupFor(type: string, hint = "", plan?: StudioPlan | null): ProductionSetupState {
  const profile = plan ? dynamicProfileForPlan(plan, hint) : profileForType(type);
  const text = hint.toLowerCase();
  const noVoice = voiceDisabledByPrompt(text);
  const noSubtitles = subtitlesDisabledByPrompt(text);
  const wantsVoice = !noVoice && voiceRequestedByPrompt(text);
  const wantsSubtitles = !noSubtitles && subtitlesRequestedByPrompt(text);
  const wantsNoPeopleMotionAd = /no\s+human\s+presenter|do\s+not\s+use\s+any\s+human|no\s*people|no\s*presenter|avatarlar\s*olmasın|insan\s*olmasın|avatars?/.test(text)
    && /motion\s+graphics|kinetic|typography|animated\s+text|text\s+cards|glitch|swipe\s+transitions|dynamic\s+promotional/.test(text);
  const wantsNoPresenterIntent = /no\s+presenter|b-?roll\s+only|no\s+avatar|no\s+talking\s+to\s+camera|no\s+lip-?sync|lifestyle\s+b-?roll|homepage\s+showcase|showcase\s+loop|wow\s+video|not\s+a\s+presenter|presenter\s*değil|sunucu\s*olmasın|sunucusuz|avatar\s*olmasın|talking\s+head\s*olmasın/.test(text);
  const isCinematicActionHint = /cinematic\s+action|action\s+video|action\s+trailer|battle|battlefield|war|fighters?|fight\s+scene|savaş|savas|aksiyon|özel\s+savaş|ozel\s+savas|energy\s+shield|pulse\s+baton|tactical\s+staff|combat\s+glove|defense\s+drone|sci-fi\s+melee/.test(text);
  const wantsMinimaxStylePresenterAd = /crelavo|heygen|ugc|creator-style|one\s+natural\s+creator|realistic\s+human\s+creator|with\s+presenter|product\s+demo|promotional\s+video|tanıtım\s*videosu|tanitim\s*videosu|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|sunucu|anlattığı|anlattigi|uygulamalı|uygulamali|dışarıda|disarida|sokak|şehir|sehir|high-converting|social\s+media\s+ad|kinetic|hyperframes|motion\s+graphics/.test(text)
    && !wantsNoPeopleMotionAd
    && !wantsNoPresenterIntent
    && !isCinematicActionHint
    && !/no\s*people|no\s*presenter|ui-only|screenshot-only/.test(text);
  return Object.fromEntries(profile.groups.map((group) => {
    if (group.multi) {
      const selected: string[] = [];
      const addOption = (pattern: RegExp) => {
        const option = group.options.find((item) => pattern.test(item.toLowerCase()));
        if (option && !selected.includes(option)) selected.push(option);
      };
      if (group.id === "character") {
        if (/consistent characters|same character|keep same|aynı karakter|ayni karakter|aynı görün|ayni gorun/.test(text)) addOption(/keep same characters/);
        if (/multiple characters|multi-character|dede|babaanne|torun|anne|baba|çoklu karakter|coklu karakter/.test(text)) addOption(/multiple characters/);
        if (/create|generate|ai characters|karakter oluştur|karakter olustur/.test(text)) addOption(/create ai characters/);
      }
      if (group.id === "delivery") {
        if (isImageProductionType(type)) addOption(/png\/jpg/);
        if (!isImageProductionType(type) && /mp4|final output|assembled mp4|final mp4|video/.test(text)) addOption(/final mp4/);
        if (/dashboard/.test(text)) addOption(/dashboard delivery/);
        if (/revision|revizyon/.test(text)) addOption(/revision/);
      }
      if (group.id === "source") {
        if (/competitor|comparison|compare|alternative|position\s+crelavo|rakip|karşılaştır|karsilastir|alternatif/.test(text)) {
          addOption(/analyze competitor page/);
          addOption(/extract competitor offer/);
          addOption(/find positioning angle/);
          addOption(/comparison hook/);
          addOption(/crelavo cta/);
          addOption(/safe no-copy/);
        }
      }
      if (group.id === "extras") {
        if (wantsSubtitles) addOption(/subtitles/);
        if (/mp4|final output|assembled mp4|final mp4|video/.test(text)) addOption(/final mp4/);
        if (!musicDisabledByPrompt(text) && /music|müzik|muzik|background music|fon müzik|fon muzik/.test(text)) addOption(/music/);
        if (/thumbnail|cover|kapak|vitrin|showcase|social|sosyal|fomo|hook|kan[ıi]ca|kanca/.test(text)) addOption(/thumbnail/);
        if (/dashboard|panel/.test(text)) addOption(/dashboard delivery/);
        if (/revision|revizyon/.test(text)) addOption(/revision/);
      }
      if (group.id === "presenterMotion") {
        if (/enerjik|energetic|dynamic|dinamik|heyecanlı|heyecanli|ugc|creator|social/.test(text)) addOption(/energetic gestures/);
        if (/gül|gul|smile|friendly|samimi/.test(text)) addOption(/smile/);
        if (/selam|welcome|hoş geld|hos geld|wave/.test(text)) addOption(/wave/);
        if (/cta|çağrı|cagri|hemen|başla|basla|try|start/.test(text)) addOption(/cta hand gesture|point at camera/);
      }
    if (group.id === "heygenQuality") {
selected.length = 0;
  selected.push("Minimax H3");
    }

      return [group.id, selected];
    }
    let selected = group.options[0] ? [group.options[0]] : [];
    if (group.id === "imageType") {
      const wanted = imageTypeFromPrompt(text, group.options);
      if (wanted) selected = [wanted];
    }
    if (group.id === "style" && isImageProductionType(type)) {
      const luxury = /premium|luxury|lüks|luks|editorial|beauty|serum|cosmetic|kozmetik|clean|minimal/.test(text) ? group.options.find((option) => /luxury product|minimal/i.test(option)) : undefined;
      const wanted = group.options.find((option) => text.includes(option.toLowerCase())) || luxury;
      if (wanted) selected = [wanted];
    }
    if (group.id === "aspectRatio") {
      const wanted = imageAspectRatioFromPrompt(text, group.options);
      if (wanted) selected = [wanted];
    }
    if (group.id === "videoType" && /competitor|comparison|compare|alternative|position\s+crelavo|rakip|karşılaştır|karsilastir|alternatif/.test(text)) {
      const wanted = group.options.find((option) => /competitor comparison|alternative positioning|market gap/.test(option.toLowerCase()));
      if (wanted) selected = [wanted];
    }
    if (group.id === "videoType" && /ugc|koc|creator|social\s+media\s+creator|real\s+social\s+media|recommendation|product\s+recommendation|tiktok|reels|influencer/.test(text)) {
      const wanted = group.options.find((option) => /ugc-style product script|social media short|product ad video/.test(option.toLowerCase()));
      if (wanted) selected = [wanted];
    }
    if (group.id === "presenterChoice") {
      if (wantsNoPresenterIntent) {
        const noPresenter = group.options.find((option) => /no presenter\/ b-roll only/i.test(option));
        if (noPresenter) selected = [noPresenter];
      } else {
        const female = /female\s*(presenter|creator|host|avatar)|woman\s*(presenter|creator|host|avatar)|kad[ıi]n\s*(sunucu|avatar)/.test(text) ? group.options.find((option) => /female presenter/i.test(option)) : undefined;
        const male = /male\s*(presenter|creator|host|avatar)|man\s*(presenter|creator|host|avatar)|erkek\s*(sunucu|avatar)/.test(text) ? group.options.find((option) => /male presenter/i.test(option)) : undefined;
        const ugc = /ugc|koc|creator|tiktok|reels|influencer|social\s+media\s+creator|energetic|enerjik/.test(text) ? group.options.find((option) => /energetic ugc creator|young energetic creator/i.test(option)) : undefined;
        const professional = /saas|business|professional|demo|explainer|kurumsal|profesyonel/.test(text) ? group.options.find((option) => /professional business presenter/i.test(option)) : undefined;
        const trustworthy = /product\s+ad|e-?commerce|ecommerce|trustworthy|güvenilir|guvenilir|mature|olgun/.test(text) ? group.options.find((option) => /mature trustworthy presenter/i.test(option)) : undefined;
        const wanted = female || male || ugc || professional || trustworthy;
        if (wanted) selected = [wanted];
      }
    }
    if (group.id === "videoStyle") {
      const silent = /sessiz|seslendirme\s*olmas[ıi]n|ses\s*olmas[ıi]n|no\s*voice|without\s*voice/.test(text) ? group.options.find((option) => /silent/i.test(option)) : undefined;
      const presenter = /sunucu|presenter|avatar|konuşan\s*kişi|konusan\s*kisi|ekranda\s*bir\s*sunucu/.test(text) && !/sunucu\s*olmas[ıi]n|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucusuz|insans[ıi]z/.test(text) ? group.options.find((option) => /presenter/i.test(option)) : undefined;
      const voiceOnly = /seslendirme|voice-over|voiceover|anlatıcı|anlatici/.test(text) ? group.options.find((option) => /voice-over only/i.test(option)) : undefined;
      const wanted = silent || presenter || voiceOnly;
      if (wanted) selected = [wanted];
    }
    if (group.id === "duration") {
      const wanted = requestedDurationOption(group.options, text);
      if (wanted) selected = [wanted];
    }
    if (group.id === "visualDirection" && /ugc|koc|creator|social\s+media\s+creator|real\s+social\s+media|recommendation|product\s+recommendation|tiktok|reels|influencer/.test(text)) {
      const wanted = group.options.find((option) => /ugc-style demo|with presenter/.test(option.toLowerCase()));
      if (wanted) selected = [wanted];
    } else if (group.id === "visualDirection" && /ai\s*presenter|presenter|host|sunucu|spokesperson|with\s+presenter|ekranda\s+sunucu/.test(text) && !/no\s*presenter|no\s*people|sunucu\s*olmas[ıi]n|insan\s*olmas[ıi]n/.test(text)) {
      const wanted = group.options.find((option) => /with presenter/.test(option.toLowerCase()));
      if (wanted) selected = [wanted];
    }
    if (group.id === "quality") {
      const premiumWanted = /1080p\s*premium|premium\s*1080p/.test(text) ? group.options.find((option) => /1080p premium/i.test(option)) : undefined;
      const fourK = /\b4k\b/.test(text) ? group.options.find((option) => /4k/i.test(option)) : undefined;
      const premiumAdDefault = wantsMinimaxStylePresenterAd || wantsNoPeopleMotionAd ? group.options.find((option) => /1080p premium/i.test(option)) : undefined;
      const wanted = premiumWanted || fourK || group.options.find((option) => text.includes(option.toLowerCase())) || premiumAdDefault;
      if (wanted) selected = [wanted];
    }
    if (["sourceHandling", "visualDirection"].includes(group.id)) {
      if (wantsMinimaxStylePresenterAd || /with\s*presenter|ai\s*presenter|talking\s*presenter|talking\s*avatar|realistic\s*human\s*(presenter|creator)|creator-style\s*(presenter|human|creator)|single\s*(presenter|creator)|one\s+natural\s+creator|one\s+realistic\s+human\s+creator|heygen|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|sunucu|anlattığı|anlattigi/.test(text)) {
        const presenter = group.options.find((option) => /with presenter/i.test(option));
        if (presenter) selected = [presenter];
      }
      if (wantsNoPeopleMotionAd || /no\s*people|no\s*presenter|without\s*(people|presenter|human)|ui-only|screenshot-only|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|kişi\s*olmas[ıi]n|kisi\s*olmas[ıi]n|insans[ıi]z|sunucusuz/.test(text)) {
        const noPeople = group.options.find((option) => /no people/i.test(option));
        if (noPeople) selected = [noPeople];
      }
    }
    if (group.id === "background") {
      const socialMediaStyle = /ugc|koc|creator|social\s+media\s+creator|real\s+social\s+media|recommendation|product\s+recommendation|tiktok|reels|influencer/.test(text) ? group.options.find((option) => /social media style/i.test(option)) : undefined;
      const motionGraphics = wantsNoPeopleMotionAd || /motion\s*graphics|hareketli\s*grafik|arayüz|arayuz|ui|animated\s*text|animasyonlu\s*yaz|text\s*cards|glitch\s*transitions|swipe\s*transitions|hızlı\s*geçiş|hizli\s*gecis/.test(text) ? group.options.find((option) => /motion graphics/i.test(option)) : undefined;
const city = /dışarıda|disarida|outdoor|sokak|street|şehir|sehir|city/.test(text) ? group.options.find((option) => /city/i.test(option)) : undefined;
const lifestyle = /lifestyle|creator-style|ugc|outdoor|walking|casual|natural|hareketli|uygulamalı|uygulamali/.test(text) ? group.options.find((option) => /lifestyle|home\/lifestyle/i.test(option)) : undefined;
const brand = /brand\s*color|marka\s*rengi|crelavo\s*brand/.test(text) ? group.options.find((option) => /brand color/i.test(option)) : undefined;
const cinematic = /cinematic\s*scene|sinematik/.test(text) ? group.options.find((option) => /cinematic scene/i.test(option)) : undefined;
const studio = /studio/.test(text) && !/not\s*studio|avoid\s*studio|not\s*corporate\s*studio/.test(text) ? group.options.find((option) => /studio/i.test(option)) : undefined;
const wanted = socialMediaStyle || motionGraphics || city || lifestyle || brand || cinematic || studio;
      if (wanted) selected = [wanted];
    }
    if (group.id === "motion") {
      const motionSelections: string[] = [];
      if (/ugc|koc|creator|social\s+media\s+creator|real\s+social\s+media|recommendation|product\s+recommendation|tiktok|reels|influencer/.test(text)) {
        motionSelections.push(...group.options.filter((option) => /strong opening hook|final cta|energetic social pacing/i.test(option)));
      }
      if (/dinamik|dynamic|hareketli|geçiş|gecis|transition/.test(text)) motionSelections.push(...group.options.filter((option) => /dynamic transitions|smooth zooms|swipe transitions/i.test(option)));
      if (/hızlı|hizli|fast|quick|tempo|sosyal medya|social/.test(text)) motionSelections.push(...group.options.filter((option) => /fast cuts|energetic social pacing/i.test(option)));
      if (/açılış|acilis|hook|güçlü|guclu/.test(text)) motionSelections.push(...group.options.filter((option) => /strong opening hook/i.test(option)));
      if (/cta|çağrı|cagri|final|son ekran/.test(text)) motionSelections.push(...group.options.filter((option) => /final cta/i.test(option)));
      if (/overlay|arayüz|arayuz|ui|yazı|yazi|text/.test(text)) motionSelections.push(...group.options.filter((option) => /ui overlays|animated text overlays/i.test(option)));
      if (isCinematicActionHint) motionSelections.push(...group.options.filter((option) => /strong opening hook|fast cuts|dynamic transitions|smooth zooms|final cta|premium clean pacing/i.test(option)));
      selected = Array.from(new Set(motionSelections)).slice(0, 6);
    }
    if (group.id === "voice") {
      const explicitPresenterVoice = /ai\s*presenter|presenter|host|sunucu|spokesperson|with\s+presenter|ekranda\s+sunucu/.test(text) && !/no\s*presenter|no\s*people|sunucu\s*olmas[ıi]n|insan\s*olmas[ıi]n/.test(text);
      if (noVoice && !explicitPresenterVoice) {
        selected = group.options.includes("No voice-over") ? ["No voice-over"] : [];
      } else {
        const needsMultiCharacterAiVoices = wantsVoice && /different\s*voices?|different\s*voice\s*for\s*each|separate\s*voices?|separate\s*voice\s*per\s*person|character\s*voices?|per-character|dialogue|diyalog|replik|turkish\s*voices?|farklı\s*ses|farkli\s*ses|her\s*karakter.*ses|karakter\s*ses/.test(text);
        if (needsMultiCharacterAiVoices && group.options.includes("Choose AI voice")) selected = ["Choose AI voice"];
        else {
          const presenterFemaleVoice = /\bfemale\s*(presenter|creator|avatar|business presenter)|\bwoman\s*(presenter|creator|avatar)/.test(text) ? group.options.find((option) => /female voice/i.test(option)) : undefined;
          const presenterMaleVoice = /\bmale\s*(presenter|creator|avatar|business presenter)|\bman\s*(presenter|creator|avatar)/.test(text) ? group.options.find((option) => /male voice/i.test(option)) : undefined;
          const explicitVoice = requestedVoiceOption(text, group.options);
          const neutralPresenterVoice = wantsMinimaxStylePresenterAd ? group.options.find((option) => /adult neutral voice/i.test(option)) : undefined;
          const wanted = presenterFemaleVoice || presenterMaleVoice || neutralPresenterVoice || explicitVoice;
          if (wanted) selected = [wanted];
          else if (wantsVoice && group.options.includes("Adult neutral voice")) selected = ["Adult neutral voice"];
        }
      }
    }
    if (group.id === "subtitles") {
      if (noSubtitles) {
        selected = group.options.includes("No subtitles") ? ["No subtitles"] : [];
      } else if (wantsSubtitles) {
        selected = group.options.includes("Burned subtitles") && /burned|gömülü|gomulu|mp4\s*içinde|mp4\s*icinde|videoya\s*göm|videoya\s*gom/.test(text)
          ? ["Burned subtitles"]
          : group.options.includes("Auto subtitles")
            ? ["Auto subtitles"]
            : selected;
      }
    }
    return [group.id, selected];
  }));
}

function sanitizeSetupForProduction(type: string, setup: ProductionSetupState | undefined, hint = "", plan?: StudioPlan | null): ProductionSetupState {
  if (!isImageProductionType(type)) return setup ?? {};
  const defaults = defaultSetupFor(type, hint, plan);
  return {
    imageType: defaults.imageType ?? ["Social media post"],
    outputs: defaults.outputs ?? ["1 visual"],
    style: defaults.style ?? ["Luxury product"],
    aspectRatio: defaults.aspectRatio ?? ["Portrait 4:5"],
    delivery: defaults.delivery?.length ? defaults.delivery : ["PNG/JPG"]
  };
}

function selectedSetupItems(setup: ProductionSetupState, type = "") {
  const items = Object.values(setup).flat().filter(Boolean);
  if (!isImageProductionType(type)) return items;
  return items.filter((item) => !/video agent auto edit|heygen|avatar|voice|music|mp4|presenter|sunucu/i.test(String(item)));
}

function productionSourceHandling(type: string, selectedItems: string[]) {
  const signal = `${type} ${selectedItems.join(" ")}`.toLowerCase();
  return {
    sourceHandling: /replace background|change background|arka planı değiştir|arka plani degistir/.test(signal) ? "replace_background" : /blur background|arka planı blur/.test(signal) ? "blur_background" : /analyze link|analyze page|source analysis|link analysis/.test(signal) ? "analyze_source" : "keep_or_follow_source",
    peopleHandling: /remove background people|kişileri kaldır|kisileri kaldir/.test(signal) ? "remove_background_people" : /main speaker only|sadece konuşan|sadece konusan/.test(signal) ? "main_speaker_only" : /no people|people-free|insansız|insansiz/.test(signal) ? "no_people" : "category_default",
    backgroundStyle: /studio/.test(signal) ? "studio" : /brand color|marka rengi/.test(signal) ? "brand_color" : /lifestyle/.test(signal) ? "lifestyle" : /fantasy/.test(signal) ? "fantasy" : /cyberpunk/.test(signal) ? "cyberpunk" : /dashboard|ui|website|saas/.test(signal) ? "product_ui" : "category_default",
    environmentPolicy: /keep original|orijinal ortam/.test(signal) ? "keep_original_environment" : /new background|replace background|arka plan/.test(signal) ? "allow_environment_change" : "category_default"
  };
}

function productionOutputIntent(type: string, selectedItems: string[]) {
  const signal = `${type} ${selectedItems.join(" ")}`.toLowerCase();
  const clipMatch = signal.match(/(3|5|10)\s+clips?/);
  const alternativeMatch = signal.match(/(3|5)\s+alternatives?/);
  const requestedClipCount = clipMatch ? Number(clipMatch[1]) : type === "video_clipping" ? 3 : 0;
  const requestedAlternativeCount = alternativeMatch ? Number(alternativeMatch[1]) : 0;
  return {
    requestedClipCount,
    requestedAlternativeCount,
    outputCount: requestedClipCount || requestedAlternativeCount || 1,
    uniqueOutputsRequired: Boolean(requestedClipCount || requestedAlternativeCount),
    duplicatePolicy: requestedClipCount
      ? "Each clip must come from a different source moment/timestamp. Never duplicate the same clip with only minor edits."
      : requestedAlternativeCount
        ? "Each alternative must use a distinct hook, visual angle or scene structure. Never repeat the same output."
        : "Single best output",
    timestampPolicy: requestedClipCount ? "different_source_timestamps_required" : "not_applicable"
  };
}

function optionCredit(option: string, group: SetupGroup) {
  const item = option.toLowerCase();
  const base = group.credit ?? 200;
  if (/no |none|yok/.test(item)) return 0;
  if (/4k/.test(item)) return Math.round(base * 7);
  if (/5 min|5 dakika|5 dk/.test(item)) return Math.round(base * 8);
  if (/3 min|3 dakika|3 dk/.test(item)) return Math.round(base * 5.5);
  if (/1080p premium|premium/.test(item)) return Math.round(base * 3.5);
  if (/10 clips|5 alternatives|custom|\$2499/.test(item)) return Math.round(base * 4);
  if (/60 sec|60 saniye|2 min|2 dakika|multiple characters|separate voice|own voice|ai voice|lip-sync|background music|subtitles|subtitle|thumbnail/.test(item)) return Math.round(base * 2.5);
  if (/1080p|30 sec|30 saniye|45 sec|45 saniye|5 clips|source code|expo source|final zip|readme|deployment guide/.test(item)) return Math.round(base * 1.6);
  if (/10 sec|10 saniye|15 sec|15 saniye|3 clips|png\/jpg/.test(item)) return Math.round(base * 1.05);
  if (/5 sec|5 saniye|1 visual|dashboard delivery/.test(item)) return Math.round(base * 0.55);
  return group.multi ? Math.round(base * 1.3) : Math.round(base * 1.1);
}

function setupCreditBreakdown(type: string, setup: ProductionSetupState, plan?: StudioPlan | null, hint = "") {
  const profile = plan ? dynamicProfileForPlan(plan, hint) : profileForType(type);
  return profile.groups
    .filter((group) => !(isImageProductionType(type) && /heygen|video style|presenter|voice|music/i.test(group.id + " " + group.title)))
    .map((group) => {
      const selected = setup[group.id] ?? [];
      const credits = group.id === "heygenQuality" ? 0 : selected.reduce((sum, option) => sum + optionCredit(option, group), 0);
      return { groupId: group.id, title: group.title, selected, credits };
    });
}

function selectedDurationSeconds(setup: ProductionSetupState, plan?: StudioPlan | null) {
  const type = String(plan?.production_type ?? "").toLowerCase();
  const duration = String((setup.duration ?? [])[0] ?? plan?.selected_duration ?? (/^(animation|anime_short_film|stickman_animation|video|cinematic_video|music_video|drone_video)$/i.test(type) ? "Auto" : "30 sec"));
  if (/project/i.test(duration)) return 0;
  if (/^auto$/i.test(duration)) return 15;
  const number = Number(duration.match(/\d+/)?.[0] ?? 30) || 30;
  if (/min|dakika|dk/i.test(duration)) return number * 60;
  return number;
}

function heygenQualityCreditBreakdown(setup: ProductionSetupState, plan?: StudioPlan | null) {
  if (isImageProductionType(String(plan?.production_type ?? ""))) return { title: "Minimax H3", selected: "", credits: 0, seconds: 0, creditsPerMinute: 0 };
  const selected = String((setup.heygenQuality ?? [])[0] ?? "Minimax H3");
  const seconds = selectedDurationSeconds(setup, plan);
  if (!seconds) return { title: "Minimax H3", selected, credits: 0, seconds, creditsPerMinute: 0 };
  const creditsPerMinute = HEYGEN_PREMIUM_CREDITS_PER_MINUTE;
  return {
    title: selected,
    selected,
    credits: Math.ceil((seconds / 60) * creditsPerMinute),
    seconds,
    creditsPerMinute
  };
}

function setupExtraCredits(type: string, setup: ProductionSetupState, plan?: StudioPlan | null, hint = "") {
  return setupCreditBreakdown(type, setup, plan, hint).reduce((total, item) => total + item.credits, 0);
}

function productionCardCredits(cards: string[]) {
  return cards.reduce((total, card) => {
    const item = card.toLowerCase();
    if (/revision/.test(item)) return total + 300;
    if (/final mp4|animation video|visual video|ai drone video|lip-sync|voice-over|subtitles|music/.test(item)) return total + 900;
    if (/source|zip|readme|setup|database|admin|billing|checkout|render|final|mp4|voice|subtitle/.test(item)) return total + 550;
    return total + 300;
  }, 0);
}

function baseDraftCredits(plan: StudioPlan | null) {
  if (!plan) return 0;
  const type = plan.production_type;
  if (["website", "saas", "mobile_app", "admin_project"].includes(type)) return 2400;
  if (["animation", "anime_short_film", "stickman_animation", "video", "cinematic_video", "documentary", "drama", "music_video", "drone_video"].includes(type)) return 2600;
  if (["talking_video", "avatar", "lip_sync", "voice_clone"].includes(type)) return 2200;
  if (["image", "brand_kit", "visual_clone", "virtual_model_studio"].includes(type)) return 1400;
  if (["campaign", "document_pack", "live_sales_agent"].includes(type)) return 1600;
  return Math.max(1000, Math.round(Number(plan.estimated_credits ?? 0) * 0.25));
}

function setupDerivedFields(type: string, setup: ProductionSetupState) {
  const items = selectedSetupItems(setup);
  const imageType = items.find((item) => /product visual|poster|social media post|logo\/brand kit|thumbnail|banner/i.test(item));
  const quality = items.find((item) => /1080p|2K|4K|premium/i.test(item));
  const duration = items.find((item) => /sec|min|Episode|Project based/i.test(item));
  const style = items.find((item) => /animation|cinematic|realistic|minimal|corporate|luxury|UGC|product demo|stickman|whiteboard|motion/i.test(item));
  const formats = items.filter((item) => /MP4|PNG|JPG|ZIP|README|PDF|CSV|source|dashboard|caption|subtitle|Expo/i.test(item));
  const isImage = isImageProductionType(type);
  return {
    selected_quality: quality || (isProjectType(type) ? "Project based" : isImage ? "Image" : "1080p"),
    selected_duration: duration || (isProjectType(type) ? "Project based" : isImage ? "Static" : (/^(animation|anime_short_film|stickman_animation|video|cinematic_video|music_video|drone_video)$/i.test(type) ? "Auto" : "30 sec")),
    selected_style: style || (isProjectType(type) ? "Premium modern interface" : isImage ? (imageType ? "Social media visual" : "Crelavo image style") : "Crelavo production style"),
    selected_features: items.length ? items : (isImage ? ["Production package", "PNG/JPG delivery"] : ["Production package", "Dashboard delivery"]),
    delivery_formats: formats.length ? formats.map((format) => format.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")) : (isProjectType(type) ? ["source_code", "readme", "dashboard_delivery"] : isImage ? ["png", "jpg", "dashboard_delivery"] : ["final_mp4", "dashboard_delivery"])
  };
}

function filterCardsForPrompt(cards: string[], hint = "", type = "") {
  const text = hint.toLowerCase();
  const noVoice = voiceDisabledByPrompt(text);
  const noSubtitles = subtitlesDisabledByPrompt(text);
  const noMusic = musicDisabledByPrompt(text);
  const isImage = isImageProductionType(type) || isStaticImagePrompt(text);
  const isProject = isProjectType(type);
  return cards.filter((card) => {
    const item = card.toLowerCase();
    if (isImage && /storefront|product catalog|cart|checkout|admin product manager|orders dashboard|source zip|readme|setup/.test(item)) return false;
    if (isImage && /video agent auto edit|heygen/.test(item)) return false;
    if (isProject && /final image|prompt pack|export specs|usage notes/.test(item)) return false;
    if (noVoice && /voice|seslendirme|narration/.test(item)) return false;
    if (noSubtitles && /subtitle|caption|altyaz/.test(item)) return false;
    if (noMusic && /music|müzik|muzik/.test(item)) return false;
    return true;
  });
}

function productionCardsFor(plan: StudioPlan | null) {
  if (!plan) return [];
  const text = `${plan.production_type} ${plan.package_id} ${plan.summary} ${plan.selected_modules.join(" ")}`.toLowerCase();
  const type = plan.production_type;
  if (["animation", "anime_short_film", "stickman_animation"].includes(type)) return ["Production brief", "Scene plan", "Animation video", "Voice-over", "Subtitles", "Music", "Final MP4", "Revision path"];
  if (type === "drone_video") return ["Production brief", "Route / camera plan", "AI drone video", "Location labels", "Narration", "Final MP4", "Thumbnail", "Revision path"];
  if (type === "video_clipping") return ["Source analysis", "Clip selection", "Captions", "Audio cleanup", "Final clips", "ZIP package", "Revision path"];
  if (["video", "cinematic_video", "documentary", "drama", "music_video"].includes(type)) return ["Production brief", "Script / scene plan", "Visual video", "Voice-over", "Subtitles", "Music", "Final MP4", "Revision path"];
  if (["talking_video", "avatar", "lip_sync", "voice_clone"].includes(type)) return ["Script", "Avatar / face", "Voice", "Lip-sync", "Subtitles", "Final MP4", "Voice settings", "Revision path"];
  if (type === "live_sales_agent") return ["Agent config", "Sales playbook", "Product FAQ", "Lead capture", "Admin inbox", "Setup guide", "Revision path"];
  if (plan.production_type === "mobile_app") return ["Home screen", "Login flow", "User dashboard", "Settings", "Admin/control screen", "Expo source ZIP", "README / setup"];
  if (plan.production_type === "saas") return ["Landing page", "Auth", "Dashboard", "Billing", "Admin panel", "Database schema", "Source ZIP", "README / setup"];
  if (plan.production_type === "admin_project") return ["Admin dashboard", "User management", "CRUD records", "Roles", "Activity log", "Source ZIP", "README / setup"];
  if (plan.production_type === "image") return ["Final image", "Prompt pack", "Export specs", "Usage notes"];
  if (/ecommerce|commerce|store|shop|product|checkout/.test(text)) return ["Storefront", "Product catalog", "Cart", "Checkout", "Admin product manager", "Orders dashboard", "Source ZIP", "README / setup"];
  if (/seo|document/.test(plan.production_type)) return ["Keywords", "Metadata", "Content outline", "Page copy", "Implementation checklist"];
  if (/campaign/.test(plan.production_type)) return ["Campaign copy", "Social export plan", "Marketplace export", "Creative brief", "ZIP package"];
  return ["Production brief", "Preview", "Final delivery", "Revision path"];
}

function isCharacterDialogueAnimationPrompt(prompt: string) {
  const normalized = prompt.toLocaleLowerCase("tr-TR");
  const sceneCount = (normalized.match(/sahne\s*\d+\s*:/g) ?? []).length;
  const quotedDialogueCount = (prompt.match(/[“\"][^”\"]{2,160}[”\"]/g) ?? []).length;
  const wantsAnimation = /animasyon|animation|çizgi film|cizgi film|cartoon|2d/.test(normalized);
  const wantsSpeech = /seslendirme|voice-over|voiceover|diyalog|dialogue|konuş|konus|subtitles|subtitle|altyaz/.test(normalized);
  const hasCharacterContinuity = /consistent characters|same character|karakter|character|dede|babaanne|torun|anne|baba|aynı görün|ayni gorun/.test(normalized);
  return wantsAnimation && wantsSpeech && hasCharacterContinuity && sceneCount >= 2 && quotedDialogueCount >= 2;
}

function animationStylePackId(prompt: string, productionType: string) {
  const text = `${prompt} ${productionType}`.toLocaleLowerCase("tr-TR");
  if (/stickman|çöp adam|cop adam|cöp adam|whiteboard/.test(text)) return "stickman_clean";
  if (/anime|japanese animation|ghibli|shinkai/.test(text)) return "anime_modern";
  if (/pixar|3d cartoon|3d animated|3d animation|animated film|cartoon film|character animation|çizgi film|cizgi film/.test(text)) return "pixar_3d";
  if (/sci-?fi|science fiction|futuristic|photoreal|hyperreal|unreal engine|ue5/.test(text)) return "photoreal_sci_fi";
  if (/fantasy|fantastik|magic|magical|epic fantasy|mythic/.test(text)) return "epic_fantasy";
  if (["animation", "anime_short_film", "stickman_animation", "cinematic_video"].includes(productionType)) return "cinematic_animation";
  return undefined;
}

function normalizeProductionType(prompt: string, currentType: string) {
  const raw = prompt.toLocaleLowerCase("tr-TR");
  const text = `${prompt} ${currentType}`.toLocaleLowerCase("tr-TR");
  const imageDesignIntent = /\b(banner|afiş|afis|poster|görsel|gorsel|resim|image|visual|photo|picture|png|jpg|jpeg|static\s+ad|static\s+image|single\s+image|final\s+image|social\s+media\s+post|instagram\s+post|feed\s+post|reklam görseli|reklam gorseli|sosyal medya\s+(post|görseli|gorseli)|kapak|thumbnail|cover|flyer|broşür|brosur|duyuru görseli|duyuru gorseli|kampanya görseli|kampanya gorseli)\b|\b4\s*[:x]\s*5\b|\bpng\s*\/\s*jpg\b/.test(raw);
  const routeText = raw
    .replace(/\b(do\s+not|don't|avoid|exclude|without)\b[^.\n]*/g, " ")
    .replace(/\b(no|not)\s+(create\s+)?(a\s+)?(video|videos|mp4|mov|avatar|presenter|voice|music|heygen|video\s*agent|storefront|product\s+catalog|cart|checkout|admin\s+panel|source\s+zip|readme)\b/g, " ")
    .replace(/\b(no|not)\s+(anime|cartoon|stickman|animation|animated|çizgi film|cizgi film|çöp adam|cop adam|cöp adam|whiteboard)\b/g, " ")
    .replace(/\b(no|not)\s+(cinematic battle|sci-fi|war scene|drone footage|action trailer)\b/g, " ");
  const explicitVideoIntent = /\b(video|klip|clip|reels|shorts|tiktok|youtube shorts|mp4|mov|animasyon|animation|motion|hareketli|film|teaser|trailer)\b/.test(routeText);
  if (imageDesignIntent && !explicitVideoIntent) return "image";
  const presenterVideoLock = /\b(ugc|koc|creator|ai\s*presenter|with\s*presenter|heygen|video\s*agent|talking\s*avatar|product\s*demo|social\s*media\s*ad)\b/.test(routeText)
    && !/\b(no\s*presenter|without\s*presenter|b-?roll\s*only|silent\s*\/\s*music\s*only|no\s*voice)\b/.test(raw);
  if (presenterVideoLock) return "video";
  const liveActionRealisticVideoIntent = /(live[-\s]*action|canlı\s*aksiyon|canli\s*aksiyon|ultra\s*realistic|ultra\s*gerçekçi|ultra\s*gercekci|photorealistic|foto\s*gerçekçi|fotogerçekçi|gerçekçi\s*cilt|gercekci\s*cilt|realistic\s*skin|practical\s*lighting|physical(?:ly)?\s*real|gerçek\s*görün|gercek\s*gorun)/.test(raw);
  if (currentType === "video" && liveActionRealisticVideoIntent) return "video";
  if (isCharacterDialogueAnimationPrompt(prompt)) return "animation";
  if (/stickman|çöp adam|cop adam|cöp adam|whiteboard/.test(routeText)) return "stickman_animation";
  if (/anime|japanese animation|ghibli|shinkai/.test(routeText)) return "anime_short_film";
  if (/pixar|3d cartoon|3d animated|3d animation|animated film|cartoon film|character animation|animasyon|animation|çizgi film|cizgi film|cartoon/.test(routeText)) return "animation";
  if (/sci-?fi|science fiction|futuristic|photoreal|hyperreal|unreal engine|ue5|fantasy|fantastik|magic|magical|epic fantasy|mythic/.test(raw)) return "cinematic_video";
  if (/product\s*(advertising|advertisement|ad)|e-?commerce\s+product\s+ad|campaign\s+product\s+ad|product\s*link|paste\s*(a|any)?\s*link|get\s*an\s*ad/.test(raw)) return "campaign";
  if (/saas\s*promo|promo\s*video|commercial|ad\s*video|video\s*ad|ready-to-post\s*video|crelavo/.test(raw)) return "video";
  if (/clip çıkar|clip cikar|kesit çıkar|kesit cikar|highlight çıkar|highlight cikar|uzun video|long video|kırp|kirp|hook extraction|best moments/.test(raw)) return "video_clipping";
  if (/drone|uydu|satellite|harita|rota|map location|flyover/.test(raw)) return "drone_video";
  if (/müzik video|music video|mv|lyric|klip/.test(raw)) return "music_video";
  if (/canlı satış|canli satis|live sales|satış asistanı|satis asistani/.test(raw)) return "live_sales_agent";
  if (/talking video|talking head|avatar|lip sync|lip-sync|dudak/.test(raw)) return "talking_video";
  const mobileIntent = /mobile app|ios|android|react native|expo|app store|play store|mobil uygulama/.test(raw);
  if (mobileIntent) return "mobile_app";
  if (/saas|software as a service|subscription dashboard/.test(raw)) return "saas";
  if (/admin panel|admin dashboard|management panel|control panel|yönetim panel|yonetim panel/.test(raw)) return "admin_project";
  const commerceIntent = /ecommerce|e-commerce|e commerce|e-ticaret|storefront|online store|shop|shopping|product catalog|cart|checkout|store|ürün|urun|sepet/.test(raw);
  if (commerceIntent) return "website";
  if (/web sitesi|website|web site|landing|site/.test(raw)) return "website";
  if (/voice clone|ses klon/.test(text)) return "voice_clone";
  if (/talking video|talking head|avatar|spokesperson|presenter|sunucu|konuşan kişi|konusan kisi|diyalog|panel|lip[- ]?sync|self[- ]?in[- ]?video|kendi avatarım|kendi avatarim/.test(text)) return "talking_video";
  if (/voice|audio|narration|podcast|seslendirme|dublaj|voice[- ]?over|voiceover|müzik|muzik|music/.test(text)) return "video";
  if (/image|logo|poster|visual|photo|görsel|gorsel/.test(text)) return "image";
  if (/seo|blog|content pack|document|doküman|dokuman/.test(text)) return "document_pack";
  if (/campaign|ads|marketing|social|kampanya|reklam/.test(text)) return "campaign";
  if (/movie|film|short film|kısa film|kisa film|drama/.test(raw)) return "video";
  return currentType || "video";
}


function productionTypeFromCategory(category: string) {
  if (category === "UGC Style Ad") return "video";
  if (category === "Ad Creative Angles") return "video";
  if (category === "Lower Ad Costs") return "video";
  const normalized = normalizeAssistantText(category);
  const directMap: Record<string, string> = {
    campaign: "campaign", ai_agent: "ai_agent", localization: "localization", ad_score_checker: "ad_score_checker", virtual_model_studio: "virtual_model_studio", cultural_localization: "cultural_localization", campaign_calendar: "campaign_calendar", crelavo_academy: "crelavo_academy", community_showcase: "community_showcase", video: "video", talking_video: "talking_video", documentary: "documentary", animation: "animation", anime_short_film: "anime_short_film", animal_video: "animal_video", nature_video: "nature_video", planet_space_video: "planet_space_video", drone_video: "drone_video", live_sales_agent: "live_sales_agent", studio: "studio", drama: "drama", cinematic_video: "cinematic_video", video_clipping: "video_clipping", avatar: "avatar", lip_sync: "lip_sync", voice_clone: "voice_clone", visual_clone: "visual_clone", video_tools: "video_tools", stickman_animation: "stickman_animation", music_video: "music_video", website: "website", saas: "saas", mobile_app: "mobile_app", image: "image", brand_kit: "brand_kit", document_pack: "document_pack", admin_project: "admin_project"
  };
  if (directMap[normalized]) return directMap[normalized];
  if (!normalized) return "";
  if (/^video$|ai video|video production/.test(normalized)) return "video";
  if (/video clipping|clip/.test(normalized)) return "video_clipping";
  if (/mobile app|app builder|mobil uygulama|ios|android|expo/.test(normalized)) return "mobile_app";
  if (/saas|web app|software as a service|saas app|saas dashboard/.test(normalized)) return "saas";
  if (/admin panel|admin dashboard|control panel|management panel/.test(normalized)) return "admin_project";
  if (/ecommerce|e-commerce|online store|storefront|shopify|woocommerce/.test(normalized)) return "website";
  if (/website|web site|landing page/.test(normalized)) return "website";
  if (/anime/.test(normalized)) return "anime_short_film";
  if (/stickman/.test(normalized)) return "stickman_animation";
  if (/animation/.test(normalized)) return "animation";
  if (/brand kit/.test(normalized)) return "brand_kit";
  if (/image|banner|poster/.test(normalized)) return "image";
  if (/voice/.test(normalized)) return "talking_video";
  if (/campaign|reklam/.test(normalized)) return "campaign";
  return "";
}

function localPlan(prompt: string, forcedProductionType = ""): StudioPlan {
  const productionType = forcedProductionType || normalizeProductionType(prompt, "video");
  const project = isProjectType(productionType);
  const visualProject = ["image", "brand_kit", "visual_clone", "virtual_model_studio"].includes(productionType);
  const formats = project ? ["source_code", "readme", "dashboard_delivery"] : visualProject ? ["final_image", "png", "jpg", "dashboard_delivery"] : ["final_mp4", "dashboard_delivery"];
  const commerceIntent = /ecommerce|e-commerce|e commerce|e-ticaret|storefront|online store|shop|shopping|product catalog|cart|checkout|store|ürün|urun|sepet/.test(prompt.toLowerCase());
  const packageId = productionType === "website" ? (commerceIntent ? "website_ecommerce_admin" : "website_business")
    : productionType === "saas" ? "saas_admin_billing"
      : productionType === "mobile_app" ? "mobile_expo"
        : productionType === "admin_project" ? "admin_dashboard"
          : productionType === "document_pack" ? "seo_growth_pack"
            : productionType === "image" ? "image_single"
              : productionType === "brand_kit" ? "brand_full"
                : "video_premium";

  return {
    production_type: productionType,
    package_id: packageId,
    selected_quality: project ? "Project based" : "1080p",
    selected_duration: project ? "Project based" : "30 sec",
    selected_style: project ? "Premium modern interface" : "Cinematic commercial",
    selected_modules: project ? [labelFor(productionType), "Responsive UI", "Dashboard delivery", "Source package"] : ["AI production", "Dashboard delivery"],
    selected_features: project ? ["Working source package", "README / setup", "Preview delivery"] : ["Production package", "Preview delivery"],
    selected_platforms: ["Crelavo dashboard"],
    delivery_requirements: { requested: true, status: "pending", formats },
    estimated_credits: 0,
    missing_fields: [],
    workflow_stage: "ready_to_start_production",
    next_user_action: "Start Production",
    summary: project
      ? `${uiText(labelFor(productionType))} projesi kaynak kod, kurulum notu ve panel teslimiyle hazırlanacak.`
      : `${uiText(labelFor(productionType))} üretimi panel teslimiyle hazırlanacak.`
  };
}

function shouldForceImageProduction(prompt: string) {
  return normalizeProductionType(prompt, "video") === "image";
}

function isLuxuryProductCommercialPrompt(prompt: string) {
  return /perfume|fragrance|cologne|matte-black|matte\s*black|luxury\s+commercial|premium\s+commercial|retail\s+store|retail\s+counter|marble\s+wall|perfume\s+bottle|product\s+commercial/i.test(prompt);
}

function normalizePlan(plan: StudioPlan, prompt: string, forcedProductionType = ""): StudioPlan {
  const promptType = normalizeProductionType(prompt, plan.production_type);
  const hardImageLock = shouldForceImageProduction(prompt);
  const productionType = hardImageLock ? "image" : isLuxuryProductCommercialPrompt(prompt) ? "video" : forcedProductionType || promptType;
  const project = isProjectType(productionType);
  const fallback = localPlan(prompt, productionType);
  const raw = prompt.toLowerCase();
  const isPromoVideo = productionType === "video" && /saas\s*promo|promo\s*video|commercial|ad\s*video|video\s*ad|ready-to-post\s*video|product\s*link|paste\s*(a|any)?\s*link|get\s*an\s*ad|crelavo/.test(raw);
  return {
    ...fallback,
    ...plan,
    production_type: productionType,
    package_id: isPromoVideo ? "video_premium" : project && (!plan.package_id || plan.package_id === "video_premium") ? fallback.package_id : (plan.package_id || fallback.package_id),
    selected_quality: project ? "Project based" : (plan.selected_quality || fallback.selected_quality),
    selected_duration: project ? "Project based" : (plan.selected_duration || fallback.selected_duration),
    selected_modules: plan.selected_modules?.length ? plan.selected_modules : fallback.selected_modules,
    selected_features: project ? Array.from(new Set([...(plan.selected_features || []), "Working source package", "README / setup", "Preview delivery"])) : (plan.selected_features?.length ? plan.selected_features : fallback.selected_features),
    selected_platforms: plan.selected_platforms?.length ? plan.selected_platforms : fallback.selected_platforms,
    delivery_requirements: project
      ? { requested: true, status: "pending", formats: ["source_code", "readme", "dashboard_delivery"] }
      : (plan.delivery_requirements?.formats?.length ? plan.delivery_requirements : fallback.delivery_requirements),
    missing_fields: [],
    workflow_stage: "ready_to_start_production",
    next_user_action: "Start Production",
    summary: project
      ? `${uiText(labelFor(productionType))} projesi kaynak kod, kurulum notu ve panel teslimiyle hazırlanacak.`
      : `${uiText(labelFor(productionType))} üretimi panel teslimiyle hazırlanacak.`
  };
}

function assistantReply(plan: StudioPlan, language = "auto") {
  const typeLabel = language === "tr" ? uiText(labelFor(plan.production_type)) : labelFor(plan.production_type);
  const project = isProjectType(plan.production_type);
  const image = isImageProductionType(plan.production_type);
  if (language !== "tr") {
    if (image) return `I prepared the ${typeLabel} production setup. Review image type, output count, style, aspect ratio and PNG/JPG delivery, then press Start Production when you are ready.`;
    return project
      ? `I prepared the ${typeLabel} production setup. It will include source files, README, preview and dashboard delivery. Press Start Production when you are ready.`
      : `I prepared the ${typeLabel} production setup. Review duration, quality, voice, subtitles, music and transition options, then press Start Production when you are ready.`;
  }
  if (image) return `${typeLabel} için üretim ayarlarını hazırladım. Görsel tipi, çıktı sayısı, stil, oran ve PNG/JPG teslimini kontrol et; hazırsan Üretimi başlat butonuna bas.`;
  return project
    ? `${typeLabel} için üretim ayarlarını hazırladım. Kaynak kod, kurulum notu, ön izleme ve panel teslimiyle hazırlanacak. Hazırsan Üretimi başlat butonuna bas.`
    : `${typeLabel} için üretim ayarlarını hazırladım. Süre, kalite, ses, altyazı, müzik ve geçiş seçeneklerini kontrol et; hazırsan Üretimi başlat butonuna bas.`;
}

function isStartIntent(prompt: string) {
  return /^(start|start production|go|go ahead|continue|proceed|create it|build it|launch|yes|ok|okay|confirm|başla|basla|devam|tamam|onayla|üretime geç|uretime gec|üretimi başlat|uretimi baslat)$/i.test(prompt.trim());
}

function isExplainIntent(prompt: string) {
  const normalized = normalizeAssistantText(prompt);
  const asksCrelavoFlow = /(crelavo|work|assistant|asistan|uretim|production|kart|status|teslim|dashboard|sayfa|site)/.test(normalized);
  const asksFlow = /(workflow|process|next step|what happens|sonra ne|ne olacak|asam|surec|uretim asamasi|chat ayar|nasil calisir|nasil isler)/.test(normalized);
  return asksCrelavoFlow && asksFlow;
}

function normalizeAssistantText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function isProductionRequest(prompt: string) {
  const normalized = normalizeAssistantText(prompt);
  const hasLink = /https?:\/\/|www\.|\.com\b|\.net\b|\.org\b|\.io\b|\.co\b/.test(normalized);
  const productionVerb = /(yap|uret|olustur|hazirla|tasarla|kur|baslat|create|make|generate|produce|build|design|start)/.test(normalized);
  const productionNoun = /(video|reklam|tanitim|tanıtım|avatar|talking|konusan|konuşan|site|website|landing|app|uygulama|saas|admin|panel|gorsel|görsel|image|logo|poster|kampanya|campaign|seo|paket|production|uretim|üretim)/.test(normalized);
  const linkProduction = hasLink && /(video|reklam|tanitim|tanıtım|urun|ürün|product|site|website|landing|analiz|ad|promo)/.test(normalized);
  const questionOnly = /\?$/.test(prompt.trim()) && !productionVerb;
  return linkProduction || (productionVerb && productionNoun && !questionOnly);
}

function detectWorkLanguage(prompt: string) {
  const raw = String(prompt || "").trim();
  const normalized = normalizeAssistantText(raw);
  if (!raw) return "en";
  const englishSignals = (normalized.match(/\b(create|generate|make|video|campaign|product|website|mobile|app|brand|showcase|premium|cinematic|voice|subtitles|thumbnail|delivery|quality|duration|format|avoid|prompt|social|media|animation|live action|realistic|speaker|presenter)\b/g) ?? []).length;
  const turkishSignals = (normalized.match(/\b(merhaba|selam|nasil|nedir|neden|ne kadar|yapabilir|istiyorum|uretim|reklam|tanitim|video yap|olustur|hazirla|seslendirme|altyazi|kapak|gorsel|sure|kalite|teslim|baslat)\b/g) ?? []).length;
  const hasTurkishChars = /[ğĞıİşŞçÇöÖüÜ]/.test(raw);
  if (englishSignals >= Math.max(2, turkishSignals + 1)) return "en";
  if (hasTurkishChars || turkishSignals > englishSignals) return "tr";
  return "en";
}

function productionCardProvider(production: WorkProductionCard | null) {
  const output = production?.output_json && typeof production.output_json === "object" ? production.output_json : {};
  const visualJob = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : null;
  return String(visualJob?.provider ?? output.providerStatus ?? "Provider pending");
}

function firstTextValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function productionProviderProof(production: WorkProductionCard | null) {
  const output = production?.output_json && typeof production.output_json === "object" ? production.output_json : {};
  const visualJob = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : {};
  const minimaxProof = output.minimaxProviderProof && typeof output.minimaxProviderProof === "object" ? output.minimaxProviderProof as Record<string, unknown> : {};
  const heygenProof = output.heygenProviderProof && typeof output.heygenProviderProof === "object" ? output.heygenProviderProof as Record<string, unknown> : {};
  const latestArtifact = output.latestMinimaxVideoArtifact && typeof output.latestMinimaxVideoArtifact === "object" ? output.latestMinimaxVideoArtifact as Record<string, unknown> : {};
  const provider = firstTextValue(minimaxProof.provider, visualJob.provider, heygenProof.provider, output.providerStatus);
  const sessionId = firstTextValue(output.minimaxSessionId, minimaxProof.sessionId, output.heygenSessionId, heygenProof.sessionId, visualJob.id);
  const videoId = firstTextValue(output.minimaxVideoId, minimaxProof.videoId, output.heygenVideoId, heygenProof.videoId, latestArtifact.providerResourceId);
  const finalUrl = firstTextValue(output.finalVideoUrl, output.providerFinalUrl, output.latestMinimaxVideoUrl, production?.delivery_link, production?.delivery_zip_url);
  return { provider, sessionId, videoId, finalUrl };
}

function compactId(value: string) {
  if (!value) return "—";
  return value.length > 34 ? `${value.slice(0, 16)}…${value.slice(-10)}` : value;
}

function explainProductionFlow(activePlan: StudioPlan | null, language = "tr") {
  const typeLabel = activePlan ? (language === "tr" ? uiText(labelFor(activePlan.production_type)) : labelFor(activePlan.production_type)) : "production";
  const project = activePlan ? isProjectType(activePlan.production_type) : false;
  if (language !== "tr") {
    return project
      ? `The ${typeLabel} flow works like this: you write the request, Crelavo prepares the plan, creates the production record, then the production page prepares the package and shows preview, README, and source delivery links.`
      : `The ${typeLabel} flow works like this: you write the request, Crelavo creates a real production record, starts the provider, updates the card from production status, and shows preview/delivery links when ready.`;
  }
  return project
    ? `${typeLabel} için akış şöyle: isteği yazarsın, Crelavo planı çıkarır, üretim kaydı açılır, production sayfasında paket hazırlanır ve preview/README/source teslim linkleri oluşur.`
    : `${typeLabel} için akış şöyle: isteği yazarsın, Crelavo gerçek production kaydı açar, provider üretimi başlatır, karttan status takip edilir ve hazır olunca preview/teslim linki görünür.`;
}

const legacyWorkDraftStorageKeys = ["crelavo.workAssistant.draft.v1"];
const workDraftStorageKey = "crelavo.workAssistant.draft.v2";

type StoredWorkDraft = {
  input?: string;
  productionPrompt?: string;
  plan?: StudioPlan | null;
  selectedProductionCards?: string[];
  productionSetup?: ProductionSetupState;
  messages?: ChatMessage[];
  status?: string;
  updatedAt?: number;
};

function readStoredWorkDraft(): StoredWorkDraft | null {
  if (typeof window === "undefined") return null;
  try {
    [...legacyWorkDraftStorageKeys, workDraftStorageKey].forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage cleanup is best-effort only.
  }
  return null;
}

function writeStoredWorkDraft(draft: StoredWorkDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(workDraftStorageKey, JSON.stringify(draft));
  } catch {
    // Storage is best-effort only; production creation must not depend on it.
  }
}

function collectRecords(value: unknown, limit = 80): Record<string, any>[] {
  const out: Record<string, any>[] = [];
  const walk = (node: unknown) => {
    if (out.length >= limit || !node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node !== "object") return;
    const record = node as Record<string, any>;
    if (record.id || record.avatar_id || record.look_id || record.voice_id || record.preview_audio_url || record.preview_image_url || record.image_url || record.preview_url || record.thumbnail_url) out.push(record);
    Object.values(record).forEach(walk);
  };
  walk(value);
  return out;
}

function firstUrlFrom(...values: unknown[]): string {
  const seen = new WeakSet<object>();
  const walk = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") {
      const direct = value.trim();
      return /^https?:\/\//i.test(direct) ? direct : direct.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item);
        if (found) return found;
      }
      return "";
    }
    if (typeof value === "object") {
      if (seen.has(value)) return "";
      seen.add(value);
      for (const item of Object.values(value as Record<string, unknown>)) {
        const found = walk(item);
        if (found) return found;
      }
    }
    return "";
  };
  for (const value of values) {
    const found = walk(value);
    if (found) return found;
  }
  return "";
}

function normalizeAvatarGallery(payload: unknown): MinimaxGalleryAvatar[] {
  return collectRecords(payload, 1200).map((item) => {
    const avatarId = String(item.avatar_id ?? item.avatarId ?? item.avatar?.avatar_id ?? item.avatar?.id ?? item.id ?? "").trim();
    const explicitLookId = item.look_id ?? item.lookId;
    const looksLikeLookRecord = Boolean(explicitLookId) || /look/i.test(String(item.object ?? item.type ?? item.avatar_type ?? item.category ?? ""));
    const lookId = String(explicitLookId ?? (looksLikeLookRecord ? item.id : "") ?? "").trim();
    const imageUrl = firstUrlFrom(item.preview_image_url, item.previewImageUrl, item.image_url, item.imageUrl, item.thumbnail_url, item.thumbnailUrl, item.photo_url, item.photoUrl, item.avatar?.preview_image_url, item.avatar?.image_url, item.avatar?.thumbnail_url, item.avatar?.preview, item.preview, item.image, item.thumbnail, item.media);
    return {
      id: lookId || avatarId,
      avatarId,
      lookId,
      name: String(item.name ?? item.display_name ?? item.avatar_name ?? item.avatar?.name ?? "Karakter"),
      imageUrl,
      gender: String(item.gender ?? item.avatar?.gender ?? "").trim(),
      style: String(item.style ?? item.look_style ?? item.avatar_type ?? item.type ?? "").trim()
    };
  }).filter((item, index, arr) => item.id && arr.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 160);
}

function normalizeVoiceGallery(payload: unknown): MinimaxGalleryVoice[] {
  const byVoice = new Map<string, MinimaxGalleryVoice>();
  for (const item of collectRecords(payload, 1200)) {
    const id = String(item.voice_id ?? item.voiceId ?? item.id ?? "").trim();
    if (!id) continue;
    const name = String(item.name ?? item.display_name ?? item.voice_name ?? "Ses").trim();
    const language = String(item.language ?? item.locale ?? item.languages?.[0] ?? "").trim();
    const gender = String(item.gender ?? "").trim();
    const age = String(item.age ?? item.age_group ?? "").trim();
    const style = String(item.style ?? item.tone ?? item.emotion ?? item.category ?? "").trim();
    const previewAudioUrl = firstUrlFrom(item.preview_audio_url, item.previewAudioUrl, item.preview_audio, item.previewAudio, item.preview_url, item.previewUrl, item.sample_audio_url, item.sampleAudioUrl, item.sample_url, item.sampleUrl, item.audio_url, item.audioUrl, item.audio, item.sample, item.preview, item.demo, item.media, item.files, item.assets, item.metadata);
    const key = `${name.toLowerCase()}|${language.toLowerCase()}|${gender.toLowerCase()}`;
    const existing = byVoice.get(key);
    if (existing) {
      if (!existing.previewAudioUrl && previewAudioUrl) existing.previewAudioUrl = previewAudioUrl;
      if (!existing.age && age) existing.age = age;
      if (!existing.style && style) existing.style = style;
      continue;
    }
    byVoice.set(key, { id, name, language, gender, age, style, previewAudioUrl });
  }
  return Array.from(byVoice.values()).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 160);
}

function normalizeSoundGallery(payload: unknown): MinimaxGallerySound[] {
  return collectRecords(payload, 600).map((item) => {
    const id = String(item.sound_id ?? item.soundId ?? item.music_id ?? item.musicId ?? item.id ?? "").trim();
    const audioUrl = firstUrlFrom(item.preview_audio_url, item.previewAudioUrl, item.audio_url, item.audioUrl, item.url, item.preview, item.audio, item.media, item.files, item.assets);
    return {
      id,
      name: String(item.name ?? item.display_name ?? item.title ?? "Müzik").trim(),
      style: String(item.style ?? item.mood ?? item.category ?? item.type ?? "").trim(),
      duration: String(item.duration ?? item.duration_seconds ?? item.durationSeconds ?? "").trim(),
      audioUrl
    };
  }).filter((item, index, arr) => item.id && arr.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 80);
}

export function WorkAssistant({ initialIdea = "", initialCategory = "" }: WorkAssistantProps) {
  const forcedProductionType = productionTypeFromCategory(initialCategory);
  const explicitInitialIntent = Boolean(initialIdea || initialCategory);
  const storedDraft = explicitInitialIntent ? null : readStoredWorkDraft();
  const restoredDraftPrompt = storedDraft?.productionPrompt || "";
  const initialPrompt = initialIdea || initialCategory || restoredDraftPrompt;
  const initialPlan = initialPrompt ? localPlan(initialPrompt, shouldForceImageProduction(initialPrompt) ? "image" : forcedProductionType) : null;
  const restoredPlan = storedDraft?.plan && initialPrompt
    ? normalizePlan(storedDraft.plan, initialPrompt, shouldForceImageProduction(initialPrompt) ? "image" : forcedProductionType)
    : initialPlan;
  const initialEffectivePlan = shouldForceImageProduction(initialPrompt) ? initialPlan : restoredPlan;
  const [input, setInput] = useState(initialIdea || initialCategory || "");
  const [productionPrompt, setProductionPrompt] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!shouldForceImageProduction(initialPrompt) && !explicitInitialIntent && storedDraft?.messages?.length) return storedDraft.messages;
    return initialPrompt && initialEffectivePlan ? [
      { id: uid(), role: "user", content: initialPrompt },
      { id: uid(), role: "assistant", content: assistantReply(initialEffectivePlan, detectWorkLanguage(initialPrompt)) }
    ] : [];
  });
  const [plan, setPlan] = useState<StudioPlan | null>(() => initialEffectivePlan);
  const [selectedProductionCards, setSelectedProductionCards] = useState<string[]>(() => {
    const initialPlanForCards = initialEffectivePlan;
    const defaultCards = filterCardsForPrompt(productionCardsFor(initialPlanForCards), initialPrompt ?? "", initialPlanForCards?.production_type ?? "");
    if (isImageProductionType(initialPlanForCards?.production_type ?? "")) return defaultCards;
    return storedDraft?.selectedProductionCards ?? defaultCards;
  });
  const [productionSetup, setProductionSetup] = useState<ProductionSetupState>(() => {
    const initialPlanForSetup = initialEffectivePlan;
    if (!initialPlanForSetup) return {};
    const baseSetup = shouldForceImageProduction(initialPrompt) ? defaultSetupFor(initialPlanForSetup.production_type, initialPrompt, initialPlanForSetup) : storedDraft?.productionSetup ?? defaultSetupFor(initialPlanForSetup.production_type, initialPrompt, initialPlanForSetup);
    return sanitizeSetupForProduction(initialPlanForSetup.production_type, baseSetup, initialPrompt, initialPlanForSetup);
  });

  const [conversationId, setConversationId] = useState("");
  const [planning, setPlanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [materials, setMaterials] = useState<UserUploadedMaterial[]>([]);
  const [activeProduction, setActiveProduction] = useState<WorkProductionCard | null>(null);
  const [avatarGallery, setAvatarGallery] = useState<MinimaxGalleryAvatar[]>([]);
  const [voiceGallery, setVoiceGallery] = useState<MinimaxGalleryVoice[]>([]);
  const [soundGallery, setSoundGallery] = useState<MinimaxGallerySound[]>([]);
  const [soundQuery, setSoundQuery] = useState("upbeat electronic ad music");
  const [galleryMode, setGalleryMode] = useState<"avatar" | "voice" | "music" | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<MinimaxGalleryAvatar | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<MinimaxGalleryVoice | null>(null);
  const [selectedSound, setSelectedSound] = useState<MinimaxGallerySound | null>(null);
  const [customThumbnailPrompt, setCustomThumbnailPrompt] = useState("");
  const [customAvoidPrompt, setCustomAvoidPrompt] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const node = chatRef.current;
    if (!node) return;
    if (planning) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, planning]);

  useEffect(() => {
    if (!plan && !productionPrompt && messages.length === 0) {
      if (typeof window !== "undefined") window.localStorage.removeItem(workDraftStorageKey);
      return;
    }
  if (!plan) {
    writeStoredWorkDraft({ input: "", productionPrompt, plan, selectedProductionCards, productionSetup, messages, status, updatedAt: Date.now() });
    return;
  }
  const safeSetup = sanitizeSetupForProduction(plan.production_type, productionSetup, productionPrompt, plan);
  const safeCards = isImageProductionType(plan.production_type)
    ? filterCardsForPrompt(productionCardsFor(plan), productionPrompt || input, plan.production_type)
    : selectedProductionCards;
  writeStoredWorkDraft({ input: "", productionPrompt, plan, selectedProductionCards: safeCards, productionSetup: safeSetup, messages, status, updatedAt: Date.now() });
  }, [productionPrompt, plan, selectedProductionCards, productionSetup, messages, status, input]);

  useEffect(() => {
    if (!activeProduction?.id) return;
    if (activeProduction.status === "ready" || activeProduction.automation_status === "completed") return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok || cancelled) return;
      await refreshActiveProduction(activeProduction.id, auth.user.id, auth.accessToken);
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeProduction?.id, activeProduction?.status, activeProduction?.automation_status]);

const workLanguageSource = `${productionPrompt || ""} ${input || ""}`.trim();
function resolveWorkUiLanguage(): "en" | "tr" {
  return "en";
}
const workUiLanguage = resolveWorkUiLanguage();
const ux = (value: string) => false ? uiText(value) : value;
const statusUx = (tr: string, en: string) => false ? tr : en;
  const setupProfile = plan ? (isImageProductionType(plan.production_type) ? profileForType("image") : dynamicProfileForPlan(plan, productionPrompt || input)) : null;
  const activeProductionSetup = useMemo(() => plan ? sanitizeSetupForProduction(plan.production_type, productionSetup, productionPrompt || input, plan) : productionSetup, [plan, productionSetup, productionPrompt, input]);
  const activeSelectedProductionCards = useMemo(() => plan && isImageProductionType(plan.production_type) ? filterCardsForPrompt(productionCardsFor(plan), productionPrompt || input, plan.production_type) : selectedProductionCards, [plan, selectedProductionCards, productionPrompt, input]);
  const setupItems = useMemo(() => selectedSetupItems(activeProductionSetup, plan?.production_type ?? ""), [activeProductionSetup, plan]);
  const draftWantsThumbnail = setupItems.some((item) => /thumbnail|cover visual|kapak/i.test(String(item))) || activeSelectedProductionCards.some((item) => /thumbnail|cover visual|kapak/i.test(String(item)));
const setupBreakdown = plan ? setupCreditBreakdown(plan.production_type, activeProductionSetup, plan, productionPrompt || input) : [];
const heygenTierBreakdown = plan ? heygenQualityCreditBreakdown(activeProductionSetup, plan) : { title: "Minimax H3", selected: "", credits: 0, seconds: 0, creditsPerMinute: 0 };
const manualMinimaxCredits = heygenTierBreakdown.credits + (selectedAvatar?.avatarId ? HEYGEN_MANUAL_AVATAR_CREDITS : 0) + (selectedVoice ? HEYGEN_MANUAL_VOICE_CREDITS : 0) + (selectedSound ? HEYGEN_MANUAL_MUSIC_CREDITS : 0);
const manualMinimaxBreakdown = [
  ...(heygenTierBreakdown.credits ? [{ title: `${ux(heygenTierBreakdown.title)} (${Math.round(heygenTierBreakdown.seconds)} sn)`, credits: heygenTierBreakdown.credits }] : []),
  ...(selectedAvatar?.avatarId ? [{ title: false ? "Manuel karakter seçimi" : "Manual character selection", credits: HEYGEN_MANUAL_AVATAR_CREDITS }] : []),
  ...(selectedVoice ? [{ title: false ? "Manuel ses seçimi" : "Manual voice selection", credits: HEYGEN_MANUAL_VOICE_CREDITS }] : []),
  ...(selectedSound ? [{ title: false ? "Manuel müzik seçimi" : "Manual music selection", credits: HEYGEN_MANUAL_MUSIC_CREDITS }] : [])
];
const setupCredits = setupBreakdown.reduce((total, item) => total + item.credits, 0) + manualMinimaxCredits;
const cardCredits = productionCardCredits(activeSelectedProductionCards);
const draftBaseCredits = baseDraftCredits(plan);
const totalEstimatedCredits = draftBaseCredits + setupCredits + cardCredits;
  const estimatedCredits = totalEstimatedCredits ? totalEstimatedCredits.toLocaleString() : "Calculated on start";
  const draftPromptText = productionPrompt || input;
  const draftCardsForIntent = plan ? Array.from(new Set([...(activeSelectedProductionCards.length ? activeSelectedProductionCards : productionCardsFor(plan)), ...setupItems, ...(plan.selected_features || [])])) : [];
  const draftNoPeopleMotionIntent = draftCardsForIntent.some((item) => /no people|no presenter|motion graphics|ui-only|screenshot-only/i.test(item)) || /no\s*people|no\s*presenter|without\s*(people|presenter|human)|ui-only|screenshot-only|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|kiş/i.test(draftPromptText);
  const draftWantsPresenterVideo = !isImageProductionType(plan?.production_type ?? "") && draftCardsForIntent.some((item) => /presenter|avatar|heygen|talking|ugc creator|with presenter/i.test(item)) && !draftNoPeopleMotionIntent;
  const draftCreative = plan && draftWantsPresenterVideo ? buildPresenterCreativeBrief({ prompt: draftPromptText, selectedOptions: draftCardsForIntent, productionSetup: activeProductionSetup, title: plan.summary }) : null;
  const draftActivityLog = draftCreative ? initialPresenterActivityLog(draftCreative) : [];
  const activeProviderProof = productionProviderProof(activeProduction);
  const activeProjectProduction = Boolean(activeProduction && (isProjectType(String(activeProduction.production_type ?? "")) || String(activeProduction.generation_status ?? "").toLowerCase() === "project_delivery_ready" || String(activeProduction.automation_status ?? "").toLowerCase() === "completed" && Boolean(activeProduction.delivery_zip_url || activeProduction.source_files_url)));

  function resetSetupFor(nextPlan: StudioPlan, hint = productionPrompt || input) {
    setProductionSetup(defaultSetupFor(nextPlan.production_type, hint, nextPlan));
  }

  function toggleSetupOption(group: SetupGroup, option: string) {
    setProductionSetup((current) => {
      const currentValues = current[group.id] ?? [];
      const nextValues = group.multi ? (currentValues.includes(option) ? currentValues.filter((item) => item !== option) : [...currentValues, option]) : [option];
      return { ...current, [group.id]: nextValues };
    });
  }

  async function openMinimaxGallery(mode: "avatar" | "voice" | "music", query = soundQuery) {
    setGalleryMode(mode);
    setGalleryError("");
    const alreadyLoaded = mode === "avatar" ? avatarGallery.length > 0 : mode === "voice" ? voiceGallery.length > 0 : soundGallery.length > 0 && query === soundQuery;
    if (alreadyLoaded) return;
    setGalleryLoading(true);
    try {
      const action = mode === "avatar" ? "avatar_looks" : mode === "voice" ? "voices" : "sounds";
      const url = mode === "music" ? `/api/heygen?action=${action}&type=music&limit=20&query=${encodeURIComponent(query || "upbeat electronic ad music")}` : `/api/heygen?action=${action}&limit=50`;
      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data.error ?? "Galeri yüklenemedi."));
      if (mode === "avatar") setAvatarGallery(normalizeAvatarGallery(data.result ?? data));
      else if (mode === "voice") setVoiceGallery(normalizeVoiceGallery(data.result ?? data));
      else {
        setSoundQuery(query);
        setSoundGallery(normalizeSoundGallery(data.result ?? data));
      }
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : "Galeri yüklenemedi.");
  } finally {
    setGalleryLoading(false);
  }
}

  async function refreshActiveProduction(productionId: string, userId: string, accessToken: string) {
    const statusResponse = await fetch("/api/automation/status", {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ production_id: productionId, user_id: userId, auto: true })
    }).catch(() => null);
    if (statusResponse?.ok) {
      const statusData = await statusResponse.json().catch(() => ({}));
      if (statusData.production) {
        setActiveProduction(statusData.production as WorkProductionCard);
        return;
      }
    }
    const response = await fetch(`/api/productions?user_id=${encodeURIComponent(userId)}`, { headers: authHeaders(accessToken) }).catch(() => null);
    if (!response?.ok) return;
    const data = await response.json().catch(() => ({}));
    const found = Array.isArray(data.productions) ? data.productions.find((item: WorkProductionCard) => item.id === productionId) : null;
    if (found) setActiveProduction(found);
  }

  async function createProductionRecord(activePlanInput: StudioPlan, cleanInput: string, userId: string, userEmail: string, accessToken: string): Promise<WorkProductionCard | null> {
    const project = isProjectType(activePlanInput.production_type);
const routeSafeInput = sanitizeProviderRouteSignal(cleanInput);
const isImageProduction = isImageProductionType(activePlanInput.production_type);
const productionCards = isImageProduction
  ? filterCardsForPrompt(productionCardsFor(activePlanInput), routeSafeInput, activePlanInput.production_type)
  : filterCardsForPrompt(selectedProductionCards.length ? selectedProductionCards : productionCardsFor(activePlanInput), routeSafeInput, activePlanInput.production_type);
const sanitizedSetup = defaultSetupFor(activePlanInput.production_type, cleanInput, activePlanInput);
const baseSetupForPayload = isImageProduction
  ? sanitizeSetupForProduction(activePlanInput.production_type, sanitizedSetup, cleanInput, activePlanInput)
  : {
    ...productionSetup,
    voice: sanitizedSetup.voice ?? productionSetup.voice,
    subtitles: sanitizedSetup.subtitles ?? productionSetup.subtitles
  };
const presenterlessSetupRequested = isImageProduction || Object.values(baseSetupForPayload).flat().some((item) => /voice-over only|silent\s*\/\s*music only|no presenter|b-roll only/i.test(String(item))) || /no\s*presenter|no\s*avatar|without\s*(presenter|avatar)|b-?roll only|sunucusuz|sunucu\s*olmas[ıi]n/i.test(routeSafeInput);
const activeSelectedAvatar = presenterlessSetupRequested ? null : selectedAvatar;
const setupForPayload = isImageProduction ? baseSetupForPayload : {
  ...baseSetupForPayload,
  heygenNoPresenterMode: presenterlessSetupRequested ? ["true"] : ["false"],
  heygenIncludeNarrator: presenterlessSetupRequested ? ["false"] : ["true"],
  heygenIncludeVoice: ["true"],
  heygenSceneType: presenterlessSetupRequested ? ["b_roll"] : ["a_roll"],
  heygenAvatarMode: presenterlessSetupRequested ? ["no_presenter"] : ["presenter"],
  ...(activeSelectedAvatar?.avatarId && !presenterlessSetupRequested ? { heygen_avatar_id: [activeSelectedAvatar.avatarId] } : {}),
  ...(activeSelectedAvatar?.lookId && !presenterlessSetupRequested ? { heygen_look_id: [activeSelectedAvatar.lookId] } : {}),
  ...(selectedVoice?.id ? { heygen_voice_id: [selectedVoice.id] } : {}),
  ...(selectedSound?.id ? { heygen_music_id: [selectedSound.id] } : {}),
  ...(activeSelectedAvatar?.name && !presenterlessSetupRequested ? { selected_presenter_name: [activeSelectedAvatar.name] } : {}),
  ...(selectedVoice?.name ? { selected_voice_name: [selectedVoice.name] } : {}),
  ...(selectedSound?.name ? { selected_music_name: [selectedSound.name] } : {})
};

    const setupFields = setupDerivedFields(activePlanInput.production_type, setupForPayload);
    const setupItemsForPayload = selectedSetupItems(setupForPayload, activePlanInput.production_type);
    const selectedItemsForIntent = Array.from(new Set([...productionCards, ...setupItemsForPayload, ...(activePlanInput.selected_features || [])]));
    const thumbnailPrompt = selectedItemsForIntent.some((item) => /thumbnail|cover visual|kapak/i.test(String(item)))
      ? customThumbnailPrompt.trim() || "Cinematic vertical 9:16 cover image for Crelavo. One strong focal subject, high contrast dark tech background, glowing neon red and electric blue accents, urgent FOMO-driven atmosphere, premium social media hook, AI video creation energy, no text, no logos, no extra people, no clutter, clean composition, scroll-stopping thumbnail."
      : undefined;
    const avoidPrompt = customAvoidPrompt.trim() || undefined;
    const outputIntent = productionOutputIntent(activePlanInput.production_type, selectedItemsForIntent);
    const sourceHandling = productionSourceHandling(activePlanInput.production_type, selectedItemsForIntent);
    const setupForPayloadRecord = setupForPayload as ProductionSetupState;
    const imageAspectRatio = isImageProduction ? normalizedImageAspectRatio(setupForPayloadRecord, cleanInput) : undefined;
         const selectedAspect = String(((setupForPayloadRecord as unknown as Record<string, unknown>).aspectRatio as string[] | undefined)?.[0] ?? "");
     const aspectRatioForPayload = imageAspectRatio ?? (/16\s*[:x]\s*9|landscape/i.test(selectedAspect) ? "16:9" : /1\s*[:x]\s*1|square/i.test(selectedAspect) ? "1:1" : /4\s*[:x]\s*5/i.test(selectedAspect) ? "4:5" : /3\s*[:x]\s*4/i.test(selectedAspect) ? "3:4" : "9:16");
     const imageTypeForPayload = isImageProduction ? String((setupForPayloadRecord.imageType ?? [])[0] ?? imageTypeFromPrompt(cleanInput, setupProfiles.image.groups.find((group) => group.id === "imageType")?.options ?? []) ?? "Product visual") : undefined;
    const heygenTierForPayload = heygenQualityCreditBreakdown(setupForPayloadRecord, activePlanInput);
    const manualMinimaxCreditsForPayload = isImageProduction ? 0 : heygenTierForPayload.credits + (activeSelectedAvatar?.avatarId ? HEYGEN_MANUAL_AVATAR_CREDITS : 0) + (selectedVoice ? HEYGEN_MANUAL_VOICE_CREDITS : 0) + (selectedSound ? HEYGEN_MANUAL_MUSIC_CREDITS : 0);
    const setupCreditsForPayload = setupExtraCredits(activePlanInput.production_type, setupForPayload, activePlanInput, cleanInput) + manualMinimaxCreditsForPayload;
    const cardCreditsForPayload = productionCardCredits(productionCards);
    const totalEstimatedCreditsForPayload = baseDraftCredits(activePlanInput) + setupCreditsForPayload + cardCreditsForPayload;
    const noPresenterStyle = selectedItemsForIntent.some((item) => /voice-over only|silent\s*\/\s*music only|sadece seslendirmeli|sessiz|no presenter|b-roll only/i.test(String(item)));
    const wantsNoPresenterIntent = /no\s+presenter|b-?roll\s+only|no\s+avatar|no\s+talking\s+to\s+camera|no\s+lip-?sync|lifestyle\s+b-?roll|homepage\s+showcase|showcase\s+loop|wow\s+video|not\s+a\s+presenter|presenter\s*değil|sunucu\s*olmasın|sunucusuz|avatar\s*olmasın|talking\s+head\s*olmasın/.test(routeSafeInput);
    const noPeopleMotionIntent = noPresenterStyle || (/no\s+human\s+presenter|do\s+not\s+use\s+any\s+human|no\s*people|no\s*presenter|without\s*(people|presenter|human)|ui-only|screenshot-only|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|kişi\s*olmas[ıi]n|kisi\s*olmas[ıi]n|insans[ıi]z|sunucusuz|avatars?|office\s+scene|meeting\s+room|group\s+of\s+people|background\s+people/i.test(routeSafeInput)
      && /motion\s+graphics|hareketli\s+grafik|arayüz|arayuz|ui|hızlı\s+geçiş|hizli\s+gecis|dinamik|kinetic\s+typography|animated\s+text|text\s+cards|glitch|swipe\s+transitions|dynamic\s+promotional|b-?roll/i.test(routeSafeInput));
    const selectedMinimaxVideoAgentAutoEdit = selectedItemsForIntent.some((item) => /video agent auto edit/i.test(String(item)));
    const animationProductionIntent = ["animation", "anime_short_film", "stickman_animation", "cinematic_video"].includes(activePlanInput.production_type) || /animasyon|animation|çizgi film|cizgi film|cartoon|3d animated|3d animation|animated film|animation film|character animation|animated teaser/i.test(routeSafeInput + " " + selectedItemsForIntent.join(" "));
    const wantsMinimaxBrollVideoAgent = !animationProductionIntent && noPeopleMotionIntent && selectedMinimaxVideoAgentAutoEdit;
    const heygenCategoryIntent = !animationProductionIntent && !noPeopleMotionIntent && /sunucu|presenter|avatar|konuşan|konusan|spokesperson|ürün\s*tanıt|urun\s*tanit|product\s*demo|e-?ticaret|ecommerce|saas|uygulama\s*demo|app\s*demo|mobil\s*uygulama\s*demo|eğitim|egitim|anlatım|anlatim|sosyal\s*medya\s*reklam|koc|ugc|dublaj|lokalizasyon|pitch|satış\s*sunum|satis\s*sunum|canlı\s*satış|canli\s*satis|4k|müzik\s*eşlikli|muzik\s*eslikli|lyrics/i.test(routeSafeInput + " " + selectedItemsForIntent.join(" "));
    const wantsPresenterVideo = !noPeopleMotionIntent && !wantsNoPresenterIntent && (heygenCategoryIntent || selectedItemsForIntent.some((item) => /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter/i.test(String(item))) || /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|anlattığı|anlattigi|sunucu|uygulamalı|uygulamali/i.test(routeSafeInput));
    const productionTypeForPayload = isImageProduction ? "image" : isLuxuryProductCommercialPrompt(cleanInput) ? "video" : wantsPresenterVideo && activePlanInput.production_type === "video" ? "talking_video" : activePlanInput.production_type;
    const presenterCreative = wantsPresenterVideo && !isImageProduction ? buildPresenterCreativeBrief({ prompt: cleanInput, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, title: activePlanInput.summary }) : null;
    const providerPrompt = presenterCreative?.providerPrompt ?? cleanInput;
    const stylePackIdForPayload = animationStylePackId(cleanInput, activePlanInput.production_type);
     const preferredProviderForPayload = isImageProduction || project ? undefined : animationProductionIntent ? "runway_first" : "minimax";
    const creativeActivityLog = presenterCreative ? initialPresenterActivityLog(presenterCreative) : [];
    const mergedFeatures = Array.from(new Set([...(activePlanInput.selected_features || []), ...setupFields.selected_features, ...(wantsPresenterVideo ? ["AI presenter", "Minimax talking video", "Creative director prompt", presenterCreative?.preset ?? "Creator-style SaaS presenter"] : []), ...(noPeopleMotionIntent ? ["No presenter", "Motion graphics", "No office", "No people"] : [])]));
    const formats = setupFields.delivery_formats.length
      ? setupFields.delivery_formats
      : activePlanInput.delivery_requirements?.formats?.length
        ? activePlanInput.delivery_requirements.formats
        : project
          ? ["source_code", "readme", "dashboard_delivery"]
          : ["final_mp4", "dashboard_delivery"];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    const response = await fetch("/api/productions", {
      method: "POST",
      headers: authHeaders(accessToken),
      signal: controller.signal,
      body: JSON.stringify({
        user_id: userId,
        user_email: userEmail,
        title: `${labelFor(productionTypeForPayload)} production`,
         prompt: cleanInput,
         product_url: cleanInput.match(/https?:\/\/[^\s,]+/i)?.[0] ?? undefined,
         product_brief: cleanInput.match(/https?:\/\/[^\s,]+/i) ? undefined : cleanInput,
         production_type: productionTypeForPayload,
        package_id: isLuxuryProductCommercialPrompt(cleanInput) ? "video_premium" : activePlanInput.package_id,
        quality: setupFields.selected_quality || activePlanInput.selected_quality,
        selected_quality: setupFields.selected_quality || activePlanInput.selected_quality,
        output_duration_seconds: isImageProduction ? 0 : Number(setupFields.selected_duration?.replace(/\D/g, "")) || Number(activePlanInput.selected_duration?.replace(/\D/g, "")) || (project ? 0 : 30),
        output_count: outputIntent.outputCount,
        requested_clip_count: outputIntent.requestedClipCount,
        requested_alternative_count: outputIntent.requestedAlternativeCount,
        features: mergedFeatures.join(", "),
        project_details: [setupFields.selected_style || activePlanInput.selected_style, activePlanInput.selected_modules.join(", "), setupItemsForPayload.length ? `Production setup: ${setupItemsForPayload.join(", ")}` : "", activePlanInput.summary].filter(Boolean).join("\n"),
        estimated_credits: totalEstimatedCreditsForPayload,
        delivery_level: project ? "working_source_package" : "production_package",
        delivery_requirements: { requested: true, status: "pending", formats },
        request_metadata: { source: "omnichannel_studio", workPage: true, routeLock: isLuxuryProductCommercialPrompt(cleanInput) ? "minimax_direct_luxury_product_commercial" : undefined, plan: { ...activePlanInput, production_type: productionTypeForPayload, package_id: isLuxuryProductCommercialPrompt(cleanInput) ? "video_premium" : activePlanInput.package_id }, originalPlan: activePlanInput, routedFromProductionType: activePlanInput.production_type, presenterMode: isImageProduction ? false : wantsPresenterVideo, outputKind: isImageProduction ? "static_image" : undefined, imageType: imageTypeForPayload, aspectRatio: aspectRatioForPayload, aspect_ratio: aspectRatioForPayload, noPeopleMotionIntent, preferredProvider: preferredProviderForPayload, selectedProviderService: preferredProviderForPayload, provider_service: preferredProviderForPayload, stylePackId: stylePackIdForPayload, providerPrompt, thumbnailPrompt, thumbnail_image_description: thumbnailPrompt, avoidPrompt, providerAvoidPrompt: avoidPrompt, creativeBrief: presenterCreative?.creativeBrief, creativePreset: presenterCreative?.preset, creativeTags: presenterCreative?.tags, creativeActivityLog, productionCards, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, selectedAvatar: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? null : selectedAvatar, selectedVoice: isImageProduction ? null : selectedVoice, selectedSound: isImageProduction ? null : selectedSound, heygen_avatar_id: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? undefined : activeSelectedAvatar?.avatarId, heygen_look_id: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? undefined : activeSelectedAvatar?.lookId, heygen_voice_id: isImageProduction ? undefined : selectedVoice?.id, heygen_music_id: isImageProduction ? undefined : selectedSound?.id, heygen_music_audio_url: isImageProduction ? undefined : selectedSound?.audioUrl, heygenQualityTier: heygenTierForPayload.selected, heygenTierCredits: heygenTierForPayload.credits, heygenTierDurationSeconds: heygenTierForPayload.seconds, manualMinimaxCredits: manualMinimaxCreditsForPayload, outputIntent, sourceHandling, totalEstimatedCredits: totalEstimatedCreditsForPayload, uploadedMaterials: materials },
        input_json: { work_prompt: cleanInput, routeLock: isLuxuryProductCommercialPrompt(cleanInput) ? "minimax_direct_luxury_product_commercial" : undefined, providerPrompt, thumbnailPrompt, thumbnail_image_description: thumbnailPrompt, avoidPrompt, providerAvoidPrompt: avoidPrompt, creativeBrief: presenterCreative?.creativeBrief, creativePreset: presenterCreative?.preset, creativeTags: presenterCreative?.tags, creativeActivityLog, plan: { ...activePlanInput, production_type: productionTypeForPayload }, originalPlan: activePlanInput, routedFromProductionType: activePlanInput.production_type, presenterMode: isImageProduction ? false : wantsPresenterVideo, noPeopleMotionIntent, preferredProvider: preferredProviderForPayload, selectedProviderService: preferredProviderForPayload, provider_service: preferredProviderForPayload, stylePackId: stylePackIdForPayload, productionCards, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, selectedAvatar: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? null : selectedAvatar, selectedVoice: isImageProduction ? null : selectedVoice, selectedSound: isImageProduction ? null : selectedSound, heygen_avatar_id: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? undefined : activeSelectedAvatar?.avatarId, heygen_look_id: isImageProduction || wantsMinimaxBrollVideoAgent || wantsNoPresenterIntent ? undefined : activeSelectedAvatar?.lookId, heygen_voice_id: isImageProduction ? undefined : selectedVoice?.id, heygen_music_id: isImageProduction ? undefined : selectedSound?.id, heygen_music_audio_url: isImageProduction ? undefined : selectedSound?.audioUrl, heygenQualityTier: heygenTierForPayload.selected, heygenTierCredits: heygenTierForPayload.credits, heygenTierDurationSeconds: heygenTierForPayload.seconds, manualMinimaxCredits: manualMinimaxCreditsForPayload, outputIntent, sourceHandling, totalEstimatedCredits: totalEstimatedCreditsForPayload, uploadedMaterials: materials },
        uploaded_materials: materials,
        legal_acceptance: true
      })
    }).finally(() => window.clearTimeout(timeout));
    const data = await response.json().catch(() => ({}));
    if (data.duplicate_request_reused && data.production) return data.production as WorkProductionCard;
    if (!response.ok) {
      const isCreditError = response.status === 402 || data.redirect === "/dashboard/credits" || /not enough credits|credits required/i.test(String(data.error ?? ""));
      if (isCreditError) {
        const required = Number(data.required ?? data.requiredCredits ?? totalEstimatedCreditsForPayload) || totalEstimatedCreditsForPayload;
        const available = Number(data.available ?? 0) || 0;
        const shortfall = Number(data.shortfall ?? Math.max(0, required - available)) || 0;
        setStatus(false ? `Yetersiz kredi. Gerekli: ${required.toLocaleString()} kredi, mevcut: ${available.toLocaleString()} kredi, eksik: ${shortfall.toLocaleString()} kredi.` : `Insufficient credits. Required: ${required.toLocaleString()} credits, available: ${available.toLocaleString()} credits, missing: ${shortfall.toLocaleString()} credits.`);
      } else {
        setStatus(data.error ?? statusUx("Production oluşturulamadı.", "Production could not be created."));
      }
      return null;
    }
    return (data.production ?? (data.production_id ? { id: data.production_id } : null)) as WorkProductionCard | null;
  }

  async function startProductionForPlan(activePlanInput: StudioPlan, cleanInput: string, options?: { stayOnWork?: boolean }) {
    setPlan(activePlanInput);
    setProductionPrompt(cleanInput);
    setStarting(true);
    setStatus(statusUx("Gerçek production kaydı oluşturuluyor...", "Creating the real production record..."));
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setStarting(false);
      setStatus(auth.message);
      if (auth.redirect) window.location.href = auth.redirect;
      return;
    }
    const created = await createProductionRecord(activePlanInput, cleanInput, auth.user.id, auth.user.email ?? "", auth.accessToken) as (WorkProductionCard & { duplicate_request_reused?: boolean }) | null;
    if (!created?.id) {
      setStarting(false);
      return;
    }
    setActiveProduction(created);
    if (created.duplicate_request_reused) {
      await refreshActiveProduction(created.id, auth.user.id, auth.accessToken);
      setStarting(false);
      setStatus(statusUx("Aynı üretim zaten mevcuttu; yeni provider start yapılmadı.", "The same production already existed; no new provider start was issued."));
      if (!options?.stayOnWork) {
        setStatus(statusUx("Production kaydı zaten vardı. Detaylar Work alanında kalıyor.", "Production record already existed. Details stay in Work."));
      }
      return;
    }
    const isImageStart = isImageProductionType(activePlanInput.production_type);
    const providerHint = ["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(activePlanInput.production_type)
      ? { preferredProvider: "minimax", provider_service: "minimax", selectedProviderService: "minimax" }
      : {};
    void providerHint;
if (isImageStart) {
  setStatus(statusUx("Production oluşturuldu. Provider arka planda başlayacak.", "Production created. The provider will start in the background."));
  void refreshActiveProduction(created.id, auth.user.id, auth.accessToken);
  setStarting(false);
      if (!options?.stayOnWork) {
        setStatus(statusUx("Production kaydı hazır. Detaylar Work alanında kalıyor.", "Production record is ready. Details stay in Work."));
      }
  return;
}
    setStatus(statusUx("Production oluşturuldu. Provider arka planda başlayacak.", "Production created. The provider will start in the background."));
    void refreshActiveProduction(created.id, auth.user.id, auth.accessToken);
    await refreshActiveProduction(created.id, auth.user.id, auth.accessToken);
    setStarting(false);
        if (!options?.stayOnWork) {
        setStatus(statusUx("Production kaydı hazır. Detaylar Work alanında kalıyor.", "Production record is ready. Details stay in Work."));
      }
  }

  async function askStudio(nextInput = input) {
    const clean = nextInput.trim();
    if (!clean || planning || starting) return;
    setInput("");
    setMessages((current) => [...current, { id: uid(), role: "user", content: clean }]);

    if (isStartIntent(clean) && (plan || productionPrompt.trim())) {
      const activeDraft = plan ?? localPlan(productionPrompt.trim(), forcedProductionType);
      setPlan(activeDraft);
      setProductionSetup(defaultSetupFor(activeDraft.production_type, productionPrompt.trim(), activeDraft));
      setStatus(statusUx("Mevcut taslak hazır. Üretimi başlat ile bu çalışma alanında production kaydını oluştur.", "Draft is ready. Use Start Production to create the production record in this workspace."));
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: assistantReply(activeDraft, detectWorkLanguage(productionPrompt.trim() || clean)) }]);
      return;
    }

    if (isExplainIntent(clean) && !/create|build|make|generate|produce|hazırla|hazirla|oluştur|olustur|yap/i.test(clean)) {
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: explainProductionFlow(plan, detectWorkLanguage(clean)) }]);
      setStatus(plan ? statusUx("Mevcut taslak hazır. Devam etmek istediğinde Üretimi başlat'a bas.", "Current draft is still ready. Press Start Production when you want to continue.") : statusUx("Crelavo'ya ne üretmek istediğini yaz; ardından Üretimi başlat bu çalışma alanında üretim kaydı oluşturacak.", "Ask Crelavo what to create, then Start Production will create the production record in this workspace."));
      return;
    }

    setPlanning(true);
    setStatus(detectWorkLanguage(clean) === "tr" ? "İsteğin Crelavo AI üzerinden yönlendiriliyor..." : "Routing your request through Crelavo AI...");

    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      const fallback = localPlan(clean, shouldForceImageProduction(clean) ? "image" : forcedProductionType);
        setPlan(fallback);
        setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(fallback), clean, fallback.production_type));
        resetSetupFor(fallback, clean);
      setProductionPrompt(clean);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: "I prepared a draft, but you need to sign in before starting production." }]);
      setStatus(auth.message);
      setPlanning(false);
      if (auth.redirect) window.location.href = auth.redirect;
      return;
    }

    if (!isProductionRequest(clean)) {
      const chatResponse = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({
          user_id: auth.user.id,
          user_email: auth.user.email ?? "",
          message: clean,
          mode: "quick",
          language: detectWorkLanguage(clean),
          conversation_id: conversationId || undefined,
          messages: messages.slice(-10).map((message) => ({ role: message.role, content: message.content }))
        })
      });
      const chatData = await chatResponse.json().catch(() => ({}));
      setPlanning(false);
      if (!chatResponse.ok) {
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: chatData.error ?? (detectWorkLanguage(clean) === "tr" ? "Cevap oluşturulamadı." : "The assistant could not create a reply.") }]);
      setStatus(chatData.error ?? (detectWorkLanguage(clean) === "tr" ? "Asistan cevabı oluşturulamadı." : "Assistant chat failed."));
        return;
      }
      setConversationId(chatData.conversation_id ?? conversationId);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: String(chatData.reply ?? (detectWorkLanguage(clean) === "tr" ? "Buradayım." : "I'm here.")) }]);
      setStatus(detectWorkLanguage(clean) === "tr" ? "Cevaplandı." : "Answered.");
      return;
    }

    const response = await fetch("/api/assistant/plan", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        user_id: auth.user.id,
        user_email: auth.user.email ?? "",
        idea: clean,
        mode: "quick",
        language: detectWorkLanguage(clean),
        conversation_id: conversationId || undefined,
        messages: messages.slice(-10).map((message) => ({ role: message.role, content: message.content }))
      })
    });

    const data = await response.json().catch(() => ({} as PlanResponse));
    setPlanning(false);

    if (!response.ok || !data.plan) {
      const fallback = localPlan(clean, shouldForceImageProduction(clean) ? "image" : forcedProductionType);
        setPlan(fallback);
        setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(fallback), clean, fallback.production_type));
        resetSetupFor(fallback, clean);
      setProductionPrompt(clean);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: assistantReply(fallback, detectWorkLanguage(clean)) }]);
      setStatus(data.error ? `Planner fallback used: ${data.error}` : (detectWorkLanguage(clean) === "tr" ? "Planlayıcı yedeği kullanıldı. Taslak hazır." : "Planner fallback used. Draft is ready."));
      if (data.redirect) window.location.href = data.redirect;
      return;
    }

    const normalized = normalizePlan(data.plan, clean, shouldForceImageProduction(clean) ? "image" : forcedProductionType);
    const finalPlan = shouldForceImageProduction(clean) ? normalizePlan({ ...normalized, production_type: "image", package_id: "image_single", selected_quality: "Image", selected_duration: "Static", selected_modules: ["Image generation"], selected_features: ["Production package", "PNG/JPG delivery"], delivery_requirements: { requested: true, status: "pending", formats: ["final_image", "png", "jpg", "dashboard_delivery"] } }, clean, "image") : normalized;
    setConversationId(data.conversation_id ?? conversationId);
    setPlan(finalPlan);
    setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(finalPlan), clean, finalPlan.production_type));
    setProductionSetup(sanitizeSetupForProduction(finalPlan.production_type, defaultSetupFor(finalPlan.production_type, clean, finalPlan), clean, finalPlan));
    setProductionPrompt(clean);
    setMessages((current) => [...current, { id: uid(), role: "assistant", content: assistantReply(finalPlan, detectWorkLanguage(clean)) }]);
    setStatus(detectWorkLanguage(clean) === "tr" ? "Üretim ayarları hazır. Gerekli seçenekleri kontrol edip Üretimi başlat ile başlat." : "Production setup is ready. Review the required options, then start with Start Production.");
  }

  function submitPrompt(event: FormEvent) {
    event.preventDefault();
    askStudio();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    askStudio();
  }

  function useChip(chip: string) {
    const prompt = chip === "Website" ? "Create a modern website with dashboard delivery and source code."
      : chip === "Mobile App" ? "Create a mobile app with screens, source package, and setup guide."
      : chip === "Animation" ? "Create an animation production with motion graphics, character animation, or explainer-style visual storytelling."
      : chip === "Anime Short Film" ? "Create an anime short film with cinematic scenes, characters, dialogue, and final delivery."
      : chip === "Studio / Series-Film" ? "Create a studio / series-film production with script, scene plan, characters, trailer or episode structure."
      : chip === "Stickman Animation" ? "Create a stickman animation with fast educational or storytelling motion graphics."
      : chip === "Brand Kit" ? "Create a brand kit with logo concepts, color palette, typography, social kit, and usage rules."
      : chip === "Image / Banner / Poster" ? "Create a banner / poster / thumbnail visual set with clean marketing graphics and brand-ready layout."
      : chip === "Voice" ? "Create a voice-over or voice clone production with narration, dubbing, or localized voice delivery."
      : chip === "Campaign" ? "Create a campaign production with hooks, captions, ad angles, visuals, and launch assets together."
      : chip === "Product Link to Video" ? "Create an ecommerce product ad video from a Shopify, Amazon, Trendyol, WooCommerce, or product page link. Turn the product link into a TikTok / Instagram Reels style ad video with hook, product proof, offer, captions, and final social-ready delivery."
      : chip === "Ad Creative Angles" ? "Create fresh ecommerce ad creative angles for this product or offer. Generate multiple selling angles such as fear/problem, discount, benefit, before-after, social proof, urgency, and problem-solution so the brand can fight creative fatigue."
      : chip === "UGC Style Ad" ? "Create a natural UGC-style product ad with one AI presenter / creator speaking to camera. Use Minimax H3, a premium product demo style, social-first pacing, thumbnail, final MP4, dashboard delivery, and revision right."
      : chip === "Lower Ad Costs" ? "Create a lower-ad-cost creative plan for Facebook, Instagram, and TikTok ads. Focus on stronger hooks, clearer product proof, better CTA, higher ROI, lower CPC, and more conversion-focused video/image angles."
      : chip === "Video Clipping" ? "Create a video clipping production. Extract the best hooks and highlights from the uploaded long video or link, keep the strongest moments, and prepare final social-ready clips with captions if needed."
      : `Create a ${chip.toLowerCase()} production.`;
    const forcedType = productionTypeFromCategory(chip);
    const chipPlan = localPlan(prompt, forcedType);
    const chipSetup = defaultSetupFor(chipPlan.production_type, prompt, chipPlan);
    setInput(prompt);
    setPlan(chipPlan);
    setProductionSetup(chipSetup);
    setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(chipPlan), prompt, chipPlan.production_type));
    if (typeof window !== "undefined") [workDraftStorageKey, ...legacyWorkDraftStorageKeys].forEach((key) => window.localStorage.removeItem(key));
    setStatus(statusUx(`${chip} promptu ve kurulum taslağı yüklendi. Kontrol edip üretimi başlatabilirsin.`, `${chip} prompt and setup draft loaded. Review it and start production.`));
  }

  async function uploadMaterial(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(statusUx("Materyal yükleniyor...", "Uploading material..."));
    try {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) {
        setStatus(auth.message);
        if (auth.redirect) window.location.href = auth.redirect;
        return;
      }
      const formData = new FormData();
      formData.append("user_id", auth.user.id);
      formData.append("purpose", "omnichannel_studio_material");
      formData.append("file", file);
      const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.material) {
        setStatus(data.error ?? statusUx("Materyal yüklenemedi.", "Material upload failed."));
        return;
      }
      setMaterials((current) => [...current, data.material as UserUploadedMaterial]);
      setStatus(statusUx("Materyal yüklendi ve bu üretim taslağına eklendi.", "Material uploaded and attached to this production draft."));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : statusUx("Materyal yüklenemedi.", "Material upload failed."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function startProduction() {
    const fallbackPrompt = plan ? [productionPrompt, input, plan.summary, plan.selected_features?.join(", "), plan.selected_modules?.join(", "), labelFor(plan.production_type)].filter(Boolean).join("\n").trim() : "";
    const clean = (productionPrompt || input || fallbackPrompt).trim();
    const activePlan = plan ? normalizePlan(plan, clean || fallbackPrompt, forcedProductionType) : clean ? localPlan(clean, forcedProductionType) : null;
    if (!activePlan) {
      setStatus(statusUx("Önce ne üretmek istediğini yaz.", "Describe what you want to create first."));
      return;
    }
    try {
      await startProductionForPlan(activePlan, clean, { stayOnWork: true });
    } catch (error) {
      setStarting(false);
      setStatus(error instanceof DOMException && error.name === "AbortError" ? statusUx("Production isteği henüz tamamlanmadı. Kayıt oluşmuş olabilir; biraz bekleyip üretim durumunu kontrol edin.", "Production request is still starting. The record may already exist; wait a moment and check production status.") : error instanceof Error ? error.message : statusUx("Production başlatılamadı.", "Production could not be started."));
    }
  }

  return (
    <section className="omni-studio-page">
      <div className="omni-studio-shell">
        <div className="omni-agent-workbench">
        <aside className="omni-super-panel omni-brain-panel" aria-label="AI Brain">
          <span className="badge"><Bot size={14} /> Work Brain</span>
          <h2>Crelavo AI Brain</h2>
          <p>Tek ekranda chat, üretim, önizleme ve entegrasyon. Kullanıcı artık farklı sayfalara taşınmadan buradan başlar.</p>
          <div className="omni-minimax-badge">
            <span className="omni-pulse-dot" />
            <div><small>POWERED BY</small><strong>MiniMax H3™ <em>Live Engine</em></strong></div>
            <b>100 RPM ACTIVE</b>
          </div>
          <div className="omni-super-list">
            <span><strong>1</strong> Chat ile isteği al</span>
            <span><strong>2</strong> Üretim planını çıkar</span>
            <span><strong>3</strong> Work içinde başlat</span>
          </div>
        </aside>

        <main className="omni-chat-panel" ref={chatRef}>
          {messages.length === 0 ? (
            <div className="omni-empty-state">
              <Bot size={48} />
              <h2>Tell Crelavo what to create</h2>
              <p>Example: Create a premium online movie streaming website with login, categories, watch page, admin panel, and source code delivery.</p>
            </div>
          ) : null}

          {messages.map((message) => (
            <article className={`omni-message ${message.role}`} key={message.id}>
              <div className="omni-avatar">{message.role === "user" ? "U" : <Bot size={16} />}</div>
              <div className="omni-bubble">{message.content}</div>
            </article>
          ))}

          {planning ? <article className="omni-message assistant"><div className="omni-avatar"><Bot size={16} /></div><div className="omni-bubble"><Loader2 size={16} className="spin" /> Routing request...</div></article> : null}

          {activeProduction ? (
            <article className="omni-result-card production-ready-card" role="link" tabIndex={0} title="Open production list" onClick={() => { window.location.href = "/dashboard/productions"; }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); window.location.href = "/dashboard/productions"; } }}>
              <div className="omni-result-icon">{activeProjectProduction ? <Code2 size={22} /> : <Video size={22} />}</div>
              <div className="omni-result-body">
                <span className="badge">{activeProjectProduction && String(activeProduction.generation_status ?? "").toLowerCase() === "project_delivery_ready" ? ux("Production ready") : ux("Production running")}</span>
                <h3>{activeProduction.title || "Crelavo production"}</h3>
                <div className="omni-result-grid">
                  <span><strong>{ux("Production ID")}</strong>{activeProduction.id}</span>
                  <span><strong>{ux("Status")}</strong>{activeProduction.generation_status || activeProduction.automation_status || activeProduction.status || "starting"}</span>
                  <span><strong>{ux("Provider")}</strong>{productionCardProvider(activeProduction)}</span>
                </div>
                <div className="omni-result-grid">
                  <span><strong>{ux("Preview")}</strong>{activeProduction.preview_url ? ux("Ready") : ux("Waiting")}</span>
                  <span><strong>{ux("Delivery")}</strong>{activeProduction.delivery_link ? ux("Ready") : ux("Waiting")}</span>
                  <span><strong>{ux("Workspace")}</strong>{ux("Production stays here")}</span>
                </div>
                {activeProjectProduction ? (
                  <div className="omni-result-grid">
                    <span><strong>Project delivery</strong>{activeProduction.delivery_link ? ux("Ready") : ux("Preparing")}</span>
                    <span><strong>Source package</strong>{activeProduction.source_files_url || activeProduction.delivery_zip_url ? ux("Ready") : ux("Preparing")}</span>
                    <span><strong>README / setup</strong>{activeProduction.readme_url ? ux("Ready") : ux("Preparing")}</span>
                  </div>
                ) : (
                  <div className="omni-result-grid">
                    <span><strong>{false ? "Provider kanıtı" : "Provider proof"}</strong>{activeProviderProof.provider || productionCardProvider(activeProduction)}</span>
                    <span><strong>{false ? "Minimax oturumu/işi" : "Minimax session/job"}</strong>{compactId(activeProviderProof.sessionId)}</span>
                    <span><strong>{false ? "Minimax video ID" : "Minimax video ID"}</strong>{compactId(activeProviderProof.videoId)}</span>
                    <span><strong>{false ? "Final video" : "Final video"}</strong>{activeProviderProof.finalUrl ? <a href={activeProviderProof.finalUrl} target="_blank" rel="noreferrer">{ux("Ready")}</a> : ux("Waiting")}</span>
                  </div>
                )}
              </div>
            </article>
          ) : null}

          {plan && !activeProduction ? (
            <article className="omni-result-card">
              <div className="omni-result-icon">{isProjectType(plan.production_type) ? <Code2 size={22} /> : plan.production_type === "video" ? <Video size={22} /> : <PackageCheck size={22} />}</div>
              <div className="omni-result-body">
                <span className="badge">{ux("Production draft")}</span>
                <h3>{ux(labelFor(plan.production_type))}</h3>
                <p>{assistantReply(plan, workUiLanguage)}</p>
                <div className="omni-result-grid">
                  <span><strong>{ux("Package")}</strong>{plan.package_id}</span>
                  <span><strong>{ux("Delivery")}</strong>{(plan.delivery_requirements?.formats ?? ["dashboard_delivery"]).filter((format) => !(subtitlesDisabledByPrompt((productionPrompt || input).toLowerCase()) && /subtitle|caption|altyaz/i.test(format))).map((format) => ux(format)).join(", ") || ux("Dashboard delivery")}</span>
                  <span><strong>{ux("Credits")}</strong>{estimatedCredits}</span>
                </div>
                <div className="omni-production-cards">
                  <strong>{ux("Choose what will be produced")}</strong>
                  <div>{filterCardsForPrompt(productionCardsFor(plan), productionPrompt || input, plan.production_type).map((item) => {
                    const active = activeSelectedProductionCards.includes(item);
                    return <button type="button" className={active ? "active" : ""} key={item} onClick={() => setSelectedProductionCards((current) => current.includes(item) ? current.filter((card) => card !== item) : [...current, item])}>{ux(item)}</button>;
                  })}</div>
                </div>
                {setupProfile ? (
                  <div className="omni-setup-panel">
                    <div className="omni-setup-head">
                      <strong>{ux(setupProfile.title)}</strong>
                      <small>{ux(setupProfile.note)}</small>
                    </div>
                    {setupProfile.groups.map((group) => (
                      <section className="omni-setup-group" key={group.id}>
                        <div className="omni-setup-group-title">
                          <span>{ux(group.title)}</span>
                          <small>{group.multi ? ux("Multiple") : ux("Single")}{group.credit ? ` · +${group.credit.toLocaleString()} ${ux("credits each")}` : ""}</small>
                        </div>
                        <div className="omni-setup-options">
                          {group.options.map((option) => {
                            const active = (activeProductionSetup[group.id] ?? []).includes(option);
                            const credit = optionCredit(option, group);
                            return <button type="button" className={active ? "active" : ""} key={`${group.id}-${option}`} onClick={() => toggleSetupOption(group, option)}>{ux(option)}{credit ? ` +${credit.toLocaleString()}` : ""}</button>;
                          })}
                        </div>
                        {group.id === "presenterChoice" ? <div className="omni-gallery-actions">
                          <button type="button" onClick={() => openMinimaxGallery("avatar")}>{false ? "Karakter galerisinden seç" : "Choose from character gallery"}</button>
                          <button type="button" onClick={() => openMinimaxGallery("voice")}>{false ? "Ses galerisinden seç" : "Choose from voice gallery"}</button>
                          {selectedAvatar ? <small>{false ? "Seçili karakter" : "Selected character"}: {selectedAvatar.name}</small> : null}
                          {selectedVoice ? <small>{false ? "Seçili ses" : "Selected voice"}: {selectedVoice.name}</small> : null}
                          {selectedAvatar ? <small>{selectedAvatar.avatarId ? (false ? "Not: Bu seçim provider'a gönderilir." : "Note: This selection is sent to the provider.") : (false ? "Not: Bu seçim görsel tercih olarak kaydedilir; bu kart için avatar_id verilmediği için provider'a avatar olarak gönderilmez." : "Note: This selection is saved as a visual preference; because no avatar_id was provided for this card, it is not sent as a provider avatar.")}</small> : null}
                        </div> : null}
                        {group.id === "extras" ? <div className="omni-gallery-actions">
                          <button type="button" onClick={() => openMinimaxGallery("music")}>{false ? "Müzik galerisinden seç" : "Choose from music gallery"}</button>
                          {selectedSound ? <small>{false ? "Seçili müzik" : "Selected music"}: {selectedSound.name}</small> : null}
                          {selectedSound ? <small>{false ? "Not: Müzik seçimi Crelavo kaydında tutulur ve final post-production aşamasında eklenecek şekilde işaretlenir." : "Note: Music selection is stored in Crelavo metadata and marked for final post-production."}</small> : null}
                        </div> : null}
                      </section>
                    ))}
                    {draftWantsThumbnail ? <div className="omni-setup-group">
                      <div className="omni-setup-group-title">
                        <span>{false ? "Thumbnail / kapak promptu" : "Thumbnail / cover prompt"}</span>
                        <small>{false ? "Boş kalırsa Crelavo otomatik FOMO prompt oluşturur." : "If empty, Crelavo creates an automatic FOMO prompt."}</small>
                      </div>
                      <textarea value={customThumbnailPrompt} onChange={(event) => setCustomThumbnailPrompt(event.target.value)} placeholder={false ? "Kapak için özel prompt yaz..." : "Write a custom cover prompt..."} rows={4} />
                    </div> : null}
                    <div className="omni-setup-group">
                      <div className="omni-setup-group-title">
                        <span>{false ? "Avoid / istenmeyenler" : "Avoid / exclusions"}</span>
                        <small>{false ? "Videoda istemediğin şeyleri yaz. Provider promptuna koruma olarak eklenir." : "Write what should be avoided. This is added as provider prompt guardrails."}</small>
                      </div>
                      <textarea value={customAvoidPrompt} onChange={(event) => setCustomAvoidPrompt(event.target.value)} placeholder={false ? "Örn: presenter yok, UI yok, siyah placeholder yok, altyazı yok..." : "e.g. no presenter, no UI, no black placeholder, no subtitles..."} rows={3} />
                    </div>
                    <div className="omni-setup-summary">
                      <strong>{ux("Selected setup")}</strong>
                      <p>{setupItems.length ? setupItems.map(ux).join(" · ") : ux("No extra setup selected yet.")}</p>
                      <p>{[...setupBreakdown.filter((item) => item.credits > 0), ...manualMinimaxBreakdown].map((item) => `${ux(item.title)}: +${item.credits.toLocaleString()}`).join(" · ")}</p>
                      <span>{ux("Base")}: {draftBaseCredits.toLocaleString()} · {ux("Main jobs")}: +{cardCredits.toLocaleString()} · {ux("Setup")}: +{setupCredits.toLocaleString()} · {ux("Total")}: {estimatedCredits}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <button className="omni-start-button" type="button" onClick={startProduction} disabled={starting || planning}>{starting ? ux("Creating...") : ux("Start Production")}</button>
            </article>
          ) : null}
        </main>

        <aside className="omni-super-panel omni-deploy-panel" aria-label="Deploy Hub">
          <span className="badge"><PackageCheck size={14} /> Deploy Hub</span>
          <h2>Outputs & integrations</h2>
          <p>Once production is complete, download, embed, source bundle and publish links appear here.</p>
          <div className="omni-deploy-card">
            <small>Active production</small>
            <strong>{activeProduction?.title || plan ? ux(labelFor(plan?.production_type ?? "video")) : "No production yet"}</strong>
            <span>{activeProduction ? ux("Production running") : plan ? ux("Production draft") : "Awaiting command"}</span>
            {activeProduction ? <>
              <span><b>Production ID</b>{activeProduction.id}</span>
              <span><b>Status</b>{activeProduction.generation_status || activeProduction.automation_status || activeProduction.status || "starting"}</span>
               {activeProjectProduction ? <span><b>Source package</b>{activeProduction.delivery_zip_url || activeProduction.source_files_url ? "Ready" : "Preparing"}</span> : <span><b>Provider</b>{productionCardProvider(activeProduction)}</span>}
              <span style={{ display: activeProjectProduction ? "none" : undefined }}><b>Final video</b>{activeProviderProof.finalUrl ? <a href={activeProviderProof.finalUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.45rem 0.8rem", borderRadius: "999px", background: "linear-gradient(135deg, #00e5ff, #7c4dff)", color: "#fff", boxShadow: "0 0 16px rgba(124,77,255,0.6), 0 0 24px rgba(0,229,255,0.35)", fontWeight: 700, textDecoration: "none" }}>{"Open final video"}</a> : <span style={{ color: "#7dd3fc", fontWeight: 700 }}>{"Waiting"}</span>}</span>
            </> : null}
          </div>
           {!activeProjectProduction ? <div className="omni-deploy-card">
             <small>Embed / kod</small>
             <strong>{activeProduction?.delivery_link ? "Ready" : "Will be prepared in Work"}</strong>
             <code>{"<script src=\"https://www.crelavo.com/embed/live-sales-avatar.js\"></script>"}</code>
           </div> : null}
          <div className="omni-deploy-card">
            <small>Delivery</small>
            <strong>{estimatedCredits} credits</strong>
            <span>{activeProjectProduction ? "Source files, preview, README and project delivery are tracked from one screen." : "Video, web, app, live sales or source bundle is tracked from one screen."}</span>
          </div>
        </aside>

        {galleryMode ? <div className="omni-gallery-modal" role="dialog" aria-modal="true">
          <div className="omni-gallery-card">
            <div className="omni-gallery-head">
              <div>
                <strong>{galleryMode === "avatar" ? (false ? "Avatar galerisi" : "Avatar gallery") : galleryMode === "voice" ? (false ? "Ses galerisi" : "Voice gallery") : (false ? "Müzik galerisi" : "Music gallery")}</strong>
                <p>{galleryMode === "avatar" ? (false ? "Görerek bir karakter seç." : "Choose a character visually.") : galleryMode === "voice" ? (false ? "Sesi dinleyip üretime bağla." : "Preview and attach a voice to production.") : (false ? "Müziği ara, dinle ve üretime bağla." : "Search, preview and attach background music.")}</p>
              </div>
              <button type="button" onClick={() => setGalleryMode(null)}>×</button>
            </div>
            {galleryLoading ? <div className="omni-gallery-empty"><Loader2 size={16} className="spin" /> {false ? "Galeri yükleniyor..." : "Loading gallery..."}</div> : null}
            {galleryError ? <div className="omni-gallery-empty">{galleryError}</div> : null}
            {!galleryLoading && !galleryError && galleryMode === "avatar" ? <div className="omni-gallery-grid">
              {avatarGallery.length ? avatarGallery.map((avatar) => <button type="button" key={avatar.id} className={selectedAvatar?.id === avatar.id ? "active" : ""} onClick={() => { setSelectedAvatar(avatar); setGalleryMode(null); }}>
                {avatar.imageUrl ? <img src={avatar.imageUrl} alt={avatar.name} /> : <span className="omni-gallery-placeholder">{avatar.name.slice(0, 1)}</span>}
                <strong>{avatar.name}</strong>
                <small>{[avatar.gender, avatar.style].filter(Boolean).join(" · ") || "Karakter"}</small>
              </button>) : <div className="omni-gallery-empty">{false ? "Avatar listesi boş döndü." : "No avatars returned."}</div>}
            </div> : null}
            {!galleryLoading && !galleryError && galleryMode === "voice" ? <div className="omni-gallery-grid voice">
              {voiceGallery.length ? voiceGallery.map((voice) => <div key={voice.id} className={selectedVoice?.id === voice.id ? "active omni-gallery-voice-card" : "omni-gallery-voice-card"}>
                <strong>{voice.name}</strong>
                <small>{[voice.language, voice.gender, voice.age, voice.style].filter(Boolean).join(" · ") || "Ses"}</small>
                {voice.previewAudioUrl ? <button type="button" onClick={() => { void new Audio(voice.previewAudioUrl).play(); }}>{false ? "Oynat" : "Play"}</button> : <small>{false ? "Bu ses için ön izleme yok." : "No preview available for this voice."}</small>}
                <button type="button" onClick={() => { setSelectedVoice(voice); setGalleryMode(null); }}>{false ? "Bu sesi seç" : "Select this voice"}</button>
              </div>) : <div className="omni-gallery-empty">{false ? "Ses listesi boş döndü." : "No voices returned."}</div>}
            </div> : null}
            {!galleryLoading && !galleryError && galleryMode === "music" ? <>
              <div className="omni-gallery-actions">
                {minimaxMusicVibes.map((vibe) => <button type="button" key={vibe.query} onClick={() => openMinimaxGallery("music", vibe.query)}>{vibe.label}</button>)}
              </div>
              <div className="omni-gallery-actions">
                <input value={soundQuery} onChange={(event) => setSoundQuery(event.target.value)} placeholder={false ? "Örn: energetic lofi beats" : "e.g. energetic lofi beats"} />
                <button type="button" onClick={() => openMinimaxGallery("music", soundQuery)}>{false ? "Ara" : "Search"}</button>
              </div>
              <div className="omni-gallery-grid voice">
                {soundGallery.length ? soundGallery.map((sound) => <div key={sound.id} className={selectedSound?.id === sound.id ? "active omni-gallery-voice-card" : "omni-gallery-voice-card"}>
                  <strong>{sound.name}</strong>
                  <small>{[sound.style, sound.duration].filter(Boolean).join(" · ") || "Müzik"}</small>
                  {sound.audioUrl ? <button type="button" onClick={() => { void new Audio(sound.audioUrl).play(); }}>{false ? "Oynat" : "Play"}</button> : <small>{false ? "Bu müzik için ön izleme yok." : "No preview available for this music."}</small>}
                  <button type="button" onClick={() => { setSelectedSound(sound); setGalleryMode(null); }}>{false ? "Bu müziği seç" : "Select this music"}</button>
                </div>) : <div className="omni-gallery-empty">{false ? "Müzik listesi boş döndü." : "No music returned."}</div>}
              </div>
            </> : null}
          </div>
        </div> : null}

        </div>

        {status ? <p className="omni-status-line">{status}</p> : null}
        {materials.length ? (
          <div className="omni-material-list omni-material-list-floating" aria-live="polite">
            <strong>{false ? "Ekli materyaller" : "Attached materials"}</strong>
            {materials.map((material) => <span key={material.file_url} title={material.title}>{material.title}</span>)}
          </div>
        ) : null}

        <form className="omni-input-bar" onSubmit={submitPrompt}>
          <input ref={fileRef} type="file" accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.zip" hidden onChange={(event) => uploadMaterial(event.currentTarget.files)} />
          <button className="omni-icon-button" type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Attach material"><Paperclip size={18} /></button>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Describe what you want to create..." />
          <button className="omni-send-button" type="submit" disabled={planning || !input.trim()}><Send size={18} /></button>
        </form>
      </div>
    </section>
  );
}
