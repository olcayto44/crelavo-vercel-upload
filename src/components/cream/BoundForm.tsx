"use client";

import { useState } from "react";
import type { CreamResult, CreamStatus } from "../../lib/cream-status";
import { FormStatusBar } from "./ui-states";

export default function BoundForm({
  children,
  submitLabel,
  onBind,
}: {
  children: React.ReactNode;
  submitLabel: string;
  onBind: (form: FormData) => Promise<CreamResult>;
}) {
  const [status, setStatus] = useState<CreamStatus>("empty");
  const [message, setMessage] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const result = await onBind(form);
    setStatus(result.status);
    setMessage(result.message);
  }

  return (
    <>
      <form className="cl-form" onSubmit={onSubmit}>
        {children}
        <button className="cl-btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Checking adapter…" : submitLabel}
        </button>
      </form>
      <FormStatusBar status={status} />
      {message ? <p className="cl-muted">{message}</p> : null}
    </>
  );
}
