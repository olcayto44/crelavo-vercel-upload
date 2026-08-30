import { uploadProviderAsset } from "@/lib/providers/storage";

export type ImageMarketingText = {
  headline?: string;
  supportingText?: string;
  cta?: string;
};

function cleanLine(value: string) {
  return value.replace(/^[-–—\s]+/, "").replace(/[\s.;]+$/, "").trim();
}

export function parseImageMarketingText(prompt: string): ImageMarketingText {
  const normalized = prompt.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  const headline = normalized.match(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const supportingText = normalized.match(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const cta = normalized.match(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  return {
    headline: headline ? cleanLine(headline) : undefined,
    supportingText: supportingText ? cleanLine(supportingText) : undefined,
    cta: cta ? cleanLine(cta) : undefined
  };
}

export function hasImageMarketingText(prompt: string) {
  const text = parseImageMarketingText(prompt);
  return Boolean(text.headline || text.supportingText || text.cta);
}

export function stripImageMarketingTextInstructions(prompt: string) {
  let next = prompt;
  next = next.replace(/Add the following on-image[^:]*:\s*/i, "Do not render any text, letters, logo text, label copy, headline, caption, CTA or typography inside the generated image. Leave clean visual space for later design text overlay. ");
  next = next.replace(/white\s+label\s+packaging/gi, "unlabeled smooth amber glass packaging");
  next = next.replace(/label\s+packaging/gi, "unlabeled packaging");
  next = next.replace(/white\s+label/gi, "plain unlabeled glass");
  next = next.replace(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  return `${next}\n\nImportant: generate a clean premium product beauty visual only. The bottle must be plain unlabeled smooth amber glass with no sticker, no label, no brand text, no logo, no letters and no markings on the bottle. Do not draw readable or pseudo-readable text anywhere. No gibberish text on product label or background. Text will be added later by Crelavo with real fonts.`.trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function imageTargetDimensions(aspectRatio: string) {
  if (/^1584x396$/i.test(aspectRatio.trim())) return { width: 1584, height: 396 };
  if (aspectRatio === "1:1") return { width: 1200, height: 1200 };
  if (aspectRatio === "16:9") return { width: 1600, height: 900 };
  if (aspectRatio === "9:16") return { width: 1200, height: 2133 };
  return { width: 1200, height: 1500 };
}

export async function normalizeImageCanvas(input: { productionId: string; sourceUrl: string; filenameBase: string; aspectRatio: string }) {
  let sharp: any;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    throw new Error("unsupported_aspect_ratio: deterministic image canvas postprocess is unavailable.");
  }
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image canvas source download failed: ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const target = imageTargetDimensions(input.aspectRatio);
  const output = await sharp(source).rotate().resize({ width: target.width, height: target.height, fit: "cover", position: "centre" }).toColourspace("srgb").png({ palette: false, compressionLevel: 6 }).toBuffer();
  const metadata = await sharp(output).metadata();
  if (metadata.width !== target.width || metadata.height !== target.height) throw new Error(`unsupported_aspect_ratio: final image dimensions ${metadata.width ?? 0}x${metadata.height ?? 0} do not match ${target.width}x${target.height}.`);
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, output, "image/png");
  return { imageUrl, width: target.width, height: target.height };
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export async function applyMarketingTextOverlay(input: { productionId: string; sourceUrl: string; prompt: string; aspectRatio?: string }) {
  const marketingText = parseImageMarketingText(input.prompt);
  if (!marketingText.headline && !marketingText.supportingText && !marketingText.cta) {
    return { imageUrl: input.sourceUrl, applied: false as const, marketingText, width: undefined, height: undefined };
  }

  let sharp: any;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return { imageUrl: input.sourceUrl, applied: false as const, marketingText, width: undefined, height: undefined };
  }
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image overlay source download failed: ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const requestedRatio = input.aspectRatio || "4:5";
  const target = imageTargetDimensions(requestedRatio);
  const base = sharp(source).rotate().resize({ width: target.width, height: target.height, fit: "cover", position: "centre" });
  const width = target.width;
  const height = target.height;

  const safeHeadline = marketingText.headline ? escapeXml(marketingText.headline) : "";
  const supportingLines = marketingText.supportingText ? wrapText(marketingText.supportingText, width < 900 ? 34 : 44).map(escapeXml) : [];
  const safeCta = marketingText.cta ? escapeXml(marketingText.cta) : "";

  const padX = Math.round(width * 0.07);
  const bottomPad = Math.round(height * 0.065);
  const panelWidth = Math.round(width * 0.86);
  const panelX = Math.round((width - panelWidth) / 2);
  const headlineSize = Math.max(42, Math.round(width * 0.066));
  const supportSize = Math.max(24, Math.round(width * 0.033));
  const ctaSize = Math.max(24, Math.round(width * 0.033));
  const lineGap = Math.round(supportSize * 1.38);
  const supportHeight = supportingLines.length * lineGap;
  const ctaHeight = safeCta ? Math.round(ctaSize * 2.15) : 0;
  const panelHeight = Math.round(headlineSize * 1.35 + supportHeight + ctaHeight + height * 0.065);
  const panelY = Math.max(Math.round(height * 0.56), height - bottomPad - panelHeight);
  const textX = panelX + padX;
  const headlineY = panelY + Math.round(panelHeight * 0.25);
  const supportStartY = headlineY + Math.round(headlineSize * 0.85);
  const ctaY = panelY + panelHeight - Math.round(ctaSize * 1.65);
  const ctaW = safeCta ? Math.min(Math.round(width * 0.36), Math.max(Math.round(width * 0.22), safeCta.length * Math.round(ctaSize * 0.62) + Math.round(width * 0.08))) : 0;
  const ctaH = Math.round(ctaSize * 1.75);

  const supportingSvg = supportingLines.map((line, index) => `<text x="${textX}" y="${supportStartY + index * lineGap}" font-size="${supportSize}" font-weight="500" fill="#5d5146" font-family="Arial, Helvetica, sans-serif">${line}</text>`).join("\n");
  const ctaSvg = safeCta ? `
    <rect x="${textX}" y="${ctaY - Math.round(ctaH * 0.72)}" width="${ctaW}" height="${ctaH}" rx="${Math.round(ctaH / 2)}" fill="#2f2a24"/>
    <text x="${textX + Math.round(ctaW / 2)}" y="${ctaY + Math.round(ctaSize * 0.12)}" text-anchor="middle" font-size="${ctaSize}" font-weight="700" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${safeCta}</text>
  ` : "";

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.18"/>
      </filter>
    </defs>
    <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${Math.round(width * 0.045)}" fill="rgba(255,255,255,0.86)" filter="url(#softShadow)"/>
    <text x="${textX}" y="${headlineY}" font-size="${headlineSize}" font-weight="800" fill="#2f2a24" font-family="Arial, Helvetica, sans-serif">${safeHeadline}</text>
    ${supportingSvg}
    ${ctaSvg}
  </svg>`;

  const output = await base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toColourspace("srgb")
    .png({ palette: false, compressionLevel: 6, adaptiveFiltering: true })
    .toBuffer();

  const imageUrl = await uploadProviderAsset(`${input.productionId}/final-image-text-overlay.png`, output, "image/png");
  return { imageUrl, applied: true as const, marketingText, width, height };
}
