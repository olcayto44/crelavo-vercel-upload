const cache = new Map<string, { country: string; expiresAt: number }>();

function usable(value: unknown) {
  const text = String(value ?? "").trim();
  return text && !/^(unknown|bilinmiyor|null|undefined|-)$/i.test(text) ? text : "";
}

function isPublicIp(ip: string) {
  return Boolean(ip) && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1" && !/^10\./.test(ip) && !/^192\.168\./.test(ip) && !/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

export async function resolveCountry(ip: string, headerValue?: string | null) {
  const header = usable(headerValue);
  if (header) return header.toUpperCase();
  if (!isPublicIp(ip)) return "Unknown";

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.country;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: controller.signal, cache: "no-store" });
    const data = await response.json().catch(() => ({})) as { success?: boolean; country_code?: string; country?: string };
    const country = usable(data.country_code) || usable(data.country);
    const result = country || "Unknown";
    cache.set(ip, { country: result, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
    return result;
  } catch {
    return "Unknown";
  } finally {
    clearTimeout(timer);
  }
}