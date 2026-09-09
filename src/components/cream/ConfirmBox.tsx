"use client";

import { useState } from "react";
import { creamAdapters } from "../../lib/cream-adapters";
import type { CreamStatus } from "../../lib/cream-status";
import { FormStatusBar } from "./ui-states";

type Kind = "cancel" | "refund";

export default function ConfirmBox({ kind }: { kind: Kind }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [status, setStatus] = useState<CreamStatus>("empty");
  const [message, setMessage] = useState<string>();

  const title = kind === "cancel" ? "Cancel confirmation" : "Refund confirmation";
  const action =
    kind === "cancel" ? "Request cancel review" : "Request refund review";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result =
      kind === "cancel"
        ? await creamAdapters.billing.requestCancelConfirm({ acknowledged })
        : await creamAdapters.billing.requestRefundConfirm({
            acknowledged,
            paymentRef: paymentRef || undefined,
          });
    setStatus(result.status);
    setMessage(result.message);
  }

  return (
    <article className="cl-confirm">
      <p className="cl-kicker">{title}</p>
      <h3>{title}</h3>
      <p className="cl-muted">
        This box is a UI confirmation. It is not a legal record, not a completed
        {kind === "cancel" ? " cancellation" : " refund"}, and not proof that
        Whop or CreLavo filed anything. No backend row is written until you bind
        <code> creamAdapters.billing</code>.
      </p>
      <form className="cl-form" onSubmit={onSubmit}>
        {kind === "refund" ? (
          <label className="cl-field">
            Payment reference (your existing id)
            <input
              name="paymentRef"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Use an id from your ledger — do not invent one"
            />
          </label>
        ) : null}
        <label className="cl-check">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          I understand this checkbox is not a legal filing.
        </label>
        <button className="cl-btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Checking adapter…" : action}
        </button>
      </form>
      <FormStatusBar status={status} />
      {message ? <p className="cl-muted">{message}</p> : null}
    </article>
  );
}
