import { buildGuardedWorkerPlan, evaluateConnectedAccountReadiness } from "@/lib/connected-account-automation";
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
  if (!job.connected_account_id) return Response.json({ error: "Job has no connected account." }, { status: 400 });

  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("id, user_id, provider, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message")
    .eq("id", job.connected_account_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) return Response.json({ error: accountError.message }, { status: 500 });
  if (!account) return Response.json({ error: "Connected account not found for this job." }, { status: 404 });

  const readiness = evaluateConnectedAccountReadiness(account);
  const workerPlan = buildGuardedWorkerPlan({ provider: job.provider, jobType: job.job_type, finalApproval, readinessStatus: String(readiness.status), hasConnectedAccount: true });
  const currentResult = job.result && typeof job.result === "object" ? job.result as Record<string, any> : {};
  const retryCount = Number(currentResult.retryCount ?? 0) + 1;
  const status = workerPlan.canStartLiveMutation ? "queued" : "approval_required";
  const errorMessage = workerPlan.canStartLiveMutation ? null : `Retry prepared but guarded: readiness=${readiness.status}, finalApproval=${finalApproval}.`;

  const { data: updated, error: updateError } = await supabase
    .from("connected_account_jobs")
    .update({
      status,
      result: {
        ...currentResult,
        retryCount,
        lastRetryAt: new Date().toISOString(),
        readiness,
        workerPlan,
        directApiCallStarted: false,
        note: workerPlan.canStartLiveMutation ? "Retry queued for approval-gated worker plan." : "Retry recorded, but live provider mutation remains guarded."
      },
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, connected_account_id, production_id, provider, job_type, status, approval_required, payload, result, error_message, created_at, updated_at")
    .single();

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ job: updated, readiness, workerPlan });
}
