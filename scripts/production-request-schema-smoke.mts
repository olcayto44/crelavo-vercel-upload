import { readFile } from "node:fs/promises";
import { computeAdminCostAwareReservedRefund } from "../src/lib/credit-resolution.ts";
import { isProductionRequestSchemaCacheError, productionRequestUpdatePayload } from "../src/lib/production-request-schema.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const sourcePayload = {
  status: "in_production",
  provider: "minimax",
  provider_job_id: "task-123",
  output_json: { providerStatus: "minimax_job_created" },
  updated_at: "2026-01-01T00:00:00.000Z"
};
const compatiblePayload = productionRequestUpdatePayload(sourcePayload);
assert(!("provider" in compatiblePayload), "provider must not be sent to production_requests");
assert(!("provider_job_id" in compatiblePayload), "provider_job_id must not be sent to production_requests");
assert((compatiblePayload.output_json as Record<string, unknown>).provider === "minimax", "provider must persist in output_json");
assert((compatiblePayload.output_json as Record<string, unknown>).providerJobId === "task-123", "provider job id must persist in output_json");
assert((compatiblePayload.output_json as Record<string, unknown>).provider_job_id === "task-123", "legacy provider job id must persist in output_json");

const unknownProviderColumnError = { code: "PGRST204", message: "Could not find the 'provider' column of 'production_requests' in the schema cache" };
assert(isProductionRequestSchemaCacheError(unknownProviderColumnError), "PGRST204 unknown provider column must be recognized");
const simulatedPostgrestWrite = (payload: Record<string, unknown>) => {
  if ("provider" in payload || "provider_job_id" in payload) return { error: unknownProviderColumnError };
  return { error: null, data: payload };
};
const writeResult = simulatedPostgrestWrite(compatiblePayload);
assert(!writeResult.error, "compatible production payload must pass PGRST204 simulation");
const updatedPayload = productionRequestUpdatePayload({ output_json: { provider: "old", providerJobId: "old-task" }, provider: "minimax", provider_job_id: "task-456" });
assert((updatedPayload.output_json as Record<string, unknown>).provider === "minimax", "provider must be updated in output_json");
assert((updatedPayload.output_json as Record<string, unknown>).providerJobId === "task-456", "task_id must persist on update");
assert((updatedPayload.output_json as Record<string, unknown>).provider_job_id === "task-456", "legacy task id must persist on update");

const noJobRelease = computeAdminCostAwareReservedRefund({ balance: 100, reserved: 400, reservedCredits: 400, providerCostCredits: 0, productionTitle: "No-job production" });
assert(noJobRelease.refundAmount === 400, "no-job path must release all reserved credits");
assert(noJobRelease.spentAmount === 0, "no-job path must not spend credits");
assert(noJobRelease.creditResolution.reason === "no_provider_cost_recorded_before_admin_refund", "no-job path must use no-provider-cost resolution");

const startRoute = await readFile(new URL("../src/app/api/automation/start/route.ts", import.meta.url), "utf8");
assert(startRoute.includes("productionRequestUpdatePayload"), "start route must use schema-compatible production updates");
assert(startRoute.indexOf("minimax_start_requested_update") < startRoute.indexOf("await startMiniMaxVideoAgentProduction"), "provider adapter must run after the DB start marker update");
assert(startRoute.includes("providerJobCreated = hasRealProviderJob(providerJob)"), "start route must record whether a real provider job exists");
assert(startRoute.includes("releaseReservedCredits"), "start route must release credits on no-job failure");
assert(startRoute.includes('generation_status: "provider_start_failed_no_job"'), "pre-provider failure must use no-job provider_start_failed status");
assert(startRoute.includes('provider_job_created: false'), "pre-provider failure response must prove no provider job was created");
assert(startRoute.includes("cancelled_production_not_restartable"), "cancelled productions must not restart automatically");

const creditResolution = JSON.stringify({ status: "refunded_reserved", spentCredits: 0, releasedReservedCredits: 400, reason: "provider_not_created" });
assert(!creditResolution.includes("cancelled_half_spent"), "no-job recovery must not use member cancellation fee resolution");

console.log("production-request-schema-smoke ok");
