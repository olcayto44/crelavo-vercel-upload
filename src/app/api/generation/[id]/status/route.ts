import { getGenerationStatus } from "@/lib/generation";
import { customerEmailForProduction, sendProductionCompletionEmail } from "@/lib/production-email";
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
      .select("id, user_id, status, generation_job_id, generation_status, generation_provider, reserved_credits, estimated_credits")
      .eq("id", id)
      .single();

    if (readError) throw readError;

    if (videoRequest.status === "ready" || videoRequest.generation_status === "completed") {
      return Response.json({ request: videoRequest, generation_status: "completed", already_completed: true });
    }

    if (!videoRequest.generation_job_id) {
      return Response.json({ error: "No provider job id found for this request." }, { status: 400 });
    }

    const result = await getGenerationStatus(videoRequest.generation_provider, videoRequest.generation_job_id);

    if (result.status !== "completed") {
      const { data, error: updateError } = await supabase
        .from("video_requests")
        .update({
          generation_status: result.status,
          generation_error: result.error ?? null,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;
      return Response.json({ request: data, generation: result });
    }

    const reservedCredits = videoRequest.reserved_credits ?? videoRequest.estimated_credits ?? 0;
    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", videoRequest.user_id)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;

    const { error: balanceUpdateError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: videoRequest.user_id,
        balance: Math.max(0, balance - reservedCredits),
        reserved: Math.max(0, reserved - reservedCredits),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (balanceUpdateError) throw balanceUpdateError;

    const { error: spendEventError } = await supabase
      .from("credit_events")
      .insert({
        user_id: videoRequest.user_id,
        type: "spend",
        amount: reservedCredits,
        note: `Automatic generation completed for request: ${id}`
      });

    if (spendEventError) throw spendEventError;

    const { data, error: updateError } = await supabase
      .from("video_requests")
      .update({
        generation_status: "completed",
        generation_error: null,
        generation_completed_at: new Date().toISOString(),
        final_video_url: result.videoUrl ?? null,
        status: "ready",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    let completionEmailResult: unknown = { skipped: true, reason: "Video request update did not return a user id." };
    try {
      if (data?.user_id) {
        const customerEmail = await customerEmailForProduction(String(data.user_id));
        completionEmailResult = await sendProductionCompletionEmail({
          to: customerEmail,
          title: `Video request ${String(data.id)}`,
          productionId: String(data.id),
          deliveryUrl: data.final_video_url ?? result.videoUrl ?? null,
          previewUrl: data.final_video_url ?? result.videoUrl ?? null
        });
      }
    } catch (emailError) {
      completionEmailResult = { skipped: true, reason: emailError instanceof Error ? emailError.message : "Could not send video completion email" };
    }

    return Response.json({ request: data, generation: result, completionEmailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh generation status";
    return Response.json({ error: message }, { status: 500 });
  }
}
