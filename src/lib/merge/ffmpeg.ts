import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { MergeError } from "./errors.ts";

const req = createRequire(path.join(process.cwd(), "noop.js"));

function fromPackage(name: string, pick: (m: any) => unknown): string | undefined {
  try {
    const v = pick(req(name));
    return typeof v === "string" && v ? v : undefined;
  } catch {
    return undefined;
  }
}

/** Öncelik: env > ffmpeg-static / ffprobe-static paketi > PATH. */
export const ffmpegBin = () =>
  process.env.FFMPEG_PATH || fromPackage("ffmpeg-static", (m) => (typeof m === "string" ? m : m?.default)) || "ffmpeg";
export const ffprobeBin = () =>
  process.env.FFPROBE_PATH || fromPackage("ffprobe-static", (m) => m?.path) || "ffprobe";

export interface RunOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Verilirse stdout satır satır buna gider ve biriktirilmez (ffmpeg -progress için). */
  onStdoutLine?: (line: string) => void;
  maxStdoutBytes?: number;
}
export interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Shell kullanmadan süreç çalıştırır. Signal abort olunca SIGTERM, 5 sn sonra SIGKILL gönderir
 * ve signal.reason ile reject eder (lease kaybında FFmpeg böyle durur).
 */
export function run(bin: string, args: string[], opts: RunOptions = {}): Promise<RunResult> {
  const { signal, timeoutMs, onStdoutLine, maxStdoutBytes = 8 * 1024 * 1024 } = opts;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new Error("aborted"));

    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let lineBuf = "";
    let settled = false;
    let killReason: unknown;
    let killTimer: NodeJS.Timeout | undefined;
    let timer: NodeJS.Timeout | undefined;

    const kill = (reason: unknown) => {
      if (killReason !== undefined) return;
      killReason = reason ?? new Error("aborted");
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
    };
    const onAbort = () => kill(signal?.reason);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (timeoutMs) {
      timer = setTimeout(
        () => kill(new MergeError("PROCESS_TIMEOUT", `${path.basename(bin)} ${Math.round(timeoutMs / 1000)} sn içinde bitmedi`, true)),
        timeoutMs,
      );
    }

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      signal?.removeEventListener("abort", onAbort);
      fn();
    };

    child.stdout.on("data", (d: Buffer) => {
      if (onStdoutLine) {
        lineBuf += d.toString();
        let i: number;
        while ((i = lineBuf.indexOf("\n")) >= 0) {
          onStdoutLine(lineBuf.slice(0, i).trim());
          lineBuf = lineBuf.slice(i + 1);
        }
      } else if (stdout.length < maxStdoutBytes) {
        stdout += d.toString();
      } else {
        kill(new MergeError("PROCESS_OUTPUT_TOO_LARGE", `${path.basename(bin)} çıktısı çok büyük`, false));
      }
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr = (stderr + d.toString()).slice(-8192);
    });
    child.on("error", (err) =>
      finish(() => reject(new MergeError("PROCESS_SPAWN_FAILED", `${bin} çalıştırılamadı: ${err.message}`, false, { cause: err }))),
    );
    child.on("close", (code) => finish(() => (killReason !== undefined ? reject(killReason) : resolve({ code, stdout, stderr }))));
  });
}

let verified: Promise<string> | undefined;

/** Worker ortamında FFmpeg/ffprobe'un gerçekten çalıştığını ve gereken encoder/filtrelerin olduğunu doğrular. */
export function assertFfmpeg(): Promise<string> {
  verified ??= (async () => {
    const fail = (m: string) => new MergeError("FFMPEG_UNAVAILABLE", m, false);
    const v = await run(ffmpegBin(), ["-hide_banner", "-version"], { timeoutMs: 15000 }).catch((e) => {
      throw fail(`ffmpeg çalışmıyor (${ffmpegBin()}): ${e instanceof Error ? e.message : e}`);
    });
    if (v.code !== 0) throw fail(`ffmpeg -version kod ${v.code}`);
    const p = await run(ffprobeBin(), ["-hide_banner", "-version"], { timeoutMs: 15000 }).catch((e) => {
      throw fail(`ffprobe çalışmıyor (${ffprobeBin()}): ${e instanceof Error ? e.message : e}`);
    });
    if (p.code !== 0) throw fail(`ffprobe -version kod ${p.code}`);

    const enc = (await run(ffmpegBin(), ["-hide_banner", "-encoders"], { timeoutMs: 15000 })).stdout;
    if (!/\blibx264\b/.test(enc)) throw fail("ffmpeg derlemesinde libx264 yok");
    if (!/\baac\b/.test(enc)) throw fail("ffmpeg derlemesinde aac encoder yok");
    const flt = (await run(ffmpegBin(), ["-hide_banner", "-filters"], { timeoutMs: 15000 })).stdout;
    for (const f of ["concat", "scale", "pad", "fps", "aresample", "apad", "atrim", "anullsrc"]) {
      if (!new RegExp(`\\s${f}\\s`).test(flt)) throw fail(`ffmpeg derlemesinde '${f}' filtresi yok`);
    }
    return v.stdout.split("\n")[0] ?? "ffmpeg";
  })().catch((e) => {
    verified = undefined; // başarısız doğrulama önbelleğe alınmasın
    throw e;
  });
  return verified;
}

export interface ClipInfo {
  path: string;
  width: number;
  height: number;
  rotation: number;
  fps: number | null;
  durationSec: number;
  hasAudio: boolean;
  videoCodec: string;
}

async function ffprobeJson(file: string, signal?: AbortSignal): Promise<any> {
  const r = await run(
    ffprobeBin(),
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file],
    { signal, timeoutMs: 30000 },
  );
  if (r.code !== 0) throw new MergeError("PROBE_FAILED", `ffprobe okuyamadı: ${r.stderr.trim().slice(-200)}`, true);
  try {
    return JSON.parse(r.stdout);
  } catch (e) {
    throw new MergeError("PROBE_FAILED", "ffprobe çıktısı çözümlenemedi", true, { cause: e });
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};
const rate = (v: unknown): number | null => {
  if (typeof v !== "string") return null;
  const [a, b] = v.split("/").map(Number);
  return b ? a / b : Number.isFinite(a) ? a : null;
};

export async function probeClip(file: string, signal?: AbortSignal): Promise<ClipInfo> {
  const j = await ffprobeJson(file, signal);
  const streams: any[] = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === "video" && s.disposition?.attached_pic !== 1);
  if (!v) throw new MergeError("CLIP_INVALID", "Dosyada video akışı yok", false);

  const durationSec = num(v.duration) ?? num(j.format?.duration);
  if (!durationSec || durationSec <= 0) throw new MergeError("CLIP_INVALID", "Video süresi okunamadı", false);

  const rotation = num(v.tags?.rotate) ?? num((v.side_data_list ?? []).find((s: any) => s.rotation !== undefined)?.rotation) ?? 0;
  return {
    path: file,
    width: v.width,
    height: v.height,
    rotation,
    fps: rate(v.avg_frame_rate) ?? rate(v.r_frame_rate),
    durationSec,
    hasAudio: streams.some((s) => s.codec_type === "audio"),
    videoCodec: v.codec_name,
  };
}

export interface OutputSpec {
  width: number;
  height: number;
  fps: number;
  audioRate: number;
}

export interface OutputInfo {
  durationSec: number;
  videoDurationSec: number | null;
  audioDurationSec: number | null;
  sizeBytes: number;
}

/** Çıktı sözleşmesini (1080x1920, 30 fps, H.264 + AAC 48 kHz stereo, süre) ffprobe ile doğrular. */
export async function validateOutput(
  file: string,
  expectedDurationSec: number,
  spec: OutputSpec,
  signal?: AbortSignal,
): Promise<OutputInfo> {
  const j = await ffprobeJson(file, signal);
  const streams: any[] = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === "video");
  const a = streams.find((s) => s.codec_type === "audio");
  const bad = (m: string) => new MergeError("OUTPUT_VALIDATION_FAILED", `Çıktı doğrulaması başarısız: ${m}`, true);

  if (!v) throw bad("video akışı yok");
  if (!a) throw bad("ses akışı yok");
  if (v.codec_name !== "h264") throw bad(`video codec ${v.codec_name}`);
  if (v.width !== spec.width || v.height !== spec.height) throw bad(`çözünürlük ${v.width}x${v.height}`);
  if (v.pix_fmt !== "yuv420p") throw bad(`pix_fmt ${v.pix_fmt}`);
  const fps = rate(v.avg_frame_rate);
  if (!fps || Math.abs(fps - spec.fps) > 0.01) throw bad(`fps ${v.avg_frame_rate}`);
  if (a.codec_name !== "aac") throw bad(`ses codec ${a.codec_name}`);
  if (Number(a.sample_rate) !== spec.audioRate) throw bad(`örnekleme ${a.sample_rate}`);
  if (a.channels !== 2) throw bad(`kanal sayısı ${a.channels}`);

  const durationSec = num(j.format?.duration) ?? 0;
  const tol = Math.max(1, expectedDurationSec * 0.01);
  if (Math.abs(durationSec - expectedDurationSec) > tol) {
    throw bad(`süre ${durationSec.toFixed(2)} sn, beklenen ${expectedDurationSec.toFixed(2)} sn`);
  }
  return {
    durationSec,
    videoDurationSec: num(v.duration),
    audioDurationSec: num(a.duration),
    sizeBytes: num(j.format?.size) ?? 0,
  };
}
