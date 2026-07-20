"use client";

import Link from "next/link";
import { useState } from "react";
import { isEmailVerified } from "@/lib/auth-guards";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

type State = "idle" | "loading" | "success" | "error";

export function LoginForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function continueWithProvider(provider: "google" | "github" | "azure") {
    setState("loading");
    setMessage("");

    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl || window.location.origin}/dashboard/assistant-workspace?welcome=google_trial_credit` }
    });

    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setState("error");
      setMessage("Supabase configuration is missing. Add the URL and anon key to .env.local.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const verification = String(form.get("verification") ?? "").trim().toUpperCase();

    if (verification !== "CRELAVO") {
      setState("error");
      setMessage("Security check failed. Type CRELAVO exactly.");
      return;
    }

    const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email, password });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    if (!isEmailVerified(data.user)) {
      await supabaseBrowser().auth.signOut();
      setState("error");
      setMessage("Sign-in cannot be completed before email confirmation. Open the confirmation link sent to your email.");
      return;
    }

    await fetch("/api/auth/login-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.user.email, fullName: data.user.user_metadata?.full_name })
    }).catch(() => null);

    setState("success");
    setMessage("Sign-in successful. A sign-in notice may be sent to your email. Redirecting to the home page...");
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="card" style={{ marginBottom: 14, background: "rgba(34,211,238,.08)" }}>
        <span className="badge">Google one-click entry</span>
        <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Continue with Google to enter Assistant Workspace quickly. New eligible users receive 1,000 one-time Assistant trial credits for planning/chat only, not production rendering.</p>
      </div>
      <div className="auth-provider-grid">
        <button className="btn auth-google-btn" type="button" onClick={() => continueWithProvider("google")} disabled={state === "loading"}>Continue with Google</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("github")} disabled={state === "loading"}>Continue with GitHub</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("azure")} disabled={state === "loading"}>Continue with Microsoft</button>
      </div>
      <div className="auth-divider"><span>or sign in with email</span></div>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
      <div className="field"><label>Password</label><input name="password" type="password" required placeholder="Password" /></div>
      <div className="field"><label>Security check: type CRELAVO</label><input name="verification" required placeholder="CRELAVO" /><small>To confirm you are a real person, type the word CRELAVO exactly as shown.</small></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Signing in..." : "Sign in"}</button>
      <p style={{ color: "var(--muted)", margin: "8px 0 0" }}><Link href="/auth/forgot-password">Forgot password</Link></p>
      <p style={{ color: "var(--muted)", margin: "0" }}><Link href="/auth/resend-confirmation">Resend confirmation email</Link></p>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
