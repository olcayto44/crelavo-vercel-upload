"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
type State = "idle" | "loading" | "success" | "error";

export function RegisterForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function continueWithProvider(provider: "google" | "facebook" | "apple") {
    setState("loading"); setMessage("");
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider, options: { redirectTo: `${siteUrl || window.location.origin}/dashboard/assistant-workspace` } });
    if (error) { setState("error"); setMessage(error.message); }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (!email) { setState("error"); setMessage("Enter your email address."); return; }
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${siteUrl || window.location.origin}/auth/login?confirmed=1` } });
    if (error) { setState("error"); setMessage(error.message); return; }
    setState("success"); setMessage("Check your email. The secure link will create your account or sign you in automatically.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="auth-provider-grid">
        <button className="btn auth-google-btn" type="button" onClick={() => continueWithProvider("google")} disabled={state === "loading"}>Continue with Google</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("facebook")} disabled={state === "loading"}>Continue with Facebook</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("apple")} disabled={state === "loading"}>Continue with Apple</button>
      </div>
      <div className="auth-divider"><span>or create with email</span></div>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Sending link..." : "Create account with email"}</button>
      <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>No password required. This email link also signs in existing members.</p>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}