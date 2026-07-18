import type { BulkGenerationItem } from "./types";

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function parseCsvProducts(csv: string): BulkGenerationItem[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const productUrlIndex = Math.max(header.indexOf("product_url"), header.indexOf("url"), header.indexOf("link"));
  const titleIndex = header.indexOf("title");
  const startIndex = productUrlIndex >= 0 ? 1 : 0;

  return lines.slice(startIndex).map((line, index) => {
    const cells = line.split(",").map((item) => item.trim());
    const productUrl = productUrlIndex >= 0 ? cells[productUrlIndex] : cells[0];
    const title = titleIndex >= 0 ? cells[titleIndex] : undefined;
    return {
      index,
      productUrl,
      title,
      status: validUrl(productUrl) ? "queued" : "failed",
      error: validUrl(productUrl) ? undefined : "Invalid or missing product URL"
    };
  });
}

export function bulkSummary(items: BulkGenerationItem[]) {
  const valid = items.filter((item) => item.status !== "failed").length;
  const failed = items.length - valid;
  return {
    total: items.length,
    valid,
    failed,
    concurrency: Number(process.env.BULK_GENERATION_CONCURRENCY ?? 5),
    readyToQueue: valid > 0
  };
}
