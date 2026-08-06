import { after } from "next/server";
import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { automaticDeliveryLinks } from "@/lib/automatic-delivery-builder";
import { createAutomationJobId, ecommerceAdPipeline, runningAutomationSteps, runningEcommerceAdAutomationSteps } from "@/lib/automation";
import { buildProviderPreflight, detectCharacterDialogueAnimationNeed } from "@/lib/automation-preflight";
import { buildDemoAutomationOutput } from "@/lib/demo-automation";
import { creativeActivityItem, mergeCreativeActivityLog } from "@/lib/creative-director";
import { runEcommerceAdPipeline } from "@/lib/providers/ecommerce-ad";
import { createHeyGenTalkingVideo, createHeyGenVideoAgentSession } from "@/lib/providers/heygen";
import { genericVideoProviderChain, runGenericVideoPipeline } from "@/lib/providers/generic-video";
import { ProviderConfigError } from "@/lib/providers/types";
import { buildCharacterDialogueAnimationPlan } from "@/lib/pipelines/character-dialogue-pipeline";

import { buildProjectDeliveryOutput, isAutomaticProjectDelivery } from "@/lib/project-delivery";
import { buildOutputRegistry } from "@/lib/output-registry";
import { isActiveProviderJob, providerLifecycleFromJobs } from "@/lib/provider-jobs";
import { productionReadyGate } from "@/lib/production-ready-gate";
import { providerReadinessSummary } from "@/lib/provider-readiness";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { isVideoLikeProductionType, launchCapacityPolicy, renderQueuePolicyForPackage, safeActiveVideoJobLimit } from "@/lib/queue-policy";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function ecommerceContextFrom(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const context = record.ecommerceContext;
  if (!context || typeof context !== "object") return null;
  return context as Record<string, unknown>;
}

function stripPostgresUnsafeText(value: string) {
  return value
    .replace(/\\u(?:0000|d[89ab][0-9a-f]{2}|d[c-f][0-9a-f]{2})/gi, "")
    .replace(/\\u(?![0-9a-f]{4})/gi, "")
    .replace(/\\+u0000/gi, "")
    .replace(/[\u0000\uD800-\uDFFF]/g, "");
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return stripPostgresUnsafeText(error.message);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => stripPostgresUnsafeText(value));
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function postgresSafe<T>(value: T): T {
  if (typeof value === "string") return stripPostgresUnsafeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => postgresSafe(item)) as T;
  if (value && typeof value === "object") {
    const shallowCleaned = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, postgresSafe(item)]));
    try {
      return JSON.parse(stripPostgresUnsafeText(JSON.stringify(shallowCleaned))) as T;
    } catch {
      return shallowCleaned as T;
    }
  }
  return value;
}

function safeUpdate<T extends Record<string, unknown>>(payload: T): T {
  return postgresSafe(payload);
}

function pokeAutomationWorker(request: Request, productionId: string) {
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const origin = new URL(request.url).origin;
    const token = String(process.env.CRON_SECRET || process.env.ADMIN_API_TOKEN || "").trim();
    const workerUrl = `${origin}/api/automation/worker?rounds=3&delay_ms=12000&chain=0&max_chains=30&production_id=${encodeURIComponent(productionId)}${token ? `&token=${encodeURIComponent(token)}` : "&kick=dedicated"}`;
    await fetch(workerUrl).catch(() => null);
  });
}

function firstPromptMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = String(match?.[1] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function httpsUrlFrom(value: unknown) {
  const text = String(value ?? "").trim();
  return /^https:\/\//i.test(text) ? text : "";
}

function durationSecondsFromPrompt(text: string) {
  const match = text.match(/Duration target:\s*(\d{1,3})\s*(?:sec|second|seconds|saniye|sn)/i) || text.match(/(\d{1,3})\s*(?:sec|second|seconds|saniye|sn)/i);
  const value = Number(match?.[1] ?? 35) || 35;
  return Math.min(60, Math.max(5, value));
}

function voiceLanguageFromPrompt(text: string) {
  const match = text.match(/Use\s+([^\.]+?)\s+and\s+[^\.]+?\./i);
  return String(match?.[1] ?? "English").trim() || "English";
}

function subtitleSelectedFromPrompt(text: string) {
  return !/no\s+subtitles|without\s+subtitles|altyaz[ıi]\s*yok|altyaz[ıi]\s*olmas[ıi]n/i.test(text);
}

function secondsFromValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const seconds = secondsFromValue(item);
      if (seconds) return seconds;
    }
    return null;
  }
  const text = String(value).trim();
  const number = Number(text.match(/\d+/)?.[0] ?? 0);
  if (!number) return null;
  return /min|dakika|dk/i.test(text) ? number * 60 : number;
}

const DEFAULT_HEYGEN_VIDEO_AGENT_AVATAR_ID = "Jin_expressive_2024112501";
const DEFAULT_HEYGEN_V2_AVATAR_ID = "Daisy-waist-20220505";

type HeyGenPromptControls = {
  subtitlesSelected: boolean;
  largeTextSelected: boolean;
  noPeopleSelected: boolean;
  presenterSelected: boolean;
  voiceDisabled: boolean;
  isTurkish: boolean;
};

function textContainsAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function heygenSpeechBudget(duration: number, isTurkish: boolean) {
  const wordsPerSecond = isTurkish ? 2.25 : 2.5;
  const maxWords = Math.max(12, Math.round(duration * wordsPerSecond));
  const minWords = Math.max(8, Math.round(maxWords * 0.75));
  return { minWords, maxWords };
}

function heygenPromptControls(selected: Record<string, unknown>, promptText: string): HeyGenPromptControls {
  const selectedText = `${JSON.stringify(selected).toLowerCase()} ${promptText.toLowerCase()}`;
  const subtitlesOff = textContainsAny(selectedText, [/no subtitles?/, /altyaz[ıi]\s*(olmas[ıi]n|yok)/, /subtitles?\s*(off|none)/]);
  const subtitlesSelected = !subtitlesOff && textContainsAny(selectedText, [/auto subtitles?/, /burned subtitles?/, /large social captions?/, /altyaz[ıi]/, /subtitle/]);
  const largeTextSelected = textContainsAny(selectedText, [/large social captions?/, /animated text/, /animasyonlu yaz[ıi]lar/, /text overlay/, /kinetic text/, /büyük yaz[ıi]/, /buyuk yaz[ıi]/]);
  const noPeopleSelected = textContainsAny(selectedText, [/no people/, /no presenter/, /no avatar/, /b-?roll only/, /heygennopresentermode/, /insan olmas[ıi]n/, /sunucu olmas[ıi]n/, /sunucusuz/, /humanless/, /without people/, /without presenter/]);
  const presenterSelected = !noPeopleSelected && textContainsAny(selectedText, [/ai presenter/, /with presenter/, /presenter/, /ai sunuculu/, /sunucu/, /ekranda sunucu/, /konu[şs]sun/, /anlats[ıi]n/]);
  const voiceDisabled = textContainsAny(selectedText, [/no voice/, /without voice/, /seslendirme olmas[ıi]n/, /sessiz/]);
  const isTurkish = textContainsAny(selectedText, [/türkçe/, /turkish/, /konu[şs]ma dili türkçe/, /türkçe konu[şs]sun/]);
  return { subtitlesSelected, largeTextSelected, noPeopleSelected, presenterSelected, voiceDisabled, isTurkish };
}

function buildHeyGenVideoAgentPrompt(input: { title: string; prompt: string; script?: string; durationSeconds?: number; aspect?: string; hasVisualFiles?: boolean; controls?: HeyGenPromptControls; presenterPreference?: string }) {
  const duration = Math.min(120, Math.max(5, Number(input.durationSeconds ?? 30) || 30));
  const userPrompt = String(input.prompt || input.title).trim();
  const controls = input.controls ?? heygenPromptControls({}, `${userPrompt} ${input.script ?? ""}`);
  const speechBudget = heygenSpeechBudget(duration, controls.isTurkish);
  const scriptLine = input.script
    ? `Use the user's script/message as source material, but normalize it for ${duration} seconds: keep only the core selling message, target ${speechBudget.minWords}-${speechBudget.maxWords} spoken words, and do not read long prompt instructions aloud. Source script/message:\n${input.script}`
    : `If narration is needed, write a short spoken script for ${duration} seconds, target ${speechBudget.minWords}-${speechBudget.maxWords} spoken words, and keep it natural.`;
  const visualSourceLine = input.hasVisualFiles
    ? "Use the provided website/product visual files as optional quick B-roll or proof references. Do not make the video a slow screen recording."
    : "No real website screenshots are required. Use a clean presenter setup, product/interface-inspired background, subtle callouts, and light motion graphics only.";
  const presenterPreference = String(input.presenterPreference ?? "").trim();
  const presenterLine = controls.presenterSelected && !controls.voiceDisabled
    ? `Presenter policy: use exactly ONE single natural creator-style presenter, the selected avatar only. Keep the same face, outfit style and identity across the video.${presenterPreference ? ` Presenter preference from user setup: ${presenterPreference}. Respect this preference when selecting/generating the presenter.` : ""}`
    : "No-presenter policy: if the user selected no voice/no people, do not show a human presenter; use motion graphics and product/interface visuals instead.";
  const noPeopleConflictLine = controls.presenterSelected && controls.noPeopleSelected
    ? "Selection conflict resolved: user selections contain both presenter and no-people signals. Because this is an AI presenter video, prioritize the single presenter and ignore the no-people signal. Do not add extra people."
    : "";
  const captionLine = controls.subtitlesSelected
    ? "Subtitle policy: subtitles are allowed because the user selected them. Keep them as lower-third readable captions, short line length, never central paragraphs, never covering the face."
    : "Subtitle policy: subtitles are OFF. Do not generate burned-in captions.";
  const largeTextLine = controls.largeTextSelected
    ? "Large text policy: animated/social text is allowed because the user selected it, but limit it to maximum 3 overlays, 2-4 words each, never central paragraphs, never covering the presenter face."
    : "Large text policy: do not use large central text, text-card slideshow, or paragraph overlays. At most one small final CTA label is allowed.";
  const speechLine = controls.voiceDisabled
    ? "Audio policy: user selected no voice/silent mode, so do not create presenter dialogue. Use music/sound design only if appropriate."
    : controls.isTurkish
      ? `Turkish speech policy: presenter must speak natural Turkish only. Use simple short Turkish sentences, target ${speechBudget.minWords}-${speechBudget.maxWords} words for ${duration} seconds, and do not rush, distort, invent words or mispronounce. If the user's text is longer, shorten it.`
      : `Speech policy: use clear natural presenter speech, target ${speechBudget.minWords}-${speechBudget.maxWords} words for ${duration} seconds. If the user's text is longer, shorten it instead of rushing.`;

  return [
    `Create a complete ${duration}-second high-converting vertical product demo / promotional video for Crelavo.`,
    `User request: ${userPrompt}`,
    scriptLine,
    visualSourceLine,
    "Creative structure: open with a strong spoken hook in the first 2 seconds, keep the idea easy to understand, use only a few quick product/interface cutaways or small callouts, and finish with one sharp CTA.",
    /competitor|comparison|compare|alternative|position\s+crelavo|rakip|karşılaştır|karsilastir|alternatif/i.test(userPrompt)
      ? "Competitor comparison mode: analyze the competitor page's public offer and benefits, then create an original Crelavo comparison ad. Do not copy competitor wording, visuals, logo, brand assets, claims, UI, or exact layout. Avoid defamatory claims; use fair, high-level positioning only."
      : "",
    "Style paragraph: natural AI presenter ad or clean product demo, fast but understandable social media pacing, subtle product/result callouts, light motion graphics, clean tech overlays, smooth transitions, premium but not corporate.",
    presenterLine,
    noPeopleConflictLine,
    "Background guard: default to a clean modern tech studio, clean SaaS creator setup, product interface background, or subtle motion-graphics background. Avoid office meeting rooms and background people unless explicitly requested.",
    captionLine,
    largeTextLine,
    speechLine,
    "Ending direction: finish with one short complete CTA sentence and stop cleanly. Do not trail off or make the ending sound unfinished.",
    "Hard avoid: multiple people, background people, meeting room, boardroom, panel discussion, stock office footage, static screenshot zoom loop, slow slideshow, central text paragraphs, unreadable text, rushed speech, wrong language, silent presenter."
  ].filter(Boolean).join("\n\n");
}

async function startHeyGenVideoAgentProduction(input: { title: string; prompt: string; requestMetadata: Record<string, unknown>; inputJson: Record<string, unknown> }) {
  const selected = { ...input.requestMetadata, ...input.inputJson } as Record<string, unknown>;
  const promptText = String(input.prompt ?? "");
  const promptAvatarId = firstPromptMatch(promptText, [/Preferred HeyGen avatar:\s*([A-Za-z0-9_\-.]+)/i, /heygen_avatar_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i, /avatar_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i]);
  const promptVoiceId = firstPromptMatch(promptText, [/voice_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i, /heygen_voice_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i]);
  const promptStyleId = firstPromptMatch(promptText, [/style_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i, /heygen_style_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i]);
  const promptBrandKitId = firstPromptMatch(promptText, [/brand_kit_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i, /heygen_brand_kit_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i]);
  const scriptFromPrompt = firstPromptMatch(promptText, [/Script:\s*[“\"]?([\s\S]*?)[”\"]?\s*(?:Important rules:|Video requirements:|$)/i]);
  const aspect = String(selected.aspectRatio ?? selected.aspect_ratio ?? "9:16");
  const portrait = aspect.includes("9:16") || aspect.toLowerCase().includes("vertical");
  const productionSetup = selected.productionSetup && typeof selected.productionSetup === "object" ? selected.productionSetup as Record<string, unknown> : {};
  const plan = selected.plan && typeof selected.plan === "object" ? selected.plan as Record<string, unknown> : {};
  const durationSeconds = secondsFromValue(selected.durationSeconds)
    ?? secondsFromValue(selected.duration_seconds)
    ?? secondsFromValue(selected.targetDurationSeconds)
    ?? secondsFromValue(selected.output_duration_seconds)
    ?? secondsFromValue(selected.outputDurationSeconds)
    ?? secondsFromValue(productionSetup.duration)
    ?? secondsFromValue(plan.selected_duration)
    ?? secondsFromValue(selected.duration)
    ?? 30;
  const avatarId = String(selected.heygen_avatar_id ?? selected.avatar_id ?? promptAvatarId ?? process.env.HEYGEN_VIDEO_AGENT_AVATAR_ID ?? process.env.HEYGEN_DEFAULT_AVATAR_ID ?? DEFAULT_HEYGEN_VIDEO_AGENT_AVATAR_ID).trim() || DEFAULT_HEYGEN_VIDEO_AGENT_AVATAR_ID;
  const voiceId = String(selected.heygen_voice_id ?? selected.voice_id ?? promptVoiceId ?? process.env.HEYGEN_VIDEO_AGENT_VOICE_ID ?? process.env.HEYGEN_DEFAULT_VOICE_ID ?? "").trim() || null;
  const styleId = String(selected.heygen_style_id ?? selected.style_id ?? promptStyleId ?? process.env.HEYGEN_VIDEO_AGENT_STYLE_ID ?? "").trim() || null;
  const brandKitId = String(selected.heygen_brand_kit_id ?? selected.brand_kit_id ?? promptBrandKitId ?? process.env.HEYGEN_BRAND_KIT_ID ?? "").trim() || null;
  const screenshotUrl = httpsUrlFrom(selected.websiteScreenshotUrl) || httpsUrlFrom(selected.screenshotUrl) || httpsUrlFrom(selected.website_screenshot_url);
  const productUrl = httpsUrlFrom(selected.productUrl) || httpsUrlFrom(selected.websiteUrl) || httpsUrlFrom(selected.url);
  const files = [screenshotUrl, productUrl].filter(Boolean).slice(0, 20).map((url) => ({ type: "url" as const, url }));
  const explicitScript = String(selected.script ?? scriptFromPrompt ?? "").trim();
  const presenterPreference = Array.isArray(productionSetup.presenterChoice) ? productionSetup.presenterChoice.join(", ") : String(productionSetup.presenterChoice ?? selected.selected_presenter_name ?? selected.presenterChoice ?? "").trim();
  const controls = heygenPromptControls(selected, `${input.prompt} ${explicitScript} ${presenterPreference}`);
  const noPresenterMode = controls.noPeopleSelected || /no presenter|b-roll only|sunucusuz|voice-over only/i.test(`${input.prompt} ${explicitScript} ${presenterPreference}`);
  const payload = {
    prompt: buildHeyGenVideoAgentPrompt({ title: input.title, prompt: input.prompt, script: explicitScript, durationSeconds, aspect, hasVisualFiles: files.length > 0, controls, presenterPreference }),
    mode: "generate" as const,
    avatar_id: noPresenterMode ? null : avatarId,
    voice_id: voiceId,
    style_id: styleId,
    brand_kit_id: brandKitId,
    orientation: portrait ? "portrait" as const : "landscape" as const,
    files: files.length ? files : null,
    callback_id: String(selected.callback_id ?? selected.callbackId ?? "").trim() || null,
    incognito_mode: true,
    include_narrator: !noPresenterMode,
    include_voice: !controls.voiceDisabled,
    scene_type: noPresenterMode ? "b_roll" : "a_roll",
    clips: noPresenterMode ? (explicitScript ? [{ input_text: explicitScript, image: screenshotUrl || productUrl || undefined }] : files.length ? files.map((file) => ({ input_text: input.prompt, image: file.type === "url" ? file.url : undefined })) : null) : null,
    blueprint: noPresenterMode ? { include_narrator: false, include_voice: true, scene_type: "b_roll", clips: files.length ? files : null } : null
  };
  const result = await createHeyGenVideoAgentSession(payload);
  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const sessionId = String(data.session_id ?? data.sessionId ?? data.id ?? "").trim();
  if (!sessionId) throw new Error(`HeyGen Video Agent did not return a session id: ${JSON.stringify(result).slice(0, 500)}`);
  return postgresSafe({ provider: "heygen_video_agent", id: sessionId, status: String(data.status ?? "generating"), videoId: String(data.video_id ?? data.videoId ?? "").trim() || null, payload, raw: result });
}

async function startHeyGenTalkingProduction(input: { title: string; prompt: string; requestMetadata: Record<string, unknown>; inputJson: Record<string, unknown> }) {
  const selected = { ...input.requestMetadata, ...input.inputJson } as Record<string, unknown>;
  const promptText = String(input.prompt ?? "");
  const promptAvatarId = firstPromptMatch(promptText, [/Preferred HeyGen avatar:\s*([A-Za-z0-9_\-.]+)/i, /heygen_avatar_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i, /avatar_id\s*[:=]\s*([A-Za-z0-9_\-.]+)/i]);
  const scriptFromPrompt = firstPromptMatch(promptText, [/Script:\s*[“\"]?([\s\S]*?)[”\"]?\s*(?:Important rules:|Video requirements:|$)/i]);
  const script = String(selected.input_text ?? selected.inputText ?? selected.script ?? scriptFromPrompt ?? input.prompt ?? input.title).trim().slice(0, 1200) || "Merhaba Crelavo dünyasına hoş geldiniz!";
  const aspect = String(selected.aspectRatio ?? selected.aspect_ratio ?? selected.ratio ?? "16:9");
  const ratio = aspect.includes("9:16") || aspect.toLowerCase().includes("vertical") ? "9:16" : "16:9";
  const avatarId = String(selected.heygen_avatar_id ?? selected.avatar_id ?? promptAvatarId ?? process.env.HEYGEN_DEFAULT_AVATAR_ID ?? DEFAULT_HEYGEN_V2_AVATAR_ID).trim() || DEFAULT_HEYGEN_V2_AVATAR_ID;
  const payload = {
    video_setting: { ratio, output_format: "mp4" },
    clips: [{
      avatar_id: avatarId,
      input_text: script,
      avatar_style: String(selected.avatar_style ?? selected.avatarStyle ?? "normal")
    }]
  };
  const result = await createHeyGenTalkingVideo(payload);
  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const videoId = String(data.video_id ?? data.videoId ?? data.id ?? "").trim();
  if (!videoId) throw new Error(`HeyGen v2 generate did not return a video id: ${JSON.stringify(result).slice(0, 500)}`);
  return postgresSafe({ provider: "heygen", id: videoId, status: String(data.status ?? "processing"), videoId, payload, raw: result });
}

async function requireAutomationAccess(request: Request, body: Record<string, unknown>, production: { user_id?: string | null }) {
  if (isAdminRequest(request, body)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  const userId = String(body.user_id ?? productionUserId).trim();
  if (!productionUserId || !userId || userId !== productionUserId) return { ok: false as const, response: adminRequiredResponse() };
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return { ok: true as const };
  return { ok: true as const };
}

async function selectProductionForAutomation(supabase: ReturnType<typeof supabaseAdmin>, productionId: string) {
  // Drone auto-start must not read JSON/JSONB columns before the provider is attached.
  // A malformed legacy JSON value in request_metadata/input_json/output_json can make
  // Postgres reject the entire row with 22P05 before the drone pipeline even starts.
  const scalar = await supabase
    .from("production_requests")
    .select("id, user_id, title, prompt, status, generation_status, production_type, package_id, reserved_credits")
    .eq("id", productionId)
    .single();

  if (scalar.error || !scalar.data) return { data: scalar.data ?? null, error: scalar.error };
  const productionType = String(scalar.data.production_type ?? "");
  if (productionType === "drone_video") {
    const promptText = String(scalar.data.prompt ?? "");
    const durationSeconds = durationSecondsFromPrompt(promptText);
    const voiceLanguage = voiceLanguageFromPrompt(promptText);
    const subtitles = subtitleSelectedFromPrompt(promptText);
    const safeDroneMetadata = {
      productionType: "drone_video",
      preferredProvider: "auto_drone_video",
      outputDurationSeconds: durationSeconds,
      voiceLanguage,
      selectedOptions: { voiceOver: true, finalRender: true, subtitles },
      droneDetails: { duration: `${durationSeconds} sec`, narrationLanguage: voiceLanguage, subtitleOption: subtitles ? "Subtitles" : "No subtitles" }
    };
    return {
      data: postgresSafe({
        ...scalar.data,
        request_metadata: safeDroneMetadata,
        input_json: safeDroneMetadata,
        output_json: {}
      }),
      error: null
    };
  }

  const result = await supabase
    .from("production_requests")
    .select("id, user_id, title, prompt, status, generation_status, production_type, package_id, reserved_credits, request_metadata, input_json, output_json")
    .eq("id", productionId)
    .single();

  if (!result.error) {
    return { data: result.data ? postgresSafe({ ...result.data, output_json: result.data.output_json ?? {} }) : null, error: result.error };
  }

  const message = errorMessage(result.error, "Production select failed");
  if (!/22P05|unicode escape|cannot be converted to text/i.test(message)) return { data: null, error: result.error };
  return {
    data: postgresSafe({
      ...scalar.data,
      request_metadata: { preferredProvider: "heygen_video_agent", productionType },
      input_json: { preferredProvider: "heygen_video_agent", productionType },
      output_json: { providerRecovery: { reason: message, mode: "json_payload_repair" }, preferredProvider: "heygen_video_agent", productionType }
    }),
    error: null
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const productionId = String(body.production_id ?? "").trim();
    const guardConfig = apiCostGuardConfig();
    const routeBudget = enforceRouteBudget(request, { route: "automation:start", userId: String(body.user_id ?? ""), ipLimit: guardConfig.automationStartIpLimit, userLimit: guardConfig.automationStartUserLimit, windowMs: 15 * 60 * 1000 });
    if (!routeBudget.ok) return routeBudget.response;

    if (!productionId) {
      return Response.json({ error: "production_id is required." }, { status: 400 });
    }

    const jobId = createAutomationJobId();
    const now = new Date().toISOString();
    const supabase = supabaseAdmin();

    const { data: currentProduction, error: currentError } = await selectProductionForAutomation(supabase, productionId);

    if (currentError) throw currentError;
    if (!currentProduction) throw new Error("Production not found");
    const access = await requireAutomationAccess(request, body, currentProduction);
    if (!access.ok) return access.response;

    const existingOutput = postgresSafe(currentProduction.output_json && typeof currentProduction.output_json === "object" ? currentProduction.output_json as Record<string, unknown> : {});
    const forceRegenerate = body.force_regenerate === true;
    const forceStart = body.force_start === true;
    const existingCreditResolution = existingOutput.creditResolution && typeof existingOutput.creditResolution === "object" ? existingOutput.creditResolution as Record<string, unknown> : null;
    if (existingCreditResolution?.status === "refunded_reserved") {
      return Response.json({ error: "Reserved credits were already refunded for this failed production. Create a new production before starting another provider job." }, { status: 409 });
    }
    const requestMetadata = postgresSafe(currentProduction.request_metadata && typeof currentProduction.request_metadata === "object"
      ? currentProduction.request_metadata as Record<string, unknown>
      : existingOutput.requestMetadata && typeof existingOutput.requestMetadata === "object"
        ? existingOutput.requestMetadata as Record<string, unknown>
        : {});
    const inputJson = postgresSafe(currentProduction.input_json && typeof currentProduction.input_json === "object"
      ? currentProduction.input_json as Record<string, unknown>
      : requestMetadata.inputJson && typeof requestMetadata.inputJson === "object"
        ? requestMetadata.inputJson as Record<string, unknown>
        : existingOutput.inputJson && typeof existingOutput.inputJson === "object"
          ? existingOutput.inputJson as Record<string, unknown>
          : {});
    let productionType = String(currentProduction?.production_type ?? "");
    const packageId = String(currentProduction?.package_id ?? "");
    const productionDetectionText = `${productionType} ${packageId} ${currentProduction.title ?? ""} ${currentProduction.prompt ?? ""} ${JSON.stringify(requestMetadata)} ${JSON.stringify(inputJson)} ${JSON.stringify(existingOutput)}`.toLowerCase();
    if (!["animation", "anime_short_film", "video", "cinematic_video", "documentary", "drone_video", "studio", "drama", "stickman_animation"].includes(productionType) && /animasyon|animation|animation video|final mp4|scene plan/.test(productionDetectionText)) {
      productionType = "animation";
    }
    const renderQueuePolicy = renderQueuePolicyForPackage(packageId);
    const capacityPolicy = launchCapacityPolicy();
    const deliveryLinks = automaticDeliveryLinks(productionId);
    const outputRegistryBase = {
      ...currentProduction,
      delivery_link: deliveryLinks.deliveryLink,
      delivery_zip_url: deliveryLinks.deliveryZipUrl,
      source_files_url: deliveryLinks.sourceFilesUrl,
      readme_url: deliveryLinks.readmeUrl,
      preview_url: deliveryLinks.previewUrl
    };
    const providerPreflight = buildProviderPreflight({
      productionType,
      requestMetadata,
      inputJson,
      videoProvider: process.env.VIDEO_PROVIDER || process.env.GENERATION_PROVIDER || "replicate",
      replicateModel: process.env.REPLICATE_MODEL
    });
const isDroneProduction = productionType === "drone_video";
const heygenForcedByMetadata = !isDroneProduction && /heygen|heygen_video_agent|video_agent/i.test(String(requestMetadata.preferredProvider ?? inputJson.preferredProvider ?? existingOutput.preferredProvider ?? ""));
const talkingProviderType = !isDroneProduction && (["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(productionType) || heygenForcedByMetadata);
    const providerReadiness = providerReadinessSummary(talkingProviderType ? "talking_video" : productionType, packageId);
const characterDialogueNeed = talkingProviderType ? { required: false, reason: "talking_provider_type_uses_heygen_first", signals: [] } : detectCharacterDialogueAnimationNeed(productionDetectionText);
if (characterDialogueNeed.required) {
  const characterDialoguePlan = buildCharacterDialogueAnimationPlan(String(currentProduction.prompt ?? productionDetectionText), Number(providerPreflight.durationSeconds ?? 30) || 30);
  const dedicatedOutput = {
        ...existingOutput,
        automationMode: "dedicated_character_dialogue_pipeline",
        automationStatus: "running",
        providerStatus: "character_dialogue_plan_created",
        requiredPipeline: "character_consistent_dialogue_animation",
        providerPreflight,
        blockedReason: characterDialogueNeed.reason,
        detectionSignals: characterDialogueNeed.signals,
        characterDialoguePlan,
        readySceneClipUrls: [],
        recommendedNextStep: "Dedicated character-dialogue animation plan is attached. Use Track status to generate character sheets, scene images, I2V clips, voices and final assembly step by step."
      };
      const { data: dedicatedProduction, error: dedicatedError } = await supabase
        .from("production_requests")
        .update({
          status: "in_production",
          automation_status: "running",
          generation_status: "character_dialogue_i2v_started",
          output_json: dedicatedOutput,
          admin_notes: "Dedicated character-dialogue animation pipeline started: character sheets, scene images, I2V jobs and per-character voice segments were prepared. Poll status for final assembly.",
          started_at: now,
          updated_at: now
        })
        .eq("id", productionId)
        .select("*")
        .single();
      if (dedicatedError) throw dedicatedError;
      pokeAutomationWorker(request, productionId);
      return Response.json({ production: dedicatedProduction, dedicated_started: true, requiredPipeline: "character_consistent_dialogue_animation", worker_started: true, message: dedicatedOutput.recommendedNextStep });
    }
    if (isActiveProviderJob(existingOutput.visualJob) || isActiveProviderJob(existingOutput.renderJob)) {
      return Response.json({
        job_id: existingOutput.jobId ?? null,
        production: currentProduction,
        already_running: true,
        force_start_ignored: forceStart,
        message: "An active provider job already exists for this production; no new job was opened."
      });
    }

if (talkingProviderType && providerReadiness.canStartRealProvider) {
  const startRequestedOutput = {
    ...existingOutput,
    automationMode: "fully_automatic",
    automationStatus: "running",
    providerStatus: "heygen_start_requested",
    requiredPipeline: "talking_lip_sync",
    jobId,
    currentStep: "HeyGen talking/lip-sync provider start requested",
    providerReadiness,
    workflowState: buildProductionWorkflowState({ ...currentProduction, status: "in_production", automation_status: "running", generation_status: "heygen_start_requested", output_json: { ...existingOutput, providerReadiness } })
  };
  const { error: startRequestedError } = await supabase
    .from("production_requests")
    .update(safeUpdate({ status: "in_production", automation_status: "running", generation_status: "heygen_start_requested", output_json: startRequestedOutput, admin_notes: "HeyGen talking/lip-sync start requested.", started_at: now, updated_at: now }))
    .eq("id", productionId);
  if (startRequestedError) throw new Error(`heygen_start_requested_update: ${errorMessage(startRequestedError, "DB update failed")}`);

  const useHeyGenVideoAgent = /heygen_video_agent|video_agent|heygen_v3|v3 video agent/i.test(productionDetectionText);
  let heygenJob: Awaited<ReturnType<typeof startHeyGenVideoAgentProduction>> | Awaited<ReturnType<typeof startHeyGenTalkingProduction>>;
  try {
    heygenJob = useHeyGenVideoAgent
      ? await startHeyGenVideoAgentProduction({ title: String(currentProduction.title ?? "Talking video"), prompt: String(currentProduction.prompt ?? ""), requestMetadata, inputJson })
      : await startHeyGenTalkingProduction({ title: String(currentProduction.title ?? "Talking video"), prompt: String(currentProduction.prompt ?? ""), requestMetadata, inputJson });
  } catch (error) {
  const failureMessage = errorMessage(error, "HeyGen provider job could not be started.");
  const reservedCredits = Number(currentProduction.reserved_credits ?? 0) || 0;
  if (reservedCredits > 0) {
    const { data: balanceRow } = await supabase.from("credit_balances").select("balance,reserved").eq("user_id", currentProduction.user_id).single();
    if (balanceRow) {
      await supabase.from("credit_balances").upsert({ user_id: currentProduction.user_id, balance: Number(balanceRow.balance ?? 0) + reservedCredits, reserved: Math.max(0, Number(balanceRow.reserved ?? 0) - reservedCredits), updated_at: now }, { onConflict: "user_id" });
      await supabase.from("credit_events").insert({ user_id: currentProduction.user_id, type: "refund", amount: reservedCredits, note: `Released reserved credits because HeyGen did not create a provider job: ${failureMessage}` });
    }
  }
  const failedOutput = {
      ...startRequestedOutput,
      automationStatus: "provider_start_failed",
      providerStatus: "heygen_start_failed",
      providerErrors: { heygen: failureMessage },
      currentStep: "HeyGen start failed before provider job id was created"
    };
    const { data: failedProduction, error: failedUpdateError } = await supabase
      .from("production_requests")
      .update(safeUpdate({ status: "queued", automation_status: "provider_start_failed", generation_status: "heygen_start_failed", reserved_credits: 0, output_json: failedOutput, admin_notes: `HeyGen start failed before job id: ${failureMessage}`, error_message: failureMessage, updated_at: now }))
      .eq("id", productionId)
      .select("*")
      .single();
    if (failedUpdateError) throw new Error(`heygen_start_failed_update: ${errorMessage(failedUpdateError, "DB update failed")}; original: ${failureMessage}`);
    return Response.json({ error: failureMessage, production: failedProduction, provider_started: false, provider_start_failed: true }, { status: 502 });
  }
      const talkingOutput = {
        ...existingOutput,
        automationMode: "fully_automatic",
        automationStatus: "running",
        providerStatus: heygenJob.provider === "heygen_video_agent" ? "heygen_video_agent_session_created" : "heygen_job_created",
        requiredPipeline: heygenJob.provider === "heygen_video_agent" ? "heygen_video_agent" : "talking_lip_sync",
        jobId,
        heygenJob,
        heygenSessionId: heygenJob.provider === "heygen_video_agent" ? heygenJob.id : null,
        heygenVideoId: "videoId" in heygenJob ? heygenJob.videoId : null,
        heygenProviderProof: heygenJob.provider === "heygen_video_agent" ? { provider: "heygen_video_agent", sessionId: heygenJob.id, videoId: "videoId" in heygenJob ? heygenJob.videoId : null, status: heygenJob.status } : { provider: "heygen_v2_generate", videoId: heygenJob.id, status: heygenJob.status },
        heygenVideoAgent: heygenJob.provider === "heygen_video_agent" ? heygenJob : null,
        heygenAgentBridge: heygenJob.provider === "heygen_video_agent" ? { mode: "native_session_artifacts", sessionId: heygenJob.id, status: "tracking_session_resources", artifactField: "heygenAgentArtifacts" } : null,
        heygenAgentArtifacts: [],
        latestHeyGenVideoArtifact: null,
        visualJob: { provider: heygenJob.provider, id: heygenJob.id, status: heygenJob.status, type: heygenJob.provider === "heygen_video_agent" ? "video_agent" : "talking_lip_sync", raw: heygenJob.raw },
        visualJobs: [{ provider: heygenJob.provider, id: heygenJob.id, status: heygenJob.status, type: heygenJob.provider === "heygen_video_agent" ? "video_agent" : "talking_lip_sync", raw: heygenJob.raw }],
        creativeActivityLog: mergeCreativeActivityLog(existingOutput.creativeActivityLog ?? requestMetadata.creativeActivityLog ?? inputJson.creativeActivityLog, [
          creativeActivityItem("provider-job", "Provider job", "working", heygenJob.provider === "heygen_video_agent" ? `HeyGen Video Agent session created: ${heygenJob.id}` : `HeyGen talking provider job created: ${heygenJob.id}`, heygenJob.provider),
          creativeActivityItem("a-roll", "A-roll scene", "working", "Presenter A-roll generation is now running with the selected provider.", heygenJob.provider),
          creativeActivityItem("b-roll", "B-roll / UI overlays", "working", "Motion graphics, product proof overlays and captions are being prepared by the provider.", heygenJob.provider)
        ]),
        currentStep: heygenJob.provider === "heygen_video_agent" ? "HeyGen Video Agent session created" : "HeyGen talking/lip-sync provider job created",
        providerReadiness,
        workflowState: buildProductionWorkflowState({ ...currentProduction, status: "in_production", automation_status: "running", generation_status: "heygen_job_created", output_json: { ...existingOutput, heygenJob, providerReadiness } })
      };
      const { data: talkingProduction, error: talkingError } = await supabase
        .from("production_requests")
        .update(safeUpdate({ status: "in_production", automation_status: "running", generation_status: "heygen_job_created", output_json: talkingOutput, admin_notes: `HeyGen talking/lip-sync job started: ${heygenJob.id}.`, started_at: now, updated_at: now }))
        .eq("id", productionId)
        .select("*")
        .single();
      if (talkingError) throw new Error(`heygen_job_created_update: ${errorMessage(talkingError, "DB update failed")}`);
      return Response.json({ job_id: jobId, production: talkingProduction, provider_job: heygenJob, provider_started: true });
    }

    if (!providerReadiness.canStartRealProvider) {
      const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
      const waitingLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: existingOutput }, {});
      const waitingOutput = {
        ...demoOutput,
        providerPreflight,
        providerReadiness,
        providerStatus: "waiting_provider_config",
        providerLifecycle: { visual: waitingLifecycle.visual, render: waitingLifecycle.render },
        automaticDeliveryLinks: deliveryLinks,
        outputRegistry: waitingLifecycle.outputRegistry,
        currentStep: "Waiting for provider/API configuration",
        userMessage: providerReadiness.userMessage,
        workflowState: buildProductionWorkflowState({ ...currentProduction, status: "queued", automation_status: "waiting_provider_config", generation_status: "waiting_provider_config", output_json: { ...demoOutput, providerReadiness } })
      };
        const { data: waitingProduction, error: waitingError } = await supabase
          .from("production_requests")
          .update({
            status: "queued",
            generation_status: "waiting_provider_config",
            output_json: waitingOutput,
            admin_notes: providerReadiness.userMessage,
            updated_at: now
          })
        .eq("id", productionId)
        .select("*")
        .single();
      if (waitingError) throw waitingError;
      return Response.json({ job_id: jobId, production: waitingProduction, provider_readiness: providerReadiness, waiting_provider_config: true });
    }

    const activeJobLimit = safeActiveVideoJobLimit();
    if (isVideoLikeProductionType(productionType) && !forceStart) {
      const { data: activeVideoRows, error: activeVideoJobsError } = await supabase
        .from("production_requests")
        .select("id, status, generation_status, output_json")
        .neq("status", "deleted")
        .in("production_type", ["video", "campaign", "music_video", "stickman_animation", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "studio", "drama", "cinematic_video", "video_tools", "video_clipping", "avatar", "lip_sync", "localization", "cultural_localization"])
        .limit(100);
      if (activeVideoJobsError) throw activeVideoJobsError;
      const activeVideoJobs = (activeVideoRows ?? []).filter((row) => {
        const status = String(row.status ?? "").toLowerCase();
        const generationStatus = String(row.generation_status ?? "").toLowerCase();
        const output = row.output_json && typeof row.output_json === "object" ? row.output_json as Record<string, unknown> : {};
        const outputAutomationStatus = String(output.automationStatus ?? "").toLowerCase();
        const hasActiveProviderJob = isActiveProviderJob(output.visualJob) || isActiveProviderJob(output.renderJob);
        return hasActiveProviderJob || /provider_started|provider_visual_job_created|render_job_created|processing/.test(generationStatus) || /provider_started|processing/.test(outputAutomationStatus);
      }).length;
      if (activeVideoJobs >= activeJobLimit) {
        const queuedOutput = {
          ...existingOutput,
          automationMode: "fully_automatic",
          jobId: existingOutput.jobId ?? null,
          queueStatus: "waiting_for_video_provider_slot",
          currentStep: "Queued for render slot",
          renderQueuePolicy,
          capacityPolicy,
          activeVideoJobs,
          activeJobLimit,
          userMessage: renderQueuePolicy.userMessage,
          workflowState: buildProductionWorkflowState({ ...currentProduction, status: "queued", automation_status: "queued", generation_status: "queued_for_render_slot", output_json: existingOutput })
        };
        const { data: queuedProduction, error: queueError } = await supabase
          .from("production_requests")
          .update({
            status: "queued",
            generation_status: "queued_for_render_slot",
            output_json: queuedOutput,
            admin_notes: `Queued by ${renderQueuePolicy.label}. Active video provider jobs: ${activeVideoJobs}/${activeJobLimit}.`,
            updated_at: now
          })
          .eq("id", productionId)
          .select("*")
          .single();
        if (queueError) throw queueError;
        return Response.json({
          queued: true,
          production: queuedProduction,
          render_queue_policy: renderQueuePolicy,
          active_video_jobs: activeVideoJobs,
          active_job_limit: activeJobLimit,
          message: renderQueuePolicy.userMessage
        });
      }
    }

    const isProjectDelivery = isAutomaticProjectDelivery(productionType, packageId);
    const isProductAdVideo = currentProduction?.package_id === "campaign_product_ad_video" || currentProduction?.production_type === "campaign";
    if (isProjectDelivery && !isProductAdVideo) {
      const alreadyReady = String(currentProduction.status ?? "").toLowerCase() === "ready"
        || String(currentProduction.generation_status ?? "").toLowerCase() === "project_delivery_ready"
        || String(existingOutput.automationStatus ?? "").toLowerCase() === "ready"
        || String(existingOutput.pipelineType ?? "").toLowerCase() === "automatic_project_source_package";
      if (alreadyReady && !forceRegenerate) {
        return Response.json({
          job_id: existingOutput.jobId ?? null,
          production: currentProduction,
          project_delivery_ready: true,
          already_ready: true,
          message: "Project package is already ready."
        });
      }

      const projectOutput = buildProjectDeliveryOutput(currentProduction, jobId);
      const readyGate = productionReadyGate({ ...currentProduction, preview_url: projectOutput.previewUrl, delivery_link: projectOutput.deliveryLink, delivery_zip_url: projectOutput.deliveryZipUrl, source_files_url: projectOutput.sourceFilesUrl, readme_url: projectOutput.readmeUrl, output_json: projectOutput }, projectOutput);
      const gatedProjectOutput = { ...projectOutput, readyGate, qualityGate: { status: readyGate.passed ? "passed" : "blocked", checkedAt: now, required: readyGate.required, missing: readyGate.missing, warnings: readyGate.warnings } };
      const { data: projectProduction, error: projectError } = await supabase
        .from("production_requests")
        .update({
          status: readyGate.passed ? "ready" : "in_production",
          automation_status: readyGate.passed ? "completed" : "quality_blocked",
          generation_status: readyGate.passed ? "project_delivery_ready" : "quality_gate_blocked",
          preview_url: projectOutput.previewUrl,
          delivery_link: readyGate.passed ? projectOutput.deliveryLink : null,
          delivery_zip_url: readyGate.passed ? projectOutput.deliveryZipUrl : null,
          source_files_url: projectOutput.sourceFilesUrl,
          output_json: gatedProjectOutput,
          admin_notes: readyGate.passed ? "Automatic project/source delivery package generated and passed ready gate." : `Project package generated but blocked by ready gate. Missing: ${readyGate.missing.join(", ")}`,
          updated_at: now
        })
        .eq("id", productionId)
        .select("*")
        .single();
      if (projectError) throw projectError;
      return Response.json({ job_id: jobId, production: projectProduction, project_delivery_ready: readyGate.passed, ready_gate: readyGate });
    }

    const pipeline = isProductAdVideo ? ecommerceAdPipeline() : null;
    const steps = isProductAdVideo ? runningEcommerceAdAutomationSteps() : runningAutomationSteps();
    const updatePayload: Record<string, unknown> = {
      status: "in_production",
      generation_status: isProductAdVideo ? "scrape_analyze_running" : "strategy_running",
      output_json: {
        automationMode: "fully_automatic",
        jobId,
        currentStep: isProductAdVideo ? "Product scraping and GPT-4o ad analysis" : "AI strategy and brief analysis",
        pipelineType: isProductAdVideo ? "ecommerce_product_ad_video" : "general_production",
        providerPipeline: pipeline,
        providerPreflight,
        renderQueuePolicy,
        capacityPolicy,
        activeJobLimit,
        automationStatus: "running",
        automationSteps: steps,
        chain: pipeline?.chain ?? null,
          note: isProductAdVideo
            ? "Backend orchestration will scrape the product link, create a GPT-4o ad script, generate visuals, create ElevenLabs voice-over, time subtitles with Whisper and render the final MP4 with Shotstack/Remotion."
            : "Provider pipeline will generate strategy, assets, package and delivery link automatically.",
          workflowState: buildProductionWorkflowState({ ...currentProduction, status: "in_production", automation_status: "running", generation_status: isProductAdVideo ? "scrape_analyze_running" : "strategy_running", output_json: existingOutput })
        },

      updated_at: now,
      admin_notes: isProductAdVideo
        ? "Product ad automation started. Admin monitors provider failures, payments, support emails and unusual requests only."
        : "Automatic workflow started. Admin monitors failed jobs, payments, support emails and unusual requests only."
    };

    if (isProductAdVideo) {
      updatePayload.approval_status = "waiting";
      updatePayload.approval_question = "Which creative direction should automation use before starting ad production?";
      updatePayload.approval_options = [
        { label: "Best-selling ad formula", description: "Hook, problem, solution, proof and CTA structure.", extraCredits: 0 },
        { label: "Premium brand tone", description: "More upscale visual language and a trust-building voice tone.", extraCredits: 800 },
        { label: "Aggressive TikTok sales angle", description: "Strong first-three-seconds hook and fast editing rhythm.", extraCredits: 600 }
      ];
      updatePayload.extra_credit_required = 0;
    }

    if (isProductAdVideo) {
      const { error } = await supabase
        .from("production_requests")
        .update(updatePayload)
        .eq("id", productionId)
        .select("*")
        .single();

      if (error) throw error;
    }

    if (isProductAdVideo) {
      const ecommerceContext = ecommerceContextFrom(requestMetadata) ?? ecommerceContextFrom(inputJson) ?? ecommerceContextFrom(existingOutput);
      const productUrl = String(ecommerceContext?.productUrl ?? "").trim();

      if (!productUrl) {
        const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
          .update({
            status: "in_production",
            generation_status: "preview_ready",
            output_json: {
              ...demoOutput,
              automationStatus: "demo_ready",
              automaticDeliveryLinks: deliveryLinks,
              outputRegistry: buildOutputRegistry({ ...outputRegistryBase, output_json: demoOutput }),
              previewUrl: deliveryLinks.previewUrl,
              deliveryLink: deliveryLinks.deliveryLink,
              deliveryZipUrl: deliveryLinks.deliveryZipUrl,
              sourceFilesUrl: deliveryLinks.sourceFilesUrl,
              readmeUrl: deliveryLinks.readmeUrl
            },
            admin_notes: "Demo automation filled workspace because no external product URL/provider input was supplied.",
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();
        if (demoError) throw demoError;
        return Response.json({ job_id: jobId, production: demoProduction, demo: true });
      }

      try {
        const result = await runEcommerceAdPipeline({
          productionId,
          jobId,
          productUrl,
          campaignGoal: String(ecommerceContext?.campaignGoal ?? "Sales conversion"),
          channels: String(ecommerceContext?.channels ?? "TikTok, Instagram Reels, Meta Ads"),
          targetDurationSeconds: Number(ecommerceContext?.targetDurationSeconds ?? 30) || 30,
          voiceDirection: String(ecommerceContext?.voiceDirection ?? "Energetic, trustworthy social ad voice"),
          subtitleStyle: String(ecommerceContext?.subtitleStyle ?? "Animated social captions"),
          style: typeof ecommerceContext?.style === "string" ? ecommerceContext.style : undefined,
          targetCountry: undefined,
          targetCity: undefined,
          culture: undefined
        });

        const providerOutput = {
          automationMode: "fully_automatic",
          automationStatus: "running",
          jobId,
          currentStep: "Visual/video provider job created",
          pipelineType: "ecommerce_product_ad_video",
          providerPipeline: pipeline,
          product: result.product,
          brain: result.brain,
          visualJob: result.visualJob,
          visualJobs: result.visualJob ? [result.visualJob] : [],
          voiceAudioUrl: result.voiceAudioUrl,
          subtitleUrl: result.subtitleUrl,
          renderJob: result.renderJob ?? null,
          renderStatus: result.renderJob ? "render_job_created" : "waiting_for_visual_output",
          revisionActions: ["Change subtitle color", "Switch voice", "Change CTA", "Regenerate hook"],
          exportTargets: ["TikTok", "Meta Ads", "Instagram Reels"],
          finalVideoUrl: null
        };
        const providerLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: providerOutput }, { visualJob: result.visualJob, renderJob: result.renderJob });

        const { data: completedProduction, error: completeError } = await supabase
          .from("production_requests")
          .update({
            generation_status: result.renderJob ? "render_job_created" : "provider_visual_job_created",
            output_json: {
              ...providerOutput,
              providerLifecycle: { visual: providerLifecycle.visual, render: providerLifecycle.render },
              outputRegistry: providerLifecycle.outputRegistry,
              automaticDeliveryLinks: deliveryLinks,
              previewUrl: null
            },
            admin_notes: result.renderJob ? "Provider chain executed. Render job is created; poll provider status before marking ready." : "Provider chain executed. Visual/video job is created; render will start automatically after visual output is ready.",
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();

        if (completeError) throw completeError;
        return Response.json({ job_id: jobId, production: completedProduction, provider_result: result });
      } catch (providerError) {
        const message = errorMessage(providerError, "Provider pipeline failed");
        const providerNote = `Provider pipeline unavailable, demo output is active: ${message}`;
        const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
          .update({
            status: "in_production",
            generation_status: "preview_ready",
            output_json: {
              ...demoOutput,
              automationStatus: "demo_ready",
              providerStatus: "waiting_provider_config",
              providerPreflight,
              renderQueuePolicy,
              capacityPolicy,
              activeJobLimit,
              automaticDeliveryLinks: deliveryLinks,
              outputRegistry: buildOutputRegistry({ ...outputRegistryBase, output_json: demoOutput })
            },
            admin_notes: providerNote,
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();

        if (demoError) throw demoError;
        return Response.json({ job_id: jobId, production: demoProduction, demo: true, provider_warning: message });
      }
    }

    const demoOutput = buildDemoAutomationOutput(currentProduction, jobId);
    const requestedDuration = Number(providerPreflight.durationSeconds) || 8;
    const providerTestMode = Boolean(providerPreflight.testMode);
    const selectedOptions = providerPreflight.selectedOptions && typeof providerPreflight.selectedOptions === "object" ? providerPreflight.selectedOptions as Record<string, unknown> : {};
    const pipelineMap: Record<string, string> = {
      video: "generic_video",
      cinematic_video: "generic_video",
      documentary: "documentary_video",
      animation: "animation_video",
      anime_short_film: "animation_video",
      animal_video: "generic_video",
      nature_video: "generic_video",
      planet_space_video: "generic_video",
      drone_video: "drone_video",
      music_video: "music_video",
      stickman_animation: "animation_video",
      studio: "studio_story_video",
      drama: "studio_story_video",
      video_clipping: "video_clipping",
      video_tools: "video_tools",
      localization: "localization_video",
      cultural_localization: "localization_video",
      avatar: "talking_lip_sync",
      lip_sync: "talking_lip_sync",
      talking_video: "talking_lip_sync",
      live_sales_agent: "talking_lip_sync"
    };
    const requiredPipeline = pipelineMap[productionType] ?? "manual_or_demo";
    const requiresSpecialPipeline = ["talking_lip_sync", "video_clipping", "music_video", "drone_video", "studio_story_video", "animation_video", "documentary_video", "video_tools", "localization_video"].includes(requiredPipeline);
    const canUseGenericAutomation = ["generic_video", "animation_video", "documentary_video", "drone_video", "studio_story_video", "localization_video"].includes(requiredPipeline);
    const isGenericVideoType = canUseGenericAutomation && ["video", "cinematic_video", "documentary", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "studio", "drama", "stickman_animation", "localization", "cultural_localization"].includes(productionType);
    const genericRun = isGenericVideoType
      ? await runGenericVideoPipeline({
        productionId,
        title: currentProduction.title,
        prompt: currentProduction.prompt,
        requestMetadata,
        inputJson,
        providerPreflight: providerPreflight as Record<string, unknown>,
        selectedOptions
      })
      : null;
    const visualJob = genericRun?.visualJob ?? null;
    const renderJob = genericRun?.renderJob ?? null;
    const aiVideoProviderChain = genericRun
      ? genericVideoProviderChain({ selectedOptions, provider: genericRun.plan.provider, visualJob, voiceAudioUrl: genericRun.voiceAudioUrl, subtitleUrl: genericRun.subtitleUrl, renderJob })
      : genericVideoProviderChain({ selectedOptions, provider: String(providerPreflight.provider ?? "") });
    const preflightOutputIntent = (providerPreflight as Record<string, unknown>).outputIntent;
    const outputIntentRecord = preflightOutputIntent && typeof preflightOutputIntent === "object" ? preflightOutputIntent as Record<string, unknown> : {};
    const requestedClipCount = Number(outputIntentRecord.requestedClipCount ?? outputIntentRecord.outputCount ?? 3) || 3;
    const providerNote = requiredPipeline === "talking_lip_sync"
      ? "This request requires the talking/lip-sync pipeline. It must not be delivered through the generic voice-over video pipeline because speaking faces need synchronized audio/video generation. Configure a talking-video/lip-sync provider before final delivery."
      : requiredPipeline === "video_clipping"
        ? `This request requires the video clipping pipeline: source video analysis, highlight extraction, reframing, subtitles and final clip delivery. Requested clips: ${requestedClipCount}. Each clip must use a different source moment/timestamp; duplicate clips are not acceptable. It must not start new prompt-to-video generation.`
        : requiredPipeline === "music_video"
          ? "This request requires the music-video pipeline: audio/lyrics analysis, timing, visual planning and final edit. It must not be treated as a generic ad voice-over video."
          : genericRun
        ? genericRun.chainStatus === "waiting_provider_config"
      ? `Drone video pipeline planned but provider chain is waiting for configuration: ${genericRun.missingProviders.join(", ") || "video provider"}.`
      : genericRun.chainStatus === "provider_chain_started"
        ? requiredPipeline === "drone_video"
          ? "Drone video provider chain started: route plan, aerial visual job, voice/subtitle assets or final render were prepared where selected. Poll /api/automation/status to update final output."
          : "Generic video provider chain started: script plan, visual job, voice/subtitle assets or final render were prepared where selected. Poll /api/automation/status to update final output."
        : requiredPipeline === "drone_video"
          ? "Drone visual provider job created. Voice/subtitle/final render routing is tracked in the drone chain. Poll /api/automation/status to update final output."
          : "Generic video visual provider job created. Voice/subtitle/final render routing is tracked in the provider chain. Poll /api/automation/status to update final output."
    : "Demo automation generated script, parts, alternatives and delivery placeholders. Connect providers next for real output URLs.";
    const outputJson: Record<string, unknown> = {
      ...demoOutput,
      providerTestMode,
      providerPreflight,
      aiVideoProviderChain,
      genericVideoPlan: genericRun?.plan ?? null,
      sourceContext: genericRun?.sourceContext ?? null,
      websiteScreenshotUrl: (genericRun?.sourceContext as Record<string, unknown> | undefined)?.screenshotUrl ?? null,
      voiceAudioUrl: genericRun?.voiceAudioUrl ?? null,
      voiceAudioSegments: genericRun?.voiceAudioSegments ?? [],
      subtitleUrl: genericRun?.subtitleUrl ?? null,
      renderJob,
      visualJob,
      visualJobs: genericRun?.visualJobs ?? (visualJob ? [visualJob] : []),
      providerStatus: !genericRun && requiresSpecialPipeline ? `${requiredPipeline}_required` : genericRun?.chainStatus ?? "demo_ready",
      providerErrors: !genericRun && requiresSpecialPipeline ? { [requiredPipeline]: `${requiredPipeline} requires its dedicated production pipeline and cannot be auto-delivered by the generic prompt-to-video pipeline.` } : genericRun?.providerErrors ?? {},
      requiredPipeline,
      outputIntent: (providerPreflight as Record<string, unknown>).outputIntent ?? null,
      sourceHandling: (providerPreflight as Record<string, unknown>).sourceHandling ?? null,
      requestedDurationSeconds: requestedDuration,
      automaticDeliveryLinks: deliveryLinks,
      finalVideoUrl: visualJob || renderJob ? null : demoOutput.finalVideoUrl,
      delivery_url: visualJob || renderJob ? null : demoOutput.delivery_url,
      deliveryZipUrl: visualJob || renderJob ? null : demoOutput.deliveryZipUrl,
      readmeUrl: visualJob || renderJob ? null : demoOutput.readmeUrl
    };
    const providerLifecycle = providerLifecycleFromJobs({ ...outputRegistryBase, output_json: outputJson }, { visualJob, renderJob });
    outputJson.providerLifecycle = { visual: providerLifecycle.visual, render: providerLifecycle.render };
    outputJson.outputRegistry = providerLifecycle.outputRegistry;
        const { data: demoProduction, error: demoError } = await supabase
          .from("production_requests")
        .update({
          status: visualJob || renderJob ? "in_production" : "queued",
          generation_status: visualJob ? renderJob ? "render_job_created" : "provider_visual_job_created" : "waiting_provider_config",
          preview_url: visualJob || renderJob ? undefined : null,
          delivery_link: visualJob || renderJob ? undefined : null,
          delivery_zip_url: visualJob || renderJob ? undefined : null,
          readme_url: visualJob || renderJob ? undefined : null,
          output_json: { ...outputJson, automationStatus: visualJob || renderJob ? "running" : "waiting_provider_config", providerStatus: visualJob || renderJob ? "provider_started" : "waiting_provider_config", previewUrl: visualJob || renderJob ? outputJson.previewUrl : null, deliveryLink: visualJob || renderJob ? outputJson.deliveryLink : null, deliveryZipUrl: visualJob || renderJob ? outputJson.deliveryZipUrl : null, readmeUrl: visualJob || renderJob ? outputJson.readmeUrl : null },
          admin_notes: providerNote,
          updated_at: new Date().toISOString()
        })
      .eq("id", productionId)
      .select("*")
      .single();

    if (demoError) throw demoError;
    return Response.json({ job_id: jobId, production: demoProduction, demo: true, provider_started: Boolean(visualJob || renderJob), provider_job: visualJob || renderJob || null, waiting_provider_config: !visualJob && !renderJob });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not start automation job") }, { status: 500 });
  }
}
