import { estimateProductionCost } from "../src/lib/production.ts";
import { buildAssistantProductionPayload, packageIdFromSelection } from "../src/lib/production-payload.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const ecommerceSelection = {
  input: "E-ticaret sitesi istiyorum, Shopify tarzı ürün sayfası ve sepet olsun",
  selectedStyle: "E-commerce Product",
  selectedQuality: "1080p premium",
  selectedDuration: "Proje bazlı",
  selectedModules: ["Web sitesi", "E-ticaret ürün paketi", "Marketplace listeleme", "Admin panel"],
  selectedFeatures: ["Kaynak dosya teslimi", "Final ZIP", "README", "Revizyon hakkı"],
  selectedPlatforms: ["Dashboard teslim", "ZIP kaynak", "Shopify", "WooCommerce"],
  selectedMaterials: [],
  quickProviderTest: false
};

const ecommercePackage = packageIdFromSelection("website", ecommerceSelection);
const ecommercePayload = buildAssistantProductionPayload({
  ...ecommerceSelection,
  productionType: "website",
  packageId: ecommercePackage,
  prompt: ecommerceSelection.input,
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com"
});

assertEqual(ecommercePackage, "website_ecommerce_admin", "ecommerce package");
assertEqual(ecommercePayload.production_type, "website", "ecommerce production_type");
assertEqual(ecommercePayload.workflow_mode, "project", "ecommerce workflow_mode");
assertEqual(ecommercePayload.technical_stack, "Next.js / React responsive website", "ecommerce technical_stack");
assertEqual(ecommercePayload.store_platform, "Shopify", "ecommerce store_platform");
assertEqual(ecommercePayload.source_delivery, "source_zip", "ecommerce source_delivery");
assertEqual(ecommercePayload.product_page_notes, ecommerceSelection.input, "ecommerce product_page_notes");

const mobileSelection = {
  input: "Mobil uygulama istiyorum, Expo kaynak dosyası ve admin panel olsun",
  selectedStyle: "App demo",
  selectedQuality: "1080p premium",
  selectedDuration: "Proje bazlı",
  selectedModules: ["Mobil app", "Admin panel"],
  selectedFeatures: ["Kaynak dosya teslimi", "Final ZIP", "README", "Revizyon hakkı"],
  selectedPlatforms: ["Dashboard teslim", "ZIP kaynak"],
  selectedMaterials: [],
  quickProviderTest: false
};

const mobilePackage = packageIdFromSelection("mobile_app", mobileSelection);
const mobilePayload = buildAssistantProductionPayload({
  ...mobileSelection,
  productionType: "mobile_app",
  packageId: mobilePackage,
  prompt: mobileSelection.input,
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com"
});

assertEqual(mobilePackage, "mobile_admin", "mobile package");
assertEqual(mobilePayload.production_type, "mobile_app", "mobile production_type");
assertEqual(mobilePayload.workflow_mode, "project", "mobile workflow_mode");
assertEqual(mobilePayload.technical_stack, "Expo / React Native starter", "mobile technical_stack");
assertEqual(mobilePayload.source_delivery, "source_zip", "mobile source_delivery");

const workingSourcePayload = buildAssistantProductionPayload({
  ...mobileSelection,
  selectedFeatures: [...mobileSelection.selectedFeatures, "Working source package"],
  productionType: "mobile_app",
  packageId: "mobile_admin",
  prompt: mobileSelection.input,
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com",
  deliveryLevel: "working_source_package"
});
assertEqual(workingSourcePayload.delivery_level, "working_source_package", "working source delivery_level");
assertEqual(workingSourcePayload.source_delivery, "working_source_zip", "working source delivery source");
if (!String(workingSourcePayload.features).includes("Working source package")) throw new Error("working source feature missing from payload");

const animeSelection = {
  input: "Anime short film üret, karakterler konuşsun ve çocuk sesi seçeneği olsun",
  selectedStyle: "Anime cinematic",
  selectedQuality: "1080p premium",
  selectedDuration: "60 sec",
  selectedModules: ["Anime short film", "Anime style selection", "Character setup", "Dialogue scene"],
  selectedFeatures: ["Script", "Scene plan", "Child voices", "Subtitles", "Revision right"],
  selectedPlatforms: ["Dashboard delivery", "MP4 download"],
  selectedMaterials: ["clipora-social-brand-pack"],
  quickProviderTest: false
};

const animePackage = packageIdFromSelection("anime_short_film", animeSelection);
const animePayload = buildAssistantProductionPayload({
  ...animeSelection,
  productionType: "anime_short_film",
  packageId: animePackage,
  prompt: animeSelection.input,
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com"
});

assertEqual(animePackage, "anime_short_film_pack", "anime package");
assertEqual(animePayload.production_type, "anime_short_film", "anime production_type");
assertEqual(animePayload.workflow_mode, "media", "anime workflow_mode");
assertEqual(animePayload.selected_material_ids[0], "clipora-social-brand-pack", "anime selected material");

const watermarkSelection = {
  input: "Görselden video üret ve filigransız final teslim et",
  selectedStyle: "Cinematic",
  selectedQuality: "1080p",
  selectedDuration: "30 sec",
  selectedModules: ["Image-to-video", "Watermark control"],
  selectedFeatures: ["Watermark-free final delivery", "Rights confirmation"],
  selectedPlatforms: ["Dashboard delivery", "MP4 download"],
  selectedMaterials: [],
  quickProviderTest: false
};

assertEqual(packageIdFromSelection("video_tools", watermarkSelection), "video_watermark_control", "watermark package");

const animalSelection = {
  input: "Komik hayvan videosu yap, kendi seslendirmem ve arka fon müziği olsun",
  selectedStyle: "Funny",
  selectedQuality: "1080p",
  selectedDuration: "15 sec",
  selectedModules: ["Animal video", "Funny animal short", "User audio upload"],
  selectedFeatures: ["Own voice-over", "Background music", "Emotion-matched music"],
  selectedPlatforms: ["Dashboard delivery", "MP4 download"],
  selectedMaterials: [],
  quickProviderTest: false
};

const animalCinematicSelection = { ...animalSelection, input: "3D sinematik heyecanlı hayvan videosu", selectedStyle: "3D animation", selectedModules: ["Animal video", "3D animal video"] };
assertEqual(packageIdFromSelection("animal_video", animalSelection), "animal_funny_short", "animal funny package");
assertEqual(packageIdFromSelection("animal_video", animalCinematicSelection), "animal_cinematic_pack", "animal cinematic package");

const natureSelection = { ...animalSelection, input: "Doğa belgeseli için orman ve vahşi yaşam videosu", selectedStyle: "Documentary", selectedModules: ["Nature video", "Documentary"] };
assertEqual(packageIdFromSelection("nature_video", natureSelection), "nature_documentary_pack", "nature documentary package");

const planetSelection = { ...animalSelection, input: "Sinematik 3D gezegen ve galaksi videosu", selectedStyle: "Cinematic", selectedModules: ["Planet video", "3D space visual"] };
assertEqual(packageIdFromSelection("planet_space_video", planetSelection), "planet_cinematic_pack", "planet cinematic package");

const droneSelection = {
  ...animalSelection,
  input: "İstanbul Boğazı için uydu görüntüsü intro ve drone rota videosu hazırla",
  selectedStyle: "Cinematic",
  selectedDuration: "60 sec",
  selectedModules: ["Drone-style aerial video", "AI map/location drone-style video", "Satellite-view intro", "Route/path plan", "Voice-over"],
  selectedFeatures: ["Scene plan", "Marked area notes", "Voice-over", "Subtitles", "Music", "Revision right"]
};
const dronePackage = packageIdFromSelection("drone_video", droneSelection);
const dronePayload = buildAssistantProductionPayload({
  ...droneSelection,
  productionType: "drone_video",
  packageId: dronePackage,
  prompt: droneSelection.input,
  optionSummary: "Drone location/address: İstanbul Boğazı\nDrone route/path: Ortaköy to Rumeli Hisarı\nMarked map/satellite area: bridge, waterfront, skyline\nDrone shot type: Satellite intro + drone flyover\nDrone map style: Hybrid map + labels\nDrone camera movement: Smooth flyover route\nDrone visual style: Cinematic real estate\nDrone narration language: Turkish voice-over\nDrone subtitle option: Location labels only\nDrone music style: Cinematic ambient music",
  userId: "user-1",
  userEmail: "user@example.com",
  uploadedMaterials: [
    { type: "user_upload", reference_type: "drone_map_reference", title: "map.png", file_url: "https://cdn.example.com/map.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "drone_map_reference"] },
    { type: "user_upload", reference_type: "drone_route_reference", title: "route.png", file_url: "https://cdn.example.com/route.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "drone_route_reference"] },
    { type: "user_upload", reference_type: "drone_location_visual", title: "location.jpg", file_url: "https://cdn.example.com/location.jpg", content_type: "image/jpeg", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "drone_location_visual"] },
    { type: "user_upload", reference_type: "drone_style_reference", title: "style.mp4", file_url: "https://cdn.example.com/style.mp4", content_type: "video/mp4", size_bytes: 4096, kind: "video", rights_confirmed: true, usage_tags: ["user-upload", "drone_style_reference"] }
  ]
});
assertEqual(dronePackage, "drone_satellite_story", "drone satellite package");
assertEqual(dronePayload.production_type, "drone_video", "drone production_type");
assertEqual(dronePayload.workflow_mode, "media", "drone workflow_mode");
if (!String(dronePayload.project_details).includes("Marked map/satellite area")) throw new Error("drone marked area notes missing from project details");
assertEqual(dronePayload.drone_details?.shotType, "Satellite intro + drone flyover", "drone shotType");
assertEqual(dronePayload.drone_details?.mapStyle, "Hybrid map + labels", "drone mapStyle");
assertEqual(dronePayload.drone_details?.cameraMovement, "Smooth flyover route", "drone cameraMovement");
assertEqual(dronePayload.drone_details?.visualStyle, "Cinematic real estate", "drone visualStyle");
assertEqual(dronePayload.drone_details?.narrationLanguage, "Turkish voice-over", "drone narrationLanguage");
assertEqual(dronePayload.drone_details?.subtitleOption, "Location labels only", "drone subtitleOption");
assertEqual(dronePayload.drone_details?.musicStyle, "Cinematic ambient music", "drone musicStyle");
assertEqual(dronePayload.drone_details?.materialGroups.mapReference[0], "https://cdn.example.com/map.png", "drone map reference group");
assertEqual(dronePayload.drone_details?.materialGroups.routeReference[0], "https://cdn.example.com/route.png", "drone route reference group");
assertEqual(dronePayload.drone_details?.materialGroups.locationVisual[0], "https://cdn.example.com/location.jpg", "drone location visual group");
assertEqual(dronePayload.drone_details?.materialGroups.styleReference[0], "https://cdn.example.com/style.mp4", "drone style reference group");

const liveSalesSelection = {
  ...animalSelection,
  input: "AI live sales agent pro 40h fair-use multi-platform product selling",
  selectedStyle: "Gen Z TikTok seller",
  selectedQuality: "Pro $799/mo - 40h fair use",
  selectedDuration: "40h/month fair use",
  selectedModules: ["AI live sales agent", "Product link selling", "Live chat reply agent", "OBS/stream setup", "Pay-as-you-go API cost analysis"],
  selectedFeatures: ["Sales script", "Live FAQ", "Objection handling", "CTA/discount playbook", "Compliance review", "Fair-use hours policy", "Pay-as-you-go API cost estimate"],
  selectedPlatforms: ["TikTok Live", "YouTube Live", "Twitch"]
};
const liveSalesPackage = packageIdFromSelection("live_sales_agent", liveSalesSelection);
const liveSalesPayload = buildAssistantProductionPayload({
  ...liveSalesSelection,
  productionType: "live_sales_agent",
  packageId: liveSalesPackage,
  prompt: liveSalesSelection.input,
  optionSummary: "Live sales product link/details: https://example.com/product\nLive sales brand name: GlowSkin\nLive sales product category: skincare\nLive sales target market/language: US / English\nLive sales target platform: TikTok Live\nLive sales persona: Gen Z TikTok seller\nLive sales avatar source: Use uploaded self avatar\nLive sales avatar style: TikTok creator style\nLive sales voice source: Use uploaded own voice\nLive sales voice/language: English multilingual support\nLive sales voice tone: Friendly persuasive seller\nLive sales background: Branded live commerce studio\nLive sales visual style: Social commerce vertical live room\nLive sales subtitle option: Clean live captions\nLive sales interaction mode: Live chat FAQ + sales replies\nLive sales stream goal: Product sales\nLive sales human fallback: Escalate refunds and sensitive claims to a human\nLive sales provider readiness: OBS/RTMP setup needed\nLive sales CTA/discount: LIVE10\nLive sales compliance notes: AI disclosure + human fallback policy\nLive sales credit policy: No included credits; 40h/month fair use; extra provider/API hours are pay-as-you-go after cost analysis",
  userId: "user-1",
  userEmail: "user@example.com",
  uploadedMaterials: [
    { type: "user_upload", reference_type: "live_sales_own_voice", title: "host-voice.wav", file_url: "https://cdn.example.com/host-voice.wav", content_type: "audio/wav", size_bytes: 2048, kind: "audio", rights_confirmed: true, usage_tags: ["user-upload", "live_sales_own_voice"] },
    { type: "user_upload", reference_type: "live_sales_self_avatar", title: "self-avatar.png", file_url: "https://cdn.example.com/self-avatar.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "live_sales_self_avatar"] },
    { type: "user_upload", reference_type: "live_sales_avatar_reference", title: "avatar-ref.png", file_url: "https://cdn.example.com/avatar-ref.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "live_sales_avatar_reference"] },
    { type: "user_upload", reference_type: "live_sales_background", title: "studio.png", file_url: "https://cdn.example.com/studio.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "live_sales_background"] },
    { type: "user_upload", reference_type: "live_sales_product_visual", title: "product.png", file_url: "https://cdn.example.com/product.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "live_sales_product_visual"] }
  ]
});
assertEqual(liveSalesPackage, "live_commerce_stream_pack", "live sales pro package");
assertEqual(liveSalesPayload.production_type, "live_sales_agent", "live sales production_type");
assertEqual(liveSalesPayload.workflow_mode, "media", "live sales workflow_mode");
if (!String(liveSalesPayload.project_details).includes("No included credits")) throw new Error("live sales no included credits note missing");
if (!String(liveSalesPayload.project_details).includes("40h/month fair use")) throw new Error("live sales fair-use hours note missing");
if (!String(liveSalesPayload.live_sales_agent_details?.creditPolicy ?? "").includes("pay-as-you-go")) throw new Error("live sales pay-as-you-go credit policy missing");
assertEqual(liveSalesPayload.live_sales_agent_details?.brandName, "GlowSkin", "live sales brandName");
assertEqual(liveSalesPayload.live_sales_agent_details?.avatarSource, "Use uploaded self avatar", "live sales avatarSource");
assertEqual(liveSalesPayload.live_sales_agent_details?.avatarStyle, "TikTok creator style", "live sales avatarStyle");
assertEqual(liveSalesPayload.live_sales_agent_details?.voiceSource, "Use uploaded own voice", "live sales voiceSource");
assertEqual(liveSalesPayload.live_sales_agent_details?.voiceTone, "Friendly persuasive seller", "live sales voiceTone");
assertEqual(liveSalesPayload.live_sales_agent_details?.background, "Branded live commerce studio", "live sales background");
assertEqual(liveSalesPayload.live_sales_agent_details?.visualStyle, "Social commerce vertical live room", "live sales visualStyle");
assertEqual(liveSalesPayload.live_sales_agent_details?.subtitleOption, "Clean live captions", "live sales subtitleOption");
assertEqual(liveSalesPayload.live_sales_agent_details?.streamGoal, "Product sales", "live sales streamGoal");
assertEqual(liveSalesPayload.live_sales_agent_details?.providerReadiness, "OBS/RTMP setup needed", "live sales providerReadiness");
assertEqual(liveSalesPayload.live_sales_agent_details?.materialGroups.ownVoice[0], "https://cdn.example.com/host-voice.wav", "live sales own voice group");
assertEqual(liveSalesPayload.live_sales_agent_details?.materialGroups.selfAvatar[0], "https://cdn.example.com/self-avatar.png", "live sales self avatar group");
assertEqual(liveSalesPayload.live_sales_agent_details?.materialGroups.avatarReference[0], "https://cdn.example.com/avatar-ref.png", "live sales avatar reference group");
assertEqual(liveSalesPayload.live_sales_agent_details?.materialGroups.background[0], "https://cdn.example.com/studio.png", "live sales background group");
assertEqual(liveSalesPayload.live_sales_agent_details?.materialGroups.productVisual[0], "https://cdn.example.com/product.png", "live sales product visual group");

const dramaSelection = {
  ...animalSelection,
  input: "Viral kısa dizi drama üret, ilk sahnede güçlü hook olsun",
  selectedStyle: "Short drama",
  selectedDuration: "Scene 1-3 min",
  selectedModules: ["Drama / short series", "Script + scene plan", "Character breakdown", "AI video", "Voice-over"],
  selectedFeatures: ["Script", "Scene plan", "Character breakdown", "Dialogue", "Viral hook", "Voice-over", "Subtitles", "Music", "Revision right"],
  selectedPlatforms: ["Dashboard delivery", "MP4 download", "TikTok", "Instagram Reels", "YouTube Shorts"]
};
const dramaPackage = packageIdFromSelection("drama", dramaSelection);
const dramaPayload = buildAssistantProductionPayload({
  ...dramaSelection,
  productionType: "drama",
  packageId: dramaPackage,
  prompt: dramaSelection.input,
  optionSummary: "Format: viral short film\nCharacters: 2 leads\nHook: betrayal reveal\nDrama format: Viral short film\nDrama genre/tone: Betrayal / revenge\nDrama structure: 3 scenes\nDrama characters: 2 leads\nDrama hook type: Betrayal reveal\nDrama dialogue/voice: Dialogue scene + subtitles",
  userId: "user-1",
  userEmail: "user@example.com"
});
assertEqual(dramaPackage, "drama_episode_pack", "drama package");
assertEqual(dramaPayload.production_type, "drama", "drama production_type");
assertEqual(dramaPayload.workflow_mode, "media", "drama workflow_mode");
assertEqual(dramaPayload.drama_details.format, "Viral short film", "drama format detail");
assertEqual(dramaPayload.drama_details.hookType, "Betrayal reveal", "drama hook detail");
if (!String(dramaPayload.project_modules).includes("Drama / short series")) throw new Error("drama modules missing from payload");

const uploadPayload = buildAssistantProductionPayload({
  ...animalSelection,
  productionType: "animal_video",
  packageId: "animal_funny_short",
  prompt: animalSelection.input,
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com",
  uploadedMaterials: [{
    type: "user_upload",
    reference_type: "voiceover",
    title: "voice.wav",
    file_url: "https://cdn.example.com/voice.wav",
    content_type: "audio/wav",
    size_bytes: 1024,
    kind: "audio",
    rights_confirmed: true,
    usage_tags: ["user-upload", "voiceover"]
  }]
});
assertEqual(uploadPayload.uploaded_materials[0].title, "voice.wav", "uploaded material payload");
assertEqual(uploadPayload.voiceover_reference_link, "https://cdn.example.com/voice.wav", "voiceover upload link");

const musicVideoUploadPayload = buildAssistantProductionPayload({
  ...animalSelection,
  input: "Kendi şarkım, kendi görüntüm ve başka kişi referansı ile müzik klip üret",
  selectedStyle: "Performance clip",
  selectedModules: ["Music video", "Own image/avatar", "Own voice/song", "Another person/artist"],
  selectedFeatures: ["User music reference", "Own voice-over", "Subtitles", "Revision right"],
  productionType: "music_video",
  packageId: "music_cinematic_mv",
  prompt: "Kendi şarkım, kendi görüntüm ve başka kişi referansı ile müzik klip üret",
  optionSummary: "test summary",
  userId: "user-1",
  userEmail: "user@example.com",
  uploadedMaterials: [
    { type: "user_upload", reference_type: "song_audio", title: "song.wav", file_url: "https://cdn.example.com/song.wav", content_type: "audio/wav", size_bytes: 2048, kind: "audio", rights_confirmed: true, usage_tags: ["user-upload", "song_audio"] },
    { type: "user_upload", reference_type: "own_voice", title: "vocal.wav", file_url: "https://cdn.example.com/vocal.wav", content_type: "audio/wav", size_bytes: 2048, kind: "audio", rights_confirmed: true, usage_tags: ["user-upload", "own_voice"] },
    { type: "user_upload", reference_type: "own_image_avatar", title: "me.png", file_url: "https://cdn.example.com/me.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "own_image_avatar"] },
    { type: "user_upload", reference_type: "another_person_reference", title: "artist.png", file_url: "https://cdn.example.com/artist.png", content_type: "image/png", size_bytes: 1024, kind: "image", rights_confirmed: true, usage_tags: ["user-upload", "another_person_reference"] },
    { type: "user_upload", reference_type: "performance_video_reference", title: "stage.mp4", file_url: "https://cdn.example.com/stage.mp4", content_type: "video/mp4", size_bytes: 4096, kind: "video", rights_confirmed: true, usage_tags: ["user-upload", "performance_video_reference"] }
  ]
});
assertEqual(musicVideoUploadPayload.production_type, "music_video", "music video upload production_type");
assertEqual(musicVideoUploadPayload.song_audio_link, "https://cdn.example.com/song.wav", "music video song audio link");
assertEqual(musicVideoUploadPayload.voiceover_reference_link, "https://cdn.example.com/vocal.wav", "music video own voice link");
assertEqual(musicVideoUploadPayload.music_video_material_groups.song_audio[0], "https://cdn.example.com/song.wav", "music video song group");
assertEqual(musicVideoUploadPayload.music_video_material_groups.own_image_avatar[0], "https://cdn.example.com/me.png", "music video own image group");
assertEqual(musicVideoUploadPayload.music_video_material_groups.another_person_reference[0], "https://cdn.example.com/artist.png", "music video another person group");
assertEqual(musicVideoUploadPayload.music_video_material_groups.performance_video_reference[0], "https://cdn.example.com/stage.mp4", "music video performance video group");

const uploadCost = estimateProductionCost("animal_funny_short", {
  productionType: "animal_video",
  materialCount: 1,
  materialBytes: 26 * 1024 * 1024
});
if (!uploadCost.costNotes.some((note) => note.includes("Uploaded material storage and transfer allowance"))) {
  throw new Error("uploaded material byte allowance missing from cost notes");
}
if (!uploadCost.costNotes.some((note) => note.includes("Final video delivery and download/share allowance"))) {
  throw new Error("final video delivery allowance missing from video cost notes");
}
assertEqual(uploadCost.singleOutputCredits, 1490, "uploaded material storage and delivery credits");

console.log("production-payload-smoke ok");
