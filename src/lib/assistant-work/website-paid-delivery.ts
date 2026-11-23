// Prepaid Website output is a separate purchase from a subscription trial.
// A mutable output marker alone is not proof of a settled credit charge.
export function websiteCreditDeliveryProof(
  record: { production_type?: unknown; status?: unknown; reserved_credits?: unknown; output_json?: unknown },
  reservation: { state?: unknown; credits?: unknown } | null | undefined,
) {
  const output = record.output_json && typeof record.output_json === "object" &&
    !Array.isArray(record.output_json) ? record.output_json as Record<string, unknown> : {};
  return record.production_type === "website" && record.status === "ready" &&
    record.reserved_credits === 0 && output.websiteBillingMode === "atomic_v1" &&
    output.websiteBillingPending === false && Number.isSafeInteger(output.charged) &&
    typeof output.charged === "number" && output.charged > 0 &&
    reservation?.state === "settled" && reservation.credits === output.charged;
}
