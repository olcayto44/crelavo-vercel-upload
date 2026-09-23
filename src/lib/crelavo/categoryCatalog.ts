export type Billing = "credits" | "subscription";
export type Pack = { id: string; label: string; credits?: number; priceLabel?: string };
export type ExtraField = { id: string; label: string; kind: "select" | "text"; required?: boolean; placeholder?: string; options?: { id: string; label: string }[] };
export type GroupId = "build" | "media" | "marketing" | "avatar_voice" | "brand" | "special_video";
export type FamilyId = GroupId | "live_sales";
export type Category = { id: string; type: string; group: GroupId; family: FamilyId; label: string; billing: Billing; features: { id: string; label: string }[]; packs: Pack[]; extras: ExtraField[] };
export const GROUPS = [
  { id: "build", label: "Build", blurb: "Website, SaaS, mobile app, admin panel" },
  { id: "media", label: "Create Media", blurb: "Video, talking, animation, music, cinema" },
  { id: "marketing", label: "Marketing & Growth", blurb: "Campaigns, ads, localization, live sales" },
  { id: "avatar_voice", label: "Avatars & Voice", blurb: "Avatar, lip-sync, voice, style clone" },
  { id: "brand", label: "Brand & Files", blurb: "Image, brand kit, documents" },
  { id: "special_video", label: "Special Video", blurb: "Anime, animal, nature, drone, studio" },
] as const;
const labels = (items: string[]) => items.map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label }));
const videoExtras: ExtraField[] = [
  { id: "input", label: "How should production start?", kind: "select", required: true, options: labels(["Prompt-to-video", "Product / page link to video", "Voice-to-video", "Image-to-video"]) },
  { id: "aspect", label: "Format", kind: "select", required: true, options: [{ id: "9x16", label: "9:16 vertical" }, { id: "1x1", label: "1:1 square" }, { id: "16x9", label: "16:9 horizontal" }] },
  { id: "duration", label: "Length / Duration", kind: "select", required: true, options: labels(["8 seconds", "15 seconds"]) },
];
const talkingExtras: ExtraField[] = [{ id: "who", label: "Who appears?", kind: "select", required: true, options: labels(["Self-in-video", "Custom avatar", "Multi-person"]) }, { id: "language", label: "Spoken language", kind: "select", required: true, options: labels(["English", "Turkish", "German", "French", "Spanish", "Arabic"]) }, ...videoExtras.filter((field) => field.id !== "input")];
const imageExtras: ExtraField[] = [{ id: "format", label: "Format", kind: "select", required: true, options: labels(["Story 9:16", "Feed 1:1", "Banner", "Poster", "Hero image"]) }];
const packs = (items: Array<[string, number]>): Pack[] => items.map(([label, credits]) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label, credits }));
function category(id: string, type: string, group: GroupId, label: string, features: string[], packList: Array<[string, number]>, extras: ExtraField[] = videoExtras): Category { return { id, type, group, family: group, label, billing: "credits", features: labels(features), packs: packs(packList), extras }; }
const buildExtras: ExtraField[] = [{ id: "reference_url", label: "Reference site or product URL", kind: "text", placeholder: "https://" }, { id: "stack", label: "Delivery", kind: "select", required: true, options: labels(["Preview first", "Preview + source files"]) }];
export const CATEGORIES: Category[] = [
  category("website", "Website", "build", "Website", ["Landing page", "Business site", "E-commerce storefront"], [["Landing Page", 500], ["Business Website", 1500], ["Website + Basic Admin", 3500]], buildExtras),
  category("saas", "SaaS", "build", "SaaS", ["Dashboard", "Auth", "Billing"], [["SaaS Dashboard", 2500], ["SaaS MVP Starter", 6000]], buildExtras),
  category("mobile_app", "Mobile App", "build", "Mobile App", ["iOS/Android UI", "Expo starter", "Navigation"], [["Mobile App UI", 3000], ["Expo Starter App", 6000]], buildExtras),
  category("admin_project", "Admin Panel Project", "build", "Admin Panel Project", ["CRUD", "Roles", "Database"], [["Basic Admin Panel", 3500]], buildExtras),
  category("video", "AI Video", "media", "AI Video", ["Prompt-to-video", "Product / page link to video", "Image-to-video", "Voice-to-video"], [["Controlled 1080p Video Test", 600], ["Premium Video", 3300]]),
  category("talking_video", "Advanced Talking Video", "media", "Advanced Talking Video", ["Self-in-video", "Photo/avatar input", "Choose character"], [["Self-in-Video Talking Scene", 4200], ["Multi-person Talking Video", 8200]], talkingExtras),
  category("documentary", "Documentary", "media", "Documentary", ["Topic research", "Narration outline", "Interview map"], [["Short Documentary", 2200], ["Documentary Explainer", 5200]]),
  category("animation", "Animation", "media", "Animation", ["2D animation", "2.5D animation", "3D animation"], [["Animation Explainer", 900], ["Character Animation Pack", 3500]]),
  category("music_video", "Music Video / MV", "media", "Music Video / MV", ["Lyric video", "Visualizer", "Performance clip"], [["Lyric Video / Visualizer", 4000], ["Performance Clip", 8500]]),
  category("drama", "Drama / Short Series", "media", "Drama / Short Series", ["One-prompt drama", "Short series", "Viral short film"], [["Drama Builder", 5200], ["Viral Short Film Pack", 7800]]),
  category("cinematic_video", "Cinematic Video", "media", "Cinematic Video", ["Luxury video", "Trailer look", "Drama scene"], [["Cinematic Video Pack", 3300]]),
  category("video_clipping", "Video Clipping", "media", "Video Clipping", ["Long video to Shorts", "Exciting moments", "Best moments"], [["Long Video to Shorts", 1800], ["Best Moments Extraction", 4200]], [{ id: "source_url", label: "Long video URL or file note", kind: "text", required: true, placeholder: "Uploaded file or URL" }, ...videoExtras.filter((field) => field.id === "aspect")]),
  category("video_tools", "Video Tools", "media", "Video Tools", ["Video extend", "Motion control", "Watermark-free final"], [["Video Tools Pack", 900], ["Watermark Control Pack", 1200]]),
  category("campaign", "Text-to-Campaign", "marketing", "Text-to-Campaign", ["Shopify product link", "Amazon product link", "Trendyol product link"], [["Campaign Starter", 2500], ["Product Link to Ad Video", 6500]], [{ id: "product_url", label: "Product link", kind: "text", required: true, placeholder: "https://" }, { id: "channel", label: "Main channel", kind: "select", required: true, options: labels(["TikTok", "Instagram", "YouTube", "Email", "Paid ads"]) }]),
  category("ad_score_checker", "AI Ad Performance Score Checker", "marketing", "AI Ad Performance Score Checker", ["Basic ad score", "Detailed score report", "Improved ad angles"], [["Basic Ad Score Report", 600], ["Ad Score Pack", 1200]]),
  category("campaign_calendar", "AI Campaign Calendar", "marketing", "AI Campaign Calendar", ["Seasonal brief", "Launch checklist", "Hook calendar"], [["Campaign Calendar Brief", 800], ["Seasonal Asset Plan", 2200]]),
  category("ai_agent", "AI Agents", "marketing", "AI Agents", ["AI influencer", "Daily social manager", "Trend monitor"], [["AI Influencer / Brand Face", 5000], ["Always-On Brand Agent", 20000]]),
  category("localization", "Global Localization", "marketing", "Global Localization", ["Language adaptation", "Cultural rewrite", "Voice direction"], [["Video Localization Pack", 2000], ["Global Campaign Localization", 12000]]),
  category("cultural_localization", "AI Cultural Localization", "marketing", "AI Cultural Localization", ["Country brief", "Localized hooks", "Localized script"], [["Country Localization Brief", 900], ["Localized Script Pack", 1800]]),
  { ...category("live_sales_agent", "AI Live Sales Agent", "marketing", "AI Live Sales Agent", ["Product link selling", "Live chat replies"], [["Starter", 249]], [{ id: "platform", label: "Live platform", kind: "select", required: true, options: labels(["TikTok Shop", "Amazon Live", "YouTube"]) }]), family: "live_sales", billing: "subscription", packs: [{ id: "starter", label: "Starter", priceLabel: "$249/mo" }, { id: "pro", label: "Pro", priceLabel: "$799/mo" }] },
  category("avatar", "Avatar Design / Avatar Video", "avatar_voice", "Avatar Design / Avatar Video", ["Avatar design", "Custom avatar", "Brand persona"], [["Custom Avatar Design", 2500], ["Avatar Video", 6500]], talkingExtras),
  category("lip_sync", "Lip Sync Video", "avatar_voice", "Lip Sync Video", ["Audio to lip-sync", "Avatar speaking", "Dialogue sync"], [["Lip Sync Video", 1800]], [{ id: "source", label: "Source", kind: "select", required: true, options: labels(["Audio file", "Script"]) }]),
  category("voice_clone", "Voice Cloning", "avatar_voice", "Voice Cloning", ["Voice reference", "Clean vocal", "Clone-style narration"], [["Voice Clone Pack", 2500]], [{ id: "language", label: "Narration language", kind: "select", required: true, options: labels(["English", "Turkish", "German", "French"]) }]),
  category("visual_clone", "Visual Clone / Style Clone", "avatar_voice", "Visual Clone / Style Clone", ["Reference style", "Character look", "Product look"], [["Visual / Style Clone Pack", 1500]], imageExtras),
  category("image", "Image / Banner / Poster", "brand", "Image / Banner / Poster", ["Hero image", "Product mockup", "Social visual"], [["Single Visual", 100], ["Visual Pack", 750]], imageExtras),
  category("brand_kit", "Brand Kit", "brand", "Brand Kit", ["Logo", "Palette", "Typography"], [["Full Brand Kit", 3000]], [{ id: "brand_name", label: "Brand name", kind: "text", required: true, placeholder: "Brand name" }]),
  category("document_pack", "Document / File Pack", "brand", "Document / File Pack", ["Pitch deck", "Proposal", "Catalog"], [["Pitch / Proposal Pack", 750]]),
  category("anime_short_film", "Anime Short Film", "special_video", "Anime Short Film", ["Anime style", "Character setup"], [["Anime Short Scene", 3200], ["Anime Short Film Pack", 9000]]),
  category("animal_video", "Animal Video", "special_video", "Animal Video", ["Funny animal", "Exciting animal", "Cinematic"], [["Funny Animal Short", 900], ["Cinematic Animal Video", 4200]]),
  category("nature_video", "Nature Video", "special_video", "Nature Video", ["Wildlife", "Landscape", "Weather"], [["Cinematic Nature Video", 1200], ["Nature Documentary Pack", 5200]]),
  category("planet_space_video", "Planet / Space Video", "special_video", "Planet / Space Video", ["Planet explainer", "Galaxy scene", "3D space"], [["Planet Explainer", 1500], ["Cinematic Space Video", 6500]]),
  category("drone_video", "Drone / Satellite Video", "special_video", "Drone / Satellite Video", ["Map/location prompt", "Satellite intro"], [["Drone Location Video", 2600], ["Satellite + Drone Pack", 6800]]),
  category("stickman_animation", "Stickman Animation", "special_video", "Stickman Animation", ["Explainer", "Comedy skit", "Education"], [["Stickman Short Video", 400], ["Stickman Story Pack", 2500]]),
  category("studio", "Studio / Series-Film", "special_video", "Studio / Series-Film", ["Script", "Scene plan", "Character breakdown"], [["Series / Film Studio", 7800], ["Trailer / Teaser Pack", 4200]]),
  category("crelavo_academy", "Crelavo Academy", "brand", "Crelavo Academy", ["Lesson plan", "Exercises", "Handout"], [["Academy Lesson Pack", 750]], [{ id: "topic", label: "Lesson topic", kind: "text", required: true, placeholder: "Topic" }]),
  category("community_showcase", "Community Showcase", "brand", "Community Showcase", ["Showcase page", "Caption", "Metadata"], [["Showcase Submission Pack", 500]], [{ id: "project", label: "Project description", kind: "text", required: true, placeholder: "Describe the project" }]),
  category("virtual_model_studio", "Virtual Model Studio", "avatar_voice", "Virtual Model Studio", ["Virtual presenter", "Shot list", "Usage notes"], [["Virtual Model Pack", 2500]], talkingExtras),
];
export function getCategory(id?: string | null) { return id ? CATEGORIES.find((category) => category.id === id) ?? null : null; }
export function formatPack(pack: Pack) { return pack.priceLabel ?? String(pack.credits ?? 0) + " credits"; }
export function matchCategoryFromText(text: string) { const lower = text.toLowerCase(); return CATEGORIES.find((category) => lower.includes(category.id) || lower.includes(category.label.toLowerCase())) ?? null; }
