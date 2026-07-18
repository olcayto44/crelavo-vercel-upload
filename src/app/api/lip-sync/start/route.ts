import { startLipSyncTranslation } from "@/lib/phase2/lip-sync";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const sourceVideoUrl = String(body.source_video_url ?? "").trim();
    const provider = String(body.provider ?? "heygen") as "heygen" | "elevenlabs";

    if (!userId || !sourceVideoUrl) return Response.json({ error: "user_id and source_video_url are required." }, { status: 400 });
    if (!["heygen", "elevenlabs"].includes(provider)) return Response.json({ error: "provider must be heygen or elevenlabs." }, { status: 400 });

    const job = await startLipSyncTranslation({
      userId,
      productionId: String(body.production_id ?? "") || undefined,
      sourceVideoUrl,
      sourceLanguage: String(body.source_language ?? "tr"),
      targetLanguage: String(body.target_language ?? "en"),
      provider
    });

    const { data, error } = await supabaseAdmin()
      .from("lip_sync_jobs")
      .insert({
        user_id: userId,
        production_id: String(body.production_id ?? "") || null,
        provider,
        source_video_url: sourceVideoUrl,
        source_language: String(body.source_language ?? "tr"),
        target_language: String(body.target_language ?? "en"),
        status: job.status,
        provider_job_id: job.id,
        metadata: job
      })
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ lip_sync_job: data, provider_job: job });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not start lip-sync translation") }, { status: 500 });
  }
}
