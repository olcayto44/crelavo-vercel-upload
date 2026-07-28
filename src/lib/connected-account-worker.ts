import { buildGuardedWorkerPlan, evaluateConnectedAccountReadiness, platformFormatLimits, providerWorkerSkeletons } from "@/lib/connected-account-automation";
import { decryptConnectedToken, type ConnectedProvider } from "@/lib/connected-accounts";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export function connectedLiveWorkersEnabled() {
  return process.env.CONNECTED_ACCOUNT_LIVE_WORKERS === "true";
}

export function buildProviderPayloadPreview(input: { provider: ConnectedProvider; jobType: string; payload?: Record<string, any> | null }) {
  const payload = input.payload ?? {};
  const base = {
    title: clean(payload.title),
    mediaUrl: clean(payload.mediaUrl ?? payload.media_url),
    caption: clean(payload.caption),
    hashtags: Array.isArray(payload.hashtags) ? payload.hashtags.map(clean).filter(Boolean) : [],
    productId: clean(payload.productId ?? payload.product_id),
    target: clean(payload.target)
  };

  if (input.provider === "shopify" || input.provider === "woocommerce") {
    return {
      ...base,
      mutationType: input.jobType === "store_upload" ? "product_media_or_description_update" : "store_draft",
      productIdRequired: true,
      productIdPresent: Boolean(base.productId)
    };
  }

  return {
    ...base,
    mutationType: input.jobType === "one_click_publish" ? "publish_after_approval" : "draft_upload",
    mediaRequired: true,
    mediaPresent: Boolean(base.mediaUrl)
  };
}

export function runConnectedAccountWorkerPlan(input: { account: Record<string, any>; job: Record<string, any>; finalApproval?: boolean }) {
  const provider = input.job.provider as ConnectedProvider;
  const jobType = clean(input.job.job_type);
  const readiness = evaluateConnectedAccountReadiness(input.account);
  const finalApproval = input.finalApproval === true || input.job.payload?.finalUserApproval === true;
  const workerPlan = buildGuardedWorkerPlan({ provider, jobType, finalApproval, readinessStatus: String(readiness.status), hasConnectedAccount: true });
  const payloadPreview = buildProviderPayloadPreview({ provider, jobType, payload: input.job.payload });
  const accessTokenPresent = Boolean(decryptConnectedToken(input.account.access_token_encrypted));
  const refreshTokenPresent = Boolean(decryptConnectedToken(input.account.refresh_token_encrypted));
  const liveWorkersEnabled = connectedLiveWorkersEnabled();
  const canAttemptProviderCall = liveWorkersEnabled && workerPlan.canStartLiveMutation && accessTokenPresent;

  return {
    directApiCallStarted: false,
    providerApiCallStarted: false,
    liveWorkersEnabled,
    canAttemptProviderCall,
    readiness,
    workerPlan,
    providerPayloadPreview: payloadPreview,
    providerResponse: canAttemptProviderCall
      ? {
          status: "not_started",
          message: "Live worker gate is enabled, but provider-specific mutation is still in dry-run response capture mode until platform E2E is approved."
        }
      : {
          status: "guarded_dry_run",
          message: accessTokenPresent ? "Provider mutation was not called. This job is stored as a guarded worker plan." : "Provider mutation was not called because access token is missing.",
          requiredEnv: "CONNECTED_ACCOUNT_LIVE_WORKERS=true",
          finalApprovalRequired: jobType !== "export_ready",
          finalApprovalReceived: finalApproval
        },
    formatLimits: platformFormatLimits[provider],
    workerSkeleton: providerWorkerSkeletons[provider],
    checkedAt: new Date().toISOString(),
    tokenState: { accessTokenPresent, refreshTokenPresent }
  };
}
