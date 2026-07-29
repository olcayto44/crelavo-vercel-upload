import { computeAdminReservedRefund, computeCancellationCreditResolution, computeExpiredBeforeProviderStartRefund, computeProviderSuccessSpend } from "../src/lib/credit-resolution.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const cancellation = computeCancellationCreditResolution({
  balance: 1000,
  reserved: 400,
  reservedCredits: 400,
  productionId: "prod-1",
  now: "2026-01-01T00:00:00.000Z"
});
assertEqual(cancellation.cancellationFee, 200, "cancel fee");
assertEqual(cancellation.refundAmount, 200, "cancel refund");
assertEqual(cancellation.nextBalance, 800, "cancel next balance");
assertEqual(cancellation.nextReserved, 0, "cancel next reserved");
assertEqual(cancellation.creditResolution.status, "cancelled_half_spent", "cancel resolution status");
assertEqual(cancellation.events.length, 2, "cancel event count");

const oddCancellation = computeCancellationCreditResolution({
  balance: 101,
  reserved: 101,
  reservedCredits: 101,
  productionId: "prod-odd"
});
assertEqual(oddCancellation.cancellationFee, 51, "odd cancel fee ceil");
assertEqual(oddCancellation.refundAmount, 50, "odd cancel refund");

const success = computeProviderSuccessSpend({
  balance: 1000,
  reserved: 400,
  reservedCredits: 400,
  productionTitle: "Provider success",
  now: "2026-01-01T00:00:00.000Z"
});
assertEqual(success.spendAmount, 400, "success spend");
assertEqual(success.nextBalance, 600, "success next balance");
assertEqual(success.nextReserved, 0, "success next reserved");
assertEqual(success.finalizedReservedCredits, 400, "success finalized reserved preserved for production output audit");
assertEqual(success.creditResolution.status, "spent_reserved", "success resolution status");

const cappedSuccess = computeProviderSuccessSpend({
  balance: 100,
  reserved: 400,
  reservedCredits: 400,
  productionTitle: "Provider success capped"
});
assertEqual(cappedSuccess.spendAmount, 100, "success capped spend");
assertEqual(cappedSuccess.nextBalance, 0, "success capped next balance");
assertEqual(cappedSuccess.nextReserved, 0, "success capped next reserved");

const refund = computeAdminReservedRefund({
  balance: 700,
  reserved: 400,
  reservedCredits: 400,
  productionTitle: "Provider failed",
  existingResolution: { status: "admin_review_required", reason: "provider_failed" },
  now: "2026-01-01T00:00:00.000Z"
});
assertEqual(refund.refundAmount, 400, "refund amount");
assertEqual(refund.nextBalance, 700, "refund keeps balance");
assertEqual(refund.nextReserved, 0, "refund next reserved");
assertEqual(refund.creditResolution.status, "refunded_reserved", "refund status");
assertEqual(refund.event?.type, "refund", "refund event type");

const expired = computeExpiredBeforeProviderStartRefund({
  balance: 700,
  reserved: 400,
  reservedCredits: 400,
  productionTitle: "Queued production",
  productionId: "prod-expired",
  now: "2026-01-01T00:00:00.000Z"
});
assertEqual(expired.releaseAmount, 400, "expired release amount");
assertEqual(expired.nextBalance, 700, "expired keeps balance");
assertEqual(expired.nextReserved, 0, "expired next reserved");
assertEqual(expired.creditResolution.status, "expired_before_provider_start_refunded", "expired status");
assertEqual(expired.creditResolution.spentCredits, 0, "expired spent zero");

console.log("credit-resolution-smoke ok");
