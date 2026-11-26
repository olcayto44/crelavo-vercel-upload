// Reuse existing public routes; no new competing URLs. IDs stay stable.
export const categoryPublicPaths:Record<string,string>={
  "website": "/ai-website-builder",
  "saas": "/products/saas",
  "mobile_app": "/ai-app-builder",
  "video": "/ai-video-generator",
  "talking_video": "/products/advanced-talking-video",
  "animation": "/products/animation",
  "music_video": "/products/ai-music-video",
  "drama": "/products/drama",
  "cinematic_video": "/products/cinematic-video",
  "video_clipping": "/products/video-clipping",
  "video_tools": "/products/video-tools",
  "campaign": "/ai-ecommerce-campaign-generator",
  "ad_score_checker": "/ai-ad-performance-score-checker",
  "ai_agent": "/products/ai-agents",
  "localization": "/products/global-localization",
  "cultural_localization": "/ai-cultural-localization",
  "live_sales_agent": "/products/live-sales-agent",
  "avatar": "/products/avatar",
  "lip_sync": "/products/lip-sync",
  "voice_clone": "/products/voice-clone",
  "visual_clone": "/products/visual-clone",
  "image": "/products/image",
  "brand_kit": "/ai-brand-kit-builder",
  "anime_short_film": "/products/anime-short-film",
  "drone_video": "/products/drone-video",
  "stickman_animation": "/products/stickman-animation",
  "studio": "/products/series-film-studio",
  "virtual_model_studio": "/ai-virtual-model-studio"
};
export function categoryForPublicPath(path:string){return Object.keys(categoryPublicPaths).find(id=>categoryPublicPaths[id]===path)}
export function categoryWorkspace(id:string){return "/dashboard/studio/"+encodeURIComponent(id.replace(/_/g,"-"))}
