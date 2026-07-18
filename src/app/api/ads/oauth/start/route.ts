import { adOAuthUrl } from "@/lib/phase2/ads";
import type { AdPlatform } from "@/lib/phase2/types";

const supportedPlatforms: AdPlatform[] = ["meta", "instagram", "tiktok", "youtube", "linkedin", "x"];

export async function POST(request: Request) {
  const body = await request.json();
  const platform = String(body.platform ?? "").trim();
  const userId = String(body.user_id ?? "").trim();

  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  if (!supportedPlatforms.includes(platform as AdPlatform)) return Response.json({ error: "platform must be one of: meta, instagram, tiktok, youtube, linkedin, x." }, { status: 400 });

  const state = Buffer.from(JSON.stringify({ userId, platform, at: Date.now() })).toString("base64url");
  const url = adOAuthUrl(platform as AdPlatform, state);
  return Response.json({ url, state });
}
