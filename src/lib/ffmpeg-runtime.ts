import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function resolveFfmpegPath(): string | null {
  try {
    const resolved = require.resolve("ffmpeg-static");
    return existsSync(resolved) ? resolved : null;
  } catch {
    return null;
  }
}

export function assertFfmpegAvailable(): string {
  const resolved = resolveFfmpegPath();
  if (!resolved) throw new Error("FFMPEG_RUNTIME_UNAVAILABLE: ffmpeg-static is not present in the deployed server bundle; provider generation was blocked before creating a paid job.");
  return resolved;
}
