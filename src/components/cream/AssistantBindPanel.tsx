"use client";

import { useState } from "react";
import { creamAdapters } from "../../lib/cream-adapters";
import type { CreamStatus } from "../../lib/cream-status";
import { FormStatusBar, ShellNotice } from "./ui-states";

type Slot =
  | "sendMessage"
  | "upload"
  | "checkCredits"
  | "startProduction"
  | "listHistory";

export default function AssistantBindPanel() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<CreamStatus>("empty");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [message, setMessage] = useState<string>();

  async function run(next: Slot) {
    setSlot(next);
    setStatus("loading");
    let result;
    if (next === "sendMessage") {
      result = await creamAdapters.assistant.sendMessage({ text });
    } else if (next === "upload") {
      result = await creamAdapters.assistant.upload({
        filename: fileName || "unspecified",
        size: 0,
      });
    } else if (next === "checkCredits") {
      result = await creamAdapters.assistant.checkCredits();
    } else if (next === "startProduction") {
      result = await creamAdapters.assistant.startProduction({ prompt: text });
    } else {
      result = await creamAdapters.assistant.listHistory();
    }
    setStatus(result.status);
    setMessage(result.message);
  }

  return (
    <section className="cl-bind" aria-label="Assistant integration points">
      <p className="cl-kicker">Integration points</p>
      <h2 className="cl-h2">Bind the existing Work Brain. Do not ship a fake assistant.</h2>
      <ShellNotice>
        This panel does not chat. It does not generate replies. It does not
        replace Work Brain. Each control is a typed hook: message, upload,
        credit check, start production, history.
      </ShellNotice>
      <form
        className="cl-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run("sendMessage");
        }}
      >
        <label className="cl-field">
          Message for the bound Work Brain
          <input
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell CreLavo what to sell live…"
            aria-label="Message for the bound Work Brain"
          />
        </label>
        <label className="cl-field">
          Upload (filename only in this pack)
          <input
            name="upload"
            type="file"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
        </label>
        <div className="cl-bind-grid">
          <button className="cl-btn" type="submit">
            Send message hook
          </button>
          <button
            className="cl-btn cl-btn-outline"
            type="button"
            onClick={() => void run("upload")}
          >
            Upload hook
          </button>
          <button
            className="cl-btn cl-btn-outline"
            type="button"
            onClick={() => void run("checkCredits")}
          >
            Credit check hook
          </button>
          <button
            className="cl-btn cl-btn-outline"
            type="button"
            onClick={() => void run("startProduction")}
          >
            Start production hook
          </button>
          <button
            className="cl-btn cl-btn-outline"
            type="button"
            onClick={() => void run("listHistory")}
          >
            History hook
          </button>
        </div>
      </form>
      {slot ? (
        <p className="cl-muted">
          Last hook: <code>{slot}</code>
        </p>
      ) : null}
      <FormStatusBar status={status} />
      {message ? <p className="cl-muted">{message}</p> : null}
    </section>
  );
}
