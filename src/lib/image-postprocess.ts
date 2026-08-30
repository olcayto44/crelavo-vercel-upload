import { Jimp } from "jimp";
import { uploadProviderAsset } from "@/lib/providers/storage";

export type ImageMarketingText = { headline?: string; supportingText?: string; cta?: string };

function cleanLine(value: string) { return value.replace(/^[-–—\s]+/, "").replace(/[\s.;]+$/, "").trim(); }

export function parseImageMarketingText(prompt: string): ImageMarketingText {
  const normalized = prompt.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  const headline = normalized.match(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const supportingText = normalized.match(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  const cta = normalized.match(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/i)?.[1];
  return { headline: headline ? cleanLine(headline) : undefined, supportingText: supportingText ? cleanLine(supportingText) : undefined, cta: cta ? cleanLine(cta) : undefined };
}

export function hasImageMarketingText(prompt: string) { const text = parseImageMarketingText(prompt); return Boolean(text.headline || text.supportingText || text.cta); }

export function stripImageMarketingTextInstructions(prompt: string) {
  let next = prompt;
  next = next.replace(/Add the following on-image[^:]*:\s*/i, "");
  next = next.replace(/Headline\s*:\s*(.*?)(?=\s*Supporting\s+text\s*:|\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/Supporting\s+text\s*:\s*(.*?)(?=\s*CTA\s*:|\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  next = next.replace(/CTA\s*:\s*(.*?)(?=\s*Style\s*:|\s*Format\s*:|\s*Output\s*:|$)/gi, "");
  return `${next}\n\nGenerate a clean premium banner background only. No readable text, letters, logo, portrait, profile photo, device mockup, browser window, dashboard, button, LinkedIn interface or watermark. Keep the left third calm and leave the center-right area clear for deterministic typography.`.trim();
}

export function imageTargetDimensions(aspectRatio: string) {
  if (/^1584x396$/i.test(aspectRatio.trim())) return { width: 1584, height: 396 };
  if (aspectRatio === "1:1") return { width: 1200, height: 1200 };
  if (aspectRatio === "16:9") return { width: 1600, height: 900 };
  if (aspectRatio === "9:16") return { width: 1200, height: 2133 };
  return { width: 1200, height: 1500 };
}

export async function createDeterministicLinkedInBanner(input: { productionId: string; filenameBase: string; prompt: string }) {
  const image = new Jimp({ width: 1584, height: 396, color: 0x0b1424ff });
  const drawRect = (x: number, y: number, w: number, h: number, color: number) => {
    for (let py = Math.max(0, y); py < Math.min(396, y + h); py += 1) for (let px = Math.max(0, x); px < Math.min(1584, x + w); px += 1) image.setPixelColor(color, px, py);
  };
  drawRect(520, 0, 1064, 396, 0x112b43ff);
  drawRect(1010, 0, 574, 396, 0x164a68ff);
  drawRect(700, 38, 720, 320, 0x153149ff);
  drawRect(735, 68, 520, 4, 0x41b6cfff);
  drawRect(735, 302, 590, 3, 0x2d6d89ff);
  drawRect(1280, 0, 4, 396, 0x57d2d4ff);
  drawRect(620, 0, 2, 396, 0x24516bff);
  drawRect(1340, 55, 180, 180, 0x1c6682ff);
  drawRect(1390, 105, 80, 80, 0x57d2d4ff);
  const output = await image.getBuffer("image/png");
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, output, "image/png");
  return { imageUrl, width: 1584, height: 396, provider: "deterministic_banner" as const, model: "jimp", aspectRatio: "1584x396", raw: { generated: false, deterministic: true }, fallback: false as const, fallbackReason: undefined };
}

export async function normalizeImageCanvas(input: { productionId: string; sourceUrl: string; filenameBase: string; aspectRatio: string }) {
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image canvas source download failed: ${response.status}`);
  const image = await Jimp.read(Buffer.from(await response.arrayBuffer()));
  const target = imageTargetDimensions(input.aspectRatio);
  image.cover({ w: target.width, h: target.height });
  const output = await image.getBuffer("image/png");
  if (image.width !== target.width || image.height !== target.height) throw new Error(`unsupported_aspect_ratio: final image dimensions ${image.width}x${image.height} do not match ${target.width}x${target.height}.`);
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, output, "image/png");
  return { imageUrl, width: target.width, height: target.height };
}

const GLYPHS: Record<string, string[]> = {
  A:["01110","10001","10001","11111","10001","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"],C:["01111","10000","10000","10000","10000","10000","01111"],D:["11110","10001","10001","10001","10001","10001","11110"],E:["11111","10000","10000","11110","10000","10000","11111"],F:["11111","10000","10000","11110","10000","10000","10000"],G:["01111","10000","10000","10111","10001","10001","01111"],H:["10001","10001","10001","11111","10001","10001","10001"],I:["11111","00100","00100","00100","00100","00100","11111"],J:["00111","00010","00010","00010","10010","10010","01100"],K:["10001","10010","10100","11000","10100","10010","10001"],L:["10000","10000","10000","10000","10000","10000","11111"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],P:["11110","10001","10001","11110","10000","10000","10000"],Q:["01110","10001","10001","10001","10101","10010","01101"],R:["11110","10001","10001","11110","10100","10010","10001"],S:["01111","10000","10000","01110","00001","00001","11110"],T:["11111","00100","00100","00100","00100","00100","00100"],U:["10001","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],W:["10001","10001","10001","10101","10101","11011","10001"],X:["10001","10001","01010","00100","01010","10001","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"],Z:["11111","00001","00010","00100","01000","10000","11111"],"0":["01110","10001","10011","10101","11001","10001","01110"],"1":["00100","01100","00100","00100","00100","00100","01110"],"2":["01110","10001","00001","00010","00100","01000","11111"],"3":["11110","00001","00001","01110","00001","00001","11110"],"4":["00010","00110","01010","10010","11111","00010","00010"],"5":["11111","10000","10000","11110","00001","00001","11110"],"6":["01110","10000","10000","11110","10001","10001","01110"],"7":["11111","00001","00010","00100","01000","01000","01000"],"8":["01110","10001","10001","01110","10001","10001","01110"],"9":["01110","10001","10001","01111","00001","00001","01110"],"-":["00000","00000","00000","11111","00000","00000","00000"],".":["00000","00000","00000","00000","00000","00000","00100"]};

function printBitmap(image: any, text: string, x: number, y: number, scale: number, color = 0xffffffff) {
  let cursor = x;
  for (const raw of text.toUpperCase()) {
    if (raw === " ") { cursor += 4 * scale; continue; }
    const glyph = GLYPHS[raw] || GLYPHS["."];
    glyph.forEach((row, rowIndex) => [...row].forEach((pixel, colIndex) => { if (pixel === "1") for (let sy=0; sy<scale; sy++) for (let sx=0; sx<scale; sx++) image.setPixelColor(color, cursor + colIndex*scale + sx, y + rowIndex*scale + sy); }));
    cursor += 6 * scale;
  }
}

export async function createDeterministicBrandLogo(input: { productionId: string; filenameBase: string }) {
  const image = new Jimp({ width: 400, height: 400, color: 0x0b1424ff });
  for (let y = 65; y < 335; y += 1) for (let x = 65; x < 335; x += 1) {
    const edge = Math.min(x - 65, y - 65, 334 - x, 334 - y);
    if (edge < 5) image.setPixelColor(0x57d2d4ff, x, y);
  }
  printBitmap(image, "Crelavo", 92, 184, 3, 0xffffffff);
  const output = await image.getBuffer("image/png");
  const imageUrl = await uploadProviderAsset(`${input.productionId}/${input.filenameBase}.png`, output, "image/png");
  return { imageUrl, width: 400, height: 400, provider: "deterministic_brand_logo" as const, model: "jimp", aspectRatio: "1:1", raw: { generated: false, deterministic: true }, fallback: false as const, fallbackReason: undefined };
}

export async function applyMarketingTextOverlay(input: { productionId: string; sourceUrl: string; prompt: string; aspectRatio?: string }) {
  const marketingText = parseImageMarketingText(input.prompt);
  if (!marketingText.headline && !marketingText.supportingText && !marketingText.cta) return { imageUrl: input.sourceUrl, applied: false as const, marketingText, width: undefined, height: undefined };
  const response = await fetch(input.sourceUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Image overlay source download failed: ${response.status}`);
  const image = await Jimp.read(Buffer.from(await response.arrayBuffer()));
  const target = imageTargetDimensions(input.aspectRatio || "4:5");
  image.cover({ w: target.width, h: target.height });
  printBitmap(image, "Crelavo", 80, 45, 3);
  printBitmap(image, marketingText.headline ?? "", 680, 90, 4);
  printBitmap(image, marketingText.supportingText ?? "", 680, 285, 2, 0x9fe3efff);
  const output = await image.getBuffer("image/png");
  const imageUrl = await uploadProviderAsset(`${input.productionId}/final-image-text-overlay.png`, output, "image/png");
  return { imageUrl, applied: true as const, marketingText, width: target.width, height: target.height };
}
