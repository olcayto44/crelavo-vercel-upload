"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addOns,
  aspectOutputs,
  backgroundEnvironments,
  bgmMoods,
  cameraFramings,
  cameraMovements,
  captionStyles,
  colorPalettes,
  conversationalDialogModes,
  conversationalLanguages,
  conversationalVoiceOptions,
  creationTypes,
  dramaCharacterCounts,
  dramaCharacterTypes,
  dramaDialogueStyles,
  dramaEpisodeDurations,
  dramaEnvironmentLevels,
  dramaFormats,
  dramaGenres,
  dramaLanguageCounts,
  dramaLanguages,
  dramaLocationCounts,
  dramaLuxuryAssetOptions,
  dramaMainCharacterProfiles,
  dramaMaterialLevels,
  dramaProductionComplexity,
  dramaPropLevels,
  dramaSettingTypes,
  dramaSoundDesignLevels,
  dramaStuntLevels,
  dramaSubtitleModes,
  dramaTones,
  dramaUserActorOptions,
  dramaVehicleOptions,
  dramaVoiceCounts,
  dramaVoiceModes,
  dramaWardrobeLevels,
  fontChoices,
  frameRates,
  lightingStyles,
  logoPlacements,
  brandingIntensities,
  motionIntensities,
  premiumMaterialOptionsByType,
  premiumMaterialTypes,
  presenterAppearances,
  qualityOptions,
  soundEffectIntensities,
  styles,
  toolCategories,
  toolGroups,
  transitionStyles,
  voiceAccents,
  voiceAgeRanges,
  voiceEmotionTones,
  voicePace,
  voiceTones
} from "@/lib/data";
import { estimateCredits } from "@/lib/credits";
import { supabaseBrowser } from "@/lib/supabase";

type SubmitState = "idle" | "loading" | "success" | "error";

// Categories that include motion (video)
const VIDEO_CATEGORIES = new Set([
  "AI Video",
  "AI Avatar",
  "Product & E-commerce",
  "Content Studio",
  "Highlights & Clips",
  "Anime & Influencer",
  "Short Drama",
  "Drama",
  "Stickman Animation",
  "Interior & Real Estate",
  "Video Edit & Replace"
]);

// Categories that include a human presenter
const PRESENTER_VIDEO_TYPES = new Set([
  "AI Conversational Presenter",
  "AI Avatar",
  "Ürün Avatarı",
  "Avatarımı Tasarla",
  "Seslendirme",
  "Anında Ses Klonlama",
  "Kendimi Videoya Ekle / AI Presenter",
  "Kendi Fotoğrafımdan Sunucu",
  "Kendi Videomu Farklı Mekana Taşı",
  "Konuya Uygun Kıyafet ve Aksesuar",
  "İstenilen Dilde Presenter Seslendirme"
]);

// Image-only types (no motion / transitions / sound)
const IMAGE_CATEGORIES = new Set(["AI Image"]);

// Audio-only types (no visual at all)
const AUDIO_CATEGORIES = new Set(["Audio & Music"]);
const REQUEST_DRAFT_KEY = "clipora_request_draft";

export function RequestForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [videoType, setVideoType] = useState<string>(creationTypes[0] ?? "");
  const [toolCategory, setToolCategory] = useState<string>(toolCategories[0] ?? "");
  const [quality, setQuality] = useState<string>(qualityOptions[0] ?? "");
  const [style, setStyle] = useState<string>(styles[0] ?? "");
  const [duration, setDuration] = useState<string>("30 seconds");
  const [assistantIdea, setAssistantIdea] = useState<string>("");
  const [extraLanguageCount, setExtraLanguageCount] = useState<number>(0);
  const [conversationalMode, setConversationalMode] = useState<string>(conversationalDialogModes[0] ?? "");
  const [conversationalLanguage, setConversationalLanguage] = useState<string>(conversationalLanguages[0] ?? "");
  const [conversationalVoice, setConversationalVoice] = useState<string>(conversationalVoiceOptions[0] ?? "");
  const [colorPalette, setColorPalette] = useState<string>("");
  const [fontChoice, setFontChoice] = useState<string>("");
  const [brandingIntensity, setBrandingIntensity] = useState<string>("");
  const [logoPlacement, setLogoPlacement] = useState<string>("");
  const [presenterAppearance, setPresenterAppearance] = useState<string>("");
  const [voiceTone, setVoiceTone] = useState<string>("");
  const [voicePaceValue, setVoicePace] = useState<string>("");
  const [voiceAccent, setVoiceAccent] = useState<string>("");
  const [voiceAgeRange, setVoiceAgeRange] = useState<string>("");
  const [voiceEmotion, setVoiceEmotion] = useState<string>("");
  const [cameraFraming, setCameraFraming] = useState<string>("");
  const [cameraMovement, setCameraMovement] = useState<string>("");
  const [motionIntensity, setMotionIntensity] = useState<string>("");
  const [transitionStyle, setTransitionStyle] = useState<string>("");
  const [lightingStyle, setLightingStyle] = useState<string>("");
  const [backgroundEnvironment, setBackgroundEnvironment] = useState<string>("");
  const [captionStyle, setCaptionStyle] = useState<string>("");
  const [bgmMood, setBgmMood] = useState<string>("");
  const [sfxIntensity, setSfxIntensity] = useState<string>("");
  const [frameRate, setFrameRate] = useState<string>("");
  const [aspectOutput, setAspectOutput] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [dramaPreset, setDramaPreset] = useState<string>("Basic Script Test");
  const [showDramaAdvanced, setShowDramaAdvanced] = useState(false);
  const [dramaFormat, setDramaFormat] = useState<string>(dramaFormats[0] ?? "");
  const [dramaEpisodeDuration, setDramaEpisodeDuration] = useState<string>(dramaEpisodeDurations[0] ?? "");
  const [dramaGenre, setDramaGenre] = useState<string>(dramaGenres[0] ?? "");
  const [dramaTone, setDramaTone] = useState<string>(dramaTones[0] ?? "");
  const [dramaVoiceMode, setDramaVoiceMode] = useState<string>(dramaVoiceModes[0] ?? "");
  const [dramaLanguage, setDramaLanguage] = useState<string>(dramaLanguages[0] ?? "");
  const [dramaMaterialLevel, setDramaMaterialLevel] = useState<string>(dramaMaterialLevels[0] ?? "");
  const [dramaEnvironmentLevel, setDramaEnvironmentLevel] = useState<string>(dramaEnvironmentLevels[0] ?? "");
  const [dramaSoundDesignLevel, setDramaSoundDesignLevel] = useState<string>(dramaSoundDesignLevels[0] ?? "");
  const [dramaProductionLevel, setDramaProductionLevel] = useState<string>(dramaProductionComplexity[0] ?? "");
  const [dramaCharacterCount, setDramaCharacterCount] = useState<string>(dramaCharacterCounts[0] ?? "");
  const [dramaCharacterType, setDramaCharacterType] = useState<string>(dramaCharacterTypes[0] ?? "");
  const [dramaMainCharacter, setDramaMainCharacter] = useState<string>(dramaMainCharacterProfiles[0] ?? "");
  const [dramaSettingType, setDramaSettingType] = useState<string>(dramaSettingTypes[0] ?? "");
  const [dramaLocationCount, setDramaLocationCount] = useState<string>(dramaLocationCounts[0] ?? "");
  const [dramaPropLevel, setDramaPropLevel] = useState<string>(dramaPropLevels[0] ?? "");
  const [dramaDialogueStyle, setDramaDialogueStyle] = useState<string>(dramaDialogueStyles[0] ?? "");
  const [dramaVoiceCount, setDramaVoiceCount] = useState<string>(dramaVoiceCounts[0] ?? "");
  const [dramaSubtitleMode, setDramaSubtitleMode] = useState<string>(dramaSubtitleModes[0] ?? "");
  const [dramaLanguageCount, setDramaLanguageCount] = useState<string>(dramaLanguageCounts[0] ?? "");
  const [dramaVehicle, setDramaVehicle] = useState<string>(dramaVehicleOptions[0] ?? "");
  const [dramaLuxuryAsset, setDramaLuxuryAsset] = useState<string>(dramaLuxuryAssetOptions[0] ?? "");
  const [dramaUserActor, setDramaUserActor] = useState<string>(dramaUserActorOptions[0] ?? "");
  const [dramaWardrobe, setDramaWardrobe] = useState<string>(dramaWardrobeLevels[0] ?? "");
  const [dramaStunt, setDramaStunt] = useState<string>(dramaStuntLevels[0] ?? "");
  const [premiumMaterialType, setPremiumMaterialType] = useState<string>(premiumMaterialTypes[0] ?? "No premium material");
  const [premiumMaterialOption, setPremiumMaterialOption] = useState<string>(premiumMaterialOptionsByType[premiumMaterialTypes[0] ?? "No premium material"]?.[0] ?? "None");
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [previewPrompt, setPreviewPrompt] = useState<string>("");
  const [previewStatus, setPreviewStatus] = useState<string>("Preview bekleniyor.");
  const [previewApproved, setPreviewApproved] = useState(false);
  const premiumMaterialOptions = premiumMaterialOptionsByType[premiumMaterialType] ?? ["None"];
  const isDrama = toolCategory === "Drama" || videoType.startsWith("Drama -");
  const isConversational = videoType === "AI Conversational Presenter";
  const isPresenterVideo = useMemo(() => PRESENTER_VIDEO_TYPES.has(videoType), [videoType]);
  const isVideoLike = useMemo(() => {
    if (IMAGE_CATEGORIES.has(toolCategory)) return false;
    if (AUDIO_CATEGORIES.has(toolCategory)) return false;
    return VIDEO_CATEGORIES.has(toolCategory) || true;
  }, [toolCategory]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const selectedStyle = params.get("style");
  const selectedCategory = params.get("category");
  const selectedDuration = params.get("duration");
  const selectedIdea = params.get("idea");
  const selectedRequestType = params.get("requestType");
  const selectedQuality = params.get("quality");
  const selectedPremiumMaterialType = params.get("premiumMaterialType");
  const selectedPremiumMaterialOption = params.get("premiumMaterialOption");

  if (selectedCategory && toolCategories.includes(selectedCategory)) {
    setToolCategory(selectedCategory);
    const firstType = toolGroups.find((group) => group.title === selectedCategory)?.items[0];
    if (firstType) setVideoType(firstType);
  }

  if (selectedRequestType && creationTypes.includes(selectedRequestType)) {
    setVideoType(selectedRequestType);
  }

  if (selectedQuality && qualityOptions.includes(selectedQuality)) {
    setQuality(selectedQuality);
  }

  if (selectedStyle && styles.includes(selectedStyle)) {
    setStyle(selectedStyle);
  }

  if (selectedDuration) {
    setDuration(selectedDuration);
  }

  if (selectedPremiumMaterialType && premiumMaterialTypes.includes(selectedPremiumMaterialType)) {
    setPremiumMaterialType(selectedPremiumMaterialType);
    const options = premiumMaterialOptionsByType[selectedPremiumMaterialType] ?? ["None"];
    setPremiumMaterialOption(options.includes(selectedPremiumMaterialOption ?? "") ? String(selectedPremiumMaterialOption) : options[0]);
  }

  if (selectedIdea) {
    setAssistantIdea(selectedIdea);
  }
}, []);

  const estimatedCredits = useMemo(
    () =>
      estimateCredits({
        toolCategory,
        videoType,
        duration,
        style,
        quality,
        addOns: selectedAddOns,
        conversationalMode,
        conversationalLanguage,
        conversationalVoice,
        extraLanguageCount,
        voiceTone,
        voicePace: voicePaceValue,
        voiceAccent,
        voiceAgeRange,
        voiceEmotion,
        cameraFraming,
        cameraMovement,
        lightingStyle,
        backgroundEnvironment,
        presenterAppearance,
        colorPalette,
        fontChoice,
        logoPlacement,
        brandingIntensity,
        transitionStyle,
        motionIntensity,
        captionStyle,
        bgmMood,
        sfxIntensity,
        aspectOutput,
        frameRate,
        dramaFormat,
        dramaEpisodeDuration,
        dramaGenre,
        dramaTone,
        dramaVoiceMode,
        dramaLanguage,
        dramaMaterialLevel,
        dramaEnvironmentLevel,
        dramaSoundDesignLevel,
        dramaProductionComplexity: dramaProductionLevel,
        dramaCharacterCount,
        dramaCharacterType,
        dramaMainCharacterProfile: dramaMainCharacter,
        dramaSettingType,
        dramaLocationCount,
        dramaPropLevel,
        dramaDialogueStyle,
        dramaVoiceCount,
        dramaSubtitleMode,
        dramaLanguageCount,
        dramaVehicleOption: dramaVehicle,
        dramaLuxuryAsset,
        dramaUserActor,
        dramaWardrobeLevel: dramaWardrobe,
        dramaStuntLevel: dramaStunt,
        premiumMaterialType,
        premiumMaterialOption
      }),
    [
      toolCategory,
      videoType,
      duration,
      style,
      quality,
      selectedAddOns,
      conversationalMode,
      conversationalLanguage,
      conversationalVoice,
      extraLanguageCount,
      voiceTone,
      voicePaceValue,
      voiceAccent,
      voiceAgeRange,
      voiceEmotion,
      cameraFraming,
      cameraMovement,
      lightingStyle,
      backgroundEnvironment,
      presenterAppearance,
      colorPalette,
      fontChoice,
      logoPlacement,
      brandingIntensity,
      transitionStyle,
      motionIntensity,
      captionStyle,
      bgmMood,
      sfxIntensity,
      aspectOutput,
      frameRate,
      dramaFormat,
      dramaEpisodeDuration,
      dramaGenre,
      dramaTone,
      dramaVoiceMode,
      dramaLanguage,
      dramaMaterialLevel,
      dramaEnvironmentLevel,
      dramaSoundDesignLevel,
      dramaProductionLevel,
      dramaCharacterCount,
      dramaCharacterType,
      dramaMainCharacter,
      dramaSettingType,
      dramaLocationCount,
      dramaPropLevel,
      dramaDialogueStyle,
      dramaVoiceCount,
      dramaSubtitleMode,
      dramaLanguageCount,
      dramaVehicle,
      dramaLuxuryAsset,
      dramaUserActor,
      dramaWardrobe,
      dramaStunt,
      premiumMaterialType,
      premiumMaterialOption
    ]
  );

  async function generatePreview() {
    if (!assistantIdea.trim()) {
      setPreviewStatus("Preview için önce prompt / ürün / sahne açıklaması yazmalısın.");
      return;
    }

    setPreviewApproved(false);
    setPreviewStatus("AI preview oluşturuluyor...");

    const response = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: assistantIdea,
        category: toolCategory,
        style,
        premium_material_type: premiumMaterialType,
        premium_material_option: premiumMaterialOption
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPreviewStatus(data.error ?? "Preview oluşturulamadı.");
      return;
    }

  setPreviewImageUrl(data.imageUrl ?? "");
  setPreviewPrompt(data.prompt ?? "");
  setPreviewStatus("Preview hazır. Beğenirsen onaylayıp final üretime geçebilirsin.");
  }

  function toggleAddOn(addOn: string) {
    setPreviewApproved(false);
    setSelectedAddOns((current) => current.includes(addOn) ? current.filter((item) => item !== addOn) : [...current, addOn]);
  }

  function applyDramaPreset(preset: string) {
    setDramaPreset(preset);

    if (preset === "Basic Script Test") {
      setVideoType("Drama - Scene Script");
      setDramaFormat("Scene Script Only");
      setDramaEpisodeDuration("1 minute");
      setDramaGenre("Drama");
      setDramaTone("Emotional");
      setDramaVoiceMode("No voice-over / dialogue only");
      setDramaLanguage("English");
      setDramaLanguageCount("1 language");
      setDramaVoiceCount("1 voice");
      setDramaDialogueStyle("Natural conversation");
      setDramaSubtitleMode("No subtitles");
      setDramaMaterialLevel("Script only");
      setDramaProductionLevel("Basic");
      setDramaCharacterCount("1 main character");
      setDramaCharacterType("Ordinary people / realistic");
      setDramaMainCharacter("Underdog protagonist");
      setDramaSettingType("Home / apartment");
      setDramaLocationCount("1 location");
      setDramaEnvironmentLevel("Single location");
      setDramaPropLevel("Minimal props");
      setDramaVehicle("None");
      setDramaLuxuryAsset("None");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Default wardrobe");
      setDramaSoundDesignLevel("None");
      setDramaStunt("No stunts");
      setSelectedAddOns([]);
      return;
    }

    if (preset === "Short Drama Basic") {
      setVideoType("Drama - Short Episode");
      setDramaFormat("Short Drama Episode");
      setDramaEpisodeDuration("1 minute");
      setDramaGenre("Drama");
      setDramaTone("Emotional");
      setDramaVoiceMode("AI voice-over");
      setDramaLanguage("English");
      setDramaLanguageCount("1 language");
      setDramaVoiceCount("1 voice");
      setDramaDialogueStyle("Natural conversation");
      setDramaSubtitleMode("Same language subtitles");
      setDramaMaterialLevel("Script + scene list");
      setDramaProductionLevel("Basic");
      setDramaCharacterCount("1 main character");
      setDramaCharacterType("Ordinary people / realistic");
      setDramaMainCharacter("Strong female lead");
      setDramaSettingType("Home / apartment");
      setDramaLocationCount("1 location");
      setDramaEnvironmentLevel("Single location");
      setDramaPropLevel("Standard daily-life props");
      setDramaVehicle("None");
      setDramaLuxuryAsset("None");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Casual outfits");
      setDramaSoundDesignLevel("Basic atmosphere");
      setDramaStunt("No stunts");
      setSelectedAddOns(["Voice-over", "Basic subtitles", "Script writing"]);
      return;
    }

    if (preset === "Series Episode Standard") {
      setVideoType("Drama - Series Episode");
      setDramaFormat("Series Episode");
      setDramaEpisodeDuration("3 minutes");
      setDramaGenre("Drama");
      setDramaTone("Shocking / Twist Ending");
      setDramaVoiceMode("Narrator + character voices");
      setDramaLanguage("English");
      setDramaLanguageCount("1 language");
      setDramaVoiceCount("2 voices");
      setDramaDialogueStyle("Family argument");
      setDramaSubtitleMode("Same language subtitles");
      setDramaMaterialLevel("Script + scene list + character notes");
      setDramaProductionLevel("Standard");
      setDramaCharacterCount("2 main characters");
      setDramaCharacterType("Ordinary people / realistic");
      setDramaMainCharacter("Strong female lead");
      setDramaSettingType("Home / apartment");
      setDramaLocationCount("1 location");
      setDramaEnvironmentLevel("Single location");
      setDramaPropLevel("Important story props");
      setDramaVehicle("None");
      setDramaLuxuryAsset("None");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Business outfits");
      setDramaSoundDesignLevel("Standard ambience + transitions");
      setDramaStunt("No stunts");
      setSelectedAddOns(["Voice-over", "Basic subtitles", "Script writing", "Background music"]);
      return;
    }

    if (preset === "Premium Series Episode") {
      setVideoType("Drama - Series Episode");
      setDramaFormat("Series Episode");
      setDramaEpisodeDuration("10 minutes");
      setDramaGenre("Drama");
      setDramaTone("Shocking / Twist Ending");
      setDramaVoiceMode("Narrator + character voices");
      setDramaLanguage("English");
      setDramaLanguageCount("2 languages");
      setDramaVoiceCount("3-4 voices");
      setDramaDialogueStyle("Family argument");
      setDramaSubtitleMode("Dual subtitles");
      setDramaMaterialLevel("Full package: script + scenes + characters + props");
      setDramaProductionLevel("Premium");
      setDramaCharacterCount("3-4 characters");
      setDramaCharacterType("Rich family / luxury lifestyle");
      setDramaMainCharacter("Strong female lead");
      setDramaSettingType("Luxury mansion");
      setDramaLocationCount("2-3 locations");
      setDramaEnvironmentLevel("2-3 locations");
      setDramaPropLevel("Important story props");
      setDramaVehicle("Luxury car");
      setDramaLuxuryAsset("Villa");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Luxury fashion");
      setDramaSoundDesignLevel("Rich cinematic sound design");
      setDramaStunt("No stunts");
      setSelectedAddOns(["Voice-over", "Styled subtitles", "Script writing", "Background music", "Sound effects"]);
      return;
    }

    if (preset === "60 Minute Film") {
      setVideoType("Drama - 60 Minute Film");
      setDramaFormat("60 Minute Continuous Film");
      setDramaEpisodeDuration("60 minutes");
      setDramaGenre("Drama");
      setDramaTone("Cinematic / Epic");
      setDramaVoiceMode("Narrator + character voices");
      setDramaLanguage("English");
      setDramaLanguageCount("2 languages");
      setDramaVoiceCount("5-8 voices");
      setDramaDialogueStyle("Multi-character ensemble dialogue");
      setDramaSubtitleMode("Dual subtitles");
      setDramaMaterialLevel("Full production package: script + scenes + characters + props + shot list + subtitles");
      setDramaProductionLevel("Cinematic");
      setDramaCharacterCount("5-8 characters");
      setDramaCharacterType("Ordinary people / realistic");
      setDramaMainCharacter("Family-centered ensemble");
      setDramaSettingType("Street / city exterior");
      setDramaLocationCount("4-6 locations");
      setDramaEnvironmentLevel("Multiple locations");
      setDramaPropLevel("Detailed prop continuity");
      setDramaVehicle("Standard car");
      setDramaLuxuryAsset("None");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Business outfits");
      setDramaSoundDesignLevel("Full film mix: ambience + foley + impacts + transitions + music");
      setDramaStunt("Simple physical action");
      setSelectedAddOns(["Voice-over", "Styled subtitles", "Script writing", "Background music", "Sound effects", "Extra revision"]);
      return;
    }

    if (preset === "Luxury Cinematic Film") {
      setVideoType("Drama - 60 Minute Film");
      setDramaFormat("60 Minute Continuous Film");
      setDramaEpisodeDuration("60 minutes");
      setDramaGenre("Thriller");
      setDramaTone("Cinematic / Epic");
      setDramaVoiceMode("Narrator + character voices");
      setDramaLanguage("English");
      setDramaLanguageCount("3 languages");
      setDramaVoiceCount("Full cast voices");
      setDramaDialogueStyle("Multi-character ensemble dialogue");
      setDramaSubtitleMode("Multi-language subtitles");
      setDramaMaterialLevel("Full production package: script + scenes + characters + props + shot list + subtitles");
      setDramaProductionLevel("Full production bible");
      setDramaCharacterCount("Large cast (9+ characters)");
      setDramaCharacterType("Rich family / luxury lifestyle");
      setDramaMainCharacter("Anti-hero");
      setDramaSettingType("Luxury mansion");
      setDramaLocationCount("7-10 locations");
      setDramaEnvironmentLevel("Multiple locations");
      setDramaPropLevel("Detailed prop continuity");
      setDramaVehicle("Private jet");
      setDramaLuxuryAsset("Mansion");
      setDramaUserActor("No user actor");
      setDramaWardrobe("Luxury fashion");
      setDramaSoundDesignLevel("Full film mix: ambience + foley + impacts + transitions + music");
      setDramaStunt("Car chase");
      setSelectedAddOns(["Voice-over", "Styled subtitles", "Script writing", "Background music", "Sound effects", "Extra revision"]);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

  setState("loading");
  const formElement = event.currentTarget;

  const { data: userData, error: userError } = await supabaseBrowser().auth.getUser();

    if (userError || !userData.user) {
      setState("error");
      setMessage("Video istegi gondermek icin once giris yapmalisin.");
      return;
    }

    const form = new FormData(formElement);
    const payload: Record<string, unknown> = {
      ...Object.fromEntries(form.entries()),
      user_id: userData.user.id,
      user_email: userData.user.email ?? "",
      preview_status: previewStatus,
      preview_image_url: previewImageUrl,
      preview_prompt: previewPrompt,
      preview_approved: previewApproved,
      preview_revision_count: previewImageUrl ? 1 : 0
    };
    if (isConversational) {
      payload.extra_language_count = String(extraLanguageCount);
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setState("error");
      setMessage(data.redirect ? "Not enough credits for this request. Redirecting to the credits page..." : (data.error ?? "Request could not be submitted."));
      if (data.redirect) {
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1800);
      }
      return;
    }

    setState("success");
    setMessage("Request submitted successfully. Redirecting you to your video requests...");
    setShowSuccessModal(true);
    setTimeout(() => {
      window.location.href = "/dashboard/videos";
    }, 1800);
    event.currentTarget.reset();
    setVideoType(creationTypes[0] ?? "");
    setToolCategory(toolCategories[0] ?? "");
    setQuality(qualityOptions[0] ?? "");
    setStyle(styles[0] ?? "");
    setDuration("30 seconds");
    setAssistantIdea("");
    setExtraLanguageCount(0);
    setSelectedAddOns([]);
    setConversationalMode(conversationalDialogModes[0] ?? "");
    setConversationalLanguage(conversationalLanguages[0] ?? "");
    setConversationalVoice(conversationalVoiceOptions[0] ?? "");
    setColorPalette("");
    setFontChoice("");
    setBrandingIntensity("");
    setLogoPlacement("");
    setPresenterAppearance("");
    setVoiceTone("");
    setVoicePace("");
    setVoiceAccent("");
    setVoiceAgeRange("");
    setVoiceEmotion("");
    setCameraFraming("");
    setCameraMovement("");
    setMotionIntensity("");
    setTransitionStyle("");
    setLightingStyle("");
    setBackgroundEnvironment("");
    setCaptionStyle("");
    setBgmMood("");
    setSfxIntensity("");
    setFrameRate("");
    setAspectOutput("");
  }

  return (
    <>
    {showSuccessModal ? (
      <div className="modal-backdrop" role="status" aria-live="polite">
        <div className="success-modal">
          <div className="success-icon">✓</div>
          <h3>Automatic production started</h3>
          <p>Your credits were reserved and the request was queued for generation.</p>
          <span>Redirecting to My videos...</span>
        </div>
      </div>
    ) : null}
    <form onSubmit={onSubmit}>
      <div className="form-shell production-studio-shell">
        <div>
      <div className="field"><label>Project title</label><input name="title" required placeholder="Example: Luxury perfume TikTok ad" /></div>
      <div className="field">
        <label>Tool category</label>
        <select
          name="tool_category"
value={toolCategory}
              onChange={(event) => { setPreviewApproved(false); setToolCategory(event.target.value); }}
        >
          {toolCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Request type</label>
        <select
          name="video_type"
value={videoType}
              onChange={(event) => { setPreviewApproved(false); setVideoType(event.target.value); }}
        >
          {creationTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </div>
      <div className="field"><label>Target platform</label><select name="target_platform"><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Facebook Ads</option><option>E-commerce page</option><option>Website / Landing page</option><option>Internal business use</option></select></div>
      <div className="field"><label>Quality</label><select name="quality" value={quality} onChange={(event) => { setPreviewApproved(false); setQuality(event.target.value); }}>{qualityOptions.map((quality) => <option key={quality}>{quality}</option>)}</select></div>
      <div className="field"><label>Style</label><select name="style" value={style} onChange={(event) => { setPreviewApproved(false); setStyle(event.target.value); }}>{styles.map((style) => <option key={style}>{style}</option>)}</select></div>

      {isConversational ? (
        <div className="card" style={{ background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.4)", padding: 16, marginBottom: 16 }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Conversational Presenter Options</strong>
          <p style={{ marginTop: 0, color: "#a5b4fc" }}>These options only apply to AI Conversational Presenter videos.</p>
          <div className="field"><label>Dialogue mode</label><select name="conversational_mode" required value={conversationalMode} onChange={(event) => setConversationalMode(event.target.value)}>{conversationalDialogModes.map((mode) => <option key={mode}>{mode}</option>)}</select></div>
          <div className="field"><label>Conversation language</label><select name="conversational_language" required value={conversationalLanguage} onChange={(event) => setConversationalLanguage(event.target.value)}>{conversationalLanguages.map((language) => <option key={language}>{language}</option>)}</select></div>
          <div className="field">
            <label>Extra languages for the same dialogue (multi-language output)</label>
            <input
              type="number"
              min={0}
              max={10}
              name="extra_language_count"
              value={extraLanguageCount}
              onChange={(event) => setExtraLanguageCount(Number(event.target.value) || 0)}
              placeholder="0"
            />
            <small style={{ color: "#94a3b8" }}>Extra languages increase the automatic production credit estimate.</small>
          </div>
          <div className="field"><label>Voice-over</label><select name="conversational_voice" required value={conversationalVoice} onChange={(event) => setConversationalVoice(event.target.value)}>{conversationalVoiceOptions.map((voice) => <option key={voice}>{voice}</option>)}</select></div>
        </div>
      ) : null}

      {isDrama ? (
        <div className="card" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.35)", padding: 16, marginBottom: 16 }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Drama Production Details</strong>
          <p style={{ marginTop: 0, color: "#fcd34d" }}>Choose a ready package first. Advanced settings are optional.</p>
          <div className="field">
            <label>Drama Production Preset</label>
            <select name="drama_preset" value={dramaPreset} onChange={(event) => applyDramaPreset(event.target.value)}>
              <option>Basic Script Test</option>
              <option>Short Drama Basic</option>
              <option>Series Episode Standard</option>
              <option>Premium Series Episode</option>
              <option>60 Minute Film</option>
              <option>Luxury Cinematic Film</option>
            </select>
            <small style={{ color: "#94a3b8" }}>Preset automatically fills the detailed production settings and updates credits.</small>
          </div>
          <button className="btn secondary" type="button" onClick={() => setShowDramaAdvanced((current) => !current)} style={{ marginBottom: 14 }}>
            {showDramaAdvanced ? "Hide advanced drama settings" : "Show advanced drama settings"}
          </button>
          {showDramaAdvanced ? (
            <>
          <div className="field"><label>Drama format</label><select name="drama_format" value={dramaFormat} onChange={(event) => setDramaFormat(event.target.value)}>{dramaFormats.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Episode / film duration</label><select name="drama_episode_duration" value={dramaEpisodeDuration} onChange={(event) => setDramaEpisodeDuration(event.target.value)}>{dramaEpisodeDurations.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Genre</label><select name="drama_genre" value={dramaGenre} onChange={(event) => setDramaGenre(event.target.value)}>{dramaGenres.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Tone</label><select name="drama_tone" value={dramaTone} onChange={(event) => setDramaTone(event.target.value)}>{dramaTones.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Voice mode</label><select name="drama_voice_mode" value={dramaVoiceMode} onChange={(event) => setDramaVoiceMode(event.target.value)}>{dramaVoiceModes.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Drama language</label><select name="drama_language" value={dramaLanguage} onChange={(event) => setDramaLanguage(event.target.value)}>{dramaLanguages.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Number of languages</label><select name="drama_language_count" value={dramaLanguageCount} onChange={(event) => setDramaLanguageCount(event.target.value)}>{dramaLanguageCounts.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Voice count</label><select name="drama_voice_count" value={dramaVoiceCount} onChange={(event) => setDramaVoiceCount(event.target.value)}>{dramaVoiceCounts.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Dialogue style</label><select name="drama_dialogue_style" value={dramaDialogueStyle} onChange={(event) => setDramaDialogueStyle(event.target.value)}>{dramaDialogueStyles.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Subtitle mode</label><select name="drama_subtitle_mode" value={dramaSubtitleMode} onChange={(event) => setDramaSubtitleMode(event.target.value)}>{dramaSubtitleModes.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Material package</label><select name="drama_material_level" value={dramaMaterialLevel} onChange={(event) => setDramaMaterialLevel(event.target.value)}>{dramaMaterialLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Production complexity</label><select name="drama_production_complexity" value={dramaProductionLevel} onChange={(event) => setDramaProductionLevel(event.target.value)}>{dramaProductionComplexity.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Character count</label><select name="drama_character_count" value={dramaCharacterCount} onChange={(event) => setDramaCharacterCount(event.target.value)}>{dramaCharacterCounts.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Character type</label><select name="drama_character_type" value={dramaCharacterType} onChange={(event) => setDramaCharacterType(event.target.value)}>{dramaCharacterTypes.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Main character profile</label><select name="drama_main_character_profile" value={dramaMainCharacter} onChange={(event) => setDramaMainCharacter(event.target.value)}>{dramaMainCharacterProfiles.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Setting type</label><select name="drama_setting_type" value={dramaSettingType} onChange={(event) => setDramaSettingType(event.target.value)}>{dramaSettingTypes.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Location count</label><select name="drama_location_count" value={dramaLocationCount} onChange={(event) => setDramaLocationCount(event.target.value)}>{dramaLocationCounts.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Environment level</label><select name="drama_environment_level" value={dramaEnvironmentLevel} onChange={(event) => setDramaEnvironmentLevel(event.target.value)}>{dramaEnvironmentLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Props / materials</label><select name="drama_prop_level" value={dramaPropLevel} onChange={(event) => setDramaPropLevel(event.target.value)}>{dramaPropLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Vehicle / transportation</label><select name="drama_vehicle_option" value={dramaVehicle} onChange={(event) => setDramaVehicle(event.target.value)}>{dramaVehicleOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Luxury asset / location</label><select name="drama_luxury_asset" value={dramaLuxuryAsset} onChange={(event) => setDramaLuxuryAsset(event.target.value)}>{dramaLuxuryAssetOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>User as actor</label><select name="drama_user_actor" value={dramaUserActor} onChange={(event) => setDramaUserActor(event.target.value)}>{dramaUserActorOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Wardrobe / costume</label><select name="drama_wardrobe_level" value={dramaWardrobe} onChange={(event) => setDramaWardrobe(event.target.value)}>{dramaWardrobeLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Sound design level</label><select name="drama_sound_design_level" value={dramaSoundDesignLevel} onChange={(event) => setDramaSoundDesignLevel(event.target.value)}>{dramaSoundDesignLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field"><label>Action / stunt level</label><select name="drama_stunt_level" value={dramaStunt} onChange={(event) => setDramaStunt(event.target.value)}>{dramaStuntLevels.map((item) => <option key={item}>{item}</option>)}</select></div>
          </>
        ) : null}
        </div>
      ) : null}

      <div className="card" style={{ background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 16 }}>
        <strong style={{ display: "block", marginBottom: 8 }}>Production Details</strong>
        <p style={{ marginTop: 0, color: "#94a3b8" }}>Tell us exactly how you want the output. Each choice affects the final price.</p>

        {!AUDIO_CATEGORIES.has(toolCategory) ? (
          <div className="card" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.35)", padding: 14, marginBottom: 14 }}>
            <strong style={{ display: "block", marginBottom: 8 }}>Premium Materials</strong>
            <p style={{ marginTop: 0, color: "#fcd34d" }}>Optional premium assets increase credits based on the selected detail level.</p>
            <div className="field">
              <label>Material type</label>
              <select
                name="premium_material_type"
                value={premiumMaterialType}
                onChange={(event) => {
                  const nextType = event.target.value;
setPreviewApproved(false);
                    setPremiumMaterialType(nextType);
                    setPremiumMaterialOption(premiumMaterialOptionsByType[nextType]?.[0] ?? "None");
                }}
              >
                {premiumMaterialTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Material detail</label>
              <select name="premium_material_option" value={premiumMaterialOption} onChange={(event) => { setPreviewApproved(false); setPremiumMaterialOption(event.target.value); }}>
                {premiumMaterialOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </div>
        ) : null}

        {!AUDIO_CATEGORIES.has(toolCategory) ? (
          <div className="field">
            <label>Color palette / mood</label>
            <select name="color_palette" value={colorPalette} onChange={(event) => setColorPalette(event.target.value)}><option value="">Default (no preference)</option>{colorPalettes.map((opt) => <option key={opt}>{opt}</option>)}</select>
          </div>
        ) : null}

        {!AUDIO_CATEGORIES.has(toolCategory) ? (
          <div className="field">
            <label>Font choice</label>
            <select name="font_choice" value={fontChoice} onChange={(event) => setFontChoice(event.target.value)}><option value="">Default</option>{fontChoices.map((opt) => <option key={opt}>{opt}</option>)}</select>
          </div>
        ) : null}

        <div className="field">
          <label>Branding intensity</label>
          <select name="branding_intensity" value={brandingIntensity} onChange={(event) => setBrandingIntensity(event.target.value)}><option value="">None</option>{brandingIntensities.map((opt) => <option key={opt}>{opt}</option>)}</select>
        </div>

        <div className="field">
          <label>Logo placement</label>
          <select name="logo_placement" value={logoPlacement} onChange={(event) => setLogoPlacement(event.target.value)}><option value="">None</option>{logoPlacements.map((opt) => <option key={opt}>{opt}</option>)}</select>
        </div>

        {isPresenterVideo ? (
          <>
            <div className="field">
              <label>Presenter appearance</label>
              <select name="presenter_appearance" value={presenterAppearance} onChange={(event) => setPresenterAppearance(event.target.value)}><option value="">Default</option>{presenterAppearances.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Voice tone</label>
              <select name="voice_tone" value={voiceTone} onChange={(event) => setVoiceTone(event.target.value)}><option value="">Default</option>{voiceTones.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Voice pace</label>
              <select name="voice_pace" value={voicePaceValue} onChange={(event) => setVoicePace(event.target.value)}><option value="">Default (1x)</option>{voicePace.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Voice accent</label>
              <select name="voice_accent" value={voiceAccent} onChange={(event) => setVoiceAccent(event.target.value)}><option value="">Default</option>{voiceAccents.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Voice age range</label>
              <select name="voice_age_range" value={voiceAgeRange} onChange={(event) => setVoiceAgeRange(event.target.value)}><option value="">Default (Young Adult)</option>{voiceAgeRanges.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Voice emotion</label>
              <select name="voice_emotion" value={voiceEmotion} onChange={(event) => setVoiceEmotion(event.target.value)}><option value="">Default</option>{voiceEmotionTones.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
          </>
        ) : null}

        {!AUDIO_CATEGORIES.has(toolCategory) && !IMAGE_CATEGORIES.has(toolCategory) ? (
          <>
            <div className="field">
              <label>Camera framing</label>
              <select name="camera_framing" value={cameraFraming} onChange={(event) => setCameraFraming(event.target.value)}><option value="">Default (eye-level)</option>{cameraFramings.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Camera movement</label>
              <select name="camera_movement" value={cameraMovement} onChange={(event) => setCameraMovement(event.target.value)}><option value="">Default (static)</option>{cameraMovements.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Motion intensity</label>
              <select name="motion_intensity" value={motionIntensity} onChange={(event) => setMotionIntensity(event.target.value)}><option value="">Default (Balanced)</option>{motionIntensities.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Transition style (between shots)</label>
              <select name="transition_style" value={transitionStyle} onChange={(event) => setTransitionStyle(event.target.value)}><option value="">Default (hard cut)</option>{transitionStyles.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
          </>
        ) : null}

        {!AUDIO_CATEGORIES.has(toolCategory) ? (
          <>
            <div className="field">
              <label>Lighting style</label>
              <select name="lighting_style" value={lightingStyle} onChange={(event) => setLightingStyle(event.target.value)}><option value="">Default</option>{lightingStyles.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Background / environment</label>
              <select name="background_environment" value={backgroundEnvironment} onChange={(event) => setBackgroundEnvironment(event.target.value)}><option value="">Default</option>{backgroundEnvironments.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
          </>
        ) : null}

        {isVideoLike && !AUDIO_CATEGORIES.has(toolCategory) ? (
          <>
            <div className="field">
              <label>Caption style</label>
              <select name="caption_style" value={captionStyle} onChange={(event) => setCaptionStyle(event.target.value)}><option value="">Default (none)</option>{captionStyles.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Background music mood</label>
              <select name="bgm_mood" value={bgmMood} onChange={(event) => setBgmMood(event.target.value)}><option value="">None / silent</option>{bgmMoods.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Sound effect intensity</label>
              <select name="sfx_intensity" value={sfxIntensity} onChange={(event) => setSfxIntensity(event.target.value)}><option value="">Default (none)</option>{soundEffectIntensities.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Frame rate</label>
              <select name="frame_rate" value={frameRate} onChange={(event) => setFrameRate(event.target.value)}><option value="">Default (30 fps)</option>{frameRates.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
            <div className="field">
              <label>Aspect ratio of final output</label>
              <select name="aspect_output" value={aspectOutput} onChange={(event) => setAspectOutput(event.target.value)}><option value="">Same as project default</option>{aspectOutputs.map((opt) => <option key={opt}>{opt}</option>)}</select>
            </div>
          </>
        ) : null}
      </div>

      <div className="field"><label>Topic, product URL, script, or edit instructions</label><textarea name="prompt" required value={assistantIdea} onChange={(event) => { setPreviewApproved(false); setAssistantIdea(event.target.value); }} placeholder="Paste your product link, source video notes, topic, script, or describe what you want changed." /></div>
      <div className="field"><label>Language and subtitles</label><input name="language_notes" placeholder="Example: English voice-over + Spanish subtitles" /></div>
      <div className="field"><label>Duration</label><select name="duration" value={duration} onChange={(event) => { setPreviewApproved(false); setDuration(event.target.value); }}><option>15 seconds</option><option>30 seconds</option><option>45 seconds</option><option>60 seconds</option><option>2 minutes</option><option>3 minutes</option><option>5 minutes</option><option>10 minutes</option><option>20 minutes</option><option>40 minutes</option><option>60 minutes</option><option>Custom</option></select></div>
      <div className="field">
        <label>Add-ons</label>
        <div className="grid" style={{ gap: 10 }}>
          {addOns.map((addOn) => (
            <label key={addOn} className="card" style={{ padding: 12, cursor: "pointer", borderColor: selectedAddOns.includes(addOn) ? "rgba(167,139,250,0.5)" : undefined }}>
              <input name="add_ons" type="checkbox" value={addOn} checked={selectedAddOns.includes(addOn)} onChange={() => toggleAddOn(addOn)} style={{ marginRight: 8 }} />{addOn}
            </label>
          ))}
        </div>
      </div>
      <div className="field"><label>Extra notes</label><textarea name="extra_notes" placeholder="Brand tone, source file notes, examples, forbidden elements, delivery notes..." /></div>
      <div className="card" style={{ background: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.4)" }}>
        <strong>Live credit estimate: {estimatedCredits.toLocaleString()} credits</strong>
        <p style={{ marginTop: 6, color: "#94a3b8" }}>Updates instantly as you change type, quality, duration, style, add-ons, and production details. Credits are reserved when automatic production starts.</p>
        <p style={{ marginBottom: 0, color: "#fcd34d" }}>If you cancel after submission, 50% of the reserved credits are charged and the remaining 50% is released.</p>
      </div>
      <button className="btn" disabled={state === "loading"} type="submit" style={{ marginTop: 16 }}>{state === "loading" ? "Starting production..." : "Start automatic production"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
        </div>

        <aside className="preview-studio-card">
          <span className="badge">Preview Studio</span>
          <h3>See the idea before final production</h3>
          <div className="preview-frame">
            {previewImageUrl ? (
              <img src={previewImageUrl} alt="Generated visual preview" className="preview-image" />
            ) : (
              <div className="preview-scene">
                <strong>{style || "Selected style"}</strong>
                <span>{toolCategory}</span>
                <small>{videoType}</small>
              </div>
            )}
          </div>
          <div className="preview-summary-list">
            <div><span>Quality</span><strong>{quality || "Default"}</strong></div>
            <div><span>Duration</span><strong>{duration}</strong></div>
            <div><span>Premium material</span><strong>{premiumMaterialType === "No premium material" ? "None" : premiumMaterialType}</strong></div>
            {premiumMaterialType !== "No premium material" ? <div><span>Material detail</span><strong>{premiumMaterialOption}</strong></div> : null}
            {selectedAddOns.length ? <div><span>Add-ons</span><strong>{selectedAddOns.join(", ")}</strong></div> : null}
          </div>
          {premiumMaterialType !== "No premium material" ? (
            <div className="preview-warning">
              Premium materyal seçildi. Sistem otomatik üretime alır; istersen üretim öncesi görsel preview oluşturup beklentiyi kontrol edebilirsin.
            </div>
          ) : (
              <div className="preview-note">Preview opsiyoneldir; talep gönderildiğinde üretim otomatik kuyruğa alınır.</div>
          )}
          <div className="preview-actions">
            <button className="btn secondary" type="button" onClick={generatePreview}>Generate visual preview</button>
            {previewImageUrl ? <button className="btn" type="button" onClick={() => { setPreviewApproved(true); setPreviewStatus("Preview onaylandı. Final üretim için bu görünüm kullanılabilir."); }}>Preview'i onayla</button> : null}
          </div>
          <p className={previewApproved ? "preview-approved" : "preview-footnote"}>{previewApproved ? "Preview onaylandı." : previewStatus}</p>
          <p className="preview-footnote">Beğenmezsen promptu, materyali veya stili değiştirip yeniden preview oluşturabilirsin.</p>
        </aside>
      </div>
    </form>
    </>
  );
}
