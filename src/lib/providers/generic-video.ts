import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { uploadProviderAsset } from "./storage";
import { voiceDirectionGuard } from "@/lib/voice-production-guard";
import { createVoiceover, createVoiceoverSegments, type VoiceAudioSegment } from "./elevenlabs";
import { optionalEnv } from "./env";
import { scrapeProduct } from "./scraper";
import { createShotstackRender } from "./shotstack";
import { createSubtitleFile } from "./subtitles";
import type { ProviderJob } from "./types";
import { createImageToVideoClip, createVisualVideo } from "./visuals";
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
    const contentType = String(record.content_type ?? record.contentType ?? record.mime_type ?? record.mimeType ?? "").toLowerCase();
    const fileUrl = String(record.file_url ?? record.fileUrl ?? record.download_url ?? record.downloadUrl ?? record.public_url ?? record.publicUrl ?? record.signed_url ?? record.signedUrl ?? record.url ?? "").trim();
    const filename = String(record.filename ?? record.file_name ?? record.name ?? "").toLowerCase();
    if (fileUrl && /^https:\/\//i.test(fileUrl) && (kind === "image" || contentType.startsWith("image/") || /\.(png|jpe?g|webp|heic)(\?|$)/i.test(filename) || /\.(png|jpe?g|webp|heic)(\?|$)/i.test(fileUrl))) urls.push(fileUrl);
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

export async function extractAudioTrackFromVideoUrl(input: { productionId: string; videoUrl: string; filenameBase: string }) {
  const response = await fetch(input.videoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Video download failed for audio extraction: ${response.status} ${await response.text()}`);
  const directory = await mkdtemp(join(tmpdir(), "crelavo-audio-"));
  const videoPath = join(directory, "input.mp4");
  const audioPath = join(directory, `${input.filenameBase}.m4a`);
  try {
    await writeFile(videoPath, Buffer.from(await response.arrayBuffer()));
    await new Promise<void>((resolve, reject) => {
      if (!ffmpegPath) {
        reject(new Error("ffmpeg-static binary is not available."));
        return;
      }
      execFile(ffmpegPath, ["-y", "-i", videoPath, "-vn", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", audioPath], { timeout: 30000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve();
      });
    });
    const audioBytes = await readFile(audioPath);
    return uploadProviderAsset(`${input.productionId}/${input.filenameBase}.m4a`, audioBytes, "audio/mp4");
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function createAmbientMusicBed(input: { productionId: string; durationSeconds: number; filenameBase: string; profile?: string }) {
  const durationSeconds = Math.max(4, Number(input.durationSeconds) || 15);
  const directory = await mkdtemp(join(tmpdir(), "crelavo-music-"));
  const audioPath = join(directory, `${input.filenameBase}.m4a`);
  try {
    await new Promise<void>((resolve, reject) => {
      if (!ffmpegPath) {
        reject(new Error("ffmpeg-static binary is not available."));
        return;
      }
      const low = input.profile && /luxury|premium/i.test(input.profile) ? 174 : 196;
      const mid = input.profile && /luxury|premium/i.test(input.profile) ? 261 : 294;
      const high = input.profile && /luxury|premium/i.test(input.profile) ? 349 : 392;
      const filter = `[0:a]volume=0.05[a0];[1:a]volume=0.04[a1];[2:a]volume=0.03[a2];[a0][a1][a2]amix=inputs=3:normalize=0:dropout_transition=2,lowpass=f=1800,acompressor=threshold=-22dB:ratio=3:attack=10:release=250,aecho=0.8:0.88:1200:0.2,afade=t=in:ss=0:d=1,afade=t=out:st=${Math.max(0, durationSeconds - 1)}:d=1,volume=1.6`;
      execFile(ffmpegPath, ["-y", "-f", "lavfi", "-i", `sine=frequency=${low}:sample_rate=44100:duration=${durationSeconds}`, "-f", "lavfi", "-i", `sine=frequency=${mid}:sample_rate=44100:duration=${durationSeconds}`, "-f", "lavfi", "-i", `sine=frequency=${high}:sample_rate=44100:duration=${durationSeconds}`, "-filter_complex", filter, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", audioPath], { timeout: 30000, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve();
      });
    });
    const audioBytes = await readFile(audioPath);
    return uploadProviderAsset(`${input.productionId}/${input.filenameBase}.m4a`, audioBytes, "audio/mp4");
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
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

function crelavoPremiumQualityFloor(intentText = "") {
  const lower = intentText.toLowerCase();
  const wantsShowcase = /homepage\s+showcase|showcase\s+loop|wow\s+video|cinematic\s+promo|sinematik|film\s+trailer|premium|high-end|kling|dikkat\s+çek|dikkat\s+cek|kaliteli/.test(lower);
  const base = [
    "CRELAVO PREMIUM QUALITY FLOOR: never deliver a cheap, generic, flat, low-energy or stock-looking video.",
    "Minimum visual standard must feel like a premium paid creative platform: cinematic lighting, sharp composition, strong first-second hook, polished motion, high contrast, clean color grading, premium camera movement and modern effects.",
    "If the user prompt is simple, upgrade it into a stronger premium production concept while preserving the user's core subject and intent.",
    "Avoid weak dashboard-only demos, boring corporate presenter energy, dull studio shots, random filler, messy typography, low-quality AI artifacts and amateur slideshow pacing."
  ];
  if (wantsShowcase) {
    base.push("SHOWCASE BENCHMARK: output must be visually striking enough to stand next to high-end AI video platform examples; it should make the viewer stop scrolling in the first second.");
  }
  return base.join(" ");
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

function isLuxuryProductCommercialIntent(text: string) {
  return /perfume|fragrance|cologne|luxury\s+commercial|luxury\s+ad|premium\s+commercial|matte-black|matte\s*black|marble\s+wall|retail\s+counter|product\s+counter|bottle|cosmetic|beauty\s+commercial|fashion\s+commercial/i.test(text);
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
    "CREATE IT: Crelavo logo bursts onto a dark neon tech background with blue, purple, cyan and magenta light streaks. Floating UI panels show AI video generation, fast timeline blocks and social media preview cards. No people, no presenter, no avatar.",
    "AI VIDEO + PRODUCT ADS: rapid category flashes show product ad videos, e-commerce campaigns, product pages turning into vertical ad previews, motion graphics and conversion cards. Neon dashboard UI, fast cuts, beat-synced transitions.",
    "WEBSITES + APPS + SAAS: browser mockups, mobile app screens and SaaS dashboards appear as glowing panels. Show landing pages, billing, admin dashboards, customer portals and clean product interfaces inside a futuristic Crelavo workspace.",
    "CREATIVE MEDIA STACK: music video/MV, image visual packs, brand kits, talking avatar tools, lip-sync, dubbing and localization appear as animated module cards. Keep it premium, energetic and neon-lit, not corporate stock footage.",
    "SOCIAL EXPORT: TikTok, Reels, YouTube Shorts, LinkedIn and X export cards slide into place. Show connected accounts, final MP4, thumbnail, captions and hashtag pack ready for publishing.",
    "LAUNCH IT: final CTA with bold kinetic typography: CREATE IT. LAUNCH IT. SCALE IT. CRELAVO. Bright neon logo lockup, fast glitch transition, premium startup launch energy."
  ];
  const shotCount = Math.max(3, Math.ceil(durationSeconds / 5));
  return scenes.slice(0, Math.min(scenes.length, shotCount));
}

function crelavoPromoNarration(durationSeconds: number, language = "English") {
  const isTurkish = /turkish|türkçe|turkce|tr\b/i.test(language);
  const concise = isTurkish
    ? "Crelavo fikirleri videolara, web sitelerine, uygulamalara, kampanyalara ve yayına hazır içeriklere dönüştürür. Oluştur. Yayına al. Büyüt."
    : "Crelavo turns ideas into videos, websites, apps, campaigns and launch-ready content. Create it. Launch it. Scale it.";
  const extended = isTurkish
    ? "Crelavo ile tek bir fikirden hızlıca üretime geç. AI video, ürün reklamı, müzik klibi, web sitesi, mobil uygulama, SaaS dashboard, marka kiti, görsel paket, dubbing, localization ve sosyal medya export akışı tek yerde birleşir. Oluştur. Yayına al. Büyüt."
    : "Crelavo turns ideas into production-ready videos, websites, apps and campaigns. Build AI videos, product ads, music videos, websites, mobile apps, SaaS dashboards, brand kits, visual packs, dubbing, localization and social export flows in one place. Create it. Launch it. Scale it.";
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
  const { location } = dronePromptDetails(prompt);
  const base = isTurkish
    ? `${location} çevresini kuşbakışı olarak inceliyoruz. Görüntü, Dumanca Trio Sitesi ve 41. Sokak çevresindeki yerleşim dokusunu, siteye yaklaşan yolları ve yakın çevrenin genel düzenini sade bir anlatımla gösteriyor. Bu çalışma, belirtilen adresin çevresini temiz ve anlaşılır bir hava perspektifiyle sunar.`
    : `This aerial view examines the surroundings of ${location}. It shows Dumanca Trio Sitesi, the area around 41. Sokak, the nearby approach roads and the general layout around the property in a clear location-focused sequence. The video presents the requested address and its immediate surroundings from a clean aerial perspective.`;
  const pacingPad = isTurkish
    ? `Anlatım yalnızca adresi ve yakın çevreyi açıklar. Kamera ayarları, üretim komutları, rota talimatları ve teknik prompt ifadeleri seslendirilmez.`
    : `The narration describes only the address and its surroundings. Camera settings, production commands, route instructions and technical prompt text are not spoken aloud.`;
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
  const providerLock = String(clean(requestMetadata.routeLock) || clean(inputJson.routeLock) || "").toLowerCase();
  const preferredRouteProvider = providerLock === "minimax_direct_luxury_product_commercial" || /perfume|fragrance|matte-black|matte\s*black|luxury\s+commercial|premium\s+commercial|retail\s+counter|marble\s+wall|perfume\s+bottle/i.test(`${title} ${prompt} ${JSON.stringify(requestMetadata)} ${JSON.stringify(inputJson)}`)
    ? "minimax"
    : "";
  const provider = preferredRouteProvider || clean(providerPreflight.provider) || clean(optionalEnv("VIDEO_PROVIDER")) || "replicate";
const selectedVoiceProfile = clean(requestMetadata.voiceProfile) || clean(inputJson.voiceProfile) || "premium clear narrator";
const intentText = `${title} ${prompt} ${clean(requestMetadata.productionGoal)} ${clean(inputJson.productionGoal)} ${JSON.stringify(requestMetadata)} ${JSON.stringify(inputJson)}`;
const productionTypeSignal = `${clean(requestMetadata.productionType)} ${clean(inputJson.productionType)} ${clean(requestMetadata.pipelineType)} ${clean(inputJson.pipelineType)}`.toLowerCase();
const pipelineType = classifyVideoPipeline(intentText);
const isDroneVideo = /drone_video/.test(productionTypeSignal) || /\bdrone\b|\bsatellite\b|route\s*flyover|map\s*route\s*reveal|aerial\s*location/i.test(intentText);
const droneDetails = requestMetadata.droneDetails && typeof requestMetadata.droneDetails === "object" ? requestMetadata.droneDetails as Record<string, unknown> : inputJson.droneDetails && typeof inputJson.droneDetails === "object" ? inputJson.droneDetails as Record<string, unknown> : {};
const selectedVoiceLanguage = clean(requestMetadata.voiceLanguage) || clean(inputJson.voiceLanguage) || clean(droneDetails.narrationLanguage) || (isDroneVideo ? "English" : looksTurkish(intentText) ? "Turkish" : "English");
  const isLuxuryProductCommercial = !isDroneVideo && isLuxuryProductCommercialIntent(intentText);
  const isCrelavoPromo = !isDroneVideo && isCrelavoPromoIntent(intentText) && !isLuxuryProductCommercial;
  const isLinkAd = !isDroneVideo && !isCrelavoPromo && !isLuxuryProductCommercial && isLinkToAdIntent(intentText);
  const noVoice = voiceExplicitlyDisabled(intentText);
  const noSubtitles = subtitlesExplicitlyDisabled(intentText);
  const mediaGuard = visualOnlyGuard(noVoice, noSubtitles);
  const cinematicActionIntent = /cinematic\s+action|action\s+video|action\s+trailer|battle|battlefield|war|fighters?|fight\s+scene|savaş|savas|aksiyon|özel\s+savaş|ozel\s+savas|energy\s+shield|pulse\s+baton|tactical\s+staff|combat\s+glove|defense\s+drone|sci-fi\s+melee/.test(intentText.toLowerCase());
  const deterministicUiMotion = !cinematicActionIntent && isCrelavoPromo && /no\s*people|no\s*presenter|without\s*(people|presenter|human)|insan\s*(veya\s*)?(sunucu\s*)?olmas[ıi]n|sunucu\s*olmas[ıi]n|insans[ıi]z|sunucusuz|motion\s*graphics|hareketli\s*grafik|arayüz|arayuz|ui/i.test(intentText);
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
  const qualityFloorGuard = crelavoPremiumQualityFloor(intentText);
  const combinedGuard = [qualityFloorGuard, mediaGuard, noCharacterSpeechGuard, crelavoPromoGuard, linkAdGuard, countGuard].filter(Boolean).join(" ");
  const visualScenes = combinedGuard ? visualScenesBase.map((scene) => `${scene}. ${combinedGuard}`) : visualScenesBase;
const dialogueSegments = noVoice || isCrelavoPromo || isLinkAd ? [] : dialogueSegmentsFromScenes(requestedScenes, durationSeconds);
const script = noVoice ? "" : isDroneVideo ? droneVideoNarration(durationSeconds, selectedVoiceLanguage, prompt) : isCrelavoPromo ? crelavoPromoNarration(durationSeconds, selectedVoiceLanguage) : isLinkAd ? linkAdNarration(durationSeconds) : narrationScript(title, prompt, selectedVoiceLanguage, pipelineType, durationSeconds);
  const crelavoShowcaseLines = [
    "CREATE IT: Ideas become videos, websites, apps and campaigns.",
    "AI VIDEO + PRODUCT ADS: Fast social clips, product demos and e-commerce campaigns.",
    "WEBSITES + APPS + SAAS: Landing pages, mobile apps, dashboards and billing flows.",
    "CREATIVE MEDIA STACK: Music videos, brand kits, image packs, lip-sync and localization.",
    "SOCIAL EXPORT: Final MP4, thumbnail, captions, hashtags and connected accounts.",
    "LAUNCH IT. SCALE IT. CRELAVO."
  ];
  const subtitleLines = noSubtitles ? [] : isCrelavoPromo ? crelavoShowcaseLines : subtitleLinesFromScript(script || turkishNarration(prompt, durationSeconds), durationSeconds);
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
      missingProviders.push("visual_generation");
      providerErrors.visual_generation = "shotstack_ui_motion fallback is disabled for production. Configure a real video provider before delivery.";
    } else if (needsMultiShot) {
      const shotCount = Math.max(2, Math.ceil(plan.durationSeconds / 5));
      const shots = contextualScenes.slice(0, shotCount);
      while (shots.length < shotCount) shots.push(contextualScenes[shots.length % contextualScenes.length] || plan.title);
      const isDroneMultiShot = String(input.requestMetadata?.productionType ?? input.requestMetadata?.production_type ?? input.inputJson?.productionType ?? input.inputJson?.production_type ?? "").includes("drone_video") || /drone|satellite|flyover|aerial/i.test(plan.title);
      if (isDroneMultiShot) {
        const scene = shots[0];
        visualJob = sourceImageUrls[0]
          ? await createImageToVideoClip({
            imageUrl: sourceImageUrls[0],
            prompt: `Use this uploaded satellite/route/location reference as the exact source frame for a clean AI drone-style flyover. ${scene}. No people, no presenters, no offices, no dashboards, no embedded text, no fake labels, no misspelled typography.`,
            durationSeconds: 5,
            provider: "runway_first",
            aspectRatio: plan.aspectRatio
          })
          : await createVisualVideo({
            productionId: input.productionId,
            scenes: [`Scene 1/${shotCount}: ${scene}`],
            productImageUrls: sourceImageUrls,
            durationSeconds: 5,
            style: `${clean(input.requestMetadata?.style) || plan.title} · first provider shot of ${shotCount}`,
            provider: plan.provider,
            aspectRatio: plan.aspectRatio
          });

        visualJobs = visualJob ? [visualJob] : [];
      } else {
        for (let index = 0; index < shots.length; index += 1) {
          if (index > 0) await new Promise((resolve) => setTimeout(resolve, 11000));
          const scene = shots[index];
          visualJobs.push(await createVisualVideo({
            productionId: input.productionId,
            scenes: [`Scene ${index + 1}/${shotCount}: ${scene}`],
            productImageUrls: sourceImageUrls,
            durationSeconds: 5,
            style: `${clean(input.requestMetadata?.style) || plan.title} · part ${index + 1} of ${shotCount}`,
            provider: plan.provider,
            aspectRatio: plan.aspectRatio
          }));
        }
        visualJob = visualJobs[0] ?? null;
      }
    } else {
      const isDroneSingleShot = /drone_video/.test(String(input.requestMetadata?.productionType ?? input.requestMetadata?.production_type ?? input.inputJson?.productionType ?? input.inputJson?.production_type ?? "")) || /drone|satellite|flyover|aerial/i.test(plan.title);
      visualJob = isDroneSingleShot && sourceImageUrls[0]
        ? await createImageToVideoClip({
          imageUrl: sourceImageUrls[0],
          prompt: `Use this uploaded satellite/route/location reference as the exact source frame for a clean AI drone-style flyover. ${contextualScenes.join(" | ")}. No people, no presenters, no offices, no dashboards, no embedded text, no fake labels, no misspelled typography.`,
          durationSeconds: plan.durationSeconds,
          provider: "runway_first",
          aspectRatio: plan.aspectRatio
        })
        : await createVisualVideo({
          productionId: input.productionId,
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
  const wantsFinalAssembly = Boolean(plan.deterministicUiMotion || selectedOptions.finalRender || selectedOptions.voiceOver || selectedOptions.voiceConsistency || selectedOptions.subtitles || selectedOptions.music);

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
  const primaryVisualUrl = readyVisualUrls[0] || visualJob?.url || "";
  let finalRenderAudioUrl = voiceAudioSegments.length ? null : voiceAudioUrl;
  if (!finalRenderAudioUrl && primaryVisualUrl) {
    try {
      finalRenderAudioUrl = await extractAudioTrackFromVideoUrl({ productionId: input.productionId, videoUrl: primaryVisualUrl, filenameBase: "final-render-audio" });
    } catch (error) {
      providerErrors.audio_extract = providerErrorMessage(error);
      missingProviders.push("audio_extract");
    }
  }
  if (!finalRenderAudioUrl && selectedOptions.music) {
    try {
      finalRenderAudioUrl = await createAmbientMusicBed({ productionId: input.productionId, durationSeconds: plan.durationSeconds, filenameBase: "final-render-music", profile: String(selectedOptions.musicProfile ?? "") || plan.title });
    } catch (error) {
      providerErrors.music_bed = providerErrorMessage(error);
      missingProviders.push("music_bed");
    }
  }
  if ((readyVisualUrls.length || visualJob?.url || plan.deterministicUiMotion) && wantsFinalAssembly && requiredAudioReady && requiredSubtitleReady) {
    try {
      renderJob = await createShotstackRender({ title: plan.title, videoUrl: primaryVisualUrl || undefined, videoUrls: readyVisualUrls.length ? readyVisualUrls : undefined, audioUrl: voiceAudioSegments.length ? null : finalRenderAudioUrl, audioSegments: voiceAudioSegments, subtitleUrl, subtitleLines: plan.subtitleLines, durationSeconds: plan.durationSeconds });
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
    sourceContext: { url: sourceContext.url, contextText, imageUrls: sourceImageUrls, screenshotUrl, uploadedImageUrls, droneReferenceRequired: /drone_video/.test(String(input.requestMetadata?.productionType ?? input.requestMetadata?.production_type ?? input.inputJson?.productionType ?? input.inputJson?.production_type ?? "")), droneReferenceWarning: uploadedImageUrls.length ? null : "No uploaded satellite/route/location image reference was available. Output may be a generic AI aerial simulation rather than a location-faithful flyover." }
  };
}
