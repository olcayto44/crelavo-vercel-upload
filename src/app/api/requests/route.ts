import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { estimateCredits } from "@/lib/credits";
import { startGeneration } from "@/lib/generation";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const adminEmail = searchParams.get("admin_email") ?? request.headers.get("x-admin-email");

    const supabase = supabaseAdmin();
    let query = supabase
      .from("video_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (adminEmail) {
      if (!isAdminRequest(request)) return adminRequiredResponse();
    } else {
      if (!userId) {
        return Response.json({ error: "User session is required." }, { status: 401 });
      }
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return Response.json({ requests: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load requests") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const prompt = String(body.prompt ?? "").trim();

  if (!title || !prompt) {
    return Response.json({ error: "Title and request details are required." }, { status: 400 });
  }

  const addOns = Array.isArray(body.add_ons) ? body.add_ons.map(String) : body.add_ons ? [String(body.add_ons)] : [];
  const extraLanguageCount = Math.max(0, Number(body.extra_language_count ?? 0) || 0);
  const estimatedCredits = estimateCredits({
    toolCategory: String(body.tool_category ?? ""),
    videoType: String(body.video_type ?? ""),
    duration: String(body.duration ?? ""),
    style: String(body.style ?? ""),
    quality: String(body.quality ?? ""),
    addOns,
    conversationalMode: String(body.conversational_mode ?? ""),
    conversationalLanguage: String(body.conversational_language ?? ""),
    conversationalVoice: String(body.conversational_voice ?? ""),
    extraLanguageCount,
    voiceTone: String(body.voice_tone ?? ""),
    voicePace: String(body.voice_pace ?? ""),
    voiceAccent: String(body.voice_accent ?? ""),
    voiceAgeRange: String(body.voice_age_range ?? ""),
    voiceEmotion: String(body.voice_emotion ?? ""),
    cameraFraming: String(body.camera_framing ?? ""),
    cameraMovement: String(body.camera_movement ?? ""),
    lightingStyle: String(body.lighting_style ?? ""),
    backgroundEnvironment: String(body.background_environment ?? ""),
    presenterAppearance: String(body.presenter_appearance ?? ""),
    colorPalette: String(body.color_palette ?? ""),
    fontChoice: String(body.font_choice ?? ""),
    logoPlacement: String(body.logo_placement ?? ""),
    brandingIntensity: String(body.branding_intensity ?? ""),
    transitionStyle: String(body.transition_style ?? ""),
    motionIntensity: String(body.motion_intensity ?? ""),
    captionStyle: String(body.caption_style ?? ""),
    bgmMood: String(body.bgm_mood ?? ""),
    sfxIntensity: String(body.sfx_intensity ?? ""),
    aspectOutput: String(body.aspect_output ?? ""),
    frameRate: String(body.frame_rate ?? ""),
    dramaFormat: String(body.drama_format ?? ""),
    dramaEpisodeDuration: String(body.drama_episode_duration ?? ""),
    dramaGenre: String(body.drama_genre ?? ""),
    dramaTone: String(body.drama_tone ?? ""),
    dramaVoiceMode: String(body.drama_voice_mode ?? ""),
    dramaLanguage: String(body.drama_language ?? ""),
    dramaMaterialLevel: String(body.drama_material_level ?? ""),
    dramaEnvironmentLevel: String(body.drama_environment_level ?? ""),
    dramaSoundDesignLevel: String(body.drama_sound_design_level ?? ""),
    dramaProductionComplexity: String(body.drama_production_complexity ?? ""),
    dramaCharacterCount: String(body.drama_character_count ?? ""),
    dramaCharacterType: String(body.drama_character_type ?? ""),
    dramaMainCharacterProfile: String(body.drama_main_character_profile ?? ""),
    dramaSettingType: String(body.drama_setting_type ?? ""),
    dramaLocationCount: String(body.drama_location_count ?? ""),
    dramaPropLevel: String(body.drama_prop_level ?? ""),
    dramaDialogueStyle: String(body.drama_dialogue_style ?? ""),
    dramaVoiceCount: String(body.drama_voice_count ?? ""),
    dramaSubtitleMode: String(body.drama_subtitle_mode ?? ""),
    dramaLanguageCount: String(body.drama_language_count ?? ""),
    dramaVehicleOption: String(body.drama_vehicle_option ?? ""),
    dramaLuxuryAsset: String(body.drama_luxury_asset ?? ""),
    dramaUserActor: String(body.drama_user_actor ?? ""),
    dramaWardrobeLevel: String(body.drama_wardrobe_level ?? ""),
    dramaStuntLevel: String(body.drama_stunt_level ?? ""),
    premiumMaterialType: String(body.premium_material_type ?? ""),
    premiumMaterialOption: String(body.premium_material_option ?? "")
  });

  // MVP demo mode: if Supabase keys are missing, return a mock response instead of failing the UI.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({
      request: {
        id: "mock-request",
        title,
        estimated_credits: estimatedCredits,
        status: "pending"
      },
      mode: "mock"
    });
  }

  const userId = String(body.user_id ?? "").trim();

  if (!userId) {
    return Response.json({ error: "User session is required." }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: String(body.user_email ?? ""),
        role: "user"
      }, { onConflict: "id" });

    if (profileError) throw profileError;

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;
    const available = balance - reserved;

    if (available < estimatedCredits) {
      return Response.json({
        error: `Not enough credits. Required: ${estimatedCredits}, available: ${available}. Please buy more credits to continue.`,
        redirect: "/dashboard/credits"
      }, { status: 402 });
    }

    const { error: reserveError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: userId,
        balance,
        reserved: reserved + estimatedCredits,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (reserveError) throw reserveError;

    const { error: reserveEventError } = await supabase
      .from("credit_events")
      .insert({
        user_id: userId,
        type: "reserve",
        amount: estimatedCredits,
        note: `Reserved for request: ${title}`
      });

    if (reserveEventError) throw reserveEventError;

    const { data, error } = await supabase
      .from("video_requests")
      .insert({
        user_id: userId,
        title,
        video_type: body.video_type,
        target_platform: body.target_platform,
        style: body.style,
        prompt,
        language_notes: body.language_notes,
        duration: body.duration,
        extra_notes: body.extra_notes,
        estimated_credits: estimatedCredits,
        reserved_credits: estimatedCredits,
        conversational_mode: body.conversational_mode ?? null,
        conversational_language: body.conversational_language ?? null,
        conversational_voice: body.conversational_voice ?? null,
        extra_language_count: extraLanguageCount,
        voice_tone: body.voice_tone ?? null,
        voice_pace: body.voice_pace ?? null,
        voice_accent: body.voice_accent ?? null,
        voice_age_range: body.voice_age_range ?? null,
        voice_emotion: body.voice_emotion ?? null,
        camera_framing: body.camera_framing ?? null,
        camera_movement: body.camera_movement ?? null,
        lighting_style: body.lighting_style ?? null,
        background_environment: body.background_environment ?? null,
        presenter_appearance: body.presenter_appearance ?? null,
        color_palette: body.color_palette ?? null,
        font_choice: body.font_choice ?? null,
        logo_placement: body.logo_placement ?? null,
        branding_intensity: body.branding_intensity ?? null,
        transition_style: body.transition_style ?? null,
        motion_intensity: body.motion_intensity ?? null,
        caption_style: body.caption_style ?? null,
        bgm_mood: body.bgm_mood ?? null,
        sfx_intensity: body.sfx_intensity ?? null,
        aspect_output: body.aspect_output ?? null,
        frame_rate: body.frame_rate ?? null,
        drama_format: body.drama_format ?? null,
        drama_episode_duration: body.drama_episode_duration ?? null,
        drama_genre: body.drama_genre ?? null,
        drama_tone: body.drama_tone ?? null,
        drama_voice_mode: body.drama_voice_mode ?? null,
        drama_language: body.drama_language ?? null,
        drama_material_level: body.drama_material_level ?? null,
        drama_environment_level: body.drama_environment_level ?? null,
        drama_sound_design_level: body.drama_sound_design_level ?? null,
        drama_production_complexity: body.drama_production_complexity ?? null,
        drama_character_count: body.drama_character_count ?? null,
        drama_character_type: body.drama_character_type ?? null,
        drama_main_character_profile: body.drama_main_character_profile ?? null,
        drama_setting_type: body.drama_setting_type ?? null,
        drama_location_count: body.drama_location_count ?? null,
        drama_prop_level: body.drama_prop_level ?? null,
        drama_dialogue_style: body.drama_dialogue_style ?? null,
        drama_voice_count: body.drama_voice_count ?? null,
        drama_subtitle_mode: body.drama_subtitle_mode ?? null,
        drama_language_count: body.drama_language_count ?? null,
        drama_vehicle_option: body.drama_vehicle_option ?? null,
        drama_luxury_asset: body.drama_luxury_asset ?? null,
        drama_user_actor: body.drama_user_actor ?? null,
        drama_wardrobe_level: body.drama_wardrobe_level ?? null,
        drama_stunt_level: body.drama_stunt_level ?? null,
        premium_material_type: body.premium_material_type ?? null,
        premium_material_option: body.premium_material_option ?? null,
        preview_status: body.preview_status ?? null,
        preview_image_url: body.preview_image_url ?? null,
        preview_prompt: body.preview_prompt ?? null,
        preview_approved: Boolean(body.preview_approved),
        preview_revision_count: Math.max(0, Number(body.preview_revision_count ?? 0) || 0),
        generation_status: "queued",
        generation_provider: "pending-provider",
        generation_started_at: new Date().toISOString(),
        status: "in_production"
      })
      .select("*")
      .single();

    if (error) throw error;

    const generation = await startGeneration({
      id: data.id,
      title: data.title,
      prompt: data.prompt,
      video_type: data.video_type,
      target_platform: data.target_platform,
      style: data.style,
      duration: data.duration,
      extra_notes: data.extra_notes,
      preview_image_url: data.preview_image_url,
      premium_material_type: data.premium_material_type,
      premium_material_option: data.premium_material_option
    });

    const { data: generationData, error: generationUpdateError } = await supabase
      .from("video_requests")
      .update({
        generation_status: generation.status === "failed" ? "failed" : "queued",
        generation_provider: generation.provider,
        generation_job_id: generation.jobId,
        generation_error: generation.error ?? null,
        generation_started_at: new Date().toISOString(),
        status: generation.status === "failed" ? "failed" : "in_production",
        updated_at: new Date().toISOString()
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (generationUpdateError) throw generationUpdateError;

    return Response.json({ request: generationData, generation });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not submit request") }, { status: 500 });
  }
}
