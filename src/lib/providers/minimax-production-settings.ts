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
  const providerPrompt = String(selectedValue(selected, ["providerPrompt", "provider_prompt", "work_prompt", "workPrompt"]) ?? input.prompt ?? input.title ?? "").trim() || String(input.title ?? "Crelavo video");
  return { model: "MiniMax-H3", duration, ratio, resolution, providerPrompt };
}
