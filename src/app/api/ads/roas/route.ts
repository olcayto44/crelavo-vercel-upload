import { evaluateRoas } from "@/lib/phase2/ads";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adJobId = String(body.ad_job_id ?? "").trim();
    if (!adJobId) return Response.json({ error: "ad_job_id is required." }, { status: 400 });

    const metrics = {
      impressions: Number(body.impressions ?? 0),
      clicks: Number(body.clicks ?? 0),
      spend: Number(body.spend ?? 0),
      conversions: Number(body.conversions ?? 0),
      revenue: Number(body.revenue ?? 0),
      roas: Number(body.roas ?? 0)
    };
    const recommendation = evaluateRoas(metrics);

    const { data, error } = await supabaseAdmin()
      .from("ad_campaign_jobs")
      .update({
        metrics_json: metrics,
        ai_recommendation: recommendation,
        status: recommendation.action === "pause_and_regenerate_hook" ? "needs_attention" : "running",
        updated_at: new Date().toISOString()
      })
      .eq("id", adJobId)
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ ad_job: data, recommendation });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not evaluate ROAS") }, { status: 500 });
  }
}
