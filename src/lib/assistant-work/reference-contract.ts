export type AssistantReference = {url: string; kind: "image" | "video" | "audio"; role: "reference" | "first_frame" | "last_frame"};
export function collectAssistantReferences(values: unknown, userText = ""): AssistantReference[] {
  if (values != null && !Array.isArray(values)) throw new Error("invalid_reference_materials");
  const items: unknown[] = [...(Array.isArray(values) ? values : []), ...Array.from(userText.matchAll(/https?:\/\/[^\s<>"']+/g), match => match[0].replace(/[),.;]+$/, ""))];
  const refs: AssistantReference[] = [];
  for (const item of items) {
    const data = typeof item === "string" ? {url:item} : item && typeof item === "object" ? item as Record<string,unknown> : {};
    const raw = String(data.url || "");
    let url: URL; try { url = new URL(raw); } catch { throw new Error("invalid_reference_url"); }
    const extension = url.pathname.toLowerCase();
    const inferred = /\.(png|jpe?g|webp)$/.test(extension) ? "image" : /\.(mp4|webm|mov)$/.test(extension) ? "video" : /\.(mp3|wav|m4a|ogg)$/.test(extension) ? "audio" : undefined;
    // A product/web page in a brief is not a media attachment.
    if (!data.kind && !inferred) continue;
    const kind = data.kind || inferred;
    const role = data.role || "reference";
    if (url.protocol !== "https:" || url.username || url.password || url.hash || !["image","video","audio"].includes(String(kind)) || !["reference","first_frame","last_frame"].includes(String(role))) throw new Error("invalid_reference_materials");
    if (role !== "reference" && kind !== "image") throw new Error("invalid_reference_role");
    const existing=refs.find(ref=>ref.url === raw);
    if (existing) {
      if (data.kind && existing.kind !== kind || data.role && existing.role !== role) throw new Error("conflicting_reference_materials");
      continue;
    }
    refs.push({url:raw,kind:kind as AssistantReference["kind"],role:role as AssistantReference["role"]});
  }
  if (refs.length > 5) throw new Error("reference_limit_exceeded");
  return refs;
}
export function validateAssistantReferenceRoute(provider: string, kind: string, refs: AssistantReference[]) {
  if (!refs.length) return;
  if (kind === "image" && provider === "stability") {
    if (refs.length !== 1 || refs[0].kind !== "image" || refs[0].role !== "reference") throw new Error("image_reference_requires_one_image");
    return;
  }
  if (kind === "video" && provider === "minimax") {
    const frames = refs.filter(ref=>ref.role !== "reference");
    if (frames.length && (frames.length !== refs.length || new Set(frames.map(ref=>ref.role)).size !== frames.length)) throw new Error("reference_frames_cannot_mix");
    if (refs.filter(ref=>ref.kind === "image").length > 3 || refs.filter(ref=>ref.kind === "video").length > 1 || refs.filter(ref=>ref.kind === "audio").length > 1) throw new Error("reference_limit_exceeded");
    return;
  }
  throw new Error("selected_provider_reference_adapter_unavailable");
}
export function assistantReferencePrompt(refs: AssistantReference[]) {
  const counts = {image:0,video:0,audio:0};
  return refs.map(ref=>{const index=++counts[ref.kind]; return "@" + ({image:"Image",video:"Video",audio:"Audio"}[ref.kind]) + index + ": " + (ref.role === "first_frame" ? "explicit opening frame" : ref.role === "last_frame" ? "explicit closing frame" : ref.kind === "image" ? "authorized subject/design reference; preserve visible character identity, silhouette, clothing and markings when present" : ref.kind === "video" ? "authorized motion and scene reference" : "authorized audio reference") + ".";}).join("\n");
}
