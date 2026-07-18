import { uploadProviderAsset } from "./storage";

function srtTime(seconds: number) {
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, "0");
  const total = Math.floor(seconds);
  const hh = Math.floor(total / 3600).toString().padStart(2, "0");
  const mm = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss},${ms}`;
}

export async function createSubtitleFile(input: { productionId: string; lines: string[]; durationSeconds: number }) {
  const safeLines = input.lines.length > 0 ? input.lines : ["Discover the product", "See why customers love it", "Shop now"];
  const slot = input.durationSeconds / safeLines.length;
  const srt = safeLines.map((line, index) => {
    const start = index * slot;
    const end = Math.min(input.durationSeconds, start + slot - 0.1);
    return `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${line}\n`;
  }).join("\n");

  return uploadProviderAsset(`${input.productionId}/subtitles.srt`, srt, "application/x-subrip");
}
