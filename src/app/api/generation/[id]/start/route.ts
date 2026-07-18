import { startGeneration } from "@/lib/generation";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ generation_status: "queued", mode: "mock" });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: videoRequest, error: readError } = await supabase
      .from("video_requests")
      .select("id, user_id, title, prompt, video_type, target_platform, style, duration, extra_notes, preview_image_url, premium_material_type, premium_material_option, generation_job_id, status, estimated_credits, reserved_credits")
      .eq("id", id)
      .single();

    if (readError) throw readError;

    if (["ready", "failed", "cancelled"].includes(videoRequest.status)) {
      return Response.json({ error: "Closed requests cannot start generation." }, { status: 400 });
    }

    const reservedCredits = Number(videoRequest.reserved_credits ?? 0) || 0;
    const estimatedCredits = Number(videoRequest.estimated_credits ?? 0) || 0;
    if (reservedCredits <= 0 || (estimatedCredits > 0 && reservedCredits < estimatedCredits)) {
      return Response.json({
        error: "Generation cannot start before credits are reserved or payment eligibility is confirmed.",
        redirect: "/dashboard/credits",
        requiredCredits: estimatedCredits,
        reservedCredits
      }, { status: 402 });
    }

    if (videoRequest.generation_job_id) {
      return Response.json({ generation_status: "queued", generation_job_id: videoRequest.generation_job_id });
    }

    const result = await startGeneration(videoRequest);
    const nextStatus = result.status === "failed" ? "failed" : "queued";

    const { data, error: updateError } = await supabase
      .from("video_requests")
      .update({
        generation_status: nextStatus,
        generation_provider: result.provider,
        generation_job_id: result.jobId,
        generation_error: result.error ?? null,
        generation_started_at: new Date().toISOString(),
        status: result.status === "failed" ? "failed" : "in_production",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return Response.json({ request: data, generation: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start generation";
    return Response.json({ error: message }, { status: 500 });
  }
}
