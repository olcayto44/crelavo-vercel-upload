export type BrandConfig = { logoUrl: string; alt: string; fit: "cover" | "contain" };
export const defaultBrandConfig: BrandConfig = { logoUrl: "/crelavo-brand-approved.png", alt: "Crelavo", fit: "cover" };
export const BRAND_CONFIG_KEY = "site_branding";
export function validateBrandConfig(input: unknown): BrandConfig {
  if (!input || typeof input !== "object") throw new Error("Geçersiz logo ayarları.");
  const value = input as Record<string, unknown>;
  const logoUrl = typeof value.logoUrl === "string" ? value.logoUrl.trim() : "";
  const alt = typeof value.alt === "string" ? value.alt.trim() : "Crelavo";
  if (!alt || alt.length > 100 || /[\x00-\x1f]/.test(alt)) throw new Error("Logo açıklaması 1–100 karakter olmalı.");
  if (value.fit !== "cover" && value.fit !== "contain") throw new Error("Görsel yerleşimi geçersiz.");
  if (logoUrl.startsWith("data:")) {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(logoUrl);
    if (!match || match[2].length > 700000) throw new Error("PNG, JPG veya WebP seçin; en fazla 512 KB.");
    const data = atob(match[2]);
    if (data.length > 512 * 1024) throw new Error("Logo en fazla 512 KB olabilir.");
    const valid = match[1] === "png" ? data.startsWith("\x89PNG\r\n\x1a\n") : match[1] === "jpeg" ? data.startsWith("\xff\xd8\xff") : data.startsWith("RIFF") && data.slice(8,12) === "WEBP";
    if (!valid) throw new Error("Logo dosyasının gerçek biçimi uyuşmuyor.");
  } else {
    if (!logoUrl || logoUrl.length > 2048 || /[\\<>"'\x00-\x20]/.test(logoUrl)) throw new Error("Logo adresi geçersiz.");
    if (logoUrl.startsWith("/")) {
      if (logoUrl.startsWith("//") || logoUrl.split("/").includes("..")) throw new Error("Güvenli bir yerel dosya yolu girin.");
    } else {
      const url = new URL(logoUrl);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("Dış logo adresi HTTPS olmalı.");
    }
  }
  return { logoUrl, alt, fit: value.fit };
}
