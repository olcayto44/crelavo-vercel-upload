export type RuntimeBlock = { type: "text" | "image" | "cta" | "collection" | "hero" | "features" | "faq"; title: string; layout?: "stack" | "split" | "wide"; align?: "start" | "center"; tone?: "surface" | "accent" | "plain"; eyebrow?: string; imageUrl?: string; imageAlt?: string; buttonUrl?: string; buttonLabel?: string; items?: Array<{ title: string; text: string }>; text?: string; url?: string; alt?: string; label?: string; collection?: string };
export type RuntimeTheme = { primaryColor: string; backgroundColor: string; textColor: string; font: "system-ui" | "Georgia" | "Arial"; radius: "square" | "soft" | "round"; spacing?: "compact" | "comfortable" | "airy"; maxWidth?: "narrow" | "standard" | "wide"; displayFont?: "system-ui" | "Georgia" | "Arial" };
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
    const raw = object(item); if (!["text", "image", "cta", "collection", "hero", "features", "faq"].includes(String(raw.type))) throw new Error("runtime_design_block_type_invalid");
    const block: RuntimeBlock = { type: raw.type as RuntimeBlock["type"], title: text(raw, "title", 180, true)! };
    for (const [key, choices] of Object.entries({ layout: ["stack", "split", "wide"], align: ["start", "center"], tone: ["surface", "accent", "plain"] })) { if (raw[key] !== undefined) { if (!(choices as string[]).includes(String(raw[key]))) throw new Error("runtime_design_layout_invalid"); Object.assign(block, { [key]: raw[key] }); } }
    if (raw.eyebrow !== undefined) block.eyebrow = text(raw, "eyebrow", 120, true);
    if (block.type === "hero") { block.text = text(raw, "text", 6000, true); if (raw.imageUrl !== undefined) { block.imageUrl = runtimeLink(raw.imageUrl); block.imageAlt = text(raw, "imageAlt", 250, true); } if (raw.buttonUrl !== undefined) { block.buttonUrl = runtimeLink(raw.buttonUrl); block.buttonLabel = text(raw, "buttonLabel", 120, true); } }
    if (block.type === "features" || block.type === "faq") { if (!Array.isArray(raw.items) || !raw.items.length || raw.items.length > 20) throw new Error("runtime_design_items_invalid"); block.items = raw.items.map(item => { const entry = object(item); return { title: text(entry, "title", 180, true)!, text: text(entry, "text", 3000, true)! }; }); }
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
  for (const [key, choices] of Object.entries({ spacing: ["compact", "comfortable", "airy"], maxWidth: ["narrow", "standard", "wide"], displayFont: ["system-ui", "Georgia", "Arial"] })) { if (raw[key] !== undefined) { if (!(choices as string[]).includes(String(raw[key]))) throw new Error("runtime_theme_token_invalid"); result[key] = String(raw[key]); } }
  if (colorContrast(result.backgroundColor, result.textColor) < 4.5) throw new Error("runtime_theme_text_contrast_invalid");
  return { ...result, font: raw.font, radius: raw.radius } as RuntimeTheme;
}

export function colorContrast(a: string, b: string): number { const luminance = (hex: string) => { const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722; }; const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
