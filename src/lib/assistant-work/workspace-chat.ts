export type WorkspaceMessage = { role: "user" | "assistant"; content: string };
export function normalizeWorkspaceMessages(value: unknown): WorkspaceMessage[] {
  return (Array.isArray(value) ? value : []).filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.trim()).slice(-30).map((item) => ({ role: item.role, content: item.content.slice(0, 6000) }));
}
export function resolveWorkspaceCategory(category: string, type: string, prompt: string) {
  const current = category.trim().toLowerCase();
  if (current && current !== "general") return current;
  if (/^website$/i.test(type.trim())) return "website";
  if (type.trim() && !/^general$/i.test(type.trim())) return current;
  const text = prompt.toLowerCase();
  const website = /web\s*sitesi|web\s*site|website|landing\s*page|\bsite(?:si|sini|sinin|yi|nin)?\b/.test(text);
  const request = /\byap\b|\bkur\b|oluştur|olustur|kurmak|kuralım|kuralim|tasarla|hazırla|hazirla|istiyorum|ihtiyac|lazım|lazim|yapalım|yapalim|yapmak|create|build|make|design|want|need/.test(text);
  const rejected = /(?:web\s*sitesi|website|site)\s+(?:istemiyorum|yapma|oluşturma|olusturma)|(?:do not|dont|don.t)\s+(?:build|create|make)\s+(?:a\s+)?(?:website|site)/.test(text);
  const media = /(?:tanıtım|tanitim|reklam|promo|promotional)\s+(?:video|film)|(?:video|trailer|fragman)\s+(?:hazırla|hazirla|oluştur|olustur|üret|uret|istiyorum)/.test(text);
  const directSiteRequest = /(?:web\s*sitesi|website|\bsite(?:si|sini|yi)?)\s+(?:oluştur|olustur|kur|tasarla|hazırla|hazirla|yap)|(?:build|create|design|make)\s+(?:a\s+)?(?:website|site)/.test(text);
  return website && request && !rejected && (!media || directSiteRequest) ? "website" : current;
}
