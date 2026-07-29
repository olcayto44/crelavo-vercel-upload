export type CreditBalanceInput = {
  balance: number;
  reserved: number;
};

function positiveNumber(value: unknown) {
  return Math.max(0, Number(value ?? 0) || 0);
}

export function computeCancellationCreditResolution(input: CreditBalanceInput & { reservedCredits: number; productionId: string; now?: string }) {
  const reservedCredits = positiveNumber(input.reservedCredits);
  const balance = positiveNumber(input.balance);
  const reserved = positiveNumber(input.reserved);
  const cancellationFee = Math.ceil(reservedCredits * 0.5);
  const refundAmount = Math.max(0, reservedCredits - cancellationFee);

  return {
    cancellationFee,
    refundAmount,
    nextBalance: Math.max(0, balance - cancellationFee),
    nextReserved: Math.max(0, reserved - reservedCredits),
    events: [
      { type: "spend", amount: cancellationFee, note: `50% automatic production cancellation fee: ${input.productionId}` },
      { type: "refund", amount: refundAmount, note: `50% reserved credit release after cancellation: ${input.productionId}` }
    ].filter((event) => event.amount > 0),
    creditResolution: {
      status: "cancelled_half_spent",
      reason: "member_cancelled_or_abandoned",
      spentCredits: cancellationFee,
      releasedReservedCredits: refundAmount,
      finalizedAt: input.now ?? new Date().toISOString(),
      instruction: "Üye üretimi iptal ettiği/vazgeçtiği için rezerve kredinin %50'si kesildi, kalan %50 rezervden serbest bırakıldı."
    }
  };
}

export function computeProviderSuccessSpend(input: CreditBalanceInput & { reservedCredits: number; productionTitle: string; now?: string }) {
  const reservedCredits = positiveNumber(input.reservedCredits);
  const balance = positiveNumber(input.balance);
  const reserved = positiveNumber(input.reserved);
  const spendAmount = Math.min(reservedCredits, balance);

  return {
    spendAmount,
    nextBalance: Math.max(0, balance - spendAmount),
    nextReserved: Math.max(0, reserved - reservedCredits),
    finalizedReservedCredits: reservedCredits,
    event: spendAmount > 0 ? { type: "spend", amount: spendAmount, note: `Reserved credits spent after provider success: ${input.productionTitle}` } : null,
    creditResolution: {
      status: "spent_reserved",
      reason: "provider_succeeded",
      spentCredits: spendAmount,
      finalizedAt: input.now ?? new Date().toISOString(),
      instruction: "Provider çıktısı hazır olduğu için rezerve kredi harcamaya çevrildi."
    }
  };
}

export function computeAdminReservedRefund(input: CreditBalanceInput & { reservedCredits: number; productionTitle: string; now?: string; existingResolution?: Record<string, unknown> | null }) {
  const reservedCredits = positiveNumber(input.reservedCredits);
  const balance = positiveNumber(input.balance);
  const reserved = positiveNumber(input.reserved);
  const refundAmount = Math.min(reservedCredits, reserved);

  return {
    refundAmount,
    nextBalance: balance,
    nextReserved: Math.max(0, reserved - refundAmount),
    event: refundAmount > 0 ? { type: "refund", amount: refundAmount, note: `Reserved credits released after provider failure: ${input.productionTitle}` } : null,
    creditResolution: {
      ...(input.existingResolution ?? {}),
      status: "refunded_reserved",
      refundedCredits: refundAmount,
      resolvedAt: input.now ?? new Date().toISOString(),
      instruction: "Reserved credits were released by admin. No spend was deducted from the user balance."
    }
  };
}

export function computeExpiredBeforeProviderStartRefund(input: CreditBalanceInput & { reservedCredits: number; productionTitle: string; productionId: string; now?: string }) {
  const reservedCredits = positiveNumber(input.reservedCredits);
  const balance = positiveNumber(input.balance);
  const reserved = positiveNumber(input.reserved);
  const releaseAmount = Math.min(reservedCredits, reserved);

  return {
    releaseAmount,
    nextBalance: balance,
    nextReserved: Math.max(0, reserved - releaseAmount),
    event: releaseAmount > 0 ? { type: "refund", amount: releaseAmount, note: `Reserved credits released after 24h expiry before provider start: ${input.productionTitle} (${input.productionId})` } : null,
    creditResolution: {
      status: "expired_before_provider_start_refunded",
      reason: "provider_not_started_within_24h",
      spentCredits: 0,
      refundedCredits: releaseAmount,
      releasedReservedCredits: releaseAmount,
      resolvedAt: input.now ?? new Date().toISOString(),
      instruction: "Provider job did not start within 24 hours, so the production was auto-cancelled and reserved credits were fully released. No provider spend was deducted."
    }
  };
}
