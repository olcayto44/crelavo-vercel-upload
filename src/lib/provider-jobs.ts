import { buildOutputRegistry, type OutputRegistryItem } from "./output-registry.ts";
import { getProviderStatus } from "./providers/status.ts";
import type { NormalizedProviderStatus, ProviderJob } from "./providers/types.ts";

export type ProviderJobLifecycleStatus = "no_provider_job" | "queued" | "running" | "ready" | "failed" | "unknown";

export type ProviderJobLifecycle = {
  providerJob: ProviderJob | null;
  normalizedStatus: NormalizedProviderStatus | null;
  lifecycleStatus: ProviderJobLifecycleStatus;
  finalOutputUrl: string | null;
  outputRegistry: OutputRegistryItem[];
  note: string;
};

export type ProviderLifecycleSnapshot = {
  visual: ProviderJobLifecycle;
  render: ProviderJobLifecycle;
  outputRegistry: OutputRegistryItem[];
};

type ProviderJobProduction = {
  id: string;
  production_type?: string | null;
  delivery_link?: string | null;
  delivery_zip_url?: string | null;
  source_files_url?: string | null;
  readme_url?: string | null;
  preview_url?: string | null;
  output_json?: Record<string, any> | null;
  request_metadata?: Record<string, any> | null;
  input_json?: Record<string, any> | null;
};

export function providerJobFromValue(value: unknown): ProviderJob | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const provider = typeof record.provider === "string" ? record.provider : "";
  if (!provider) return null;
  return {
    provider,
    id: typeof record.id === "string" ? record.id : undefined,
    status: typeof record.status === "string" ? record.status : "unknown",
    url: typeof record.url === "string" ? record.url : undefined,
    raw: record.raw
  };
}

export function lifecycleStatusFromProvider(status: NormalizedProviderStatus | null): ProviderJobLifecycleStatus {
  if (!status) return "no_provider_job";
  if (status.status === "succeeded") return "ready";
  if (status.status === "failed") return "failed";
  if (status.status === "queued") return "queued";
  if (status.status === "running") return "running";
  return "unknown";
}

export function lifecycleStatusFromProviderJob(job: ProviderJob | null): ProviderJobLifecycleStatus {
  if (!job) return "no_provider_job";
  const status = String(job.status ?? "unknown").toLowerCase();
  if (["succeeded", "success", "completed", "complete", "done", "ready"].includes(status)) return "ready";
  if (["failed", "failure", "error", "canceled", "cancelled"].includes(status)) return "failed";
  if (["queued", "submitted", "pending"].includes(status)) return "queued";
  if (["starting", "processing", "running", "rendering", "generating", "in_progress"].includes(status)) return "running";
  return "unknown";
}

export async function checkProviderJobStatus(job: ProviderJob | null): Promise<NormalizedProviderStatus | null> {
  if (!job) return null;
  return getProviderStatus(job);
}

export function collectProviderOutputs(production: ProviderJobProduction, normalizedStatus: NormalizedProviderStatus | null) {
  const output = production.output_json ?? {};
  const finalOutputUrl = normalizedStatus?.status === "succeeded" && normalizedStatus.outputUrl ? normalizedStatus.outputUrl : String(output.finalVideoUrl ?? production.delivery_link ?? production.preview_url ?? "") || null;
  const outputJson = finalOutputUrl ? { ...output, finalVideoUrl: finalOutputUrl } : output;
  return {
    finalOutputUrl,
    outputRegistry: buildOutputRegistry({ ...production, output_json: outputJson })
  };
}

export function isActiveProviderJob(value: unknown) {
  const job = providerJobFromValue(value);
  if (!job) return false;
  return !["ready", "failed"].includes(lifecycleStatusFromProviderJob(job));
}

export function providerLifecycleFromJobs(production: ProviderJobProduction, jobs: { visualJob?: unknown; renderJob?: unknown }): ProviderLifecycleSnapshot {
  const visualJob = providerJobFromValue(jobs.visualJob);
  const renderJob = providerJobFromValue(jobs.renderJob);
  const output = production.output_json ?? {};
  const finalOutputUrl = String(output.finalVideoUrl ?? renderJob?.url ?? visualJob?.url ?? production.delivery_link ?? production.preview_url ?? "") || null;
  const outputJson = finalOutputUrl ? { ...output, finalVideoUrl: finalOutputUrl } : output;
  const outputRegistry = buildOutputRegistry({ ...production, output_json: outputJson });
  return {
    visual: {
      providerJob: visualJob,
      normalizedStatus: null,
      lifecycleStatus: lifecycleStatusFromProviderJob(visualJob),
      finalOutputUrl: visualJob?.url ?? null,
      outputRegistry,
      note: visualJob ? "Visual provider job has been created and is ready for status polling." : "No visual provider job is attached yet."
    },
    render: {
      providerJob: renderJob,
      normalizedStatus: null,
      lifecycleStatus: lifecycleStatusFromProviderJob(renderJob),
      finalOutputUrl: renderJob?.url ?? null,
      outputRegistry,
      note: renderJob ? "Render provider job has been created and is ready for status polling." : "No render provider job is attached yet."
    },
    outputRegistry
  };
}

export async function runProviderJobLifecycle(production: ProviderJobProduction, jobValue: unknown): Promise<ProviderJobLifecycle> {
  const providerJob = providerJobFromValue(jobValue);
  const normalizedStatus = await checkProviderJobStatus(providerJob);
  const lifecycleStatus = lifecycleStatusFromProvider(normalizedStatus);
  const outputs = collectProviderOutputs(production, normalizedStatus);
  return {
    providerJob,
    normalizedStatus,
    lifecycleStatus,
    finalOutputUrl: outputs.finalOutputUrl,
    outputRegistry: outputs.outputRegistry,
    note: lifecycleStatus === "ready"
      ? "Provider output is ready and can be attached to the delivery package."
      : lifecycleStatus === "failed"
        ? "Provider job failed and needs admin review."
        : lifecycleStatus === "no_provider_job"
          ? "No provider job is attached yet; delivery package can stay in demo/generated-on-download mode."
          : "Provider job is still in progress."
  };
}
