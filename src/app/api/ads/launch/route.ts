import { launchAd } from "@/lib/phase2/ads";
import type { AdPlatform } from "@/lib/phase2/types";
import { supabaseAdmin } from "@/lib/supabase";

const supportedPlatforms: AdPlatform[] = ["meta", "instagram", "tiktok", "youtube", "linkedin", "x"];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const productionId = String(body.production_id ?? "").trim();
    const platform = String(body.platform ?? "").trim() as AdPlatform;
    const videoUrl = String(body.video_url ?? "").trim();

    if (!userId || !videoUrl) return Response.json({ error: "user_id and video_url are required." }, { status: 400 });
    if (!supportedPlatforms.includes(platform)) return Response.json({ error: "platform must be one of: meta, instagram, tiktok, youtube, linkedin, x." }, { status: 400 });

    const result = await launchAd({
      userId,
      productionId,
      platform,
      campaignName: String(body.campaign_name ?? "Crelavo AI Ad"),
      dailyBudget: Number(body.daily_budget ?? 20),
      audienceMode: ["broad", "niche", "retargeting"].includes(String(body.audience_mode)) ? body.audience_mode : "broad",
      adText: String(body.ad_text ?? "Shop now"),
      videoUrl
    });

    const { data, error } = await supabaseAdmin()
      .from("ad_campaign_jobs")
      .insert({
        user_id: userId,
        production_id: productionId || null,
        platform,
        campaign_name: String(body.campaign_name ?? "Crelavo AI Ad"),
        daily_budget: Number(body.daily_budget ?? 20),
        audience_mode: String(body.audience_mode ?? "broad"),
        status: "queued",
        launch_payload: result
      })
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ ad_job: data, provider: result });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not launch ad") }, { status: 500 });
  }
}
