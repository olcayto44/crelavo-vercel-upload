import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { createShotstackRender } from "@/lib/providers/shotstack";
import { uploadProviderAsset } from "@/lib/providers/storage";
import { createSubtitleFile } from "@/lib/providers/subtitles";
import type { ProviderJob } from "@/lib/providers/types";

function runFfmpeg(args: string[], timeoutMs = 120000) {
  return new Promise<{ stderr: string }>((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static binary is not available."));
      return;
    }
    execFile(ffmpegPath, args, { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve({ stderr: String(stderr ?? "") });
    });
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cleanText(value: unknown, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim() || fallback;
}

function parseDurationSeconds(stderr: string) {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
  if (!match) return 0;
  const hours = Number(match[1]) || 0;
  const minutes = Number(match[2]) || 0;
  const seconds = Number(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseSceneChangeTimestamps(stderr: string) {
  const timestamps = Array.from(stderr.matchAll(/pts_time:([0-9]+(?:\.[0-9]+)?)/g))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0);
  return Array.from(new Set(timestamps)).sort((a, b) => a - b);
}

function pickFallbackTimestamps(sourceDuration: number, clipCount: number) {
  const safeDuration = Math.max(clipCount * 4, sourceDuration || clipCount * 6, 15);
  const step = safeDuration / (clipCount + 1);
  return Array.from({ length: clipCount }, (_, index) => Number(((index + 1) * step).toFixed(2)));
}

function pickHighlightTimestamps(candidates: number[], sourceDuration: number, clipCount: number) {
  const usableCandidates = candidates.filter((timestamp) => timestamp > 0.8 && timestamp < Math.max(1, sourceDuration - 1.2));
  if (!usableCandidates.length) return pickFallbackTimestamps(sourceDuration, clipCount);

  const selected: number[] = [];
  const minGap = Math.max(2.5, sourceDuration / Math.max(clipCount + 2, 3) / 1.4);
  for (const timestamp of usableCandidates) {
    if (!selected.length || selected.every((item) => Math.abs(item - timestamp) >= minGap)) {
      selected.push(timestamp);
    }
    if (selected.length >= clipCount) break;
  }

  if (selected.length < clipCount) {
    for (const timestamp of pickFallbackTimestamps(sourceDuration, clipCount)) {
      if (selected.every((item) => Math.abs(item - timestamp) >= minGap * 0.7)) selected.push(timestamp);
      if (selected.length >= clipCount) break;
    }
  }

  return selected.slice(0, clipCount).sort((a, b) => a - b);
}

function buildHighlightLabel(prompt: string, index: number) {
  const signal = prompt.toLowerCase();
  if (/funny|komik|eğlenceli|eglenceli/.test(signal)) return `Funny moment ${index + 1}`;
  if (/scary|korku|horror|gerilim/.test(signal)) return `Suspense moment ${index + 1}`;
  if (/hook|opening|intro|başlangıç|baslangic/.test(signal)) return `Strong hook ${index + 1}`;
  if (/battle|war|warfare|aksiyon|action|fight/.test(signal)) return `Action peak ${index + 1}`;
  if (/product|ad|promo|campaign/.test(signal)) return `Best product moment ${index + 1}`;
  return `Highlight ${index + 1}`;
}

async function downloadSourceVideo(sourceVideoUrl: string) {
  const response = await fetch(sourceVideoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Source video download failed: ${response.status} ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

async function probeSourceVideo(input: { sourcePath: string; requestedClipCount: number }) {
  const probe = await runFfmpeg(["-hide_banner", "-i", input.sourcePath, "-f", "null", "-"]);
  const durationSeconds = parseDurationSeconds(probe.stderr);
  const sceneCandidates = parseSceneChangeTimestamps(probe.stderr);
  return {
    durationSeconds,
    sceneCandidates,
    effectiveDurationSeconds: durationSeconds || Math.max(input.requestedClipCount * 5, 15)
  };
}

async function extractClip(input: { sourcePath: string; outputPath: string; startSeconds: number; durationSeconds: number }) {
  const safeStart = Math.max(0, Number(input.startSeconds.toFixed(2)));
  const safeDuration = Math.max(2.5, Number(input.durationSeconds.toFixed(2)));
  await runFfmpeg([
    "-y",
    "-ss",
    String(safeStart),
    "-i",
    input.sourcePath,
    "-t",
    String(safeDuration),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    input.outputPath
  ]);
}

export type VideoClippingHighlight = {
  index: number;
  label: string;
  timestampSeconds: number;
  startSeconds: number;
  durationSeconds: number;
  clipUrl: string;
};

export type VideoClippingRunResult = {
  sourceVideoUrl: string;
  sourceDurationSeconds: number;
  requestedClipCount: number;
  sceneCandidates: number[];
  selectedHighlights: VideoClippingHighlight[];
  clipUrls: string[];
  clipDurations: number[];
  subtitleUrl: string;
  renderJob: ProviderJob | null;
};

export async function runVideoClippingPipeline(input: {
  productionId: string;
  title?: unknown;
  prompt?: unknown;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  requestedClipCount?: number;
  targetDurationSeconds?: number;
}): Promise<VideoClippingRunResult> {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const sourceVideoUrl = cleanText(
    requestMetadata.sourceVideoUrl ??
      requestMetadata.source_video_url ??
      requestMetadata.videoUrl ??
      requestMetadata.video_url ??
      inputJson.sourceVideoUrl ??
      inputJson.source_video_url ??
      inputJson.videoUrl ??
      inputJson.video_url ??
      requestMetadata.finalVideoUrl ??
      inputJson.finalVideoUrl ??
      requestMetadata.previewUrl ??
      inputJson.previewUrl ??
      requestMetadata.preview_url ??
      inputJson.preview_url,
    ""
  );

  if (!sourceVideoUrl || !/^https:\/\//i.test(sourceVideoUrl)) {
    throw new Error("video_clipping requires a secure https sourceVideoUrl or video_url in metadata.");
  }

  const title = cleanText(input.title, "Long video clipping");
  const prompt = cleanText(input.prompt, title);
  const requestedClipCount = Math.max(1, Math.min(10, Number(input.requestedClipCount ?? requestMetadata.requestedClipCount ?? requestMetadata.outputCount ?? inputJson.requestedClipCount ?? inputJson.outputCount ?? 3) || 3));
  const targetDurationSeconds = Math.max(5, Number(input.targetDurationSeconds ?? requestMetadata.outputDurationSeconds ?? inputJson.outputDurationSeconds ?? requestedClipCount * 6) || requestedClipCount * 6);

  const workingDir = await mkdtemp(join(tmpdir(), "crelavo-clipping-"));
  const sourcePath = join(workingDir, "source.mp4");

  try {
    await writeFile(sourcePath, await downloadSourceVideo(sourceVideoUrl));
    const probe = await probeSourceVideo({ sourcePath, requestedClipCount });
    const sourceDurationSeconds = probe.durationSeconds || probe.effectiveDurationSeconds;
    const sceneCandidates = probe.sceneCandidates;
    const selectedTimestamps = pickHighlightTimestamps(sceneCandidates, sourceDurationSeconds, requestedClipCount);
    const clipDurationSeconds = clamp(targetDurationSeconds / requestedClipCount, 4.5, 12);

    const captionLines: string[] = [];
    const selectedHighlights: VideoClippingHighlight[] = [];
    const clipUrls: string[] = [];
    const clipDurations: number[] = [];

    for (let index = 0; index < selectedTimestamps.length; index += 1) {
      const timestampSeconds = selectedTimestamps[index];
      const startSeconds = clamp(timestampSeconds - clipDurationSeconds * 0.5, 0, Math.max(0, sourceDurationSeconds - clipDurationSeconds));
      const actualDuration = clamp(Math.min(clipDurationSeconds, sourceDurationSeconds - startSeconds), 2.5, clipDurationSeconds);
      const clipPath = join(workingDir, `clip-${index + 1}.mp4`);
      await extractClip({ sourcePath, outputPath: clipPath, startSeconds, durationSeconds: actualDuration });
      const clipBytes = await readFile(clipPath);
      const clipUrl = await uploadProviderAsset(`${input.productionId}/clip-${index + 1}.mp4`, clipBytes, "video/mp4");
      const label = buildHighlightLabel(prompt, index);
      captionLines.push(`${label}.`);
      selectedHighlights.push({ index: index + 1, label, timestampSeconds, startSeconds, durationSeconds: actualDuration, clipUrl });
      clipUrls.push(clipUrl);
      clipDurations.push(actualDuration);
    }

    const subtitleUrl = await createSubtitleFile({ productionId: input.productionId, lines: captionLines, durationSeconds: Math.max(5, clipDurations.reduce((sum, value) => sum + value, 0)) });
    const finalDurationSeconds = Math.max(5, clipDurations.reduce((sum, value) => sum + value, 0));
    const renderJob = await createShotstackRender({
      title,
      videoUrls: clipUrls,
      videoDurations: clipDurations,
      subtitleUrl,
      subtitleLines: captionLines,
      durationSeconds: finalDurationSeconds
    });

    return {
      sourceVideoUrl,
      sourceDurationSeconds,
      requestedClipCount,
      sceneCandidates,
      selectedHighlights,
      clipUrls,
      clipDurations,
      subtitleUrl,
      renderJob
    };
  } finally {
    await rm(workingDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
