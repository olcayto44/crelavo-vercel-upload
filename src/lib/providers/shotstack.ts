import { optionalEnv, requireProviderEnv } from "./env";
import type { ProviderJob } from "./types";

function shotstackEndpoint() {
  return optionalEnv("SHOTSTACK_API_URL") || optionalEnv("SHOTSTACK_RENDER_URL") || "https://api.shotstack.io/stage/render";
}

function shotstackKey() {
  return requireProviderEnv("shotstack");
}

export function getShotstackReadiness() {
  const apiKey = shotstackKey();
  return {
    connected: true,
    keyLength: apiKey.length,
    endpoint: shotstackEndpoint(),
    checked: "configuration-only",
    note: "Safe readiness check only. No render job was created. Run a controlled render test only when explicitly approved."
  };
}

export async function createShotstackRender(input: {
  title: string;
  videoUrl?: string;
  audioUrl: string;
  subtitleUrl: string;
  durationSeconds: number;
}): Promise<ProviderJob> {
  const apiKey = shotstackKey();
  const endpoint = shotstackEndpoint();
  const videoAsset = input.videoUrl
    ? { type: "video", src: input.videoUrl }
    : { type: "html", html: `<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#050816;color:white;font-family:Arial;font-size:48px;text-align:center;padding:60px;\">${input.title}</div>`, width: 1080, height: 1920 };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeline: {
        tracks: [
          {
            clips: [{ asset: videoAsset, start: 0, length: input.durationSeconds }]
          },
          {
            clips: [{ asset: { type: "audio", src: input.audioUrl }, start: 0, length: input.durationSeconds }]
          },
          {
            clips: [{ asset: { type: "caption", src: input.subtitleUrl }, start: 0, length: input.durationSeconds }]
          }
        ]
      },
      output: {
        format: "mp4",
        resolution: "hd",
        aspectRatio: "9:16"
      }
    })
  });

  if (!response.ok) throw new Error(`Shotstack render failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "shotstack", id: data.response?.id ?? data.id, status: data.response?.status ?? "queued", raw: data };
}

export async function createShotstackTestRender(): Promise<ProviderJob> {
  const response = await fetch(shotstackEndpoint(), {
    method: "POST",
    headers: {
      "x-api-key": shotstackKey(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "html",
                  html: "<div style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#050816;color:white;font-family:Arial;font-size:42px;'>Crelavo Shotstack Test</div>",
                  width: 1280,
                  height: 720
                },
                start: 0,
                length: 1
              }
            ]
          }
        ]
      },
      output: {
        format: "mp4",
        resolution: "sd",
        aspectRatio: "16:9"
      }
    })
  });

  if (!response.ok) throw new Error(`Shotstack test render failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return { provider: "shotstack", id: data.response?.id ?? data.id, status: data.response?.status ?? "queued", raw: data };
}
