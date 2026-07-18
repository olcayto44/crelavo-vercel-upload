"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

type State = "idle" | "loading" | "success" | "error";

export function ResendConfirmationForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    const { error } = await supabaseBrowser().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl || window.location.origin}/auth/login?confirmed=1` }
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("success");
    setMessage("Confirmation email requested. Check your inbox, spam, and promotions folders. If it does not arrive, confirm that Supabase email confirmation and SMTP settings are enabled.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /><small>Use the same email address you registered with.</small></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Sending..." : "Resend confirmation email"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
