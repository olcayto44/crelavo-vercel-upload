"use client";

import { useEffect, useState } from "react";
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
    id: "new-feature-tools",
    title: "New Feature Tools",
    description: "Ad scoring, virtual models, cultural localization, campaign calendar, Academy and showcase request paths.",
    typeIds: ["ad_score_checker", "virtual_model_studio", "cultural_localization", "campaign_calendar", "crelavo_academy", "community_showcase"]
  },
  {
    id: "marketing",
    title: "Marketing & Commerce",
    description: "Product links, campaigns, localization and AI agents for growth workflows.",
    typeIds: ["campaign", "ai_agent", "localization"]
  },
  {
    id: "video-motion",
    title: "Video & Motion",
    description: "AI video, AI live sales agents, drama, short series, drone/satellite, animation, cinematic work, clipping, music videos and video tools.",
    typeIds: ["video", "talking_video", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "stickman_animation", "music_video", "studio", "drama", "cinematic_video", "video_clipping", "video_tools"]
  },
  {
    id: "avatar-cloning",
    title: "Avatar & Cloning",
    description: "Custom avatars, talking videos, lip-sync, voice cloning and visual/style cloning.",
    typeIds: ["avatar", "lip_sync", "voice_clone", "visual_clone"]
  },
  {
    id: "web-app-software",
    title: "Web, App & Software",
    description: "Websites, SaaS products, mobile apps and admin panel projects with source delivery.",
    typeIds: ["website", "saas", "mobile_app", "admin_project"]
  },
  {
    id: "brand-files",
    title: "Brand, Visuals & Files",
    description: "Images, brand kits, pitch decks, PDFs and reusable file packages.",
    typeIds: ["image", "brand_kit", "document_pack"]
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
      <div className="sample-video-preview sample-video-preview-cinematic" aria-label={`${type.label} preview`}>
        <div className="sample-card-video sample-card-static-fallback" aria-hidden="true" />
        <small>{type.label}</small>
        <strong>Preview</strong>
      </div>
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
      <HardReloadLink className="btn" href="/dashboard/credits">Create package</HardReloadLink>
    </div>
  );
}

export function CategoryGroupBrowser() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [packageCatalog, setPackageCatalog] = useState<ProductionPackage[]>(productionPackages);
  const selectedGroup = categoryGroups.find((group) => group.id === selectedGroupId);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/packages")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.config?.productionPackages) && data.config.productionPackages.length) setPackageCatalog(data.config.productionPackages);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="category-browser">
      <div className="category-tab-grid">
        {categoryGroups.map((group) => {
          const isActive = selectedGroupId === group.id;
          return (
            <button className={`category-tab-card category-tone-${group.id}${isActive ? " active" : ""}`} key={group.id} type="button" onClick={() => setSelectedGroupId(isActive ? null : group.id)}>
              <span>{group.typeIds.length} categories</span>
              <strong>{group.title}</strong>
              <small>{group.description}</small>
            </button>
          );
        })}
      </div>

      {!selectedGroup ? (
        <div className="category-empty-state">
          <span className="badge">Choose a production group</span>
          <h2>Select a heading above to view its categories</h2>
          <p>The page starts simple: choose the closest production group, then only the matching categories appear below.</p>
        </div>
      ) : (
        <section className="category-group-section">
          <div className="category-group-head">
            <span className="badge">Selected production group</span>
            <h2>{selectedGroup.title}</h2>
            <p>{selectedGroup.description}</p>
          </div>
          <div className="production-pricing-grid">
            {selectedGroup.typeIds.map((typeId) => renderCategoryCard(typeId, packageCatalog))}
          </div>
        </section>
      )}

      <section className="category-group-section all-category-section">
        <div className="category-group-head">
          <span className="badge">General catalog</span>
          <h2>All Production Categories</h2>
          <p>Browse every Crelavo production category in one place, including campaigns, video, avatars, websites, visuals, documents and admin projects.</p>
        </div>
        <div className="production-pricing-grid">
          {productionTypes.map((type) => renderCategoryCard(type.id, packageCatalog))}
        </div>
      </section>
    </section>
  );
}
