import { optionalEnv, requireProviderEnv } from "./env";
import type { ProviderJob } from "./types";

function shotstackEndpoint() {
  const configured = optionalEnv("SHOTSTACK_API_URL") || optionalEnv("SHOTSTACK_RENDER_URL");
  if (configured) return configured;
  const stage = (optionalEnv("SHOTSTACK_STAGE") || "v1").toLowerCase();
  return `https://api.shotstack.io/${stage === "stage" || stage === "sandbox" ? "stage" : "v1"}/render`;
}

function shotstackKey() {
  return requireProviderEnv("shotstack");
}

export function getShotstackReadiness() {
  const apiKey = shotstackKey();
  return {
    connected: true,
    keyLength: apiKey.length,
    endpoint: shotstackEndpoint(),
    checked: "configuration-only",
    note: "Safe readiness check only. No render job was created. Run a controlled render test only when explicitly approved."
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function estimateSpeechSeconds(lines: string[], durationSeconds: number) {
  const wordCount = lines.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(Math.max(3, durationSeconds - 0.25), wordCount / 2.05 + 2));
}

function subtitleOverlayClips(lines: string[] | undefined, durationSeconds: number) {
  const cleanLines = (lines ?? [])
    .map((line) => String(line ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 16);
  if (!cleanLines.length) return [];
  const estimatedSpeechSeconds = estimateSpeechSeconds(cleanLines, durationSeconds);
  const slot = estimatedSpeechSeconds / cleanLines.length;
  return cleanLines.map((line, index) => {
    const start = Number((index * slot).toFixed(2));
    const length = Math.max(0.85, Number(Math.min(slot, estimatedSpeechSeconds - start).toFixed(2)));
    const safeLine = line.length > 54 ? `${line.slice(0, 51).trim()}…` : line;
    const html = `<div style="position:relative;width:100%;height:100%;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;text-align:center;overflow:hidden;"><p style="position:absolute;left:50%;bottom:88px;transform:translateX(-50%);display:block;width:640px;max-width:640px;margin:0;background:rgba(0,0,0,0.78);color:#fff;font-size:24px;line-height:1.16;font-weight:800;border-radius:14px;padding:10px 16px;text-shadow:0 2px 8px rgba(0,0,0,0.96);white-space:normal;overflow-wrap:anywhere;word-break:normal;hyphens:auto;box-sizing:border-box;">${escapeHtml(safeLine)}</p></div>`;
    return { asset: { type: "html", html, width: 720, height: 160 }, start, length, position: "bottom", offset: { x: 0, y: 0.1 } };
  });
}

function isImageUrl(src: string) {
  return /\.(png|jpe?g|webp)(?:\?|$)/i.test(String(src));
}

function isCrelavoUiDemo(input: { title: string; subtitleLines?: string[] }) {
  const haystack = [input.title, ...(input.subtitleLines ?? [])].join(" ").toLowerCase();
  return /crelavo|software dashboard|dashboard demo|website ui|ui walkthrough|link input|mp4 export|subtitles|voice-over/.test(haystack)
    && !/people|office footage|talking head/.test(haystack);
}

function uiPanelHtml(title: string, body: string, eyebrow = "Crelavo") {
  return `<div style="width:100%;height:100%;box-sizing:border-box;padding:96px 56px;background:linear-gradient(160deg,#050816 0%,#0f172a 52%,#111827 100%);color:white;font-family:Arial,Helvetica,sans-serif;overflow:hidden;">
    <div style="height:100%;border:1px solid rgba(148,163,184,.34);border-radius:34px;background:rgba(15,23,42,.86);box-shadow:0 34px 100px rgba(0,0,0,.42);padding:42px;display:flex;flex-direction:column;justify-content:center;">
      <div style="display:inline-flex;align-self:flex-start;padding:9px 15px;border-radius:999px;background:rgba(56,189,248,.14);color:#7dd3fc;font-size:22px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
      <h1 style="margin:34px 0 18px;font-size:56px;line-height:1.02;letter-spacing:-.05em;">${escapeHtml(title)}</h1>
      <p style="margin:0;color:#cbd5e1;font-size:31px;line-height:1.28;font-weight:700;">${escapeHtml(body)}</p>
    </div>
  </div>`;
}

function browserScreenshotHtml(imageUrl: string) {
  return `<div style="width:100%;height:100%;box-sizing:border-box;padding:70px 38px;background:radial-gradient(circle at 50% 8%,rgba(56,189,248,.23),transparent 34%),linear-gradient(165deg,#020617 0%,#0f172a 48%,#111827 100%);color:white;font-family:Arial,Helvetica,sans-serif;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <div style="font-size:30px;font-weight:950;letter-spacing:-.04em;">Crelavo</div>
      <div style="font-size:18px;color:#93c5fd;font-weight:850;">Real website source</div>
    </div>
    <div style="border:1px solid rgba(148,163,184,.36);border-radius:32px;background:rgba(15,23,42,.92);box-shadow:0 28px 110px rgba(0,0,0,.55);overflow:hidden;">
      <div style="height:54px;display:flex;align-items:center;gap:10px;padding:0 20px;border-bottom:1px solid rgba(148,163,184,.24);background:rgba(2,6,23,.7);">
        <span style="width:14px;height:14px;border-radius:50%;background:#ef4444;"></span><span style="width:14px;height:14px;border-radius:50%;background:#f59e0b;"></span><span style="width:14px;height:14px;border-radius:50%;background:#22c55e;"></span>
        <div style="margin-left:14px;flex:1;border-radius:999px;background:rgba(30,41,59,.95);color:#cbd5e1;padding:9px 16px;font-size:17px;font-weight:800;">https://www.crelavo.com</div>
      </div>
      <div style="height:740px;background:linear-gradient(180deg,#07111f,#020617);display:flex;align-items:flex-start;justify-content:center;overflow:hidden;padding:18px;box-sizing:border-box;">
        <img src="${escapeHtml(imageUrl)}" style="max-width:100%;max-height:704px;width:auto;height:auto;display:block;object-fit:contain;object-position:top center;border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.45);" />
      </div>
    </div>
    <div style="margin-top:24px;border-radius:24px;background:linear-gradient(90deg,rgba(56,189,248,.18),rgba(37,99,235,.14));border:1px solid rgba(56,189,248,.34);padding:22px 24px;font-size:25px;line-height:1.22;font-weight:850;color:#e0f2fe;">The source page stays visible. Crelavo builds the video workflow from this real website context.</div>
  </div>`;
}

function dashboardPanelHtml(kind: string) {
  const cards: Record<string, { title: string; body: string; rows: string[]; metric: string }> = {
    input: { title: "Paste any product or website link", body: "Crelavo turns source pages into ad-ready video plans.", rows: ["Source URL locked", "Website context imported", "Premium video setup ready"], metric: "01" },
    analysis: { title: "AI analysis cards", body: "The page, offer, audience and benefits are extracted into structured creative inputs.", rows: ["Brand context", "Product benefits", "Audience angle"], metric: "02" },
    script: { title: "Script and scene plan", body: "Crelavo prepares hook, narration beats and visual scene cards for a vertical ad.", rows: ["Hook structure", "UI walkthrough beats", "CTA close"], metric: "03" },
    controls: { title: "Voice, subtitles and music", body: "Production settings stay visible before the final render starts.", rows: ["English voice-over", "Subtitles aligned", "Background music"], metric: "04" },
    export: { title: "Final MP4 export", body: "A vertical video is prepared for TikTok, Reels, Shorts and paid ads.", rows: ["9:16 vertical", "4K delivery", "Final MP4"], metric: "05" }
  };
  const data = cards[kind] ?? cards.input;
  const rowHtml = data.rows.map((row) => `<div style="display:flex;align-items:center;gap:14px;border:1px solid rgba(148,163,184,.22);background:linear-gradient(90deg,rgba(15,23,42,.94),rgba(30,41,59,.76));border-radius:18px;padding:18px 20px;font-size:25px;font-weight:850;color:#e5e7eb;"><span style="width:18px;height:18px;border-radius:50%;background:#38bdf8;box-shadow:0 0 22px rgba(56,189,248,.7);"></span>${escapeHtml(row)}</div>`).join("");
  return `<div style="width:100%;height:100%;box-sizing:border-box;padding:72px 44px;background:radial-gradient(circle at 70% 10%,rgba(59,130,246,.28),transparent 32%),linear-gradient(165deg,#020617 0%,#0f172a 48%,#172554 100%);color:white;font-family:Arial,Helvetica,sans-serif;overflow:hidden;">
    <div style="height:100%;display:flex;flex-direction:column;gap:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;"><div style="font-size:31px;font-weight:950;letter-spacing:-.04em;">Crelavo</div><div style="font-size:18px;color:#93c5fd;font-weight:850;">Dashboard workflow</div></div>
      <div style="border:1px solid rgba(148,163,184,.3);border-radius:34px;background:rgba(2,6,23,.72);padding:34px;box-shadow:0 28px 105px rgba(0,0,0,.48);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:16px;"><h2 style="margin:0;font-size:44px;line-height:1.05;letter-spacing:-.05em;">${escapeHtml(data.title)}</h2><div style="min-width:78px;height:78px;border-radius:24px;background:rgba(56,189,248,.14);color:#7dd3fc;display:flex;align-items:center;justify-content:center;font-size:31px;font-weight:950;">${escapeHtml(data.metric)}</div></div>
        <p style="margin:0 0 27px;color:#bfdbfe;font-size:24px;line-height:1.25;font-weight:750;">${escapeHtml(data.body)}</p>
        <div style="display:flex;flex-direction:column;gap:14px;">${rowHtml}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="border-radius:22px;background:rgba(15,23,42,.76);border:1px solid rgba(148,163,184,.18);padding:22px;font-size:21px;font-weight:850;color:#cbd5e1;">Source-based</div>
        <div style="border-radius:22px;background:rgba(15,23,42,.76);border:1px solid rgba(148,163,184,.18);padding:22px;font-size:21px;font-weight:850;color:#cbd5e1;">Ad-ready</div>
      </div>
    </div>
  </div>`;
}

function overlayCardHtml(title: string, body: string, eyebrow = "Crelavo") {
  return `<div style="width:100%;height:100%;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:white;background:transparent;overflow:hidden;">
    <div style="position:absolute;left:44px;right:44px;top:96px;border-radius:30px;background:rgba(2,6,23,.86);border:1px solid rgba(56,189,248,.35);box-shadow:0 24px 80px rgba(0,0,0,.45);padding:30px 32px;">
      <div style="display:inline-block;border-radius:999px;background:rgba(56,189,248,.18);color:#7dd3fc;font-size:18px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;padding:8px 13px;">${escapeHtml(eyebrow)}</div>
      <div style="margin-top:16px;font-size:42px;line-height:1.04;font-weight:950;letter-spacing:-.045em;">${escapeHtml(title)}</div>
      <div style="margin-top:12px;font-size:23px;line-height:1.24;font-weight:750;color:#dbeafe;">${escapeHtml(body)}</div>
    </div>
  </div>`;
}

function motionCardHtml(title: string, body: string, accent = "Crelavo") {
  return `<div style="width:100%;height:100%;box-sizing:border-box;padding:86px 54px;background:radial-gradient(circle at 20% 10%,rgba(56,189,248,.34),transparent 28%),radial-gradient(circle at 85% 20%,rgba(168,85,247,.28),transparent 34%),linear-gradient(150deg,#020617 0%,#0f172a 48%,#111827 100%);color:white;font-family:Arial,Helvetica,sans-serif;overflow:hidden;position:relative;">
    <div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 0%,rgba(56,189,248,.10) 38%,transparent 58%);transform:skewY(-8deg);"></div>
    <div style="position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;gap:30px;">
      <div style="align-self:flex-start;border-radius:999px;background:rgba(56,189,248,.17);border:1px solid rgba(125,211,252,.42);color:#7dd3fc;font-size:22px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;padding:10px 17px;">${escapeHtml(accent)}</div>
      <div style="font-size:82px;line-height:.94;font-weight:1000;letter-spacing:-.075em;text-shadow:0 14px 54px rgba(0,0,0,.52);">${escapeHtml(title)}</div>
      <div style="font-size:34px;line-height:1.14;font-weight:850;color:#dbeafe;max-width:890px;">${escapeHtml(body)}</div>
      <div style="display:flex;gap:13px;margin-top:8px;">
        <span style="width:58px;height:8px;border-radius:999px;background:#38bdf8;box-shadow:0 0 28px rgba(56,189,248,.85);"></span>
        <span style="width:28px;height:8px;border-radius:999px;background:#a855f7;"></span>
        <span style="width:42px;height:8px;border-radius:999px;background:#22c55e;"></span>
      </div>
    </div>
  </div>`;
}

function motionTextCardClips(title: string, lines: string[] | undefined, durationSeconds: number) {
  const fallback = [
    "CREATE IT: Ideas become videos, websites, apps and campaigns.",
    "AI VIDEO + PRODUCT ADS: Fast social clips, product demos and e-commerce campaigns.",
    "WEBSITES + APPS + SAAS: Landing pages, mobile apps, dashboards and billing flows.",
    "CREATIVE MEDIA STACK: Music videos, brand kits, image packs, lip-sync and localization.",
    "SOCIAL EXPORT: Final MP4, thumbnail, captions, hashtags and connected accounts.",
    "LAUNCH IT. SCALE IT. CRELAVO."
  ];
  const cards = (lines?.length ? lines : fallback).map((line) => String(line ?? "").replace(/^[•\-\d.\s]+/, "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 8);
  const slot = durationSeconds / Math.max(1, cards.length);
  return cards.map((line, index) => {
    const start = Number((index * slot).toFixed(2));
    const length = Number(Math.min(slot + 0.04, durationSeconds - start).toFixed(2));
    const [headline, ...rest] = line.split(/[:—-]/).map((part) => part.trim()).filter(Boolean);
    const body = rest.join(" — ") || (index === 0 ? "Stop the scroll with a fast premium motion ad." : "Fast motion graphics. Clean text. Strong rhythm.");
    return { asset: { type: "html", html: motionCardHtml(headline || title, body, index === 0 ? "Hook" : index === cards.length - 1 ? "CTA" : "Crelavo"), width: 1080, height: 1920 }, start, length };
  }).filter((clip) => clip.length > 0);
}

function crelavoUiFallbackOverlayClips(durationSeconds: number) {
  const segments = [
    { start: 0, end: 3.4, html: overlayCardHtml("Paste a link. Get a premium product demo.", "Crelavo turns a real website into an ad-ready video workflow.", "Hook") },
    { start: 3.4, end: 7.2, html: overlayCardHtml("Real website source", "The screenshot remains visible inside the vertical product demo.", "Source") },
    { start: 7.2, end: 11.2, html: overlayCardHtml("Link input dashboard", "Paste a product or website link and start analysis.", "Step 01") },
    { start: 11.2, end: 15.4, html: overlayCardHtml("AI analysis cards", "Crelavo extracts brand context, benefits and audience angles.", "Step 02") },
    { start: 15.4, end: 19.5, html: overlayCardHtml("Script and scene plan", "Hook, narration beats and UI scenes are prepared automatically.", "Step 03") },
    { start: 19.5, end: 23.6, html: overlayCardHtml("Voice, subtitles and music", "English voice-over, captions and background music are packaged together.", "Step 04") },
    { start: 23.6, end: 27.2, html: overlayCardHtml("Final MP4 export", "Ready for TikTok, Reels, Shorts and paid ads.", "Step 05") },
    { start: 27.2, end: durationSeconds, html: overlayCardHtml("Start with one link.", "Export a ready-to-publish Crelavo product demo video.", "CTA") }
  ];

  return segments
    .map((segment) => {
      const start = Number(Math.min(segment.start, durationSeconds).toFixed(2));
      const end = Number(Math.min(segment.end, durationSeconds).toFixed(2));
      const length = Number(Math.max(0, end - start).toFixed(2));
      if (length <= 0) return null;
      return { asset: { type: "html", html: segment.html, width: 1080, height: 1920 }, start, length };
    })
    .filter(Boolean);
}

export async function createShotstackRender(input: {
  title: string;
  videoUrl?: string;
  videoUrls?: string[];
  videoDurations?: number[];
  audioUrl?: string | null;
  audioSegments?: Array<{ audioUrl: string; start: number; length: number }>;
  subtitleUrl?: string | null;
  subtitleLines?: string[];
  durationSeconds: number;
}): Promise<ProviderJob> {
  const apiKey = shotstackKey();
  const endpoint = shotstackEndpoint();
  const videoUrls = input.videoUrls?.filter(Boolean) ?? (input.videoUrl ? [input.videoUrl] : []);
  const videoDurations = input.videoDurations?.length === videoUrls.length ? input.videoDurations : [];
  const uniqueVisualUrls = Array.from(new Set(videoUrls));
  const visualSlotLength = 5;
  const singleImageUiFallback = uniqueVisualUrls.length === 1 && isImageUrl(uniqueVisualUrls[0]) && isCrelavoUiDemo(input) && !videoDurations.length;
  const fallbackVisualUrls = singleImageUiFallback ? uniqueVisualUrls : videoUrls;
  const repeatedSingleUrls = !singleImageUiFallback && fallbackVisualUrls.length === 1 && input.durationSeconds > visualSlotLength && !videoDurations.length
    ? Array.from({ length: Math.ceil(input.durationSeconds / visualSlotLength) }, () => fallbackVisualUrls[0])
    : fallbackVisualUrls;
  let nextVideoStart = 0;
  const clipLength = repeatedSingleUrls.length > 1 ? visualSlotLength : input.durationSeconds;
  const overlayClips = singleImageUiFallback ? crelavoUiFallbackOverlayClips(input.durationSeconds) : [];
  const videoClips = singleImageUiFallback
    ? [{ asset: { type: "image", src: uniqueVisualUrls[0] }, start: 0, length: input.durationSeconds, fit: "contain" }]
    : repeatedSingleUrls.length
      ? repeatedSingleUrls.map((src, index) => {
          const start = videoDurations.length ? Number(nextVideoStart.toFixed(2)) : Number((index * clipLength).toFixed(2));
          const requestedLength = videoDurations.length ? videoDurations[index] : clipLength;
          const remaining = Math.max(0, input.durationSeconds - start);
          const length = Number(Math.min(requestedLength, remaining).toFixed(2));
          nextVideoStart = Number((nextVideoStart + length).toFixed(2));
          const imageAsset = isImageUrl(src);
          return imageAsset
            ? { asset: { type: "image", src }, start, length, fit: "contain" }
            : { asset: { type: "video", src, volume: 0 }, start, length, fit: "crop" };
        }).filter((clip) => clip.length > 0)
      : isCrelavoUiDemo(input)
        ? motionTextCardClips(input.title, input.subtitleLines, input.durationSeconds)
        : [{ asset: { type: "html", html: `<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#050816;color:white;font-family:Arial;font-size:48px;text-align:center;padding:60px;\">${escapeHtml(input.title)}</div>`, width: 1080, height: 1920 }, start: 0, length: input.durationSeconds }];
  const subtitleClips = subtitleOverlayClips(input.subtitleLines, input.durationSeconds);
  const subtitleTracks = subtitleClips.length ? [{ clips: subtitleClips }] : input.subtitleUrl ? [{ clips: [{ asset: { type: "caption", src: input.subtitleUrl }, start: 0, length: input.durationSeconds }] }] : [];
  const sortedAudioSegments = (input.audioSegments ?? [])
    .filter((segment) => segment.audioUrl)
    .sort((a, b) => a.start - b.start);
  let nextAudioStart = 0;
  const segmentAudioClips = sortedAudioSegments
    .map((segment) => {
      const plannedStart = Number.isFinite(segment.start) ? Math.max(0, segment.start) : nextAudioStart;
      const start = Number(Math.max(plannedStart, nextAudioStart).toFixed(2));
      if (start >= input.durationSeconds) return null;
      const safeLength = Number(Math.max(0.75, Math.min(segment.length, input.durationSeconds - start)).toFixed(2));
      nextAudioStart = Number(Math.min(input.durationSeconds, start + safeLength + 0.12).toFixed(2));
      return { asset: { type: "audio", src: segment.audioUrl, trim: 0 }, start, length: safeLength };
    })
    .filter(Boolean);
  const audioTracks = segmentAudioClips.length
    ? [{ clips: segmentAudioClips }]
    : input.audioUrl ? [{ clips: [{ asset: { type: "audio", src: input.audioUrl }, start: 0, length: input.durationSeconds }] }] : [];
  const tracks = [
    { clips: videoClips },
    ...(overlayClips.length ? [{ clips: overlayClips }] : []),
    ...subtitleTracks,
    ...audioTracks
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeline: {
        tracks
      },
      output: {
        format: "mp4",
        resolution: "hd",
        aspectRatio: "9:16"
      }
    })
  });

  if (!response.ok) throw new Error(`Shotstack render failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "shotstack", id: data.response?.id ?? data.id, status: data.response?.status ?? "queued", raw: data };
}

export async function createShotstackTestRender(): Promise<ProviderJob> {
  const response = await fetch(shotstackEndpoint(), {
    method: "POST",
    headers: {
      "x-api-key": shotstackKey(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "html",
                  html: "<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#050816;color:white;font-family:Arial;font-size:42px;'>Crelavo Shotstack Test</div>",
                  width: 1280,
                  height: 720
                },
                start: 0,
                length: 1
              }
            ]
          }
        ]
      },
      output: {
        format: "mp4",
        resolution: "sd",
        aspectRatio: "16:9"
      }
    })
  });

  if (!response.ok) throw new Error(`Shotstack test render failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "shotstack", id: data.response?.id ?? data.id, status: data.response?.status ?? "queued", raw: data };
}
