import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspace = readFileSync(join(process.cwd(), "src", "components", "AssistantWorkspace.tsx"), "utf8");
const links = readFileSync(join(process.cwd(), "src", "lib", "assistant-links.ts"), "utf8");
const production = readFileSync(join(process.cwd(), "src", "lib", "production.ts"), "utf8");
const categoriesPage = readFileSync(join(process.cwd(), "src", "app", "categories", "page.tsx"), "utf8");
const categoryBrowser = readFileSync(join(process.cwd(), "src", "components", "CategoryGroupBrowser.tsx"), "utf8");
const platformMaterials = readFileSync(join(process.cwd(), "src", "lib", "platform-materials.ts"), "utf8");
const productionsApi = readFileSync(join(process.cwd(), "src", "app", "api", "productions", "route.ts"), "utf8");
const materialUploadApi = readFileSync(join(process.cwd(), "src", "app", "api", "materials", "upload", "route.ts"), "utf8");
const globalsCss = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

const requiredCategoryIds = [
  "campaign",
  "ai_agent",
  "localization",
  "video",
  "talking_video",
  "documentary",
  "animation",
  "anime_short_film",
  "animal_video",
  "nature_video",
  "planet_space_video",
  "studio",
  "cinematic_video",
  "video_clipping",
  "avatar",
  "lip_sync",
  "voice_clone",
  "visual_clone",
  "video_tools",
  "stickman_animation",
  "music_video",
  "website",
  "saas",
  "mobile_app",
  "image",
  "brand_kit",
  "document_pack",
  "admin_project"
];

const requiredPackageIds = [
  "documentary_short",
  "documentary_explainer",
  "documentary_series_pilot",
  "animation_explainer",
  "anime_short_scene",
  "anime_short_film_pack",
  "animal_funny_short",
  "animal_cinematic_pack",
  "nature_cinematic_short",
  "nature_documentary_pack",
  "planet_explainer_short",
  "planet_cinematic_pack",
  "studio_series_film",
  "studio_trailer_teaser",
  "cinematic_video_pack",
  "video_clipping_shorts",
  "avatar_design",
  "lip_sync_video",
  "voice_clone_pack",
  "visual_clone_pack",
  "video_tools_pack",
  "video_watermark_control",
  "talking_video_basic",
  "talking_video_multi_person",
  "talking_video_regional_culture"
];

const requiredCategoryBrowserTerms = [
  "CategoryGroupBrowser",
  "categoryGroups",
  "Marketing & Commerce",
  "Video & Motion",
  "Avatar & Cloning",
  "Web, App & Software",
  "Brand, Visuals & Files",
  "category-tab-grid",
  "category-tab-card",
  "category-empty-state",
  "Select a heading above to view its categories",
  "selectedGroupId",
  "Selected production group",
  "General catalog",
  "All Production Categories",
  "all-category-section",
  "renderCategoryCard",
  "Direct final video",
  "Crelavo preview watermark",
  "Owned-content cleanup"
];

const requiredCategoryCssTerms = [
  "category-browser",
  "category-tab-grid",
  "category-tab-card",
  "category-tab-card.active",
  "category-empty-state"
];

const requiredWorkspaceTerms = [
  "categoryOptionProfiles",
  "Category-specific options",
  "Website project options",
  "Mobile app options",
  "Campaign / product ad options",
  "SaaS product options",
  "Documentary options",
  "Animation options",
  "Anime short film options",
  "Animal video options",
  "Nature video options",
  "Planet / space video options",
  "Child voices",
  "Anime style selection",
  "Studio / series-film options",
  "Cinematic video options",
  "Video clipping options",
  "Avatar design / avatar video options",
  "Lip sync video options",
  "Voice cloning options",
  "Visual clone / style clone options",
  "Video tool options",
  "Stickman animation options",
  "Music video / MV options",
  "AI agent options",
  "Advanced talking video options",
  "7-8 person conversation",
  "Panel / roundtable conversation",
  "Local lifestyle environment",
  "Global localization options",
  "Page count",
  "5 screens",
  "Shopify product link",
  "Amazon product link",
  "Trendyol product link",
  "Shopify, Amazon, Trendyol or direct product link",
  "Character count",
  "Lyric video",
  "Target country",
  "Link-to-video",
  "Image-to-video",
  "Script-to-video",
  "Voice-to-video",
  "Watermark-free final delivery",
  "Crelavo preview watermark",
  "Owned-content watermark cleanup",
  "Rights confirmation",
  "Direct final output",
  "Teaser cut",
  "Motion control",
  "Topic research",
  "Interview map",
  "Archival visual plan",
  "Long video shortening",
  "Audio-to-face",
  "Material reference",
  "Source video material",
  "Avatar reference",
  "Face/avatar material",
  "Voice reference material",
  "Song/audio reference",
  "Lyrics/beat material",
  "Own voice-over",
  "Background music",
  "Emotion-matched music",
  "User music reference",
  "User audio upload",
  "User material upload",
  "Uploaded user materials",
  "uploadedMaterials",
  "uploadUserMaterial",
  "Funny animal short",
  "Exciting animal scene",
  "Nature video",
  "Wildlife scene",
  "Planet video",
  "Space explainer",
  "activeCategoryProfile.modules",
  "setOptionsOpen(true)"
];

const forbiddenDrawerTerms = [
  'renderOptionGrid("Site tools"',
  'renderOptionGrid("Production modules", moduleOptions',
  'renderOptionGrid("Extra features", featureOptions',
  'renderOptionGrid("Delivery / platform", platformOptions'
];

const forbiddenCategoriesPageTerms = [
  "SampleVideoGallery",
  "getConfiguredSampleVideos",
  "Category sample video outputs"
];

for (const typeId of requiredCategoryIds) {
  if (!production.includes(`id: "${typeId}"`)) throw new Error(`Production type missing from source data: ${typeId}`);
  if (!workspace.includes(`${typeId}: {`)) throw new Error(`Assistant Workspace missing option profile for category: ${typeId}`);
  if (!categoryBrowser.includes(typeId)) throw new Error(`Category group browser missing category: ${typeId}`);
}

for (const packageId of requiredPackageIds) {
  if (!production.includes(`id: "${packageId}"`)) throw new Error(`Production package missing for new category: ${packageId}`);
}

for (const term of requiredCategoryBrowserTerms) {
  const source = term === "CategoryGroupBrowser" ? categoriesPage : categoryBrowser;
  if (!source.includes(term)) throw new Error(`Category browser missing grouped category term: ${term}`);
}

for (const term of requiredCategoryCssTerms) {
  if (!globalsCss.includes(term)) throw new Error(`Category browser CSS missing term: ${term}`);
}

for (const term of ["Shopify product link", "Amazon product link", "Trendyol product link"]) {
  if (!categoryBrowser.includes(term)) throw new Error(`Category browser missing marketplace link option: ${term}`);
}

for (const term of forbiddenCategoriesPageTerms) {
  if (categoriesPage.includes(term)) throw new Error(`Categories page still includes sample video term: ${term}`);
}

for (const term of requiredWorkspaceTerms) {
  if (!workspace.includes(term)) throw new Error(`Assistant workspace missing category option term: ${term}`);
}
for (const term of ["activePlatformMaterials", "selectedMaterials", "Crelavo material library"]) {
  if (!workspace.includes(term)) throw new Error(`Assistant workspace material selection missing term: ${term}`);
}
for (const term of ["active: true", "activePlatformMaterials", "platformMaterialsByIds"]) {
  if (!platformMaterials.includes(term)) throw new Error(`Platform materials library missing active material term: ${term}`);
}
for (const term of ["selected_material_ids", "platformMaterialsByIds", "materials_json", "uploaded_materials", "user_upload"]) {
  if (!productionsApi.includes(term)) throw new Error(`Production API material persistence missing term: ${term}`);
}
for (const term of ["SUPABASE_USER_MATERIALS_BUCKET", "allowedMimeTypes", "maxUploadBytes", "user-materials"]) {
  if (!materialUploadApi.includes(term)) throw new Error(`Material upload API missing term: ${term}`);
}
for (const term of ["user-material-upload-panel", "uploaded-material-list"]) {
  if (!globalsCss.includes(term)) throw new Error(`User material upload CSS missing term: ${term}`);
}


for (const term of forbiddenDrawerTerms) {
  if (workspace.includes(term)) throw new Error(`Assistant Workspace still renders generic drawer options: ${term}`);
}

if (!links.includes("params.set(\"category\", category)")) {
  throw new Error("Assistant links do not carry category query params");
}

console.log("category-option-panels-smoke ok");
