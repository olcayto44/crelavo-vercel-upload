"use client";

import { useState } from "react";

const channelTypes = ["TikTok", "YouTube / Shorts", "X / LinkedIn", "Blog / newsletter", "Agency", "Community", "Other"];
const audiences = ["AI tools", "No-code", "SaaS founders", "Ecommerce", "Creators", "Agencies", "Small business", "Other"];

type State = "idle" | "loading" | "success" | "error";

export function PartnerApplicationForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("full_name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      channelType: String(form.get("channel_type") ?? "").trim(),
      channelUrl: String(form.get("channel_url") ?? "").trim(),
      audienceSize: String(form.get("audience_size") ?? "").trim(),
      mainAudience: String(form.get("main_audience") ?? "").trim(),
      promotionIdea: String(form.get("promotion_idea") ?? "").trim(),
      verification: String(form.get("verification") ?? "").trim(),
      website: String(form.get("website") ?? "").trim()
    };

    const response = await fetch("/api/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Partner application could not be submitted.");
      return;
    }

    event.currentTarget.reset();
    setState("success");
    setMessage(data.message ?? "Partner application received. We will review it before the program opens.");
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="brief-two-col">
        <div className="field"><label>Full name</label><input name="full_name" required placeholder="Your name" /></div>
        <div className="field"><label>Email</label><input name="email" type="email" required placeholder="creator@example.com" /></div>
      </div>
      <div className="brief-two-col">
        <div className="field">
          <label>Channel type</label>
          <select name="channel_type" required defaultValue="">
            <option value="" disabled>Select channel</option>
            {channelTypes.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
        <div className="field"><label>Channel URL</label><input name="channel_url" required placeholder="https://..." /></div>
      </div>
      <div className="brief-two-col">
        <div className="field"><label>Audience size</label><input name="audience_size" placeholder="Example: 12k followers" /></div>
        <div className="field">
          <label>Main audience</label>
          <select name="main_audience" required defaultValue="">
            <option value="" disabled>Select audience</option>
            {audiences.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>How would you promote Crelavo?</label><textarea name="promotion_idea" required minLength={20} rows={5} placeholder="Tell us your content angle, audience and how you would explain Crelavo." /></div>
      <p className="workspace-action-note warning">After review, Crelavo will email you an approval or rejection decision. If approved, payout bank details are added inside your partner dashboard before your first Monday payout. If you later need to change IBAN or bank details, you must email Crelavo finance so the update can be verified before payout.</p>
      <div className="field"><label>Security check: type CRELAVO</label><input name="verification" required placeholder="CRELAVO" /><small>To confirm you are a real person, type CRELAVO exactly.</small></div>
      <input aria-hidden="true" autoComplete="off" className="hidden-honeypot" name="website" tabIndex={-1} />
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Submitting..." : "Apply for early partner access"}</button>
      {message ? <p className="form-message" style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
