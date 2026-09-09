/**
 * Shared UI statuses for every cream form.
 * Default live behaviour in this pack: empty → loading → not_connected.
 * success / error / insufficient_credits / login_required only after YOU bind adapters.
 */

export const CREAM_STATUSES = [
  "empty",
  "loading",
  "success",
  "error",
  "insufficient_credits",
  "login_required",
  "not_connected",
] as const;

export type CreamStatus = (typeof CREAM_STATUSES)[number];

export type CreamResult<T = unknown> = {
  status: CreamStatus;
  data?: T;
  message?: string;
};

/** STATIC dashboard example. Not a live wallet. Do not deduct, persist, or report as balance. */
export const STATIC_DASHBOARD_CREDIT_EXAMPLE = 2500;

export const STATUS_COPY: Record<
  CreamStatus,
  { kicker: string; title: string; body: string }
> = {
  empty: {
    kicker: "Empty",
    title: "Waiting for input",
    body: "Nothing submitted. No credits moved. No record written.",
  },
  loading: {
    kicker: "Loading",
    title: "Checking the bound adapter",
    body: "UI wait state only. This is not a live production, score, or payment.",
  },
  success: {
    kicker: "Success",
    title: "Bound adapter returned success",
    body: "Show this only when your existing API confirms the write. This pack never fakes it.",
  },
  error: {
    kicker: "Error",
    title: "Bound adapter returned an error",
    body: "Show the server message. Do not invent a score, ticket, or receipt.",
  },
  insufficient_credits: {
    kicker: "Insufficient credits",
    title: "Not enough credits on the existing ledger",
    body: "Read from your credit API. Join stays on the Pro monthly trial. Do not deduct here.",
  },
  login_required: {
    kicker: "Sign in required",
    title: "Existing session missing",
    body: "Send the user to /auth/login. Do not clone that page. Do not create a new auth stack.",
  },
  not_connected: {
    kicker: "Integration not bound",
    title: "Cream shell only",
    body: "Adapter is a typed TODO. Existing API, credits, Whop, production and sitemap stay in your repo.",
  },
};
