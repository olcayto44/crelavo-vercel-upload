import { getAdmin } from "./config.ts";

export interface Checkpoint {
  /** clip index -> indirilen bayt. Aynı makinede yerel dosya aynı boyuttaysa yeniden indirilmez. */
  downloaded?: Record<string, number>;
  /** Yükleme tamamlandı mı? True ise yeni sahip FFmpeg'i atlayıp doğrudan sonlandırır. */
  uploaded?: boolean;
  outputPath?: string;
  durationSeconds?: number;
  sizeBytes?: number;
}

export interface MergeJob {
  id: string;
  options?: import("./options.ts").MergeOptions;
  lease_token: string;
  production_id: string | null;
  user_id: string;
  project_id: string;
  production_ids: string[];
  order_hash: string;
  status: "queued" | "processing" | "done" | "failed";
  progress: number;
  attempt: number;
  max_attempts: number;
  checkpoint: Checkpoint;
  output_path: string | null;
  duration_seconds: number | null;
  error_code: string | null;
  error_message: string | null;
}

/** Sadece lease sahibi ve hâlâ 'processing' ise yazar. Etkilenen satır varsa true. */
async function ownerUpdate(jobId: string, workerId: string, patch: Record<string, unknown>): Promise<boolean> {
  const {data,error}=await getAdmin().rpc("update_merge_job",{p_job:jobId,p_token:workerId,p_patch:patch});
  if(error)throw new Error("merge_job_update_failed");return data===true;
}

export async function claimJob(workerId: string, leaseSec: number): Promise<MergeJob | null> {
  const { data, error } = await getAdmin().rpc("claim_merge_job", { p_worker: workerId, p_lease_seconds: leaseSec });
  if (error) throw new Error(`claim_merge_job: ${error.message}`);
  const rows = (Array.isArray(data) ? data : data ? [data] : []) as MergeJob[];
  return rows[0] ?? null;
}

export async function heartbeat(jobId: string, workerId: string, leaseSec: number): Promise<boolean> {
  const { data, error } = await getAdmin().rpc("heartbeat_merge_job", {
    p_job: jobId,
    p_token: workerId,
    p_lease_seconds: leaseSec,
  });
  if (error) throw new Error(`heartbeat_merge_job: ${error.message}`);
  return data === true;
}

export const saveProgress = (jobId: string, workerId: string, progress: number) =>
  ownerUpdate(jobId, workerId, { progress: Math.max(0, Math.min(100, Math.round(progress))) });

export const saveCheckpoint = (jobId: string, workerId: string, checkpoint: Checkpoint) =>
  ownerUpdate(jobId, workerId, { checkpoint });

export const completeJob = (
  jobId: string,
  workerId: string,
  r: { outputPath: string; durationSeconds: number; sizeBytes: number },
) =>
  ownerUpdate(jobId, workerId, {
    status: "done",
    progress: 100,
    output_path: r.outputPath,
    duration_seconds: r.durationSeconds,
    size_bytes: r.sizeBytes,
    finished_at: new Date().toISOString(),
    lease_owner: null,
    lease_expires_at: null,
    error_code: null,
    error_message: null,
  });

export const failJob = (jobId: string, workerId: string, code: string, message: string) =>
  ownerUpdate(jobId, workerId, {
    status: "failed",
    error_code: code,
    error_message: message.slice(0, 500),
    finished_at: new Date().toISOString(),
    lease_owner: null,
    lease_expires_at: null,
  });

/** İşi kuyruğa geri bırakır (geçici hata / kapanış). refundAttempt: kapanışta deneme hakkını harcatmaz. */
export const requeueJob = (
  job: MergeJob,
  workerId: string,
  o: { code?: string; message?: string; delaySec: number; refundAttempt?: boolean },
) =>
  ownerUpdate(job.id, workerId, {
    status: "queued",
    run_after: new Date(Date.now() + o.delaySec * 1000).toISOString(),
    attempt: o.refundAttempt ? Math.max(0, job.attempt - 1) : job.attempt,
    error_code: o.code ?? null,
    error_message: o.message?.slice(0, 500) ?? null,
    lease_owner: null,
    lease_expires_at: null,
  });
