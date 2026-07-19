"use client";

import { useState } from "react";

type State = "idle" | "loading" | "success" | "error";

const topics = [
  "Production support",
  "Account or credit help",
  "AI + Human QA request",
  "Partnership or launch question",
  "Security or login issue"
];

export function ContactForm() {
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
      topic: String(form.get("topic") ?? "").trim(),
      message: String(form.get("message") ?? "").trim(),
      company: String(form.get("company") ?? "").trim(),
      verification: String(form.get("verification") ?? "").trim(),
      website: String(form.get("website") ?? "").trim()
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Contact request could not be sent.");
      return;
    }

    event.currentTarget.reset();
    setState("success");
    setMessage(data.message ?? "Contact request sent. Crelavo support will review it.");
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="field"><label>Full name</label><input name="full_name" required placeholder="Your full name" /></div>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="you@example.com" /></div>
      <div className="field">
        <label>Topic</label>
        <select name="topic" required defaultValue="">
          <option value="" disabled>Select a support topic</option>
          {topics.map((topic) => <option value={topic} key={topic}>{topic}</option>)}
        </select>
      </div>
      <div className="field"><label>Company or project name</label><input name="company" placeholder="Optional" /></div>
      <div className="field"><label>Message</label><textarea name="message" required minLength={20} rows={6} placeholder="Tell us what you need help with, including production ID if available." /></div>
      <div className="field"><label>Security check: type CRELAVO</label><input name="verification" required placeholder="CRELAVO" /><small>To confirm you are a real person, type the word CRELAVO exactly as shown.</small></div>
      <input aria-hidden="true" autoComplete="off" className="hidden-honeypot" name="website" tabIndex={-1} />
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Sending..." : "Send contact request"}</button>
      {message ? <p className="form-message" style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
