"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, Code2, Loader2, PackageCheck, Paperclip, Send, Sparkles, Video } from "lucide-react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";
import { buildPresenterCreativeBrief, initialPresenterActivityLog } from "@/lib/creative-director";
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

type HeyGenAgentArtifact = {
  id: string;
  type?: string;
  title?: string;
  status?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  providerResourceId?: string;
};

const studioChips = ["Video", "Website", "Mobile App", "SaaS", "Admin Panel", "Image", "Voice", "SEO Pack", "Campaign"];

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
const sharedVideoQuality = ["480p preview", "720p", "1080p", "1080p premium", "4K"];
const sharedVideoFormat = ["Vertical 9:16", "Horizontal 16:9", "Square 1:1", "YouTube 16:9"];
const sharedVideoDuration = ["5 sec", "10 sec", "15 sec", "30 sec", "45 sec", "60 sec", "2 min", "3 min", "5 min"];
const sharedVoiceOptions = ["No voice-over", "Adult neutral voice", "Male voice", "Female voice", "Child voice", "Senior voice", "Own voice-over", "Choose AI voice", "Create AI voice"];
const sharedSubtitleOptions = ["No subtitles", "Auto subtitles", "Burned subtitles", "Subtitle file", "Large social captions"];

const setupProfiles: Record<string, SetupProfile> = {
  video: {
    title: "AI video setup",
    note: "Only video-specific production choices are shown here.",
    groups: [
      { id: "videoType", title: "Video type", options: ["Prompt-to-video", "Image-to-video", "Script-to-video", "Product ad video", "Explainer video", "Social media short", "Cinematic promo"] },
      { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
      { id: "duration", title: "Duration", options: sharedVideoDuration, credit: 350 },
      { id: "format", title: "Format", options: sharedVideoFormat, credit: 250 },
      { id: "sourceHandling", title: "Source / scene handling", options: ["Prompt-only", "Use uploaded material", "Keep original environment", "Replace background", "Blur background", "No people", "With presenter"], credit: 300 },
      { id: "background", title: "Background / environment", options: ["Product UI", "Studio", "Brand color", "Lifestyle", "City", "Nature", "Cinematic scene", "Motion graphics"], credit: 300 },
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
      { id: "duration", title: "Duration", options: sharedVideoDuration, credit: 350 },
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
      { id: "duration", title: "Duration", options: sharedVideoDuration, credit: 350 },
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
    note: "Source video, clip count, captions, audio cleanup and export choices.",
    groups: [
      { id: "source", title: "Source", options: ["Upload video", "Long podcast", "Long film/episode", "Webinar/lesson", "Product video"] },
      { id: "clipType", title: "Clip type", multi: true, options: ["Hook extraction", "Exciting moments", "Funny scenes", "Educational shorts", "Product highlights"], credit: 450 },
      { id: "clipCount", title: "Clip count", options: ["3 clips", "5 clips", "10 clips"], credit: 700 },
      { id: "format", title: "Format", options: ["TikTok 9:16", "Instagram Reels 9:16", "YouTube Shorts", "YouTube 16:9", "Square 1:1"], credit: 250 },
      { id: "captions", title: "Captions", options: sharedSubtitleOptions, credit: 300 },
      { id: "audio", title: "Audio", multi: true, options: ["Keep original audio", "Clean voice", "Remove background noise", "Add music", "Duck music under speech"], credit: 450 },
      { id: "delivery", title: "Delivery", multi: true, options: ["Final clips", "Caption files", "ZIP", "Revision right"], credit: 350 }
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

function dynamicProfileForPlan(plan: StudioPlan, hint = ""): SetupProfile {
  const base = profileForType(plan.production_type);
  const signal = `${hint} ${plan.summary ?? ""} ${plan.selected_modules.join(" ")} ${plan.selected_features.join(" ")} ${plan.selected_platforms.join(" ")} ${plan.package_id}`.toLocaleLowerCase("tr-TR");
  const hasLink = hasUrlIntent(signal);
  const isCrelavoOrSaas = hasLink && /crelavo|crelavo\.com|saas|software|dashboard|website\s+link|website\/saas|landing\s+page/.test(signal);
  const isSaasOrSiteLink = hasLink && /crelavo|saas|website|landing|site|web|dashboard|software|app|tool/.test(signal);
  const isCommerceLink = hasLink && !isCrelavoOrSaas && /shopify|amazon|trendyol|woocommerce|etsy|product|ürün|urun|store|shop|e-?commerce|marketplace|checkout/.test(signal);
  const explicitClipRequest = /clip\s*(çıkar|cikar|extract|make)|kesit\s*(çıkar|cikar)|highlight\s*(çıkar|cikar|extract)|kırp|kirp|long video|uzun video|best moments|shorts\s*(çıkar|cikar|extract|make)|reels\s*(çıkar|cikar|extract|make)/.test(signal);
  const sourceIsVideoPlatform = /https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|vimeo\.com)/.test(signal);
  const isClipLink = hasLink && sourceIsVideoPlatform && explicitClipRequest;
  const isSocialLink = hasLink && !isClipLink && /instagram|tiktok|youtube|reels|shorts|social|sosyal|post|creator|influencer/.test(signal);
  const isFilmAnimation = /anime|animation|animasyon|short film|kısa film|kisa film|drama|story|hikaye|scene|sahne/.test(signal);

  if (plan.production_type === "video_clipping" || isClipLink) {
    return {
      title: "Link/video clipping setup",
      note: "Options are based on the supplied video/social link.",
      groups: [
        { id: "source", title: "Source analysis", options: ["Analyze link", "Long video", "Podcast/webinar", "Social video", "Product video"] },
        { id: "clipType", title: "Clip goal", multi: true, options: ["Best hooks", "Product highlights", "Educational shorts", "Funny moments", "Viral moments", "Ad cutdowns"], credit: 450 },
        { id: "clipCount", title: "Clip count", options: ["3 clips", "5 clips", "10 clips"], credit: 700 },
        { id: "format", title: "Format", options: ["TikTok 9:16", "Instagram Reels 9:16", "YouTube Shorts", "YouTube 16:9", "Square 1:1"], credit: 250 },
        { id: "sourceHandling", title: "Source handling", options: ["Keep original environment", "Reframe to vertical", "Blur background", "Replace background", "Keep main speaker only", "Remove background people"], credit: 300 },
        { id: "captions", title: "Captions", options: sharedSubtitleOptions, credit: 300 },
        { id: "delivery", title: "Delivery", multi: true, options: ["Final clips", "Caption files", "ZIP", "Revision right"], credit: 350 }
      ]
    };
  }

  if (plan.production_type === "video" && (isCommerceLink || isSaasOrSiteLink || isSocialLink || hasLink)) {
    return {
      title: isCommerceLink ? "Product link ad setup" : isSaasOrSiteLink ? "Website/SaaS link ad setup" : "Link-to-video ad setup",
      note: "Options are generated from the supplied link and the selected ad/video intent.",
      groups: [
        { id: "videoType", title: "Ad type", options: isCommerceLink ? ["Product ad video", "Marketplace ad", "UGC-style product script", "Explainer product video", "Social media short"] : ["Website promo", "SaaS product demo", "Explainer video", "Social media short", "Cinematic promo"] },
        { id: "source", title: "Link analysis", multi: true, options: ["Analyze page", "Extract benefits", "Extract visuals", "Create hook", "Create CTA"], credit: 350 },
        { id: "quality", title: "Quality", options: sharedVideoQuality, credit: 900 },
        { id: "duration", title: "Duration", options: ["15 sec", "30 sec", "45 sec", "60 sec"], credit: 350 },
        { id: "format", title: "Format", options: ["Vertical 9:16", "Horizontal 16:9", "Square 1:1", "YouTube 16:9"], credit: 250 },
        { id: "visualDirection", title: "Visual direction", options: isCommerceLink ? ["Product close-up", "Clean studio background", "Lifestyle scene", "Marketplace ad", "UGC-style demo", "Premium product commercial"] : ["UI dashboard demo", "Website walkthrough", "Product explainer", "No people", "With presenter", "Motion graphics", "Premium SaaS promo"], credit: 400 },
        { id: "background", title: "Background", options: isCommerceLink ? ["White studio", "Brand color", "Home/lifestyle", "Luxury surface", "Social media style"] : ["Product UI", "Brand color", "Clean gradient", "Dashboard background", "Motion graphics"], credit: 300 },
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
  return /professional\s*voice-?over|english\s*voice-?over|voice-?over\s*(on|required|yes)|with\s*voice|with\s*voice-?over|voice\s*acting|per-character\s*voice|different\s*voices?|different\s+voice\s+for\s+each|separate\s*voices?|character\s*voices?|turkish\s*voices?|dialogue|diyalog|konuşma|konusma|replik|seslendirme\b[^.!?]{0,60}\b(olsun|istiyorum|ekle|var)|ses\b[^.!?]{0,40}\b(olsun|istiyorum|ekle|var)|dış\s*anlatıcı|dis\s*anlatici|anlatıcı\s*sesi|anlatici\s*sesi/.test(text);
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
  const wantsHeyGenStylePresenterAd = /crelavo|heygen|ugc|creator-style|one\s+natural\s+creator|realistic\s+human\s+creator|with\s+presenter|product\s+demo|promotional\s+video|tanıtım\s*videosu|tanitim\s*videosu|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|sunucu|anlattığı|anlattigi|uygulamalı|uygulamali|dışarıda|disarida|sokak|şehir|sehir|high-converting|social\s+media\s+ad|kinetic|hyperframes|motion\s+graphics/.test(text)
    && !wantsNoPeopleMotionAd
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
        if (/mp4|final output|assembled mp4|final mp4|video/.test(text)) addOption(/final mp4/);
        if (/dashboard/.test(text)) addOption(/dashboard delivery/);
        if (/revision|revizyon/.test(text)) addOption(/revision/);
      }
      if (group.id === "extras") {
        if (wantsSubtitles) addOption(/subtitles/);
        if (/mp4|final output|assembled mp4|final mp4|video/.test(text)) addOption(/final mp4/);
        if (!musicDisabledByPrompt(text) && /music|müzik|muzik|background music|fon müzik|fon muzik/.test(text)) addOption(/music/);
      }
      return [group.id, selected];
    }
    let selected = group.options[0] ? [group.options[0]] : [];
    if (group.id === "duration") {
      const wanted = requestedDurationOption(group.options, text);
      if (wanted) selected = [wanted];
    }
    if (group.id === "quality") {
      const premiumWanted = /1080p\s*premium|premium\s*1080p/.test(text) ? group.options.find((option) => /1080p premium/i.test(option)) : undefined;
      const fourK = /\b4k\b/.test(text) ? group.options.find((option) => /4k/i.test(option)) : undefined;
      const premiumAdDefault = wantsHeyGenStylePresenterAd || wantsNoPeopleMotionAd ? group.options.find((option) => /1080p premium/i.test(option)) : undefined;
      const wanted = premiumWanted || fourK || group.options.find((option) => text.includes(option.toLowerCase())) || premiumAdDefault;
      if (wanted) selected = [wanted];
    }
    if (["sourceHandling", "visualDirection"].includes(group.id)) {
      if (wantsHeyGenStylePresenterAd || /with\s*presenter|ai\s*presenter|talking\s*presenter|talking\s*avatar|realistic\s*human\s*(presenter|creator)|creator-style\s*(presenter|human|creator)|single\s*(presenter|creator)|one\s+natural\s+creator|one\s+realistic\s+human\s+creator|heygen|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|sunucu|anlattığı|anlattigi/.test(text)) {
        const presenter = group.options.find((option) => /with presenter/i.test(option));
        if (presenter) selected = [presenter];
      }
      if (wantsNoPeopleMotionAd || /no\s*people|no\s*presenter|ui-only|screenshot-only/.test(text)) {
        const noPeople = group.options.find((option) => /no people/i.test(option));
        if (noPeople) selected = [noPeople];
      }
    }
    if (group.id === "background") {
      const motionGraphics = wantsNoPeopleMotionAd || /motion\s*graphics|kinetic\s*typography|animated\s*text|text\s*cards|glitch\s*transitions|swipe\s*transitions/.test(text) ? group.options.find((option) => /motion graphics/i.test(option)) : undefined;
const city = /dışarıda|disarida|outdoor|sokak|street|şehir|sehir|city/.test(text) ? group.options.find((option) => /city/i.test(option)) : undefined;
const lifestyle = /lifestyle|creator-style|ugc|outdoor|walking|casual|natural|hareketli|uygulamalı|uygulamali/.test(text) ? group.options.find((option) => /lifestyle|home\/lifestyle/i.test(option)) : undefined;
const brand = /brand\s*color|marka\s*rengi|crelavo\s*brand/.test(text) ? group.options.find((option) => /brand color/i.test(option)) : undefined;
const cinematic = /cinematic\s*scene|sinematik/.test(text) ? group.options.find((option) => /cinematic scene/i.test(option)) : undefined;
const studio = /studio/.test(text) && !/not\s*studio|avoid\s*studio|not\s*corporate\s*studio/.test(text) ? group.options.find((option) => /studio/i.test(option)) : undefined;
const wanted = motionGraphics || city || lifestyle || brand || cinematic || studio;
      if (wanted) selected = [wanted];
    }
    if (group.id === "voice") {
      if (noVoice) {
        selected = group.options.includes("No voice-over") ? ["No voice-over"] : [];
      } else {
        const needsMultiCharacterAiVoices = wantsVoice && /different\s*voices?|different\s*voice\s*for\s*each|separate\s*voices?|separate\s*voice\s*per\s*person|character\s*voices?|per-character|dialogue|diyalog|replik|turkish\s*voices?|farklı\s*ses|farkli\s*ses|her\s*karakter.*ses|karakter\s*ses/.test(text);
        if (needsMultiCharacterAiVoices && group.options.includes("Choose AI voice")) selected = ["Choose AI voice"];
        else {
          const presenterFemaleVoice = /\bfemale\s*(presenter|creator|avatar|business presenter)|\bwoman\s*(presenter|creator|avatar)/.test(text) ? group.options.find((option) => /female voice/i.test(option)) : undefined;
          const presenterMaleVoice = /\bmale\s*(presenter|creator|avatar|business presenter)|\bman\s*(presenter|creator|avatar)/.test(text) ? group.options.find((option) => /male voice/i.test(option)) : undefined;
          const explicitVoice = requestedVoiceOption(text, group.options);
          const neutralPresenterVoice = wantsHeyGenStylePresenterAd ? group.options.find((option) => /adult neutral voice/i.test(option)) : undefined;
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

function selectedSetupItems(setup: ProductionSetupState) {
  return Object.values(setup).flat().filter(Boolean);
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
  if (/720p|10 sec|10 saniye|15 sec|15 saniye|3 clips|png\/jpg/.test(item)) return Math.round(base * 1.05);
  if (/480p|5 sec|5 saniye|1 visual|dashboard delivery/.test(item)) return Math.round(base * 0.55);
  return group.multi ? Math.round(base * 1.3) : Math.round(base * 1.1);
}

function setupCreditBreakdown(type: string, setup: ProductionSetupState, plan?: StudioPlan | null, hint = "") {
  const profile = plan ? dynamicProfileForPlan(plan, hint) : profileForType(type);
  return profile.groups.map((group) => {
    const selected = setup[group.id] ?? [];
    const credits = selected.reduce((sum, option) => sum + optionCredit(option, group), 0);
    return { groupId: group.id, title: group.title, selected, credits };
  });
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
  const quality = items.find((item) => /480p|720p|1080p|2K|4K|premium/i.test(item));
  const duration = items.find((item) => /sec|min|Episode|Project based/i.test(item));
  const style = items.find((item) => /animation|cinematic|realistic|minimal|corporate|luxury|UGC|product demo|stickman|whiteboard|motion/i.test(item));
  const formats = items.filter((item) => /MP4|PNG|JPG|ZIP|README|PDF|CSV|source|dashboard|caption|subtitle|Expo/i.test(item));
  return {
    selected_quality: quality || (isProjectType(type) ? "Project based" : "1080p"),
    selected_duration: duration || (isProjectType(type) ? "Project based" : "30 sec"),
    selected_style: style || (isProjectType(type) ? "Premium modern interface" : "Crelavo production style"),
    selected_features: items.length ? items : ["Production package", "Dashboard delivery"],
    delivery_formats: formats.length ? formats.map((format) => format.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")) : (isProjectType(type) ? ["source_code", "readme", "dashboard_delivery"] : ["final_mp4", "dashboard_delivery"])
  };
}

function filterCardsForPrompt(cards: string[], hint = "") {
  const text = hint.toLowerCase();
  const noVoice = voiceDisabledByPrompt(text);
  const noSubtitles = subtitlesDisabledByPrompt(text);
  const noMusic = musicDisabledByPrompt(text);
  return cards.filter((card) => {
    const item = card.toLowerCase();
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
  if (/ecommerce|commerce|store|shop|product|checkout/.test(text)) return ["Storefront", "Product catalog", "Cart", "Checkout", "Admin product manager", "Orders dashboard", "Source ZIP", "README / setup"];
  if (plan.production_type === "image") return ["Final image", "Prompt pack", "Export specs", "Usage notes"];
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

function normalizeProductionType(prompt: string, currentType: string) {
  const raw = prompt.toLowerCase();
  const text = `${prompt} ${currentType}`.toLowerCase();
  if (isCharacterDialogueAnimationPrompt(prompt)) return "animation";
  if (/saas\s*promo|promo\s*video|commercial|ad\s*video|video\s*ad|ready-to-post\s*video|product\s*link|paste\s*(a|any)?\s*link|get\s*an\s*ad|crelavo/.test(raw)) return "video";
  if (/clip çıkar|clip cikar|kesit çıkar|kesit cikar|highlight çıkar|highlight cikar|uzun video|long video|kırp|kirp|hook extraction|best moments/.test(raw)) return "video_clipping";
  if (/drone|uydu|satellite|harita|rota|map location|flyover/.test(raw)) return "drone_video";
  if (/anime/.test(raw)) return "anime_short_film";
  if (/animasyon|animation|çizgi film|cizgi film|cartoon/.test(raw)) return "animation";
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
  if (/voice clone|ses klon|kendi ses|own voice/.test(text)) return "voice_clone";
  if (/voice|audio|narration|podcast|seslendirme|dublaj/.test(text)) return "talking_video";
  if (/image|logo|poster|visual|photo|görsel|gorsel/.test(text)) return "image";
  if (/seo|blog|content pack|document|doküman|dokuman/.test(text)) return "document_pack";
  if (/campaign|ads|marketing|social|kampanya|reklam/.test(text)) return "campaign";
  if (/movie|film|short film|kısa film|kisa film|drama/.test(raw)) return "video";
  return currentType || "video";
}


function localPlan(prompt: string): StudioPlan {
  const productionType = normalizeProductionType(prompt, "video");
  const project = isProjectType(productionType);
  const formats = project ? ["source_code", "readme", "dashboard_delivery"] : ["final_mp4", "dashboard_delivery"];
  const commerceIntent = /ecommerce|e-commerce|e commerce|e-ticaret|storefront|online store|shop|shopping|product catalog|cart|checkout|store|ürün|urun|sepet/.test(prompt.toLowerCase());
  const packageId = productionType === "website" ? (commerceIntent ? "website_ecommerce_admin" : "website_business")
    : productionType === "saas" ? "saas_admin_billing"
      : productionType === "mobile_app" ? "mobile_expo"
        : productionType === "admin_project" ? "admin_dashboard"
          : productionType === "document_pack" ? "seo_growth_pack"
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
      ? `Ready as a ${labelFor(productionType)} project with source code, README, and dashboard delivery.`
      : `Ready as a ${labelFor(productionType)} production with dashboard delivery.`
  };
}

function normalizePlan(plan: StudioPlan, prompt: string): StudioPlan {
  const productionType = normalizeProductionType(prompt, plan.production_type);
  const project = isProjectType(productionType);
  const fallback = localPlan(prompt);
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
      ? `Ready as a ${labelFor(productionType)} project with source code, README, and dashboard delivery.`
      : `Ready as a ${labelFor(productionType)} production with dashboard delivery.`
  };
}

function assistantReply(plan: StudioPlan) {
  const typeLabel = labelFor(plan.production_type);
  const project = isProjectType(plan.production_type);
  return project
    ? `I prepared your ${typeLabel} production draft. It will be delivered as a working source package with preview, README, and dashboard delivery. Press Start Production when you are ready.`
    : `I prepared your ${typeLabel} production draft. Press Start Production when you are ready.`;
}

function isStartIntent(prompt: string) {
  return /^(start|start production|go|go ahead|continue|proceed|create it|build it|launch|yes|ok|okay|confirm|başla|basla|devam|tamam|onayla|üretime geç|uretime gec|üretimi başlat|uretimi baslat)$/i.test(prompt.trim());
}

function isExplainIntent(prompt: string) {
  return /(how|what happens|next step|explain|process|workflow|nasıl|nasil|ne olacak|sonra ne|aşam|asam|süreç|surec|üretim aşaması|uretim asamasi|chat ayar)/i.test(prompt);
}

function explainProductionFlow(activePlan: StudioPlan | null) {
  const typeLabel = activePlan ? labelFor(activePlan.production_type) : "production";
  const project = activePlan ? isProjectType(activePlan.production_type) : false;
  return project
    ? `Here is the flow: describe the ${typeLabel}, Crelavo AI prepares the draft, Start Production creates the production record, then the production page opens with Prepare Package. Prepare Package generates the preview, README, source package, and dashboard delivery links.`
    : `Here is the flow: describe the ${typeLabel}, Crelavo AI prepares the draft, Start Production creates the production record, then the production page opens where the provider/package workflow can be started and tracked.`;
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

export function WorkAssistant({ initialIdea = "", initialCategory = "" }: WorkAssistantProps) {
  const storedDraft = readStoredWorkDraft();
  const restoredDraftPrompt = storedDraft?.productionPrompt || "";
  const initialPrompt = initialIdea || initialCategory || restoredDraftPrompt;
  const [input, setInput] = useState(initialIdea || initialCategory || "");
  const [productionPrompt, setProductionPrompt] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (storedDraft?.messages?.length) return storedDraft.messages;
    return initialPrompt ? [
      { id: uid(), role: "user", content: initialPrompt },
      { id: uid(), role: "assistant", content: "I prepared your production draft. Press Start Production when you are ready." }
    ] : [];
  });
  const [plan, setPlan] = useState<StudioPlan | null>(() => storedDraft?.plan ?? (initialPrompt ? localPlan(initialPrompt) : null));
  const [selectedProductionCards, setSelectedProductionCards] = useState<string[]>(() => storedDraft?.selectedProductionCards ?? filterCardsForPrompt(productionCardsFor(storedDraft?.plan ?? (initialPrompt ? localPlan(initialPrompt) : null)), initialPrompt ?? ""));
  const [productionSetup, setProductionSetup] = useState<ProductionSetupState>(() => {
    const initialPlanForSetup = storedDraft?.plan ?? (initialPrompt ? localPlan(initialPrompt) : null);
    return storedDraft?.productionSetup ?? (initialPlanForSetup ? defaultSetupFor(initialPlanForSetup.production_type, initialPrompt, initialPlanForSetup) : {});
  });
  const [conversationId, setConversationId] = useState("");
  const [planning, setPlanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [materials, setMaterials] = useState<UserUploadedMaterial[]>([]);
  const [heygenAgentArtifacts, setHeygenAgentArtifacts] = useState<HeyGenAgentArtifact[]>([]);
  const [heygenAgentSessionId, setHeygenAgentSessionId] = useState("");
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
    writeStoredWorkDraft({ input: "", productionPrompt, plan, selectedProductionCards, productionSetup, messages, status, updatedAt: Date.now() });
  }, [productionPrompt, plan, selectedProductionCards, productionSetup, messages, status]);

  const setupProfile = plan ? dynamicProfileForPlan(plan, productionPrompt || input) : null;
  const setupItems = useMemo(() => selectedSetupItems(productionSetup), [productionSetup]);
const setupBreakdown = plan ? setupCreditBreakdown(plan.production_type, productionSetup, plan, productionPrompt || input) : [];
const setupCredits = setupBreakdown.reduce((total, item) => total + item.credits, 0);
const cardCredits = productionCardCredits(selectedProductionCards);
const draftBaseCredits = baseDraftCredits(plan);
const totalEstimatedCredits = draftBaseCredits + setupCredits + cardCredits;
  const estimatedCredits = totalEstimatedCredits ? totalEstimatedCredits.toLocaleString() : "Calculated on start";
  const draftPromptText = productionPrompt || input;
  const draftCardsForIntent = plan ? Array.from(new Set([...(selectedProductionCards.length ? selectedProductionCards : productionCardsFor(plan)), ...setupItems, ...(plan.selected_features || [])])) : [];
  const draftNoPeopleMotionIntent = /no\s+human\s+presenter|do\s+not\s+use\s+any\s+human|no\s*people|no\s*presenter|office\s+scene|meeting\s+room|group\s+of\s+people|background\s+people/i.test(draftPromptText)
    && /motion\s+graphics|kinetic\s+typography|animated\s+text|text\s+cards|glitch|swipe\s+transitions|dynamic\s+promotional/i.test(draftPromptText);
  const draftWantsPresenterVideo = Boolean(plan) && !draftNoPeopleMotionIntent && (draftCardsForIntent.some((item) => /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter/i.test(String(item))) || /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|anlattığı|anlattigi|sunucu|uygulamalı|uygulamali/i.test(draftPromptText));
  const draftCreative = plan && draftWantsPresenterVideo ? buildPresenterCreativeBrief({ prompt: draftPromptText, selectedOptions: draftCardsForIntent, productionSetup, title: plan.summary }) : null;
  const draftActivityLog = draftCreative ? initialPresenterActivityLog(draftCreative) : [];

  function resetSetupFor(nextPlan: StudioPlan, hint = productionPrompt || input) {
    setProductionSetup(defaultSetupFor(nextPlan.production_type, hint, nextPlan));
  }

  function toggleSetupOption(group: SetupGroup, option: string) {
    setProductionSetup((current) => {
      const selected = current[group.id] ?? [];
      if (group.multi) {
        return { ...current, [group.id]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] };
      }
      return { ...current, [group.id]: selected.includes(option) ? [] : [option] };
    });
  }

  async function askStudio(nextInput = input) {
    const clean = nextInput.trim();
    if (!clean || planning || starting) return;
    setInput("");
    setMessages((current) => [...current, { id: uid(), role: "user", content: clean }]);

    if (plan && isStartIntent(clean)) {
      setStatus("Starting production from the current draft...");
      await startProduction();
      return;
    }

    if (isExplainIntent(clean) && !/create|build|make|generate|produce|hazırla|hazirla|oluştur|olustur|yap/i.test(clean)) {
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: explainProductionFlow(plan) }]);
      setStatus(plan ? "Current draft is still ready. Press Start Production when you want to continue." : "Ask Crelavo what to create, then Start Production will open the production page.");
      return;
    }

    setPlanning(true);
    setStatus("Routing your request through Crelavo AI...");

    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      const fallback = localPlan(clean);
        setPlan(fallback);
        setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(fallback), clean));
        resetSetupFor(fallback, clean);
      setProductionPrompt(clean);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: "I prepared a draft, but you need to sign in before starting production." }]);
      setStatus(auth.message);
      setPlanning(false);
      if (auth.redirect) window.location.href = auth.redirect;
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
        language: "en",
        conversation_id: conversationId || undefined,
        messages: messages.slice(-10).map((message) => ({ role: message.role, content: message.content }))
      })
    });

    const data = await response.json().catch(() => ({} as PlanResponse));
    setPlanning(false);

    if (!response.ok || !data.plan) {
      const fallback = localPlan(clean);
        setPlan(fallback);
        setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(fallback), clean));
        resetSetupFor(fallback, clean);
      setProductionPrompt(clean);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: assistantReply(fallback) }]);
      setStatus(data.error ? `Planner fallback used: ${data.error}` : "Planner fallback used. Draft is ready.");
      if (data.redirect) window.location.href = data.redirect;
      return;
    }

    const normalized = normalizePlan(data.plan, clean);
    setConversationId(data.conversation_id ?? conversationId);
    setPlan(normalized);
    setSelectedProductionCards(filterCardsForPrompt(productionCardsFor(normalized), clean));
    resetSetupFor(normalized, clean);
    setProductionPrompt(clean);
    const presenterIntentForAgent = normalized.production_type === "video" && /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|anlattığı|anlattigi|sunucu|uygulamalı|uygulamali/i.test(clean);
    if (presenterIntentForAgent) {
      try {
        setStatus("HeyGen Video Agent is preparing the session...");
        const agentResponse = await fetch("/api/heygen-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userMessage: clean, orientation: "portrait" }) });
        const agentData = await agentResponse.json().catch(() => ({}));
        if (agentResponse.ok) {
          setHeygenAgentSessionId(String(agentData.sessionId ?? ""));
          setHeygenAgentArtifacts(Array.isArray(agentData.artifacts) ? agentData.artifacts : []);
          setMessages((current) => [...current, { id: uid(), role: "assistant", content: agentData.reply ? String(agentData.reply) : assistantReply(normalized) }]);
          setStatus("HeyGen Video Agent session ready. Press Start Production to continue.");
          return;
        }
        setStatus(agentData.error ? `HeyGen Agent fallback: ${agentData.error}` : "HeyGen Agent fallback used. Draft is ready.");
      } catch {
        setStatus("HeyGen Agent fallback used. Draft is ready.");
      }
    }
    setMessages((current) => [...current, { id: uid(), role: "assistant", content: assistantReply(normalized) }]);
    setStatus("Draft ready. Press Start Production to continue.");
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
        : chip === "SaaS" ? "Create a SaaS web app with auth, dashboard, billing-ready structure, and source delivery."
          : chip === "Admin Panel" ? "Create an admin panel with role-based dashboard, user management, and source delivery."
            : chip === "SEO Pack" ? "Create an SEO and content growth package."
              : `Create a ${chip.toLowerCase()} production.`;
    setInput(prompt);
    setStatus(`${chip} prompt loaded. Press Enter or Send.`);
  }

  async function uploadMaterial(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("Uploading material...");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setUploading(false);
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
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!response.ok || !data.material) {
      setStatus(data.error ?? "Material upload failed.");
      return;
    }
    setMaterials((current) => [...current, data.material as UserUploadedMaterial]);
    setStatus("Material attached to this production draft.");
  }

  async function startProduction() {
    const clean = (productionPrompt || input).trim();
    const activePlan = plan ? normalizePlan(plan, clean) : clean ? localPlan(clean) : null;
    if (!clean || !activePlan) {
      setStatus("Describe what you want to create first.");
      return;
    }
    setStarting(true);
    setStatus("Creating production record...");
    const auth = await requireVerifiedBrowserUser();
    if (!auth.ok) {
      setStarting(false);
      setStatus(auth.message);
      if (auth.redirect) window.location.href = auth.redirect;
      return;
    }

    const project = isProjectType(activePlan.production_type);
    const productionCards = filterCardsForPrompt(selectedProductionCards.length ? selectedProductionCards : productionCardsFor(activePlan), clean);
    const sanitizedSetup = defaultSetupFor(activePlan.production_type, clean, activePlan);
    const setupForPayload = { ...productionSetup, voice: sanitizedSetup.voice ?? productionSetup.voice, subtitles: sanitizedSetup.subtitles ?? productionSetup.subtitles };
const setupFields = setupDerivedFields(activePlan.production_type, setupForPayload);
const setupItemsForPayload = selectedSetupItems(setupForPayload);
const selectedItemsForIntent = Array.from(new Set([...productionCards, ...setupItemsForPayload, ...(activePlan.selected_features || [])]));
const outputIntent = productionOutputIntent(activePlan.production_type, selectedItemsForIntent);
const sourceHandling = productionSourceHandling(activePlan.production_type, selectedItemsForIntent);
const setupCreditsForPayload = setupExtraCredits(activePlan.production_type, setupForPayload, activePlan, clean);
const cardCreditsForPayload = productionCardCredits(productionCards);
const totalEstimatedCreditsForPayload = baseDraftCredits(activePlan) + setupCreditsForPayload + cardCreditsForPayload;
const noPeopleMotionIntent = /no\s+human\s+presenter|do\s+not\s+use\s+any\s+human|no\s*people|no\s*presenter|avatars?|office\s+scene|meeting\s+room|group\s+of\s+people|background\s+people/i.test(clean)
  && /motion\s+graphics|kinetic\s+typography|animated\s+text|text\s+cards|glitch|swipe\s+transitions|dynamic\s+promotional/i.test(clean);
const wantsPresenterVideo = !noPeopleMotionIntent && (selectedItemsForIntent.some((item) => /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter/i.test(String(item))) || /with presenter|ai presenter|sales avatar|talking avatar|talking head|presenter|hareketli\s+bir\s+kişi|hareketli\s+bir\s+kisi|kişi\s+anlat|kisi\s+anlat|anlattığı|anlattigi|sunucu|uygulamalı|uygulamali/i.test(clean));
const productionTypeForPayload = wantsPresenterVideo && activePlan.production_type === "video" ? "talking_video" : activePlan.production_type;
const presenterCreative = wantsPresenterVideo ? buildPresenterCreativeBrief({ prompt: clean, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, title: activePlan.summary }) : null;
const providerPrompt = presenterCreative?.providerPrompt ?? clean;
const creativeActivityLog = presenterCreative ? initialPresenterActivityLog(presenterCreative) : [];
const mergedFeatures = Array.from(new Set([...(activePlan.selected_features || []), ...setupFields.selected_features, ...(wantsPresenterVideo ? ["AI presenter", "HeyGen talking avatar", "Creative director prompt", presenterCreative?.preset ?? "Creator-style SaaS presenter"] : []), ...(noPeopleMotionIntent ? ["No presenter", "Motion graphics", "No office", "No people"] : [])]));
    const formats = setupFields.delivery_formats.length
      ? setupFields.delivery_formats
      : activePlan.delivery_requirements?.formats?.length
        ? activePlan.delivery_requirements.formats
        : project
          ? ["source_code", "readme", "dashboard_delivery"]
          : ["final_mp4", "dashboard_delivery"];

    const response = await fetch("/api/productions", {
      method: "POST",
      headers: authHeaders(auth.accessToken),
      body: JSON.stringify({
        user_id: auth.user.id,
        user_email: auth.user.email ?? "",
        title: `${labelFor(productionTypeForPayload)} production`,
        prompt: clean,
        production_type: productionTypeForPayload,
        package_id: activePlan.package_id,
        quality: setupFields.selected_quality || activePlan.selected_quality,
        selected_quality: setupFields.selected_quality || activePlan.selected_quality,
        output_duration_seconds: Number(setupFields.selected_duration?.replace(/\D/g, "")) || Number(activePlan.selected_duration?.replace(/\D/g, "")) || (project ? 0 : 30),
        output_count: outputIntent.outputCount,
        requested_clip_count: outputIntent.requestedClipCount,
        requested_alternative_count: outputIntent.requestedAlternativeCount,
        features: mergedFeatures.join(", "),
project_details: [setupFields.selected_style || activePlan.selected_style, activePlan.selected_modules.join(", "), setupItemsForPayload.length ? `Production setup: ${setupItemsForPayload.join(", ")}` : "", activePlan.summary].filter(Boolean).join("\n"),
  estimated_credits: totalEstimatedCreditsForPayload,
        delivery_level: project ? "working_source_package" : "production_package",
        delivery_requirements: { requested: true, status: "pending", formats },
        request_metadata: { source: "omnichannel_studio", workPage: true, plan: { ...activePlan, production_type: productionTypeForPayload }, originalPlan: activePlan, routedFromProductionType: activePlan.production_type, presenterMode: wantsPresenterVideo, noPeopleMotionIntent, preferredProvider: wantsPresenterVideo ? "heygen_video_agent" : noPeopleMotionIntent ? "motion_graphics_video" : undefined, heygenAgentBridge: wantsPresenterVideo ? { mode: "native_session_artifacts", agentEndpoint: "/api/heygen-agent", status: "pending_session_start", artifactField: "heygenAgentArtifacts" } : undefined, providerPrompt, creativeBrief: presenterCreative?.creativeBrief, creativePreset: presenterCreative?.preset, creativeTags: presenterCreative?.tags, creativeActivityLog, productionCards, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, outputIntent, sourceHandling, uniqueOutputsRequired: outputIntent.uniqueOutputsRequired, duplicatePolicy: outputIntent.duplicatePolicy, timestampPolicy: outputIntent.timestampPolicy, draftBaseCredits: baseDraftCredits(activePlan), cardCredits: cardCreditsForPayload, setupExtraCredits: setupCreditsForPayload, totalEstimatedCredits: totalEstimatedCreditsForPayload, uploadedMaterials: materials },
        input_json: { work_prompt: clean, providerPrompt, creativeBrief: presenterCreative?.creativeBrief, creativePreset: presenterCreative?.preset, creativeTags: presenterCreative?.tags, creativeActivityLog, plan: { ...activePlan, production_type: productionTypeForPayload }, originalPlan: activePlan, routedFromProductionType: activePlan.production_type, presenterMode: wantsPresenterVideo, noPeopleMotionIntent, preferredProvider: wantsPresenterVideo ? "heygen_video_agent" : noPeopleMotionIntent ? "motion_graphics_video" : undefined, heygenAgentBridge: wantsPresenterVideo ? { mode: "native_session_artifacts", agentEndpoint: "/api/heygen-agent", status: "pending_session_start", artifactField: "heygenAgentArtifacts" } : undefined, productionCards, selectedOptions: selectedItemsForIntent, productionSetup: setupForPayload, outputIntent, sourceHandling, uniqueOutputsRequired: outputIntent.uniqueOutputsRequired, duplicatePolicy: outputIntent.duplicatePolicy, timestampPolicy: outputIntent.timestampPolicy, draftBaseCredits: baseDraftCredits(activePlan), cardCredits: cardCreditsForPayload, setupExtraCredits: setupCreditsForPayload, totalEstimatedCredits: totalEstimatedCreditsForPayload, uploadedMaterials: materials },
        uploaded_materials: materials,
        legal_acceptance: true
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStarting(false);
      const isCreditError = response.status === 402 || data.redirect === "/dashboard/credits" || /not enough credits|credits required/i.test(String(data.error ?? ""));
      if (isCreditError) {
        const required = Number(data.required ?? data.requiredCredits ?? totalEstimatedCreditsForPayload) || totalEstimatedCreditsForPayload;
        const available = Number(data.available ?? 0) || 0;
        const shortfall = Number(data.shortfall ?? Math.max(0, required - available)) || 0;
        setStatus(`Insufficient credits. Required: ${required.toLocaleString()} credits, available: ${available.toLocaleString()} credits, missing: ${shortfall.toLocaleString()} credits. Open Credits when you want to top up; this draft stays here.`);
        return;
      }
      setStatus(data.error ?? "Production could not be created.");
      return;
    }
    const productionId = data.production?.id ?? data.production_id;
    if (productionId) {
      setStatus("Production record created. Starting automation...");
      const automationResponse = await fetch("/api/automation/start", {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({ production_id: productionId, user_id: auth.user.id, legal_acceptance: true, force_start: true })
      }).catch(() => null);
      if (automationResponse && !automationResponse.ok) {
        const automationError = await automationResponse.json().catch(() => ({}));
        setStatus(automationError.error ?? "Production record was created, but automation could not start. Open the production page and use Track status or Start Production.");
      }
      if (typeof window !== "undefined") window.localStorage.removeItem(workDraftStorageKey);
      window.location.href = `/dashboard/productions/${productionId}`;
      return;
    }
    setStarting(false);
    setStatus("Production was created, but the detail page could not be opened.");
  }

  return (
    <section className="omni-studio-page">
      <div className="omni-studio-shell">
        <header className="omni-studio-header">
          <div>
            <span className="badge"><Sparkles size={14} /> Omnichannel Studio</span>
            <h1>Ask AI to build anything</h1>
            <p>One workspace for videos, websites, apps, voices, images, SEO packs, campaigns, and source packages.</p>
          </div>
          <div className="omni-live-pill"><span /> AI router online</div>
        </header>

        <div className="omni-chip-row">
          {studioChips.map((chip) => <button type="button" key={chip} onClick={() => useChip(chip)}>{chip}</button>)}
        </div>

        <section className="omni-heygen-embed" style={{ width: "min(920px, 100%)", margin: "0 auto 18px", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(96,165,250,.22)", background: "rgba(15,23,42,.72)", boxShadow: "0 24px 70px rgba(2,6,23,.28)" }}>
          <iframe width="560" height="315" src="https://app.heygen.com/embeds/a8cf141046bf4947a695a38303dde3f8" title="Check out a new AI Video I just made!" frameBorder="0" allow="encrypted-media; fullscreen;" allowFullScreen style={{ width: "100%", aspectRatio: "16 / 9", height: "auto", display: "block" }} />
        </section>

        <div className="omni-agent-workbench">
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

          {plan ? (
            <article className="omni-result-card">
              <div className="omni-result-icon">{isProjectType(plan.production_type) ? <Code2 size={22} /> : plan.production_type === "video" ? <Video size={22} /> : <PackageCheck size={22} />}</div>
              <div className="omni-result-body">
                <span className="badge">Production draft</span>
                <h3>{labelFor(plan.production_type)}</h3>
                <p>{plan.summary || assistantReply(plan)}</p>
                <div className="omni-result-grid">
                  <span><strong>Package</strong>{plan.package_id}</span>
                  <span><strong>Delivery</strong>{(plan.delivery_requirements?.formats ?? ["dashboard_delivery"]).filter((format) => !(subtitlesDisabledByPrompt((productionPrompt || input).toLowerCase()) && /subtitle|caption|altyaz/i.test(format))).join(", ") || "dashboard_delivery"}</span>
                  <span><strong>Credits</strong>{estimatedCredits}</span>
                </div>
                <div className="omni-production-cards">
                  <strong>Choose what will be produced</strong>
                  <div>{filterCardsForPrompt(productionCardsFor(plan), productionPrompt || input).map((item) => {
                    const active = selectedProductionCards.includes(item);
                    return <button type="button" className={active ? "active" : ""} key={item} onClick={() => setSelectedProductionCards((current) => current.includes(item) ? current.filter((card) => card !== item) : [...current, item])}>{item}</button>;
                  })}</div>
                </div>
                {setupProfile ? (
                  <div className="omni-setup-panel">
                    <div className="omni-setup-head">
                      <strong>{setupProfile.title}</strong>
                      <small>{setupProfile.note}</small>
                    </div>
                    {setupProfile.groups.map((group) => (
                      <section className="omni-setup-group" key={group.id}>
                        <div className="omni-setup-group-title">
                          <span>{group.title}</span>
                          <small>{group.multi ? "Multiple" : "Single"}{group.credit ? ` · +${group.credit.toLocaleString()} credits each` : ""}</small>
                        </div>
                        <div className="omni-setup-options">
                          {group.options.map((option) => {
                            const active = (productionSetup[group.id] ?? []).includes(option);
                            const credit = optionCredit(option, group);
                            return <button type="button" className={active ? "active" : ""} key={`${group.id}-${option}`} onClick={() => toggleSetupOption(group, option)}>{option}{credit ? ` +${credit.toLocaleString()}` : ""}</button>;
                          })}
                        </div>
                      </section>
                    ))}
                    <div className="omni-setup-summary">
                      <strong>Selected setup</strong>
                      <p>{setupItems.length ? setupItems.join(" · ") : "No extra setup selected yet."}</p>
                      <p>{setupBreakdown.filter((item) => item.credits > 0).map((item) => `${item.title}: +${item.credits.toLocaleString()}`).join(" · ")}</p>
                      <span>Base: {draftBaseCredits.toLocaleString()} · Main cards: +{cardCredits.toLocaleString()} · Setup credits: +{setupCredits.toLocaleString()} · Total: {estimatedCredits}</span>
                    </div>
                  </div>
                ) : null}
                {materials.length ? <div className="omni-material-list">{materials.map((material) => <span key={material.file_url}>{material.title}</span>)}</div> : null}
              </div>
              <button className="omni-start-button" type="button" onClick={startProduction} disabled={starting || planning}>{starting ? "Creating..." : "Start Production"}</button>
            </article>
          ) : null}
        </main>

        </div>

        {status ? <p className="omni-status-line">{status}</p> : null}

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
