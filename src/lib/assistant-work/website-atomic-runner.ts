import { z } from "zod";
import { generateWebsiteArtifact } from "../website-engine";
import { websiteEngineInput, normalizeAssistantWebsiteBrief } from "./website-brief";
import type { WebsiteCreditLedger } from "./website-credit-ledger";

// NOT exported as an HTTP endpoint. Isolated orchestration only until DB concurrency,
// auth, provider failure and full delivery tests have passed.
const Input = z.strictObject({
  userId: z.string().uuid(),
  productionId: z.string().uuid(),
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
  credits: z.number().int().positive().max(100000),
  brief: z.record(z.string(), z.unknown()),
});
type WebsiteArtifact = Awaited<ReturnType<typeof generateWebsiteArtifact>>;
type Generate = (brief: ReturnType<typeof websiteEngineInput>, projectId: string) => Promise<WebsiteArtifact>;

export async function runIsolatedWebsiteGeneration(
  raw: z.input<typeof Input>,
  deps: { ledger: WebsiteCreditLedger; generate?: Generate },
) {
  const input = Input.parse(raw);
  const identity = {
    userId: input.userId, productionId: input.productionId, planHash: input.planHash,
  };
  const reservation = await deps.ledger.reserve({ ...identity, credits: input.credits });
  if (!reservation || typeof reservation !== "object" || !("fresh" in reservation) ||
      (reservation as { fresh?: unknown }).fresh !== true) {
    // No automatic replay: a crashed, uncertain or previously completed request
    // needs server-side inspection, never a second provider invocation.
    return { state: "already_reserved_or_finished" as const, charged: false };
  }
  if (!await deps.ledger.claim(identity)) {
    return { state: "claim_conflict" as const, charged: false };
  }
  let artifact: WebsiteArtifact;
  try {
    artifact = await (deps.generate ?? generateWebsiteArtifact)(
      websiteEngineInput(normalizeAssistantWebsiteBrief(input.brief)), input.productionId,
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
