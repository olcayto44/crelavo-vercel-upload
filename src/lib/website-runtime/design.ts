export type RuntimeBlock = { type: "text" | "image" | "cta" | "collection"; title: string; text?: string; url?: string; alt?: string; label?: string; collection?: string };
export type RuntimeTheme = { primaryColor: string; backgroundColor: string; textColor: string; font: "system-ui" | "Georgia" | "Arial"; radius: "square" | "soft" | "round" };
const object = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("runtime_design_object_required"); return value as Record<string, unknown>; };
export function runtimeLink(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 2048 || /[\\\u0000-\u0020]/.test(value)) throw new Error("runtime_design_url_invalid");
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { const url = new URL(value); if (url.protocol === "https:" && !url.username && !url.password) return url.href; } catch {}
  throw new Error("runtime_design_url_invalid");
}
export function validateRuntimeBlocks(value: unknown, publicCollections: string[]): RuntimeBlock[] {
  if (!Array.isArray(value) || !value.length || value.length > 40) throw new Error("runtime_design_blocks_invalid");
  const text = (raw: Record<string, unknown>, key: string, limit: number, required = false) => {
    const v = raw[key]; if (v === undefined && !required) return undefined;
    if (typeof v !== "string" || v.length > limit || (required && !v.trim())) throw new Error("runtime_design_" + key + "_invalid"); return v.trim();
  };
  return value.map(item => {
    const raw = object(item); if (!["text", "image", "cta", "collection"].includes(String(raw.type))) throw new Error("runtime_design_block_type_invalid");
    const block: RuntimeBlock = { type: raw.type as RuntimeBlock["type"], title: text(raw, "title", 180, true)! };
    if (block.type === "text" || block.type === "cta") block.text = text(raw, "text", 6000, true);
    if (block.type === "image" || block.type === "cta") block.url = runtimeLink(raw.url);
    if (block.type === "image") block.alt = text(raw, "alt", 250, true);
    if (block.type === "cta") block.label = text(raw, "label", 120, true);
    if (block.type === "collection") { if (typeof raw.collection !== "string" || !publicCollections.includes(raw.collection)) throw new Error("runtime_design_collection_invalid"); block.collection = raw.collection; }
    return block;
  });
}
export function validateRuntimeTheme(value: unknown): RuntimeTheme {
  const raw = object(value), result: Record<string, string> = {};
  for (const key of ["primaryColor", "backgroundColor", "textColor"]) { if (typeof raw[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(raw[key] as string)) throw new Error("runtime_theme_color_invalid"); result[key] = raw[key] as string; }
  if (!["system-ui", "Georgia", "Arial"].includes(String(raw.font)) || !["square", "soft", "round"].includes(String(raw.radius))) throw new Error("runtime_theme_token_invalid");
  return { ...result, font: raw.font, radius: raw.radius } as RuntimeTheme;
}
