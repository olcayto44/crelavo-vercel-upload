import { voiceDirectionGuard } from "@/lib/voice-production-guard";
import { createVoiceover, createVoiceoverSegments, type VoiceAudioSegment } from "./elevenlabs";
import { optionalEnv } from "./env";
import { scrapeProduct } from "./scraper";
import { createShotstackRender } from "./shotstack";
import { createSubtitleFile } from "./subtitles";
import type { ProviderJob } from "./types";
import { createVisualVideo } from "./visuals";
import { captureWebsiteScreenshot } from "./website-screenshot";

export type DialogueSegment = {
  speaker: string;
  text: string;
  start: number;
  length: number;
  sceneIndex: number;
};

export type GenericVideoPlan = {
  title: string;
  script: string;
  visualScenes: string[];
  subtitleLines: string[];
  dialogueSegments: DialogueSegment[];
  voiceDirection: string;
  durationSeconds: number;
  aspectRatio: string;
  provider: string;
  deterministicUiMotion?: boolean;
};

export type GenericVideoRunResult = {
  plan: GenericVideoPlan;
  visualJob: ProviderJob | null;
  visualJobs?: ProviderJob[];
  voiceAudioUrl: string | null;
  voiceAudioSegments?: VoiceAudioSegment[];
  subtitleUrl: string | null;
  renderJob: ProviderJob | null;
  chainStatus: "provider_chain_started" | "visual_job_created" | "waiting_provider_config";
  missingProviders: string[];
  providerErrors?: Record<string, string>;
  sourceContext?: Record<string, unknown>;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function providerErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "Unknown provider error");
}

function firstUrlFromText(text: string) {
  return text.match(/https?:\/\/[^\s)\]}"']+/i)?.[0] ?? "";
}

function uploadedImageUrlsFrom(...values: unknown[]) {
  const urls: string[] = [];
  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.uploadedMaterials)) visit(record.uploadedMaterials);
    if (record.droneDetails && typeof record.droneDetails === "object") visit((record.droneDetails as Record<string, unknown>).uploadedMaterials);
    const kind = String(record.kind ?? "").toLowerCase();
    const contentType = String(record.content_type ?? record.contentType ?? "").toLowerCase();
    const fileUrl = String(record.file_url ?? record.fileUrl ?? record.url ?? "").trim();
    if (fileUrl && /^https:\/\//i.test(fileUrl) && (kind === "image" || contentType.startsWith("image/"))) urls.push(fileUrl);
  };
  values.forEach(visit);
  return Array.from(new Set(urls)).slice(0, 4);
}

async function sourceContextForPrompt(text: string) {
  const url = firstUrlFromText(text);
  if (!url) return { url: "", contextText: "", imageUrls: [] as string[] };
  try {
    const snapshot = await scrapeProduct(url);
    const contextText = [
      `SOURCE URL: ${snapshot.url}`,
      `PAGE TITLE: ${snapshot.title}`,
      snapshot.description ? `PAGE DESCRIPTION: ${snapshot.description}` : "",
      snapshot.rawText ? `VISIBLE PAGE TEXT EXCERPT: ${snapshot.rawText.slice(0, 900)}` : "",
      snapshot.imageUrls.length ? `REFERENCE IMAGE URLS: ${snapshot.imageUrls.join(", ")}` : ""
    ].filter(Boolean).join(" | ");
    return { url, contextText, imageUrls: snapshot.imageUrls.slice(0, 3) };
  } catch {
    return { url, contextText: `SOURCE URL: ${url}. Use this exact website/link as the visual and brand reference.`, imageUrls: [] as string[] };
  }
}

function sentenceParts(text: string) {
  return text
    .split(/[.!?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function voiceExplicitlyDisabled(text: string) {
  return /no\s*voice|without\s*voice|no\s*voice-?over|without\s*voice-?over|voice-?over\s*(off|none)|seslendirme\s*olmasın|ses\s*olmasın|seslendirme\s*yok|sessiz/i.test(text);
}

function subtitlesExplicitlyDisabled(text: string) {
  return /no\s*subtitle|no\s*subtitles|without\s*subtitle|without\s*subtitles|subtitles?\s*(off|none)|altyaz[ıi]\s*olmasın|altyaz[ıi]\s*yok/i.test(text);
}

function visualOnlyGuard(noVoice: boolean, noSubtitles: boolean) {
  const rules: string[] = [];
  if (noVoice) rules.push("No dialogue, no narrator, no character speech, no lip-sync performance, no talking mouth animation, no audible voice. Make this a silent visual-only animation.");
  if (noSubtitles) rules.push("No subtitles, no captions, no burned-in text, no speech bubbles, no on-screen dialogue text.");
  return rules.join(" ");
}

function classifyVideoPipeline(text: string) {
  const lower = text.toLowerCase();
  const explicitNoCharacterSpeech = /çocuklar\s*konuşmasın|cocuklar\s*konusmasin|karakterler\s*konuşmasın|karakterler\s*konusmasin|diyalog\s*olmasın|dialogue\s*olmasın|no\s*dialogue|no\s*character\s*speech/.test(lower);
  if (!explicitNoCharacterSpeech && /lip[-\s]?sync|avatar|talking|sunucu|röportaj|roportaj|diyalog|dialogue|interview|testimonial|ben konuş|ben konus|kamera karşısında|kamera karsisinda/.test(lower)) return "talking_lip_sync";
  if (/kısa film|kisa film|short film|drama|dizi|scene|sahne|animasyon|animation|karakter|character|çocuk|cocuk|oyuncak araba/.test(lower)) return "narrative_video";
  return "voiceover_ad";
}

function scenePromptsFromRequest(prompt: string) {
  const matches = Array.from(prompt.matchAll(/Sahne\s*\d+\s*:\s*([^]+?)(?=\s*Sahne\s*\d+\s*:|\s*Seslendirme|\s*Altyazı|\s*Neşeli|\s*Neseli|$)/gi))
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (matches.length) return matches;
  const sceneMatch = prompt.match(/Sahne:\s*([^]+?)(?:Seslendirme|Altyazı|Neşeli|Neseli|$)/i);
  if (sceneMatch?.[1]) return sentenceParts(sceneMatch[1]).slice(0, 3);
  return [];
}

function voiceoverAdScene(scene: string, index: number) {
  const prefix = ["Opening visual", "Product proof visual", "Benefit visual", "Final CTA visual"][index] || `Visual ${index + 1}`;
  return `${prefix}: ${scene}. Use product/UI close-ups, screen details, clean interface motion, brand-safe motion graphics and clear visual proof. Do not invent presenters, office teams, meeting rooms, split-screen people, talking characters, children, cartoon characters, or lip-sync shots.`;
}

function isCrelavoPromoIntent(text: string) {
  return /crelavo|paste\s*(a|any)?\s*link|get\s*an\s*ad|ready-to-post\s*ad|product\s*link|website\s*link|shopify|amazon|trendyol|woocommerce/i.test(text) && /promo|ad\s*video|video\s*ad|commercial|reklam|tanıtım|tanitim|sosyal\s*medya|final\s*mp4|tiktok|reels|shorts/i.test(text);
}

function isLinkToAdIntent(text: string) {
  return Boolean(firstUrlFromText(text)) && /ad|advert|reklam|tanıtım|tanitim|promo|video|mp4|tiktok|reels|shorts|ürün|urun|product|shopify|amazon|trendyol|woocommerce|website|landing/i.test(text);
}

function linkProductDemoScenes(text: string, durationSeconds: number) {
  const url = firstUrlFromText(text);
  const scenes = [
    `Product or website page from ${url || "the supplied link"} is opened and analyzed: product title, key benefits, page visuals and offer are extracted. Show realistic browser/page analysis and UI cards only.`,
    "AI turns the link analysis into a short ad brief: hook, audience, selling points, objections and platform goal. Use clean dashboard panels, no stock office people.",
    "AI writes the ad script and builds a scene plan based on the linked product or website. Show timeline blocks, script cards and visual planning UI, no presenter.",
    "Voice-over, subtitles and music are prepared for the ad. Show controls and waveform/subtitle timeline inside a realistic product interface, no lip-sync characters.",
    "Final vertical MP4 preview is exported for TikTok, Instagram Reels, YouTube Shorts and paid ads. Show product preview and export buttons, no split-screen humans."
  ];
  const shotCount = Math.max(2, Math.ceil(durationSeconds / 5));
  return scenes.slice(0, Math.min(scenes.length, shotCount));
}

function crelavoProductDemoScenes(durationSeconds: number) {
  const scenes = [
    "Realistic browser view of https://www.crelavo.com and Crelavo dashboard. Large visible Crelavo wordmark, link input field, headline Paste a link. Get an ad. Full-screen SaaS UI only; no office, no humans, no presenter, no stock footage.",
    "Crelavo dashboard close-up: a product or website URL is pasted into the link input. Show Crelavo navigation, analysis progress, product/page cards and benefit extraction panels. Keep Crelavo brand visible in the UI.",
    "Crelavo AI creates ad script and scene plan inside the dashboard. Show script editor, scene timeline, hook card, CTA card, and vertical ad preview panel. Realistic high-fidelity software interface, no people, no cartoon.",
    "Crelavo media controls activate: Turkish voice-over waveform, Turkish subtitles timeline, background music toggle, and 9:16 MP4 preview. Show Crelavo dashboard repeatedly, not an office environment. No English captions unless the user explicitly asked English.",
    "Final Crelavo export screen: vertical preview, Final MP4 download button, TikTok/Reels/Shorts/ad export badges, completion state. Premium realistic SaaS product UI, Crelavo brand visible, no humans, no split-screen characters."
  ];
  const shotCount = Math.max(2, Math.ceil(durationSeconds / 5));
  return scenes.slice(0, Math.min(scenes.length, shotCount));
}

function crelavoPromoNarration(durationSeconds: number, language = "English") {
  const isTurkish = /turkish|türkçe|turkce|tr\b/i.test(language);
  const concise = isTurkish
    ? "Crelavo’ya ürününü ya da site fikrini yaz. Yapay zeka reklam planını çıkarır, senaryoyu hazırlar, seslendirme, altyazı ve müzikle paylaşmaya hazır dikey video üretir."
    : "Paste a link into Crelavo. The AI analyzes your product, writes the ad script, builds the scene plan, adds voice-over, subtitles and music, then delivers a ready-to-post MP4 for TikTok, Reels, Shorts and ads.";
  const extended = isTurkish
    ? "Crelavo’ya ürününü, siteni ya da kampanya fikrini yaz. Sistem hedefi analiz eder, güçlü açılış metnini çıkarır, reklam senaryosunu ve sahne planını hazırlar. Türkçe seslendirme, altyazı, hafif enerjik müzik ve dikey sosyal medya formatıyla paylaşmaya hazır bir video üretir. Crelavo ile fikirden reklama çok daha hızlı geç."
    : "Paste any product or website link into Crelavo. The dashboard analyzes the page, identifies the offer, audience and key benefits, then turns that insight into a focused ad script and scene plan. Crelavo prepares voice-over, subtitles, background music and a polished vertical MP4 preview, ready to export for TikTok, Instagram Reels, YouTube Shorts and paid ads. Paste a link. Get an ad.";
  return fitScriptToDuration(durationSeconds >= 30 ? extended : concise, Math.max(5, durationSeconds - 1), concise);
}

function linkAdNarration(durationSeconds: number) {
  const concise = "Paste a product or website link. Crelavo analyzes the page, extracts the key selling points, writes the ad script, plans the scenes, adds voice-over, subtitles and music, then exports a ready-to-post MP4.";
  const extended = "Paste a product, store or website link. Crelavo reads the page, identifies the offer, audience and key benefits, writes a focused ad script, builds a scene plan, prepares voice-over, subtitles and music, then exports a polished MP4 ready for TikTok, Reels, Shorts and paid ads.";
  return fitScriptToDuration(durationSeconds >= 30 ? extended : concise, Math.max(5, durationSeconds - 2), concise);
}

function dronePromptDetails(prompt: string) {
  const cleanedPrompt = prompt.replace(/Crelavo|final MP4 delivery|final MP4|production request/gi, "");
  const location = cleanedPrompt.match(/for\s+([^\.]+?)(?:\.\s*Route\/path:|\.|$)/i)?.[1]?.trim() || "the requested location";
  const route = cleanedPrompt.match(/Route\/path:\s*([^\.]+?)(?:\.\s*Marked map\/satellite area:|\.|$)/i)?.[1]?.trim() || "the local approach route";
  const area = cleanedPrompt.match(/Marked map\/satellite area:\s*([^\.]+?)(?:\.\s*Shot type:|\.|$)/i)?.[1]?.trim() || "the immediate surrounding area";
  return { location, route, area };
}

function droneNoTextFrameGuard() {
  return "Do not generate embedded text, fake map labels, misspelled labels, UI text, signage, typography, logos, people, presenters or talking heads inside the video frames. Keep surfaces clean for Crelavo post-production overlays.";
}

function droneVideoScenes(prompt: string, durationSeconds: number) {
  const { location, route, area } = dronePromptDetails(prompt);
  const textGuard = droneNoTextFrameGuard();
  const scenes = [
    `Aerial opening over ${location}. Establish the requested area from above with a clean cinematic AI drone / satellite feel. ${textGuard}`,
    `Route reveal along ${route}. Show the path through camera movement and clean overlay-safe composition only; Crelavo will add any route labels in post-production overlays. ${textGuard}`,
    `Highlight ${area} with a careful flyover and subtle non-text motion graphics. Keep the frame clean, premium and geographically focused. ${textGuard}`,
    `Finish with a wide pull-away over ${location} and the surrounding area, keeping the location story clear without any generated text inside the frame. ${textGuard}`
  ];
  const shotCount = Math.max(2, Math.ceil(durationSeconds / 5));
  return scenes.slice(0, Math.min(scenes.length, shotCount));
}

function droneVideoNarration(durationSeconds: number, language = "English", prompt = "") {
  const isTurkish = /turkish|türkçe|turkce|tr\b/i.test(language);
  const { location, route, area } = dronePromptDetails(prompt);
  const base = isTurkish
    ? `${location} çevresine sakin bir drone yaklaşımıyla ilerliyoruz. Görüntü, ${route} üzerinden lokasyona bağlanıyor ve ${area} bölgesini kuşbakışı bir akışla gösteriyor. Bu video, adresin çevresini, ulaşım hissini ve yakın alan düzenini temiz bir drone perspektifiyle sunar.`
    : `We move toward ${location} with a calm drone-style approach. The view connects the location through ${route} and presents ${area} from an aerial perspective. This video shows the surrounding area, the sense of access, and the nearby location layout in a clean drone-style view.`;
  const pacingPad = isTurkish
    ? `Anlatım, kamera talimatlarını okumadan yalnızca istenen lokasyonu ve çevresini açıklar; ${location} için rota ve yakın çevre bilgisi izleyiciye sade biçimde aktarılır.`
    : `The narration describes the requested place and its surroundings only; it does not read camera instructions, production settings, or internal route commands aloud.`;
  const targetWords = Math.max(22, Math.round(durationSeconds * 2.35));
  const words = base.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  const padWords = pacingPad.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  const padded = [...words];
  while (padded.length < targetWords && padWords.length) padded.push(...padWords.slice(0, Math.min(padWords.length, targetWords - padded.length)));
  return padded.join(" ");
}

function looksTurkish(text: string) {
  return /[çğıöşüİı]|\b(olsun|seslendirme|altyaz|çocuk|cocuk|dış anlatıcı|dis anlatici|sahne|bahçe|bahcede|koşuyor|kosuyor|neşeli|neseli)\b/i.test(text);
}

function cleanSceneForScript(scene: string) {
  return scene
    .replace(/İlk\s*\d+\s*saniyede|Sonraki\s*\d+\s*saniyede|Son\s*\d+\s*saniyede/gi, "")
    .replace(/Hayvanlar[^.]*konuşmasın[^.]*\.?/gi, "")
    .replace(/Kuşlar[^.]*konuşmasın[^.]*\.?/gi, "")
    .replace(/Karakterler\s*kamera\s*karşısında[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dialoguePartsFromScene(scene: string) {
  return Array.from(scene.matchAll(/([^.!?]{0,55})[“\"]([^”\"]{2,140})[”\"]/g))
    .map((match) => {
      const context = match[1].replace(/\s+/g, " ").trim();
      const quote = match[2].replace(/\s+/g, " ").trim();
      const speakerMatch = context.match(/(Dede|Babaanne|Anne|Baba|Torun(?:lardan biri|\s*\d+)?|Çocuklar|Cocuklar)\b/i);
      const speaker = speakerMatch?.[1]?.replace(/cocuk/gi, "çocuk") || "Karakter";
      return { speaker, text: quote };
    })
    .filter((part) => part.text);
}

function dialogueLinesFromScene(scene: string) {
  return dialoguePartsFromScene(scene).map((part) => `${part.speaker}: ${part.text}`);
}

function dialogueSegmentsFromScenes(scenes: string[], durationSeconds: number): DialogueSegment[] {
  if (!scenes.length) return [];
  const sceneSlot = durationSeconds / scenes.length;
  return scenes.flatMap((scene, sceneIndex) => {
    const parts = dialoguePartsFromScene(cleanSceneForScript(scene)).slice(0, 3);
    if (!parts.length) return [];
    const segmentLength = Math.max(1.6, Math.min(3.8, (sceneSlot - 0.8) / parts.length));
    return parts.map((part, partIndex) => ({
      speaker: part.speaker,
      text: part.text,
      start: Number((sceneIndex * sceneSlot + 0.45 + partIndex * segmentLength).toFixed(2)),
      length: Number(segmentLength.toFixed(2)),
      sceneIndex
    }));
  }).filter((segment) => segment.start < durationSeconds);
}

function fitScriptToDuration(script: string, durationSeconds: number, fallback: string) {
  const targetWords = Math.max(18, Math.round(durationSeconds * 2.25));
  const minWords = Math.max(12, Math.round(targetWords * 0.82));
  const maxWords = Math.max(22, Math.round(targetWords * 1.25));
  const words = script.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length >= minWords && words.length <= maxWords) return words.join(" ");
  if (words.length > maxWords) return `${words.slice(0, maxWords).join(" ")}.`;
  const fallbackWords = fallback.replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean);
  const padded = [...words];
  while (padded.length < minWords && fallbackWords.length) {
    padded.push(...fallbackWords.slice(0, Math.min(fallbackWords.length, minWords - padded.length)));
  }
  return padded.join(" ");
}

function turkishNarration(prompt: string, durationSeconds = 15) {
  const requestedScenes = scenePromptsFromRequest(prompt);
  if (requestedScenes.length) {
    const perSceneWordBudget = Math.max(8, Math.floor((durationSeconds * 2.25) / requestedScenes.length));
    const sceneScripts = requestedScenes.map((scene, index) => {
      const cleaned = cleanSceneForScript(scene);
      const dialogue = dialogueLinesFromScene(cleaned).slice(0, 2);
      const actionWords = cleaned
        .replace(/[“\"][^”\"]+[”\"]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, Math.max(6, perSceneWordBudget - dialogue.join(" ").split(/\s+/).length));
      const action = actionWords.join(" ");
      return [`Sahne ${index + 1}: ${action}.`, ...dialogue].join(" ");
    });
    return fitScriptToDuration(
      sceneScripts.join(" "),
      durationSeconds,
      "Aile eski değirmene doğru ilerlerken çocuklar neşeyle konuşur, büyükler gülümser ve köy macerası sıcak bir aile anısıyla tamamlanır."
    );
  }
  const sceneMatch = prompt.match(/Sahne:\s*([^]+?)(?:Seslendirme|Altyazı|Neşeli|Neseli|$)/i);
  const scene = (sceneMatch?.[1] ?? prompt)
    .replace(/\s+/g, " ")
    .replace(/\b\d+\s*(saniye|sn|sec).*?olsun\b/gi, "")
    .trim();
  const base = /oyuncak araba|çocuk|cocuk|bahçe|bahce/i.test(scene)
    ? "Renkli bahçede iki yaramaz çocuk oyuncak arabanın peşinden koşuyor. Araba çiçek saksısının etrafında dönünce çocuklar gülerek onu takip ediyor."
    : scene.length > 40 ? scene : "Neşeli animasyon sahnesinde karakterler hareketli ve anlaşılır bir akışla ilerliyor.";
  return fitScriptToDuration(base, durationSeconds, "Sahne doğal hareketlerle devam eder ve sıcak bir finalle tamamlanır.");
}

function narrationScript(title: string, prompt: string, language: string, pipelineType: string, durationSeconds = 15) {
  const isTurkish = /turkish|türkçe|turkce|tr\b/i.test(language) || looksTurkish(prompt);
  if (pipelineType === "talking_lip_sync") return isTurkish ? turkishNarration(prompt, durationSeconds) : `${prompt}`;
  if (pipelineType === "narrative_video") return isTurkish ? turkishNarration(prompt, durationSeconds) : `${prompt}`;
  if (isTurkish) {
    return fitScriptToDuration(`${title} için kısa ve net bir video hazırlanıyor. Ana fikir, sahne akışı ve mesaj izleyiciye sade bir anlatımla aktarılıyor. Crelavo bu üretimi seslendirme, altyazı ve final MP4 teslimiyle tamamlar.`, durationSeconds, "Görüntüler sahne sahne ilerler, seslendirme video süresi boyunca doğal biçimde devam eder.");
  }
  return `${title} helps your brand turn an idea into a premium short video faster. Show the product, explain the value, and guide viewers through a clear visual story. Crelavo combines scene planning, voice-over, subtitles, and final delivery in one workflow. Launch your next campaign with a polished video made for social media.`;
}

function subtitleLinesFromScript(script: string, durationSeconds: number) {
  const estimatedSpeechSeconds = Math.max(3, Math.min(durationSeconds, script.split(/\s+/).filter(Boolean).length / 2.35 + 1.2));
  const maxLines = Math.max(3, Math.min(16, Math.ceil(estimatedSpeechSeconds / 1.65)));
  const sentences = script.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
  const words = (sentences.length ? sentences.join(" ") : script).split(/\s+/).filter(Boolean);
  const targetWordsPerCue = Math.max(4, Math.ceil(words.length / maxLines));
  const chunks: string[] = [];
  for (let index = 0; index < words.length && chunks.length < maxLines; index += targetWordsPerCue) {
    const chunk = words.slice(index, index + targetWordsPerCue).join(" ").replace(/\s+/g, " ").trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks.length ? chunks : ["Crelavo prepares the video."];
}

export function buildGenericVideoPlan(input: {
  title?: unknown;
  prompt?: unknown;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  providerPreflight?: Record<string, unknown>;
}): GenericVideoPlan {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const providerPreflight = input.providerPreflight ?? {};
  const title = clean(input.title) || clean(requestMetadata.title) || "Crelavo video";
  const prompt = clean(input.prompt) || clean(inputJson.prompt) || title;
  const durationSeconds = Number(providerPreflight.durationSeconds ?? requestMetadata.outputDurationSeconds ?? inputJson.outputDurationSeconds ?? 15) || 15;
  const aspectRatio = clean(providerPreflight.aspectRatio) || clean(requestMetadata.aspectRatio) || "9:16";
  const provider = clean(providerPreflight.provider) || clean(optionalEnv("VIDEO_PROVIDER")) || "replicate";
  const selectedVoiceProfile = clean(requestMetadata.voiceProfile) || clean(inputJson.voiceProfile) || "premium clear narrator";
  const intentText = `${title} ${prompt} ${clean(requestMetadata.productionGoal)} ${clean(inputJson.productionGoal)} ${JSON.stringify(requestMetadata)} ${JSON.stringify(inputJson)}`;
  const selectedVoiceLanguage = clean(requestMetadata.voiceLanguage) || clean(inputJson.voiceLanguage) || (looksTurkish(intentText) ? "Turkish" : "English");
  const productionTypeSignal = `${clean(requestMetadata.productionType)} ${clean(inputJson.productionType)} ${clean(requestMetadata.pipelineType)} ${clean(inputJson.pipelineType)}`.toLowerCase();
  const pipelineType = classifyVideoPipeline(intentText);
  const isDroneVideo = /drone_video/.test(productionTypeSignal) || /\bdrone\b|\bsatellite\b|route\s*flyover|map\s*route\s*reveal|aerial\s*location/i.test(intentText);
  const isCrelavoPromo = !isDroneVideo && isCrelavoPromoIntent(intentText);
  const isLinkAd = !isDroneVideo && !isCrelavoPromo && isLinkToAdIntent(intentText);
  const noVoice = voiceExplicitlyDisabled(intentText);
  const noSubtitles = subtitlesExplicitlyDisabled(intentText);
  const mediaGuard = visualOnlyGuard(noVoice, noSubtitles);
  const deterministicUiMotion = isCrelavoPromo && /no\s*people|no\s*presenter|without\s*(people|presenter|human)|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|insans[ıi]z|sunucusuz|motion\s*graphics|hareketli\s*grafik|arayüz|arayuz|ui/i.test(intentText);
  const requestedScenes = scenePromptsFromRequest(prompt);
  const parts = requestedScenes.length ? requestedScenes : sentenceParts(prompt).filter((part) => !/test|teslim|seslendirme|altyaz|format|480p|saniye|mp4|müzik|muzik/i.test(part));
  const baseVisualScenes = isDroneVideo
    ? droneVideoScenes(prompt, durationSeconds)
    : isCrelavoPromo
      ? crelavoProductDemoScenes(durationSeconds)
      : isLinkAd
        ? linkProductDemoScenes(intentText, durationSeconds)
        : parts.length >= 1
          ? parts
          : [
              `İki yaramaz çocuk renkli bir bahçede oyuncak arabayı neşeyle kovalıyor`,
              `Oyuncak araba küçük bir çiçek saksısının etrafında dönüyor, çocuklar gülerek peşinden koşuyor`
            ];
  const visualScenesBase = !isDroneVideo && pipelineType === "voiceover_ad" ? baseVisualScenes.map(voiceoverAdScene) : baseVisualScenes;
  const noCharacterSpeechGuard = /çocuklar\s*konuşmasın|cocuklar\s*konusmasin|karakterler\s*konuşmasın|karakterler\s*konusmasin|diyalog\s*olmasın|no\s*dialogue/i.test(intentText)
    ? "Characters must not talk, present, lip-sync, face camera as speakers, or appear as interview/talking-head presenters. Show only playful action animation."
    : "";
  const crelavoPromoGuard = isCrelavoPromo
    ? "STRICT CRELAVO PRODUCT DEMO LOCK: realistic SaaS dashboard UI only; no office environment, no office workers, no teams, no meeting room, no human presenter, no woman speaking, no man speaking, no children, no split-screen people, no cartoon, no semi-cartoon, no character faces, no lip-sync, no webcam, no stock people. Use polished realistic product interface shots and motion graphics only."
    : "";
  const linkAdGuard = isLinkAd
    ? "STRICT LINK-TO-AD LOCK: the linked page is the source. Build the video around product/page analysis, product benefits, ad script, scene plan, voice/subtitle/music preparation and final MP4 export. Do not invent office teams, presenters, children, cartoon characters, split-screen human reactions, or generic SaaS stock scenes."
    : "";
  const countGuard = /\b(dört|4)\s+çocuk|\b(dort|4)\s+cocuk/i.test(intentText)
    ? "Exactly four children only. No extra children, no crowd, no additional people. Keep the same four children visible across the scene."
    : "";
  const combinedGuard = [mediaGuard, noCharacterSpeechGuard, crelavoPromoGuard, linkAdGuard, countGuard].filter(Boolean).join(" ");
  const visualScenes = combinedGuard ? visualScenesBase.map((scene) => `${scene}. ${combinedGuard}`) : visualScenesBase;
const dialogueSegments = noVoice || isCrelavoPromo || isLinkAd ? [] : dialogueSegmentsFromScenes(requestedScenes, durationSeconds);
const script = noVoice ? "" : isDroneVideo ? droneVideoNarration(durationSeconds, selectedVoiceLanguage, prompt) : isCrelavoPromo ? crelavoPromoNarration(durationSeconds, selectedVoiceLanguage) : isLinkAd ? linkAdNarration(durationSeconds) : narrationScript(title, prompt, selectedVoiceLanguage, pipelineType, durationSeconds);
  const subtitleLines = noSubtitles ? [] : subtitleLinesFromScript(script || turkishNarration(prompt, durationSeconds), durationSeconds);
  return {
    title,
    script,
    visualScenes,
    subtitleLines,
    dialogueSegments,
    voiceDirection: voiceDirectionGuard(`${selectedVoiceProfile}; ${selectedVoiceLanguage}; natural conversion-focused delivery`),
    durationSeconds,
    aspectRatio,
    provider,
    deterministicUiMotion
  };
}

export function genericVideoProviderChain(input: { selectedOptions?: Record<string, unknown>; provider?: string; visualJob?: ProviderJob | null; voiceAudioUrl?: string | null; subtitleUrl?: string | null; renderJob?: ProviderJob | null }) {
  const selectedOptions = input.selectedOptions ?? {};
  const wantsVoice = Boolean(selectedOptions.voiceOver ?? selectedOptions.voiceConsistency);
  const wantsSubtitles = Boolean(selectedOptions.subtitles);
  const wantsFinalRender = Boolean(selectedOptions.finalRender ?? wantsVoice ?? wantsSubtitles);
  return [
    { step: "script_plan", provider: "crelavo_planner", status: "done", required: true },
    { step: "visual_generation", provider: input.provider || "video_provider", status: input.visualJob ? "job_created" : "waiting_provider_config", required: true },
    { step: "voice_over", provider: "elevenlabs", status: wantsVoice ? input.voiceAudioUrl ? "asset_created" : "waiting_provider_config" : "not_selected", required: wantsVoice },
    { step: "subtitles", provider: "subtitle_renderer", status: wantsSubtitles ? input.subtitleUrl ? "asset_created" : "waiting_provider_config" : "not_selected", required: wantsSubtitles },
    { step: "final_render", provider: "shotstack", status: wantsFinalRender ? input.renderJob ? "job_created" : "waiting_for_visual_or_provider_config" : "optional", required: wantsFinalRender }
  ];
}

export async function runGenericVideoPipeline(input: {
  productionId: string;
  title?: unknown;
  prompt?: unknown;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  providerPreflight?: Record<string, unknown>;
  selectedOptions?: Record<string, unknown>;
}): Promise<GenericVideoRunResult> {
  const plan = buildGenericVideoPlan(input);
  const selectedOptions = input.selectedOptions ?? {};
  const missingProviders: string[] = [];
  const providerErrors: Record<string, string> = {};
  const intentText = `${clean(input.prompt)} ${JSON.stringify(input.requestMetadata ?? {})} ${JSON.stringify(input.inputJson ?? {})}`;
  const sourceContext = await sourceContextForPrompt(intentText);
  let screenshotUrl = "";
  if (sourceContext.url) {
    try {
      screenshotUrl = await captureWebsiteScreenshot({ productionId: input.productionId, url: sourceContext.url }) || "";
    } catch (error) {
      providerErrors.website_screenshot = providerErrorMessage(error);
    }
  }
  const uploadedImageUrls = uploadedImageUrlsFrom(input.requestMetadata, input.inputJson);
  const sourceImageUrls = Array.from(new Set([screenshotUrl, ...sourceContext.imageUrls, ...uploadedImageUrls].filter(Boolean)));
  const uploadedReferenceContext = uploadedImageUrls.length ? `UPLOADED DRONE IMAGE REFERENCES: ${uploadedImageUrls.join(", ")}. Use these as the strongest visual/map/location references when creating drone-style shots.` : "";
  const contextText = [sourceContext.contextText, uploadedReferenceContext].filter(Boolean).join(" | ");
  const contextualScenes = contextText
    ? plan.visualScenes.map((scene) => `${scene} SOURCE CONTEXT TO FOLLOW: ${contextText}${screenshotUrl ? ` | WEBSITE SCREENSHOT REFERENCE: ${screenshotUrl}` : ""}`)
    : plan.visualScenes;
  let visualJob: ProviderJob | null = null;
  let visualJobs: ProviderJob[] = [];
  let voiceAudioUrl: string | null = null;
  let voiceAudioSegments: VoiceAudioSegment[] = [];
  let subtitleUrl: string | null = null;
  let renderJob: ProviderJob | null = null;

  try {
    const needsMultiShot = plan.durationSeconds > 5;
    if (plan.deterministicUiMotion) {
      visualJob = { provider: "shotstack_ui_motion", id: `ui-motion-${Date.now()}`, status: "succeeded", raw: { deterministicUiMotion: true, skippedPromptToVideo: true } };
      visualJobs = [];
    } else if (needsMultiShot) {
      const shotCount = Math.max(2, Math.ceil(plan.durationSeconds / 5));
      const shots = contextualScenes.slice(0, shotCount);
      while (shots.length < shotCount) shots.push(contextualScenes[shots.length % contextualScenes.length] || plan.title);
      for (let index = 0; index < shots.length; index += 1) {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 11000));
        const scene = shots[index];
        visualJobs.push(await createVisualVideo({
          scenes: [`Scene ${index + 1}/${shotCount}: ${scene}`],
          productImageUrls: sourceImageUrls,
          durationSeconds: 5,
          style: `${clean(input.requestMetadata?.style) || plan.title} · part ${index + 1} of ${shotCount}`,
          provider: plan.provider,
          aspectRatio: plan.aspectRatio
        }));
      }
      visualJob = visualJobs[0] ?? null;
    } else {
      visualJob = await createVisualVideo({
        scenes: contextualScenes,
        productImageUrls: sourceImageUrls,
        durationSeconds: plan.durationSeconds,
        style: clean(input.requestMetadata?.style) || plan.title,
        provider: plan.provider,
        aspectRatio: plan.aspectRatio
      });
      visualJobs = visualJob ? [visualJob] : [];
    }
} catch (error) {
  visualJob = visualJob ?? visualJobs[0] ?? null;
  missingProviders.push("visual_generation");
    providerErrors.visual_generation = providerErrorMessage(error);
  }

  const wantsVoice = Boolean(selectedOptions.voiceOver ?? selectedOptions.voiceConsistency);
  const wantsSubtitles = Boolean(selectedOptions.subtitles);
  const wantsFinalAssembly = Boolean(selectedOptions.finalRender ?? selectedOptions.voiceOver ?? selectedOptions.voiceConsistency ?? selectedOptions.subtitles);

  if (wantsVoice) {
    try {
      if (plan.dialogueSegments.length >= 2) {
        voiceAudioSegments = await createVoiceoverSegments({ productionId: input.productionId, segments: plan.dialogueSegments, voiceDirection: plan.voiceDirection });
        voiceAudioUrl = voiceAudioSegments[0]?.audioUrl ?? null;
      } else {
        voiceAudioUrl = await createVoiceover({ productionId: input.productionId, script: plan.script, voiceDirection: plan.voiceDirection });
      }
    } catch (error) {
      missingProviders.push("voice_over");
      providerErrors.voice_over = providerErrorMessage(error);
    }
  }

  if (wantsSubtitles) {
    try {
      subtitleUrl = await createSubtitleFile({ productionId: input.productionId, lines: plan.subtitleLines, durationSeconds: plan.durationSeconds });
    } catch (error) {
      missingProviders.push("subtitles");
      providerErrors.subtitles = providerErrorMessage(error);
    }
  }

  const requiredAudioReady = !wantsVoice || Boolean(voiceAudioUrl);
  const requiredSubtitleReady = !wantsSubtitles || Boolean(subtitleUrl);
  const readyVisualUrls = visualJobs.map((job) => String(job.url ?? "").trim()).filter(Boolean);
  if ((readyVisualUrls.length || visualJob?.url || plan.deterministicUiMotion) && wantsFinalAssembly && requiredAudioReady && requiredSubtitleReady && (voiceAudioUrl || subtitleUrl)) {
    try {
      renderJob = await createShotstackRender({ title: plan.title, videoUrl: readyVisualUrls[0] || visualJob?.url, videoUrls: readyVisualUrls.length ? readyVisualUrls : undefined, audioUrl: voiceAudioSegments.length ? null : voiceAudioUrl, audioSegments: voiceAudioSegments, subtitleUrl, subtitleLines: plan.subtitleLines, durationSeconds: plan.durationSeconds });
    } catch (error) {
      missingProviders.push("final_render");
      providerErrors.final_render = providerErrorMessage(error);
    }
  }

  return {
    plan,
    visualJob,
    visualJobs,
    voiceAudioUrl,
    voiceAudioSegments,
    subtitleUrl,
    renderJob,
    chainStatus: renderJob || voiceAudioUrl || subtitleUrl ? "provider_chain_started" : visualJob ? "visual_job_created" : "waiting_provider_config",
    missingProviders,
    providerErrors,
    sourceContext: { url: sourceContext.url, contextText, imageUrls: sourceImageUrls, screenshotUrl, uploadedImageUrls }
  };
}
