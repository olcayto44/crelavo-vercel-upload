/**
 * Typed adapters for the EXISTING Crelavo Next.js app.
 *
 * This pack does not know your live REST paths for credits, Work Brain,
 * productions, webhooks, or refunds. Do not invent them here.
 *
 * Bind each method to YOUR current module on branch
 * preview/live-sales-source-replace-2. Until then every method returns
 * status: "not_connected".
 *
 * Do not use floor-data.ts as live users, orders, credits, or productions.
 * Do not replace /auth/login, existing credit ledger, Whop checkout URLs,
 * production jobs, or the 228-URL sitemap.
 *
 * Known URLs (keep):
 *   Pro monthly checkout  https://whop.com/checkout/plan_ujLQgM3kEg0dg
 *   Pro annual checkout   https://whop.com/checkout/plan_fiabRYr6uWY43
 *   Existing form actions POST /contact and POST /affiliate
 *   Existing login        /auth/login
 */

import type { CreamResult } from "./cream-status";

export function notConnected<T = never>(slot: string): CreamResult<T> {
  return {
    status: "not_connected",
    message: `Adapter "${slot}" is not bound. Keep the existing API. Do not treat this UI as a live write.`,
  };
}

async function unbound<T = never>(slot: string): Promise<CreamResult<T>> {
  return notConnected<T>(slot);
}

export type SessionSnapshot = {
  userId: string;
};

export type CreditSnapshot = {
  available: number;
  planLabel: string;
};

export type CreditPreview = {
  credits: number;
  kind: string;
};

export type ProductionListItem = {
  id: string;
  title: string;
  statusLabel: string;
};

export type ProductionStart = {
  jobId: string;
};

export type AssistantHistoryItem = {
  id: string;
  role: "user" | "system" | "assistant";
  text: string;
};

export type AdScoreReport = {
  reportId: string;
  /** Raw fields from YOUR scorer. Never invent percentages in the UI. */
  fields?: Record<string, string | number>;
};

export type BillingConfirm = {
  ticketId: string;
};

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

export type AffiliatePayload = {
  name: string;
  email: string;
  channel_type: string;
  channel_url?: string;
  audience_size?: string;
  audience?: string;
  pitch?: string;
  security: string;
};

export interface SessionAdapter {
  /** TODO: bind to existing session. Do not replace /auth/login. */
  getSession(): Promise<CreamResult<SessionSnapshot>>;
}

export interface CreditsAdapter {
  /**
   * TODO: bind to existing credit ledger.
   * /dashboard may show STATIC_DASHBOARD_CREDIT_EXAMPLE (2,500). That is not this method.
   * Do not load, deduct, or write history from this pack.
   */
  getBalance(): Promise<CreamResult<CreditSnapshot>>;
  previewCost(input: { kind: string }): Promise<CreamResult<CreditPreview>>;
}

export interface ProductionAdapter {
  /** TODO: bind to existing productions list. Do not use floor-data.ts. */
  listRecent(): Promise<CreamResult<ProductionListItem[]>>;
  start(input: { prompt: string; kind?: string }): Promise<CreamResult<ProductionStart>>;
}

export interface AssistantAdapter {
  /**
   * Bind to the EXISTING Work Brain.
   * Do not implement a fake assistant, invented replies, or a three-column chrome.
   */
  sendMessage(input: {
    text: string;
  }): Promise<CreamResult<{ accepted: boolean }>>;
  upload(input: { filename: string; size: number }): Promise<CreamResult<{ uploadId: string }>>;
  checkCredits(): Promise<CreamResult<CreditSnapshot>>;
  startProduction(input: { prompt: string }): Promise<CreamResult<ProductionStart>>;
  listHistory(): Promise<CreamResult<AssistantHistoryItem[]>>;
}

export interface AdScorerAdapter {
  /**
   * TODO: bind to existing ad-performance scorer if it already exists.
   * Do not invent scores, grades, or prediction percentages.
   */
  analyze(input: {
    filename?: string;
    url?: string;
  }): Promise<CreamResult<AdScoreReport>>;
}

export interface BillingAdapter {
  /**
   * UI confirmation only until bound.
   * A checked box in this pack is NOT a legal record and NOT a completed refund/cancel.
   */
  requestCancelConfirm(input: {
    acknowledged: boolean;
  }): Promise<CreamResult<BillingConfirm>>;
  requestRefundConfirm(input: {
    acknowledged: boolean;
    paymentRef?: string;
  }): Promise<CreamResult<BillingConfirm>>;
}

export interface ContactAdapter {
  /** TODO: bind to existing POST /contact. Do not create a new secret. */
  submit(input: ContactPayload): Promise<CreamResult<{ ok: true }>>;
}

export interface AffiliateAdapter {
  /** TODO: bind to existing POST /affiliate. */
  submit(input: AffiliatePayload): Promise<CreamResult<{ ok: true }>>;
}

export interface ToolLaunchAdapter {
  /**
   * Shared launch hook for pending tool routes.
   * Bind per-route in your repo. Path is the page path, not an invented API.
   */
  launch(input: { path: string; note?: string }): Promise<CreamResult<{ accepted: boolean }>>;
}

/**
 * Whop webhook + payment verification are NOT implemented in this pack.
 * Do not add a fake /api/webhooks/whop route here.
 * Bind in YOUR existing webhook handler. Path unknown — do not invent it.
 */
export interface WhopWebhookContract {
  /** Documentation only. */
  readonly eventsToHandle: readonly [
    "membership.went_valid",
    "membership.went_invalid",
    "payment.succeeded",
    "payment.failed",
    "refund.created",
  ];
  /** Verify the Whop signature with YOUR existing secret. Never log the secret. */
  verifyAndApply(_input: {
    rawBody: string;
    signatureHeader: string;
  }): Promise<CreamResult<{ applied: boolean }>>;
}

export const creamAdapters = {
  session: {
    getSession: () => unbound<SessionSnapshot>("session"),
  } satisfies SessionAdapter,
  credits: {
    getBalance: () => unbound<CreditSnapshot>("credits.getBalance"),
    previewCost: () => unbound<CreditPreview>("credits.previewCost"),
  } satisfies CreditsAdapter,
  productions: {
    listRecent: () => unbound<ProductionListItem[]>("productions.listRecent"),
    start: () => unbound<ProductionStart>("productions.start"),
  } satisfies ProductionAdapter,
  assistant: {
    sendMessage: (_input: { text: string }) => unbound("assistant.sendMessage"),
    upload: (_input: { filename: string; size: number }) => unbound("assistant.upload"),
    checkCredits: () => unbound<CreditSnapshot>("assistant.checkCredits"),
    startProduction: (_input: { prompt: string }) => unbound<ProductionStart>("assistant.startProduction"),
    listHistory: () => unbound<AssistantHistoryItem[]>("assistant.listHistory"),
  } satisfies AssistantAdapter,
  adScorer: {
    analyze: () => unbound<AdScoreReport>("adScorer.analyze"),
  } satisfies AdScorerAdapter,
  billing: {
    requestCancelConfirm: (_input: { acknowledged: boolean }) => unbound<BillingConfirm>("billing.cancel"),
    requestRefundConfirm: (_input: { acknowledged: boolean; paymentRef?: string }) => unbound<BillingConfirm>("billing.refund"),
  } satisfies BillingAdapter,
  contact: {
    submit: () => unbound("contact.submit"),
  } satisfies ContactAdapter,
  affiliate: {
    submit: () => unbound("affiliate.submit"),
  } satisfies AffiliateAdapter,
  tools: {
    launch: (_input: { path: string; note?: string }) => unbound("tools.launch"),
  } satisfies ToolLaunchAdapter,
};

export const whopWebhookContract: WhopWebhookContract = {
  eventsToHandle: [
    "membership.went_valid",
    "membership.went_invalid",
    "payment.succeeded",
    "payment.failed",
    "refund.created",
  ],
  verifyAndApply: () => unbound("whop.webhook.verifyAndApply"),
};
