import { z } from "zod";

export const CreditAccountSchema = z.enum(["assistant", "production", "none"]);
export const BillingOperationSchema = z.enum([
  "conversation", "analysis", "brief_extraction", "planning",
  "project_read", "preview_read", "delivery_read", "revision_read", "content_edit", "content_restore", "reference_attach",
  "website_generation", "image_generation", "video_generation", "audio_generation", "app_generation", "paid_revision", "render", "upscale", "extend",
]);
export type BillingOperation = z.infer<typeof BillingOperationSchema>;
const assistant = new Set<BillingOperation>(["conversation", "analysis", "brief_extraction", "planning"]);
const free = new Set<BillingOperation>(["project_read", "preview_read", "delivery_read", "revision_read", "content_edit", "content_restore", "reference_attach"]);
export function creditPolicy(rawOperation: unknown) {
  const operation = BillingOperationSchema.parse(rawOperation);
  const account = assistant.has(operation) ? "assistant" as const : free.has(operation) ? "none" as const : "production" as const;
  return Object.freeze({ operation, account, fallbackAllowed: false as const, transferAllowed: false as const,
    amountSource: account === "none" ? "free_contract" as const : "server_tariff" as const,
    settlement: account === "assistant" ? "once_per_conversation_request" as const : account === "production" ? "approved_production_request" as const : "not_applicable" as const,
    explicitApprovalRequired: account === "production", writesBalance: false as const });
}
export function assertCreditAccount(rawOperation: unknown, rawAccount: unknown) {
  const policy = creditPolicy(rawOperation);
  if (CreditAccountSchema.parse(rawAccount) !== policy.account) throw new Error("credit_account_mismatch");
  return policy;
}
// B1 deliberately provides no amount calculator, balance mutation, grant, reserve, or payment integration.