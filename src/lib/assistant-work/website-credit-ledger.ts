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
type RPC = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
export type WebsiteCreditLedger = {
  reserve(input: z.input<typeof RESERVE>): Promise<unknown>;
  finalize(input: z.input<typeof FINALIZE>): Promise<unknown>;
};

export function createWebsiteCreditLedger(rpc: RPC): WebsiteCreditLedger {
  async function call(name: "website_credit_reserve" | "website_credit_finalize", args: Record<string, unknown>) {
    const { data, error } = await rpc(name, args);
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
    finalize(raw) {
      const input = FINALIZE.parse(raw);
      return call("website_credit_finalize", {
        p_user: input.userId, p_production: input.productionId,
        p_hash: input.planHash, p_outcome: input.outcome,
      });
    },
  };
}
