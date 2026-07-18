import type { ProductionType } from "./production.ts";

export type ProductionQualityProfile = {
  productionType: ProductionType | string;
  label: string;
  minimumStandard: string;
  customerReadyDefinition: string;
  checklist: string[];
  acceptanceCriteria: string[];
  commonRisks: string[];
  adminReviewFocus: string[];
};

function profile(input: Omit<ProductionQualityProfile, "productionType">) {
  return input;
}

const SHARED_MEDIA = ["Brief matches the user's selected style, quality, duration and platforms", "Preview/final output link is attached before ready status", "Music, voice, subtitle and format choices are documented when selected", "Revision note explains what can be changed next"];
const SHARED_PROJECT = ["Preview or screenshots show the requested core flow", "Source/export package includes README and setup notes", "Placeholders, env/example notes and handoff risks are documented", "Admin/source modules match the selected scope"];
const SHARED_BRAND = ["Visual previews match the requested brand/use case", "Downloadable files and usage notes are attached", "Social/store sizes or source/vector notes are included when selected", "Final package avoids one-to-one copying of third-party references"];

export const productionQualityProfiles: Record<ProductionType, Omit<ProductionQualityProfile, "productionType">> = {
  campaign: profile({
    label: "Campaign / product ad quality",
    minimumStandard: "Store/social-ready campaign assets with platform-specific hook, copy, media and export notes.",
    customerReadyDefinition: "Customer can open the dashboard, review the campaign asset, download/export it and understand where to publish it.",
    checklist: ["Product or offer is clear", "Hook and CTA are platform-specific", "Caption/ad copy/export notes are included", "Store/marketplace target is documented", ...SHARED_MEDIA],
    acceptanceCriteria: ["Has usable social/store delivery", "Includes CTA and platform fit", "Has delivery ZIP or final link when requested"],
    commonRisks: ["Generic ad copy", "Missing product URL/context", "Wrong platform format", "No export notes"],
    adminReviewFocus: ["Check product/store target", "Check final media/copy links", "Check delivery ZIP/README"]
  }),
  ai_agent: profile({
    label: "AI agent quality",
    minimumStandard: "Persona, workflow, approval rules and launch constraints are clear enough for safe operations handoff.",
    customerReadyDefinition: "Customer receives a usable agent/persona plan with scripts, content rules, approval flow and provider/API notes.",
    checklist: ["Persona and brand role are defined", "Content rules and approval flow are listed", "Sample scripts or prompt patterns exist", "Provider/API readiness is documented", ...SHARED_PROJECT],
    acceptanceCriteria: ["Agent cannot imply unsupervised unsafe automation", "Human approval/fallback is described", "Deliverables map to selected package"],
    commonRisks: ["Overpromising autonomy", "No moderation rules", "No API/provider setup notes"],
    adminReviewFocus: ["Check approval flow", "Check content safety/moderation notes", "Check provider readiness"]
  }),
  localization: profile({
    label: "Localization quality",
    minimumStandard: "Localized output respects target language, culture, wardrobe/environment and channel context.",
    customerReadyDefinition: "Customer sees what changed for the target market and can publish localized copy/media safely.",
    checklist: ["Target country/language is explicit", "Cultural adaptation is documented", "Voice/subtitle direction matches locale", "Risk/compliance notes are included", ...SHARED_MEDIA],
    acceptanceCriteria: ["Not just translated text", "Locale-specific scene/copy notes exist", "Cultural risk check exists"],
    commonRisks: ["Literal translation", "Wrong cultural symbols", "Missing subtitle/voice direction"],
    adminReviewFocus: ["Check target locale", "Check cultural adaptation", "Check localized delivery files"]
  }),
  video: profile({
    label: "AI video quality",
    minimumStandard: "Final video or preview plan matches duration, aspect/platform, voice/music/subtitle and scene intent.",
    customerReadyDefinition: "Customer can preview/download the video and understands selected format, scene direction and revision path.",
    checklist: ["Duration and platform format are clear", "Scene/shot direction is present", "Voice/music/subtitle choices are recorded", "Final MP4 or provider placeholder is attached", ...SHARED_MEDIA],
    acceptanceCriteria: ["Video format matches selected platform", "Final/preview link exists", "Provider status is traceable"],
    commonRisks: ["Wrong aspect ratio", "No final link", "Missing audio/subtitle note"],
    adminReviewFocus: ["Check provider status", "Check final MP4", "Check platform format"]
  }),
  talking_video: profile({
    label: "Talking video quality",
    minimumStandard: "Speaker count, voice source, lip-sync style and subtitle handling are clear.",
    customerReadyDefinition: "Customer receives a talking-video delivery with person/voice roles and preview/final link.",
    checklist: ["Person count and roles are documented", "Voice source per person is clear", "Lip-sync/subtitle choice is recorded", "Uploaded user material rights are confirmed", ...SHARED_MEDIA],
    acceptanceCriteria: ["Speaker setup is unambiguous", "Voice/lip-sync notes exist", "Final/preview link exists"],
    commonRisks: ["Mixed speaker roles", "Missing voice material", "No subtitle plan"],
    adminReviewFocus: ["Check user materials", "Check role/voice mapping", "Check lip-sync/final link"]
  }),
  documentary: profile({
    label: "Documentary quality",
    minimumStandard: "Research angle, narration structure, visual plan and source/archival direction are documented.",
    customerReadyDefinition: "Customer receives a documentary plan or final media with chapter flow and narration/visual direction.",
    checklist: ["Topic/research angle is clear", "Narration or chapter outline exists", "Visual/reference plan is included", "Subtitle/social cut notes exist when selected", ...SHARED_MEDIA],
    acceptanceCriteria: ["Has chapter/beat structure", "Has narration direction", "Has delivery/final media path"],
    commonRisks: ["No research angle", "Flat narration", "Missing visual plan"],
    adminReviewFocus: ["Check structure", "Check narration", "Check final media/README"]
  }),
  animation: profile({
    label: "Animation quality",
    minimumStandard: "Animation style, characters/action, scene flow and motion notes are clear.",
    customerReadyDefinition: "Customer can review animation preview/final and understand style, scene and revision scope.",
    checklist: ["Animation style is selected", "Character/action notes exist", "Scene flow and motion notes are included", "Voice/music/subtitle options are recorded", ...SHARED_MEDIA],
    acceptanceCriteria: ["Has scene flow", "Has style/motion notes", "Has final/preview delivery"],
    commonRisks: ["Unclear animation style", "No motion notes", "Missing character setup"],
    adminReviewFocus: ["Check style", "Check scene flow", "Check final MP4"]
  }),
  anime_short_film: profile({
    label: "Anime short film quality",
    minimumStandard: "Anime style, character setup, dialogue/action beats, voice/subtitle and scene plan are production-ready.",
    customerReadyDefinition: "Customer receives anime short/scene package with style bible, characters, scene flow and final delivery path.",
    checklist: ["Anime style is explicit", "Character list/setup exists", "Dialogue/action beats are documented", "Voice/subtitle/music choices are recorded", ...SHARED_MEDIA],
    acceptanceCriteria: ["Style and characters are coherent", "Scene/action plan exists", "Final/preview link exists"],
    commonRisks: ["Generic anime label", "No character continuity", "No dialogue/voice notes"],
    adminReviewFocus: ["Check style/characters", "Check scene plan", "Check final MP4/package"]
  }),
  animal_video: profile({
    label: "Animal video quality",
    minimumStandard: "Animal concept, tone, scene action, voice/music and final format are clear.",
    customerReadyDefinition: "Customer receives a funny/cinematic animal video preview/final with music/voice notes and download path.",
    checklist: ["Animal concept and tone are clear", "Scene action is described", "Voice/music choices are captured", "Final MP4/download path is attached", ...SHARED_MEDIA],
    acceptanceCriteria: ["Tone matches package", "Scene is understandable", "Final/preview link exists"],
    commonRisks: ["No animal action", "Wrong tone", "Missing music/voice note"],
    adminReviewFocus: ["Check tone", "Check final media", "Check rights/material notes"]
  }),
  nature_video: profile({
    label: "Nature video quality",
    minimumStandard: "Nature topic, atmosphere, narration/music and landscape/wildlife scene plan are clear.",
    customerReadyDefinition: "Customer can preview/download a nature video or plan with coherent mood and delivery notes.",
    checklist: ["Nature/wildlife topic is defined", "Mood/atmosphere is clear", "Narration/music plan exists", "Platform/final format is documented", ...SHARED_MEDIA],
    acceptanceCriteria: ["Mood and topic match", "Narration/music notes exist", "Final/preview path exists"],
    commonRisks: ["Generic nature footage", "No atmosphere", "Missing voice/music plan"],
    adminReviewFocus: ["Check topic/mood", "Check final media", "Check subtitles/music"]
  }),
  planet_space_video: profile({
    label: "Planet / space video quality",
    minimumStandard: "Space topic, explainer/cinematic angle, 3D/visual direction and narration/music are defined.",
    customerReadyDefinition: "Customer receives a space video/plan with topic structure, visual direction and final delivery path.",
    checklist: ["Space topic is clear", "Explainer or cinematic angle is selected", "3D/visual direction is documented", "Narration/music/subtitle choices are recorded", ...SHARED_MEDIA],
    acceptanceCriteria: ["Topic and visual angle match", "Narration/music plan exists", "Final/preview path exists"],
    commonRisks: ["No specific topic", "Generic galaxy visuals", "No narration structure"],
    adminReviewFocus: ["Check topic", "Check visual direction", "Check final MP4"]
  }),
  drone_video: profile({
    label: "Drone / satellite video quality",
    minimumStandard: "Location, route/marked area, map/satellite style, camera movement and narration/music are captured.",
    customerReadyDefinition: "Customer receives a route/location video plan or final with map/drone flow and usable delivery link.",
    checklist: ["Location/address is captured", "Route or marked area is documented", "Camera/map style is clear", "Voice/music/subtitle choices are recorded", ...SHARED_MEDIA],
    acceptanceCriteria: ["Location/route is unambiguous", "Shot/map flow exists", "Final/preview path exists"],
    commonRisks: ["Missing location", "No route/marked area", "Wrong map style"],
    adminReviewFocus: ["Check location/route", "Check map refs", "Check final media"]
  }),
  live_sales_agent: profile({
    label: "Live sales agent quality",
    minimumStandard: "Brand/product, persona, platform, fair-use hours, human fallback and pay-as-you-go API policy are clear.",
    customerReadyDefinition: "Customer receives a live-agent operating plan with scripts, FAQ, compliance and provider readiness notes.",
    checklist: ["Brand/product and target platform are defined", "Host persona and voice/avatar setup are documented", "Fair-use/API cost policy is explicit", "Human fallback and compliance notes exist", ...SHARED_PROJECT],
    acceptanceCriteria: ["No unlimited live/API promise", "Human fallback exists", "Provider readiness is documented"],
    commonRisks: ["Overpromising live hours", "No product FAQ", "No compliance note"],
    adminReviewFocus: ["Check fair-use policy", "Check compliance/human fallback", "Check provider readiness"]
  }),
  studio: profile({
    label: "Studio / series-film quality",
    minimumStandard: "Script brief, scene plan, character breakdown and trailer/film bible are coherent.",
    customerReadyDefinition: "Customer receives a production bible/plan or trailer direction ready for next production step.",
    checklist: ["Script/idea is summarized", "Scene plan exists", "Character breakdown exists", "Trailer/series bible notes are included", ...SHARED_MEDIA],
    acceptanceCriteria: ["Story structure is clear", "Characters/scenes are documented", "Delivery package exists"],
    commonRisks: ["No scene structure", "No character continuity", "Unclear trailer/series scope"],
    adminReviewFocus: ["Check script/scene plan", "Check character breakdown", "Check delivery package"]
  }),
  drama: profile({
    label: "Drama / short series quality",
    minimumStandard: "Hook, characters, episode/scene arc, dialogue/voice and cliffhanger/social cut plan are clear.",
    customerReadyDefinition: "Customer receives a short-drama production package with hook-first structure and final/social delivery path.",
    checklist: ["Opening hook is explicit", "Characters and relationships are listed", "Scene/episode arc exists", "Dialogue/voice/subtitle/music choices are documented", ...SHARED_MEDIA],
    acceptanceCriteria: ["Hook-first structure exists", "Character/scene continuity exists", "Final/social delivery path exists"],
    commonRisks: ["Weak hook", "Missing character motives", "No cliffhanger/social cut plan"],
    adminReviewFocus: ["Check hook", "Check characters/scenes", "Check final/social cuts"]
  }),
  cinematic_video: profile({
    label: "Cinematic video quality",
    minimumStandard: "Cinematic tone, shot direction, premium visual style, music/voice and final delivery are clear.",
    customerReadyDefinition: "Customer receives a premium cinematic preview/final with shot and delivery notes.",
    checklist: ["Cinematic intent is specific", "Shot/camera direction exists", "Music/voice/subtitle notes are included", "Final MP4/preview path exists", ...SHARED_MEDIA],
    acceptanceCriteria: ["Looks/reads premium", "Shot direction exists", "Final delivery link exists"],
    commonRisks: ["Generic cinematic wording", "No shot direction", "No final format"],
    adminReviewFocus: ["Check shot plan", "Check final MP4", "Check platform format"]
  }),
  video_clipping: profile({
    label: "Video clipping quality",
    minimumStandard: "Source video, moment criteria, hook extraction, subtitle/caption and social format are clear.",
    customerReadyDefinition: "Customer receives short clips or clipping plan with hook/scene logic and download path.",
    checklist: ["Source video/material is identified", "Moment criteria are documented", "Hook/social cut notes exist", "Subtitle/cover/caption choices are recorded", ...SHARED_MEDIA],
    acceptanceCriteria: ["Has source/moment criteria", "Has social cut format", "Final/preview path exists"],
    commonRisks: ["No source video", "No hook criteria", "Wrong social format"],
    adminReviewFocus: ["Check source", "Check clip criteria", "Check final files"]
  }),
  avatar: profile({
    label: "Avatar quality",
    minimumStandard: "Avatar identity/persona, visual style, usage context and optional video/voice path are clear.",
    customerReadyDefinition: "Customer receives avatar assets or video plan with persona, visual direction and delivery files.",
    checklist: ["Avatar persona is defined", "Visual style/use case is clear", "Voice/video/lip-sync choices are documented", "Asset/source delivery is attached", ...SHARED_BRAND],
    acceptanceCriteria: ["Avatar identity is consistent", "Delivery files exist", "Usage notes exist"],
    commonRisks: ["Unclear persona", "No usage notes", "Missing source assets"],
    adminReviewFocus: ["Check persona/style", "Check asset files", "Check usage notes"]
  }),
  lip_sync: profile({
    label: "Lip-sync video quality",
    minimumStandard: "Face/avatar source, audio/script, sync target, subtitles and final MP4 path are documented.",
    customerReadyDefinition: "Customer receives lip-sync video preview/final with clear source/audio mapping.",
    checklist: ["Face/avatar source is identified", "Audio/script source is identified", "Sync/subtitle target is documented", "Final MP4/preview path exists", ...SHARED_MEDIA],
    acceptanceCriteria: ["Source/audio mapping is clear", "Lip-sync output path exists", "Revision scope is clear"],
    commonRisks: ["Missing source face", "Missing audio", "No subtitle plan"],
    adminReviewFocus: ["Check face/audio sources", "Check final MP4", "Check rights/materials"]
  }),
  voice_clone: profile({
    label: "Voice clone quality",
    minimumStandard: "Voice reference, clean vocal plan, narration/language target and usage rules are clear.",
    customerReadyDefinition: "Customer receives voice workflow output/plan with clear usage and consent constraints.",
    checklist: ["Voice reference material is documented", "Clean vocal/extraction need is clear", "Language/tone/use case is defined", "Usage/consent rules are included", ...SHARED_MEDIA],
    acceptanceCriteria: ["Voice source and consent are clear", "Usage rules exist", "Delivery files/notes exist"],
    commonRisks: ["No consent/usage note", "Poor reference source", "No language/tone target"],
    adminReviewFocus: ["Check voice material", "Check consent/usage rules", "Check delivery files"]
  }),
  visual_clone: profile({
    label: "Visual clone / style quality",
    minimumStandard: "Reference role, style/look target, new-output intent and originality boundary are clear.",
    customerReadyDefinition: "Customer receives new visual assets inspired by references with usage notes and final files.",
    checklist: ["Reference role is clear", "Style/look target is documented", "New output intent is original", "Final assets/ZIP are attached", ...SHARED_BRAND],
    acceptanceCriteria: ["Reference is not copied one-to-one", "New output target exists", "Final assets exist"],
    commonRisks: ["Reference copying", "Unclear style vs subject role", "Missing final files"],
    adminReviewFocus: ["Check reference safety", "Check final assets", "Check usage notes"]
  }),
  video_tools: profile({
    label: "Video tools quality",
    minimumStandard: "Input type, selected tool operation, motion/control notes, watermark policy and output delivery are clear.",
    customerReadyDefinition: "Customer receives the requested tool output with input/output notes and final download path.",
    checklist: ["Input type is documented", "Tool operation is clear", "Watermark/rights policy is recorded", "Final output link exists", ...SHARED_MEDIA],
    acceptanceCriteria: ["Operation matches request", "Rights/watermark note exists", "Final link exists"],
    commonRisks: ["Wrong tool operation", "No rights confirmation", "Missing output link"],
    adminReviewFocus: ["Check input/operation", "Check watermark rights", "Check final output"]
  }),
  stickman_animation: profile({
    label: "Stickman animation quality",
    minimumStandard: "Simple script, stickman scene flow, voice/music/subtitle choices and final social format are clear.",
    customerReadyDefinition: "Customer receives stickman animation preview/final or source plan with clear story flow.",
    checklist: ["Short script/topic is clear", "Scene flow exists", "Voice/music/subtitle options are recorded", "Final MP4/preview path exists", ...SHARED_MEDIA],
    acceptanceCriteria: ["Scene flow is understandable", "Style is stickman/line-art", "Final/preview link exists"],
    commonRisks: ["Too complex for stickman", "No scene flow", "No final format"],
    adminReviewFocus: ["Check script/scene flow", "Check final MP4", "Check social format"]
  }),
  music_video: profile({
    label: "Music video / MV quality",
    minimumStandard: "Song/audio reference, visual concept, lyric/beat moments, performance/social cuts and final delivery are clear.",
    customerReadyDefinition: "Customer receives MV/visualizer delivery with song reference mapping, scene plan and final/social outputs.",
    checklist: ["Song/audio or lyric source is captured", "Visual concept is defined", "Lyric/beat/performance moments are documented", "Final/social delivery path exists", ...SHARED_MEDIA],
    acceptanceCriteria: ["Audio reference is mapped", "Beat/lyric moments exist", "Final/preview path exists"],
    commonRisks: ["No song reference", "No rhythm plan", "Missing performer/reference roles"],
    adminReviewFocus: ["Check audio/material groups", "Check scene/beat plan", "Check final MP4"]
  }),
  website: profile({
    label: "Website quality",
    minimumStandard: "Responsive page scope, content sections, source package, README and setup/deploy notes are ready.",
    customerReadyDefinition: "Customer can preview the website and download source/setup notes for handoff or deployment.",
    checklist: ["Page count and site type are clear", "Responsive preview/screenshots exist", "Source ZIP and README are attached", "Setup/deploy/env notes are included", ...SHARED_PROJECT],
    acceptanceCriteria: ["Preview or screenshots exist", "Source ZIP/README exist", "Scope matches package"],
    commonRisks: ["No source guide", "Missing responsive notes", "Unclear page count"],
    adminReviewFocus: ["Check preview", "Check source ZIP", "Check README/setup"]
  }),
  saas: profile({
    label: "SaaS quality",
    minimumStandard: "Dashboard modules, auth/billing/admin scope, schema notes and source handoff are ready.",
    customerReadyDefinition: "Customer receives SaaS source/preview package with module map and setup notes.",
    checklist: ["Core modules are listed", "Auth/billing/admin scope is documented", "Schema/env notes exist", "Source ZIP/README are attached", ...SHARED_PROJECT],
    acceptanceCriteria: ["Module map exists", "Setup/source handoff exists", "Admin/billing notes match scope"],
    commonRisks: ["No schema notes", "No admin scope", "Missing env/setup guide"],
    adminReviewFocus: ["Check module map", "Check source ZIP", "Check setup/schema notes"]
  }),
  mobile_app: profile({
    label: "Mobile app quality",
    minimumStandard: "Screen list, platform target, Expo/source package, build notes and app preview are ready.",
    customerReadyDefinition: "Customer receives mobile app source/preview package with build/setup notes.",
    checklist: ["Screen count/list is clear", "iOS/Android/Expo target is documented", "Source ZIP and README are attached", "Build/setup notes exist", ...SHARED_PROJECT],
    acceptanceCriteria: ["Screen map exists", "Source/build notes exist", "Preview/screenshots exist"],
    commonRisks: ["No build guide", "Missing screen list", "Unclear platform target"],
    adminReviewFocus: ["Check screen list", "Check Expo/source ZIP", "Check build notes"]
  }),
  image: profile({
    label: "Image / visual quality",
    minimumStandard: "Visual type, output count, platform size/use case and downloadable assets are ready.",
    customerReadyDefinition: "Customer receives visual previews/files with usage notes for social/store/brand use.",
    checklist: ["Visual type/use case is clear", "Output count/variants are documented", "Platform size/format is recorded", "Final files or ZIP are attached", ...SHARED_BRAND],
    acceptanceCriteria: ["Final visual files exist", "Use case/platform is clear", "Usage notes exist"],
    commonRisks: ["Wrong format", "No downloadable asset", "No usage notes"],
    adminReviewFocus: ["Check final assets", "Check formats", "Check usage notes"]
  }),
  brand_kit: profile({
    label: "Brand kit quality",
    minimumStandard: "Logo/palette/typography/social kit and brand usage notes are packaged.",
    customerReadyDefinition: "Customer receives brand assets and usage rules in downloadable package.",
    checklist: ["Logo/palette/typography scope is clear", "Social asset sizes are included when selected", "Usage/brand notes exist", "Final/source ZIP is attached", ...SHARED_BRAND],
    acceptanceCriteria: ["Brand files exist", "Usage notes exist", "Source/vector notes exist when requested"],
    commonRisks: ["No usage guide", "Missing source/vector files", "Inconsistent assets"],
    adminReviewFocus: ["Check asset ZIP", "Check brand guide", "Check formats"]
  }),
  document_pack: profile({
    label: "Document / file pack quality",
    minimumStandard: "Document purpose, final file, editable/source notes and ZIP/package are ready.",
    customerReadyDefinition: "Customer receives final document/PDF and source/editable notes through dashboard.",
    checklist: ["Document type/purpose is clear", "Final PDF/document is attached", "Editable/source notes exist", "ZIP/README is attached when requested", ...SHARED_PROJECT],
    acceptanceCriteria: ["Final document exists", "Editable/source note exists", "Delivery package exists"],
    commonRisks: ["No editable source", "Missing final PDF", "Unclear document purpose"],
    adminReviewFocus: ["Check final document", "Check source notes", "Check ZIP/README"]
  }),
  admin_project: profile({
    label: "Admin panel project quality",
    minimumStandard: "Dashboard screens, CRUD modules, role notes, schema guide and source README are ready.",
    customerReadyDefinition: "Customer receives admin project source/preview with role/module/database handoff notes.",
    checklist: ["Admin modules are listed", "Roles/permissions are documented", "Schema/CRUD guide exists", "Source ZIP and README are attached", ...SHARED_PROJECT],
    acceptanceCriteria: ["Admin scope is clear", "Schema/roles notes exist", "Source handoff exists"],
    commonRisks: ["No role notes", "No schema guide", "Missing source ZIP"],
    adminReviewFocus: ["Check modules/roles", "Check schema guide", "Check source ZIP"]
  })
};

export function qualityProfileForProduction(productionType: string, packageId = ""): ProductionQualityProfile {
  const normalized = String(productionType || "video") as ProductionType;
  const base = productionQualityProfiles[normalized] ?? productionQualityProfiles.video;
  const packageNote = packageId ? `Package: ${packageId}` : "Package: selected production package";
  return {
    productionType: normalized,
    ...base,
    checklist: [...base.checklist, packageNote],
    acceptanceCriteria: [...base.acceptanceCriteria]
  };
}

export function productionQualityCoverage() {
  return Object.keys(productionQualityProfiles);
}
