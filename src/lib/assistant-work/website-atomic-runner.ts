import { z } from "zod";
import { generateWebsiteArtifact } from "../website-engine";
import { websiteEngineInput, normalizeAssistantWebsiteBrief, websitePlanHash, missingWebsiteBrief, unsupportedWebsiteScope } from "./website-brief";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import type { WebsiteCreditLedger } from "./website-credit-ledger";

// NOT exported as an HTTP endpoint. Isolated orchestration only until DB concurrency,
// auth, provider failure and full delivery tests have passed.
const Input = z.strictObject({
  userId: z.string().uuid(),
  productionId: z.string().uuid(),
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
  credits: z.number().int().positive().max(100000),
});
type WebsiteArtifact = Awaited<ReturnType<typeof generateWebsiteArtifact>>;
type Generate = (brief: ReturnType<typeof websiteEngineInput>, projectId: string) => Promise<WebsiteArtifact>;

export async function runIsolatedWebsiteGeneration(
  raw: z.input<typeof Input>,
  deps: { ledger: WebsiteCreditLedger; loadReserved: (productionId: string, userId: string) => Promise<unknown>; generate?: Generate },
) {
  const input = Input.parse(raw);
  const identity = {
    userId: input.userId, productionId: input.productionId, planHash: input.planHash,
  };
  // The website brief must come from the owner-scoped, atomically reserved row,
  // never from the browser request or an untrusted pre-reservation snapshot.
  const stored = z.strictObject({
    userId: z.string().uuid(), productionId: z.string().uuid(),
    phase: z.enum(["approved", "reserved", "generating", "awaiting_payment", "ready", "generation_failed"]), planHash: z.string(), approvedHash: z.string(),
    packId: z.string(), credits: z.number().int(),
    brief: z.record(z.string(), z.unknown()),
  }).parse(await deps.loadReserved(input.productionId, input.userId));
  const brief = normalizeAssistantWebsiteBrief(stored.brief);
  const pack = getCategory("website")?.packs.find(p => p.id === stored.packId);
  if (stored.userId !== input.userId || stored.productionId !== input.productionId ||
    stored.planHash !== input.planHash || stored.approvedHash !== input.planHash ||
    stored.credits !== input.credits || pack?.credits !== input.credits ||
    /admin|commerce|checkout/i.test(pack.label) ||
    websitePlanHash(brief, stored.packId) !== input.planHash ||
    missingWebsiteBrief(brief).length || unsupportedWebsiteScope(brief).length) {
    throw new Error("website_reserved_plan_mismatch_reconciliation_required");
  }
  // Finished or interrupted attempts are never sent to the provider again.
  if (stored.phase !== "approved") return { state: "already_reserved_or_finished" as const, charged: false };
  // Validate before reserving so invalid/stale packs never hold a user's credits.
  const reservation = await deps.ledger.reserve({ ...identity, credits: input.credits });
  if (!reservation || typeof reservation !== "object" || !("fresh" in reservation) ||
      (reservation as { fresh?: unknown }).fresh !== true) {
    return { state: "already_reserved_or_finished" as const, charged: false };
  }
  // Refetch after the transaction to confirm the plan stayed locked.
  const confirmed = await deps.loadReserved(input.productionId, input.userId);
  const held = z.strictObject({
    userId: z.string().uuid(), productionId: z.string().uuid(), phase: z.literal("reserved"),
    planHash: z.string(), approvedHash: z.string(), packId: z.string(), credits: z.number().int(),
    brief: z.record(z.string(), z.unknown()),
  }).parse(confirmed);
  if (held.userId !== stored.userId || held.productionId !== stored.productionId ||
      held.planHash !== stored.planHash || held.approvedHash !== stored.approvedHash ||
      held.packId !== stored.packId || held.credits !== stored.credits ||
      websitePlanHash(normalizeAssistantWebsiteBrief(held.brief), held.packId) !== input.planHash) {
    throw new Error("website_reserved_plan_mismatch_reconciliation_required");
  }
  if (!await deps.ledger.claim(identity)) {
    return { state: "claim_conflict" as const, charged: false };
  }
  let artifact: WebsiteArtifact;
  try {
    artifact = await (deps.generate ?? generateWebsiteArtifact)(
      websiteEngineInput(brief), input.productionId,
    );
  } catch {
    // The deterministic local generator has no remote provider submission.
    // Never apply this failure shortcut to an external/uncertain provider call.
    await deps.ledger.record({
      ...identity, outcome: "failed", result: { kind: "confirmed_local_generation_failure" },
    });
    const released = await deps.ledger.finalize({ ...identity, outcome: "failed" });
    return { state: "generation_failed" as const, charged: false, settlement: released };
  }
  // Persist the actual artifact before charging, with the same plan hash.
  await deps.ledger.record({
    ...identity,
    outcome: "ready",
    result: { files: artifact.files, websiteContent: artifact.websiteContent, pageManifest: artifact.pageManifest },
  });
  const settlement = await deps.ledger.finalize({ ...identity, outcome: "ready" });
  if (!settlement || typeof settlement !== "object" ||
      !("state" in settlement) || (settlement as { state?: unknown }).state !== "settled") {
    return { state: "reconciliation_required" as const, charged: false, settlement };
  }
  return { state: "ready" as const, charged: true, settlement };
}
