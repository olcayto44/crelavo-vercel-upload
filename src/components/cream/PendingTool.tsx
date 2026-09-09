"use client";

import { useState } from "react";
import Link from "next/link";
import CreamShell from "./CreamShell";
import { creamAdapters } from "../../lib/cream-adapters";
import { PRO_MONTHLY_CHECKOUT } from "../../lib/ids";
import type { CreamStatus } from "../../lib/cream-status";
import { FormStatusBar, ShellNotice, StatusBanner } from "./ui-states";

export function PendingToolView({
  path,
  kicker,
  title,
  lead,
  creditFloor,
}: {
  path: string;
  kicker: string;
  title: string;
  lead: string;
  creditFloor?: string;
}) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<CreamStatus>("empty");
  const [message, setMessage] = useState<string>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await creamAdapters.tools.launch({ path, note: note || undefined });
    setStatus(result.status);
    setMessage(result.message);
  }

  return (
    <CreamShell>
      <div className="cl-page-white">
        <div className="cl-wrap">
          <p className="cl-kicker">{kicker}</p>
          <h1 className="cl-display" style={{ fontSize: "clamp(40px, 5vw, 56px)" }}>
            {title}
          </h1>
          <p className="cl-lead">{lead}</p>
          {creditFloor ? (
            <p className="cl-muted" style={{ marginBottom: 20 }}>
              Credit floor (plan copy, not a live deduct): {creditFloor}
            </p>
          ) : null}
          <StatusBanner status="not_connected" />
          <ShellNotice>
            Cream UI shell. Integration waiting. This page does not run the
            tool, score ads, generate video, or move credits.
          </ShellNotice>
          <form className="cl-form" onSubmit={onSubmit}>
            <label className="cl-field">
              Bind note for your existing handler
              <textarea
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Map this screen to your current module. Do not invent an endpoint."
              />
            </label>
            <div className="cl-actions">
              <button className="cl-btn" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Checking adapter…" : "Check adapter"}
              </button>
              <a className="cl-btn cl-btn-ghost" href={PRO_MONTHLY_CHECKOUT}>
                Start 24-hour trial
              </a>
              <Link className="cl-btn cl-btn-outline" href="/tools">
                Back to tools
              </Link>
            </div>
          </form>
          <FormStatusBar status={status} />
          {message ? <p className="cl-muted">{message}</p> : null}
        </div>
      </div>
    </CreamShell>
  );
}
