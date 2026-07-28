export type WhopCreditReconciliationInput = {
  event: string;
  webhookId: string;
  paymentReference?: string | null;
  customerEmail?: string | null;
  activation?: Record<string, any> | null;
  receiptEmailResult?: unknown;
  adminPaymentNotificationResult?: unknown;
  creditActivationEmailResult?: unknown;
};

export function buildWhopCreditReconciliation(input: WhopCreditReconciliationInput) {
  const activation = input.activation ?? {};
  const activated = activation.activated === true;
  const reason = String(activation.reason ?? (activated ? "credits_activated" : "not_activated"));
  const balance = activation.balance && typeof activation.balance === "object" ? activation.balance : null;
  const profile = activation.profile && typeof activation.profile === "object" ? activation.profile : null;
  return {
    event: input.event,
    webhookId: input.webhookId,
    paymentReference: input.paymentReference ?? null,
    customerEmail: input.customerEmail ?? null,
    activated,
    reason,
    userMatched: Boolean(profile?.id),
    creditsAdded: Number(activation.creditsAdded ?? 0),
    dashboardVisible: activated && Boolean(balance),
    dashboardBalance: typeof balance?.balance === "number" ? balance.balance : null,
    idempotency: reason === "already_processed" ? "duplicate_ignored" : "checked",
    email: {
      receipt: input.receiptEmailResult,
      admin: input.adminPaymentNotificationResult,
      activation: input.creditActivationEmailResult
    },
    guardrail: activated
      ? "Whop webhook matched the Crelavo user and credit balance was updated. Dashboard should show the new balance."
      : "No credits were added unless mapped product, paid event, matching Crelavo user and idempotency checks passed."
  };
}
