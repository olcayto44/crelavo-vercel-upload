import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveFfmpegPath } from "@/lib/ffmpeg-runtime";
import { uploadProviderAsset } from "@/lib/providers/storage";

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const ffmpegBinary = resolveFfmpegPath();
    if (!ffmpegBinary) {
      reject(new Error("FFMPEG_RUNTIME_UNAVAILABLE: ffmpeg-static is not present in the deployed server bundle."));
      return;
    }
    execFile(ffmpegBinary, args, { timeout: 30000 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve();
    });
  });
}

export async function generateVideoThumbnail(input: { productionId: string; videoUrl: string; timestampSeconds?: number }) {
  const timestampSeconds = input.timestampSeconds ?? 2.5;
  const response = await fetch(input.videoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Video download failed for thumbnail: ${response.status} ${await response.text()}`);

  const directory = await mkdtemp(join(tmpdir(), "crelavo-thumb-"));
  const videoPath = join(directory, "input.mp4");
  const imagePath = join(directory, "thumbnail.jpg");

  try {
    const bytes = await response.arrayBuffer();
    await writeFile(videoPath, Buffer.from(bytes));
    await runFfmpeg([
      "-y",
      "-ss",
      String(timestampSeconds),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      imagePath
    ]);
    const imageBytes = await readFile(imagePath);
    return uploadProviderAsset(`${input.productionId}/auto-thumbnail.jpg`, imageBytes, "image/jpeg");
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}
