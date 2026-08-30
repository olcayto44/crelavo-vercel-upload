import { Jimp, loadFont } from "jimp";
import { SANS_32_BLACK, SANS_64_BLACK } from "jimp/fonts";
import { uploadProviderAsset } from "@/lib/providers/storage";

export type ImageMarketingText = { headline?: string; supportingText?: string; cta?: string };

function cleanLine(value: string) {
  return value.replace(/^[-–—\s]+/, "").replace(/[\s.;]+$/, "").trim();
}

export function parseImageMarketingText(prompt: string): ImageMarketingText {
  const normalized = prompt.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  const headline = normalized.match(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const supportingText = normalized.match(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const cta = normalized.match(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  return { headline: headline ? cleanLine(headline) : undefined, supportingText: supportingText ? cleanLine(supportingText) : undefined, cta: cta ? cleanLine(cta) : undefined };
}

export function hasImageMarketingText(prompt: string) {
  const text = parseImageMarketingText(prompt);
  return Boolean(text.headline || text.supportingText || text.cta);
}

export function stripImageMarketingTextInstructions(prompt: string) {
  let next = prompt;
  next = next.replace(/Add the following on-image[^:]*:\s*/i, "Do not render any text, letters, logo text, label copy, headline, caption, CTA or typography inside the generated image. Leave clean visual space for later design text overlay. ");
  next = next.replace(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  return `${next}\n\nImportant: generate a clean premium banner background only. No readable or pseudo-readable text, no logo, no portrait, no profile photo, no device mockups, no browser interface, no dashboard, no buttons and no watermark. Leave the center-right area clear for deterministic typography added later.`.trim();
}

export function imageTargetDimensions(aspectRatio: string) {
  if (/^1584x396$/i.test(aspectRatio.trim())) return { width: 1584, height: 396 };
  if (aspectRatio === "1:1") return { width: 1200, height: 1200 };
  if (aspectRatio === "16:9") return { width: 1600, height: 900 };
  if (aspectRatio === "9:16") return { width: 1200, height: 2133 };
  return { width: 1200, height: 1500 };
}

export async function normalizeImageCanvas(input: { productionId: string; sourceUrl: string; filenameBase: string; aspectRatio: string }) {
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image canvas source download failed: ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const target = imageTargetDimensions(input.aspectRatio);
  const image = await Jimp.read(source);
  image.cover({ w: target.width, h: target.height });
  const output = await image.getBuffer("image/png");
  if (image.width !== target.width || image.height !== target.height) throw new Error(`unsupported_aspect_ratio: final image dimensions ${image.width}x${image.height} do not match ${target.width}x${target.height}.`);
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, output, "image/png");
  return { imageUrl, width: target.width, height: target.height };
}

export async function applyMarketingTextOverlay(input: { productionId: string; sourceUrl: string; prompt: string; aspectRatio?: string }) {
  const marketingText = parseImageMarketingText(input.prompt);
  if (!marketingText.headline && !marketingText.supportingText && !marketingText.cta) return { imageUrl: input.sourceUrl, applied: false as const, marketingText, width: undefined, height: undefined };
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image overlay source download failed: ${response.status}`);
  const image = await Jimp.read(Buffer.from(await response.arrayBuffer()));
  const target = imageTargetDimensions(input.aspectRatio || "4:5");
  image.cover({ w: target.width, h: target.height });
  const x = Math.round(target.width * 0.43);
  const maxWidth = Math.round(target.width * 0.53);
  const headlineFont = await loadFont(SANS_64_BLACK);
  const supportingFont = await loadFont(SANS_32_BLACK);
  image.print({ font: headlineFont, x, y: Math.round(target.height * 0.22), text: marketingText.headline ?? "", maxWidth, maxHeight: Math.round(target.height * 0.3) });
  image.print({ font: supportingFont, x, y: Math.round(target.height * 0.62), text: marketingText.supportingText ?? "", maxWidth, maxHeight: Math.round(target.height * 0.2) });
  const output = await image.getBuffer("image/png");
  const imageUrl = await uploadProviderAsset(`${input.productionId}/final-image-text-overlay.png`, output, "image/png");
  return { imageUrl, applied: true as const, marketingText, width: target.width, height: target.height };
}
