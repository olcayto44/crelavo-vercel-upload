import { runConnectedAccountWorkerPlan } from "@/lib/connected-account-worker";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  const finalApproval = body.final_user_approval === true || body.finalUserApproval === true;
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const supabase = supabaseAdmin();
  const { data: job, error: jobError } = await supabase
    .from("connected_account_jobs")
    .select("id, user_id, connected_account_id, production_id, provider, job_type, status, approval_required, payload, result, error_message, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError) return Response.json({ error: jobError.message }, { status: 500 });
  if (!job) return Response.json({ error: "Connected account job not found." }, { status: 404 });
  if (!job.connected_account_id) return Response.json({ error: "Job has no connected_account_id." }, { status: 400 });
  if (job.approval_required && !finalApproval) return Response.json({ error: "final_user_approval=true is required before running this worker plan." }, { status: 400 });

  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("id, user_id, provider, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message")
    .eq("id", job.connected_account_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) return Response.json({ error: accountError.message }, { status: 500 });
  if (!account) return Response.json({ error: "Connected account not found for this job." }, { status: 404 });
  if (account.provider !== job.provider) return Response.json({ error: "Connected account provider does not match job provider." }, { status: 400 });

  const workerResult = runConnectedAccountWorkerPlan({ account, job, finalApproval });
  const nextStatus = workerResult.canAttemptProviderCall ? "queued" : "approval_required";
  const nextError = workerResult.canAttemptProviderCall ? null : workerResult.providerResponse.message;
  const mergedResult = { ...(job.result && typeof job.result === "object" ? job.result : {}), workerRun: workerResult };

  const { data: updated, error: updateError } = await supabase
    .from("connected_account_jobs")
    .update({
      status: nextStatus,
      result: mergedResult,
      error_message: nextError,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, connected_account_id, production_id, provider, job_type, status, approval_required, payload, result, error_message, created_at, updated_at")
    .single();

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ job: updated, workerResult });
}
