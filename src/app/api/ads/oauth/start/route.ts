import { adOAuthUrl } from "@/lib/phase2/ads";
import type { AdPlatform } from "@/lib/phase2/types";
import { ProviderConfigError } from "@/lib/providers/types";

const supportedPlatforms: AdPlatform[] = ["meta", "instagram", "tiktok", "youtube", "linkedin", "x"];

export async function POST(request: Request) {
  const body = await request.json();
  const platform = String(body.platform ?? "").trim();
  const userId = String(body.user_id ?? "").trim();

  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  if (!supportedPlatforms.includes(platform as AdPlatform)) return Response.json({ error: "platform must be one of: meta, instagram, tiktok, youtube, linkedin, x." }, { status: 400 });

  try {
    const state = Buffer.from(JSON.stringify({ userId, platform, at: Date.now() })).toString("base64url");
    const url = adOAuthUrl(platform as AdPlatform, state);
    return Response.json({ url, state });
  } catch (error) {
    if (error instanceof ProviderConfigError) {
      return Response.json({ error: error.message, requiredEnv: error.message.replace("Missing provider environment variable: ", "") }, { status: 500 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "OAuth could not be started." }, { status: 500 });
  }
}
