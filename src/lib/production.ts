import { deliveryRateMap, type DeliveryCreditRatesConfig } from "./delivery-credit-rates.ts";
import { deliveryPackageForProduction } from "./delivery-package.ts";

export type ProductionType = "campaign" | "ai_agent" | "localization" | "ad_score_checker" | "virtual_model_studio" | "cultural_localization" | "campaign_calendar" | "crelavo_academy" | "community_showcase" | "video" | "talking_video" | "documentary" | "animation" | "anime_short_film" | "animal_video" | "nature_video" | "planet_space_video" | "drone_video" | "live_sales_agent" | "studio" | "drama" | "cinematic_video" | "video_clipping" | "avatar" | "lip_sync" | "voice_clone" | "visual_clone" | "video_tools" | "stickman_animation" | "music_video" | "website" | "saas" | "mobile_app" | "image" | "brand_kit" | "document_pack" | "admin_project";

export type ProductionPackage = {
  id: string;
  productionType: ProductionType;
  name: string;
  credits: number;
  description: string;
  deliverables: string[];
};

export const productionTypes = [
  {
    id: "campaign",
    label: "Text-to-Campaign",
    description: "Turn a product link or short brief into TikTok video, Instagram post, email newsletter and ad copy from one managed panel.",
    startingCredits: 2500
  },
  {
    id: "ai_agent",
    label: "AI Agents",
    description: "Brand-specific AI influencers, autonomous social media managers, trend monitors and daily marketing assistants.",
    startingCredits: 5000
  },
  {
    id: "localization",
    label: "Global Localization",
    description: "Adapt videos, visuals, copy, wardrobe, humor and backgrounds for target countries and cultures.",
    startingCredits: 2000
  },
  {
    id: "ad_score_checker",
    label: "AI Ad Performance Score Checker",
    description: "Score ecommerce ads, TikTok hooks, CTA clarity and creative weaknesses before turning the best angle into production.",
    startingCredits: 50
  },
  {
    id: "virtual_model_studio",
    label: "AI Virtual Model Studio",
    description: "Create virtual model image packs for fashion, jewelry, beauty, accessories and ecommerce catalog visuals.",
    startingCredits: 50
  },
  {
    id: "cultural_localization",
    label: "AI Cultural Localization",
    description: "Adapt product hooks, scripts, CTA, buyer psychology and video briefs for country-specific markets.",
    startingCredits: 50
  },
  {
    id: "campaign_calendar",
    label: "AI Campaign Calendar",
    description: "Plan seasonal ecommerce campaigns, product launches, hook calendars and production-ready campaign asset packs.",
    startingCredits: 50
  },
  {
    id: "crelavo_academy",
    label: "Crelavo Academy",
    description: "AI marketing, product video, UGC ad and ecommerce lesson/template packs that can route into paid production.",
    startingCredits: 0
  },
  {
    id: "community_showcase",
    label: "Community Showcase",
    description: "Turn AI ad examples, ecommerce videos, UGC demos and showcase styles into similar Crelavo production requests.",
    startingCredits: 50
  },
  {
    id: "video",
    label: "AI Video",
    description: "Short-form videos, ads, explainers, cinematic clips, drama and animation requests.",
    startingCredits: 600
  },
  {
    id: "talking_video",
    label: "Advanced Talking Video",
    description: "Self-in-video, multi-person talking scenes, own voice-over, regional clothing, local lifestyle environments and dialect/accent voice direction.",
    startingCredits: 4200
  },
  {
    id: "documentary",
    label: "Documentary",
    description: "Research-led documentary videos with narration, interview structure, archival visual planning, subtitles and final delivery.",
    startingCredits: 2200
  },
  {
    id: "animation",
    label: "Animation",
    description: "2D, 2.5D, 3D, character, explainer and motion animation production flows.",
    startingCredits: 900
  },
  {
    id: "anime_short_film",
    label: "Anime Short Film",
    description: "Anime short films with user-selected anime style, characters, dialogue, action scenes, voice, subtitles and final delivery.",
    startingCredits: 3200
  },
  {
    id: "animal_video",
    label: "Animal Video",
    description: "Funny, exciting, cinematic, animated or 3D animal videos with voice-over, music, subtitles and user materials.",
    startingCredits: 900
  },
  {
    id: "nature_video",
    label: "Nature Video",
    description: "Nature, landscape, wildlife, weather and cinematic environment videos with mood-matched music and narration options.",
    startingCredits: 1200
  },
  {
    id: "planet_space_video",
    label: "Planet / Space Video",
    description: "Planet, space, astronomy, cosmic explainer and cinematic universe videos with narration, music and visual style options.",
    startingCredits: 1500
  },
  {
    id: "drone_video",
    label: "Drone / Satellite Video",
    description: "Map, location, route, satellite-view and drone-style aerial video requests with narration, music and delivery planning.",
    startingCredits: 2600
  },
  {
    id: "live_sales_agent",
    label: "AI Live Sales Agent",
    description: "Autonomous AI live-stream brand agents for product selling, live chat replies, avatar hosting, multilingual scripts, fair-use live hours and pay-as-you-go live-commerce operations.",
    startingCredits: 0
  },
  {
    id: "studio",
    label: "Studio / Series-Film",
    description: "Series, film, trailer, script, scene plan, character breakdown and production bible workflows.",
    startingCredits: 7800
  },
  {
    id: "drama",
    label: "Drama / Short Series",
    description: "Short drama, mini-series, viral short film and episode-ready story video workflows from one prompt, with characters, scenes, voice and social cuts.",
    startingCredits: 5200
  },
  {
    id: "cinematic_video",
    label: "Cinematic Video",
    description: "High-control cinematic, luxury, dramatic, trailer-like and premium visual video production.",
    startingCredits: 3300
  },
  {
    id: "video_clipping",
    label: "Video Clipping",
    description: "Turn long videos into short clips by finding exciting, scary, funny or high-retention scenes.",
    startingCredits: 1800
  },
  {
    id: "avatar",
    label: "Avatar Design / Avatar Video",
    description: "Design a custom avatar, include the user in video, create talking avatar scenes or multi-person conversation videos with optional extra-credit voice and character options.",
    startingCredits: 2500
  },
  {
    id: "lip_sync",
    label: "Lip Sync Video",
    description: "Make a face/avatar speak with synchronized mouth movement from audio or script.",
    startingCredits: 1800
  },
  {
    id: "voice_clone",
    label: "Voice Cloning",
    description: "Voice reference, clean vocal extraction, clone-style narration planning and multilingual voice workflows.",
    startingCredits: 2500
  },
  {
    id: "visual_clone",
    label: "Visual Clone / Style Clone",
    description: "Clone a visual style, character look, product look or reference image direction for new outputs.",
    startingCredits: 1500
  },
  {
    id: "video_tools",
    label: "Video Tools",
    description: "Image-to-video, link-to-video, script-to-video, voice-to-video, video extension, motion control and watermark-free output options.",
    startingCredits: 900
  },
  {
    id: "stickman_animation",
    label: "Stickman Animation",
    description: "Fast stickman animations for education, storytelling, comedy sketches, explainers and social media.",
    startingCredits: 400
  },
  {
    id: "music_video",
    label: "Music Video / MV",
    description: "Music clip concepts, scene plans, lyric videos, performance clips and social MV outputs from a song, beat or lyrics.",
    startingCredits: 4000
  },
  {
    id: "website",
    label: "Website",
    description: "Landing pages, business websites, e-commerce frontends, SaaS pages and source files.",
    startingCredits: 500
  },
  {
    id: "saas",
    label: "SaaS",
    description: "SaaS dashboards, auth flows, billing screens, customer portals and admin-ready source packages.",
    startingCredits: 2500
  },
  {
    id: "mobile_app",
    label: "Mobile App",
    description: "iOS/Android app UI, Expo/React Native starter projects and app source packages.",
    startingCredits: 3000
  },
  {
    id: "image",
    label: "Image / Visual",
    description: "Hero images, product mockups, social visuals, app screens and marketing graphics.",
    startingCredits: 100
  },
  {
    id: "brand_kit",
    label: "Brand Kit",
    description: "Logo concepts, color palette, typography, social kit and visual identity files.",
    startingCredits: 1500
  },
  {
    id: "document_pack",
    label: "Document / File Pack",
    description: "Pitch decks, proposals, catalogs, PDFs, guides and structured business documents.",
    startingCredits: 750
  },
  {
    id: "admin_project",
    label: "Admin Panel Project",
    description: "Web/app projects with admin dashboard, CRUD screens, database schema and setup guide.",
    startingCredits: 3500
  }
] as const;

export const productionPackages: ProductionPackage[] = [
  {
    id: "campaign_starter",
    productionType: "campaign",
    name: "Campaign Starter",
    credits: 2500,
    description: "Transforms one product link or brief into a coordinated starter campaign across social, email and ad copy.",
    deliverables: ["Product analysis", "TikTok video brief", "Instagram post concept", "Email copy", "Google ad copy"]
  },
  {
    id: "campaign_product_ad_video",
    productionType: "campaign",
    name: "Product Link to Ad Video",
    credits: 6500,
    description: "Turns one Shopify, Amazon, Trendyol or direct e-commerce product link into a 30-second ready-to-use ad video with script, AI visuals, voice-over, subtitles and final edit.",
    deliverables: ["Product scraping", "GPT-4o ad script", "Runway/Kling visuals", "ElevenLabs voice-over", "Whisper subtitles", "Shotstack/Remotion MP4"]
  },
  {
    id: "campaign_multichannel",
    productionType: "campaign",
    name: "Multi-Channel Campaign",
    credits: 7500,
    description: "Complete campaign pack with platform-specific assets, A/B hooks and scheduling-ready content plan.",
    deliverables: ["TikTok/Reels script", "Instagram visual pack", "Email newsletter", "Google/Meta ads", "Publishing calendar"]
  },
  {
    id: "campaign_autopilot",
    productionType: "campaign",
    name: "Campaign Autopilot Setup",
    credits: 15000,
    description: "Advanced campaign system design for automatic publishing, analytics loops and reusable winning templates.",
    deliverables: ["Automation map", "API integration plan", "Content calendar", "A/B test strategy", "Cache/template strategy"]
  },
  {
    id: "agent_brand_face",
    productionType: "ai_agent",
    name: "AI Influencer / Brand Face",
    credits: 5000,
    description: "Creates the production brief and asset plan for a never-aging digital brand representative.",
    deliverables: ["Avatar brief", "Voice/personality guide", "Content rules", "Sample scripts", "API stack notes"]
  },
  {
    id: "agent_social_manager",
    productionType: "ai_agent",
    name: "Autonomous Social Media Manager",
    credits: 12000,
    description: "Plans an AI agent that tracks competitors, trends and daily content opportunities for approval.",
    deliverables: ["Agent workflow", "Competitor analysis plan", "Trend monitoring rules", "Daily content queue", "Approval flow"]
  },
  {
    id: "agent_live_brand",
    productionType: "ai_agent",
    name: "Always-On Brand Agent",
    credits: 20000,
    description: "High-level architecture for live avatar content, scheduled videos and always-on brand communication without unlimited live-hour guarantees.",
    deliverables: ["Live avatar plan", "HeyGen/Synthesia notes", "ElevenLabs voice plan", "Moderation rules", "Launch roadmap"]
  },
  {
    id: "localization_video",
    productionType: "localization",
    name: "Video Localization Pack",
    credits: 2000,
    description: "Adapts a video concept into another language and culture with copy, voice and subtitle direction.",
    deliverables: ["Localized script", "Voice direction", "Subtitle notes", "Cultural risk check", "Delivery checklist"]
  },
  {
    id: "localization_cultural",
    productionType: "localization",
    name: "Cultural Adaptation Pack",
    credits: 6000,
    description: "Reworks humor, wardrobe, setting, background and offer angle for target countries like Japan or Brazil.",
    deliverables: ["Country adaptation brief", "Scene redesign notes", "Wardrobe/background plan", "Localized hooks", "Compliance notes"]
  },
  {
    id: "localization_global_campaign",
    productionType: "localization",
    name: "Global Campaign Localization",
    credits: 12000,
    description: "Turns one campaign into multiple country-specific versions with language, culture and channel variations.",
    deliverables: ["Multi-country campaign map", "Localized ad copy", "Visual adaptation plan", "Voice plan", "Publishing notes"]
  },
  {
    id: "ad_score_basic",
    productionType: "ad_score_checker",
    name: "Basic Ad Score Report",
    credits: 50,
    description: "Scores one ad idea, product hook or script for clarity, first-three-second strength, CTA and creative weakness.",
    deliverables: ["Ad score", "Hook strength notes", "CTA clarity review", "Weakness list", "Dashboard delivery"]
  },
  {
    id: "ad_score_script_pack",
    productionType: "ad_score_checker",
    name: "Ad Score + Script Improvement Pack",
    credits: 100,
    description: "Scores the ad and prepares improved hooks, CTA direction and three stronger ad angles.",
    deliverables: ["Detailed ad score", "3 improved ad angles", "Hook rewrite", "CTA rewrite", "Video-ready brief"]
  },
  {
    id: "virtual_model_single",
    productionType: "virtual_model_studio",
    name: "Single Virtual Model Visual",
    credits: 50,
    description: "Creates one virtual model visual direction or image request for a product, outfit, jewelry or beauty item.",
    deliverables: ["1 virtual model visual", "Product placement notes", "Usage direction", "Dashboard delivery"]
  },
  {
    id: "virtual_model_pack",
    productionType: "virtual_model_studio",
    name: "Virtual Model Image Pack",
    credits: 180,
    description: "Creates a 4-image virtual model pack for ecommerce catalog, fashion, jewelry, beauty or accessory campaigns.",
    deliverables: ["4 virtual model visuals", "Catalog/lifestyle mix", "Model style notes", "ZIP delivery"]
  },
  {
    id: "cultural_localization_brief",
    productionType: "cultural_localization",
    name: "Country Localization Brief",
    credits: 50,
    description: "Adapts one product or campaign idea for a target country with buyer psychology, CTA and proof-angle notes.",
    deliverables: ["Country-specific brief", "Hook adaptation", "CTA adaptation", "Cultural fit notes"]
  },
  {
    id: "cultural_localization_pack",
    productionType: "cultural_localization",
    name: "Localized Script + Video Brief Pack",
    credits: 150,
    description: "Creates localized hooks, script direction, visual pace notes and a video-ready brief for one target market.",
    deliverables: ["Localized hook pack", "Localized script", "Visual direction", "Video-ready brief"]
  },
  {
    id: "campaign_calendar_brief",
    productionType: "campaign_calendar",
    name: "Campaign Calendar Brief",
    credits: 50,
    description: "Prepares one seasonal or product-launch campaign brief with timing, content ideas and production next steps.",
    deliverables: ["Campaign brief", "Timing notes", "Hook ideas", "Production checklist"]
  },
  {
    id: "campaign_calendar_asset_pack",
    productionType: "campaign_calendar",
    name: "Seasonal Campaign Asset Plan",
    credits: 200,
    description: "Creates a seasonal hook/script/calendar pack for ecommerce launches and promotional campaigns.",
    deliverables: ["Campaign calendar", "Seasonal hook list", "Script pack", "Asset checklist", "Dashboard delivery"]
  },
  {
    id: "academy_template_pack",
    productionType: "crelavo_academy",
    name: "Academy Template Pack",
    credits: 50,
    description: "Provides premium learning templates, lesson notes or production-ready examples from Crelavo Academy content.",
    deliverables: ["Template pack", "Lesson summary", "Usage notes", "Next production CTA"]
  },
  {
    id: "academy_done_with_you_brief",
    productionType: "crelavo_academy",
    name: "Done-With-You Creative Brief",
    credits: 150,
    description: "Turns Academy learning into a guided creative brief ready for campaign, product video or UGC production.",
    deliverables: ["Guided creative brief", "Hook direction", "Production checklist", "Credit-based next step"]
  },
  {
    id: "showcase_style_reuse",
    productionType: "community_showcase",
    name: "Use Similar Style Request",
    credits: 100,
    description: "Turns a showcase example into a similar production request with style notes, scope and delivery plan.",
    deliverables: ["Style reuse brief", "Reference notes", "Production plan", "Dashboard delivery"]
  },
  {
    id: "showcase_template_reuse_pack",
    productionType: "community_showcase",
    name: "Showcase Template Reuse Pack",
    credits: 200,
    description: "Creates a reusable example-based request package for similar ad, UGC, product video or website outputs.",
    deliverables: ["Template reuse plan", "Creative direction", "Output checklist", "ZIP/dashboard delivery"]
  },
  {
    id: "video_draft",
    productionType: "video",
    name: "Draft Video",
    credits: 600,
    description: "Low-cost AI video request for previews, concept tests, or short social drafts.",
    deliverables: ["Video brief", "Preview output", "Basic delivery notes", "Dashboard delivery"]
  },
  {
    id: "video_premium",
    productionType: "video",
    name: "Premium Video",
    credits: 3300,
    description: "Polished short-form video request for brand, product, UGC, or social campaigns.",
    deliverables: ["Production brief", "Premium video output", "Caption notes", "Download link"]
  },
  {
    id: "video_cinematic",
    productionType: "video",
    name: "Cinematic / Luxury Video",
    credits: 9600,
    description: "High-control cinematic request for luxury visuals, advanced styling, and campaign-grade output.",
    deliverables: ["Cinematic brief", "Premium visual direction", "Final video output", "Delivery notes"]
  },
  {
    id: "video_series_film_studio",
    productionType: "video",
    name: "Series / Film Studio",
    credits: 12500,
    description: "Prepares a script brief, scene plan, character breakdown, series/film bible and production workspace for a series, short film or trailer.",
    deliverables: ["Script brief", "Scene plan", "Character breakdown", "Series/film bible", "Trailer cut", "Voice/music/subtitle plan"]
  },
  {
    id: "drama_short_series",
    productionType: "drama",
    name: "Drama / Short Series Builder",
    credits: 5200,
    description: "Turns one prompt into a short drama, mini-series or short film production request with episode premise, characters, scenes, dialogue, voice and delivery direction.",
    deliverables: ["Drama premise", "Episode/scene plan", "Character roles", "Dialogue/voice notes", "Short video delivery plan"]
  },
  {
    id: "drama_viral_short",
    productionType: "drama",
    name: "Viral Short Film Pack",
    credits: 7800,
    description: "Builds a hook-first viral short film or Reel/TikTok drama flow with fast opening, emotional turn, social cut rhythm, captions and final video direction.",
    deliverables: ["Viral hook", "Short-film beat sheet", "Scene rhythm", "Caption/subtitle plan", "Reels/TikTok delivery notes"]
  },
  {
    id: "drama_episode_pack",
    productionType: "drama",
    name: "Mini-Series Episode Pack",
    credits: 12500,
    description: "Plans a multi-episode short series with recurring characters, episode arc, cliffhangers, voice/music/subtitle notes and social delivery package.",
    deliverables: ["Episode arc", "Recurring characters", "Scene list", "Cliffhanger plan", "Voice/music/subtitle package"]
  },
  {
    id: "talking_video_basic",
    productionType: "talking_video",
    name: "Self-in-Video Talking Scene",
    credits: 4200,
    description: "Creates a talking video request using the user's own image/video material, own voice-over or script, and realistic or animated talking-video direction.",
    deliverables: ["User material review", "Self-in-video setup", "Voice/script notes", "Realistic or animated direction", "MP4 delivery plan"]
  },
  {
    id: "talking_video_multi_person",
    productionType: "talking_video",
    name: "Multi-person Talking Video",
    credits: 8200,
    description: "Plans 2, 3, 4, 5+ or 7-8 person conversation videos with dialogue roles, separate voice per person and panel/interview/roundtable formats.",
    deliverables: ["Person count and roles", "Dialogue/script plan", "Separate voice per person notes", "Panel/interview/roundtable setup", "Final talking-video delivery"]
  },
  {
    id: "talking_video_regional_culture",
    productionType: "talking_video",
    name: "Regional Culture Talking Video",
    credits: 9800,
    description: "Combines self-in-video or multi-person talking scenes with regional clothing, traditional outfits, local living environments and dialect/accent voice-over.",
    deliverables: ["Target region notes", "Traditional clothing direction", "Regional environment plan", "Local dialect/accent voice notes", "Cultural review checklist"]
  },
  {
    id: "video_long_film_clipping",
    productionType: "video",
    name: "Long Film/Series Clipping",
    credits: 7800,
    description: "Prepares scene detection, hook extraction, subtitled Shorts/Reels/TikTok cuts and a social package from a long film, series episode or long video.",
    deliverables: ["Content analysis", "Scene detection", "Hook selection", "Shorts/Reels/TikTok cuts", "Subtitles", "Cover/caption/hashtag package"]
  },
  {
    id: "documentary_short",
    productionType: "documentary",
    name: "Short Documentary",
    credits: 2200,
    description: "Builds a short documentary plan with topic research, narration outline, visual references, subtitles and dashboard delivery.",
    deliverables: ["Topic research", "Narration outline", "Visual reference plan", "Subtitle notes", "Dashboard delivery"]
  },
  {
    id: "documentary_explainer",
    productionType: "documentary",
    name: "Documentary Explainer",
    credits: 5200,
    description: "Creates a structured explainer documentary with chapter beats, voice-over direction, archival-style visuals and social cut notes.",
    deliverables: ["Chapter structure", "Voice-over script", "Archival visual plan", "Social cut notes", "Final MP4 direction"]
  },
  {
    id: "documentary_series_pilot",
    productionType: "documentary",
    name: "Documentary Series Pilot",
    credits: 9800,
    description: "Plans a documentary pilot or mini-series with research angle, episode arc, interview map, narration and delivery package.",
    deliverables: ["Research angle", "Episode arc", "Interview map", "Narration plan", "Series delivery package"]
  },
  {
    id: "animation_explainer",
    productionType: "animation",
    name: "Animation Explainer",
    credits: 900,
    description: "2D, whiteboard, motion or character animation package for education, product and story explainers.",
    deliverables: ["Animation brief", "Scene flow", "Character/action notes", "MP4 delivery"]
  },
  {
    id: "animation_character_pack",
    productionType: "animation",
    name: "Character Animation Pack",
    credits: 3500,
    description: "Character-led animation package with style direction, movement notes and short social outputs.",
    deliverables: ["Character direction", "Animation scenes", "Motion notes", "Social cut plan"]
  },
  {
    id: "anime_short_scene",
    productionType: "anime_short_film",
    name: "Anime Short Scene",
    credits: 3200,
    description: "Creates a short anime scene with selected anime style, character setup, dialogue/action beat and final video direction.",
    deliverables: ["Anime style choice", "Character setup", "Dialogue/action beat", "Voice/subtitle notes", "MP4 delivery plan"]
  },
  {
    id: "anime_short_film_pack",
    productionType: "anime_short_film",
    name: "Anime Short Film Pack",
    credits: 9000,
    description: "Plans and produces a multi-scene anime short film with user-selected style, characters, story beats, voices, subtitles and final delivery.",
    deliverables: ["Anime style bible", "Character list", "Scene plan", "Dialogue/action sequence", "Final MP4 package"]
  },
  {
    id: "animal_funny_short",
    productionType: "animal_video",
    name: "Funny Animal Short",
    credits: 900,
    description: "Creates a funny or cute animal short video with style direction, voice-over, subtitles, music and downloadable delivery.",
    deliverables: ["Animal concept", "Funny scene plan", "Voice/music direction", "Final MP4 download"]
  },
  {
    id: "animal_cinematic_pack",
    productionType: "animal_video",
    name: "Cinematic / 3D Animal Video",
    credits: 4200,
    description: "Produces an exciting, cinematic, animated or 3D animal video plan with user materials, mood-matched music and final delivery package.",
    deliverables: ["Animal style direction", "Cinematic/3D scene plan", "User material notes", "Mood-matched music", "Final MP4 package"]
  },
  {
    id: "nature_cinematic_short",
    productionType: "nature_video",
    name: "Cinematic Nature Video",
    credits: 1200,
    description: "Creates nature, landscape, wildlife or weather video direction with cinematic mood, narration and background music.",
    deliverables: ["Nature brief", "Landscape/wildlife scene plan", "Narration/music notes", "Final MP4 download"]
  },
  {
    id: "nature_documentary_pack",
    productionType: "nature_video",
    name: "Nature Documentary Pack",
    credits: 5200,
    description: "Builds a richer nature documentary or atmosphere video with chapter flow, voice-over, emotional music and delivery package.",
    deliverables: ["Nature documentary structure", "Scene/chapter flow", "Voice-over plan", "Emotional music direction", "Final delivery package"]
  },
  {
    id: "planet_explainer_short",
    productionType: "planet_space_video",
    name: "Planet / Space Explainer",
    credits: 1500,
    description: "Creates planet, space or astronomy explainer videos with narration, subtitles, cosmic music and downloadable output.",
    deliverables: ["Space topic brief", "Explainer scene plan", "Voice/subtitle notes", "Cosmic music direction", "Final MP4 download"]
  },
  {
    id: "planet_cinematic_pack",
    productionType: "planet_space_video",
    name: "Cinematic Space Video",
    credits: 6500,
    description: "Produces cinematic planet, galaxy or universe video direction with 3D/cinematic style, emotional soundtrack and final delivery package.",
    deliverables: ["Cinematic space concept", "Planet/galaxy scene plan", "3D visual direction", "Emotional soundtrack notes", "Final MP4 package"]
  },
  {
    id: "drone_location_video",
    productionType: "drone_video",
    name: "Drone Location Video",
    credits: 2600,
    description: "Creates a drone-style aerial video request from a location, route, property, travel spot or map note with narration and delivery planning.",
    deliverables: ["Location/route brief", "Aerial scene plan", "Voice-over notes", "Music/subtitle direction", "MP4 delivery plan"]
  },
  {
    id: "drone_satellite_story",
    productionType: "drone_video",
    name: "Satellite + Drone Story Pack",
    credits: 6800,
    description: "Plans a map/satellite-view to drone-style video flow with marked area notes, flyover sequence, narration, subtitles and social delivery.",
    deliverables: ["Marked map/location notes", "Satellite-view intro", "Drone flyover sequence", "Narration script", "Final delivery package"]
  },
  {
    id: "live_sales_agent_starter",
    productionType: "live_sales_agent",
    name: "Starter - $249/mo",
    credits: 0,
    description: "Monthly AI live sales agent service plan with 10 fair-use live hours for one platform. No production credits included; live avatar/chat/voice API usage beyond fair use is pay-as-you-go after cost analysis.",
    deliverables: ["1 product/live agent brief", "10h/month fair-use stream plan", "Sales script", "FAQ/objection answers", "Single-platform setup notes", "Pay-as-you-go API cost estimate"]
  },
  {
    id: "live_commerce_stream_pack",
    productionType: "live_sales_agent",
    name: "Pro - $799/mo",
    credits: 0,
    description: "Monthly AI live commerce service plan with 40 fair-use live hours for up to 3 platforms. No production credits included; extra provider/API hours require pay-as-you-go cost analysis.",
    deliverables: ["3-platform stream plan", "40h/month fair-use live schedule", "Voice/avatar direction", "Multilingual chat agent prompts", "CTA/discount playbook", "Extra live-hour add-on estimate"]
  },
  {
    id: "autonomous_brand_agent",
    productionType: "live_sales_agent",
    name: "Agency - $2499/mo",
    credits: 0,
    description: "Monthly white-label autonomous brand agent service plan with 120 fair-use live hours, custom persona, catalog logic and provider readiness. No credit balance included; extra live hours and connected API spend are quoted separately.",
    deliverables: ["White-label agent brief", "120h/month fair-use live plan", "Custom brand persona", "Product catalog/FAQ logic", "Human fallback policy", "Provider/API readiness checklist", "Custom live-hour/API cost model"]
  },
  {
    id: "studio_series_film",
    productionType: "studio",
    name: "Series / Film Studio",
    credits: 7800,
    description: "Script, scene plan, character breakdown, trailer direction and production bible for series or film workflows.",
    deliverables: ["Script brief", "Scene plan", "Character breakdown", "Production bible", "Trailer direction"]
  },
  {
    id: "studio_trailer_teaser",
    productionType: "studio",
    name: "Trailer / Teaser Pack",
    credits: 4200,
    description: "Creates a focused trailer, teaser or promo cut direction with hook, pacing, title cards, music/voice notes and final delivery plan.",
    deliverables: ["Trailer hook", "Teaser structure", "Shot rhythm", "Title card notes", "MP4 delivery plan"]
  },
  {
    id: "cinematic_video_pack",
    productionType: "cinematic_video",
    name: "Cinematic Video Pack",
    credits: 3300,
    description: "Premium cinematic video direction for dramatic, luxury, trailer-like or high-control visual output.",
    deliverables: ["Cinematic brief", "Shot direction", "Music/voice notes", "Final MP4"]
  },
  {
    id: "video_clipping_shorts",
    productionType: "video_clipping",
    name: "Long Video to Shorts",
    credits: 1800,
    description: "Finds strong moments from long videos and prepares short clips for social platforms.",
    deliverables: ["Scene detection", "Hook selection", "Short clips plan", "Caption/cover notes"]
  },
  {
    id: "video_clipping_moments",
    productionType: "video_clipping",
    name: "Best Moments Extraction",
    credits: 4200,
    description: "Extracts exciting, scary, funny or high-retention moments from long films, series or videos.",
    deliverables: ["Exciting moments", "Scary moments", "Funny moments", "Retention notes", "Social cuts"]
  },
  {
    id: "avatar_design",
    productionType: "avatar",
    name: "Custom Avatar Design",
    credits: 2500,
    description: "Designs a custom avatar, digital persona or brand character with optional video direction.",
    deliverables: ["Avatar concept", "Persona notes", "Visual direction", "Optional video plan"]
  },
  {
    id: "avatar_video",
    productionType: "avatar",
    name: "Avatar Video",
    credits: 6500,
    description: "Turns a designed avatar or uploaded user reference into a short talking, promo, self-in-video or multi-person social video workflow.",
    deliverables: ["Avatar video brief", "Script", "Voice/lip-sync notes", "Person count and role notes", "MP4 delivery"]
  },
  {
    id: "multi_person_talking_video",
    productionType: "avatar",
    name: "Multi-person Talking Video",
    credits: 8200,
    description: "Creates a talking video plan with the user or multiple people, optional realistic/animated style, separate voices and conversation roles.",
    deliverables: ["Person count setup", "Dialogue/script plan", "Voice per person notes", "Realistic or animated direction", "MP4 delivery plan"]
  },
  {
    id: "regional_culture_video",
    productionType: "localization",
    name: "Regional Culture Video",
    credits: 5200,
    description: "Adds regional clothing, local environment, cultural scene direction and optional local accent or dialect voice-over to a video workflow.",
    deliverables: ["Target region notes", "Traditional clothing direction", "Regional environment plan", "Local accent/dialect voice notes", "Cultural review checklist"]
  },
  {
    id: "lip_sync_video",
    productionType: "lip_sync",
    name: "Lip Sync Video",
    credits: 1800,
    description: "Synchronizes a face or avatar with audio, narration or dialogue for a talking video.",
    deliverables: ["Source review", "Audio/script notes", "Lip-sync output plan", "Final video"]
  },
  {
    id: "voice_clone_pack",
    productionType: "voice_clone",
    name: "Voice Clone Pack",
    credits: 2500,
    description: "Voice reference and clean-vocal workflow for clone-style narration, multilingual voice or brand voice planning.",
    deliverables: ["Voice reference notes", "Clean vocal plan", "Narration sample plan", "Usage rules"]
  },
  {
    id: "visual_clone_pack",
    productionType: "visual_clone",
    name: "Visual / Style Clone Pack",
    credits: 1500,
    description: "Uses a reference visual direction to create matching style, character look, product look or new visuals.",
    deliverables: ["Reference analysis", "Style direction", "New output plan", "Variation notes"]
  },
  {
    id: "video_tools_pack",
    productionType: "video_tools",
    name: "Video Tools Pack",
    credits: 900,
    description: "Image-to-video, link-to-video, script-to-video, voice-to-video, extension, motion control and watermark-free video options.",
    deliverables: ["Tool selection", "Input review", "Motion/control notes", "Output delivery plan"]
  },
  {
    id: "video_watermark_control",
    productionType: "video_tools",
    name: "Watermark Control Pack",
    credits: 1200,
    description: "Adds Crelavo preview watermark control, paid watermark-free delivery and owned-content watermark cleanup with rights confirmation.",
    deliverables: ["Preview watermark policy", "Watermark-free final delivery", "Owned-content cleanup review", "Rights confirmation note"]
  },
  {
    id: "stickman_short",
    productionType: "stickman_animation",
    name: "Stickman Short Video",
    credits: 400,
    description: "Quick 5-15 second stickman animation draft with a simple topic, character and message.",
    deliverables: ["Short script", "Stickman scene plan", "Basic animation output", "Dashboard delivery"]
  },
  {
    id: "stickman_explainer",
    productionType: "stickman_animation",
    name: "Stickman Education / Explainer",
    credits: 1200,
    description: "Education or explainer video package that explains a topic with simple line/stickman storytelling.",
    deliverables: ["Explainer script", "Scene flow", "Voiceover direction", "Subtitle notes"]
  },
  {
    id: "stickman_story_pack",
    productionType: "stickman_animation",
    name: "Stickman Story Pack",
    credits: 2500,
    description: "Multiple stickman scenes and social media variations for a comedy sketch, story or series.",
    deliverables: ["Character list", "3-5 scene plan", "Social variations", "Publishing notes"]
  },
  {
    id: "music_lyric_video",
    productionType: "music_video",
    name: "Lyric Video / Visualizer",
    credits: 4000,
    description: "Turns a song, beat or lyrics into a clean lyric video, visualizer or vertical teaser concept.",
    deliverables: ["Song/lyrics brief", "Lyric visual direction", "Social format output", "Dashboard delivery"]
  },
  {
    id: "music_performance_clip",
    productionType: "music_video",
    name: "Performance Clip",
    credits: 8500,
    description: "Plans and produces a performance-led music clip with artist, mood, scene and social cut direction.",
    deliverables: ["Artist/performance brief", "Scene plan", "AI video output", "Caption/teaser notes"]
  },
  {
    id: "music_cinematic_mv",
    productionType: "music_video",
    name: "Cinematic Music Video",
    credits: 16000,
    description: "Premium MV request with cinematic concept, richer shot plan, lyric moments and campaign-grade delivery.",
    deliverables: ["Cinematic MV concept", "Shot plan", "Premium AI video output", "Social teaser direction", "Delivery link"]
  },
  {
    id: "website_landing",
    productionType: "website",
    name: "Landing Page",
    credits: 500,
    description: "Single-page website source files for a business, product, service or campaign.",
    deliverables: ["Next.js/React page", "Responsive layout", "README setup guide", "ZIP source package"]
  },
  {
    id: "website_business",
    productionType: "website",
    name: "Business Website",
    credits: 1500,
    description: "Multi-page business website with clean sections and content structure.",
    deliverables: ["3-5 pages", "Navigation/footer", "Contact section", "ZIP source package"]
  },
  {
    id: "website_admin",
    productionType: "website",
    name: "Website + Basic Admin",
    credits: 3500,
    description: "Business website plus a simple admin dashboard structure and setup notes.",
    deliverables: ["Website source", "Admin dashboard screens", "Database notes", "README + ZIP"]
  },
  {
    id: "website_ecommerce_admin",
    productionType: "website",
    name: "E-commerce + Admin",
    credits: 10000,
    description: "E-commerce frontend with product, cart and admin management placeholders.",
    deliverables: ["Product pages", "Cart UI", "Admin product screens", "Schema guide + ZIP"]
  },
  {
    id: "saas_dashboard",
    productionType: "saas",
    name: "SaaS Dashboard",
    credits: 2500,
    description: "Premium SaaS dashboard UI/source package with core pages and component structure.",
    deliverables: ["Dashboard screens", "Reusable components", "Navigation structure", "README + ZIP"]
  },
  {
    id: "saas_mvp",
    productionType: "saas",
    name: "SaaS MVP Starter",
    credits: 6000,
    description: "SaaS MVP source package with auth flow, customer dashboard and database notes.",
    deliverables: ["Auth screens", "Customer dashboard", "Schema guide", "Setup instructions"]
  },
  {
    id: "saas_admin_billing",
    productionType: "saas",
    name: "SaaS + Admin + Billing",
    credits: 12000,
    description: "Advanced SaaS package with customer portal, admin panel and billing-ready structure.",
    deliverables: ["Customer portal", "Admin dashboard", "Billing plan", "Env example + ZIP"]
  },
  {
    id: "shopify_app_integration",
    productionType: "saas",
    name: "Shopify App Store Integration",
    credits: 15000,
    description: "Turns Crelavo campaign/agent workflows into a Shopify merchant app concept with OAuth, billing and app-store launch plan.",
    deliverables: ["Shopify app brief", "OAuth scope plan", "Merchant dashboard", "Billing model", "App Store listing notes"]
  },
  {
    id: "mobile_ui",
    productionType: "mobile_app",
    name: "Mobile App UI",
    credits: 3000,
    description: "App screen design/source package for iOS and Android style layouts.",
    deliverables: ["Core screens", "Reusable components", "Assets folder", "README + ZIP"]
  },
  {
    id: "mobile_expo",
    productionType: "mobile_app",
    name: "Expo Starter App",
    credits: 6000,
    description: "Expo/React Native starter project with navigation and core screens.",
    deliverables: ["Expo project", "Navigation", "Placeholder data", "Build instructions"]
  },
  {
    id: "mobile_admin",
    productionType: "mobile_app",
    name: "Mobile App + Admin",
    credits: 11000,
    description: "Mobile app source package plus matching admin panel structure.",
    deliverables: ["Expo app", "Admin dashboard", "Schema guide", "README + ZIP"]
  },
  {
    id: "image_single",
    productionType: "image",
    name: "Single Visual",
    credits: 100,
    description: "One AI-ready visual request for website, product, ad or social use.",
    deliverables: ["Image brief", "Generated visual placeholder", "Download-ready asset"]
  },
  {
    id: "image_pack",
    productionType: "image",
    name: "Visual Pack",
    credits: 750,
    description: "Small image pack for a website, app, product or social campaign.",
    deliverables: ["5 visual concepts", "Usage notes", "ZIP asset package"]
  },
  {
    id: "brand_full",
    productionType: "brand_kit",
    name: "Full Brand Kit",
    credits: 3000,
    description: "Brand identity starter package for a new product, site or app.",
    deliverables: ["Logo concepts", "Color palette", "Typography", "Social starter kit"]
  },
  {
    id: "document_pitch",
    productionType: "document_pack",
    name: "Pitch / Proposal Pack",
    credits: 750,
    description: "Structured document package for proposals, decks, service offers or startup ideas.",
    deliverables: ["Content outline", "Markdown/PDF-ready copy", "Design notes", "ZIP package"]
  },
  {
    id: "admin_basic",
    productionType: "admin_project",
    name: "Basic Admin Panel",
    credits: 3500,
    description: "Standalone admin panel starter for managing users, records or content.",
    deliverables: ["Dashboard screens", "CRUD placeholders", "Role notes", "README + ZIP"]
  },
  {
    id: "admin_advanced",
    productionType: "admin_project",
    name: "Advanced Admin Project",
    credits: 10000,
    description: "Larger admin system with multiple modules, schema plan and delivery guide.",
    deliverables: ["Multi-module dashboard", "Database schema", "User roles", "ZIP source package"]
  }
];

export function packagesForType(productionType: string) {
  return productionPackages.filter((item) => item.productionType === productionType);
}

export function getProductionPackage(packageId: string) {
  return productionPackages.find((item) => item.id === packageId);
}

export type ProductionCostOptions = {
  needsImages?: boolean;
  revisionBuffer?: boolean;
  outputCount?: number;
  quality?: string;
  durationSeconds?: number;
  features?: string | string[];
  productionType?: string;
  materialCount?: number;
  materialBytes?: number;
  deliveryRequirements?: unknown;
  deliveryCreditRates?: DeliveryCreditRatesConfig | null;
  packageCatalog?: ProductionPackage[];
};

export type ProductionCostEstimate = {
  packageCredits: number;
  singleOutputCredits: number;
  totalCredits: number;
  minimumSafeCredits: number;
  outputCount: number;
  providerRiskLevel: "low" | "medium" | "high";
  costNotes: string[];
};

function textIncludes(value: string | string[] | undefined, words: string[]) {
  const text = Array.isArray(value) ? value.join(" ") : value ?? "";
  const normalized = text.toLocaleLowerCase("tr-TR");
  return words.some((word) => normalized.includes(word));
}

function normalizedOutputCount(value: unknown) {
  const count = Number(value ?? 1);
  return [1, 3, 5].includes(count) ? count : 1;
}

function deliveryFormatsFromRequirements(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const formats = Array.isArray(record.formats) ? record.formats.map(String) : [];
  return [
    ...formats,
    record.wantsZip ? "final_zip" : null,
    record.wantsSourceCode ? "source_code" : null,
    record.wantsReadme ? "readme" : null,
    record.wantsDeploymentGuide ? "deployment_guide" : null,
    record.wantsAdminPanel ? "admin_panel" : null,
    record.wantsFinalVideo ? "final_mp4" : null,
    record.wantsSubtitles ? "subtitle_file" : null,
    record.wantsThumbnail ? "thumbnail" : null,
    record.wantsPdf ? "pdf" : null,
    record.wantsBrandKit ? "brand_kit" : null
  ].filter(Boolean).map(String);
}

function deliveryExtraCredits(value: unknown, productionType: string, quality: string, config?: DeliveryCreditRatesConfig | null) {
  const projectLike = ["website", "saas", "mobile_app", "admin_project"].includes(String(productionType));
  const rates = deliveryRateMap(config);
  const formats = new Set(deliveryFormatsFromRequirements(value).map((item) => item.toLocaleLowerCase("tr-TR")));
  const extras: Array<{ label: string; credits: number }> = [];
  const add = (key: string) => {
    const rate = rates.get(key);
    if (rate) extras.push({ label: rate.label, credits: rate.credits });
  };

  if (formats.has("readme")) add("readme");
  if (formats.has("thumbnail")) add("thumbnail");
  if (formats.has("subtitle_file")) add("subtitle_file");
  if (formats.has("final_mp4")) add("final_mp4");
  if (formats.has("final_zip")) add("final_zip");
  if (formats.has("pdf")) add("pdf");
  if (formats.has("brand_kit")) add("brand_kit");
  if (formats.has("deployment_guide")) add("deployment_guide");
  if (formats.has("source_code")) add(projectLike ? "source_code_project" : "source_code_media");
  if (formats.has("admin_panel")) add("admin_panel");
  if (textIncludes(quality, ["4k"]) || formats.has("4k_export")) add("4k_export");
  if (formats.has("multi_platform_package")) add("multi_platform_package");
  if (formats.has("editable_files")) add("editable_files");

  const total = extras.reduce((sum, item) => sum + item.credits, 0);
  return { total, extras };
}

export function estimateProductionCost(packageId: string, options: ProductionCostOptions = {}): ProductionCostEstimate {
  const selected = options.packageCatalog?.find((item) => item.id === packageId) ?? getProductionPackage(packageId);
  const base = selected?.credits ?? 500;
  const outputCount = normalizedOutputCount(options.outputCount);
  const durationSeconds = Math.max(0, Number(options.durationSeconds ?? 0) || 0);
  const quality = options.quality ?? "";
  const productionType = options.productionType ?? selected?.productionType ?? "general";
  if (String(productionType) === "live_sales_agent") {
    return {
      packageCredits: base,
      singleOutputCredits: 0,
      totalCredits: 0,
      minimumSafeCredits: 0,
      outputCount: normalizedOutputCount(options.outputCount),
      providerRiskLevel: "low",
      costNotes: ["AI Live Sales Agent packages are monthly service/live-agent plans with fair-use live hours, no included credit balance, and pay-as-you-go provider/API usage beyond the plan."]
    };
  }
  const isVideoLike = ["video", "talking_video", "campaign", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "studio", "cinematic_video", "video_clipping", "avatar", "lip_sync", "voice_clone", "visual_clone", "video_tools", "music_video", "stickman_animation", "localization"].includes(String(productionType));
  let single = base;
  const notes: string[] = [`Package base credits: ${base}`];

  if (options.needsImages || textIncludes(options.features, ["görsel", "image", "thumbnail", "kapak"])) {
    single += 500;
    notes.push("Extra safety allowance for image/cover production: 500 credits");
  }

  const materialCount = Math.max(0, Number(options.materialCount ?? 0) || 0);
  if (materialCount > 0) {
    const materialAllowance = materialCount * 150;
    single += materialAllowance;
    notes.push(`Material handling allowance for ${materialCount} selected or uploaded material${materialCount === 1 ? "" : "s"}: ${materialAllowance} credits`);
  }

  const materialBytes = Math.max(0, Number(options.materialBytes ?? 0) || 0);
  if (materialBytes > 0) {
    const materialMegabytes = materialBytes / (1024 * 1024);
    const materialStorageBlocks = Math.ceil(materialMegabytes / 25);
    const materialStorageAllowance = materialStorageBlocks * 120;
    single += materialStorageAllowance;
    notes.push(`Uploaded material storage and transfer allowance for ${Math.ceil(materialMegabytes)} MB: ${materialStorageAllowance} credits`);
  }

  if (isVideoLike) {
    single += 200;
    notes.push("Final video delivery and download/share allowance: 200 credits");
  }

  const deliveryPackage = deliveryPackageForProduction({ productionType, packageId, features: options.features });
  if (deliveryPackage.costCredits > 0) {
    single += deliveryPackage.costCredits;
    notes.push(deliveryPackage.costNote);
  }

  const deliveryExtras = deliveryExtraCredits(options.deliveryRequirements, productionType, quality, options.deliveryCreditRates);
  if (deliveryExtras.total > 0) {
    single += deliveryExtras.total;
    notes.push(`Selected delivery extras allowance: ${deliveryExtras.total} credits`);
    deliveryExtras.extras.forEach((item) => notes.push(`${item.label}: ${item.credits} credits`));
  }

  if (textIncludes(options.features, ["working source package", "working source", "çalışan kaynak", "calisan kaynak", "deployable source"])) {
    const workingSourceAllowance = ["website", "saas", "mobile_app", "admin_project"].includes(String(productionType)) ? 2500 : 900;
    single += workingSourceAllowance;
    notes.push(`Working source package build/test allowance: ${workingSourceAllowance} credits`);
  }

  if (textIncludes(quality, ["1080p", "premium"])) {
    single += isVideoLike ? 900 : 250;
    notes.push("Provider allowance added for 1080p/premium quality");
  }

  if (textIncludes(quality, ["2k", "4k", "sinematik"])) {
    single += isVideoLike ? 1800 : 700;
    notes.push("Extra provider allowance added for high-resolution or cinematic production");
  }

  if (isVideoLike && durationSeconds > 15) {
    const extraBlocks = Math.ceil((durationSeconds - 15) / 15);
    single += extraBlocks * 650;
    notes.push(`Extra duration allowance for ${durationSeconds} sec: ${extraBlocks * 650} credits`);
  }

  if (textIncludes(options.features, ["senaryo", "sahne planı", "sahne plani", "dizi/film bible", "karakter dökümü", "karakter dokumu"])) {
    single += 700;
    notes.push("Series/film script, scene plan and character planning allowance: 700 credits");
  }

  if (textIncludes(options.features, ["uzun film/dizi kesitleme", "sahne tespiti", "hook çıkarımı", "hook cikarimi"])) {
    single += 900;
    notes.push("Long film/series clipping, scene detection and social cut allowance: 900 credits");
  }

  if (textIncludes(options.features, ["seslendirme", "voice", "voice-over", "own voice-over", "dublaj", "child voices", "male voice", "female voice", "çocuk sesi", "cocuk sesi", "kendi ses"])) {
    single += 350;
    notes.push("Voiceover provider allowance: 350 credits");
  }

  if (textIncludes(options.features, ["add yourself to video", "self-in-video", "kendisini videoya", "kendini videoya", "kendi görüntüsü"])) {
    single += 900;
    notes.push("Self-in-video identity/material handling allowance: 900 credits");
  }

  if (textIncludes(options.features, ["2-person conversation", "2 person conversation", "iki kişi", "2 kişi"])) {
    single += 600;
    notes.push("Two-person talking scene allowance: 600 credits");
  }

  if (textIncludes(options.features, ["3-person conversation", "3 person conversation", "üç kişi", "uc kisi", "3 kişi"])) {
    single += 1200;
    notes.push("Three-person talking scene allowance: 1200 credits");
  }

  if (textIncludes(options.features, ["4-person conversation", "4 person conversation", "dört kişi", "dort kisi", "4 kişi"])) {
    single += 1800;
    notes.push("Four-person talking scene allowance: 1800 credits");
  }

  if (textIncludes(options.features, ["5+ person conversation", "5 person", "five person", "daha fazla kişi", "5+ kişi"])) {
    single += 2600;
    notes.push("Five-or-more-person talking scene allowance: 2600 credits");
  }

  if (textIncludes(options.features, ["7-8 person conversation", "7 person", "8 person", "seven person", "eight person", "7 kişi", "8 kişi", "7-8 kişi", "panel", "roundtable", "yuvarlak masa"])) {
    single += 3600;
    notes.push("Large group talking scene allowance for 7-8 people or panel/roundtable format: 3600 credits");
  }

  if (textIncludes(options.features, ["separate voice per person", "her kişi için ayrı ses", "ayrı ses", "multi-speaker", "çoklu ses"])) {
    single += 450;
    notes.push("Separate voice per speaker allowance: 450 credits");
  }

  if (textIncludes(options.features, ["regional clothing", "traditional outfit", "regional environment", "local accent voice-over", "dialect voice-over", "cultural scene direction", "yöresel", "yoresel", "bölgesel", "bolgesel", "şive", "sive", "aksan", "yerel kıyafet", "yöresel kıyafet"])) {
    single += 700;
    notes.push("Regional culture, clothing, environment and dialect direction allowance: 700 credits");
  }

  if (textIncludes(options.features, ["altyazı", "subtitle"])) {
    single += 150;
    notes.push("Subtitle processing allowance: 150 credits");
  }

  if (textIncludes(options.features, ["müzik", "music", "background music", "emotion-matched music", "user music reference", "soundtrack", "arka fon"])) {
    single += 250;
    notes.push("Music/sound design allowance: 250 credits");
  }

  if (options.revisionBuffer || textIncludes(options.features, ["revizyon", "revision"])) {
    const buffer = Math.ceil(base * 0.3);
    single += buffer;
    notes.push(`Revision safety allowance: ${buffer} credits`);
  }

  const totalCredits = single * outputCount;
  const minimumSafeCredits = Math.max(totalCredits, base * outputCount);
  const providerRiskLevel = isVideoLike && (durationSeconds > 30 || outputCount >= 3 || textIncludes(quality, ["4k", "sinematik"])) ? "high" : isVideoLike ? "medium" : "low";

  return {
    packageCredits: base,
    singleOutputCredits: single,
    totalCredits,
    minimumSafeCredits,
    outputCount,
    providerRiskLevel,
    costNotes: notes
  };
}

export function estimateProductionCredits(packageId: string, options?: ProductionCostOptions) {
  return estimateProductionCost(packageId, options).singleOutputCredits;
}
