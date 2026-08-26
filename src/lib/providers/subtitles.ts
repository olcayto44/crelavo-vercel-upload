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
  const cleanedLines = input.lines.map((line) => String(line).replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!cleanedLines.length) throw new Error("Subtitle generation requires script lines from the product analysis.");
  const safeLines = cleanedLines;
  const wordCount = safeLines.join(" ").split(/\s+/).filter(Boolean).length;
  const estimatedSpeechSeconds = Math.max(3, Math.min(Math.max(3, input.durationSeconds - 0.25), wordCount / 2.05 + 2));
  const slot = estimatedSpeechSeconds / safeLines.length;
  const srt = safeLines.map((line, index) => {
    const start = index * slot;
    const end = Math.min(estimatedSpeechSeconds, start + slot - 0.08);
    return `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${line}\n`;
  }).join("\n");

  return uploadProviderAsset(`${input.productionId}/subtitles.srt`, srt, "application/x-subrip");
}
