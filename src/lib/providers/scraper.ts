import type { ProductSnapshot } from "./types";

function meta(content: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function textFromHtml(html: string) {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim())
    .slice(0, 6000);
}

export async function scrapeProduct(url: string): Promise<ProductSnapshot> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CrelavoBot/1.0 (+https://crelavo.com)",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) throw new Error(`Product page could not be fetched: ${response.status}`);

  const html = await response.text();
  const title = meta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "Product";
  const description = meta(html, "og:description") || meta(html, "description") || textFromHtml(html).slice(0, 700);
  const price = meta(html, "product:price:amount") || meta(html, "og:price:amount") || "";
  const imageUrls = Array.from(new Set([
    meta(html, "og:image"),
    meta(html, "twitter:image")
  ].filter(Boolean)));

  return {
    url,
    title: decodeHtml(title),
    description: decodeHtml(description),
    price,
    imageUrls,
    rawText: textFromHtml(html)
  };
}
