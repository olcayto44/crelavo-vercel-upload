import { z } from "zod";

// Server-only adapter for the isolated Website production-credit migration.
// No route invokes this until migration, concurrency and delivery checks pass.
const UUID = z.string().uuid();
const HASH = z.string().regex(/^[a-f0-9]{64}$/);
const RESERVE = z.strictObject({
  userId: UUID, productionId: UUID, planHash: HASH,
  credits: z.number().int().min(1).max(100000),
});
const FINALIZE = z.strictObject({
  userId: UUID, productionId: UUID, planHash: HASH,
  outcome: z.enum(["ready", "failed"]),
});
const CLAIM = z.strictObject({ userId: UUID, productionId: UUID, planHash: HASH });
const RECORD = z.strictObject({
  userId: UUID, productionId: UUID, planHash: HASH,
  outcome: z.enum(["ready", "failed"]),
  result: z.record(z.string(), z.unknown()),
});
type RPC = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
export type WebsiteCreditLedger = {
  reserve(input: z.input<typeof RESERVE>): Promise<unknown>;
  claim(input: z.input<typeof CLAIM>): Promise<boolean>;
  record(input: z.input<typeof RECORD>): Promise<boolean>;
  finalize(input: z.input<typeof FINALIZE>): Promise<unknown>;
};

export function createWebsiteCreditLedger(rpc: RPC): WebsiteCreditLedger {
  async function call(name: "website_credit_reserve" | "website_credit_claim" | "website_credit_finalize", args: Record<string, unknown>) {
    const { data, error } = await rpc(name, args);
    if(name==="website_credit_reserve"&&error?.message==="insufficient_production_credits")throw new Error("insufficient_production_credits");
    // Fail closed, do not fall back to non-atomic /api/credits/spend.
    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("website_atomic_ledger_unavailable");
    }
    return data;
  }
  return {
    reserve(raw) {
      const input = RESERVE.parse(raw);
      return call("website_credit_reserve", {
        p_user: input.userId, p_production: input.productionId,
        p_hash: input.planHash, p_credits: input.credits,
      });
    },
    async claim(raw) {
      const input = CLAIM.parse(raw);
      const { data, error } = await rpc("website_credit_claim", {
        p_user: input.userId, p_production: input.productionId, p_hash: input.planHash,
      });
      if (error || typeof data !== "boolean") throw new Error("website_atomic_claim_unavailable");
      return data;
    },
    async record(raw) {
      const input = RECORD.parse(raw);
      const { data, error } = await rpc("website_credit_record", {
        p_user: input.userId, p_production: input.productionId,
        p_hash: input.planHash, p_outcome: input.outcome, p_result: input.result,
      });
      if (error || data !== true) throw new Error("website_atomic_record_unavailable");
      return true;
    },
    finalize(raw) {
      const input = FINALIZE.parse(raw);
      return call("website_credit_finalize", {
        p_user: input.userId, p_production: input.productionId,
        p_hash: input.planHash, p_outcome: input.outcome,
      });
    },
  };
}
