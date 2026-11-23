import { buildProviderPreflight } from "../automation-preflight";
import { hasProviderEnv } from "../providers/env";
export type LegacyRoute = { version: 1; provider: string; kind: "image" | "video" | "audio" };
export const LEGACY_IMAGE_CATEGORIES = new Set(["image", "brand_kit", "visual_clone", "virtual_model_studio"]);
export const LEGACY_VIDEO_CATEGORIES = new Set(["video","documentary","animation","music_video","drama","cinematic_video","video_tools","campaign","cultural_localization","anime_short_film","animal_video","nature_video","planet_space_video","drone_video","stickman_animation","studio"]);
const avatarCategories = new Set(["talking_video","avatar","lip_sync","live_sales_agent","ai_agent","localization"]);
export function resolveLegacyRoute(category: string, input: {packId?:string; extras?:Record<string,string>}): LegacyRoute | undefined {
  if (LEGACY_IMAGE_CATEGORIES.has(category)) return {version:1,provider:"stability",kind:"image"};
  if (category === "voice_clone") return {version:1,provider:"elevenlabs",kind:"audio"};
  if (avatarCategories.has(category)) return {version:1,provider:"heygen",kind:"video"};
  if (!LEGACY_VIDEO_CATEGORIES.has(category)) return undefined;
  const extras=input.extras || {};
  const preflight=buildProviderPreflight({productionType:category,packageId:input.packId || "",requestMetadata:{...extras,selectedProviderService:extras.selectedProviderService || extras.provider_service || extras.preferredProvider || "",selectedDuration:extras.duration,aspectRatio:extras.aspect || extras.format},inputJson:{},videoProvider:process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || ""});
  const provider=String(preflight.provider || "").toLowerCase();
  if (!["minimax","runway","kling","fal","replicate"].includes(provider)) throw new Error("legacy_provider_route_unavailable");
  return {version:1,provider,kind:"video"};
}
export function legacyRouteConfigured(route: LegacyRoute) {
  return hasProviderEnv(route.provider as Parameters<typeof hasProviderEnv>[0]) && (route.provider !== "minimax" || Boolean(process.env.MINIMAX_GROUP_ID || process.env.MINIMAX_GID || process.env.MINIMAX_GROUPID));
}
