import { requireEnv } from "./env";
import type { ProviderJob } from "./types";

export async function createShotstackRender(input: {
  title: string;
  videoUrl?: string;
  audioUrl: string;
  subtitleUrl: string;
  durationSeconds: number;
}): Promise<ProviderJob> {
  const apiKey = requireEnv("SHOTSTACK_API_KEY");
  const endpoint = process.env.SHOTSTACK_API_URL || "https://api.shotstack.io/stage/render";
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
