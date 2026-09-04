export const MINIMAX_MAX_PROMPT_CHARS = 7000;
export const MINIMAX_SAFE_PROMPT_CHARS = 6400;

const PROMPT_COMPACTION_MARKER = `\n[Prompt compacted to fit MiniMax's ${MINIMAX_MAX_PROMPT_CHARS}-character limit.]\n`;

function boundaryBefore(value: string, limit: number) {
  const candidate = value.slice(0, limit);
  const boundary = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(". "), candidate.lastIndexOf("; "), candidate.lastIndexOf(" "));
  return boundary >= Math.floor(limit * 0.7) ? boundary : limit;
}

export function compactMiniMaxPrompt(value: unknown, maxChars = MINIMAX_SAFE_PROMPT_CHARS) {
  const prompt = String(value ?? "").trim();
  if (prompt.length <= maxChars) return prompt;

  const tailChars = Math.min(1200, Math.floor(maxChars * 0.2));
  const headChars = maxChars - tailChars - PROMPT_COMPACTION_MARKER.length;
  const headEnd = boundaryBefore(prompt, headChars);
  const tailStart = prompt.length - tailChars;
  const tailOffset = prompt.indexOf("\n", tailStart);
  const safeTailStart = tailOffset >= 0 && tailOffset < prompt.length - 1 ? tailOffset + 1 : tailStart;
  const compacted = `${prompt.slice(0, headEnd).trimEnd()}${PROMPT_COMPACTION_MARKER}${prompt.slice(safeTailStart).trimStart()}`;
  return compacted.length <= maxChars ? compacted : compacted.slice(0, maxChars).trimEnd();
}

export type MiniMaxProductionSettings = {
  model: "MiniMax-H3";
  duration: 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  ratio: "adaptive" | "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  resolution: "768P" | "2K";
  providerPrompt: string;
};

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  const text = String(value ?? "").trim();
  const number = Number(text.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (!number) return null;
  return /min|dakika|dk/i.test(text) ? number * 60 : number;
}

function selectedValue(selected: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = selected[name];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return undefined;
}

export function miniMaxSegmentDurations(value: unknown) {
  const duration = Math.round(numberFrom(value) ?? 0);
  return [30, 45, 60].includes(duration) ? Array.from({ length: duration / 15 }, () => 15) : [duration];
}

function ratioFrom(value: unknown): MiniMaxProductionSettings["ratio"] {
  const ratio = String(value ?? "").replace(/\s+/g, "").toLowerCase();
  if (ratio === "21:9" || ratio === "16:9" || ratio === "4:3" || ratio === "1:1" || ratio === "3:4" || ratio === "9:16") return ratio;
  return "9:16";
}

export function miniMaxProductionSettings(input: { selected?: Record<string, unknown>; prompt?: unknown; title?: unknown; durationSeconds?: unknown; aspectRatio?: unknown; quality?: unknown; testMode?: boolean }): MiniMaxProductionSettings {
  const selected = input.selected ?? {};
  const durationValue = input.durationSeconds ?? selectedValue(selected, ["durationSeconds", "duration_seconds", "outputDurationSeconds", "output_duration_seconds", "selectedDuration", "selected_duration", "output_duration", "duration"]);
  const requestedDuration = numberFrom(durationValue) ?? 15;
  const duration = (input.testMode ? 5 : Math.min(15, Math.max(5, Math.round(requestedDuration)))) as MiniMaxProductionSettings["duration"];
  const ratio = ratioFrom(input.aspectRatio ?? selectedValue(selected, ["aspectRatio", "aspect_ratio", "ratio"]));
  const quality = String(input.quality ?? selectedValue(selected, ["quality", "selectedQuality", "selected_quality", "qualityLevel"]) ?? "").trim().toLowerCase();
  const resolution = /premium|1080p/.test(quality) ? "2K" : "768P";
  const providerPrompt = compactMiniMaxPrompt(String(selectedValue(selected, ["providerPrompt", "provider_prompt", "work_prompt", "workPrompt"]) ?? input.prompt ?? input.title ?? "").trim() || String(input.title ?? "Crelavo video"));
  return { model: "MiniMax-H3", duration, ratio, resolution, providerPrompt };
}
