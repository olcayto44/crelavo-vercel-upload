/**
 * Worker makinesinde çalıştırın:  npx tsx worker/verify-ffmpeg.ts
 * 1) ffmpeg/ffprobe çalışıyor mu, libx264 + aac + gerekli filtreler var mı
 * 2) Farklı oran/fps/sessiz-sesli 3 sentetik klibi gerçekten birleştirip çıktı sözleşmesini doğrular
 * Başarılıysa çıkış kodu 0. Supabase gerekmez.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertFfmpeg, ffmpegBin, ffprobeBin } from "../src/lib/merge/ffmpeg.ts";
import { mergeClips } from "../src/lib/merge/merge.ts";

const dir = mkdtempSync(path.join(tmpdir(), "verify-ffmpeg-"));
const gen = (name: string, size: string, rate: number, withAudio: boolean) => {
  const out = path.join(dir, name);
  const a = ["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=${size}:rate=${rate}:duration=1.5`];
  if (withAudio) a.push("-f", "lavfi", "-i", "sine=frequency=440:duration=1.5");
  a.push("-c:v", "libx264", "-pix_fmt", "yuv420p", ...(withAudio ? ["-c:a", "aac"] : []), out);
  const r = spawnSync(ffmpegBin(), a);
  if (r.status !== 0) throw new Error(`Test klibi üretilemedi: ${r.stderr}`);
  return out;
};

(async () => {
  console.log("ffmpeg :", ffmpegBin());
  console.log("ffprobe:", ffprobeBin());
  console.log("sürüm  :", await assertFfmpeg());
  const res = await mergeClips({
    clipPaths: [gen("a.mp4", "1080x1920", 30, true), gen("b.mp4", "1920x1080", 25, false), gen("c.mp4", "640x640", 24, true)],
    outPath: path.join(dir, "out.mp4"),
  });
  console.log(`BİRLEŞTİRME OK: ${res.output.durationSec.toFixed(2)} sn, ${res.output.sizeBytes} bayt (1080x1920, 30 fps, H.264 + AAC 48 kHz stereo)`);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FFMPEG DOĞRULAMASI BAŞARISIZ:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => rmSync(dir, { recursive: true, force: true }));
