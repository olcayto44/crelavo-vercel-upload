import { MergeError } from "./errors.ts";
import {
  assertFfmpeg,
  ffmpegBin,
  probeClip,
  run,
  validateOutput,
  type ClipInfo,
  type OutputInfo,
  type OutputSpec,
} from "./ffmpeg.ts";

export const OUT: OutputSpec = { width: 1080, height: 1920, fps: 30, audioRate: 48000 };
export const MIN_CLIPS = 2;
export const MAX_CLIPS = 12;

const sec = (n: number) => n.toFixed(3);

/**
 * Tek bir filter_complex: her klip aynı biçime getirilir, sonra düz kesmeyle (concat) birleşir.
 *  - Video: oran korunarak sığdırılır (esnetme yok), kalan alan siyah (pad), SAR=1, 30 fps CFR, yuv420p.
 *  - Ses: 48 kHz stereo float. Sesi olmayan klibe aynı sürede sessiz kanal eklenir.
 *    Ses, kliplerin kendi video süresine hizalanır (kısaysa sessizlikle uzatılır, uzunsa fazlası atılır);
 *    aksi halde concat'te ses/görüntü kayması birikir. Video karesi kırpılmaz.
 */
export function buildFilterGraph(clips: Pick<ClipInfo, "durationSec" | "hasAudio">[], spec: OutputSpec = OUT): string {
  const { width: W, height: H, fps, audioRate } = spec;
  const parts: string[] = [];
  clips.forEach((c, i) => {
    parts.push(
      `[${i}:v:0]scale=${W}:${H}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${fps},format=yuv420p,setpts=PTS-STARTPTS[v${i}]`,
    );
    const fmt = `aformat=sample_fmts=fltp:channel_layouts=stereo`;
    if (c.hasAudio) {
      parts.push(`[${i}:a:0]aresample=${audioRate},${fmt},apad,atrim=end=${sec(c.durationSec)},asetpts=PTS-STARTPTS[a${i}]`);
    } else {
      parts.push(`anullsrc=r=${audioRate}:cl=stereo:d=${sec(c.durationSec)},${fmt},asetpts=PTS-STARTPTS[a${i}]`);
    }
  });
  const joined = clips.map((_, i) => `[v${i}][a${i}]`).join("");
  parts.push(`${joined}concat=n=${clips.length}:v=1:a=1[vout][aout]`);
  return parts.join(";");
}

export function buildMergeArgs(
  clips: Pick<ClipInfo, "path" | "durationSec" | "hasAudio">[],
  outPath: string,
  spec: OutputSpec = OUT,
): string[] {
  return [
    "-hide_banner", "-nostdin", "-y", "-loglevel", "error",
    "-progress", "pipe:1", "-nostats",
    ...clips.flatMap((c) => ["-i", c.path]),
    "-filter_complex", buildFilterGraph(clips, spec),
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", process.env.MERGE_X264_PRESET ?? "veryfast", "-crf", "20",
    "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(spec.fps), "-g", String(spec.fps * 2),
    "-c:a", "aac", "-b:a", "192k", "-ar", String(spec.audioRate), "-ac", "2",
    "-movflags", "+faststart", "-f", "mp4", outPath,
  ];
}

export interface MergeResult {
  clips: ClipInfo[];
  totalDurationSec: number;
  output: OutputInfo;
}

/** Yerel dosyaları (sıralı) tek MP4'e birleştirir. Supabase'den bağımsızdır, tek başına test edilebilir. */
export async function mergeClips(opts: {
  clipPaths: string[];
  outPath: string;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}): Promise<MergeResult> {
  const { clipPaths, outPath, signal, onProgress } = opts;
  if (clipPaths.length < MIN_CLIPS || clipPaths.length > MAX_CLIPS) {
    throw new MergeError("CLIP_COUNT_INVALID", `Klip sayısı ${MIN_CLIPS}-${MAX_CLIPS} arasında olmalı`, false);
  }
  await assertFfmpeg();

  const clips: ClipInfo[] = [];
  for (const p of clipPaths) clips.push(await probeClip(p, signal));
  const total = clips.reduce((s, c) => s + c.durationSec, 0);

  let lastPct = -1;
  const handleLine = (line: string) => {
    const m = /^out_time_(?:us|ms)=(\d+)$/.exec(line); // her ikisi de mikrosaniye
    if (!m) return;
    const pct = Math.min(99, Math.floor((Number(m[1]) / 1e6 / total) * 100));
    if (pct !== lastPct) {
      lastPct = pct;
      onProgress?.(pct);
    }
  };

  const timeoutMs = Number(process.env.MERGE_FFMPEG_TIMEOUT_MS) || Math.max(10 * 60_000, total * 8_000);
  const r = await run(ffmpegBin(), buildMergeArgs(clips, outPath), { signal, timeoutMs, onStdoutLine: handleLine });
  if (r.code !== 0) throw new MergeError("FFMPEG_FAILED", `FFmpeg kod ${r.code}: ${r.stderr.trim().slice(-400)}`, true);

  const output = await validateOutput(outPath, total, OUT, signal);
  onProgress?.(100);
  return { clips, totalDurationSec: total, output };
}
