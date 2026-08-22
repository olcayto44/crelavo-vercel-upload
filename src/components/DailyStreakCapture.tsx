"use client";

import { FormEvent, useState } from "react";

export function DailyStreakCapture() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/conversion/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, consent, action: "homepage_daily_checkin" })
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));

    if (!response?.ok) {
      setStatus("error");
      setMessage(typeof data?.error === "string" ? data.error : "Could not record your streak yet.");
      return;
    }

    setStatus("success");
    setMessage(typeof data?.message === "string" ? data.message : "Your Crelavo streak is recorded for review-safe rewards.");
  }

  return (
    <section className="container section home-section-tight clean-feed-section" aria-labelledby="daily-streak-heading">
      <div className="sample-video-head">
        <div>
          <span className="badge">Daily comeback loop</span>
          <h2 id="daily-streak-heading">Build a safe streak before reward credits unlock</h2>
          <p className="section-lead">Visitors can record daily AI Ad Scorer check-ins. 7-day and 30-day rewards are review records only, so no automatic credits are minted from unverified activity.</p>
        </div>
      </div>
      <form className="card daily-streak-form" onSubmit={onSubmit}>
        <div className="daily-streak-input-row">
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          <button type="submit" className="primary-button" disabled={status === "loading"}>{status === "loading" ? "Recording..." : "Record today’s streak"}</button>
        </div>
        <label className="daily-streak-consent">
          <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>I agree to let Crelavo record my streak and email review-safe reward updates. Rewards require abuse checks and manual review.</span>
        </label>
        {message ? <p className={status === "error" ? "daily-streak-error" : "daily-streak-message"}>{message}</p> : null}
      </form>
    </section>
  );
}
