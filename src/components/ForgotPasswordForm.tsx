"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

type State = "idle" | "loading" | "success" | "error";

export function ForgotPasswordForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl || window.location.origin}/auth/reset-password`
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("success");
    setMessage("Password reset link sent to your email. Open the link to create a new password.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Sending..." : "Send password reset email"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
