import { packagesForType, type ProductionPackage } from "./production.ts";
import { qualityProfileForProduction } from "./production-quality.ts";

export type UserUploadedMaterial = {
  type: "user_upload";
  reference_type: string;
  title: string;
  file_url: string;
  storage_bucket?: string;
  storage_path?: string;
  content_type: string;
  size_bytes: number;
  kind: "audio" | "video" | "image" | "file";
  rights_confirmed: boolean;
  usage_tags: string[];
};

export type DeliveryLevel = "production_package" | "working_source_package";

export type AssistantProductionSelection = {
  input: string;
  selectedStyle: string;
  selectedQuality: string;
  selectedDuration: string;
  selectedModules: string[];
  selectedFeatures: string[];
  selectedPlatforms: string[];
  selectedMaterials: string[];
  uploadedMaterials?: UserUploadedMaterial[];
  deliveryLevel?: DeliveryLevel;
  quickProviderTest?: boolean;
};

export function packageIdFromSelection(productionType: string, selection: Pick<AssistantProductionSelection, "input" | "selectedStyle" | "selectedQuality" | "selectedDuration" | "selectedModules" | "selectedFeatures" | "selectedPlatforms" | "quickProviderTest">, packageCatalog?: ProductionPackage[]) {
  const availablePackages = (packageCatalog?.length ? packageCatalog : packagesForType(productionType as Parameters<typeof packagesForType>[0])).filter((item) => item.productionType === productionType);
  const packageSignal = `${selection.input} ${selection.selectedStyle} ${selection.selectedQuality} ${selection.selectedDuration} ${selection.selectedModules.join(" ")} ${selection.selectedFeatures.join(" ")} ${selection.selectedPlatforms.join(" ")}`.toLocaleLowerCase("tr-TR");
  const explicitMatch = availablePackages.find((item) => packageSignal.includes(item.id.toLocaleLowerCase("tr-TR")) || packageSignal.includes(item.name.toLocaleLowerCase("tr-TR")));
  if (explicitMatch) return explicitMatch.id;
  const fallbackPackageId = (preferredId: string) => availablePackages.some((item) => item.id === preferredId) ? preferredId : availablePackages[0]?.id ?? preferredId;
  if (selection.quickProviderTest && productionType === "video") return "video_draft";
  if (productionType === "animation") return packageSignal.includes("character") || packageSignal.includes("karakter") ? "animation_character_pack" : "animation_explainer";
  if (productionType === "anime_short_film") return packageSignal.includes("multi") || packageSignal.includes("film") || packageSignal.includes("story") || packageSignal.includes("scene plan") ? "anime_short_film_pack" : "anime_short_scene";
  if (productionType === "animal_video") return packageSignal.includes("cinematic") || packageSignal.includes("sinematik") || packageSignal.includes("3d") || packageSignal.includes("exciting") || packageSignal.includes("heyecan") ? "animal_cinematic_pack" : "animal_funny_short";
  if (productionType === "nature_video") return packageSignal.includes("documentary") || packageSignal.includes("belgesel") || packageSignal.includes("chapter") || packageSignal.includes("series") ? "nature_documentary_pack" : "nature_cinematic_short";
  if (productionType === "planet_space_video") return packageSignal.includes("cinematic") || packageSignal.includes("sinematik") || packageSignal.includes("3d") || packageSignal.includes("galaxy") || packageSignal.includes("universe") ? "planet_cinematic_pack" : "planet_explainer_short";
  if (productionType === "drone_video") return packageSignal.includes("satellite") || packageSignal.includes("uydu") || packageSignal.includes("map") || packageSignal.includes("harita") || packageSignal.includes("route") || packageSignal.includes("rota") ? "drone_satellite_story" : "drone_location_video";
  if (productionType === "live_sales_agent") return fallbackPackageId(packageSignal.includes("agency") || packageSignal.includes("white-label") || packageSignal.includes("white label") || packageSignal.includes("2499") || packageSignal.includes("120h") ? "autonomous_brand_agent" : packageSignal.includes("pro") || packageSignal.includes("799") || packageSignal.includes("40h") || packageSignal.includes("multi-platform") ? "live_commerce_stream_pack" : "live_sales_agent_starter");
  if (productionType === "studio") return packageSignal.includes("trailer") || packageSignal.includes("teaser") || packageSignal.includes("fragman") ? "studio_trailer_teaser" : "studio_series_film";
  if (productionType === "drama") return packageSignal.includes("episode") || packageSignal.includes("bölüm") || packageSignal.includes("bolum") || packageSignal.includes("series") || packageSignal.includes("dizi") ? "drama_episode_pack" : packageSignal.includes("viral") || packageSignal.includes("tiktok") || packageSignal.includes("reels") || packageSignal.includes("shorts") ? "drama_viral_short" : "drama_short_series";
  if (productionType === "cinematic_video") return "cinematic_video_pack";
  if (productionType === "video_clipping") return packageSignal.includes("exciting") || packageSignal.includes("scary") || packageSignal.includes("funny") || packageSignal.includes("heyecan") || packageSignal.includes("korkunç") || packageSignal.includes("komik") ? "video_clipping_moments" : "video_clipping_shorts";
  if (productionType === "avatar") return packageSignal.includes("video") ? "avatar_video" : "avatar_design";
  if (productionType === "lip_sync") return "lip_sync_video";
  if (productionType === "voice_clone") return "voice_clone_pack";
  if (productionType === "visual_clone") return "visual_clone_pack";
  if (productionType === "video_tools") return packageSignal.includes("watermark") || packageSignal.includes("filigran") ? "video_watermark_control" : "video_tools_pack";
  if (productionType === "video" && packageSignal.includes("kesitleme")) return "video_long_film_clipping";
  if (productionType === "video" && (packageSignal.includes("dizi") || packageSignal.includes("film") || packageSignal.includes("fragman") || packageSignal.includes("senaryo"))) return "video_series_film_studio";
  if (productionType === "website" && (packageSignal.includes("e-ticaret") || packageSignal.includes("ecommerce") || packageSignal.includes("e-commerce") || packageSignal.includes("shopify") || packageSignal.includes("woocommerce") || packageSignal.includes("marketplace") || packageSignal.includes("mağaza") || packageSignal.includes("magaza") || packageSignal.includes("sepet") || packageSignal.includes("checkout"))) return "website_ecommerce_admin";
  if (productionType === "website" && packageSignal.includes("admin")) return "website_admin";
  if (productionType === "saas" && packageSignal.includes("shopify")) return "shopify_app_integration";
  if (productionType === "saas" && (packageSignal.includes("admin") || packageSignal.includes("billing") || packageSignal.includes("ödeme"))) return "saas_admin_billing";
  if (productionType === "mobile_app" && packageSignal.includes("admin")) return "mobile_admin";
  if (productionType === "mobile_app" && (packageSignal.includes("expo") || packageSignal.includes("kaynak") || packageSignal.includes("zip"))) return "mobile_expo";
  if (selection.selectedStyle.toLowerCase().includes("sinematik")) return availablePackages.find((item) => item.id.includes("cinematic"))?.id ?? availablePackages.at(-1)?.id ?? "video_premium";
  if (selection.selectedQuality.toLowerCase().includes("4k")) return availablePackages.at(-1)?.id ?? "video_premium";
  return availablePackages[1]?.id ?? availablePackages[0]?.id ?? "video_premium";
}

export function storePlatformFromSelection(selection: Pick<AssistantProductionSelection, "input" | "selectedPlatforms" | "selectedModules">) {
  const signal = `${selection.input} ${selection.selectedPlatforms.join(" ")} ${selection.selectedModules.join(" ")}`.toLocaleLowerCase("tr-TR");
  if (signal.includes("shopify")) return "Shopify";
  if (signal.includes("woocommerce")) return "WooCommerce";
  if (signal.includes("trendyol")) return "Trendyol";
  if (signal.includes("amazon")) return "Amazon Seller";
  if (signal.includes("marketplace")) return "Marketplace";
  return "Custom store";
}

export function technicalStackFromSelection(productionType: string) {
  if (productionType === "mobile_app") return "Expo / React Native starter";
  if (productionType === "saas") return "Next.js SaaS dashboard structure";
  if (productionType === "website") return "Next.js / React responsive website";
  if (productionType === "admin_project") return "Admin dashboard + database schema notes";
  return "Managed Crelavo production workflow";
}

function linksFromText(value: string) {
  return Array.from(value.matchAll(/https?:\/\/\S+/g)).map((match) => match[0].replace(/[),.;]+$/, ""));
}

function optionLineValue(optionSummary: string, label: string) {
  const line = optionSummary.split("\n").find((item) => item.toLowerCase().startsWith(label.toLowerCase()));
  return line?.split(":").slice(1).join(":").trim() ?? "";
}

function deliveryRequirementsFromSelection(selection: AssistantProductionSelection & { productionType: string; optionSummary: string }) {
  const signal = `${selection.productionType} ${selection.selectedModules.join(" ")} ${selection.selectedFeatures.join(" ")} ${selection.selectedPlatforms.join(" ")} ${selection.optionSummary}`.toLocaleLowerCase("tr-TR");
  const wantsZip = /zip|final zip|source zip|paket/.test(signal);
  const wantsSourceCode = /source code|source file|source delivery|kaynak|working source/.test(signal);
  const wantsReadme = /readme/.test(signal);
  const wantsDeploymentGuide = /deployment guide|setup guide|kurulum/.test(signal);
  const wantsAdminPanel = /admin panel|admin screens|admin pair|crud|roles/.test(signal);
  const wantsFinalVideo = /final mp4|mp4 download|video|lip-sync|music video|talking video/.test(signal);
  const wantsSubtitles = /subtitle|subtitles|altyazı|altyazi/.test(signal);
  const wantsThumbnail = /thumbnail|cover visual/.test(signal);
  const wantsPdf = /pdf|document|doküman|dokuman|pitch deck|proposal|catalog/.test(signal);
  const wantsBrandKit = /brand kit|logo|palette|typography|social kit/.test(signal);
  const requestedFormats = [
    wantsZip ? "final_zip" : null,
    wantsSourceCode ? "source_code" : null,
    wantsReadme ? "readme" : null,
    wantsDeploymentGuide ? "deployment_guide" : null,
    wantsAdminPanel ? "admin_panel" : null,
    wantsFinalVideo ? "final_mp4" : null,
    wantsSubtitles ? "subtitle_file" : null,
    wantsThumbnail ? "thumbnail" : null,
    wantsPdf ? "pdf" : null,
    wantsBrandKit ? "brand_kit" : null
  ].filter(Boolean) as string[];
  return {
    requested: requestedFormats.length > 0,
    status: "pending",
    formats: requestedFormats.length > 0 ? requestedFormats : ["dashboard_delivery"],
    wantsZip,
    wantsSourceCode,
    wantsReadme,
    wantsDeploymentGuide,
    wantsAdminPanel,
    wantsFinalVideo,
    wantsSubtitles,
    wantsThumbnail,
    wantsPdf,
    wantsBrandKit,
    packageNote: "Delivery requirements are captured from the assistant wizard and must be satisfied by the final dashboard delivery package."
  };
}

export function buildAssistantProductionPayload(selection: AssistantProductionSelection & { productionType: string; packageId?: string; prompt: string; optionSummary: string; userId: string; userEmail: string }) {
  const packageId = selection.packageId ?? packageIdFromSelection(selection.productionType, selection);
  const technicalStack = technicalStackFromSelection(selection.productionType);
  const storePlatform = storePlatformFromSelection(selection);
  const promptLinks = linksFromText(`${selection.prompt}\n${selection.optionSummary}`);
  const uploadedMaterials = selection.uploadedMaterials ?? [];
  const uploadedUrls = uploadedMaterials.map((material) => material.file_url).filter(Boolean);
  const deliveryLevel: DeliveryLevel = selection.deliveryLevel ?? (selection.selectedFeatures.includes("Working source package") ? "working_source_package" : "production_package");
  const deliveryFeature = deliveryLevel === "working_source_package" ? "Working source package" : "Production package";
  const effectiveFeatures = selection.selectedFeatures.includes(deliveryFeature) ? selection.selectedFeatures : [...selection.selectedFeatures, deliveryFeature];
  const musicVideoMaterialGroups = {
    songAudio: uploadedMaterials.filter((material) => ["song_audio", "music"].includes(material.reference_type)),
    ownVoice: uploadedMaterials.filter((material) => ["own_voice", "voiceover"].includes(material.reference_type)),
    ownImageAvatar: uploadedMaterials.filter((material) => material.reference_type === "own_image_avatar"),
    artistImage: uploadedMaterials.filter((material) => material.reference_type === "artist_image"),
    referenceCharacter: uploadedMaterials.filter((material) => material.reference_type === "reference_character"),
    anotherPersonReference: uploadedMaterials.filter((material) => material.reference_type === "another_person_reference"),
    performanceVideoReference: uploadedMaterials.filter((material) => material.reference_type === "performance_video_reference")
  };
  const liveSalesMaterialGroups = {
    ownVoice: uploadedMaterials.filter((material) => material.reference_type === "live_sales_own_voice"),
    selfAvatar: uploadedMaterials.filter((material) => material.reference_type === "live_sales_self_avatar"),
    avatarReference: uploadedMaterials.filter((material) => material.reference_type === "live_sales_avatar_reference"),
    background: uploadedMaterials.filter((material) => material.reference_type === "live_sales_background"),
    productVisual: uploadedMaterials.filter((material) => material.reference_type === "live_sales_product_visual")
  };
  const droneMaterialGroups = {
    mapReference: uploadedMaterials.filter((material) => material.reference_type === "drone_map_reference"),
    routeReference: uploadedMaterials.filter((material) => material.reference_type === "drone_route_reference"),
    locationVisual: uploadedMaterials.filter((material) => material.reference_type === "drone_location_visual"),
    styleReference: uploadedMaterials.filter((material) => material.reference_type === "drone_style_reference")
  };
  const wantsUserMusic = effectiveFeatures.includes("User music reference") || selection.selectedModules.includes("User audio upload") || musicVideoMaterialGroups.songAudio.length > 0 || uploadedMaterials.some((material) => material.kind === "audio");
  const wantsOwnVoiceover = effectiveFeatures.includes("Own voice-over") || musicVideoMaterialGroups.ownVoice.length > 0;
  const deliveryRequirements = deliveryRequirementsFromSelection({ ...selection, selectedFeatures: effectiveFeatures });
  const productionQuality = qualityProfileForProduction(selection.productionType, packageId);
  const dramaDetails = selection.productionType === "drama" ? {
    format: optionLineValue(selection.optionSummary, "Drama format"),
    genreTone: optionLineValue(selection.optionSummary, "Drama genre/tone"),
    structure: optionLineValue(selection.optionSummary, "Drama structure"),
    characters: optionLineValue(selection.optionSummary, "Drama characters"),
    hookType: optionLineValue(selection.optionSummary, "Drama hook type"),
    dialogueVoice: optionLineValue(selection.optionSummary, "Drama dialogue/voice")
  } : null;
  const droneDetails = selection.productionType === "drone_video" ? {
    locationAddress: optionLineValue(selection.optionSummary, "Drone location/address"),
    routePath: optionLineValue(selection.optionSummary, "Drone route/path"),
    markedArea: optionLineValue(selection.optionSummary, "Marked map/satellite area"),
    shotType: optionLineValue(selection.optionSummary, "Drone shot type"),
    mapStyle: optionLineValue(selection.optionSummary, "Drone map style"),
    cameraMovement: optionLineValue(selection.optionSummary, "Drone camera movement"),
    visualStyle: optionLineValue(selection.optionSummary, "Drone visual style"),
    narrationLanguage: optionLineValue(selection.optionSummary, "Drone narration language"),
    subtitleOption: optionLineValue(selection.optionSummary, "Drone subtitle option"),
    musicStyle: optionLineValue(selection.optionSummary, "Drone music style"),
    materialGroups: {
      mapReference: droneMaterialGroups.mapReference.map((material) => material.file_url),
      routeReference: droneMaterialGroups.routeReference.map((material) => material.file_url),
      locationVisual: droneMaterialGroups.locationVisual.map((material) => material.file_url),
      styleReference: droneMaterialGroups.styleReference.map((material) => material.file_url)
    }
  } : null;
  const liveSalesAgentDetails = selection.productionType === "live_sales_agent" ? {
    productLinkDetails: optionLineValue(selection.optionSummary, "Live sales product link/details"),
    brandName: optionLineValue(selection.optionSummary, "Live sales brand name"),
    productCategory: optionLineValue(selection.optionSummary, "Live sales product category"),
    targetMarketLanguage: optionLineValue(selection.optionSummary, "Live sales target market/language"),
    targetPlatform: optionLineValue(selection.optionSummary, "Live sales target platform"),
    persona: optionLineValue(selection.optionSummary, "Live sales persona"),
    avatarSource: optionLineValue(selection.optionSummary, "Live sales avatar source"),
    avatarStyle: optionLineValue(selection.optionSummary, "Live sales avatar style"),
    voiceSource: optionLineValue(selection.optionSummary, "Live sales voice source"),
    voiceLanguage: optionLineValue(selection.optionSummary, "Live sales voice/language"),
    voiceTone: optionLineValue(selection.optionSummary, "Live sales voice tone"),
    background: optionLineValue(selection.optionSummary, "Live sales background"),
    visualStyle: optionLineValue(selection.optionSummary, "Live sales visual style"),
    subtitleOption: optionLineValue(selection.optionSummary, "Live sales subtitle option"),
    interactionMode: optionLineValue(selection.optionSummary, "Live sales interaction mode"),
    streamGoal: optionLineValue(selection.optionSummary, "Live sales stream goal"),
    humanFallback: optionLineValue(selection.optionSummary, "Live sales human fallback"),
    providerReadiness: optionLineValue(selection.optionSummary, "Live sales provider readiness"),
    ctaOffer: optionLineValue(selection.optionSummary, "Live sales CTA/discount"),
    complianceNotes: optionLineValue(selection.optionSummary, "Live sales compliance notes"),
    creditPolicy: optionLineValue(selection.optionSummary, "Live sales credit policy") || "No included credits; this is a monthly service/live-agent planning package.",
    materialGroups: {
      ownVoice: liveSalesMaterialGroups.ownVoice.map((material) => material.file_url),
      selfAvatar: liveSalesMaterialGroups.selfAvatar.map((material) => material.file_url),
      avatarReference: liveSalesMaterialGroups.avatarReference.map((material) => material.file_url),
      background: liveSalesMaterialGroups.background.map((material) => material.file_url),
      productVisual: liveSalesMaterialGroups.productVisual.map((material) => material.file_url)
    }
  } : null;

  return {
    user_id: selection.userId,
    user_email: selection.userEmail,
    production_type: selection.productionType,
    package_id: packageId,
    title: `${selection.selectedStyle} ${selection.productionType} production`,
    prompt: selection.prompt,
    project_details: `${selection.prompt}\n\nProduction options:\n${selection.optionSummary}`,
    style: selection.selectedStyle,
    quality: selection.selectedQuality,
    target_platform: selection.selectedPlatforms.join(", "),
    features: effectiveFeatures.join(", "),
    workflow_mode: ["website", "saas", "mobile_app", "admin_project"].includes(selection.productionType) || selection.selectedModules.includes("Website") || selection.selectedModules.includes("SaaS screen") || selection.selectedModules.includes("Mobile app") || selection.selectedModules.includes("Admin panel") ? "project" : "media",
    output_count: selection.selectedFeatures.includes("5 alternatives") ? 5 : selection.selectedFeatures.includes("3 alternatives") ? 3 : 1,
    output_duration_seconds: Number(selection.selectedDuration.replace(/\D/g, "")) || 30,
    selected_material_ids: selection.selectedMaterials,
    material_links: [...promptLinks, ...uploadedUrls].join("\n"),
    song_audio_link: musicVideoMaterialGroups.songAudio.map((material) => material.file_url).join("\n"),
    music_reference_links: wantsUserMusic ? [...promptLinks, ...uploadedMaterials.filter((material) => material.kind === "audio").map((material) => material.file_url)].join("\n") : "",
    voiceover_reference_link: wantsOwnVoiceover ? musicVideoMaterialGroups.ownVoice[0]?.file_url ?? promptLinks[0] ?? "" : "",
    uploaded_materials: uploadedMaterials,
    music_video_material_groups: {
      song_audio: musicVideoMaterialGroups.songAudio.map((material) => material.file_url),
      own_voice: musicVideoMaterialGroups.ownVoice.map((material) => material.file_url),
      own_image_avatar: musicVideoMaterialGroups.ownImageAvatar.map((material) => material.file_url),
      artist_image: musicVideoMaterialGroups.artistImage.map((material) => material.file_url),
      reference_character: musicVideoMaterialGroups.referenceCharacter.map((material) => material.file_url),
      another_person_reference: musicVideoMaterialGroups.anotherPersonReference.map((material) => material.file_url),
      performance_video_reference: musicVideoMaterialGroups.performanceVideoReference.map((material) => material.file_url)
    },
    drama_details: dramaDetails,
    drone_details: droneDetails,
    live_sales_agent_details: liveSalesAgentDetails,
    publish_targets: selection.selectedPlatforms,
    social_platforms: selection.selectedPlatforms.join(", "),
    project_modules: selection.selectedModules.join(", "),
    technical_stack: technicalStack,
    delivery_level: deliveryLevel,
    source_delivery: deliveryLevel === "working_source_package" ? "working_source_zip" : effectiveFeatures.includes("Source file delivery") || effectiveFeatures.includes("Final ZIP") ? "source_zip" : "dashboard_delivery",
    delivery_requirements: deliveryRequirements,
    production_quality: productionQuality,
    production_quality_checklist: productionQuality.checklist,
    acceptance_criteria: productionQuality.acceptanceCriteria,
    store_platform: storePlatform,
    store_asset_goal: selection.selectedModules.filter((module) => ["E-commerce product pack", "Marketplace listing", "Product visual set", "Store banner", "SEO product description", "Bulk product production"].includes(module)).join(", "),
    product_page_notes: selection.productionType === "website" && packageId === "website_ecommerce_admin" ? selection.prompt : "",
    connected_store_targets: selection.selectedPlatforms.filter((platform) => ["Shopify", "Amazon", "Trendyol", "WooCommerce"].includes(platform)).join(", "),
    provider_test_mode: Boolean(selection.quickProviderTest),
    legal_acceptance: true
  };
}
