export const adminMenu = [
  { label: "Overview", href: "/admin", group: "Panel" },
  { label: "Members", href: "/admin/users", group: "Panel" },
  { label: "All Requests", href: "/admin/productions", group: "Panel" },
  { label: "Finance Dashboard", href: "/admin/finance", group: "Panel" },
  { label: "Ad Slots", href: "/admin/ads", group: "Panel" },
  { label: "Site Content", href: "/admin/site-content", group: "Panel" },
  { label: "Packages", href: "/admin/packages", group: "Panel" },
  { label: "Category Cards", href: "/admin/categories", group: "Panel" },
  { label: "Sample Output Videos", href: "/admin/sample-videos", group: "Panel" },
  { label: "FAQ Management", href: "/admin/faqs", group: "Panel" },
  { label: "Free Tools Funnel", href: "/admin/free-tools", group: "Panel" },
  { label: "SEO Service Pages", href: "/admin/service-pages", group: "Panel" },
  { label: "SEO / Google", href: "/admin/seo", group: "Panel" },
  { label: "Launch Readiness", href: "/admin/launch-readiness", group: "Panel" },
  { label: "Final API Checklist", href: "/admin/final-api-checklist", group: "Panel" },
  { label: "Manual E2E Checklist", href: "/admin/manual-e2e-checklist", group: "Panel" },
  { label: "Provider Readiness", href: "/admin/providers", group: "Panel" },
  { label: "API Guard / Cost Control", href: "/admin/api-guard", group: "Panel" },
  { label: "Security / Fraud Guard", href: "/admin/security-fraud", group: "Panel" },
  { label: "Monitoring / Error Logging", href: "/admin/monitoring", group: "Panel" },
  { label: "Legal / Support Final", href: "/admin/legal-final", group: "Panel" },
  { label: "Product Hunt / Global Launch", href: "/admin/global-launch", group: "Panel" },
  { label: "Lemon Integration — Last", href: "/admin/lemon-final", group: "Panel" },
  { label: "Production Quality QA", href: "/admin/production-qa", group: "Panel" },
  { label: "Assistant Conversations", href: "/admin/assistant", group: "Panel" },
  { label: "Text-to-Campaign", href: "/admin/campaign", group: "Automation Modules" },
  { label: "E-commerce Product Ad", href: "/admin/ecommerce-product-ad", group: "Automation Modules" },
  { label: "AI Agents", href: "/admin/agents", group: "Automation Modules" },
  { label: "Global Localization", href: "/admin/localization", group: "Automation Modules" },
  { label: "Website", href: "/admin/website", group: "Automation Modules" },
  { label: "iOS / Android App", href: "/admin/mobile", group: "Automation Modules" },
  { label: "SaaS", href: "/admin/saas", group: "Automation Modules" },
  { label: "AI Video", href: "/admin/video", group: "Automation Modules" },
  { label: "Advanced Talking Video", href: "/admin/talking-video", group: "Automation Modules" },
  { label: "Documentary", href: "/admin/documentary", group: "Automation Modules" },
  { label: "Animation", href: "/admin/animation", group: "Automation Modules" },
  { label: "Anime Short Film", href: "/admin/anime-short-film", group: "Automation Modules" },
  { label: "Animal Video", href: "/admin/animal-video", group: "Automation Modules" },
  { label: "Nature Video", href: "/admin/nature-video", group: "Automation Modules" },
  { label: "Planet / Space Video", href: "/admin/planet-space-video", group: "Automation Modules" },
  { label: "Drone / Satellite Video", href: "/admin/drone-video", group: "Automation Modules" },
  { label: "AI Live Sales Agent", href: "/admin/live-sales-agent", group: "Automation Modules" },
  { label: "Stickman Animation", href: "/admin/stickman-animation", group: "Automation Modules" },
  { label: "Music Video / MV", href: "/admin/music-video", group: "Automation Modules" },
  { label: "Studio / Series-Film", href: "/admin/studio", group: "Automation Modules" },
  { label: "Drama / Short Series", href: "/admin/drama", group: "Automation Modules" },
  { label: "Cinematic Video", href: "/admin/cinematic-video", group: "Automation Modules" },
  { label: "Video Clipping", href: "/admin/video-clipping", group: "Automation Modules" },
  { label: "Avatar Design / Avatar Video", href: "/admin/avatar", group: "Automation Modules" },
  { label: "Lip Sync Video", href: "/admin/lip-sync", group: "Automation Modules" },
  { label: "Voice Cloning", href: "/admin/voice-clone", group: "Automation Modules" },
  { label: "Visual Clone / Style Clone", href: "/admin/visual-clone", group: "Automation Modules" },
  { label: "Video Tools", href: "/admin/video-tools", group: "Automation Modules" },
  { label: "Visuals / Media", href: "/admin/image", group: "Automation Modules" },
  { label: "Brand Kit", href: "/admin/brand-kit", group: "Automation Modules" },
  { label: "Documents / Files", href: "/admin/documents", group: "Automation Modules" },
  { label: "Admin Panel Projects", href: "/admin/admin-projects", group: "Automation Modules" },
  { label: "Growth Backlog", href: "/admin/growth", group: "Phase-2 Operations" },
  { label: "Analytics Dashboard", href: "/admin/analytics", group: "Phase-2 Operations" },
  { label: "Partner Program", href: "/admin/partners", group: "Phase-2 Operations" },
  { label: "Bulk Production Queue", href: "/admin/bulk", group: "Phase-2 Operations" },
  { label: "AI Dubbing / Lip-Sync", href: "/admin/dubbing", group: "Phase-2 Operations" },
  { label: "Ads & ROAS", href: "/admin/ads-roas", group: "Phase-2 Operations" },
  { label: "Connected Accounts & Stores", href: "/admin/connections", group: "Phase-2 Operations" },
  { label: "Brand Kit Storage", href: "/admin/brand-kit-storage", group: "Phase-2 Operations" },
  { label: "Credit Operations", href: "/admin/credits", group: "Finance" },
  { label: "Delivery Credit Rates", href: "/admin/delivery-credit-rates", group: "Finance" },
  { label: "Invoice / Billing", href: "/admin/billing", group: "Finance" },
  { label: "Automated Payments", href: "/admin/payments", group: "Finance" },
  { label: "Appearance / Theme", href: "/admin/appearance", group: "Site Settings" },
  { label: "Code Backup", href: "/admin/backup", group: "Site Settings" },
  { label: "Legacy Video Requests", href: "/admin/legacy", group: "Archive" }
];

export const adminMenuGroups = Array.from(new Set(adminMenu.map((item) => item.group)));

export const adminProductionSections = {
  campaign: {
    title: "Text-to-Campaign Management",
    badge: "Text-to-Campaign",
    description: "Manage campaign requests that prepare TikTok, Instagram, email, Google ad and export-planning assets from product links.",
    packageIds: ["campaign_starter", "campaign_product_ad_video", "campaign_multichannel", "campaign_autopilot"],
    checklist: ["Product/link analysis", "Multi-channel outputs", "A/B hook set", "Export calendar", "Automation notes"]
  },
  ecommerceProductAd: {
    title: "E-commerce Product Ad Operations",
    badge: "Product Link to Ad Video",
    description: "Monitor product-link ad planning, provider preflight and dashboard delivery status for Shopify, Amazon, Trendyol or e-commerce product links.",
    packageIds: ["campaign_product_ad_video"],
    checklist: ["Product URL scraping", "GPT-4o ad script", "Runway/Kling/Replicate visual job", "ElevenLabs voice-over", "Subtitle render", "Shotstack/Remotion final MP4", "Provider status polling"]
  },
  agents: {
    title: "AI Agents Management",
    badge: "AI Agents",
    description: "Manage AI influencer, digital brand face, social assistant and avatar project planning without promising live autonomous publishing before final API setup.",
    packageIds: ["agent_brand_face", "agent_social_manager", "agent_live_brand"],
    checklist: ["Avatar/persona", "Competitor analysis", "Trend tracking rule", "Approval flow", "API stack plan"]
  },
  localization: {
    title: "Global Localization Management",
    badge: "Global Localization",
    description: "Adapt video, campaign and brand content by target country at language, humor, clothing, local environment and dialect voice level.",
    packageIds: ["localization_video", "localization_cultural", "localization_global_campaign", "regional_culture_video"],
    checklist: ["Target country/region", "Cultural adaptation", "Traditional clothing", "Regional environment", "Local accent/dialect voice", "Voice/language plan", "Visual adaptation", "Risk review"]
  },
  website: {
    title: "Website Management",
    badge: "Website",
    description: "Manage landing page, business website, website + admin and e-commerce requests.",
    packageIds: ["website_landing", "website_business", "website_admin", "website_ecommerce_admin"],
    checklist: ["Page count", "Responsive design", "E-commerce storefront", "Admin/product screens", "Delivery ZIP", "README / setup notes", "Preview URL"]
  },
  mobile: {
    title: "iOS / Android App Management",
    badge: "Mobile App",
    description: "Manage iOS, Android, Expo starter app and mobile app + admin productions.",
    packageIds: ["mobile_ui", "mobile_expo", "mobile_admin"],
    checklist: ["Screen list", "iOS/Android target", "Expo source files", "Build instructions", "App preview"]
  },
  saas: {
    title: "SaaS Project Management",
    badge: "SaaS",
    description: "Track SaaS project requests such as dashboards, auth, billing, admin and user panels.",
    packageIds: ["saas_dashboard", "saas_mvp", "saas_admin_billing", "shopify_app_integration"],
    checklist: ["Auth flow", "Dashboard modules", "Billing plan", "Shopify integration plan", "Database schema", "Env example"]
  },
  video: {
    title: "AI Video Management",
    badge: "AI Video",
    description: "Manage draft, premium and cinematic video requests.",
    packageIds: ["video_draft", "video_premium", "video_cinematic"],
    checklist: ["Preview video", "Final MP4", "Caption", "Hashtag", "Revision note"]
  },
  talkingVideo: {
    title: "Advanced Talking Video Management",
    badge: "Advanced Talking Video",
    description: "Manage self-in-video, multi-person talking, panel/interview, own-voice, regional clothing/environment and dialect/accent video requests.",
    packageIds: ["talking_video_basic", "talking_video_multi_person", "talking_video_regional_culture"],
    checklist: ["User/self material", "Person count", "Dialogue roles", "Own voice or separate voices", "Regional clothing", "Local environment", "Dialect/accent direction", "Realistic or animated output"]
  },
  documentary: {
    title: "Documentary Management",
    badge: "Documentary",
    description: "Manage research-led documentary, explainer documentary and documentary series pilot requests.",
    packageIds: ["documentary_short", "documentary_explainer", "documentary_series_pilot"],
    checklist: ["Topic research", "Narration outline", "Interview map", "Archival visual plan", "Subtitle and final delivery"]
  },
 animation: {
  title: "Animation Management",
  badge: "Animation",
  description: "Manage 2D, 2.5D, 3D, character, whiteboard and explainer animation requests.",
  packageIds: ["animation_explainer", "animation_character_pack"],
  checklist: ["Animation style", "Character/action notes", "Scene flow", "Motion control", "Final MP4"]
},
animeShortFilm: {
  title: "Anime Short Film Management",
  badge: "Anime Short Film",
  description: "Manage anime short scenes and multi-scene anime short film requests with user-selected anime style, characters, dialogue, action, voice and subtitles.",
  packageIds: ["anime_short_scene", "anime_short_film_pack"],
  checklist: ["Anime style", "Character setup", "Dialogue/action scenes", "Voice/subtitle notes", "Final MP4"]
},
animalVideo: {
  title: "Animal Video Management",
  badge: "Animal Video",
  description: "Manage funny, exciting, cinematic, animated and 3D animal video requests with user materials, voice and music options.",
  packageIds: ["animal_funny_short", "animal_cinematic_pack"],
  checklist: ["Animal concept", "Style direction", "User material / voice / music", "Mood-matched soundtrack", "Final MP4 download"]
},
natureVideo: {
  title: "Nature Video Management",
  badge: "Nature Video",
  description: "Manage nature, landscape, wildlife, weather and atmosphere video requests with narration and background music.",
  packageIds: ["nature_cinematic_short", "nature_documentary_pack"],
  checklist: ["Nature topic", "Scene/chapter flow", "Narration option", "Emotional background music", "Final delivery package"]
},
planetSpaceVideo: {
  title: "Planet / Space Video Management",
  badge: "Planet / Space Video",
  description: "Manage planet, galaxy, astronomy, cosmic explainer and cinematic space video requests.",
  packageIds: ["planet_explainer_short", "planet_cinematic_pack"],
  checklist: ["Space topic", "Explainer/cinematic style", "3D visual direction", "Voice/music/subtitle notes", "Final MP4 download"]
},
droneVideo: {
  title: "Drone / Satellite Video Management",
  badge: "Drone / Satellite Video",
  description: "Manage map/location, marked-area, route, satellite-view intro and drone-style aerial video requests with narration, subtitles and music.",
  packageIds: ["drone_location_video", "drone_satellite_story"],
  checklist: ["Location or route", "Marked map/satellite notes", "Drone flyover sequence", "Voice-over script", "Music/subtitle direction", "Final MP4 package"]
},
liveSalesAgent: {
  title: "AI Live Sales Agent Management",
  badge: "AI Live Sales Agent",
  description: "Manage autonomous live-stream brand agent service plans, product-link selling, avatar persona, live chat reply, multilingual script, fair-use live hours, pay-as-you-go cost analysis and provider readiness requests.",
  packageIds: ["live_sales_agent_starter", "live_commerce_stream_pack", "autonomous_brand_agent"],
  checklist: ["Product link/details", "Target live platform", "Avatar/persona", "Voice/language", "Live FAQ and objection handling", "CTA/discount playbook", "Fair-use hours policy", "Pay-as-you-go API cost estimate", "OBS/provider readiness", "AI disclosure/compliance review"]
},
stickmanAnimation: {
  title: "Stickman Animation Management",
  badge: "Stickman Animation",
  description: "Manage stickman education, explainer, comedy, story and social short animation requests.",
  packageIds: ["stickman_short", "stickman_explainer", "stickman_story_pack"],
  checklist: ["Stickman style", "Script", "Scene flow", "Voice/subtitle notes", "Social output"]
},
musicVideo: {
  title: "Music Video / MV Management",
  badge: "Music Video / MV",
  description: "Manage lyric videos, visualizers, performance clips, social MV teasers and cinematic music videos.",
  packageIds: ["music_lyric_video", "music_performance_clip", "music_cinematic_mv"],
  checklist: ["Song/lyrics brief", "Visual direction", "Lyric/subtitle moments", "Social cuts", "Final MP4"]
},
  studio: {
    title: "Studio / Series-Film Management",
    badge: "Studio / Series-Film",
    description: "Manage series, film, trailer, script, scene plan, character breakdown and production bible requests.",
    packageIds: ["studio_series_film", "studio_trailer_teaser"],
    checklist: ["Script brief", "Scene plan", "Character breakdown", "Production bible", "Trailer / teaser direction"]
  },
  drama: {
    title: "Drama / Short Series Management",
    badge: "Drama / Short Series",
    description: "Manage one-prompt short drama, mini-series, viral short film, episode arc, character, dialogue, voice, music and social-cut requests.",
    packageIds: ["drama_short_series", "drama_viral_short", "drama_episode_pack"],
    checklist: ["One-prompt drama idea", "Short series or episode arc", "Character roles", "Dialogue/voice notes", "Viral hook/social cut", "Music/subtitle direction"]
  },
  cinematicVideo: {
    title: "Cinematic Video Management",
    badge: "Cinematic Video",
    description: "Manage premium cinematic, luxury, dramatic and trailer-like video requests.",
    packageIds: ["cinematic_video_pack"],
    checklist: ["Cinematic brief", "Shot direction", "Music/voice notes", "Premium render", "Final MP4"]
  },
  videoClipping: {
    title: "Video Clipping Management",
    badge: "Video Clipping",
    description: "Manage long video shortening, exciting/scary/funny moment extraction and social clip requests.",
    packageIds: ["video_clipping_shorts", "video_clipping_moments"],
    checklist: ["Long video source", "Scene detection", "Hook extraction", "Shorts/Reels cuts", "Subtitles/captions"]
  },
  avatar: {
    title: "Avatar Design / Avatar Video Management",
    badge: "Avatar",
    description: "Manage custom avatar design, self-in-video, brand persona, talking avatar and multi-person conversation video requests.",
    packageIds: ["avatar_design", "avatar_video", "multi_person_talking_video"],
    checklist: ["Avatar concept", "User reference/self-in-video material", "Person count", "Dialogue roles", "Separate voice per person", "Voice/lip-sync needs", "Realistic or animated video option", "Delivery package"]
  },
  lipSync: {
    title: "Lip Sync Video Management",
    badge: "Lip Sync",
    description: "Manage audio-to-face, avatar speaking, dialogue sync and multilingual dub video requests.",
    packageIds: ["lip_sync_video"],
    checklist: ["Source face/avatar", "Audio/script", "Dialogue sync", "Subtitle option", "Final MP4"]
  },
  voiceClone: {
    title: "Voice Cloning Management",
    badge: "Voice Cloning",
    description: "Manage voice reference, clean vocal, clone-style narration and multilingual voice requests.",
    packageIds: ["voice_clone_pack"],
    checklist: ["Voice reference", "Clean vocal", "Narration sample", "Usage rules", "Delivery notes"]
  },
  visualClone: {
    title: "Visual Clone / Style Clone Management",
    badge: "Visual Clone",
    description: "Manage reference style, character look, product look and visual clone requests.",
    packageIds: ["visual_clone_pack"],
    checklist: ["Reference review", "Style direction", "New variation plan", "Output count", "Delivery ZIP"]
  },
  videoTools: {
    title: "Video Tools Management",
    badge: "Video Tools",
    description: "Manage link-to-video, image-to-video, script-to-video, voice-to-video, video extend, motion control and watermark-free output requests.",
    packageIds: ["video_tools_pack", "video_watermark_control"],
    checklist: ["Input type", "Tool selection", "Motion/control notes", "Watermark-free output", "Owned-content rights confirmation", "Final delivery"]
  },
  image: {
    title: "Visual / Image Management",
    badge: "Image / Visual",
    description: "Manage single visual, visual pack, hero image and product mockup deliveries.",
    packageIds: ["image_single", "image_pack"],
    checklist: ["Preview image", "Final asset", "ZIP pack", "Usage note"]
  },
  brand: {
    title: "Brand Kit Management",
    badge: "Brand Kit",
    description: "Manage logo concepts, color palettes, typography and social kit deliveries.",
    packageIds: ["brand_full"],
    checklist: ["Logo files", "Color palette", "Typography", "Social kit", "Brand ZIP"]
  },
  documents: {
    title: "Document / File Pack Management",
    badge: "Document / File Pack",
    description: "Manage pitch decks, proposals, catalogs, PDFs, guides and file packages.",
    packageIds: ["document_pitch"],
    checklist: ["Markdown", "PDF", "Deck link", "Document ZIP", "Revision note"]
  },
  adminProjects: {
    title: "Admin Panel Project Management",
    badge: "Admin Panel Project",
    description: "Manage standalone admin dashboards, CRUD, role structure and schema guides.",
    packageIds: ["admin_basic", "admin_advanced"],
    checklist: ["Dashboard screens", "CRUD modules", "Role notes", "Schema guide", "README"]
  }
};

export const adSlots = [
  { name: "Splash ad", placement: "Full screen on site opening", status: "Planned" },
  { name: "Right ad slot", placement: "Desktop right column", status: "Planned" },
  { name: "Left ad slot", placement: "Desktop left column", status: "Planned" },
  { name: "Sidebar ad", placement: "Dashboard/admin sidebar", status: "Planned" },
  { name: "Header ad", placement: "Top announcement/banner area", status: "Planned" },
  { name: "In-content ad", placement: "Between category/pricing cards", status: "Planned" }
];

export const seoSettings = [
  "Meta title / description management",
  "Sitemap.xml review",
  "Robots.txt review",
  "Google Search Console verification area",
  "Google Analytics / Tag Manager area",
  "Open Graph image settings",
  "Canonical URL settings"
];

export const appearanceSettings = [
  "Global site color template",
  "Header menu layout",
  "Sidebar layout",
  "Dashboard card design",
  "Landing page hero template",
  "Button styles",
  "Ad slot visibility",
  "New module area"
];
