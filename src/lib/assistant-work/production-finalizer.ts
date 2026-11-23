import type { SupabaseClient } from "@supabase/supabase-js";
export type ProductionFence = { userId: string; productionId: string; taskGeneration: number; workerLease: string; stepToken?: string | null };
export async function finalizeAssistantProduction(db: SupabaseClient, fence: ProductionFence, status: "ready" | "failed", output: Record<string, unknown>) {
  if (!fence.userId || !fence.productionId || !Number.isSafeInteger(fence.taskGeneration) || !fence.workerLease) throw new Error("finalizer_identity_required");
  const { data: lock, error: lookupError } = await db.from("assistant_production_locks").select("task_generation,worker_lease,lease_expires_at,step_token,steps,provider_state,finalized").eq("production_id", fence.productionId).eq("user_id", fence.userId).single();
  if (lookupError || !lock) throw new Error("finalizer_lock_required");
  if (lock.task_generation !== fence.taskGeneration || lock.worker_lease !== fence.workerLease || (lock.step_token ?? null) !== (fence.stepToken ?? null)) throw new Error("finalizer_fenced");
  const steps = Array.isArray(lock.steps) ? lock.steps : [];
  if (steps.some((step: { state?: string }) => step.state === "started" || step.state === "uncertain") || ["started", "uncertain"].includes(lock.provider_state) || (steps.length > 0 && !fence.stepToken)) return { reconcileRequired: true };
  if (!lock.finalized && Date.parse(lock.lease_expires_at) <= Date.now()) throw new Error("finalizer_lease_expired");
  const { data, error } = await db.rpc("finalize_assistant_production", { p_user_id: fence.userId, p_production_id: fence.productionId, p_generation: fence.taskGeneration, p_lease: fence.workerLease, p_step_token: fence.stepToken ?? null, p_status: status, p_output: output });
  if (error) throw new Error("finalizer_rpc_failed: " + error.message);
  if (!data) throw new Error("finalizer_empty_result");
  return data as { reconcileRequired?: boolean; status?: string; available?: number; idempotent?: boolean };
}
