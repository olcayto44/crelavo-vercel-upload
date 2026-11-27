import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
const exec = promisify(execFile);
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024;
export async function verifyMp4Bytes(bytes: Buffer, ffmpeg: string) {
  if (bytes.length < 32 || bytes.length > MAX_VIDEO_BYTES || bytes.toString("ascii", 4, 8) !== "ftyp" || !["isom","iso2","iso5","iso6","mp41","mp42","avc1","dash","M4V "].includes(bytes.toString("ascii", 8, 12))) throw Error("mp4_container_invalid");
  const dir = await mkdtemp(join(tmpdir(), "crelavo-verify-"));
  try {
    const file = join(dir, "artifact.mp4");
    await writeFile(file, bytes, { mode: 0o600 });
    const { stdout } = await exec(ffmpeg, ["-hide_banner","-nostdin","-v","error","-xerror","-err_detect","explode","-threads","1","-max_pixels","8294400","-protocol_whitelist","file,pipe","-f","mov","-i",file,"-map","0:V:0","-map","0:a?","-progress","pipe:1","-nostats","-f","null","-"], { timeout: 45000, maxBuffer: 1024 * 1024 });
    const frames = Array.from(stdout.matchAll(/^frame=(\d+)$/gm)).at(-1);
    const time = Array.from(stdout.matchAll(/^out_time_us=(\d+)$/gm)).at(-1);
    const durationSeconds = Number(time?.[1]) / 1000000;
    if (!/^progress=end$/m.test(stdout) || Number(frames?.[1] ?? 0) < 1 || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 600) throw Error("mp4_decode_incomplete");
    return { status: "decoded_mp4" as const, sha256: createHash("sha256").update(bytes).digest("hex"), byteLength: bytes.length, durationSeconds };
  } finally { await rm(dir, { recursive: true, force: true }); }
}
export async function readBoundedVideo(response: Response) {
  if (!response.ok || response.headers.get("content-type")?.split(";")[0].trim() !== "video/mp4") throw Error("stored_video_unavailable");
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_VIDEO_BYTES) throw Error("stored_video_size_limit");
  const reader = response.body?.getReader();
  if (!reader) throw Error("stored_video_missing_body");
  const chunks: Buffer[] = []; let total = 0;
  try {
    for (;;) { const {done,value} = await reader.read(); if(done) break; total += value.byteLength; if(total > MAX_VIDEO_BYTES) throw Error("stored_video_size_limit"); chunks.push(Buffer.from(value)); }
  } finally { await reader.cancel().catch(()=>{}); }
  if (length > 0 && length !== total) throw Error("stored_video_length_mismatch");
  return Buffer.concat(chunks);
}
