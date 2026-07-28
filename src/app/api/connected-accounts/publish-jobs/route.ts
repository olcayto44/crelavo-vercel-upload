import { buildGuardedWorkerPlan } from "@/lib/connected-account-automation";
import { connectedAccountGuardrails, normalizeConnectedProvider } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

const jobTypes = ["export_ready", "draft_upload", "one_click_publish", "store_upload"] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const provider = normalizeConnectedProvider(body.provider);
  if (!provider) return Response.json({ error: "provider must be one of: tiktok, youtube, instagram, meta, shopify, woocommerce." }, { status: 400 });

  const jobType = clean(body.job_type ?? body.jobType) as typeof jobTypes[number];
  if (!jobTypes.includes(jobType)) return Response.json({ error: "job_type must be export_ready, draft_upload, one_click_publish or store_upload." }, { status: 400 });

  const finalApproval = body.final_user_approval === true || body.finalUserApproval === true;
  const connectedAccountId = clean(body.connected_account_id ?? body.connectedAccountId) || null;

  if ((jobType === "draft_upload" || jobType === "store_upload" || jobType === "one_click_publish") && !connectedAccountId) {
    return Response.json({ error: "connected_account_id is required for draft upload, store upload or publish." }, { status: 400 });
  }

  let status: "approval_required" | "blocked" | "queued" = "approval_required";
  let errorMessage: string | null = null;

  if (jobType === "one_click_publish" && !finalApproval) {
    status = "blocked";
    errorMessage = "One-click publish requires explicit final_user_approval=true.";
  } else if (jobType !== "export_ready" && finalApproval) {
    status = "queued";
  }

  const workerPlan = buildGuardedWorkerPlan({ provider, jobType, finalApproval });

  const { data, error } = await supabaseAdmin()
    .from("connected_account_jobs")
    .insert({
      user_id: userId,
      connected_account_id: connectedAccountId,
      production_id: clean(body.production_id ?? body.productionId) || null,
      provider,
      job_type: jobType,
      status,
      approval_required: jobType !== "export_ready",
      payload: {
        title: clean(body.title),
        mediaUrl: clean(body.media_url ?? body.mediaUrl),
        caption: clean(body.caption),
        hashtags: Array.isArray(body.hashtags) ? body.hashtags.map(clean).filter(Boolean) : [],
        productId: clean(body.product_id ?? body.productId),
        target: clean(body.target),
        finalUserApproval: finalApproval,
        policy: "No social publish or store mutation without explicit user approval."
      },
      result: {
        directApiCallStarted: false,
        workerPlan,
        note: status === "queued" ? "Queued as an approved job record. Platform-specific live upload worker is still gated by provider permissions." : "No platform upload/publish call was started."
      },
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .select("id, user_id, connected_account_id, production_id, provider, job_type, status, approval_required, payload, result, error_message, created_at, updated_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ job: data, guardrails: connectedAccountGuardrails });
}
