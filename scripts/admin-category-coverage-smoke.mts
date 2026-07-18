import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { productionTypes } from "../src/lib/production.ts";

const admin = readFileSync(join(process.cwd(), "src", "lib", "admin.ts"), "utf8");
const typePage = readFileSync(join(process.cwd(), "src", "components", "AdminProductionTypePage.tsx"), "utf8");

const adminRoutesByType: Record<string, { href: string; sectionKey: string }> = {
  campaign: { href: "/admin/campaign", sectionKey: "campaign" },
  ai_agent: { href: "/admin/agents", sectionKey: "agents" },
  localization: { href: "/admin/localization", sectionKey: "localization" },
  video: { href: "/admin/video", sectionKey: "video" },
  talking_video: { href: "/admin/talking-video", sectionKey: "talkingVideo" },
  documentary: { href: "/admin/documentary", sectionKey: "documentary" },
  animation: { href: "/admin/animation", sectionKey: "animation" },
  anime_short_film: { href: "/admin/anime-short-film", sectionKey: "animeShortFilm" },
  animal_video: { href: "/admin/animal-video", sectionKey: "animalVideo" },
  nature_video: { href: "/admin/nature-video", sectionKey: "natureVideo" },
  planet_space_video: { href: "/admin/planet-space-video", sectionKey: "planetSpaceVideo" },
  drone_video: { href: "/admin/drone-video", sectionKey: "droneVideo" },
  live_sales_agent: { href: "/admin/live-sales-agent", sectionKey: "liveSalesAgent" },
  stickman_animation: { href: "/admin/stickman-animation", sectionKey: "stickmanAnimation" },
  music_video: { href: "/admin/music-video", sectionKey: "musicVideo" },
  studio: { href: "/admin/studio", sectionKey: "studio" },
  drama: { href: "/admin/drama", sectionKey: "drama" },
  cinematic_video: { href: "/admin/cinematic-video", sectionKey: "cinematicVideo" },
  video_clipping: { href: "/admin/video-clipping", sectionKey: "videoClipping" },
  avatar: { href: "/admin/avatar", sectionKey: "avatar" },
  lip_sync: { href: "/admin/lip-sync", sectionKey: "lipSync" },
  voice_clone: { href: "/admin/voice-clone", sectionKey: "voiceClone" },
  visual_clone: { href: "/admin/visual-clone", sectionKey: "visualClone" },
  video_tools: { href: "/admin/video-tools", sectionKey: "videoTools" },
  website: { href: "/admin/website", sectionKey: "website" },
  saas: { href: "/admin/saas", sectionKey: "saas" },
  mobile_app: { href: "/admin/mobile", sectionKey: "mobile" },
  image: { href: "/admin/image", sectionKey: "image" },
  brand_kit: { href: "/admin/brand-kit", sectionKey: "brand" },
  document_pack: { href: "/admin/documents", sectionKey: "documents" },
  admin_project: { href: "/admin/admin-projects", sectionKey: "adminProjects" }
};

for (const type of productionTypes) {
  const route = adminRoutesByType[type.id];
  if (!route) throw new Error(`No admin route mapping for production type: ${type.id}`);
  if (!admin.includes(`href: "${route.href}"`)) throw new Error(`Admin menu missing href ${route.href}`);
  if (!admin.includes(`${route.sectionKey}: {`)) throw new Error(`Admin production section missing ${route.sectionKey}`);
  if (!existsSync(join(process.cwd(), "src", "app", ...route.href.replace(/^\//, "").split("/"), "page.tsx"))) {
    throw new Error(`Admin page file missing for ${route.href}`);
  }
}

for (const mapping of [
  "documentary: \"documentary\"",
  "animeShortFilm: \"anime_short_film\"",
  "animalVideo: \"animal_video\"",
  "natureVideo: \"nature_video\"",
  "planetSpaceVideo: \"planet_space_video\"",
  "droneVideo: \"drone_video\"",
  "liveSalesAgent: \"live_sales_agent\"",
  "drama: \"drama\"",
  "cinematicVideo: \"cinematic_video\"",
  "videoClipping: \"video_clipping\"",
  "lipSync: \"lip_sync\"",
  "voiceClone: \"voice_clone\"",
  "visualClone: \"visual_clone\"",
  "videoTools: \"video_tools\"",
  "talkingVideo: \"talking_video\""
]) {
  if (!typePage.includes(mapping)) throw new Error(`Admin production filter mapping missing: ${mapping}`);
}

console.log("admin-category-coverage-smoke ok");
