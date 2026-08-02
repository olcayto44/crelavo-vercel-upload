import { optionalEnv } from "./env";
import { uploadProviderAsset } from "./storage";

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function browserlessEndpoint() {
  const explicit = optionalEnv("BROWSERLESS_SCREENSHOT_URL") || optionalEnv("BROWSERLESS_URL");
  if (explicit) return explicit;
  const region = optionalEnv("BROWSERLESS_REGION") || "production-sfo";
  return `https://${region}.browserless.io/screenshot`;
}

export async function captureWebsiteScreenshot(input: { productionId: string; url: string }) {
  const url = sanitizeUrl(input.url);
  if (!url) return null;

  const token = optionalEnv("BROWSERLESS_API_KEY") || optionalEnv("BROWSERLESS_TOKEN");
  if (!token) return null;

  const endpoint = new URL(browserlessEndpoint());
  if (!endpoint.searchParams.has("token")) endpoint.searchParams.set("token", token);

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      options: {
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 1800 }
      },
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000
      },
      viewport: {
        width: 1440,
        height: 1800,
        deviceScaleFactor: 1
      }
    })
  });

  if (!response.ok) throw new Error(`Website screenshot failed: ${response.status} ${await response.text()}`);
  const bytes = await response.arrayBuffer();
  return uploadProviderAsset(`${input.productionId}/source-website-screenshot.png`, bytes, "image/png");
}
