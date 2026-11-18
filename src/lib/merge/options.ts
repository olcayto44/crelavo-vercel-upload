export type MergeOptions = { aspect: "9:16" | "16:9"; fit: "contain" | "cover"; transition: "cut" | "fade" };
export const DEFAULT_OPTIONS: MergeOptions = { aspect: "9:16", fit: "contain", transition: "cut" };
export function parseOptions(value: unknown): MergeOptions | null {
  if (value === undefined) return { ...DEFAULT_OPTIONS };
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!["9:16", "16:9"].includes(String(v.aspect)) || !["contain", "cover"].includes(String(v.fit)) || !["cut", "fade"].includes(String(v.transition))) return null;
  return { aspect: v.aspect, fit: v.fit, transition: v.transition } as MergeOptions;
}
