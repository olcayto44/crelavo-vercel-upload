"use client";


import { AppWindow, AudioWaveform, Bot, Clapperboard, FileText, Globe2, Image, LayoutDashboard, Megaphone, MonitorSmartphone, Music2, Palette, Pencil, Radio, ScrollText, Scissors, Sparkles, UsersRound, UserRound, Video, Wand2 } from "lucide-react";
import { HardReloadLink } from "@/components/HardReloadLink";

import { productionPackages, productionTypes, type ProductionPackage } from "@/lib/production";

const icons = {
  campaign: Megaphone,
  ai_agent: Bot,
  localization: Globe2,
  ad_score_checker: Megaphone,
  virtual_model_studio: Image,
  cultural_localization: Globe2,
  campaign_calendar: Sparkles,
  crelavo_academy: FileText,
  community_showcase: UsersRound,
  video: Video,
  talking_video: UsersRound,
  documentary: ScrollText,
  animation: Wand2,
  anime_short_film: Clapperboard,
  animal_video: Video,
  nature_video: Globe2,
  planet_space_video: Sparkles,
  drone_video: Globe2,
  live_sales_agent: Radio,
  studio: Clapperboard,
  drama: Clapperboard,
  cinematic_video: Sparkles,
  video_clipping: Scissors,
  avatar: UserRound,
  lip_sync: AudioWaveform,
  voice_clone: AudioWaveform,
  visual_clone: Wand2,
  video_tools: Video,
  stickman_animation: Pencil,
  music_video: Music2,
  website: MonitorSmartphone,
  saas: LayoutDashboard,
  mobile_app: AppWindow,
  image: Image,
  brand_kit: Palette,
  document_pack: FileText,
  admin_project: LayoutDashboard
};

const categoryOptions: Record<string, string[]> = {
  campaign: ["Shopify product link", "Amazon product link", "Trendyol product link", "Product link ad", "Store/social publish"],
  ai_agent: ["AI influencer", "Daily social manager", "Trend monitor", "Voice/personality", "Approval flow"],
  localization: ["Language adaptation", "Cultural rewrite", "Voice direction", "Subtitle notes", "Country variants"],
  ad_score_checker: ["Basic ad score", "Detailed score report", "3 improved ad angles", "Hook rewrite", "Video-ready brief"],
  virtual_model_studio: ["1 virtual model visual", "4 image pack", "Catalog visuals", "Fashion model", "Jewelry / beauty visual"],
  cultural_localization: ["Country brief", "Localized hooks", "Localized script", "CTA adaptation", "Video brief"],
  campaign_calendar: ["Seasonal brief", "Product launch checklist", "Hook calendar", "Script pack", "Asset plan"],
  crelavo_academy: ["Free lesson path", "Premium templates", "Done-with-you brief", "UGC lesson", "Product video workflow"],
  community_showcase: ["Use similar style", "Template reuse", "AI ad example", "UGC example", "Product video proof"],
  video: ["Prompt-to-video", "Link-to-video", "Voice-to-video", "Photo/avatar input", "Choose character", "Create character", "Own voice-over", "Choose AI voice", "Create AI voice", "Background music", "Emotion-matched music", "Drone-style aerial video"],
  talking_video: ["Self-in-video", "Photo/avatar input", "Choose character", "Create character", "2/3/4/5+ people", "7-8 person panel", "Own voice-over", "Choose AI voice", "Create AI voice", "Separate voices", "Regional clothing", "Dialect voice"],
  documentary: ["Topic research", "Narration outline", "Interview map", "Archival visuals", "Documentary music", "Own voice-over", "Choose AI voice"],
  animation: ["2D animation", "2.5D animation", "3D animation", "Character animation", "Photo/avatar input", "Choose character", "Create character", "Animation music", "Own voice-over", "Choose AI voice", "Child voices"],
  anime_short_film: ["Anime style", "Character setup", "Photo/avatar input", "Choose character", "Create character", "Dialogue", "Action scene", "Anime music", "Own voice-over", "Choose AI voice", "Child voices", "User materials"],
  animal_video: ["Funny animal", "Exciting animal", "Cinematic", "Animated", "3D style", "Own voice-over", "User music"],
  nature_video: ["Wildlife", "Landscape", "Weather", "Documentary", "Cinematic music", "Narration", "User materials"],
  planet_space_video: ["Planet explainer", "Galaxy scene", "3D space", "Cosmic music", "Narration", "Subtitles", "User materials"],
  drone_video: ["Map/location prompt", "Satellite-view intro", "Marked area notes", "Drone flyover", "Route/path plan", "Voice-over", "Subtitles", "Background music"],
  live_sales_agent: ["10/40/120 fair-use live hours", "Product link selling", "Live chat replies", "Avatar persona", "30 languages", "CTA/discount playbook", "OBS/provider readiness", "No included credits"],
  studio: ["Script", "Scene plan", "Character breakdown", "Trailer", "Teaser", "Direct final video", "Series bible", "Shot list"],
  drama: ["One-prompt drama", "Short series", "Viral short film", "Episode arc", "Character roles", "Dialogue", "Voice-over", "Reels/TikTok cuts"],
  cinematic_video: ["Luxury video", "Trailer look", "Drama scene", "Cinematic camera", "Music/voice", "Premium output"],
  video_clipping: ["Long video to Shorts", "Exciting moments", "Scary moments", "Funny scenes", "Hook extraction", "Subtitles"],
  avatar: ["Avatar design", "Custom avatar", "Brand persona", "Talking avatar", "Avatar video", "Social avatar"],
  lip_sync: ["Audio to lip-sync", "Avatar speaking", "Dialogue sync", "Face video", "Multilingual dub", "Final MP4"],
  voice_clone: ["Voice reference", "Clean vocal", "Clone-style narration", "Multilingual voice", "Brand voice", "Usage rules"],
  visual_clone: ["Reference style", "Character look", "Product look", "Visual clone", "Style transfer", "New variations"],
  video_tools: ["Video extend", "Motion control", "Watermark-free final", "Crelavo preview watermark", "Owned-content cleanup", "Image-to-video", "Link-to-video", "Script-to-video"],
  stickman_animation: ["Explainer", "Comedy skit", "Education", "Storyboard", "Social short", "Choose character", "Create character", "Own voice-over", "Choose AI voice"],
  music_video: ["Lyric video", "Visualizer", "Performance clip", "Teaser", "Social MV", "Photo/avatar input", "Choose character", "Create character", "Own voice-over", "Choose AI voice", "Create AI voice"],
  website: ["Landing page", "Business site", "E-commerce storefront", "Admin screens", "Source ZIP + README"],
  saas: ["Dashboard", "Auth", "Billing", "Admin", "Source ZIP + README"],
  mobile_app: ["iOS/Android UI", "Expo starter", "Navigation", "Core screens", "Admin pair"],
  image: ["Hero image", "Product mockup", "Social visual", "App screen", "Asset pack"],
  brand_kit: ["Logo", "Palette", "Typography", "Social kit", "Usage rules"],
  document_pack: ["Pitch deck", "Proposal", "Catalog", "PDF", "ZIP package"],
  admin_project: ["CRUD", "Roles", "Database", "Dashboard", "Setup guide"]
};

const categoryGroups = [
  {
    id: "build",
    title: "Build",
    description: "Create a website, SaaS product, mobile app, ecommerce experience or admin panel.",
    typeIds: ["website", "saas", "mobile_app", "admin_project"]
  },
  {
    id: "create-media",
    title: "Create Media",
    description: "Create videos, product ads, talking videos, animation, music videos and cinematic content.",
    typeIds: ["video", "talking_video", "documentary", "animation", "music_video", "drama", "cinematic_video", "video_clipping", "video_tools"]
  },
  {
    id: "marketing-growth",
    title: "Marketing & Growth",
    description: "Create campaigns, product-link ads, social media systems, localization and performance analysis.",
    typeIds: ["campaign", "ad_score_checker", "campaign_calendar", "ai_agent", "localization", "cultural_localization", "live_sales_agent"]
  },
  {
    id: "avatars-voice",
    title: "Avatars & Voice",
    description: "Create avatars, lip-sync productions, cloned voices and reference-based visual variations.",
    typeIds: ["avatar", "lip_sync", "voice_clone", "visual_clone"]
  },
  {
    id: "brand-files",
    title: "Brand & Files",
    description: "Create images, brand kits, pitch decks, PDFs and reusable source packages.",
    typeIds: ["image", "brand_kit", "document_pack"]
  },
  {
    id: "special-video",
    title: "Special Video",
    description: "Create anime, animal, nature, space, drone, stickman and studio productions.",
    typeIds: ["anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "stickman_animation", "studio"]
  }
];

function renderCategoryCard(typeId: string, packageCatalog: ProductionPackage[]) {
  const type = productionTypes.find((item) => item.id === typeId);
  if (!type) return null;

  const Icon = icons[type.id];
  const configuredPackages = packageCatalog.filter((item) => item.productionType === type.id);
  const fallbackPackages = productionPackages.filter((item) => item.productionType === type.id);
  const packages = configuredPackages.length ? configuredPackages : fallbackPackages;

  return (
      <div className={`card production-pricing-card production-tone-${type.id}`} key={type.id}>
        <HardReloadLink className={`category-card-visual category-visual-${type.id}`} href={`/dashboard/create?type=${encodeURIComponent(type.label)}&category=${encodeURIComponent(type.id)}`} aria-label={`Start ${type.label} production from category visual`}>
          <div className="category-visual-orb category-visual-orb-one" aria-hidden="true" />
          <div className="category-visual-orb category-visual-orb-two" aria-hidden="true" />
          <div className="category-visual-panel category-visual-panel-main">
            <Icon size={34} color="currentColor" />
            <strong>{type.label}</strong>
            <small>{type.startingCredits > 0 ? `${type.startingCredits.toLocaleString()}+ credits` : "Service path"}</small>
          </div>
          <div className="category-visual-strip" aria-hidden="true">
            {(categoryOptions[type.id] ?? []).slice(0, 3).map((option) => <span key={`${type.id}-visual-${option}`}>{option}</span>)}
          </div>
        </HardReloadLink>
        <Icon color="currentColor" />
      <span className="badge">{type.startingCredits > 0 ? `From ${type.startingCredits.toLocaleString()} credits` : "Service plan pricing"}</span>
      <h3>{type.label}</h3>
      <p>{type.description}</p>
      <div className="category-option-row">
        {(categoryOptions[type.id] ?? []).map((option) => <small key={option}>{option}</small>)}
      </div>
      <div className="production-package-list">
        {packages.map((item) => (
          <div key={item.id}>
            <strong>{item.name}</strong>
                    <span>{item.credits > 0 ? `${item.credits.toLocaleString()} credits` : "No included credits"}</span>
          </div>
        ))}
      </div>
      <div className="clc-btn-row">
        <HardReloadLink className="btn" href={type.id === "live_sales_agent" ? "/live-sales-credits" : `/dashboard/create?type=${encodeURIComponent(type.label)}&category=${encodeURIComponent(type.id)}`}>Start production</HardReloadLink>
        {type.id === "ad_score_checker" ? <HardReloadLink className="btn secondary" href="/free-tools/ad-performance-score-checker">Free score tool</HardReloadLink> : null}
        {type.id === "live_sales_agent" ? <HardReloadLink className="btn secondary" href={`/dashboard/create?type=${encodeURIComponent(type.label)}&category=${encodeURIComponent(type.id)}`}>Open workspace</HardReloadLink> : null}
      </div>
    </div>
  );
}

export function CategoryGroupBrowser() {
  return (
    <section className="category-browser">
      <div className="category-group-head main-category-head">
        <span className="badge">Main categories</span>
        <h2>All Crelavo production categories</h2>
        <p>Jump to a group. Every production type is listed below — nothing is hidden behind tabs.</p>
      </div>
      <div className="category-tab-grid">
        {categoryGroups.map((group) => (
          <HardReloadLink className={`category-tab-card category-tone-${group.id}`} href={`#clc-${group.id}`} key={group.id}>
            <span>{group.typeIds.length} categories</span>
            <strong>{group.title}</strong>
            <small>{group.description}</small>
          </HardReloadLink>
        ))}
      </div>
      {categoryGroups.map((group) => (
        <section className="category-group-section" id={`clc-${group.id}`} key={group.id}>
          <div className="category-group-head">
            <span className="badge">Production group</span>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <div className="production-pricing-grid compact-category-grid">
            {group.typeIds.map((typeId) => renderCategoryCard(typeId, productionPackages))}
          </div>
        </section>
      ))}
    </section>
  );
}